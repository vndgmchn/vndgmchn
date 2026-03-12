import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SCRYDEX_API_URL = "https://api.scrydex.com";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VARIANT_PREFERENCES = ['normal', 'holofoil', 'reverseHolofoil', 'firstEdition'];

function parseMarketPrice(item: any) {
    let market_price = 0;
    let currency = 'USD';
    
    if (item.variants && Array.isArray(item.variants)) {
        let selectedVariant = null;
        
        for (const pref of VARIANT_PREFERENCES) {
            const found = item.variants.find((v: any) => v.name === pref && v.prices && v.prices.length > 0);
            if (found) {
                selectedVariant = found;
                break;
            }
        }
        
        if (!selectedVariant) {
            selectedVariant = item.variants.find((v: any) => v.prices && v.prices.length > 0);
        }
        
        if (selectedVariant && selectedVariant.prices) {
            let targetPriceRec = null;
            
            targetPriceRec = selectedVariant.prices.find((p: any) => 
                 p.type === 'raw' && (p.condition === 'NM' || p.condition === 'Near Mint')
            );
            
            if (!targetPriceRec) {
                 targetPriceRec = selectedVariant.prices.find((p: any) => p.type === 'raw');
            }
            
            if (!targetPriceRec) {
                 targetPriceRec = selectedVariant.prices[0];
            }
            
            if (targetPriceRec) {
                 market_price = parseFloat(targetPriceRec.market || targetPriceRec.price || 0);
                 currency = targetPriceRec.currency || 'USD';
            }
        }
    } else if (item.market_price) {
        market_price = parseFloat(item.market_price) || 0;
    }

    return { market_price, currency };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { productIds, force } = await req.json();

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return new Response(JSON.stringify({ error: "Missing productIds array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Cap at 100
    const limitedIds = productIds.slice(0, 100);

    const scrydexKey = Deno.env.get('SCRYDEX_API_KEY');
    const scrydexTeamId = Deno.env.get('SCRYDEX_TEAM_ID');
    if (!scrydexKey || !scrydexTeamId) {
      throw new Error("Missing Scrydex API Key config");
    }

    // Optional Anon Client (currently unused but provided per V1 spec)
    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    
    // We strictly need admin to query and upsert catalog prices securely
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1) Fetch products to know language code for stale thresholding
    const { data: catalogProducts, error: dbError } = await supabaseAdmin
        .from('catalog_products')
        .select(`id, game, name, set_name, set_code, collector_number, set_total, language_code, kind, external_id`)
        .in('id', limitedIds);

    if (dbError) throw dbError;

    // 2) Fetch current prices for these ids
    const { data: currentPrices, error: pricesError } = await supabaseAdmin
        .from('catalog_prices_current')
        .select('product_id, market_price, last_updated')
        .in('product_id', limitedIds);

    if (pricesError) throw pricesError;

    // 3) Determine stale IDs
    const nowMS = Date.now();
    const staleIds: string[] = [];
    const validCache: any[] = [];

    for (const pid of limitedIds) {
        const cached = currentPrices?.find((p: any) => p.product_id === pid);
        const prod = catalogProducts?.find((p: any) => p.id === pid);
        
        const thresholdHours = (prod?.language_code === 'EN') ? 2 : 12;
        const thresholdMS = thresholdHours * 60 * 60 * 1000;

        if (force || !cached || !cached.last_updated || (nowMS - new Date(cached.last_updated).getTime() > thresholdMS)) {
            staleIds.push(pid);
        } else {
            validCache.push(cached);
        }
    }

    console.log(`Refreshing ${staleIds.length} stale ids. (Force: ${!!force}) Cache hits: ${validCache.length}`);

    const pricesToUpsert: any[] = [];
    const urlsToUpdate: { id: string, tcgplayer_url: string }[] = [];
    const nowISO = new Date().toISOString();

    if (staleIds.length > 0) {

        // Group the stale items
        const staleEnIds: string[] = [];
        const staleOtherIds: string[] = [];

        for (const prod of (catalogProducts || [])) {
            if (prod.language_code === 'EN') {
                staleEnIds.push(prod.id);
            } else {
                staleOtherIds.push(prod.id);
            }
        }

        const unmatchedEnIds = new Set(staleEnIds);
        const pricedByTcgcsv = new Set<string>();
        let tcgcsvCount = 0;
        let scrydexCount = 0;

        // --- TCGCSV ATTEMPT FOR EN PRODUCTS ---
        if (staleEnIds.length > 0) {
            // Map items by category
            const categoryItems = new Map<number, any[]>();
            
            for (const pid of staleEnIds) {
                const prod = catalogProducts?.find(p => p.id === pid);
                if (!prod) continue;
                
                const catId = prod.game === 'POKEMON' ? 3 : (prod.game === 'ONE_PIECE' ? 68 : null);
                if (!catId) continue;
                
                if (!categoryItems.has(catId)) categoryItems.set(catId, []);
                categoryItems.get(catId)!.push(prod);
            }

            for (const [catId, items] of categoryItems.entries()) {
                try {
                    // Fetch Groups
                    const groupsRes = await fetch(`https://tcgcsv.com/tcgplayer/${catId}/groups`);
                    if (!groupsRes.ok) continue;
                    const groupsData = await groupsRes.json();
                    const groups = groupsData.results || [];


                    const normalizeGroupName = (s: string) => {
                        if (!s) return '';
                        return s.toLowerCase()
                            .replace(/[^a-z0-9]+/g, ' ')
                            .replace(/\b(?:base|set|series|expansion|pokemon|tcg|and)\b/g, '')
                            .replace(/\s+/g, ' ')
                            .trim();
                    };

                    // Group items by our resolved groupId
                    const groupItemMap = new Map<number, any[]>();
                    
                    for (const prod of items) {
                        let bestScore = 0;
                        let bestTieBreaker = 0;
                        let bestGroup = null;
                        
                        const prodNorm = prod.set_name ? normalizeGroupName(prod.set_name) : '';

                        const isDebugGroup = false;

                        for (const g of groups) {
                            let score = 0;
                            let tieBreaker = 0;
                            let matchReason = '';
                            
                            const splitName = g.name.split(':');
                            const suffix = splitName.length > 1 ? splitName[1].trim() : g.name;
                            
                            const groupNormSuffix = normalizeGroupName(suffix);
                            const groupNormFull = normalizeGroupName(g.name);
                            
                            if (prodNorm) {
                                if (groupNormFull === prodNorm && groupNormFull !== '') {
                                    tieBreaker = 2;
                                } else if (groupNormSuffix === prodNorm && groupNormSuffix !== '') {
                                    tieBreaker = 1;
                                }
                            }
                            
                            if (prod.set_code && g.abbreviation && g.abbreviation.toLowerCase() === prod.set_code.toLowerCase()) {
                                score = 100;
                                matchReason = 'exact abbreviation';
                            } else if (prodNorm) {
                                if (groupNormSuffix === prodNorm && groupNormSuffix !== '') {
                                    score = 80;
                                    matchReason = 'exact suffix';
                                } else if (groupNormFull === prodNorm && groupNormFull !== '') {
                                    score = 60;
                                    matchReason = 'exact full';
                                } else if (
                                    (groupNormSuffix && (prodNorm.includes(groupNormSuffix) || groupNormSuffix.includes(prodNorm))) ||
                                    (groupNormFull && (prodNorm.includes(groupNormFull) || groupNormFull.includes(prodNorm)))
                                ) {
                                    score = 40;
                                    matchReason = 'partial inclusion';
                                }
                            }
                            

                            if (score >= 40) {
                                if (score > bestScore || (score === bestScore && tieBreaker > bestTieBreaker)) {
                                    bestScore = score;
                                    bestTieBreaker = tieBreaker;
                                    bestGroup = g;
                                }
                            }
                        }

                        let matchedGroup = bestGroup;


                        if (matchedGroup) {
                            if (!groupItemMap.has(matchedGroup.groupId)) groupItemMap.set(matchedGroup.groupId, []);
                            groupItemMap.get(matchedGroup.groupId)!.push(prod);
                        }
                    }

                    // Process each matched group
                    for (const [groupId, groupProds] of groupItemMap.entries()) {
                        const [prodRes, priceRes] = await Promise.all([
                            fetch(`https://tcgcsv.com/tcgplayer/${catId}/${groupId}/products`),
                            fetch(`https://tcgcsv.com/tcgplayer/${catId}/${groupId}/prices`)
                        ]);

                        if (!prodRes.ok || !priceRes.ok) continue;

                        const [tcgProds, tcgPrices] = await Promise.all([
                            prodRes.json(),
                            priceRes.json()
                        ]);

                        const priceLookup = new Map<number, any[]>();
                        for (const p of (tcgPrices.results || [])) {
                             if (!priceLookup.has(p.productId)) priceLookup.set(p.productId, []);
                             priceLookup.get(p.productId)!.push(p);
                        }


                        for (const prod of groupProds) {
                            let matchedTcgProd = null;

                            if (prod.kind === 'CARD') {
                                // Match by collector number
                                const colRaw = prod.collector_number ? String(prod.collector_number).trim() : null;
                                let colNorm = colRaw ? colRaw.replace(/^0+/, '') : null;
                                if (colNorm === '') colNorm = '0';

                                matchedTcgProd = (tcgProds.results || []).find((tp: any) => {
                                    const numField = (tp.extendedData || []).find((ed: any) => ed.name === 'Number');
                                    if (!numField?.value || !colNorm) return false;
                                    
                                    let raw = String(numField.value).trim();
                                    
                                    let leftNorm = '';
                                    if (raw.includes('/')) {
                                        let left = raw.split('/')[0];
                                        leftNorm = left.replace(/^0+/, '');
                                    } else {
                                        leftNorm = raw.replace(/^0+/, '');
                                    }
                                    if (leftNorm === '') leftNorm = '0';

                                    return leftNorm === colNorm;
                                });


                                // Fallback: Match by normalized name
                                if (!matchedTcgProd) {
                                    const normName = prod.name.replace(/\s+/g, '').toLowerCase();
                                    matchedTcgProd = (tcgProds.results || []).find((tp: any) => 
                                        tp.name.replace(/\s+/g, '').toLowerCase() === normName
                                    );
                                }

                            } else {
                                // SEALED matching by name
                                const normName = normalizeGroupName(prod.name);
                                matchedTcgProd = (tcgProds.results || []).find((tp: any) => 
                                    normalizeGroupName(tp.name || tp.cleanName || '') === normName
                                );

                                if (!matchedTcgProd) {
                                    matchedTcgProd = (tcgProds.results || []).find((tp: any) => {
                                        const cname = (tp.name || '').toLowerCase();
                                        const cclean = (tp.cleanName || '').toLowerCase();
                                        if (cname.startsWith('code card') || cclean.startsWith('code card')) return false;
                                        
                                        const tcgNorm = normalizeGroupName(tp.name || tp.cleanName || '');
                                        return tcgNorm.startsWith(normName);
                                    });
                                }

                            }

                            if (matchedTcgProd) {
                                if (matchedTcgProd.url) {
                                    urlsToUpdate.push({
                                        id: prod.id,
                                        tcgplayer_url: matchedTcgProd.url
                                    });
                                }

                                const matchingPrices = priceLookup.get(matchedTcgProd.productId) || [];
                                
                                let targetPriceRow = matchingPrices.find(p => p.subTypeName === 'Normal' && p.marketPrice !== null);
                                if (!targetPriceRow) {
                                    targetPriceRow = matchingPrices.find(p => p.marketPrice !== null);
                                }

                                if (targetPriceRow && targetPriceRow.marketPrice !== null && targetPriceRow.marketPrice !== undefined) {
                                    pricedByTcgcsv.add(prod.id);
                                    pricesToUpsert.push({
                                        product_id: prod.id,
                                        market_price: targetPriceRow.marketPrice,
                                        currency: 'USD',
                                        last_updated: nowISO,
                                        source: 'TCGCSV'
                                    });
                                    unmatchedEnIds.delete(prod.id);
                                    tcgcsvCount++;
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.error(`TCGCSV fetch failed for category ${catId}:`, err);
                }
            }
        }

        // --- SCRYDEX FALLBACK ---
        const scrydexIdsToFetch = [...staleOtherIds, ...Array.from(unmatchedEnIds)].filter(id => !pricedByTcgcsv.has(id));
        
        if (scrydexIdsToFetch.length > 0) {
             const scrydexProds = catalogProducts?.filter(p => scrydexIdsToFetch.includes(p.id)) || [];

             const fetchPromises = scrydexProds.map(async (prod: any) => {
                if (pricedByTcgcsv.has(prod.id)) return;
                try {
                    let endpoint = '';
                    if (prod.game === 'POKEMON') {
                        endpoint = prod.kind === 'SEALED' ? 'pokemon/v1/sealed' : 'pokemon/v1/cards';
                    } else if (prod.game === 'ONE_PIECE') {
                        endpoint = prod.kind === 'SEALED' ? 'onepiece/v1/sealed' : 'onepiece/v1/cards';
                    } else {
                        endpoint = 'pokemon/v1/cards'; // ultimate fallback
                    }
                    
                    const url = `${SCRYDEX_API_URL}/${endpoint}/${prod.external_id}?include=prices`;
                    
                    const res = await fetch(url, {
                        headers: {
                            'X-Api-Key': scrydexKey,
                            'X-Team-ID': scrydexTeamId,
                            'Content-Type': 'application/json'
                        }
                    });
    
                    if (res.ok) {
                        const data = await res.json();
                        const item = data.data || data;
                        const { market_price, currency } = parseMarketPrice(item);
    
                        pricesToUpsert.push({
                            product_id: prod.id,
                            market_price,
                            currency,
                            last_updated: nowISO,
                            source: 'SCRYDEX'
                        });
                        scrydexCount++;
                    }
                } catch (e) {
                    console.error(`Failed to refresh product ${prod.external_id} via Scrydex:`, e);
                }
            });
    
            await Promise.all(fetchPromises);
        }

        const unpricedCount = staleIds.length - (tcgcsvCount + scrydexCount);
        console.log(`Refresh Results | TCGCSV priced: ${tcgcsvCount} | Scrydex fallback priced: ${scrydexCount} | Unpriced: ${unpricedCount}`);

        if (pricesToUpsert.length > 0) {
            await supabaseAdmin.from('catalog_prices_current').upsert(pricesToUpsert, { onConflict: 'product_id' });
            await supabaseAdmin.from('catalog_price_snapshots').insert(
                pricesToUpsert.map(p => ({ product_id: p.product_id, market_price: p.market_price }))
            );
        }

        if (urlsToUpdate.length > 0) {
            const updatePromises = urlsToUpdate.map(async (row) => {
                await supabaseAdmin
                    .from('catalog_products')
                    .update({ tcgplayer_url: row.tcgplayer_url })
                    .eq('id', row.id);
            });
            
            await Promise.all(updatePromises);
        }
    }

    // Combine valid cache + newly refreshed prices
    const returnedData = [...validCache];
    for (const p of pricesToUpsert) {
        returnedData.push({
            product_id: p.product_id,
            market_price: p.market_price,
            last_updated: p.last_updated
        });
    }

    return new Response(JSON.stringify({ data: returnedData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Refresh Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

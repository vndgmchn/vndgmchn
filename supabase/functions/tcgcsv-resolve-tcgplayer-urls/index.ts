import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { productIds } = await req.json();

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0 || productIds.length > 50) {
      return new Response(JSON.stringify({ error: "Missing or invalid productIds array (max 50)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: catalogProducts, error: dbError } = await supabaseAdmin
        .from('catalog_products')
        .select(`id, game, kind, language_code, name, set_name, set_code, collector_number, set_total`)
        .in('id', productIds);

    if (dbError) throw dbError;

    const results: any[] = [];
    const enProducts: any[] = [];
    
    for (const prod of (catalogProducts || [])) {
        if (prod.language_code === 'EN') {
            enProducts.push(prod);
        } else {
            // Non-EN: return url = null
            results.push({
                product_id: prod.id,
                tcgplayer_product_id: null,
                url: null
            });
        }
    }

    let resolvedCount = 0;

    if (enProducts.length > 0) {
        const categoryItems = new Map<number, any[]>();
        
        for (const prod of enProducts) {
            const catId = prod.game === 'POKEMON' ? 3 : (prod.game === 'ONE_PIECE' ? 68 : null);
            if (!catId) {
                results.push({ product_id: prod.id, tcgplayer_product_id: null, url: null });
                continue;
            }
            
            if (!categoryItems.has(catId)) categoryItems.set(catId, []);
            categoryItems.get(catId)!.push(prod);
        }

        for (const [catId, items] of categoryItems.entries()) {
            try {
                const groupsRes = await fetch(`https://tcgcsv.com/tcgplayer/${catId}/groups`);
                if (!groupsRes.ok) continue;
                const groupsData = await groupsRes.json();
                const groups = groupsData.results || [];

                const groupItemMap = new Map<number, any[]>();
                
                for (const prod of items) {
                    let matchedGroup = null;

                    if (prod.set_code) {
                        matchedGroup = groups.find((g: any) => g.abbreviation && g.abbreviation.toLowerCase() === prod.set_code.toLowerCase());
                    }

                    if (!matchedGroup && prod.set_name) {
                        matchedGroup = groups.find((g: any) => {
                            const splitName = g.name.split(':');
                            const suffix = splitName.length > 1 ? splitName[1].trim() : g.name;
                            return suffix.toLowerCase() === prod.set_name.toLowerCase();
                        });
                    }
                    
                    if (!matchedGroup && prod.set_name) {
                         matchedGroup = groups.find((g: any) => g.name.toLowerCase() === prod.set_name.toLowerCase());
                    }

                    if (matchedGroup) {
                        if (!groupItemMap.has(matchedGroup.groupId)) groupItemMap.set(matchedGroup.groupId, []);
                        groupItemMap.get(matchedGroup.groupId)!.push(prod);
                    } else {
                        // Unmatched group
                        results.push({ product_id: prod.id, tcgplayer_product_id: null, url: null });
                    }
                }

                for (const [groupId, groupProds] of groupItemMap.entries()) {
                    const prodRes = await fetch(`https://tcgcsv.com/tcgplayer/${catId}/${groupId}/products`);
                    if (!prodRes.ok) continue;

                    const tcgProds = await prodRes.json();

                    for (const prod of groupProds) {
                        let matchedTcgProd = null;

                        if (prod.kind === 'CARD') {
                            const col = prod.collector_number ? String(prod.collector_number).trim() : null;

                            matchedTcgProd = (tcgProds.results || []).find((tp: any) => {
                                const numField = (tp.extendedData || []).find((ed: any) => ed.name === 'Number');
                                if (!numField || !numField.value || !col) return false;
                                return numField.value === col || numField.value.startsWith(`${col}/`);
                            });

                            if (!matchedTcgProd) {
                                const normName = prod.name.replace(/\s+/g, '').toLowerCase();
                                matchedTcgProd = (tcgProds.results || []).find((tp: any) => 
                                    tp.name.replace(/\s+/g, '').toLowerCase() === normName
                                );
                            }
                        } else {
                            const normName = prod.name.replace(/\s+/g, '').toLowerCase();
                            matchedTcgProd = (tcgProds.results || []).find((tp: any) => 
                                tp.name.replace(/\s+/g, '').toLowerCase() === normName
                            );
                        }

                        if (matchedTcgProd && matchedTcgProd.url) {
                            results.push({
                                product_id: prod.id,
                                tcgplayer_product_id: matchedTcgProd.productId,
                                url: matchedTcgProd.url
                            });
                            resolvedCount++;
                        } else {
                            results.push({ product_id: prod.id, tcgplayer_product_id: null, url: null });
                        }
                    }
                }
            } catch (err) {
                console.error(`TCGCSV product fetch failed for category ${catId}:`, err);
                for (const prod of items) {
                    // Make sure we output nulls if the entire category fetch corrupted
                    if (!results.find(r => r.product_id === prod.id)) {
                        results.push({ product_id: prod.id, tcgplayer_product_id: null, url: null });
                    }
                }
            }
        }
    }

    console.log(`Resolver Results | resolved ${resolvedCount} / total ${catalogProducts?.length || 0}`);

    return new Response(JSON.stringify({ data: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Resolve Match Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

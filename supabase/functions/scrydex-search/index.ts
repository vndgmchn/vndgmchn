import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const JPY_TO_USD = Number(Deno.env.get("JPY_TO_USD_RATE") ?? "0.00637");

function rarityTier(rarity: string | null): number {
    if (!rarity) return 99;
    const r = rarity.toLowerCase();
    
    // Tier 1
    if (["manga", "secret", "special", "sir", "sar", "alt", "alternate", "illustration", "hyper", "gold", "crown", "shiny", "希少", "シークレット", "スペシャル"].some(t => r.includes(t))) return 1;
    // Tier 2
    if (["ultra", "full art", "vstar", "vmax", "ex", "gx", "v"].some(t => r.includes(t))) return 2;
    // Tier 3
    if (["holo", "holofoil", "rare holo", "leader", "super rare"].some(t => r.includes(t))) return 3;
    // Tier 4 (must not be super rare or rare holo which are caught above)
    if (r.includes("rare")) return 4;
    // Tier 5
    if (r.includes("uncommon")) return 5;
    // Tier 6
    if (r.includes("common") || r.includes("通常")) return 6;
    
    return 99;
}

function priceUsd(market_price: number | null | undefined, currency: string | null | undefined): number {
    if (typeof market_price !== 'number' || market_price === null) return 0;
    return currency === 'JPY' ? market_price * JPY_TO_USD : market_price;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log("[scrydex-search] Universal Search");

  try {
    let body;
    try {
        body = await req.json();
    } catch (e) {
        body = {};
    }
    const { query, limit = 20 } = body;
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return new Response(JSON.stringify({ error: "Missing query parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: "Unauthorized: Missing Bearer token" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    const authClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
            global: {
                headers: {
                    Authorization: authHeader,
                },
            },
        }
    );

    const { data: authData, error: authError } = await authClient.auth.getUser();
    if (authError || !authData?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized: Invalid token" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Parsing the query
    let remainingQuery = query.toLowerCase();
    
    let filterLanguage: string | null = null;
    let filterKind: string | null = null;
    let filterGame: string | null = null;
    let filterCollectorNumber: string | null = null;
    let filterDenom: number | null = null;
    let filterSetCodes: string[] = [];

    // Language tokens
    const langTokens = [
      { regex: /\b(japanese|jpn|ja|jp)\b/g, code: 'JA' },
      { regex: /\b(english|en)\b/g, code: 'EN' }
    ];
    for (const lt of langTokens) {
      if (lt.regex.test(remainingQuery)) {
        filterLanguage = lt.code;
        remainingQuery = remainingQuery.replace(lt.regex, ' ');
        break; // Stop after first language found to avoid conflicts
      }
    }

    // Kind tokens
    if (/\b(sealed)\b/g.test(remainingQuery)) {
      filterKind = 'SEALED';
      remainingQuery = remainingQuery.replace(/\b(sealed)\b/g, ' ');
    } else if (/\b(cards|card)\b/g.test(remainingQuery)) {
      filterKind = 'CARD';
      remainingQuery = remainingQuery.replace(/\b(cards|card)\b/g, ' ');
    } else if (/\b(booster)\b/g.test(remainingQuery)) {
      filterKind = 'SEALED';
    }

    // Game tokens
    if (/\b(pokemon)\b/g.test(remainingQuery)) {
      filterGame = 'POKEMON';
      remainingQuery = remainingQuery.replace(/\b(pokemon)\b/g, ' ');
    } else if (/\b(one\s*piece|onepiece)\b/g.test(remainingQuery)) {
      filterGame = 'ONE_PIECE';
      remainingQuery = remainingQuery.replace(/\b(one\s*piece|onepiece)\b/g, ' ');
    }

    // Set number pattern (e.g., 394/295)
    remainingQuery = remainingQuery.replace(/\b(\d+)\s*\/\s*(\d+)\b/g, (_, col, tot) => {
        filterCollectorNumber = col;
        filterDenom = parseInt(tot, 10);
        return ' ';
    });

    // Set code tokens: alphanumeric (letters + numbers), length 3-8
    const setCodeRegex = /\b(?=[a-z0-9]*[0-9])(?=[a-z0-9]*[a-z])[a-z0-9]{3,8}\b/g;
    const codes = remainingQuery.match(setCodeRegex);
    if (codes) {
        filterSetCodes = codes.map((c) => c.toUpperCase());
        remainingQuery = remainingQuery.replace(setCodeRegex, ' ');
    }

    const cleanTerms = remainingQuery.split(/\s+/).filter(t => t.length > 0);
    const searchStr = cleanTerms.join(' ');

    // 2. Build Supabase Query
    let dbQuery = supabaseClient
        .from('catalog_products')
        .select(`
            id, external_id, game, kind, language_code,
            name, name_en, set_name, set_name_en, rarity, search_name_en, search_set_en,
            collector_number, set_code, set_total, set_printed_total,
            image_url, tcgplayer_url,
            catalog_prices_current ( market_price, currency, source, last_updated )
        `);
        
    if (filterLanguage) dbQuery = dbQuery.eq('language_code', filterLanguage);
    if (filterKind) dbQuery = dbQuery.eq('kind', filterKind);
    if (filterGame) dbQuery = dbQuery.eq('game', filterGame);
    if (filterCollectorNumber) dbQuery = dbQuery.eq('collector_number', filterCollectorNumber);

    const orClauses: string[] = [];
    if (cleanTerms.length > 0) {
        for (const term of cleanTerms) {
            const t = `%${term}%`;
            orClauses.push(`name.ilike.${t},name_en.ilike.${t},set_name.ilike.${t},set_name_en.ilike.${t},search_name_en.ilike.${t},search_set_en.ilike.${t},external_id.ilike.${t},collector_number.ilike.${t},set_code.ilike.${t}`);
        }
    }
    for (const c of filterSetCodes) {
        orClauses.push(`set_code.ilike.%${c}%,external_id.ilike.%${c}%`);
    }

    if (orClauses.length > 0) {
        dbQuery = dbQuery.or(orClauses.join(','));
    }

    dbQuery = dbQuery.limit(300);

    const { data: candidates, error: searchError } = await dbQuery;

    if (searchError) {
        throw searchError;
    }

    let results = candidates || [];

    // 3. Final Form & Filtering (JS)
    const stopTermsForSealed = new Set(['booster']);
    let jsFilterTerms = cleanTerms;

    if (filterKind === 'SEALED' || /\b(booster)\b/i.test(query)) {
        jsFilterTerms = cleanTerms.filter(t => !stopTermsForSealed.has(t));
    }

    if (jsFilterTerms.length > 0) {
        results = results.filter((p: any) => {
            const searchableText = [
                p.name, p.name_en, p.set_name, p.set_name_en,
                p.external_id, p.set_code, p.collector_number,
                p.search_name_en, p.search_set_en
            ].filter(Boolean).join(' ').toLowerCase();

            return jsFilterTerms.every(term => searchableText.includes(term));
        });
    }

    if (filterDenom !== null) {
        results = results.filter((p: any) => (p.set_printed_total === filterDenom) || (p.set_total === filterDenom));
    }

    if (filterSetCodes.length > 0) {
        results = results.filter((p: any) => {
            const pExtId = (p.external_id || '').toLowerCase();
            const pSetCode = (p.set_code || '').toLowerCase();
            return filterSetCodes.some(c => {
                const lowerC = c.toLowerCase();
                return pExtId.includes(lowerC) || pSetCode.includes(lowerC);
            });
        });
    }

    // Note: rankItem is still kept around to use if needed but our new sort relies on explicit comparator logic
    // 4. Ranking (Collectr Style)
    results.sort((a, b) => {
        const aExtId = (a.external_id || '').toLowerCase();
        const aSetCode = (a.set_code || '').toLowerCase();
        const bExtId = (b.external_id || '').toLowerCase();
        const bSetCode = (b.set_code || '').toLowerCase();

        // Exact Match Flags:
        // isExactExtId (match ANY clean_terms OR filterSetCodes)
        const isAExactExt = cleanTerms.some(t => aExtId === t) || filterSetCodes.some(c => aExtId === c.toLowerCase());
        const isBExactExt = cleanTerms.some(t => bExtId === t) || filterSetCodes.some(c => bExtId === c.toLowerCase());
        
        // isExactSetCode (match ANY filterSetCodes)
        const isAExactSetCode = filterSetCodes.some(c => aSetCode === c.toLowerCase());
        const isBExactSetCode = filterSetCodes.some(c => bSetCode === c.toLowerCase());

        // isExactCollectorNumber
        const isAExactCol = filterCollectorNumber && a.collector_number === filterCollectorNumber;
        const isBExactCol = filterCollectorNumber && b.collector_number === filterCollectorNumber;

        // a) Exact external_id match
        if (isAExactExt && !isBExactExt) return -1;
        if (!isAExactExt && isBExactExt) return 1;

        // b) Exact set_code match
        if (isAExactSetCode && !isBExactSetCode) return -1;
        if (!isAExactSetCode && isBExactSetCode) return 1;

        // c) Exact collector_number match
        if (isAExactCol && !isBExactCol) return -1;
        if (!isAExactCol && isBExactCol) return 1;

        // d) Rarity Tier (ascending: lower tier is better, i.e., 1 comes before 2)
        const aTier = rarityTier(a.rarity);
        const bTier = rarityTier(b.rarity);
        if (aTier !== bTier) return aTier - bTier;

        // e) Language Priority (EN before JA)
        const aLang = a.language_code === 'EN' ? 0 : 1;
        const bLang = b.language_code === 'EN' ? 0 : 1;
        if (aLang !== bLang) return aLang - bLang;

        // Helper to grab price logic generically
        const getPriceFields = (p: any): { mp: number | null, curr: string | null } => {
            const prices = p.catalog_prices_current;
            if (prices) {
               if (Array.isArray(prices) && prices.length > 0) {
                   return { mp: prices[0].market_price !== undefined ? prices[0].market_price : null, curr: prices[0].currency || null };
               } else if (!Array.isArray(prices)) {
                   return { mp: prices.market_price !== undefined ? prices.market_price : null, curr: prices.currency || null };
               }
            }
            return { mp: null, curr: null };
        };

        const aP = getPriceFields(a);
        const bP = getPriceFields(b);
        const aUsd = priceUsd(aP.mp, aP.curr);
        const bUsd = priceUsd(bP.mp, bP.curr);

        // f) Market Price USD (descending: higher price first)
        if (aUsd !== bUsd) return bUsd - aUsd;

        // g) Tie-breaker: Deterministic external_id ASC
        return aExtId.localeCompare(bExtId);
    });
    // 5. Output JSON mapping
    const finalResults = results.slice(0, limit).map((p: any) => {
        let market_price = null;
        let currency = null;
        let source = null;
        let last_updated = null;

        const prices = p.catalog_prices_current;
        if (prices) {
            if (Array.isArray(prices)) {
                if (prices.length > 0) {
                    market_price = prices[0].market_price !== undefined ? prices[0].market_price : null;
                    currency = prices[0].currency || null;
                    source = prices[0].source || null;
                    last_updated = prices[0].last_updated || null;
                }
            } else {
                market_price = prices.market_price !== undefined ? prices.market_price : null;
                currency = prices.currency || null;
                source = prices.source || null;
                last_updated = prices.last_updated || null;
            }
        }

        return {
            id: p.id,
            external_id: p.external_id,
            game: p.game,
            kind: p.kind,
            language_code: p.language_code,
            name: p.name,
            name_en: p.name_en || null,
            set_name: p.set_name,
            set_name_en: p.set_name_en || null,
            rarity: p.rarity,
            collector_number: p.collector_number,
            set_code: p.set_code,
            set_total: p.set_total,
            set_printed_total: p.set_printed_total,
            image_url: p.image_url,
            tcgplayer_url: p.tcgplayer_url || null,
            market_price,
            currency,
            source,
            last_updated
        };
    });

    return new Response(JSON.stringify({ data: finalResults }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

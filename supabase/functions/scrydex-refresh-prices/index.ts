import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const SCRYDEX_API_KEY = Deno.env.get('SCRYDEX_API_KEY') || '';
const SCRYDEX_TEAM_ID = Deno.env.get('SCRYDEX_TEAM_ID') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Unauthorized access" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
        const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
             global: { headers: { Authorization: authHeader } }
        });
        const { data: { user }, error: authError } = await authClient.auth.getUser();
        
        if (authError || !user) {
             return new Response(JSON.stringify({ error: "Invalid token or unauthorized user" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const payload = await req.json();
        const { product_ids, force = false } = payload;

        // 1. Validate Input
        if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
            return new Response(JSON.stringify({ error: "product_ids array is required and cannot be empty." }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (product_ids.length > 100) {
            return new Response(JSON.stringify({ error: "Exceeded max limit. Cannot process more than 100 product_ids per call." }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Initialize Supabase Client with service role to bypass RLS and perform backend upserts natively
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Rate Limiting Logic Check
        const timeLimitSecs = force ? 60 : 10;
        const { data: recentLog, error: logErr } = await supabase
             .from('user_price_refresh_log')
             .select('created_at')
             .eq('user_id', user.id)
             .eq('force', force)
             .order('created_at', { ascending: false })
             .limit(1)
             .maybeSingle();
             
        if (recentLog) {
             const lastCallTime = new Date(recentLog.created_at).getTime();
             const nowTime = new Date().getTime();
             const diffSecs = (nowTime - lastCallTime) / 1000;
             if (diffSecs < timeLimitSecs) {
                 return new Response(JSON.stringify({ error: `Rate limited. Please wait at least ${timeLimitSecs} seconds before ${force ? 'manually' : 'silently'} refreshing prices again.` }), {
                     status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                 });
             }
        }

        // 2. Resolve catalog targets by fetching current external state mapped back to uuid.
        const { data: catalogItems, error: catalogErr } = await supabase
            .from('catalog_products')
            .select('id, external_id, game, kind, language_code')
            .in('id', product_ids);

        if (catalogErr) throw new Error("Database error retrieving catalog_products: " + catalogErr.message);

        if (!catalogItems || catalogItems.length === 0) {
            return new Response(JSON.stringify({ message: "No matching catalog products found for provided IDs.", updated: 0 }), {
                status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 3. Batch and segment the catalog items by URL targets securely
        const chunkSize = 50; 
        const pricesToUpsert = [];
        
        for (let i = 0; i < catalogItems.length; i += chunkSize) {
            const chunk = catalogItems.slice(i, i + chunkSize);
            const groups: Record<string, typeof catalogItems> = {};

            for (const item of chunk) {
                // We resolve the safest base Scrydex URL to query by UUID. 
                // We drop deep Q params like 'language_code:EN' entirely from the base and embed them purely in UUID target logic.
                let endpointPath = '';
                if (item.game === 'POKEMON') {
                    if (item.kind === 'SEALED') endpointPath = '/pokemon/v1/sealed';
                    else endpointPath = `/pokemon/v1/${(item.language_code || 'en').toLowerCase()}/cards`;
                } else if (item.game === 'ONE_PIECE') {
                    if (item.kind === 'SEALED') endpointPath = '/onepiece/v1/sealed';
                    else endpointPath = '/onepiece/v1/cards';
                }
                
                if (!endpointPath) continue;
                
                if (!groups[endpointPath]) groups[endpointPath] = [];
                groups[endpointPath].push(item);
            }

            // 4. Hit Scrydex dynamically for each mapped boundary
            for (const [endpointPath, items]] of Object.entries(groups)) {
                // Assemble "q=id:uuid OR id:uuid2" 
                const queryParts = items.map(item => `id:"${item.external_id}"`);
                const queryString = queryParts.join(' OR ');
                
                const searchUrl = `https://api.scrydex.com${endpointPath}?q=${encodeURIComponent(queryString)}&select=id,market_price`;
                
                const response = await fetch(searchUrl, {
                    headers: {
                        'Accept': 'application/json',
                        'X-Api-Key': SCRYDEX_API_KEY,
                        'X-Team-ID': SCRYDEX_TEAM_ID
                    }
                });

                if (!response.ok) {
                    console.error(`⚠️ Scrydex Fetch failed: ${response.status} ${response.statusText} at ${searchUrl}`);
                    continue; 
                }
                
                const responseData = await response.json();
                const fetchedItems = responseData.data || [];

                for (const fetched of fetchedItems) {
                    const match = items.find(i => i.external_id === fetched.id);
                    if (match && typeof fetched.market_price === 'number') {
                        pricesToUpsert.push({
                            product_id: match.id,
                            market_price: fetched.market_price,
                            currency: 'USD',
                            last_updated: new Date().toISOString()
                        });
                    }
                }
            }
        }

        // 5. Update catalog_prices_current tracking
        if (pricesToUpsert.length === 0) {
            return new Response(JSON.stringify({ message: "No current prices were successfully localized from Scrydex.", updated: 0 }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { error: upsertErr } = await supabase
            .from('catalog_prices_current')
            .upsert(pricesToUpsert, { onConflict: 'product_id' });

        if (upsertErr) throw new Error("Failed to seamlessly upsert target prices: " + upsertErr.message);

        // 6. Handle catalog_price_snapshots logging conditionally (Fallback logic evaluates against exact daily targets)
        const snapshotData = pricesToUpsert.map(p => ({
             product_id: p.product_id,
             market_price: p.market_price,
             captured_at: new Date().toISOString()
        }));

        if (force) {
             const { error: snapErr } = await supabase.from('catalog_price_snapshots').insert(snapshotData);
             if (snapErr) console.error("⚠️ Error directly forcing snapshots: ", snapErr.message);
        } else {
             // We determine if 24h limit boundary triggered
             const { data: lastSnaps, error: lastSnapErr } = await supabase
                  .from('catalog_price_snapshots')
                  .select('product_id, captured_at')
                  .in('product_id', snapshotData.map(p => p.product_id))
                  .order('captured_at', { ascending: false });

             let toSnapshot = [];
             if (!lastSnapErr && lastSnaps) {
                  const now = new Date();
                  const snapMap: Record<string, Date> = {};
                  lastSnaps.forEach(row => {
                       // Because array is ordered descending `captured_at`, the first encountered is inherently newest
                       if (!snapMap[row.product_id]) snapMap[row.product_id] = new Date(row.captured_at);
                  });

                  for (const p of snapshotData) {
                       const lastTime = snapMap[p.product_id];
                       // Only capture if completely undiscovered natively OR if the boundary delta is strictly >24h natively
                       if (!lastTime || (now.getTime() - lastTime.getTime()) > 24 * 60 * 60 * 1000) {
                            toSnapshot.push(p);
                       }
                  }
             } else {
                  toSnapshot = snapshotData; // Fallback safely to catch all
             }

             if (toSnapshot.length > 0) {
                  const { error: snapErr } = await supabase.from('catalog_price_snapshots').insert(toSnapshot);
                  if (snapErr) console.error("⚠️ Error capturing daily snapshot diffs: ", snapErr.message);
             }
        }

        // 7. Log the rate-limit transaction after success
        const { error: ratelimitLogErr } = await supabase.from('user_price_refresh_log').insert([{
             user_id: user.id,
             force: force,
             count: product_ids.length
        }]);
        if (ratelimitLogErr) console.error("⚠️ Error logging rate limit transaction: ", ratelimitLogErr.message);

        // Return successfully tracked states
        return new Response(JSON.stringify({ 
             success: true, 
             updated: pricesToUpsert.length, 
             prices: pricesToUpsert 
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err: unknown) {
        let msg = "Unknown fatal error";
        if (err instanceof Error) msg = err.message;
        
        return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

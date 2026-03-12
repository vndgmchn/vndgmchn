import { createClient } from '@supabase/supabase-js';

// Configuration via Env Vars
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SCRYDEX_API_KEY = process.env.SCRYDEX_API_KEY;
const SCRYDEX_TEAM_ID = process.env.SCRYDEX_TEAM_ID;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
}
if (!SCRYDEX_API_KEY || !SCRYDEX_TEAM_ID) {
    console.warn("⚠️ Warning: SCRYDEX_API_KEY or SCRYDEX_TEAM_ID is missing. The API will likely reject requests.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Endpoints to ingest mapped to their game, kind, and pagination page size max limits.
const ENDPOINTS = [
    { url: 'https://api.scrydex.com/pokemon/v1/en/cards', game: 'POKEMON', kind: 'CARD', pageSize: 100 },
    { url: 'https://api.scrydex.com/pokemon/v1/ja/cards', game: 'POKEMON', kind: 'CARD', pageSize: 100 },
    { url: 'https://api.scrydex.com/pokemon/v1/sealed', game: 'POKEMON', kind: 'SEALED', pageSize: 100 },
    { url: 'https://api.scrydex.com/onepiece/v1/cards', game: 'ONE_PIECE', kind: 'CARD', pageSize: 100 },
    { url: 'https://api.scrydex.com/onepiece/v1/sealed', game: 'ONE_PIECE', kind: 'SEALED', pageSize: 100 },
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, options = {}) {
    const maxAttempts = options.maxAttempts || 6;

    // Merge standard headers with any provided in options
    const fetchOptions = {
        ...options,
        headers: {
            'Accept': 'application/json',
            'X-Api-Key': SCRYDEX_API_KEY || '',
            'X-Team-ID': SCRYDEX_TEAM_ID || '',
            ...(options.headers || {})
        }
    };

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const response = await fetch(url, fetchOptions);
            if (response.ok) {
                return response;
            }

            const status = response.status;
            // Retry on 429, 500, 502, 503, 504
            if ([429, 500, 502, 503, 504].includes(status)) {
                let waitMs = Math.min(30000, (Math.pow(2, attempt) * 750) + Math.random() * 500);

                if (status === 429) {
                    const retryAfter = response.headers.get('Retry-After');
                    if (retryAfter) {
                        const parsed = parseInt(retryAfter, 10);
                        if (!isNaN(parsed)) {
                            waitMs = Math.min(60000, parsed * 1000); // Cap at 60s
                        }
                    }
                }

                if (attempt === maxAttempts - 1) {
                    throw new Error(`Scrydex API error: ${status} ${response.statusText} at ${url} after ${maxAttempts} attempts.`);
                }

                console.log(`⚠️ HTTP ${status} received. Retrying attempt ${attempt + 1}/${maxAttempts} in ${waitMs.toFixed(0)}ms...`);
                await sleep(waitMs);
                continue;
            }

            // Non-retriable HTTP error
            throw new Error(`Scrydex API error: ${status} ${response.statusText} at ${url}`);
        } catch (error) {
            // Network or parsing errors
            if (attempt === maxAttempts - 1) {
                throw error;
            }
            const waitMs = Math.min(30000, (Math.pow(2, attempt) * 750) + Math.random() * 500);
            console.log(`⚠️ Fetch error: ${error.message}. Retrying attempt ${attempt + 1}/${maxAttempts} in ${waitMs.toFixed(0)}ms...`);
            await sleep(waitMs);
        }
    }
}

/**
 * Normalizes an API response item to match the public.catalog_products schema.
 */
function mapItemToCatalogFormat(item, endpointContext) {
    const extId = item.id || item.external_id || '';
    if (extId.startsWith('tcgp-')) {
        return null; // Skip Pokémon Pocket / digital-only items
    }

    // Determine language source
    let lang = 'EN';
    if (item.language_code) {
        lang = item.language_code.toUpperCase();
    } else if (item.expansion && item.expansion.language_code) {
        lang = item.expansion.language_code.toUpperCase();
    } else if (endpointContext.url.includes('/ja/')) {
        lang = 'JA';
    }

    // Determine English name fallback for JP Cards
    let name_en = null;
    if (lang === 'JA' && item.translation?.en?.name) {
        name_en = item.translation.en.name;
    }

    // Determine English set name mirror for JA
    let set_name_en = null;
    if (lang === 'JA' && item.translation?.en?.expansion?.name) {
        set_name_en = item.translation.en.expansion.name;
    }

    // Image URL
    let image_url = null;
    if (item.images && item.images.length > 0) {
        image_url = item.images[0].large || item.images[0].small;
    }

    // Determine Set Total
    let set_total = null;
    const itemTotal = item.printedTotal || item.total || item.totalCards;
    const expansionTotal = item.expansion?.printedTotal || item.expansion?.total || item.expansion?.totalCards;

    // Prefer item-level total, fallback to expansion-level total
    const bestTotal = itemTotal || expansionTotal;

    if (bestTotal !== undefined && bestTotal !== null) {
        set_total = parseInt(bestTotal, 10);
        if (isNaN(set_total)) {
            set_total = null;
        }
    }

    // Determine Set Printed Total
    let set_printed_total = null;
    const printedVal = item.expansion?.printed_total || item.expansion?.printedTotal || item.printedTotal;

    if (printedVal !== undefined && printedVal !== null) {
        set_printed_total = parseInt(printedVal, 10);
        if (isNaN(set_printed_total)) {
            set_printed_total = null;
        }
    }

    // Determine Set Code
    let set_code = item.expansion?.code || null;

    // Determine Collector Number
    // The Scrydex API returns actual card number in `number` or `collector_number`
    let collector_number = item.number || item.collector_number || null;

    const normalize = (str) => typeof str === 'string' ? str.toLowerCase() : null;

    const mappedItem = {
        game: endpointContext.game,
        kind: endpointContext.kind,
        external_id: item.id,
        language_code: lang,
    };

    // Add properties only if they strictly exist (null-safe omission)
    const name = item.name || 'Unknown';
    const set_name = item.expansion?.name || null;
    const rarity = item.rarity?.name ?? item.rarity ?? null;

    if (name !== null && name !== undefined) {
        mappedItem.name = name;
    }
    if (name_en !== null && name_en !== undefined) {
        mappedItem.name_en = name_en;
        mappedItem.search_name_en = normalize(name_en);
    }
    if (set_name !== null && set_name !== undefined) {
        mappedItem.set_name = set_name;
    }
    if (set_name_en !== null && set_name_en !== undefined) {
        mappedItem.set_name_en = set_name_en;
        mappedItem.search_set_en = normalize(set_name_en);
    }
    if (rarity !== null && rarity !== undefined) mappedItem.rarity = rarity;
    if (image_url !== null && image_url !== undefined) mappedItem.image_url = image_url;
    if (collector_number !== null && collector_number !== undefined) mappedItem.collector_number = collector_number;
    if (set_code !== null && set_code !== undefined) mappedItem.set_code = set_code;
    if (set_total !== null && set_total !== undefined) mappedItem.set_total = set_total;
    if (set_printed_total !== null && set_printed_total !== undefined) mappedItem.set_printed_total = set_printed_total;

    if (endpointContext.game === 'ONE_PIECE' && endpointContext.kind === 'CARD') {
        if (item.cost !== undefined && item.cost !== null) mappedItem.op_cost = String(item.cost);
        if (item.power !== undefined && item.power !== null) mappedItem.op_power = String(item.power);
        if (item.counter !== undefined && item.counter !== null) mappedItem.op_counter = String(item.counter);
        if (item.attribute !== undefined && item.attribute !== null) mappedItem.op_attribute = String(item.attribute);
        if (item.type !== undefined && item.type !== null) mappedItem.op_type = String(item.type);
        if (Array.isArray(item.colors)) mappedItem.op_colors = item.colors;
    }

    return mappedItem;
}

async function run() {
    console.log("🚀 Starting Scrydex Metadata Ingestion Run...");

    // Parse CLI arguments
    const args = process.argv.slice(2);
    const maxPagesIndex = args.indexOf('--maxPagesPerEndpoint');
    let maxPagesPerEndpoint = null;
    if (maxPagesIndex !== -1 && args[maxPagesIndex + 1]) {
        maxPagesPerEndpoint = parseInt(args[maxPagesIndex + 1], 10);
        console.log(`⏱️ Top-off mode enabled: limiting to ${maxPagesPerEndpoint} pages per endpoint.`);
    }

    const onlyEndpointIndex = args.indexOf('--onlyEndpoint');
    let onlyEndpointFilter = null;
    if (onlyEndpointIndex !== -1 && args[onlyEndpointIndex + 1]) {
        onlyEndpointFilter = args[onlyEndpointIndex + 1];
    }

    let endpointsToRun = ENDPOINTS;
    if (onlyEndpointFilter) {
        endpointsToRun = endpointsToRun.filter(e => e.url.includes(onlyEndpointFilter));
        console.log(`🔎 onlyEndpoint filter active: ${onlyEndpointFilter} (running ${endpointsToRun.length} endpoints)`);
    }

    // 1. Get or Create active run
    let runId;

    if (maxPagesPerEndpoint !== null) {
        // Top-off mode explicitly requests a fresh run and new run_id
        const { data: newRun, error: newRunErr } = await supabase
            .from('catalog_ingestion_runs')
            .insert([{ status: 'RUNNING' }])
            .select('id')
            .single();

        if (newRunErr) throw newRunErr;
        runId = newRun.id;
        console.log(`🆕 Created new isolated top-off run: ${runId}`);
    } else {
        // Standard full-run mode: Try to resume an existing RUNNING run
        let { data: runs, error: runErr } = await supabase
            .from('catalog_ingestion_runs')
            .select('id')
            .eq('status', 'RUNNING')
            .order('started_at', { ascending: false })
            .limit(1);

        if (runErr) throw runErr;

        if (runs && runs.length > 0) {
            runId = runs[0].id;
            console.log(`📡 Resuming existing run: ${runId}`);
        } else {
            const { data: newRun, error: newRunErr } = await supabase
                .from('catalog_ingestion_runs')
                .insert([{ status: 'RUNNING' }])
                .select('id')
                .single();

            if (newRunErr) throw newRunErr;
            runId = newRun.id;
            console.log(`🆕 Created new run: ${runId}`);
        }
    }

    // 2. Iterate endpoints
    for (const endpoint of endpointsToRun) {
        console.log(`\n===========================================`);
        console.log(`🔍 Processing Endpoint: ${endpoint.url}`);
        console.log(`===========================================`);

        // Fetch page 1 just to see the totalCount headers (standard Scrydex limits)
        let baseUrl = endpoint.url;
        const separator = baseUrl.includes('?') ? '&' : '?';
        let selectFields = 'id,name,language_code,translation,expansion,images,collector_number,number,rarity,printedTotal,total,totalCards';
        if (endpoint.game === 'ONE_PIECE' && endpoint.kind === 'CARD') {
            selectFields += ',cost,power,counter,attribute,type,colors';
        }
        const page1Url = `${baseUrl}${separator}page=1&page_size=${endpoint.pageSize}&select=${selectFields}`;

        let totalPages = 1;
        try {
            await sleep(150 + Math.random() * 100); // 150-250ms Polite sleep
            const initResponse = await fetchWithRetry(page1Url);

            const totalCountHeader = initResponse.headers.get('Total-Count') || initResponse.headers.get('x-total-count') || 0;
            const resJson = await initResponse.json();

            // Revert back to has_more if total metadata doesn't exist, but prioritize total-count header
            let countToUse = parseInt(totalCountHeader, 10);
            if (!countToUse || isNaN(countToUse)) {
                // Try inspecting envelope
                countToUse = resJson.total_count || resJson.totalCount || null;
            }

            if (countToUse && countToUse > 0) {
                totalPages = Math.ceil(countToUse / endpoint.pageSize);
                console.log(`📊 Discovered ${countToUse} total items across ${totalPages} max pages.`);
            } else {
                console.log(`⚠️ totalCount not found in headers or payload; defaulting to naive 'has_more' fail-safe or blind loop if necessary.`);
                // Safety guard fallback to fetch aggressively if total count lacks. 
                // We will scan until data array is empty.
                totalPages = 9999;
            }

            // Apply Top-Off Limit safely
            if (maxPagesPerEndpoint !== null) {
                totalPages = Math.min(totalPages, maxPagesPerEndpoint);
            }

            // We immediately process the `resJson` we just pulled if page 1 wasn't done yet
        } catch (err) {
            console.error(`💥 Error initializing endpoint headers for ${endpoint.url}:`, err.message);
            continue;
        }

        // Determine resumable page start using exact schema
        let startPage = 1;
        const { data: pageData, error: pageErr } = await supabase
            .from('catalog_ingestion_pages')
            .select('page')
            .eq('run_id', runId)
            .eq('dataset', endpoint.url)
            .eq('status', 'OK')
            .order('page', { ascending: false })
            .limit(1);

        if (pageErr) {
            console.error(`⚠️ Checking resume state failed: ${pageErr.message}`);
        } else if (pageData && pageData.length > 0) {
            startPage = pageData[0].page + 1;
            console.log(`📡 Resuming endpoint from page ${startPage} (Found last completed page: ${pageData[0].page})`);
        } else {
            console.log(`🆕 Starting endpoint from page 1`);
        }

        // Loop Pages starting from startPage
        for (let page = startPage; page <= totalPages; page++) {

            // Additionally: before fetching a page, check if that exact page exists with status='OK' or 'SKIPPED' and skip it.
            const { data: existingPage, error: existingErr } = await supabase
                .from('catalog_ingestion_pages')
                .select('status')
                .eq('run_id', runId)
                .eq('dataset', endpoint.url)
                .eq('page', page)
                .in('status', ['OK', 'SKIPPED'])
                .limit(1);

            if (!existingErr && existingPage && existingPage.length > 0) {
                console.log(`⏩ Skipping Page ${page} (Already completed with status: ${existingPage[0].status})`);
                continue;
            }

            console.log(`⏳ Fetching Page ${page}/${totalPages === 9999 ? '?' : totalPages}...`);
            await sleep(150 + Math.random() * 100);

            const pageUrl = `${baseUrl}${separator}page=${page}&page_size=${endpoint.pageSize}&select=${selectFields}`;

            try {
                const response = await fetchWithRetry(pageUrl);
                const responseData = await response.json();
                const items = responseData.data || [];

                if (items.length === 0) {
                    console.log(`✅ Endpoint exhausted (no items returned on page ${page}).`);
                    break;
                }

                // Map results
                const mappedRecords = items.map(item => mapItemToCatalogFormat(item, endpoint)).filter(Boolean);

                if (mappedRecords.length > 0) {
                    const sample = mappedRecords[0];
                    console.log(`🐛 Sample Mapped Object [External ID: ${sample.external_id}]:`);
                    console.log(`   👉 Set Code: ${sample.set_code || 'NULL'}, Collector Number: ${sample.collector_number || 'NULL'}, Set Total: ${sample.set_total || 'NULL'}`);
                }

                // Upsert records
                const { error: upsertErr } = await supabase
                    .from('catalog_products')
                    .upsert(mappedRecords, {
                        onConflict: 'game, kind, language_code, external_id',
                        ignoreDuplicates: false // We want to overwrite with newest API details if fields changed
                    });

                if (upsertErr) {
                    throw new Error(`Upsert Error: ${upsertErr.message}`);
                }

                // Log page completion with the exact schema columns
                const checkpoint = {
                    run_id: runId,
                    dataset: endpoint.url,
                    page: page,
                    page_size: endpoint.pageSize,
                    processed_at: new Date().toISOString(),
                    count: items.length,
                    endpoint_url: endpoint.url,
                    page_number: page,
                    status: 'OK',
                    error: null
                };

                const { error: pageLogErr } = await supabase
                    .from('catalog_ingestion_pages')
                    .insert([checkpoint]);

                if (pageLogErr) {
                    console.error(`⚠️ Failed to log page checkpoint, but upsert succeeded! ${pageLogErr.message}`);
                }

                console.log(`👍 Saved ${mappedRecords.length} records. (Page ${page}/${totalPages === 9999 ? '?' : totalPages})`);

                // Stop when items.length === 0 OR items.length < page_size
                if (items.length < endpoint.pageSize) {
                    console.log(`🏁 Endpoint reached natural end (partial/final page returned).`);
                    break;
                }

            } catch (err) {
                console.error(`🚨 Skipping page ${page} of ${endpoint.url} after max attempts failed:`, err.message);

                // Let's generously create a failed tracking checkpoint so we don't infinitely lock on this page next resume.
                const skippedCheckpoint = {
                    run_id: runId,
                    dataset: endpoint.url,
                    page: page,
                    page_size: endpoint.pageSize,
                    processed_at: new Date().toISOString(),
                    count: 0,
                    endpoint_url: endpoint.url,
                    page_number: page,
                    status: 'SKIPPED',
                    error: err.message
                };

                const { error: skipLogErr } = await supabase
                    .from('catalog_ingestion_pages')
                    .insert([skippedCheckpoint]);

                if (skipLogErr) {
                    console.error(`⚠️ Failed to log SKIPPED page checkpoint! ${skipLogErr.message}`);
                }

                continue; // Continue to next page rather than aborting the loop
            }
        }
    }

    // 3. Mark Run as Done
    const { error: finalErr } = await supabase
        .from('catalog_ingestion_runs')
        .update({ status: 'DONE', completed_at: new Date().toISOString() })
        .eq('id', runId);

    if (finalErr) {
        console.error(`❌ Failed to update run status to DONE: ${finalErr.message}`);
    } else {
        console.log(`\n🎉 Ingestion Run Complete! (Run ID: ${runId})`);
    }
}

run().catch(err => {
    console.error(`💥 Fatal execution error:`, err);
    process.exit(1);
});

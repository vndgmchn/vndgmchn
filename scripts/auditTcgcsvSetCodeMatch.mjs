import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchSetCodeCounts() {
    console.log("Fetching set codes from Supabase...");

    let allRows = [];
    let offset = 0;
    const limit = 1000; // PostgREST typically limits to 1000 per request
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('catalog_products')
            .select('game, set_code')
            .in('game', ['POKEMON', 'ONE_PIECE'])
            .eq('language_code', 'EN')
            .eq('kind', 'CARD')
            .not('set_code', 'is', null)
            .range(offset, offset + limit - 1);

        if (error) {
            console.error("Error fetching data from Supabase:", error);
            process.exit(1);
        }

        if (data && data.length > 0) {
            allRows = allRows.concat(data);
            offset += data.length;
            if (data.length < limit) {
                hasMore = false; // We received less rows than the limit, meaning we've hit the end
            }
        } else {
            hasMore = false;
        }
    }

    const counts = {
        POKEMON: {},
        ONE_PIECE: {}
    };

    for (const row of allRows) {
        if (row.game && row.set_code) {
            const code = row.set_code;
            counts[row.game][code] = (counts[row.game][code] || 0) + 1;
        }
    }

    return counts;
}

async function fetchGroups(categoryId) {
    const url = `https://tcgcsv.com/tcgplayer/${categoryId}/groups`;
    console.log(`Fetching TCGCSV groups for category ${categoryId}...`);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    const data = await response.json();
    return data.results || [];
}

async function main() {
    const counts = await fetchSetCodeCounts();

    const pokemonGroups = await fetchGroups(3);
    const onePieceGroups = await fetchGroups(68);

    const pkmnAbbrevs = new Set(pokemonGroups.filter(g => g.abbreviation).map(g => g.abbreviation.toLowerCase()));
    const opAbbrevs = new Set(onePieceGroups.filter(g => g.abbreviation).map(g => g.abbreviation.toLowerCase()));

    function analyze(game, groupedCounts, abbrevs) {
        let matchCount = 0;
        let totalCount = 0;

        let distinctMatchCount = 0;
        let distinctTotalCount = 0;

        const unmatched = {};

        for (const [code, count] of Object.entries(groupedCounts)) {
            totalCount += count;
            distinctTotalCount += 1;

            if (abbrevs.has(code.toLowerCase())) {
                matchCount += count;
                distinctMatchCount += 1;
            } else {
                unmatched[code] = count;
            }
        }

        const rowRate = totalCount > 0 ? ((matchCount / totalCount) * 100).toFixed(2) : '0.00';
        const distinctRate = distinctTotalCount > 0 ? ((distinctMatchCount / distinctTotalCount) * 100).toFixed(2) : '0.00';

        console.log(`\n===========================================`);
        console.log(`${game} EN Set Codes Analysis`);
        console.log(`===========================================`);
        console.log(`Total rows scanned: ${totalCount}`);
        console.log(`Matched rows with TCGCSV: ${matchCount} (${rowRate}%)`);
        console.log(`Unmatched rows: ${totalCount - matchCount}`);
        console.log(`-------------------------------------------`);
        console.log(`Total DISTINCT set codes: ${distinctTotalCount}`);
        console.log(`Matched DISTINCT set codes: ${distinctMatchCount} (${distinctRate}%)`);
        console.log(`Unmatched DISTINCT set codes: ${distinctTotalCount - distinctMatchCount}`);

        const sortedUnmatched = Object.entries(unmatched).sort((a, b) => b[1] - a[1]);
        console.log(`\nTop 30 Unmatched Set Codes for ${game}:`);
        sortedUnmatched.slice(0, 30).forEach(([code, count], idx) => {
            console.log(`  ${idx + 1}. "${code}" (${count} items)`);
        });
    }

    analyze('POKEMON', counts.POKEMON, pkmnAbbrevs);
    analyze('ONE_PIECE', counts.ONE_PIECE, opAbbrevs);
}

main().catch(err => {
    console.error("An unexpected error occurred:", err);
    process.exit(1);
});

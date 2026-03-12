const fs = require('fs');

const path = 'supabase/functions/scrydex-refresh-products/index.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Set definition after unmatchedEnIds
content = content.replace(
    'const unmatchedEnIds = new Set(staleEnIds);',
    'const unmatchedEnIds = new Set(staleEnIds);\n        const pricedByTcgcsv = new Set<string>();'
);

// 2 & 3. Change condition and add ID tracking
content = content.replace(
    'if (targetPriceRow && targetPriceRow.marketPrice) {',
    'if (targetPriceRow && targetPriceRow.marketPrice !== null && targetPriceRow.marketPrice !== undefined) {\n                                    pricedByTcgcsv.add(prod.id);'
);

// 4. Update the Scrydex IDs to fetch declaration to filter out priced items
content = content.replace(
    'const scrydexIdsToFetch = [...staleOtherIds, ...Array.from(unmatchedEnIds)];',
    'const scrydexIdsToFetch = [...staleOtherIds, ...Array.from(unmatchedEnIds)].filter(id => !pricedByTcgcsv.has(id));'
);

// 5. Add skip guard to Scrydex fetches
content = content.replace(
    'const fetchPromises = scrydexProds.map(async (prod: any) => {\n                try {',
    'const fetchPromises = scrydexProds.map(async (prod: any) => {\n                if (pricedByTcgcsv.has(prod.id)) return;\n                try {'
);

fs.writeFileSync(path, content, 'utf8');
console.log('done');

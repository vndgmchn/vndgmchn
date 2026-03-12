const fs = require('fs');

let searchContent = fs.readFileSync('app/search.tsx', 'utf8');
const searchRegex = /const nowMS = Date\.now\(\);\s*const staleIds = new Set<string>\(\);[\s\S]*?const productIdsToRefresh = Array\.from\(staleIds\)\.slice\(0, 100\);/;
const searchReplacement = `const productIdsToRefresh = mapped.map((r: any) => r.id).filter(Boolean).slice(0, 100);`;
searchContent = searchContent.replace(searchRegex, searchReplacement);
fs.writeFileSync('app/search.tsx', searchContent, 'utf8');

let invContent = fs.readFileSync('app/(tabs)/inventory.tsx', 'utf8');
const invRegex = /const nowMS = Date\.now\(\);\s*const staleIds = new Set<string>\(\);[\s\S]*?const productIdsToRefresh = Array\.from\(staleIds\)\.slice\(0, 100\);/;
const invReplacement = `const productIdsToRefresh = Array.from(new Set(data.filter((r: any) => r.catalog_product_id).map((r: any) => r.catalog_product_id))).slice(0, 100);`;
invContent = invContent.replace(invRegex, invReplacement);
fs.writeFileSync('app/(tabs)/inventory.tsx', invContent, 'utf8');

console.log('done');

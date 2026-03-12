const fs = require('fs');
const file = 'supabase/functions/scrydex-refresh-products/index.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /                        let matchedGroup = null;[\s\S]*?(?=                        if \(matchedGroup\) \{)/;

const newLogic = `                        const normalizeGroupName = (s: string) => {
                            if (!s) return '';
                            return s.toLowerCase()
                                .replace(/[^a-z0-9]+/g, ' ')
                                .replace(/\\b(?:base|set|series|expansion|pokemon|tcg)\\b/g, '')
                                .replace(/\\s+/g, ' ')
                                .trim();
                        };

                        let bestScore = 0;
                        let bestGroup = null;
                        
                        const prodNorm = prod.set_name ? normalizeGroupName(prod.set_name) : '';

                        for (const g of groups) {
                            let score = 0;
                            
                            if (prod.set_code && g.abbreviation && g.abbreviation.toLowerCase() === prod.set_code.toLowerCase()) {
                                score = 100;
                            } else if (prodNorm) {
                                const splitName = g.name.split(':');
                                const suffix = splitName.length > 1 ? splitName[1].trim() : g.name;
                                
                                const groupNormSuffix = normalizeGroupName(suffix);
                                const groupNormFull = normalizeGroupName(g.name);
                                
                                if (groupNormSuffix === prodNorm && groupNormSuffix !== '') {
                                    score = 80;
                                } else if (groupNormFull === prodNorm && groupNormFull !== '') {
                                    score = 60;
                                } else if (
                                    (groupNormSuffix && (prodNorm.includes(groupNormSuffix) || groupNormSuffix.includes(prodNorm))) ||
                                    (groupNormFull && (prodNorm.includes(groupNormFull) || groupNormFull.includes(prodNorm)))
                                ) {
                                    score = 40;
                                }
                            }
                            
                            if (score >= 40 && score > bestScore) {
                                bestScore = score;
                                bestGroup = g;
                            }
                        }

                        let matchedGroup = bestGroup;

`;

content = content.replace(regex, newLogic);
fs.writeFileSync(file, content, 'utf8');
console.log('done');

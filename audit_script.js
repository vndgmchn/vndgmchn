const fs = require('fs');
const path = require('path');

const searchTerms = [
    "scrydex-refresh-products",
    "scrydex-search",
    "functions.invoke",
    "supabase.functions.invoke",
    "/functions/v1/",
    "fetch(",
    "Authorization",
    "apikey",
    "productIds",
    "Missing productIds array",
    "Unauthorized request"
];

const ignoredDirs = ['.git', 'node_modules', '.next', '.expo', 'dist', 'build', '.gemini', '.turbo'];
const results = [];

function searchFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        try {
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                if (!ignoredDirs.includes(file)) {
                    searchFiles(fullPath);
                }
            } else {
                const ext = path.extname(file);
                if (['.ts', '.tsx', '.js', '.jsx', '.json', '.sql', '.toml'].includes(ext)) {
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    const lines = content.split('\n');
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i];
                        for (const term of searchTerms) {
                            if (line.includes(term)) {
                                // Gather context: -5 to +5 lines
                                const start = Math.max(0, i - 5);
                                const end = Math.min(lines.length - 1, i + 5);
                                const context = lines.slice(start, end + 1).map((l, idx) => `${start + idx + 1}: ${l}`).join('\n');
                                results.push(`### Match for \`${term}\` in ${fullPath}:${i + 1}\n\`\`\`text\n${context}\n\`\`\`\n`);
                            }
                        }
                    }
                }
            }
        } catch (e) {
            // ignore
        }
    }
}

searchFiles(process.cwd());
fs.writeFileSync('audit_results.md', results.join('\n'));

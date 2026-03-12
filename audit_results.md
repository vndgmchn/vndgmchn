### Match for `scrydex-search` in C:\Users\dtran\vndgmchn\app\search.tsx:104
```text
99:     };
100: 
101:     const hitScrydexEdgeFunction = async (searchTerm: string, activeGame: string) => {
102:         setSearchingEdge(true);
103:         try {
104:             const { data, error } = await supabase.functions.invoke('scrydex-search', {
105:                 body: { game: activeGame, query: searchTerm, limit: 20 }
106:             });
107: 
108:             if (error) {
109:                 setErrorMsg(error.message || "Failed to contact Scrydex.");
```

### Match for `functions.invoke` in C:\Users\dtran\vndgmchn\app\search.tsx:104
```text
99:     };
100: 
101:     const hitScrydexEdgeFunction = async (searchTerm: string, activeGame: string) => {
102:         setSearchingEdge(true);
103:         try {
104:             const { data, error } = await supabase.functions.invoke('scrydex-search', {
105:                 body: { game: activeGame, query: searchTerm, limit: 20 }
106:             });
107: 
108:             if (error) {
109:                 setErrorMsg(error.message || "Failed to contact Scrydex.");
```

### Match for `supabase.functions.invoke` in C:\Users\dtran\vndgmchn\app\search.tsx:104
```text
99:     };
100: 
101:     const hitScrydexEdgeFunction = async (searchTerm: string, activeGame: string) => {
102:         setSearchingEdge(true);
103:         try {
104:             const { data, error } = await supabase.functions.invoke('scrydex-search', {
105:                 body: { game: activeGame, query: searchTerm, limit: 20 }
106:             });
107: 
108:             if (error) {
109:                 setErrorMsg(error.message || "Failed to contact Scrydex.");
```

### Match for `scrydex-refresh-products` in C:\Users\dtran\vndgmchn\audit_script.js:5
```text
1: const fs = require('fs');
2: const path = require('path');
3: 
4: const searchTerms = [
5:     "scrydex-refresh-products",
6:     "scrydex-search",
7:     "functions.invoke",
8:     "supabase.functions.invoke",
9:     "/functions/v1/",
10:     "fetch(",
```

### Match for `scrydex-search` in C:\Users\dtran\vndgmchn\audit_script.js:6
```text
1: const fs = require('fs');
2: const path = require('path');
3: 
4: const searchTerms = [
5:     "scrydex-refresh-products",
6:     "scrydex-search",
7:     "functions.invoke",
8:     "supabase.functions.invoke",
9:     "/functions/v1/",
10:     "fetch(",
11:     "Authorization",
```

### Match for `functions.invoke` in C:\Users\dtran\vndgmchn\audit_script.js:7
```text
2: const path = require('path');
3: 
4: const searchTerms = [
5:     "scrydex-refresh-products",
6:     "scrydex-search",
7:     "functions.invoke",
8:     "supabase.functions.invoke",
9:     "/functions/v1/",
10:     "fetch(",
11:     "Authorization",
12:     "apikey",
```

### Match for `functions.invoke` in C:\Users\dtran\vndgmchn\audit_script.js:8
```text
3: 
4: const searchTerms = [
5:     "scrydex-refresh-products",
6:     "scrydex-search",
7:     "functions.invoke",
8:     "supabase.functions.invoke",
9:     "/functions/v1/",
10:     "fetch(",
11:     "Authorization",
12:     "apikey",
13:     "productIds",
```

### Match for `supabase.functions.invoke` in C:\Users\dtran\vndgmchn\audit_script.js:8
```text
3: 
4: const searchTerms = [
5:     "scrydex-refresh-products",
6:     "scrydex-search",
7:     "functions.invoke",
8:     "supabase.functions.invoke",
9:     "/functions/v1/",
10:     "fetch(",
11:     "Authorization",
12:     "apikey",
13:     "productIds",
```

### Match for `/functions/v1/` in C:\Users\dtran\vndgmchn\audit_script.js:9
```text
4: const searchTerms = [
5:     "scrydex-refresh-products",
6:     "scrydex-search",
7:     "functions.invoke",
8:     "supabase.functions.invoke",
9:     "/functions/v1/",
10:     "fetch(",
11:     "Authorization",
12:     "apikey",
13:     "productIds",
14:     "Missing productIds array",
```

### Match for `fetch(` in C:\Users\dtran\vndgmchn\audit_script.js:10
```text
5:     "scrydex-refresh-products",
6:     "scrydex-search",
7:     "functions.invoke",
8:     "supabase.functions.invoke",
9:     "/functions/v1/",
10:     "fetch(",
11:     "Authorization",
12:     "apikey",
13:     "productIds",
14:     "Missing productIds array",
15:     "Unauthorized request"
```

### Match for `Authorization` in C:\Users\dtran\vndgmchn\audit_script.js:11
```text
6:     "scrydex-search",
7:     "functions.invoke",
8:     "supabase.functions.invoke",
9:     "/functions/v1/",
10:     "fetch(",
11:     "Authorization",
12:     "apikey",
13:     "productIds",
14:     "Missing productIds array",
15:     "Unauthorized request"
16: ];
```

### Match for `apikey` in C:\Users\dtran\vndgmchn\audit_script.js:12
```text
7:     "functions.invoke",
8:     "supabase.functions.invoke",
9:     "/functions/v1/",
10:     "fetch(",
11:     "Authorization",
12:     "apikey",
13:     "productIds",
14:     "Missing productIds array",
15:     "Unauthorized request"
16: ];
17: 
```

### Match for `productIds` in C:\Users\dtran\vndgmchn\audit_script.js:13
```text
8:     "supabase.functions.invoke",
9:     "/functions/v1/",
10:     "fetch(",
11:     "Authorization",
12:     "apikey",
13:     "productIds",
14:     "Missing productIds array",
15:     "Unauthorized request"
16: ];
17: 
18: const ignoredDirs = ['.git', 'node_modules', '.next', '.expo', 'dist', 'build', '.gemini', '.turbo'];
```

### Match for `productIds` in C:\Users\dtran\vndgmchn\audit_script.js:14
```text
9:     "/functions/v1/",
10:     "fetch(",
11:     "Authorization",
12:     "apikey",
13:     "productIds",
14:     "Missing productIds array",
15:     "Unauthorized request"
16: ];
17: 
18: const ignoredDirs = ['.git', 'node_modules', '.next', '.expo', 'dist', 'build', '.gemini', '.turbo'];
19: const results = [];
```

### Match for `Missing productIds array` in C:\Users\dtran\vndgmchn\audit_script.js:14
```text
9:     "/functions/v1/",
10:     "fetch(",
11:     "Authorization",
12:     "apikey",
13:     "productIds",
14:     "Missing productIds array",
15:     "Unauthorized request"
16: ];
17: 
18: const ignoredDirs = ['.git', 'node_modules', '.next', '.expo', 'dist', 'build', '.gemini', '.turbo'];
19: const results = [];
```

### Match for `Unauthorized request` in C:\Users\dtran\vndgmchn\audit_script.js:15
```text
10:     "fetch(",
11:     "Authorization",
12:     "apikey",
13:     "productIds",
14:     "Missing productIds array",
15:     "Unauthorized request"
16: ];
17: 
18: const ignoredDirs = ['.git', 'node_modules', '.next', '.expo', 'dist', 'build', '.gemini', '.turbo'];
19: const results = [];
20: 
```

### Match for `apikey` in C:\Users\dtran\vndgmchn\supabase\config.toml:224
```text
219: # Use a production-ready SMTP server
220: # [auth.email.smtp]
221: # enabled = true
222: # host = "smtp.sendgrid.net"
223: # port = 587
224: # user = "apikey"
225: # pass = "env(SENDGRID_API_KEY)"
226: # admin_email = "admin@email.com"
227: # sender_name = "Admin"
228: 
229: # Uncomment to customize email template
```

### Match for `scrydex-search` in C:\Users\dtran\vndgmchn\supabase\config.toml:390
```text
385: # Configures AWS_ACCESS_KEY_ID for S3 bucket
386: s3_access_key = "env(S3_ACCESS_KEY)"
387: # Configures AWS_SECRET_ACCESS_KEY for S3 bucket
388: s3_secret_key = "env(S3_SECRET_KEY)"
389: 
390: [functions.scrydex-search]
391: enabled = true
392: verify_jwt = true
393: import_map = "./functions/scrydex-search/deno.json"
394: # Uncomment to specify a custom file path to the entrypoint.
395: # Supported file extensions are: .ts, .js, .mjs, .jsx, .tsx
```

### Match for `scrydex-search` in C:\Users\dtran\vndgmchn\supabase\config.toml:393
```text
388: s3_secret_key = "env(S3_SECRET_KEY)"
389: 
390: [functions.scrydex-search]
391: enabled = true
392: verify_jwt = true
393: import_map = "./functions/scrydex-search/deno.json"
394: # Uncomment to specify a custom file path to the entrypoint.
395: # Supported file extensions are: .ts, .js, .mjs, .jsx, .tsx
396: entrypoint = "./functions/scrydex-search/index.ts"
397: # Specifies static files to be bundled with the function. Supports glob patterns.
398: # For example, if you want to serve static HTML pages in your function:
```

### Match for `scrydex-search` in C:\Users\dtran\vndgmchn\supabase\config.toml:396
```text
391: enabled = true
392: verify_jwt = true
393: import_map = "./functions/scrydex-search/deno.json"
394: # Uncomment to specify a custom file path to the entrypoint.
395: # Supported file extensions are: .ts, .js, .mjs, .jsx, .tsx
396: entrypoint = "./functions/scrydex-search/index.ts"
397: # Specifies static files to be bundled with the function. Supports glob patterns.
398: # For example, if you want to serve static HTML pages in your function:
399: # static_files = [ "./functions/scrydex-search/*.html" ]
400: 
401: [functions.scrydex-refresh-products]
```

### Match for `scrydex-search` in C:\Users\dtran\vndgmchn\supabase\config.toml:399
```text
394: # Uncomment to specify a custom file path to the entrypoint.
395: # Supported file extensions are: .ts, .js, .mjs, .jsx, .tsx
396: entrypoint = "./functions/scrydex-search/index.ts"
397: # Specifies static files to be bundled with the function. Supports glob patterns.
398: # For example, if you want to serve static HTML pages in your function:
399: # static_files = [ "./functions/scrydex-search/*.html" ]
400: 
401: [functions.scrydex-refresh-products]
402: enabled = true
403: verify_jwt = true
404: import_map = "./functions/scrydex-refresh-products/deno.json"
```

### Match for `scrydex-refresh-products` in C:\Users\dtran\vndgmchn\supabase\config.toml:401
```text
396: entrypoint = "./functions/scrydex-search/index.ts"
397: # Specifies static files to be bundled with the function. Supports glob patterns.
398: # For example, if you want to serve static HTML pages in your function:
399: # static_files = [ "./functions/scrydex-search/*.html" ]
400: 
401: [functions.scrydex-refresh-products]
402: enabled = true
403: verify_jwt = true
404: import_map = "./functions/scrydex-refresh-products/deno.json"
405: # Uncomment to specify a custom file path to the entrypoint.
406: # Supported file extensions are: .ts, .js, .mjs, .jsx, .tsx
```

### Match for `scrydex-refresh-products` in C:\Users\dtran\vndgmchn\supabase\config.toml:404
```text
399: # static_files = [ "./functions/scrydex-search/*.html" ]
400: 
401: [functions.scrydex-refresh-products]
402: enabled = true
403: verify_jwt = true
404: import_map = "./functions/scrydex-refresh-products/deno.json"
405: # Uncomment to specify a custom file path to the entrypoint.
406: # Supported file extensions are: .ts, .js, .mjs, .jsx, .tsx
407: entrypoint = "./functions/scrydex-refresh-products/index.ts"
408: # Specifies static files to be bundled with the function. Supports glob patterns.
409: # For example, if you want to serve static HTML pages in your function:
```

### Match for `scrydex-refresh-products` in C:\Users\dtran\vndgmchn\supabase\config.toml:407
```text
402: enabled = true
403: verify_jwt = true
404: import_map = "./functions/scrydex-refresh-products/deno.json"
405: # Uncomment to specify a custom file path to the entrypoint.
406: # Supported file extensions are: .ts, .js, .mjs, .jsx, .tsx
407: entrypoint = "./functions/scrydex-refresh-products/index.ts"
408: # Specifies static files to be bundled with the function. Supports glob patterns.
409: # For example, if you want to serve static HTML pages in your function:
410: # static_files = [ "./functions/scrydex-refresh-products/*.html" ]
411: 
```

### Match for `scrydex-refresh-products` in C:\Users\dtran\vndgmchn\supabase\config.toml:410
```text
405: # Uncomment to specify a custom file path to the entrypoint.
406: # Supported file extensions are: .ts, .js, .mjs, .jsx, .tsx
407: entrypoint = "./functions/scrydex-refresh-products/index.ts"
408: # Specifies static files to be bundled with the function. Supports glob patterns.
409: # For example, if you want to serve static HTML pages in your function:
410: # static_files = [ "./functions/scrydex-refresh-products/*.html" ]
411: 
```

### Match for `apikey` in C:\Users\dtran\vndgmchn\supabase\functions\scrydex-refresh-prices\index.ts:11
```text
6: const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
7: const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
8: 
9: const corsHeaders = {
10:     'Access-Control-Allow-Origin': '*',
11:     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
12: };
13: 
14: serve(async (req) => {
15:     // Handle CORS preflight requests
16:     if (req.method === 'OPTIONS') {
```

### Match for `Authorization` in C:\Users\dtran\vndgmchn\supabase\functions\scrydex-refresh-prices\index.ts:21
```text
16:     if (req.method === 'OPTIONS') {
17:         return new Response('ok', { headers: corsHeaders });
18:     }
19: 
20:     try {
21:         const authHeader = req.headers.get('Authorization');
22:         if (!authHeader) {
23:             return new Response(JSON.stringify({ error: "Unauthorized access" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
24:         }
25: 
26:         const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
```

### Match for `Authorization` in C:\Users\dtran\vndgmchn\supabase\functions\scrydex-refresh-prices\index.ts:28
```text
23:             return new Response(JSON.stringify({ error: "Unauthorized access" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
24:         }
25: 
26:         const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
27:         const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
28:              global: { headers: { Authorization: authHeader } }
29:         });
30:         const { data: { user }, error: authError } = await authClient.auth.getUser();
31:         
32:         if (authError || !user) {
33:              return new Response(JSON.stringify({ error: "Invalid token or unauthorized user" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
```

### Match for `fetch(` in C:\Users\dtran\vndgmchn\supabase\functions\scrydex-refresh-prices\index.ts:125
```text
120:                 const queryParts = items.map(item => `id:"${item.external_id}"`);
121:                 const queryString = queryParts.join(' OR ');
122:                 
123:                 const searchUrl = `https://api.scrydex.com${endpointPath}?q=${encodeURIComponent(queryString)}&select=id,market_price`;
124:                 
125:                 const response = await fetch(searchUrl, {
126:                     headers: {
127:                         'Accept': 'application/json',
128:                         'X-Api-Key': SCRYDEX_API_KEY,
129:                         'X-Team-ID': SCRYDEX_TEAM_ID
130:                     }
```

### Match for `apikey` in C:\Users\dtran\vndgmchn\supabase\functions\scrydex-refresh-products\index.ts:8
```text
3: 
4: const SCRYDEX_API_URL = "https://api.scrydex.com";
5: 
6: const corsHeaders = {
7:   'Access-Control-Allow-Origin': '*',
8:   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
9: };
10: 
11: const VARIANT_PREFERENCES = ['normal', 'holofoil', 'reverseHolofoil', 'firstEdition'];
12: 
13: function parseMarketPrice(item: any) {
```

### Match for `productIds` in C:\Users\dtran\vndgmchn\supabase\functions\scrydex-refresh-products\index.ts:65
```text
60:   if (req.method === 'OPTIONS') {
61:     return new Response('ok', { headers: corsHeaders });
62:   }
63: 
64:   try {
65:     const { productIds } = await req.json();
66: 
67:     if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
68:       return new Response(JSON.stringify({ error: "Missing productIds array" }), {
69:         status: 400,
70:         headers: { ...corsHeaders, "Content-Type": "application/json" }
```

### Match for `productIds` in C:\Users\dtran\vndgmchn\supabase\functions\scrydex-refresh-products\index.ts:67
```text
62:   }
63: 
64:   try {
65:     const { productIds } = await req.json();
66: 
67:     if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
68:       return new Response(JSON.stringify({ error: "Missing productIds array" }), {
69:         status: 400,
70:         headers: { ...corsHeaders, "Content-Type": "application/json" }
71:       });
72:     }
```

### Match for `productIds` in C:\Users\dtran\vndgmchn\supabase\functions\scrydex-refresh-products\index.ts:68
```text
63: 
64:   try {
65:     const { productIds } = await req.json();
66: 
67:     if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
68:       return new Response(JSON.stringify({ error: "Missing productIds array" }), {
69:         status: 400,
70:         headers: { ...corsHeaders, "Content-Type": "application/json" }
71:       });
72:     }
73: 
```

### Match for `Missing productIds array` in C:\Users\dtran\vndgmchn\supabase\functions\scrydex-refresh-products\index.ts:68
```text
63: 
64:   try {
65:     const { productIds } = await req.json();
66: 
67:     if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
68:       return new Response(JSON.stringify({ error: "Missing productIds array" }), {
69:         status: 400,
70:         headers: { ...corsHeaders, "Content-Type": "application/json" }
71:       });
72:     }
73: 
```

### Match for `productIds` in C:\Users\dtran\vndgmchn\supabase\functions\scrydex-refresh-products\index.ts:75
```text
70:         headers: { ...corsHeaders, "Content-Type": "application/json" }
71:       });
72:     }
73: 
74:     // Cap at 100
75:     const limitedIds = productIds.slice(0, 100);
76: 
77:     const scrydexKey = Deno.env.get('SCRYDEX_API_KEY');
78:     const scrydexTeamId = Deno.env.get('SCRYDEX_TEAM_ID');
79:     if (!scrydexKey || !scrydexTeamId) {
80:       throw new Error("Missing Scrydex API Key config");
```

### Match for `fetch(` in C:\Users\dtran\vndgmchn\supabase\functions\scrydex-refresh-products\index.ts:137
```text
132:         const fetchPromises = (catalogProducts || []).map(async (prod: any) => {
133:             try {
134:                 const endpoint = prod.game === 'POKEMON' ? 'pokemon/v1/cards' : 'onepiece/v1/cards';
135:                 const url = `${SCRYDEX_API_URL}/${endpoint}/${prod.external_id}?include=prices`;
136:                 
137:                 const res = await fetch(url, {
138:                     headers: {
139:                         'X-Api-Key': scrydexKey,
140:                         'X-Team-ID': scrydexTeamId,
141:                         'Content-Type': 'application/json'
142:                     }
```

### Match for `apikey` in C:\Users\dtran\vndgmchn\supabase\functions\scrydex-search\index.ts:8
```text
3: 
4: const SCRYDEX_API_URL = "https://api.scrydex.com";
5: 
6: const corsHeaders = {
7:   'Access-Control-Allow-Origin': '*',
8:   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
9: };
10: 
11: serve(async (req) => {
12:   if (req.method === 'OPTIONS') {
13:     return new Response('ok', { headers: corsHeaders });
```

### Match for `scrydex-search` in C:\Users\dtran\vndgmchn\supabase\functions\scrydex-search\index.ts:16
```text
11: serve(async (req) => {
12:   if (req.method === 'OPTIONS') {
13:     return new Response('ok', { headers: corsHeaders });
14:   }
15: 
16:   console.log("[scrydex-search] version=v2026-02-26-live");
17: 
18:   try {
19:     let body;
20:     try {
21:         body = await req.json();
```

### Match for `productIds` in C:\Users\dtran\vndgmchn\supabase\functions\scrydex-search\index.ts:67
```text
62:         return new Response(JSON.stringify({ data: [] }), { 
63:             headers: { ...corsHeaders, "Content-Type": "application/json" } 
64:         });
65:     }
66: 
67:     const productIds = catalogProducts.map(p => p.id);
68:     const externalIds = catalogProducts.map(p => p.external_id);
69: 
70:     // 2) Query cache
71:     const { data: cacheData, error: cacheError } = await supabaseClient
72:         .from('catalog_prices_current')
```

### Match for `productIds` in C:\Users\dtran\vndgmchn\supabase\functions\scrydex-search\index.ts:74
```text
69: 
70:     // 2) Query cache
71:     const { data: cacheData, error: cacheError } = await supabaseClient
72:         .from('catalog_prices_current')
73:         .select('product_id, market_price, last_updated')
74:         .in('product_id', productIds);
75: 
76:     if (cacheError) {
77:         throw cacheError;
78:     }
79: 
```

### Match for `fetch(` in C:\Users\dtran\vndgmchn\supabase\functions\scrydex-search\index.ts:107
```text
102:         // Batch requests (max 100). limit is typically 20 so this naturally fits.
103:         const endpointMatch = game === 'POKEMON' ? 'pokemon/v1/cards' : 'onepiece/v1/cards';
104:         const idQueries = missingExternalIds.map(id => `id:"${id}"`).join(' OR ');
105:         const targetUrl = `${SCRYDEX_API_URL}/${endpointMatch}?q=${encodeURIComponent(idQueries)}&include=prices&page_size=100`;
106: 
107:         const scrydexRes = await fetch(targetUrl, {
108:             headers: {
109:                 'X-Api-Key': scrydexKey,
110:                 'X-Team-ID': scrydexTeamId,
111:                 'Content-Type': 'application/json'
112:             }
```

### Match for `productIds` in C:\Users\dtran\vndgmchn\supabase\functions\scrydex-search\index.ts:183
```text
178:         } else {
179:             console.error("Scrydex fetch error:", scrydexRes.status, await scrydexRes.text());
180:         }
181:     }
182: 
183:     // 5) Requery catalog_prices_current for all productIds to guarantee consistency
184:     const { data: finalCacheData, error: finalCacheError } = await supabaseClient
185:         .from('catalog_prices_current')
186:         .select('product_id, market_price, last_updated')
187:         .in('product_id', productIds);
188: 
```

### Match for `productIds` in C:\Users\dtran\vndgmchn\supabase\functions\scrydex-search\index.ts:187
```text
182: 
183:     // 5) Requery catalog_prices_current for all productIds to guarantee consistency
184:     const { data: finalCacheData, error: finalCacheError } = await supabaseClient
185:         .from('catalog_prices_current')
186:         .select('product_id, market_price, last_updated')
187:         .in('product_id', productIds);
188: 
189:     if (finalCacheError) {
190:         throw finalCacheError;
191:     }
192: 
```

### Match for `scrydex-search` in C:\Users\dtran\vndgmchn\test_edge.js:5
```text
1: const anonKey = 'sb_publishable_ZmGUUE-68LEXzlaZ_MBi4Q_hiXH5kkd';
2: 
3: async function test() {
4:     try {
5:         const res = await fetch('https://lzbyghzvreclfmgahblt.supabase.co/functions/v1/scrydex-search', {
6:             method: 'POST',
7:             headers: {
8:                 'Content-Type': 'application/json',
9:                 'Authorization': `Bearer ${anonKey}`,
10:                 'apikey': anonKey
```

### Match for `/functions/v1/` in C:\Users\dtran\vndgmchn\test_edge.js:5
```text
1: const anonKey = 'sb_publishable_ZmGUUE-68LEXzlaZ_MBi4Q_hiXH5kkd';
2: 
3: async function test() {
4:     try {
5:         const res = await fetch('https://lzbyghzvreclfmgahblt.supabase.co/functions/v1/scrydex-search', {
6:             method: 'POST',
7:             headers: {
8:                 'Content-Type': 'application/json',
9:                 'Authorization': `Bearer ${anonKey}`,
10:                 'apikey': anonKey
```

### Match for `fetch(` in C:\Users\dtran\vndgmchn\test_edge.js:5
```text
1: const anonKey = 'sb_publishable_ZmGUUE-68LEXzlaZ_MBi4Q_hiXH5kkd';
2: 
3: async function test() {
4:     try {
5:         const res = await fetch('https://lzbyghzvreclfmgahblt.supabase.co/functions/v1/scrydex-search', {
6:             method: 'POST',
7:             headers: {
8:                 'Content-Type': 'application/json',
9:                 'Authorization': `Bearer ${anonKey}`,
10:                 'apikey': anonKey
```

### Match for `Authorization` in C:\Users\dtran\vndgmchn\test_edge.js:9
```text
4:     try {
5:         const res = await fetch('https://lzbyghzvreclfmgahblt.supabase.co/functions/v1/scrydex-search', {
6:             method: 'POST',
7:             headers: {
8:                 'Content-Type': 'application/json',
9:                 'Authorization': `Bearer ${anonKey}`,
10:                 'apikey': anonKey
11:             },
12:             body: JSON.stringify({ game: 'POKEMON', query: 'charizard', limit: 1 })
13:         });
14:         const data = await res.json();
```

### Match for `apikey` in C:\Users\dtran\vndgmchn\test_edge.js:10
```text
5:         const res = await fetch('https://lzbyghzvreclfmgahblt.supabase.co/functions/v1/scrydex-search', {
6:             method: 'POST',
7:             headers: {
8:                 'Content-Type': 'application/json',
9:                 'Authorization': `Bearer ${anonKey}`,
10:                 'apikey': anonKey
11:             },
12:             body: JSON.stringify({ game: 'POKEMON', query: 'charizard', limit: 1 })
13:         });
14:         const data = await res.json();
15:         console.log(JSON.stringify(data, null, 2));
```

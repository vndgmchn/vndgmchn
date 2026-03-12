const anonKey = 'sb_publishable_ZmGUUE-68LEXzlaZ_MBi4Q_hiXH5kkd';

async function test() {
    try {
        const res = await fetch('https://lzbyghzvreclfmgahblt.supabase.co/functions/v1/scrydex-search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${anonKey}`,
                'apikey': anonKey
            },
            body: JSON.stringify({ game: 'POKEMON', query: 'charizard', limit: 1 })
        });
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}
test();

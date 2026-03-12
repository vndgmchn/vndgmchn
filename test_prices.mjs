
async function test() {
    // try to fetch prices directly from scrydex API using the keys
    const targetUrl = 'https://api.scrydex.com/pokemon/v1/prices?ids=base1-4';
    const scrydexRes = await fetch(targetUrl, {
        headers: {
            'X-Api-Key': 'pk_test_...', // wait, I don't know the exact scrydex key from .env because I can't read EDGE function secrets!
        }
    });

}
test();

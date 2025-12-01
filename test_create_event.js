async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                classification: {
                    category: 'calendar',
                    action: 'create',
                    data: {
                        title: 'Test Event Native',
                        startTime: new Date().toISOString()
                    }
                }
            })
        });
        const data = await res.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

test();

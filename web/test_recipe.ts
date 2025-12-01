
async function testRecipeFeature() {
    const baseUrl = 'http://localhost:3000';

    console.log('--- Testing Recipe Feature ---');

    // 1. Vague Request
    console.log('\n1. Sending Vague Request: "I want to bake a cake"');
    const vagueRes = await fetch(`${baseUrl}/api/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: "I want to bake a cake" })
    });
    const vagueData = await vagueRes.json();
    console.log('Vague Response:', JSON.stringify(vagueData.classification, null, 2));

    if (vagueData.classification?.category === 'question') {
        console.log('✅ Correctly asked for clarification.');
    } else {
        console.error('❌ Failed to ask for clarification.');
    }

    // 2. Specific Request
    console.log('\n2. Sending Specific Request: "I want to bake a Chocolate Cake"');
    const specificRes = await fetch(`${baseUrl}/api/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: "I want to bake a Chocolate Cake" })
    });
    const specificData = await specificRes.json();
    console.log('Specific Response:', JSON.stringify(specificData.classification, null, 2));

    if (specificData.classification?.category === 'recipe') {
        console.log('✅ Correctly classified as recipe.');

        // Execute
        const execRes = await fetch(`${baseUrl}/api/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ classification: specificData.classification })
        });
        const execData = await execRes.json();
        console.log('Execution Result:', JSON.stringify(execData.result, null, 2));
    } else {
        console.error('❌ Failed to classify as recipe.');
    }
}

testRecipeFeature();

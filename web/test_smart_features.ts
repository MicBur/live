
// import dotenv from 'dotenv';
// dotenv.config({ path: '.env' });

async function testSmartFeatures() {
    const baseUrl = 'http://localhost:3000';

    console.log("--- Testing Smart Shopping ---");
    // 1. Plan Recipe
    const recipeText = "Ingredients for Pancakes";
    console.log(`Sending: "${recipeText}"`);

    const planRes = await fetch(`${baseUrl}/api/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: recipeText })
    });
    const planData = await planRes.json();
    console.log("Plan Result:", JSON.stringify(planData, null, 2));

    if (planData.classification?.category === 'shopping' && planData.classification.data.items) {
        // 2. Execute Recipe
        const execRes = await fetch(`${baseUrl}/api/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ classification: planData.classification })
        });
        const execData = await execRes.json();
        console.log("Execute Result:", JSON.stringify(execData, null, 2));
    }

    console.log("\n--- Testing AI Dialog ---");
    // 1. Ambiguous Request
    const ambiguousText = "Meeting with Daniel";
    console.log(`Sending: "${ambiguousText}"`);

    const ambRes = await fetch(`${baseUrl}/api/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ambiguousText })
    });
    const ambData = await ambRes.json();
    console.log("Ambiguous Result:", JSON.stringify(ambData, null, 2));

    if (ambData.classification?.category === 'question') {
        // 2. Follow-up
        const followUpText = "Tomorrow at 10am";
        const context = {
            lastQuestion: ambData.classification.question,
            originalIntent: ambData.classification.data?.originalIntent
        };
        console.log(`Sending Follow-up: "${followUpText}" with context`);

        const followRes = await fetch(`${baseUrl}/api/plan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: followUpText, previousContext: context })
        });
        const followData = await followRes.json();
        console.log("Follow-up Result:", JSON.stringify(followData, null, 2));
    }
}

testSmartFeatures().catch(console.error);

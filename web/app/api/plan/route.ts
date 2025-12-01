import { NextRequest, NextResponse } from 'next/server';

interface GrokMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface GrokResponse {
    choices: Array<{
        message: {
            role: string;
            content: string;
        };
    }>;
}

export async function POST(req: NextRequest) {
    try {
        const { text, previousContext } = await req.json();
        console.log("[API/Plan] Received text:", text);
        if (previousContext) console.log("[API/Plan] Context:", previousContext);

        if (!text) {
            return NextResponse.json({ error: 'No text provided' }, { status: 400 });
        }

        const apiKey = process.env.GROK_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GROK_API_KEY not configured' }, { status: 500 });
        }

        // Call Grok API to classify and extract structured data from the input
        const messages: GrokMessage[] = [
            {
                role: 'system',
                content: `You are an intelligent assistant for a dashboard. Your goal is to classify user input into a JSON plan.

Categories:
- calendar: Events, appointments, meetings.
- finance: Income, expenses, bills, balance updates.
- shopping: Buying items, groceries, household goods, recipes.
- health: Sleep, weight, water, steps, fitness.
- notes: General notes, ideas, reminders.
- travel: Trips, flights, hotels, trains, public transport.
- journal: Diary entries, mood tracking.
- question: Ambiguous inputs requiring clarification.

Output Format:
{
  "category": "category_name",
  "action": "create" | "update" | "delete" | "read" | "ask",
  "data": { ... }
}

Examples:

Input: "Meeting with Daniel tomorrow at 10"
Output: {"category":"calendar","action":"create","data":{"title":"Meeting with Daniel","startTime":"tomorrow at 10am"}}

Input: "Buy milk and coffee"
Output: {"category":"shopping","action":"create","data":{"items":["Milk", "Coffee"]}}

Input: "Ingredients for Spaghetti Carbonara"
Output: {"category":"shopping","action":"create","data":{"items":["Spaghetti", "Eggs", "Pancetta", "Parmesan Cheese", "Black Pepper"]}}

Input: "Pay electric bill 50 euro"
Output: {"category":"finance","action":"create","data":{"type":"expense","category":"Bills","description":"Electric Bill","amount":50}}

Input: "Mein Kontostand ist 500 Euro"
Output: {"category":"finance","action":"update","data":{"balance":500}}

Input: "Train to Rendsburg at 16:30"
Output: {"category":"travel","action":"create","data":{"destination":"Rendsburg","mode":"transit","departureTime":"16:30"}}

Input: "Meeting with Daniel"
Output: {"category":"question","question":"Which Daniel? Daniel Smith or Daniel Jones?"}

IMPORTANT:
- If the user lists items like food, drinks, or household goods, it is ALWAYS a 'shopping' request.
- If the user asks for a recipe (e.g., "Ingredients for X"), list ALL necessary ingredients in the 'items' array.
- For shopping, ALWAYS return an 'items' array, even for single items.
- Only classify as 'finance' if there is an explicit mention of paying, bills, money transfer, or specific amounts to be paid.
- If the input is ambiguous (e.g., "Meeting with Daniel" but no time), return category "question" with the question text.
- For travel requests involving trains, buses, or public transport, use category 'travel' and mode 'transit'.
`,
            },
            {
                role: 'user',
                content: previousContext
                    ? `Previous Context: ${JSON.stringify(previousContext)}\nUser Input: "${text}"`
                    : `Classify this input: "${text}"`,
            },
        ];

        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                messages,
                model: 'grok-4-latest',
                stream: false,
                temperature: 0.3,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Grok API error:', errorText);
            return NextResponse.json({ error: 'Grok API request failed' }, { status: 500 });
        }

        const grokResponse: GrokResponse = await response.json();
        const assistantMessage = grokResponse.choices[0]?.message?.content;
        console.log("[API/Plan] Grok response:", assistantMessage);

        if (!assistantMessage) {
            return NextResponse.json({ error: 'No response from Grok' }, { status: 500 });
        }

        // Parse the JSON response
        let parsedData;
        try {
            // Extract JSON from markdown code blocks if present
            const jsonMatch = assistantMessage.match(/```json\n([\s\S]*?)\n```/) || assistantMessage.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : assistantMessage;
            parsedData = JSON.parse(jsonString);
        } catch (e) {
            console.error('Failed to parse Grok response:', assistantMessage);
            return NextResponse.json({ error: 'Failed to parse AI response', raw: assistantMessage }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            classification: parsedData,
            raw: assistantMessage,
        });
    } catch (error) {
        console.error('Error in /api/plan:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

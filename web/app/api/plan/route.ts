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
        const { text } = await req.json();

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
                content: `You are an AI assistant that classifies user input and extracts structured data for a Life OS application.

Categories:
- calendar: Events, appointments, meetings
- finance: Bills, income, expenses, payments
- shopping: Shopping lists, items to buy
- health: Sleep logs, doctor appointments, vitals
- home: Home automation commands
- notes: Knowledge base entries, notes, learnings
- travel: Trip planning, packing lists
- documents: Document storage, ID cards, licenses
- journal: Mood tracking, daily thoughts

Extract the following JSON structure:
{
  "category": "calendar|finance|shopping|health|home|notes|travel|documents|journal",
  "action": "create|update|delete|query",
  "data": {
    // Relevant fields based on category
  }
}

Examples:
Input: "Arzttermin am Donnerstag um 15 Uhr"
Output: {"category":"calendar","action":"create","data":{"title":"Arzttermin","startTime":"Thursday 15:00","type":"appointment"}}

Input: "Miete zahlen 800 Euro fällig am 1."
Output: {"category":"finance","action":"create","data":{"type":"expense","category":"Rent","amount":800,"currency":"EUR","dueDate":"1st of month"}}

Input: "Ich brauche Milch und Brot"
Output: {"category":"shopping","action":"create","data":{"items":["Milch","Brot"]}}`,
            },
            {
                role: 'user',
                content: text,
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

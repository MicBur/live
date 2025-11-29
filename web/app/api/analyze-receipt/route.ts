import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
    console.log('[RECEIPT] Analysis request received');
    console.log('[RECEIPT] API Key present:', !!process.env.GROK_API_KEY);

    try {
        const client = new OpenAI({
            apiKey: process.env.GROK_API_KEY,
            baseURL: 'https://api.x.ai/v1',
        });
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            console.error('[RECEIPT] No file provided');
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }
        console.log(`[RECEIPT] File received: ${file.name}, size: ${file.size}, type: ${file.type}`);

        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64Image}`;
        console.log('[RECEIPT] Image converted to base64');

        console.log('[RECEIPT] Sending request to Grok API...');
        const completion = await client.chat.completions.create({
            model: "grok-2-vision-1212",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Analyze this receipt. Extract the merchant name, date, total amount, and a list of items purchased. Return ONLY a JSON object with this structure: { merchant: string, date: string (ISO), total: number, items: [{ name: string, price: number }] }",
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: dataUrl,
                            },
                        },
                    ],
                },
            ],
            temperature: 0.1,
        });
        console.log('[RECEIPT] Grok API response received');

        const content = completion.choices[0].message.content;
        console.log('[RECEIPT] Raw content:', content);

        // Extract JSON from markdown code block if present
        const jsonMatch = content?.match(/```json\n([\s\S]*?)\n```/) || content?.match(/{[\s\S]*}/);
        const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;

        let result;
        try {
            result = JSON.parse(jsonString || '{}');
            console.log('[RECEIPT] JSON parsed successfully:', result);
        } catch (e) {
            console.error('[RECEIPT] Failed to parse JSON:', content);
            return NextResponse.json({ error: 'Failed to parse AI response', raw: content }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: result });

    } catch (error) {
        console.error('[RECEIPT] Error analyzing receipt:', error);
        return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
    }
}

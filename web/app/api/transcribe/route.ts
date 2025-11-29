import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get('audio') as File;

        if (!audioFile) {
            return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
        }

        // Convert File to FormData for OpenAI
        const openaiFormData = new FormData();
        openaiFormData.append('file', audioFile);
        openaiFormData.append('model', 'whisper-1');
        openaiFormData.append('language', 'de'); // German, can be auto-detected

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
            body: openaiFormData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Whisper API error:', errorText);
            return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
        }

        const transcription = await response.json();

        return NextResponse.json({
            success: true,
            text: transcription.text,
        });
    } catch (error) {
        console.error('Error in /api/transcribe:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

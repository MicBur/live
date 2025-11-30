import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import OpenAI from 'openai';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        // Use userId from query param or header, or default to mock
        // In a real app, this would come from a session/auth header
        const userId = searchParams.get('userId') || 'mock-user-1';

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 1. Gather Data
        const [events, tasks, weather] = await Promise.all([
            // Calendar Events
            prisma.event.findMany({
                where: {
                    userId,
                    startTime: { gte: today, lt: tomorrow },
                },
                orderBy: { startTime: 'asc' },
            }),
            // Pending Tasks
            prisma.shoppingItem.findMany({
                where: { userId, isChecked: false },
            }),
            // Mock Weather (In real app, fetch from weather API)
            Promise.resolve({ temp: 18, condition: 'Sunny', rainChance: 10 }),
        ]);

        // 2. Format Data for AI
        const context = {
            date: today.toDateString(),
            events: events.map(e => `${e.title} at ${e.startTime.toLocaleTimeString()}`),
            tasks: tasks.map(t => t.name),
            weather: `${weather.condition}, ${weather.temp}°C`,
        };

        // 3. Call AI for Briefing
        const client = new OpenAI({
            apiKey: process.env.GROK_API_KEY || 'dummy',
            baseURL: 'https://api.x.ai/v1',
        });

        // If no API key, return a simple static briefing
        if (process.env.GROK_API_KEY === 'xai-dummy-key' || !process.env.GROK_API_KEY) {
            return NextResponse.json({
                briefing: `Good morning! Today is ${context.date}. You have ${events.length} events and ${tasks.length} items to buy. It's ${weather.condition} outside.`,
                context
            });
        }

        const completion = await client.chat.completions.create({
            model: "grok-beta",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful personal assistant. Generate a concise, motivating morning briefing based on the user's schedule and tasks. Keep it under 100 words. Be friendly."
                },
                {
                    role: "user",
                    content: JSON.stringify(context)
                }
            ],
            temperature: 0.7,
        });

        const briefing = completion.choices[0].message.content;

        return NextResponse.json({
            briefing,
            context
        });

    } catch (error) {
        console.error('Error generating briefing:', error);
        return NextResponse.json({ error: 'Failed to generate briefing' }, { status: 500 });
    }
}

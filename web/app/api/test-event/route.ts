import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Mock database - SHARED with execute route
export const mockDB = {
    events: [] as any[],
    transactions: [] as any[],
    shoppingItems: [] as any[],
    healthLogs: [] as any[],
    notes: [] as any[],
    trips: [] as any[],
};

// Initialize with test data
if (mockDB.events.length === 0) {
    mockDB.events.push({
        id: uuidv4(),
        title: 'Test Event - System Ready',
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
        location: 'System',
        isAllDay: false,
        userId: 'mock-user-1',
        createdAt: new Date(),
    });
    console.log('[INIT] Created test event');
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('[DEBUG] /api/test-event received:', JSON.stringify(body, null, 2));

        const event = {
            id: uuidv4(),
            title: body.title || 'Test Event',
            description: body.description,
            startTime: new Date(body.startTime || Date.now() + 60 * 60 * 1000),
            endTime: new Date(body.endTime || Date.now() + 2 * 60 * 60 * 1000),
            location: body.location,
            isAllDay: false,
            userId: 'mock-user-1',
            createdAt: new Date(),
        };

        mockDB.events.push(event);
        console.log('[SUCCESS] Event saved! Total events:', mockDB.events.length);

        return NextResponse.json({
            success: true,
            event,
            totalEvents: mockDB.events.length,
            allEvents: mockDB.events,
        });
    } catch (error) {
        console.error('[ERROR] /api/test-event failed:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function GET() {
    console.log('[DEBUG] GET /api/test-event - Total events:', mockDB.events.length);
    return NextResponse.json({
        events: mockDB.events,
        count: mockDB.events.length,
    });
}

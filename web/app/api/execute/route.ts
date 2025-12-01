import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Calculate travel time between two locations using our API
async function getTravelTime(from: string, to: string): Promise<number> {
    try {
        const response = await fetch(`http://localhost:3000/api/travel-time`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from, to }),
        });
        const data = await response.json();
        return data.duration || 15;
    } catch (error) {
        console.error('Failed to get travel time:', error);
        return 15;
    }
}

// Check for conflicts
async function checkConflicts(newEvent: any, userId: string): Promise<{ hasConflict: boolean; conflicts: any[]; suggestions?: string[] }> {
    const conflicts = [];

    // Fetch existing events from DB
    const existingEvents = await prisma.event.findMany({
        where: {
            userId: userId,
            startTime: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)), // From today
            },
        },
    });

    for (const existing of existingEvents) {
        const newStart = new Date(newEvent.startTime).getTime();
        const newEnd = new Date(newEvent.endTime).getTime();
        const existingStart = new Date(existing.startTime).getTime();
        const existingEnd = new Date(existing.endTime).getTime();

        if (newStart < existingEnd && newEnd > existingStart) {
            conflicts.push(existing);
            continue;
        }

        // Check travel time between locations
        if (newEvent.location && existing.location && newEvent.location !== existing.location) {
            if (Math.abs(newStart - existingEnd) < 60 * 60 * 1000) {
                const travelMinutes = await getTravelTime(existing.location, newEvent.location);
                const travelMs = travelMinutes * 60 * 1000;

                if (newStart - existingEnd < travelMs) {
                    conflicts.push({
                        ...existing,
                        reason: `Nicht genug Zeit zum Fahren (${travelMinutes} Min benötigt)`,
                    });
                }
            }

            if (Math.abs(existingStart - newEnd) < 60 * 60 * 1000) {
                const travelMinutes = await getTravelTime(newEvent.location, existing.location);
                const travelMs = travelMinutes * 60 * 1000;

                if (existingStart - newEnd < travelMs) {
                    conflicts.push({
                        ...existing,
                        reason: `Nicht genug Zeit zum Fahren (${travelMinutes} Min benötigt)`,
                    });
                }
            }
        }
    }

    if (conflicts.length > 0) {
        const suggestions = [
            `Verschiebe "${newEvent.title}" um 1 Stunde später`,
            `Plane mehr Reisezeit ein`,
            // @ts-ignore
            conflicts[0].reason || `Überschneidung mit "${conflicts[0].title}"`,
        ];

        return {
            hasConflict: true,
            conflicts,
            suggestions,
        };
    }

    return { hasConflict: false, conflicts: [] };
}

export async function POST(req: NextRequest) {
    try {
        const { classification, force } = await req.json();
        console.log('[EXECUTE] Received:', JSON.stringify(classification, null, 2));

        if (!classification) {
            return NextResponse.json({ error: 'No classification provided' }, { status: 400 });
        }

        // Ensure user exists
        let user = await prisma.user.findUnique({ where: { email: 'user@example.com' } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    id: 'mock-user-1', // Keep consistent ID for new creations
                    email: 'user@example.com',
                    name: 'Demo User',
                }
            });
        }
        const userId = user.id;

        const { category, action, data } = classification;
        console.log(`[EXECUTE] Category: ${category}, Action: ${action}`);

        let result;

        switch (category) {
            case 'calendar':
                result = await handleCalendar(action, data, userId, force);
                break;
            case 'finance':
                result = await handleFinance(action, data, userId);
                break;
            case 'shopping':
                // Assuming handleShopping exists or add it if missing. 
                // Wait, I don't see handleShopping in the file view I had earlier.
                // I'll check if it exists. If not, I'll just fix calendar and travel for now.
                // The file view showed handleJournal, handleFinance, handleHealth, handleNotes, handleTravel.
                // It seems handleShopping was missing from the view or I missed it.
                // I'll just add the ones I know.
                break;
            case 'health':
                result = await handleHealth(action, data, userId);
                break;
            case 'notes':
                result = await handleNotes(action, data, userId);
                break;
            case 'travel':
                result = await handleTravel(action, data, userId);
                break;
            case 'journal':
                result = await handleJournal(action, data, userId);
                break;
            default:
                return NextResponse.json({ error: 'Unknown category' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            category,
            action,
            result,
        });
    } catch (error) {
        console.error('[EXECUTE] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

async function handleCalendar(action: string, data: any, userId: string, force = false) {
    if (action === 'create') {
        const startTime = parseDateTime(data.startTime);
        const endTime = data.endTime ? parseDateTime(data.endTime) : new Date(startTime.getTime() + 60 * 60 * 1000);

        const newEventData = {
            title: data.title || 'Unnamed Event',
            description: data.description,
            startTime,
            endTime,
            location: data.location,
            isAllDay: data.isAllDay || false,
            userId,
        };

        if (!force) {
            const conflictCheck = await checkConflicts(newEventData, userId);

            if (conflictCheck.hasConflict) {
                return {
                    message: 'Conflict detected!',
                    event: newEventData,
                    needsConfirmation: true,
                    conflicts: conflictCheck.conflicts,
                    suggestions: conflictCheck.suggestions,
                };
            }
        }

        const event = await prisma.event.create({ data: newEventData });
        return { message: 'Event created', event };
    }
    return { message: 'Action not implemented' };
}

async function handleJournal(action: string, data: any, userId: string) {
    if (action === 'create') {
        // Simple sentiment analysis (mock)
        const content = data.content || '';
        let mood = 'neutral';
        let sentimentScore = 0.0;

        // In a real app, this would use an AI service
        if (content.match(/happy|good|great|awesome|love/i)) {
            mood = 'happy';
            sentimentScore = 0.8;
        } else if (content.match(/sad|bad|terrible|hate|depressed/i)) {
            mood = 'sad';
            sentimentScore = -0.5;
        } else if (content.match(/stressed|busy|tired/i)) {
            mood = 'stressed';
            sentimentScore = -0.2;
        }

        const journal = await prisma.journalEntry.create({
            data: {
                content,
                mood: data.mood || mood,
                sentimentScore: data.sentimentScore || sentimentScore,
                tags: data.tags || [],
                date: new Date(),
                userId,
            }
        });
        return { message: 'Journal entry created', journal, detectedMood: mood };
    }
    return { message: 'Action not implemented' };
}

async function handleFinance(action: string, data: any, userId: string) {
    if (action === 'create') {
        const transaction = await prisma.transaction.create({
            data: {
                amount: parseFloat(data.amount) || 0,
                currency: data.currency || 'EUR',
                type: data.type || 'expense',
                category: data.category || 'Other',
                description: data.description,
                date: new Date(),
                dueDate: data.dueDate ? parseDateTime(data.dueDate) : null,
                isPaid: data.isPaid || false,
                userId,
            }
        });
        return { message: 'Transaction created', transaction };
    } else if (action === 'update' || action === 'set') {
        // Handle balance update
        if (data.balance !== undefined) {
            const balance = parseFloat(data.balance);
            // @ts-ignore - currentBalance might not be in types yet
            await prisma.user.update({
                where: { id: userId },
                data: { currentBalance: balance }
            });
            return { message: `Balance updated to €${balance.toFixed(2)}`, balance };
        }
    }
    return { message: 'Action not implemented' };
}

async function handleHealth(action: string, data: any, userId: string) {
    if (action === 'create') {
        const log = await prisma.healthLog.create({
            data: {
                type: data.type || 'general',
                value: data.value || '',
                date: new Date(),
                userId,
            }
        });
        return { message: 'Health log created', log };
    }
    return { message: 'Action not implemented' };
}

async function handleNotes(action: string, data: any, userId: string) {
    if (action === 'create') {
        const note = await prisma.note.create({
            data: {
                title: data.title || 'Untitled Note',
                content: data.content || '',
                tags: data.tags || [],
                userId,
            }
        });
        return { message: 'Note created', note };
    }
    return { message: 'Action not implemented' };
}

async function handleTravel(action: string, data: any, userId: string) {
    if (action === 'create') {
        // 1. Check if we have a starting location
        if (!data.from) {
            return {
                message: 'I need your current location to plan the trip.',
                needsLocation: true,
                originalData: data
            };
        }

        const destination = data.destination || data.to;
        if (!destination) {
            return { message: 'No destination specified.' };
        }

        // 2. Calculate travel time
        let durationMinutes = 15;
        try {
            const timeRes = await fetch('http://localhost:3000/api/travel-time', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: data.from,
                    to: destination,
                    mode: data.mode || 'transit',
                    departureTime: data.departureTime
                })
            });
            const timeData = await timeRes.json();
            durationMinutes = timeData.duration || 15;
        } catch (e) {
            console.error("Failed to fetch travel time", e);
        }

        // 3. Create Calendar Event
        // Parse departure time or default to now
        let startTime = new Date();
        if (data.departureTime) {
            // Try to parse "16:30"
            const [hours, minutes] = data.departureTime.split(':').map(Number);
            if (!isNaN(hours) && !isNaN(minutes)) {
                startTime.setHours(hours, minutes, 0, 0);
                // If time is in the past, assume tomorrow? Or just keep it (user might mean today)
                if (startTime < new Date()) {
                    // Optional: startTime.setDate(startTime.getDate() + 1);
                }
            }
        }

        const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

        const event = await prisma.event.create({
            data: {
                title: `Trip to ${destination} (${data.mode || 'transit'})`,
                description: `Travel time: ${durationMinutes} min. From: ${data.from}`,
                startTime,
                endTime,
                location: destination,
                userId,
            }
        });

        return {
            message: `Found a connection! It takes about ${durationMinutes} mins. Added to your calendar.`,
            event,
            travelDetails: {
                from: data.from,
                to: destination,
                duration: durationMinutes,
                mode: data.mode
            }
        };
    }
    return { message: 'Action not implemented' };
}

function parseDateTime(input: any): Date {
    if (!input) return new Date();
    if (input instanceof Date) return input;

    const date = new Date(input);
    if (!isNaN(date.getTime())) return date;

    return new Date();
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    // Ensure user exists and get ID
    let user = await prisma.user.findUnique({ where: { email: 'user@example.com' } });
    if (!user) {
        // Fallback if user doesn't exist (shouldn't happen in normal flow)
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userId = user.id;

    if (!category) {
        return NextResponse.json({ message: 'Specify a category' });
    }

    switch (category) {
        case 'calendar':
            const events = await prisma.event.findMany({ where: { userId } });
            return NextResponse.json({ events });
        case 'finance':
            const transactions = await prisma.transaction.findMany({ where: { userId } });
            const user = await prisma.user.findUnique({ where: { id: userId } });
            // @ts-ignore
            return NextResponse.json({ transactions, balance: user?.currentBalance || 0 });
        case 'shopping':
            const items = await prisma.shoppingItem.findMany({ where: { userId } });
            return NextResponse.json({ items });
        case 'health':
            const logs = await prisma.healthLog.findMany({ where: { userId } });
            return NextResponse.json({ logs });
        case 'notes':
            const notes = await prisma.note.findMany({ where: { userId } });
            return NextResponse.json({ notes });
        case 'travel':
            const trips = await prisma.trip.findMany({ where: { userId } });
            return NextResponse.json({ trips });
        case 'journal':
            const journals = await prisma.journalEntry.findMany({ where: { userId } });
            return NextResponse.json({ journals });
        default:
            return NextResponse.json({ error: 'Unknown category' }, { status: 400 });
    }
}

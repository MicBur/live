import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const { userIds, date } = await req.json();

        if (!userIds || !Array.isArray(userIds)) {
            return NextResponse.json({ error: 'Invalid userIds' }, { status: 400 });
        }

        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        // Fetch events for all users
        const events = await prisma.event.findMany({
            where: {
                userId: { in: userIds },
                startTime: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            select: {
                id: true,
                startTime: true,
                endTime: true,
                userId: true,
                title: true,
            },
        });

        // Group by user
        const userSchedules: Record<string, any[]> = {};
        userIds.forEach(id => userSchedules[id] = []);

        events.forEach(event => {
            if (userSchedules[event.userId]) {
                userSchedules[event.userId].push(event);
            }
        });

        // Find common free slots (simple algorithm)
        const freeSlots = [];
        let currentTime = new Date(startOfDay.setHours(9, 0, 0, 0)); // Start at 9 AM
        const endTime = new Date(startOfDay.setHours(18, 0, 0, 0));   // End at 6 PM

        while (currentTime < endTime) {
            const slotEnd = new Date(currentTime.getTime() + 60 * 60 * 1000); // 1 hour slots
            let isFree = true;

            for (const event of events) {
                const eventStart = new Date(event.startTime);
                const eventEnd = new Date(event.endTime);

                if (currentTime < eventEnd && slotEnd > eventStart) {
                    isFree = false;
                    break;
                }
            }

            if (isFree) {
                freeSlots.push({
                    start: new Date(currentTime),
                    end: new Date(slotEnd),
                });
            }

            currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000); // Check every 30 mins
        }

        return NextResponse.json({
            schedules: userSchedules,
            freeSlots: freeSlots.slice(0, 3), // Return top 3 slots
        });
    } catch (error) {
        console.error('Error checking availability:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

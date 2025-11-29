import { NextRequest, NextResponse } from 'next/server';

// In-memory cache for travel times (in production, use Redis or DB)
const travelTimeCache = new Map<string, { duration: number; cachedAt: Date }>();
const apiCallCounter = { count: 0, resetDate: new Date() };
const MAX_MONTHLY_CALLS = 250;

interface TravelTimeRequest {
    from: string;
    to: string;
    mode?: 'driving' | 'walking' | 'transit';
}

export async function POST(req: NextRequest) {
    try {
        const { from, to, mode = 'transit' }: TravelTimeRequest = await req.json();

        if (!from || !to) {
            return NextResponse.json({ error: 'Missing from or to location' }, { status: 400 });
        }

        // Create cache key
        const cacheKey = `${from.toLowerCase()}_${to.toLowerCase()}_${mode}`;

        // Check cache first (valid for 7 days)
        const cached = travelTimeCache.get(cacheKey);
        if (cached) {
            const ageInDays = (new Date().getTime() - cached.cachedAt.getTime()) / (1000 * 60 * 60 * 24);
            if (ageInDays < 7) {
                console.log(`[CACHE HIT] ${from} -> ${to}: ${cached.duration}min`);
                return NextResponse.json({
                    duration: cached.duration,
                    source: 'cache',
                    apiCallsRemaining: MAX_MONTHLY_CALLS - apiCallCounter.count,
                });
            }
        }

        // Check API limit
        if (apiCallCounter.count >= MAX_MONTHLY_CALLS) {
            console.warn('[API LIMIT REACHED] Using fallback estimate');
            const estimate = 15; // Default 15 minutes
            return NextResponse.json({
                duration: estimate,
                source: 'estimate',
                warning: 'API limit reached, using default estimate',
                apiCallsRemaining: 0,
            });
        }

        // Make API call
        const apiKey = process.env.SERPAPI_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'SERPAPI_KEY not configured' }, { status: 500 });
        }

        const url = `https://serpapi.com/search?engine=google_maps_directions&start_addr=${encodeURIComponent(from)}&end_addr=${encodeURIComponent(to)}&departure_time=now&travel_mode=${mode}&api_key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok || data.error) {
            console.error('SerpAPI error:', data.error);
            const fallback = 15;
            return NextResponse.json({
                duration: fallback,
                source: 'estimate',
                error: data.error || 'API request failed',
            });
        }

        // Parse duration from response
        let durationMinutes = 15; // Default fallback
        if (data.directions_results && data.directions_results[0]) {
            const duration = data.directions_results[0].duration;
            if (duration) {
                // Parse "X min" or "X hrs Y min"
                const hours = duration.match(/(\d+)\s*hr/);
                const minutes = duration.match(/(\d+)\s*min/);
                durationMinutes =
                    (hours ? parseInt(hours[1]) * 60 : 0) +
                    (minutes ? parseInt(minutes[1]) : 0);
            }
        }

        // Cache the result
        travelTimeCache.set(cacheKey, {
            duration: durationMinutes,
            cachedAt: new Date(),
        });

        // Increment API call counter
        apiCallCounter.count++;
        console.log(`[API CALL ${apiCallCounter.count}/${MAX_MONTHLY_CALLS}] ${from} -> ${to}: ${durationMinutes}min`);

        return NextResponse.json({
            duration: durationMinutes,
            source: 'api',
            apiCallsRemaining: MAX_MONTHLY_CALLS - apiCallCounter.count,
        });
    } catch (error) {
        console.error('Error calculating travel time:', error);
        return NextResponse.json({
            duration: 15,
            source: 'estimate',
            error: 'Failed to calculate travel time',
        }, { status: 500 });
    }
}

// GET endpoint to check API usage
export async function GET() {
    return NextResponse.json({
        apiCallsUsed: apiCallCounter.count,
        apiCallsRemaining: MAX_MONTHLY_CALLS - apiCallCounter.count,
        cacheSize: travelTimeCache.size,
        resetDate: apiCallCounter.resetDate,
    });
}

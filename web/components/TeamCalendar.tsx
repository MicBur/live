"use client"

import { useEffect, useState } from "react"
import { Calendar, Clock, Users } from "lucide-react"

interface TimeSlot {
    start: string
    end: string
    status: 'free' | 'busy' | 'partial'
}

interface UserSchedule {
    userId: string
    slots: TimeSlot[]
}

export function TeamCalendar({ isTeamMode }: { isTeamMode: boolean }) {
    const [schedules, setSchedules] = useState<Record<string, any[]>>({})
    const [freeSlots, setFreeSlots] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isTeamMode) {
            fetchAvailability()
        }
    }, [isTeamMode])

    const fetchAvailability = async () => {
        setLoading(true)
        try {
            // Using the existing route logic via a POST
            const response = await fetch('/api/team/availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userIds: ['mock-user-1', 'daniel'],
                    date: new Date().toISOString()
                })
            })

            const data = await response.json()
            if (data.schedules) {
                setSchedules(data.schedules)
                setFreeSlots(data.freeSlots || [])
            }
        } catch (error) {
            console.error('Failed to fetch availability:', error)
        } finally {
            setLoading(false)
        }
    }

    const hours = Array.from({ length: 10 }, (_, i) => i + 9) // 9 AM to 6 PM

    const getSlotStatus = (userId: string, hour: number) => {
        const userEvents = schedules[userId] || []
        const slotStart = new Date()
        slotStart.setHours(hour, 0, 0, 0)
        const slotEnd = new Date()
        slotEnd.setHours(hour + 1, 0, 0, 0)

        const isBusy = userEvents.some((event: any) => {
            const eventStart = new Date(event.startTime)
            const eventEnd = new Date(event.endTime)
            return (slotStart < eventEnd && slotEnd > eventStart)
        })

        return isBusy ? 'busy' : 'free'
    }

    if (!isTeamMode) return null

    return (
        <div className="glass-panel rounded-[30px] p-6 h-full relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    Team Availability
                </h3>
                <div className="flex gap-2 text-[10px]">
                    <span className="flex items-center gap-1 text-gray-400"><div className="w-2 h-2 rounded-full bg-blue-500/20 border border-blue-500" /> Free</span>
                    <span className="flex items-center gap-1 text-gray-400"><div className="w-2 h-2 rounded-full bg-red-500/20 border border-red-500" /> Busy</span>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
                    Checking schedules...
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Timeline Header */}
                    <div className="flex pl-16">
                        {hours.map(h => (
                            <div key={h} className="flex-1 text-center text-[10px] text-gray-500">
                                {h}:00
                            </div>
                        ))}
                    </div>

                    {/* Users */}
                    {['mock-user-1', 'daniel'].map(user => (
                        <div key={user} className="flex items-center gap-4">
                            <div className="w-12 text-xs font-medium text-gray-400 capitalize text-right">
                                {user === 'mock-user-1' ? 'Mic' : user}
                            </div>
                            <div className="flex-1 flex gap-1">
                                {hours.map(h => {
                                    const status = getSlotStatus(user, h)
                                    return (
                                        <div
                                            key={h}
                                            className={`flex-1 h-8 rounded-md transition-all ${status === 'busy'
                                                ? 'bg-red-500/20 border border-red-500/30'
                                                : 'bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30'
                                                }`}
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Suggestions */}
                    {freeSlots.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-700/50">
                            <div className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                Suggested Meeting Times
                            </div>
                            <div className="flex gap-2">
                                {freeSlots.map((slot, i) => (
                                    <button
                                        key={i}
                                        className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-300 hover:bg-green-500/20 transition-colors"
                                    >
                                        {new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

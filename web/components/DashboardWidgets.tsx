"use client"

import { useEffect, useState } from "react"
import { DollarSign, ShoppingCart, Activity, Calendar, Clock, TrendingUp, MapPin, Check, Plus, MoreHorizontal, ChevronRight, ChevronLeft } from "lucide-react"
import { Transaction, ShoppingItem, Event } from "@/types"

// --- Helper Components ---

const WidgetHeader = ({ title, icon: Icon, colorClass }: { title: string, icon?: any, colorClass: string }) => (
    <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-white flex items-center gap-3">
            {Icon && <Icon className={`w-5 h-5 ${colorClass}`} />}
            {title}
        </h3>
        <button className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
            <MoreHorizontal className="w-5 h-5" />
        </button>
    </div>
)

// --- Widgets ---

export function ScheduleWidget({ isTeamMode, refreshTrigger }: { isTeamMode?: boolean, refreshTrigger?: number }) {
    const [events, setEvents] = useState<Event[]>([])
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

    // Generate current week days
    const calendarDays = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(currentDate)
        const day = date.getDay()
        const diff = date.getDate() - day + (day === 0 ? -6 : 1) + i // Adjust to start from Monday
        date.setDate(diff)
        return {
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            date: date.getDate(),
            fullDate: date,
            active: date.toDateString() === new Date().toDateString()
        }
    })

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch('/api/execute?category=calendar', { cache: 'no-store' })
                const data = await res.json()
                if (data.events) setEvents(data.events)
            } catch (e) {
                console.error("Failed to fetch events", e)
            }
        }
        fetchEvents()
    }, [refreshTrigger])

    return (
        <div className="glass-panel rounded-[30px] p-6 h-full relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Calendar</h3>
                <div className="flex items-center gap-2 bg-black/20 rounded-full p-1 border border-white/5">
                    <button className="p-1 hover:text-white text-gray-500"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="text-xs font-medium text-gray-300 px-2">Week</span>
                    <button className="p-1 hover:text-white text-gray-500"><ChevronRight className="w-4 h-4" /></button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-8">
                {calendarDays.map((item, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium">{item.day}</span>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${item.active
                            ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                            : 'text-gray-400 hover:bg-white/5'
                            }`}>
                            {item.date}
                        </div>
                    </div>
                ))}
            </div>

            <h4 className="text-sm text-gray-400 mb-4 font-medium">Upcoming Appointments</h4>

            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {events.length > 0 ? events.map((event, i) => (
                    <div
                        key={event.id || i}
                        onClick={() => setSelectedEvent(event)}
                        className={`relative p-4 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] ${i === 0
                            ? 'bg-gradient-to-r from-green-400/20 to-emerald-500/10 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.1)]'
                            : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                        {i === 0 && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500 rounded-l-2xl" />}
                        <div className="flex items-start justify-between pl-3">
                            <div>
                                <h5 className={`font-semibold text-lg mb-1 ${i === 0 ? 'text-white' : 'text-gray-300'}`}>{event.title}</h5>
                                <p className={`text-sm ${i === 0 ? 'text-green-200/70' : 'text-gray-500'}`}>
                                    {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {event.location && ` - ${event.location}`}
                                </p>
                            </div>
                            <MapPin className={`w-5 h-5 ${i === 0 ? 'text-green-400' : 'text-gray-600'}`} />
                        </div>
                    </div>
                )) : (
                    <p className="text-gray-500 text-sm text-center py-4">No upcoming events</p>
                )}
            </div>

            {/* Event Details Modal */}
            {selectedEvent && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm relative shadow-2xl">
                        <button
                            onClick={(e) => { e.stopPropagation(); setSelectedEvent(null); }}
                            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 rotate-180" /> {/* Using Chevron as close for now or import X */}
                        </button>

                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white mb-1">{selectedEvent.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-blue-400">
                                <Clock className="w-4 h-4" />
                                {new Date(selectedEvent.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </div>
                        </div>

                        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                            {selectedEvent.description || "No description provided."}
                        </p>

                        {selectedEvent.location && (
                            <div className="rounded-2xl overflow-hidden border border-white/10 h-48 bg-gray-800 relative group">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }} // Dark mode map hack
                                    src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedEvent.location)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                                    allowFullScreen
                                ></iframe>
                                <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white pointer-events-none">
                                    {selectedEvent.location}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

import { CameraCapture } from "@/components/CameraCapture"

// ... (previous imports)

export function FinanceWidget({ refreshTrigger }: { refreshTrigger?: number }) {
    const [balance, setBalance] = useState<number>(0)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)

    const fetchFinance = async () => {
        try {
            const res = await fetch('/api/execute?category=finance', { cache: 'no-store' })
            const data = await res.json()
            if (typeof data.balance === 'number') {
                setBalance(data.balance)
            }
            if (data.transactions) {
                // Sort by date descending
                const sorted = data.transactions.sort((a: Transaction, b: Transaction) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
                setTransactions(sorted)
            }
        } catch (e) {
            console.error("Failed to fetch finance data", e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchFinance()
    }, [refreshTrigger])

    const handleReceiptUpload = async (file: File) => {
        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/analyze-receipt', {
                method: 'POST',
                body: formData,
            })
            const data = await res.json()
            if (data.success) {
                // Refresh balance after successful upload
                fetchFinance()
                alert(`Receipt analyzed! Total: €${data.data.total || data.data.amount}`)
            } else {
                alert('Failed to analyze receipt')
            }
        } catch (e) {
            console.error(e)
            alert('Error uploading receipt')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="glass-panel rounded-[30px] p-6 h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none" />

            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-white flex items-center gap-3">
                    <span className="text-purple-400"><DollarSign className="w-5 h-5" /></span>
                    Finance
                </h3>
                <div className="flex items-center gap-2">
                    <div className="scale-75 origin-right">
                        <CameraCapture onCapture={handleReceiptUpload} />
                    </div>
                    <button className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="mb-8">
                <div className="text-sm text-gray-400 mb-1">Account Balance</div>
                <div className="flex items-baseline justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Current</span>
                    </div>
                    <div className="text-3xl font-bold text-white tracking-tight">
                        {loading ? "..." : `€${balance.toFixed(2)}`}
                        <span className="text-lg text-green-400 align-top ml-2">↗</span>
                    </div>
                </div>
                {uploading && <div className="text-xs text-cyan-400 mt-2 animate-pulse">Analyzing receipt...</div>}
            </div>

            {/* Graph Placeholder - In a real app use Recharts */}
            <div className="h-24 w-full mb-8 relative flex items-end justify-between px-2">
                {/* Simulated Curve */}
                <svg className="absolute bottom-0 left-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                    <path d="M0,80 C20,70 40,90 60,60 S100,20 140,40 S200,80 240,30 S280,50 320,10"
                        fill="none" stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round" />
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="50%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                    </defs>
                    {/* Glow Points */}
                    <circle cx="60" cy="60" r="4" fill="#06b6d4" className="animate-pulse" />
                    <circle cx="140" cy="40" r="4" fill="#8b5cf6" className="animate-pulse" />
                    <circle cx="240" cy="30" r="4" fill="#ec4899" className="animate-pulse" />
                </svg>
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(m => (
                    <span key={m} className="text-[10px] text-gray-500 relative z-10">{m}</span>
                ))}
            </div>

            <h4 className="text-sm text-gray-400 mb-4 font-medium">Recent Transactions</h4>
            <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                {transactions.length > 0 ? transactions.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                {t.category === 'Groceries' ? <ShoppingCart className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                            </div>
                            <div>
                                <div className="text-sm text-gray-200">{t.description || t.category}</div>
                                <div className="text-xs text-gray-500">{new Date(t.date).toLocaleDateString()}</div>
                            </div>
                        </div>
                        <span className={`text-sm font-medium ${t.type === 'income' ? 'text-green-400' : 'text-white'}`}>
                            {t.type === 'income' ? '+' : '-'}€{t.amount.toFixed(2)}
                        </span>
                    </div>
                )) : (
                    <p className="text-gray-500 text-sm text-center">No recent transactions</p>
                )}
            </div>
        </div>
    )
}

export function ShoppingWidget({ isTeamMode, refreshTrigger }: { isTeamMode?: boolean, refreshTrigger?: number }) {
    const [items, setItems] = useState<ShoppingItem[]>([])

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await fetch('/api/execute?category=shopping', { cache: 'no-store' })
                const data = await res.json()
                if (data.items) setItems(data.items)
            } catch (e) {
                console.error("Failed to fetch shopping items", e)
            }
        }
        fetchItems()
    }, [refreshTrigger])

    return (
        <div className="glass-panel rounded-[30px] p-6 h-full">
            <WidgetHeader title="Shopping List" icon={ShoppingCart} colorClass="text-blue-400" />

            <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {items.length > 0 ? items.map(item => (
                    <div key={item.id} className="group flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${item.isChecked ? 'bg-blue-500 border-blue-500' : 'border-gray-600 group-hover:border-blue-400'
                                }`}>
                                {item.isChecked && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className={`text-sm ${item.isChecked ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                                {item.name}
                            </span>
                        </div>
                        {item.isChecked && <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />}
                    </div>
                )) : (
                    <p className="text-gray-500 text-sm text-center py-4">List is empty</p>
                )}
            </div>

            <button className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                <Plus className="w-4 h-4" /> Add Item
            </button>
        </div>
    )
}

export function HealthWidget({ isTeamMode }: { isTeamMode?: boolean }) {
    return (
        <div className="glass-panel rounded-[30px] p-6 h-full relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-pink-500/10 blur-[60px] rounded-full pointer-events-none" />

            <WidgetHeader title="Health" colorClass="text-pink-400" />

            <div className="flex items-start justify-between mb-8">
                <div>
                    <div className="text-sm text-gray-400">Sleep Quality</div>
                    <div className="text-xs text-gray-500">Hours slept</div>
                </div>
                <div className="text-right">
                    <div className="text-lg font-bold text-green-400">85% - Good</div>
                    <div className="text-xs text-gray-500">95 hrs slept</div>
                </div>
            </div>

            {/* Wave Graph */}
            <div className="h-24 w-full mb-8 relative">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <path d="M0,50 Q30,20 60,50 T120,50 T180,30 T240,60 T300,40"
                        fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round"
                        className="drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                    <area />
                </svg>
                <div className="flex justify-between mt-2 px-1">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                        <span key={d} className="text-[10px] text-gray-600">{d}</span>
                    ))}
                </div>
            </div>

            <h4 className="text-sm text-gray-400 mb-4 font-medium">Vitals <span className="text-xs text-green-500 float-right">Trend ↗</span></h4>
            <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-gray-800/50 border border-white/5 flex flex-col items-center gap-2">
                    <Activity className="w-5 h-5 text-red-500" />
                    <div className="text-center">
                        <div className="text-sm font-bold text-white">72 <span className="text-[10px] font-normal text-gray-500">bpm</span></div>
                        <div className="text-[10px] text-gray-500">Heart Rate</div>
                    </div>
                </div>
                <div className="p-3 rounded-2xl bg-gray-800/50 border border-white/5 flex flex-col items-center gap-2">
                    <div className="w-5 h-5 text-green-500">👟</div>
                    <div className="text-center">
                        <div className="text-sm font-bold text-white">8,500</div>
                        <div className="text-[10px] text-gray-500">Steps</div>
                    </div>
                </div>
                <div className="p-3 rounded-2xl bg-gray-800/50 border border-white/5 flex flex-col items-center gap-2">
                    <div className="w-5 h-5 text-blue-500">💧</div>
                    <div className="text-center">
                        <div className="text-sm font-bold text-white">1.5L</div>
                        <div className="text-[10px] text-gray-500">Water</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

"use client"

import { useState } from "react"
import { Settings, User, Search, LayoutGrid, CheckSquare, Folder, BookOpen } from "lucide-react"
import { FinanceWidget, ShoppingWidget, HealthWidget, ScheduleWidget } from "@/components/DashboardWidgets"
import { VoiceWidget } from "@/components/VoiceWidget"
import { TeamCalendar } from "@/components/TeamCalendar"

export default function Dashboard() {
  const [isTeamMode, setIsTeamMode] = useState(false)

  const handleVoiceCommand = (text: string) => {
    console.log("Voice command:", text)
    // Here we would connect to the API
  }

  return (
    <main className="min-h-screen bg-black text-white p-6 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 px-2">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[2px]">
              <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center overflow-hidden">
                <User className="w-6 h-6 text-gray-300" />
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-black" />
          </div>
          <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="relative w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 transition-all"
          />
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-6 mb-24">
        {/* Left Column */}
        <div className="col-span-3 flex flex-col gap-6">
          <div className="flex-1 min-h-[300px]">
            {isTeamMode ? <TeamCalendar isTeamMode={true} /> : <ScheduleWidget />}
          </div>
          <div className="flex-1 min-h-[300px]">
            <ShoppingWidget />
          </div>
        </div>

        {/* Center Column */}
        <div className="col-span-6 relative">
          <VoiceWidget onCommand={handleVoiceCommand} />

          {/* Floating Action Feedback (Mockup) */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-6 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
            <span className="text-cyan-400 font-medium">Voice Input:</span>
            <span className="text-white">Pay electric bill</span>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-3 flex flex-col gap-6">
          <div className="flex-1 min-h-[300px]">
            <FinanceWidget />
          </div>
          <div className="flex-1 min-h-[300px]">
            <HealthWidget />
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex items-center gap-2 shadow-2xl z-50">
        <NavButton icon={LayoutGrid} label="Dashboard" active />
        <NavButton icon={CheckSquare} label="Tasks" />
        <NavButton icon={Folder} label="Projects" />
        <NavButton icon={BookOpen} label="Learn" />
        <NavButton icon={Settings} label="Settings" />
      </div>
    </main>
  )
}

function NavButton({ icon: Icon, label, active }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all ${active
        ? 'bg-gradient-to-b from-blue-500/20 to-purple-500/20 text-white'
        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
      }`}>
      <Icon className={`w-5 h-5 ${active ? 'text-blue-400' : ''}`} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  )
}

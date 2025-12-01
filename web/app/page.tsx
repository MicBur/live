"use client"

import { useState } from "react"
import { Settings, User, Users, Search, LayoutGrid, CheckSquare, Folder, BookOpen } from "lucide-react"
import { FinanceWidget, ShoppingWidget, HealthWidget, ScheduleWidget } from "@/components/DashboardWidgets"
import { VoiceWidget } from "@/components/VoiceWidget"
import { TeamCalendar } from "@/components/TeamCalendar"

export default function Dashboard() {
  const [isTeamMode, setIsTeamMode] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const [processing, setProcessing] = useState(false)
  const [lastCommand, setLastCommand] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null)

  const [conversationContext, setConversationContext] = useState<any>(null)

  const handleVoiceCommand = async (text: string) => {
    console.log("Voice command:", text)
    setLastCommand(text)
    setProcessing(true)
    setFeedback({ type: 'info', message: 'Processing...' })

    try {
      // 1. Plan/Classify
      const planRes = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          previousContext: conversationContext
        }),
      })

      if (!planRes.ok) throw new Error('Failed to understand command')

      const planData = await planRes.json()
      const { classification } = planData

      if (!classification) throw new Error('Could not classify command')

      // Handle Question/Ambiguity
      if (classification.category === 'question') {
        const questionText = classification.question || classification.data?.question || 'Please clarify...';

        setFeedback({
          type: 'info',
          message: questionText
        })

        // Play Audio (ElevenLabs with fallback)
        try {
          const ttsRes = await fetch('/api/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: questionText }),
          });
          if (!ttsRes.ok) throw new Error('TTS request failed');
          const audioBlob = await ttsRes.blob();
          const audio = new Audio(URL.createObjectURL(audioBlob));
          audio.play();
        } catch (e) {
          console.error("ElevenLabs TTS failed, using fallback:", e);
          const utterance = new SpeechSynthesisUtterance(questionText);
          window.speechSynthesis.speak(utterance);
        }

        setConversationContext({
          lastQuestion: classification.question,
          originalIntent: classification.data?.originalIntent
        })
        return; // Stop here, wait for user response
      }

      // 2. Execute
      const execRes = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classification }),
      })

      if (!execRes.ok) throw new Error('Failed to execute command')

      const execData = await execRes.json()

      // Handle Location Request
      if (execData.result?.needsLocation) {
        setFeedback({ type: 'info', message: 'Getting your location...' })

        if (!navigator.geolocation) {
          setFeedback({ type: 'error', message: 'Geolocation not supported' })
          return
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords
          const locationString = `${latitude},${longitude}`

          // Retry execution with location
          const retryData = {
            ...execData.result.originalData,
            from: locationString
          }

          try {
            const retryRes = await fetch('/api/execute', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                classification: {
                  category: 'travel',
                  action: 'create',
                  data: retryData
                }
              }),
            })

            if (!retryRes.ok) throw new Error('Failed to execute command with location')
            const retryExecData = await retryRes.json()

            setFeedback({
              type: 'success',
              message: retryExecData.result?.message || 'Trip planned!'
            })
            setRefreshTrigger(prev => prev + 1)
            setTimeout(() => setFeedback(null), 5000)
          } catch (e) {
            console.error(e)
            setFeedback({ type: 'error', message: 'Failed to plan trip.' })
          }

        }, (err) => {
          console.error(err)
          setFeedback({ type: 'error', message: 'Could not access location.' })
        })
        return
      }

      // Handle Confirmation/Conflict from Execute
      if (execData.result?.needsConfirmation) {
        setFeedback({
          type: 'error', // Use error style for attention
          message: execData.result.message || 'Confirmation needed'
        })
        // Store context to handle "yes" or "force" next time
        return;
      }

      setFeedback({
        type: 'success',
        message: execData.result?.message || 'Command executed successfully'
      })

      // Reset context on success
      setConversationContext(null)

      // Refresh widgets
      setRefreshTrigger(prev => prev + 1)

      // Clear feedback after 5 seconds
      setTimeout(() => setFeedback(null), 5000)

    } catch (error) {
      console.error(error)
      setFeedback({ type: 'error', message: 'Something went wrong. Please try again.' })
    } finally {
      setProcessing(false)
    }
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
          <button
            onClick={() => setIsTeamMode(!isTeamMode)}
            className={`p-2 rounded-full transition-colors ${isTeamMode ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 hover:bg-white/10 text-gray-400'}`}
            title="Toggle Team Mode"
          >
            <Users className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="relative w-96 flex gap-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 transition-all"
          />
          {/* Debug Input */}
          <input
            type="text"
            placeholder="Debug Cmd"
            className="w-40 bg-red-500/10 border border-red-500/30 rounded-full px-4 text-xs text-white"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleVoiceCommand(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 mb-24">
        {/* Left Column */}
        <div className="col-span-1 lg:col-span-3 flex flex-col gap-6 order-2 lg:order-1">
          <div className="flex-1 min-h-[300px]">
            {isTeamMode ? <TeamCalendar isTeamMode={true} refreshTrigger={refreshTrigger} /> : <ScheduleWidget refreshTrigger={refreshTrigger} />}
          </div>
          <div className="flex-1 min-h-[300px]">
            <ShoppingWidget refreshTrigger={refreshTrigger} />
          </div>
        </div>

        {/* Center Column */}
        <div className="col-span-1 lg:col-span-6 relative order-1 lg:order-2 min-h-[400px] lg:min-h-auto">
          <VoiceWidget onCommand={handleVoiceCommand} />

          {/* Floating Action Feedback */}
          {(lastCommand || feedback) && (
            <div className={`absolute top-20 left-1/2 -translate-x-1/2 backdrop-blur-md border rounded-full px-6 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 transition-colors duration-300 z-50 w-max max-w-[90vw] ${feedback?.type === 'error' ? 'bg-red-500/10 border-red-500/20' :
              feedback?.type === 'success' ? 'bg-green-500/10 border-green-500/20' :
                'bg-white/10 border-white/10'
              }`}>
              <span className={`font-medium whitespace-nowrap ${feedback?.type === 'error' ? 'text-red-400' :
                feedback?.type === 'success' ? 'text-green-400' :
                  'text-cyan-400'
                }`}>
                {feedback ? (feedback.type === 'error' ? 'Error:' : feedback.type === 'success' ? 'Success:' : 'Processing:') : 'Voice Input:'}
              </span>
              <span className="text-white truncate max-w-[200px] md:max-w-md">
                {feedback ? feedback.message : lastCommand}
              </span>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="col-span-1 lg:col-span-3 flex flex-col gap-6 order-3">
          <div className="flex-1 min-h-[300px]">
            <FinanceWidget refreshTrigger={refreshTrigger} />
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

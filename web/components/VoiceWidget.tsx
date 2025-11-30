"use client"

import { useState, useEffect } from "react"
import { Mic } from "lucide-react"

export function VoiceWidget({ onCommand }: { onCommand: (text: string) => void }) {
    const [isListening, setIsListening] = useState(false)
    const [waveData, setWaveData] = useState<number[]>([])

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isListening) {
            interval = setInterval(() => {
                setWaveData(Array.from({ length: 20 }, () => Math.random() * 100))
            }, 100)

            // Simulate listening and auto-stop after 3 seconds
            const timeout = setTimeout(() => {
                setIsListening(false)
                onCommand("Pay electric bill") // Mock command
            }, 3000)

            return () => {
                clearInterval(interval)
                clearTimeout(timeout)
            }
        } else {
            setWaveData([])
        }
    }, [isListening, onCommand])

    const toggleListening = () => {
        setIsListening(!isListening)
    }

    return (
        <div className="relative flex flex-col items-center justify-center h-full min-h-[400px]">
            {/* Central Glow */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] transition-all duration-1000 ${isListening ? 'bg-purple-500/20 scale-110' : ''}`} />

            {/* Orbit Rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-white/5 rounded-full animate-[spin_10s_linear_infinite]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/5 rounded-full animate-[spin_15s_linear_infinite_reverse]" />

            {/* Voice Button */}
            <button
                onClick={toggleListening}
                className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${isListening
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_0_50px_rgba(168,85,247,0.5)] scale-110'
                        : 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:scale-105'
                    }`}
            >
                <Mic className="w-10 h-10 text-white" />

                {/* Ripple Effect */}
                {isListening && (
                    <>
                        <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping" />
                        <div className="absolute inset-[-10px] rounded-full border border-white/20 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
                    </>
                )}
            </button>

            {/* Status Text */}
            <div className="mt-12 text-center relative z-10">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                    {isListening ? "Listening..." : "AI Voice"}
                </h2>
                <p className="text-gray-400">
                    {isListening ? "Speak your command" : "Ready to help"}
                </p>
            </div>

            {/* Waveform Visualization */}
            {isListening && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-32 flex items-center justify-center gap-1 pointer-events-none">
                    {waveData.map((h, i) => (
                        <div
                            key={i}
                            className="w-1 bg-gradient-to-t from-transparent via-cyan-400 to-transparent rounded-full transition-all duration-100"
                            style={{ height: `${h}%`, opacity: Math.max(0.2, h / 100) }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

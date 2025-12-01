"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, MicOff, Keyboard, X } from "lucide-react"

export function VoiceWidget({ onCommand }: { onCommand: (text: string) => void }) {
    const [isListening, setIsListening] = useState(false)
    const [waveData, setWaveData] = useState<number[]>([])
    const [transcript, setTranscript] = useState("")
    const [showTextInput, setShowTextInput] = useState(false)
    const [textInput, setTextInput] = useState("")
    const [error, setError] = useState<string | null>(null)

    const recognitionRef = useRef<any>(null)
    const accumulatedTranscriptRef = useRef("")
    const silenceTimer = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
            // @ts-ignore
            const recognition = new window.webkitSpeechRecognition()
            recognition.continuous = true
            recognition.interimResults = true
            recognition.lang = 'de-DE'

            recognition.onstart = () => {
                console.log("[VoiceWidget] Recognition started")
                setIsListening(true)
                setError(null)
                // Always clear transcript on new session
                accumulatedTranscriptRef.current = ""
                setTranscript("")
            }

            recognition.onend = () => {
                // If we stopped because of silence, send the command
                if (silenceTimer.current === null) {
                    // Manual stop or error
                    setIsListening(false)
                    const finalText = accumulatedTranscriptRef.current.trim()
                    if (finalText) {
                        onCommand(finalText)
                    }
                } else {
                    // It might have stopped automatically, restart if we didn't intend to stop
                    // If silence timer triggered, it called stop(), so we are good.
                    setIsListening(false)
                    const finalText = accumulatedTranscriptRef.current.trim()
                    if (finalText) {
                        onCommand(finalText)
                    }
                }
            }

            recognition.onresult = (event: any) => {
                // Reset silence timer
                if (silenceTimer.current) clearTimeout(silenceTimer.current)
                silenceTimer.current = setTimeout(() => {
                    recognition.stop()
                    silenceTimer.current = null // Mark as stopped by timer
                }, 4000) // Increased to 4 seconds

                let interim = ''
                let final = ''

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const transcriptPart = event.results[i][0].transcript
                    console.log("[VoiceWidget] Result:", transcriptPart, "IsFinal:", event.results[i].isFinal)

                    if (event.results[i].isFinal) {
                        final += transcriptPart
                    } else {
                        interim += transcriptPart
                    }
                }

                if (final) {
                    accumulatedTranscriptRef.current += " " + final
                }

                // Force update state to ensure UI re-renders
                setTranscript((accumulatedTranscriptRef.current + " " + interim).trim())
            }

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error", event.error)
                if (event.error === 'no-speech') {
                    // Ignore no-speech error, just keep listening or let silence timer kill it
                    // Actually, if 'no-speech' happens, it means the browser gave up waiting.
                    // We should probably just let it die, but show a hint.
                    setError("No speech detected. Please try again.")
                    setIsListening(false)
                    return
                }
                if (event.error === 'not-allowed') {
                    setError("Microphone permission denied.")
                    setIsListening(false)
                    return
                }
                setError(`Error: ${event.error}`)
                setIsListening(false)
            }

            recognitionRef.current = recognition
        } else {
            setError("Browser not supported.")
        }
    }, [onCommand])

    // Waveform animation
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isListening) {
            interval = setInterval(() => {
                setWaveData(Array.from({ length: 20 }, () => Math.random() * 100))
            }, 100)
        } else {
            setWaveData([])
            setTranscript("")
        }
        return () => clearInterval(interval)
    }, [isListening])

    const toggleListening = async () => {
        if (isListening) {
            recognitionRef.current?.stop()
        } else {
            try {
                // Explicitly request permission first to ensure prompt appears
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                // Stop the stream immediately, we just needed the permission
                stream.getTracks().forEach(track => track.stop());

                // Now start recognition
                recognitionRef.current?.start()
                setError(null)
            } catch (err) {
                console.error("Microphone permission denied:", err);
                setError("Microphone permission denied. Please allow access.")
            }
        }
    }

    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (textInput.trim()) {
            onCommand(textInput)
            setTextInput("")
            setShowTextInput(false)
        }
    }

    if (showTextInput) {
        return (
            <div className="relative flex flex-col items-center justify-center h-full min-h-[400px]">
                <div className="w-full max-w-md p-6 glass-panel rounded-2xl relative">
                    <button
                        onClick={() => setShowTextInput(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <h3 className="text-xl font-semibold text-white mb-4">Type Command</h3>
                    <form onSubmit={handleTextSubmit} className="flex flex-col gap-4">
                        <input
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="e.g., Buy milk..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-xl transition-colors"
                        >
                            Send Command
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className="relative flex flex-col items-center justify-center h-full min-h-[400px]">
            {/* Central Glow */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] lg:w-[500px] h-[300px] lg:h-[500px] bg-blue-500/10 rounded-full blur-[100px] transition-all duration-1000 ${isListening ? 'bg-purple-500/20 scale-110' : ''}`} />

            {/* Orbit Rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] lg:w-[300px] h-[200px] lg:h-[300px] border border-white/5 rounded-full animate-[spin_10s_linear_infinite]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] lg:w-[400px] h-[300px] lg:h-[400px] border border-white/5 rounded-full animate-[spin_15s_linear_infinite_reverse]" />

            {/* Voice Button */}
            <button
                onClick={toggleListening}
                className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${isListening
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_0_50px_rgba(168,85,247,0.5)] scale-110'
                    : 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:scale-105'
                    }`}
            >
                {isListening ? <MicOff className="w-10 h-10 text-white" /> : <Mic className="w-10 h-10 text-white" />}

                {/* Ripple Effect */}
                {isListening && (
                    <>
                        <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping" />
                        <div className="absolute inset-[-10px] rounded-full border border-white/20 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
                    </>
                )}
            </button>

            {/* Persistent Text Input */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
                <form onSubmit={handleTextSubmit} className="relative group">
                    <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Type a command..."
                        className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-5 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!textInput.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-blue-500 text-white opacity-0 group-focus-within:opacity-100 disabled:opacity-0 disabled:cursor-not-allowed transition-all hover:bg-blue-600"
                    >
                        <Keyboard className="w-4 h-4" />
                    </button>
                </form>
            </div>

            {/* Reset Button (Top Right) */}
            <button
                onClick={() => {
                    recognitionRef.current?.stop()
                    setTranscript("")
                    accumulatedTranscriptRef.current = ""
                    setIsListening(false)
                }}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/5"
                title="Reset Voice"
            >
                <X className="w-4 h-4" />
            </button>

            {/* Status Text */}
            <div className="mt-12 text-center relative z-10 px-4">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                    {isListening ? "Listening..." : "AI Voice"}
                </h2>
                <p className="text-gray-400 min-h-[24px]">
                    {error ? (
                        <span className="text-red-400">{error}</span>
                    ) : (
                        transcript || (isListening ? "Speak your command" : "Ready to help")
                    )}
                </p>
            </div>

            {/* Waveform Visualization */}
            {isListening && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] lg:w-[600px] h-32 flex items-center justify-center gap-1 pointer-events-none">
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

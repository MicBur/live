"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, Sparkles, Square } from "lucide-react"
import { cn } from "@/lib/utils"

interface MagicButtonProps {
    onRecordStart?: () => void
    onRecordStop?: (text: string) => void
    onTextSubmit?: (text: string) => void
    isProcessing?: boolean
}

export function MagicButton({ onRecordStart, onRecordStop, onTextSubmit, isProcessing = false }: MagicButtonProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [showTextInput, setShowTextInput] = useState(false)
    const [textInputValue, setTextInputValue] = useState("")
    const [interimTranscript, setInterimTranscript] = useState("")
    const recognitionRef = useRef<any>(null)

    const stopRecording = useCallback((finalText?: string) => {
        if (recognitionRef.current) {
            recognitionRef.current.stop()
        }
        setIsRecording(false)

        if (finalText) {
            onRecordStop?.(finalText)
        }
    }, [onRecordStop])

    useEffect(() => {
        // Initialize Web Speech API (kostenlos!)
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
            const recognition = new SpeechRecognition()

            recognition.continuous = true
            recognition.interimResults = true
            recognition.lang = 'de-DE' // German

            recognition.onresult = (event: any) => {
                let interim = ''
                let final = ''

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript
                    if (event.results[i].isFinal) {
                        final += transcript + ' '
                    } else {
                        interim += transcript
                    }
                }

                if (final) {
                    setInterimTranscript('')
                    stopRecording(final.trim())
                } else {
                    setInterimTranscript(interim)
                }
            }

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error)
                setIsRecording(false)
                setInterimTranscript('')
            }

            recognitionRef.current = recognition
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop()
            }
        }
    }, [stopRecording])

    const startRecording = () => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.start()
                setIsRecording(true)
                setInterimTranscript('')
                onRecordStart?.()
            } catch (error) {
                console.error('Error starting recognition:', error)
            }
        } else {
            alert('Spracherkennung wird in diesem Browser nicht unterstützt. Bitte verwende Chrome, Edge oder Safari.')
        }
    }

    const handleClick = () => {
        if (isRecording) {
            stopRecording()
        } else if (!showTextInput) {
            setShowTextInput(true)
        } else {
            startRecording()
        }
    }

    const handleTextSubmit = () => {
        if (textInputValue.trim()) {
            onTextSubmit?.(textInputValue.trim())
            setTextInputValue("")
            setShowTextInput(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleTextSubmit()
        } else if (e.key === "Escape") {
            setShowTextInput(false)
            setTextInputValue("")
        }
    }

    return (
        <div className="relative flex flex-col items-center justify-center">
            {/* Pulsating Rings */}
            <AnimatePresence>
                {isRecording && (
                    <>
                        <motion.div
                            initial={{ scale: 1, opacity: 0.5 }}
                            animate={{ scale: 2, opacity: 0 }}
                            exit={{ scale: 1, opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                            className="absolute w-20 h-20 rounded-full bg-red-500/30 blur-xl"
                        />
                        <motion.div
                            initial={{ scale: 1, opacity: 0.5 }}
                            animate={{ scale: 1.5, opacity: 0 }}
                            exit={{ scale: 1, opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: 0.5, ease: "easeOut" }}
                            className="absolute w-20 h-20 rounded-full bg-pink-500/30 blur-lg"
                        />
                    </>
                )}
            </AnimatePresence>

            {/* Main Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClick}
                disabled={isProcessing}
                className={cn(
                    "relative z-10 flex items-center justify-center w-20 h-20 rounded-full shadow-2xl transition-all duration-300",
                    isRecording
                        ? "bg-gradient-to-r from-red-500 to-pink-600 shadow-red-500/50"
                        : "bg-gradient-to-r from-cyan-500 to-purple-600 shadow-cyan-500/50",
                    isProcessing && "opacity-50 cursor-not-allowed"
                )}
            >
                {isProcessing ? (
                    <Sparkles className="w-8 h-8 text-white animate-spin-slow" />
                ) : isRecording ? (
                    <Square className="w-6 h-6 text-white fill-white" />
                ) : (
                    <Mic className="w-8 h-8 text-white" />
                )}
            </motion.button>

            {/* Interim Transcript Display */}
            <AnimatePresence>
                {interimTranscript && isRecording && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-24 bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-lg max-w-xs text-center"
                    >
                        <p className="text-sm text-gray-300 italic">{interimTranscript}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Text Input Field */}
            <AnimatePresence>
                {showTextInput && !isRecording && !isProcessing && (
                    <motion.div
                        key="text-input-container"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="mt-4 flex items-center space-x-2 w-full max-w-xs"
                    >
                        <input
                            type="text"
                            value={textInputValue}
                            onChange={(e) => setTextInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message..."
                            className="flex-grow p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            autoFocus
                        />
                        <button
                            onClick={handleTextSubmit}
                            className="p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
                            disabled={!textInputValue.trim()}
                        >
                            Send
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Status Text */}
            <div className="absolute -bottom-12 text-center">
                <AnimatePresence mode="wait">
                    {isRecording ? (
                        <motion.span
                            key="listening"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="text-sm font-medium text-red-400 animate-pulse"
                        >
                            {interimTranscript ? 'Listening...' : 'Speak now...'}
                        </motion.span>
                    ) : isProcessing ? (
                        <motion.span
                            key="processing"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="text-sm font-medium text-purple-400"
                        >
                            Processing...
                        </motion.span>
                    ) : showTextInput ? (
                        <motion.span
                            key="text-input-prompt"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="text-sm font-medium text-gray-400"
                        >
                            Type or Click to Record
                        </motion.span>
                    ) : (
                        <motion.span
                            key="idle"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="text-sm font-medium text-gray-400"
                        >
                            Click to Start
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

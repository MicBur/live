"use client"

import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, X, Clock, Calendar } from "lucide-react"

interface ConflictDialogProps {
    isOpen: boolean
    onClose: () => void
    newEvent: any
    conflicts: any[]
    suggestions: string[]
    onConfirm: (action: 'keep_new' | 'keep_existing' | 'reschedule') => void
}

export function ConflictDialog({ isOpen, onClose, newEvent, conflicts, suggestions, onConfirm }: ConflictDialogProps) {
    if (!isOpen || !newEvent) return null

    const formatTime = (date: Date | string) => {
        const d = new Date(date)
        return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    }

    const formatDate = (date: Date | string) => {
        const d = new Date(date)
        return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-orange-500/30 rounded-2xl shadow-2xl max-w-lg w-full p-6">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                                        <AlertTriangle className="w-6 h-6 text-orange-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Zeitkonflikt erkannt!</h3>
                                        <p className="text-sm text-gray-400">Du hast bereits etwas geplant</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {/* New Event */}
                            <div className="mb-4 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                                <div className="text-xs text-cyan-400 mb-1 flex items-center gap-2">
                                    <Calendar className="w-3 h-3" />
                                    Neuer Termin
                                </div>
                                <div className="font-semibold text-white">{newEvent.title}</div>
                                <div className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(newEvent.startTime)} • {formatTime(newEvent.startTime)}
                                </div>
                                {newEvent.location && (
                                    <div className="text-xs text-gray-500 mt-1">📍 {newEvent.location}</div>
                                )}
                            </div>

                            {/* Conflicts */}
                            <div className="mb-6">
                                <div className="text-xs text-gray-400 mb-2 font-semibold">Überschneidet sich mit:</div>
                                {conflicts.map((conflict, i) => (
                                    <div key={i} className="mb-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                                        <div className="font-medium text-white">{conflict.title}</div>
                                        <div className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                                            <Clock className="w-3 h-3" />
                                            {formatTime(conflict.startTime)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Suggestions */}
                            <div className="mb-6">
                                <div className="text-xs text-gray-400 mb-2 font-semibold">💡 Vorschläge:</div>
                                <div className="space-y-2">
                                    {suggestions.map((suggestion, i) => (
                                        <div key={i} className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 text-sm text-gray-300">
                                            {suggestion}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => onConfirm('keep_existing')}
                                    className="flex-1 py-3 px-4 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-colors"
                                >
                                    Alten behalten
                                </button>
                                <button
                                    onClick={() => onConfirm('keep_new')}
                                    className="flex-1 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors"
                                >
                                    Neuen behalten
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

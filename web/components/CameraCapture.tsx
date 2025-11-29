"use client"

import { useState, useRef } from "react"
import { Camera, Upload, X, Loader2, CheckCircle } from "lucide-react"

export function CameraCapture({ onCapture }: { onCapture: (file: File) => void }) {
    const [preview, setPreview] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
            onCapture(file)
        }
    }

    const clearImage = () => {
        setPreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    return (
        <div className="relative">
            <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />

            {!preview ? (
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                    title="Scan Receipt"
                >
                    <Camera className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                </button>
            ) : (
                <div className="relative group">
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-lg border border-cyan-500/30 shadow-lg"
                    />
                    <button
                        onClick={clearImage}
                        className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X className="w-3 h-3" />
                    </button>
                    {isUploading && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

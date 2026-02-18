"use client"

import { useEffect, useState } from "react"
import { Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FloatingRateNotificationProps {
    message: string
    isVisible: boolean
    onClose: () => void
}

export function FloatingRateNotification({ message, isVisible, onClose }: FloatingRateNotificationProps) {
    const [shouldRender, setShouldRender] = useState(isVisible)

    useEffect(() => {
        if (isVisible) {
            setShouldRender(true)
            const timer = setTimeout(() => {
                onClose()
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [isVisible, onClose])

    if (!shouldRender && !isVisible) return null

    return (
        <div
            className={cn(
                "fixed bottom-6 right-6 z-[100] transition-all duration-500 transform",
                isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0 pointer-events-none"
            )}
            onTransitionEnd={() => {
                if (!isVisible) setShouldRender(false)
            }}
        >
            <div className="bg-background/60 backdrop-blur-xl border border-primary/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-2xl px-5 py-4 flex items-center gap-4 min-w-[300px] border-l-4 border-l-primary">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <Info className="h-5 w-5" />
                </div>

                <div className="flex flex-col flex-grow pr-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-0.5">
                        Exchange Rate Update
                    </span>
                    <span className="text-sm font-bold tracking-tight text-foreground font-numeric">
                        {message}
                    </span>
                </div>

                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}

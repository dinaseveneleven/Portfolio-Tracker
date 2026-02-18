"use client"

import { useEffect, useState } from "react"
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/context/currency-context"

interface NetWorthHeroProps {
    totalValue: number
    previousValue?: number // Value 24h ago
    isLoading?: boolean
}

export function NetWorthHero({ totalValue, previousValue, isLoading }: NetWorthHeroProps) {
    const { formatValue } = useCurrency()
    const [displayValue, setDisplayValue] = useState(0)

    // Simple animation for the number on mount or change
    useEffect(() => {
        const duration = 1000
        const steps = 60
        const increment = totalValue / steps
        let current = 0
        const timer = setInterval(() => {
            current += increment
            if (current >= totalValue) {
                setDisplayValue(totalValue)
                clearInterval(timer)
            } else {
                setDisplayValue(current)
            }
        }, duration / steps)

        return () => clearInterval(timer)
    }, [totalValue])

    // Calculate change
    const change = previousValue ? totalValue - previousValue : 0
    const changePercent = previousValue ? (change / previousValue) * 100 : 0
    const isPositive = change >= 0

    return (
        <div className="flex flex-col items-center justify-center py-12 md:py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">
                Net Asset Value (NAV)
            </h2>

            <div className="relative flex items-center justify-center">
                <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-foreground font-numeric">
                    {formatValue(displayValue)}
                </h1>
            </div>

            <div className={cn(
                "mt-6 flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                isPositive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            )}>
                {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                <span className="font-numeric">
                    {formatValue(Math.abs(change))}
                </span>
                <span className="font-numeric opacity-80">
                    ({Math.abs(changePercent).toFixed(2)}%)
                </span>
                <span className="text-muted-foreground ml-1">Today</span>
            </div>
        </div>
    )
}

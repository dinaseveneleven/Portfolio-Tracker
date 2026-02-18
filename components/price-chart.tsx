"use client"

import { useState, useEffect, useMemo } from "react"
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid
} from "recharts"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/context/currency-context"

interface PriceChartProps {
    ticker: string
    baseCurrency?: string
    isPositive?: boolean
}

type Range = "1D" | "1W" | "1M" | "1Y" | "5Y" | "YTD"

export function PriceChart({ ticker, baseCurrency = "$", isPositive = true }: PriceChartProps) {
    const { formatValue } = useCurrency()
    const [range, setRange] = useState<Range>("1D")
    const [data, setData] = useState<{ time: number, price: number }[]>([])
    const [loading, setLoading] = useState(false)

    const ranges: Range[] = ["1D", "1W", "1M", "YTD", "1Y", "5Y"]

    useEffect(() => {
        if (!ticker) return

        const fetchData = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/prices/lookup?ticker=${ticker.toUpperCase()}&range=${range}`)
                if (res.ok) {
                    const result = await res.json()
                    setData(result.history || [])
                }
            } catch (error) {
                console.error("Failed to fetch chart data", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [ticker, range])

    const formattedData = useMemo(() => {
        return data.map(item => ({
            ...item,
            formattedTime: new Date(item.time).toLocaleString([], {
                month: range === "1D" || range === "1W" ? undefined : "short",
                day: range === "1D" ? undefined : "numeric",
                hour: "2-digit",
                minute: "2-digit",
                year: range === "5Y" ? "2-digit" : undefined
            })
        }))
    }, [data, range])

    const formatXAxis = (tick: number) => {
        const date = new Date(tick)
        if (range === "1D") return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        if (range === "1W" || range === "1M") return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
        return date.toLocaleDateString([], { year: '2-digit', month: 'short' })
    }

    if (!ticker) return null

    return (
        <div className="flex flex-col gap-4 w-full animate-in fade-in duration-500">
            {/* Range Selectors */}
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg self-start">
                {ranges.map((r) => (
                    <button
                        key={r}
                        onClick={() => setRange(r)}
                        className={cn(
                            "px-3 py-1 text-[10px] font-bold rounded-md transition-all duration-200",
                            range === r
                                ? "bg-background text-foreground shadow-sm scale-105"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {r}
                    </button>
                ))}
            </div>

            {/* Chart Area */}
            <div className="h-[200px] w-full relative group">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-[1px] z-10 rounded-xl">
                        <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
                    </div>
                )}

                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={isPositive ? "#10b981" : "#f43f5e"} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={isPositive ? "#10b981" : "#f43f5e"} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-[0.03]" />
                            <XAxis
                                dataKey="time"
                                hide
                            />
                            <YAxis
                                domain={['auto', 'auto']}
                                hide
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-background/90 backdrop-blur-md border border-border/50 p-2 rounded-lg shadow-xl animate-in zoom-in-95 duration-200">
                                                <p className="text-[10px] font-bold text-muted-foreground mb-0.5">
                                                    {new Date(payload[0].payload.time).toLocaleString([], {
                                                        dateStyle: range === "1D" ? undefined : "medium",
                                                        timeStyle: "short"
                                                    })}
                                                </p>
                                                <p className="text-sm font-bold font-numeric">
                                                    {baseCurrency}{payload[0].value?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="price"
                                stroke={isPositive ? "#10b981" : "#f43f5e"}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorPrice)"
                                animationDuration={1000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : !loading && (
                    <div className="h-full w-full flex items-center justify-center border border-dashed rounded-xl bg-muted/5">
                        <span className="text-xs text-muted-foreground italic">No historical data available for this range</span>
                    </div>
                )}
            </div>
        </div>
    )
}

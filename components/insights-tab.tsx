"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useCurrency } from "@/context/currency-context"
import { HoldingWithPrice } from "@/types/portfolio"
import { TrendingUp, AlertTriangle, ArrowRightLeft, Target } from "lucide-react"
import { cn } from "@/lib/utils"

interface RiskMetrics {
    sharpeRatio: number
    volatility: number
    annualizedReturn: number
    correlationMatrix: any[]
    topHoldings: string[]
}

interface InsightsTabProps {
    assets: HoldingWithPrice[]
    onUpdateAsset: (id: string, updates: any) => Promise<void>
}

export function InsightsTab({ assets, onUpdateAsset }: InsightsTabProps) {
    const { formatValue } = useCurrency()
    const [metrics, setMetrics] = useState<RiskMetrics | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Local state for target weights can be string to allow clearing in UI
    const [localWeights, setLocalWeights] = useState<Record<string, number | string>>({})
    const debounceTimer = useRef<NodeJS.Timeout | null>(null)

    // Initialize/Sync local weights from assets
    useEffect(() => {
        const weights: Record<string, number> = {}
        assets.forEach(a => {
            weights[a.id] = a.targetWeight || 0
        })
        // Merge with local weights, prioritizing local values only if they exist
        setLocalWeights(prev => ({ ...weights, ...prev }))
    }, [assets.length])

    // Fetch Risk Metrics
    useEffect(() => {
        async function fetchRisk() {
            try {
                // Only show full loading pulse if we have no data yet
                if (!metrics) setLoading(true)

                const res = await fetch("/api/analytics/risk")
                const data = await res.json()
                if (res.ok) {
                    setMetrics(data)
                } else {
                    setError(data.error || "Failed to load risk metrics")
                }
            } catch (err) {
                setError("Connection error to analytics engine")
            } finally {
                setLoading(false)
            }
        }
        fetchRisk()
    }, [assets.length]) // Only refetch if holdings list changes, avoid loop

    useEffect(() => {
        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current)
        }
    }, [])

    if (loading && !metrics) return <div className="p-12 text-center text-muted-foreground animate-pulse">Analyzing portfolio risk...</div>
    if (error && !metrics) return (
        <div className="p-12 text-center border rounded-2xl bg-muted/20">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <h3 className="text-lg font-medium">Analytics Unavailable</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">{error}</p>
        </div>
    )

    const handleWeightChange = (id: string, value: string) => {
        // Instant UI update (allows empty string)
        setLocalWeights(prev => ({ ...prev, [id]: value }))

        const numericValue = parseFloat(value) || 0

        // Debounce API sync
        if (debounceTimer.current) clearTimeout(debounceTimer.current)
        debounceTimer.current = setTimeout(() => {
            onUpdateAsset(id, { targetWeight: numericValue })
        }, 1500) // Slightly longer debounce for better typing experience
    }

    const handleBlur = (id: string) => {
        const val = localWeights[id]
        const numericValue = typeof val === 'string' ? parseFloat(val) || 0 : val
        onUpdateAsset(id, { targetWeight: numericValue })
        // Clean up UI to show 0 if it was empty
        setLocalWeights(prev => ({ ...prev, [id]: numericValue }))
    }

    // Rebalance Logic using local weights
    const totalValue = assets.reduce((sum, a) => sum + a.currentValue, 0)
    const rebalanceData = assets.map(asset => {
        const currentWeight = totalValue > 0 ? (asset.currentValue / totalValue) * 100 : 0
        const localVal = localWeights[asset.id]
        const targetWeight = localVal === "" ? 0 : (typeof localVal === 'number' ? localVal : parseFloat(localVal) || 0)
        const drift = currentWeight - targetWeight
        const driftValue = (drift / 100) * totalValue
        return {
            ...asset,
            currentWeight,
            targetWeight: localVal === undefined ? (asset.targetWeight || 0) : localVal,
            drift,
            driftValue
        }
    })

    return (
        <div className="space-y-8 pb-20">
            {/* Risk Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" /> Sharpe Ratio
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.sharpeRatio.toFixed(2) || "0.00"}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Risk-adjusted return vs 4% RF</p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" /> Annualized Vol
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(metrics?.volatility ? metrics.volatility * 100 : 0).toFixed(1)}%</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Expected yearly price fluctuation</p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Target className="h-4 w-4" /> Portfolio Efficiency
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {metrics?.sharpeRatio && metrics.sharpeRatio > 1 ? "Optimal" : "Sub-Optimal"}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">Based on diversification/risk profile</p>
                    </CardContent>
                </Card>
            </div>

            {/* Asset Correlation Heatmap */}
            {metrics?.correlationMatrix && metrics.correlationMatrix.length > 0 && (
                <section>
                    <div className="mb-4">
                        <h3 className="text-xl font-light tracking-tight">Holding Correlations</h3>
                        <p className="text-xs text-muted-foreground">How closely your top assets move together (0.0 = diverse, 1.0 = identical)</p>
                    </div>
                    <Card className="overflow-hidden border-primary/5 bg-slate-950/20">
                        <div className="p-6">
                            <div className="flex flex-col gap-1 overflow-x-auto">
                                {/* Header */}
                                <div className="flex gap-1 ml-24">
                                    {metrics.topHoldings.map(t => (
                                        <div key={t} className="w-16 flex-shrink-0 text-center text-[10px] font-bold text-muted-foreground uppercase">{t}</div>
                                    ))}
                                </div>
                                {/* Rows */}
                                {metrics.correlationMatrix.map((row, i) => (
                                    <div key={row.ticker} className="flex gap-1 items-center">
                                        <div className="w-24 flex-shrink-0 text-right pr-4 text-[11px] font-bold text-muted-foreground uppercase">{row.ticker}</div>
                                        {metrics.topHoldings.map(t => {
                                            const val = row[t] || 0
                                            return (
                                                <div
                                                    key={t}
                                                    className="w-16 h-12 flex-shrink-0 flex items-center justify-center text-[11px] font-bold rounded-sm border border-white/5 transition-all hover:scale-105"
                                                    style={{
                                                        backgroundColor: val > 0 ? `rgba(16, 185, 129, ${val})` : `rgba(100, 116, 139, ${Math.abs(val)})`,
                                                        color: val > 0.6 ? 'white' : 'rgba(255,255,255,0.6)'
                                                    }}
                                                    title={`${row.ticker} vs ${t}: ${val.toFixed(2)}`}
                                                >
                                                    {val.toFixed(1)}
                                                </div>
                                            )
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </section>
            )}

            {/* Rebalancing Tool */}
            <section>
                <div className="mb-4 flex justify-between items-end">
                    <div>
                        <h3 className="text-xl font-light tracking-tight">Smart Rebalancing</h3>
                        <p className="text-xs text-muted-foreground">Adjust target weights to generate trade suggestions instantly</p>
                    </div>
                </div>
                <div className="rounded-2xl border bg-card/30 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground text-[11px] uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3 text-left font-medium">Asset</th>
                                <th className="px-6 py-3 text-right font-medium">Actual %</th>
                                <th className="px-6 py-3 text-right font-medium">Target %</th>
                                <th className="px-6 py-3 text-right font-medium">Drift</th>
                                <th className="px-6 py-3 text-right font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {rebalanceData.map(asset => (
                                <tr key={asset.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4 font-bold">{asset.ticker}</td>
                                    <td className="px-6 py-4 text-right font-numeric">{asset.currentWeight.toFixed(1)}%</td>
                                    <td className="px-6 py-4 text-right">
                                        <input
                                            type="number"
                                            className="w-20 bg-muted/50 border-none rounded px-2 py-1 text-right focus:ring-1 ring-primary/20 transition-all font-numeric no-spinner"
                                            value={asset.targetWeight ?? ""}
                                            onChange={(e) => handleWeightChange(asset.id, e.target.value)}
                                            onBlur={() => handleBlur(asset.id)}
                                        />
                                    </td>
                                    <td className={cn(
                                        "px-6 py-4 text-right font-numeric",
                                        Math.abs(asset.drift) > 5 ? "text-amber-500 font-bold" : "text-muted-foreground"
                                    )}>
                                        {asset.drift > 0 ? "+" : ""}{asset.drift.toFixed(1)}%
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {Math.abs(asset.driftValue) < 10 ? (
                                            <span className="text-emerald-500/60 text-xs font-medium">Balanced</span>
                                        ) : (() => {
                                            const isSell = asset.driftValue > 0
                                            const action = isSell ? "SELL" : "BUY"
                                            const usdPrice = asset.currentValue / asset.quantity
                                            const sharesToTrade = Math.round(Math.abs(asset.driftValue) / usdPrice)
                                            const tradeAmount = sharesToTrade * usdPrice
                                            const newQuantity = isSell ? asset.quantity - sharesToTrade : asset.quantity + sharesToTrade

                                            if (sharesToTrade === 0) return <span className="text-emerald-500/60 text-xs font-medium">Balanced</span>

                                            return (
                                                <button
                                                    onClick={() => {
                                                        const msg = `${action} ${sharesToTrade} units of ${asset.ticker}?\n\nThis will adjust your quantity from ${asset.quantity} to ${newQuantity}.`
                                                        if (confirm(msg)) {
                                                            onUpdateAsset(asset.id, { quantity: newQuantity })
                                                        }
                                                    }}
                                                    className={cn(
                                                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-tighter uppercase transition-all hover:scale-105 active:scale-95",
                                                        isSell
                                                            ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                                                            : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                                                    )}
                                                >
                                                    {action} {sharesToTrade} units
                                                    <span className="opacity-60 font-medium">({formatValue(tradeAmount)})</span>
                                                </button>
                                            )
                                        })()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    )
}

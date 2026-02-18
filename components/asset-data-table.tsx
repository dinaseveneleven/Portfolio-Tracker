"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { PriceData, Holding, HoldingWithPrice } from "@/types/portfolio"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/context/currency-context"

import { Trash2, TrendingDown, MoreHorizontal, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AssetDataTableProps {
    assets: HoldingWithPrice[]
    isLoading?: boolean
    onDeleteAsset?: (id: string) => void
    onUpdateAsset?: (id: string, updates: Partial<Holding>) => void
}

// Simple Sparkline Component
function Sparkline({ data, isPositive }: { data: number[], isPositive: boolean }) {
    if (!data || data.length < 2) return null

    // Normalize data to 0-1 range for SVG
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    // Add 10% padding to prevent clipping at top/bottom
    const padding = range * 0.1
    const pMin = min - padding
    const pMax = max + padding
    const pRange = pMax - pMin

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100
        const y = 100 - ((val - pMin) / pRange) * 100
        return `${x},${y}`
    }).join(" ")

    return (
        <svg width="100" height="30" viewBox="0 0 100 100" className="opacity-80" preserveAspectRatio="none">
            <polyline
                points={points}
                fill="none"
                stroke={isPositive ? "#10b981" : "#f43f5e"}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    )
}

export function AssetDataTable({ assets, isLoading, onDeleteAsset, onUpdateAsset }: AssetDataTableProps) {
    const { formatValue, currency, exchangeRate } = useCurrency()

    const handleSell = (asset: HoldingWithPrice) => {
        const amount = prompt(`How many units of ${asset.ticker} to sell? (Current: ${asset.quantity})`)
        if (amount) {
            const sellQty = parseFloat(amount)
            if (!isNaN(sellQty) && sellQty > 0 && sellQty <= asset.quantity) {
                const newQty = asset.quantity - sellQty
                if (newQty === 0) {
                    onDeleteAsset?.(asset.id)
                } else {
                    onUpdateAsset?.(asset.id, { quantity: newQty })
                }
            } else {
                alert("Invalid quantity. Please enter a number between 0 and your current holding.")
            }
        }
    }

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading assets...</div>
    }

    if (assets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 border rounded-lg bg-card/50">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No assets tracked</h3>
                <p className="text-sm text-muted-foreground mt-1">Add your first holding to get started.</p>
            </div>
        )
    }

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[180px]">Asset</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="hidden md:table-cell text-center">7d Trend</TableHead>
                        <TableHead className="text-right">Holdings</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead className="text-right">P/L</TableHead>
                        <TableHead className="w-[80px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {assets.map((asset) => {
                        const isPositive = asset.priceChangePercent !== undefined ? asset.priceChangePercent >= 0 : true
                        const sparkData = asset.sparklineData && asset.sparklineData.length > 0
                            ? asset.sparklineData
                            : [asset.currentPrice, asset.currentPrice] // Fallback

                        return (
                            <TableRow key={asset.id} className="hover:bg-muted/50 transition-colors group">
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span className="font-bold">{asset.ticker}</span>
                                        <span className="text-xs text-muted-foreground hidden sm:inline">{asset.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-numeric">
                                    <div className="flex flex-col items-end">
                                        <span>
                                            {asset.currency && asset.currency !== 'USD'
                                                ? `${asset.currency} ${asset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                                : formatValue(asset.currentPrice)
                                            }
                                        </span>
                                        <div className={cn(
                                            "flex items-center text-xs",
                                            isPositive ? "text-emerald-600" : "text-rose-600"
                                        )}>
                                            {isPositive ? "+" : ""}{asset.priceChangePercent?.toFixed(2)}%
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell p-2">
                                    <div className="flex justify-center h-[30px] w-full max-w-[100px] mx-auto">
                                        <Sparkline data={sparkData} isPositive={isPositive} />
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-numeric text-muted-foreground">
                                    {asset.quantity}
                                </TableCell>
                                <TableCell className="text-right font-semibold font-numeric">
                                    {formatValue(asset.currentValue)}
                                </TableCell>
                                <TableCell className="text-right font-numeric">
                                    <div className={cn(
                                        "font-medium",
                                        asset.gainLoss >= 0 ? "text-emerald-600" : "text-rose-600"
                                    )}>
                                        {asset.gainLoss >= 0 ? "+" : ""}{formatValue(Math.abs(asset.gainLoss))}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {asset.gainLossPercent.toFixed(2)}%
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-100/50"
                                            onClick={() => handleSell(asset)}
                                            title="Sell Asset"
                                        >
                                            <TrendingDown className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                            onClick={() => onDeleteAsset?.(asset.id)}
                                            title="Delete Asset"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}

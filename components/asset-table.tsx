'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { HoldingWithPrice } from '@/types/portfolio'
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface AssetTableProps {
    holdings: HoldingWithPrice[]
}

export function AssetTable({ holdings }: AssetTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Holdings</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Asset</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Current Value</TableHead>
                            <TableHead className="text-right">Gain/Loss</TableHead>
                            <TableHead className="text-right">Allocation</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {holdings.map((holding) => {
                            const isPositive = holding.gainLoss >= 0
                            const isPriceUp = holding.priceChange >= 0

                            return (
                                <TableRow key={holding.id} className="group">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold">{holding.ticker}</span>
                                            <span className="text-xs text-muted-foreground">{holding.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="font-medium">{formatCurrency(holding.currentPrice)}</span>
                                            <span className={`text-xs flex items-center gap-0.5 ${isPriceUp ? 'text-green-500' : 'text-red-500'}`}>
                                                {isPriceUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                {formatPercent(holding.priceChangePercent)}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="font-medium">{formatNumber(holding.quantity)}</span>
                                            <span className="text-xs text-muted-foreground">
                                                @ {formatCurrency(holding.purchasePrice)}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(holding.currentValue)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end">
                                            <span className={`font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                                {formatCurrency(holding.gainLoss)}
                                            </span>
                                            <span className={`text-xs ${isPositive ? 'text-green-500/80' : 'text-red-500/80'}`}>
                                                {formatPercent(holding.gainLossPercent)}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="font-medium">{holding.allocation.toFixed(1)}%</span>
                                            <div className="mt-1 h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all"
                                                    style={{ width: `${holding.allocation}%` }}
                                                />
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

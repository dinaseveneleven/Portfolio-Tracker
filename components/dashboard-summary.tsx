'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PortfolioMetrics } from '@/types/portfolio'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react'

interface DashboardSummaryProps {
    metrics: PortfolioMetrics
}

export function DashboardSummary({ metrics }: DashboardSummaryProps) {
    const isPositiveGain = metrics.totalGainLoss >= 0
    const isPositiveToday = metrics.todayChange >= 0

    return (
        <div className="grid gap-4 md:grid-cols-3">
            {/* Total Portfolio Value */}
            <Card className="border-none bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
                    <DollarSign className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{formatCurrency(metrics.totalValue)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Cost Basis: {formatCurrency(metrics.totalCost)}
                    </p>
                </CardContent>
            </Card>

            {/* Total Gain/Loss */}
            <Card className={`border-none bg-gradient-to-br ${isPositiveGain ? 'from-green-500/10 via-green-500/5' : 'from-red-500/10 via-red-500/5'} to-transparent`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
                    {isPositiveGain ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                </CardHeader>
                <CardContent>
                    <div className={`text-3xl font-bold ${isPositiveGain ? 'text-green-500' : 'text-red-500'}`}>
                        {formatCurrency(metrics.totalGainLoss)}
                    </div>
                    <p className={`text-xs mt-1 ${isPositiveGain ? 'text-green-500/80' : 'text-red-500/80'}`}>
                        {formatPercent(metrics.totalGainLossPercent)}
                    </p>
                </CardContent>
            </Card>

            {/* Today's Performance */}
            <Card className={`border-none bg-gradient-to-br ${isPositiveToday ? 'from-emerald-500/10 via-emerald-500/5' : 'from-orange-500/10 via-orange-500/5'} to-transparent`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Performance</CardTitle>
                    <Activity className={`h-4 w-4 ${isPositiveToday ? 'text-emerald-500' : 'text-orange-500'}`} />
                </CardHeader>
                <CardContent>
                    <div className={`text-3xl font-bold ${isPositiveToday ? 'text-emerald-500' : 'text-orange-500'}`}>
                        {formatCurrency(metrics.todayChange)}
                    </div>
                    <p className={`text-xs mt-1 ${isPositiveToday ? 'text-emerald-500/80' : 'text-orange-500/80'}`}>
                        {formatPercent(metrics.todayChangePercent)}
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

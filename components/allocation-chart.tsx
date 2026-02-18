'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { HoldingWithPrice } from '@/types/portfolio'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface AllocationChartProps {
    holdings: HoldingWithPrice[]
}

const COLORS = [
    'hsl(221.2, 83.2%, 53.3%)', // Primary blue
    'hsl(142.1, 76.2%, 36.3%)', // Success green
    'hsl(0, 84.2%, 60.2%)',     // Destructive red
    'hsl(45, 93%, 47%)',        // Warning yellow
    'hsl(280, 100%, 70%)',      // Purple
    'hsl(180, 100%, 40%)',      // Cyan
    'hsl(340, 100%, 50%)',      // Pink
]

export function AllocationChart({ holdings }: AllocationChartProps) {
    const data = holdings.map((holding, index) => ({
        name: holding.ticker,
        value: holding.currentValue,
        allocation: holding.allocation,
        color: COLORS[index % COLORS.length],
    }))

    return (
        <Card>
            <CardHeader>
                <CardTitle>Asset Allocation</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, allocation }) => `${name} ${allocation.toFixed(1)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload
                                    return (
                                        <div className="bg-background border rounded-lg p-2 shadow-lg">
                                            <p className="font-semibold">{data.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatCurrency(data.value)}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {data.allocation.toFixed(2)}%
                                            </p>
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

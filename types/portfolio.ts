export interface Holding {
    id: string
    ticker: string
    name: string
    quantity: number
    purchasePrice: number
    purchaseDate: string
    targetWeight?: number // Optional target percentage for rebalancing
}

export interface PriceData {
    ticker: string
    currentPrice: number
    change: number
    changePercent: number
    lastUpdated: string
    currency?: string // e.g. 'USD', 'IDR', 'JPY', 'GBp'
    exchangeRate?: number // Rate to convert to USD (e.g. 1/15800 for IDR)
    sparklineData?: number[]
}

export interface PortfolioMetrics {
    totalValue: number
    totalCost: number
    totalGainLoss: number
    totalGainLossPercent: number
    todayChange: number
    todayChangePercent: number
}

export interface HoldingWithPrice extends Holding {
    currentPrice: number
    currentValue: number
    gainLoss: number
    gainLossPercent: number
    allocation: number
    priceChange: number
    priceChangePercent: number
    currency?: string
    sparklineData?: number[]
}

import type { Holding, HoldingWithPrice, PortfolioMetrics, PriceData } from '@/types/portfolio'

export function enrichHoldingWithPrice(
    holding: Holding,
    priceData: PriceData
): HoldingWithPrice {
    const exchangeRate = priceData.exchangeRate || 1
    const currentPrice = priceData.currentPrice
    // Calculate value in USD
    const currentValue = holding.quantity * currentPrice * exchangeRate
    const costBasis = holding.quantity * holding.purchasePrice
    const gainLoss = currentValue - costBasis
    const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0

    return {
        ...holding,
        currentPrice, // Native price
        currentValue, // USD value
        gainLoss,     // USD gain/loss
        gainLossPercent,
        allocation: 0, // Will be calculated at portfolio level
        priceChange: priceData.change, // Native change
        priceChangePercent: priceData.changePercent,
        currency: priceData.currency,
        sparklineData: priceData.sparklineData
    }
}

export function calculatePortfolioMetrics(
    holdingsWithPrices: HoldingWithPrice[]
): PortfolioMetrics {
    const totalValue = holdingsWithPrices.reduce((sum, h) => sum + h.currentValue, 0)
    const totalCost = holdingsWithPrices.reduce(
        (sum, h) => sum + h.quantity * h.purchasePrice,
        0
    )
    const totalGainLoss = totalValue - totalCost
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0

    // Calculate today's performance
    const todayChange = holdingsWithPrices.reduce((sum, h) => {
        return sum + h.quantity * h.priceChange
    }, 0)

    const yesterdayValue = totalValue - todayChange
    const todayChangePercent = yesterdayValue > 0 ? (todayChange / yesterdayValue) * 100 : 0

    return {
        totalValue,
        totalCost,
        totalGainLoss,
        totalGainLossPercent,
        todayChange,
        todayChangePercent,
    }
}

export function calculateAllocations(
    holdingsWithPrices: HoldingWithPrice[]
): HoldingWithPrice[] {
    const totalValue = holdingsWithPrices.reduce((sum, h) => sum + h.currentValue, 0)

    return holdingsWithPrices.map(h => ({
        ...h,
        allocation: totalValue > 0 ? (h.currentValue / totalValue) * 100 : 0,
    }))
}

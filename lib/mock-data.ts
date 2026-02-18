
export const MOCK_PRICES: Record<string, number> = {
    'AAPL': 185.92,
    'GOOGL': 142.38,
    'MSFT': 404.52,
    'AMZN': 174.42,
    'TSLA': 199.95,
    'NVDA': 726.13,
    'META': 468.12,
    'NFLX': 559.60,
    'BTC': 52145.20,
    'ETH': 2890.15
}

export function getMockPrice(ticker: string): number {
    const upperTicker = ticker.toUpperCase()
    let price = MOCK_PRICES[upperTicker]

    if (!price) {
        // Generate a deterministic price based on ticker so it doesn't jump around
        const seed = upperTicker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        price = (seed % 500) + 50
    }

    return price
}

export function getMockHistory(ticker: string, points: number = 30, intervalMs: number = 86400000): any[] {
    const currentPrice = getMockPrice(ticker)
    const now = Date.now()

    return Array.from({ length: points }, (_, i) => {
        // Create a slight deterministic curve based on index, not random noise
        const time = now - ((points - 1 - i) * intervalMs)
        // Simple sine wave + linear trend to look like a chart
        const trend = (i / points) * 0.05 // +5% over the period
        const wave = Math.sin(i * 0.5) * 0.02 // +/- 2% waves
        const price = currentPrice * (0.95 + trend + wave)

        return {
            time,
            price
        }
    })
}

export function getMockSparkline(ticker: string): number[] {
    return getMockHistory(ticker, 20).map(h => h.price)
}

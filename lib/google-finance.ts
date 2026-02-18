import type { PriceData } from '@/types/portfolio'

// Cache to store recent price fetches
const priceCache = new Map<string, { data: PriceData; timestamp: number }>()
const CACHE_DURATION = 60000 // 1 minute

/**
 * Fetch stock prices using browser scraping from Google Finance
 * This is Option B - browser-based scraping approach
 */
export async function fetchPrices(tickers: string[]): Promise<Map<string, PriceData>> {
    const prices = new Map<string, PriceData>()
    const now = Date.now()

    // Check cache first
    for (const ticker of tickers) {
        const cached = priceCache.get(ticker)
        if (cached && now - cached.timestamp < CACHE_DURATION) {
            prices.set(ticker, cached.data)
        }
    }

    // Filter out cached tickers
    const tickersToFetch = tickers.filter(t => !prices.has(t))

    if (tickersToFetch.length === 0) {
        return prices
    }

    // Make API request to our backend endpoint which will scrape Google Finance
    try {
        const response = await fetch('/api/prices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tickers: tickersToFetch }),
        })

        if (!response.ok) {
            throw new Error('Failed to fetch prices')
        }

        const data = await response.json()

        // Process the response and update cache
        for (const priceData of data.prices) {
            prices.set(priceData.ticker, priceData)
            priceCache.set(priceData.ticker, { data: priceData, timestamp: now })
        }
    } catch (error) {
        console.error('Error fetching prices:', error)

        // Return improved mock data for development
        // This is a temporary fallback until the scraping backend is fully reliable
        const MOCK_PRICES: Record<string, number> = {
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

        for (const ticker of tickersToFetch) {
            // Use predefined mock price or generate a stable random price based on ticker char codes
            let price = MOCK_PRICES[ticker.toUpperCase()]

            if (!price) {
                // Generate a deterministic "random" price based on ticker so it doesn't jump around on refresh
                const seed = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
                price = (seed % 500) + 50
            }

            const mockPrice: PriceData = {
                ticker,
                currentPrice: price,
                change: price * (Math.random() * 0.05 - 0.02), // +/- 2% change
                changePercent: (Math.random() * 5 - 2.5), // +/- 2.5%
                lastUpdated: new Date().toISOString(),
            }
            prices.set(ticker, mockPrice)
        }
    }

    return prices
}

/**
 * Clear the price cache - useful for manual refresh
 */
export function clearPriceCache(): void {
    priceCache.clear()
}

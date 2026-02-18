import type { PriceData } from '@/types/portfolio'
import { getMockPrice, getMockSparkline } from '@/lib/mock-data'

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


        for (const ticker of tickersToFetch) {
            // Use shared deterministic mock data
            let price = getMockPrice(ticker)

            const mockPrice: PriceData = {
                ticker,
                currentPrice: price,
                change: price * 0.02, // Consistent 2% change for prototype
                changePercent: 2.0,
                lastUpdated: new Date().toISOString(),
                sparklineData: getMockSparkline(ticker)
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

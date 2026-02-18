import { NextRequest, NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'

export const dynamic = 'force-dynamic'

// Configure yahoo-finance2 to be less strict and noisy
// @ts-ignore
// yahooFinance.suppressNotices(['yahooSurvey', 'nonsensical', 'validation'])
// @ts-ignore
// yahooFinance.setGlobalConfig({
//    validation: { logErrors: false },
//    queue: { concurrency: 2 } // Limit concurrency to avoid rate limits
// })

export async function POST(req: NextRequest) {
    try {
        const { tickers } = await req.json()

        if (!tickers || !Array.isArray(tickers)) {
            return NextResponse.json({ error: 'Tickers array is required' }, { status: 400 })
        }

        const results = await Promise.all(
            tickers.map(async (ticker) => {
                try {
                    const quote: any = await yahooFinance.quote(ticker)

                    // Fetch historical data for sparkline (7 days)
                    const end = new Date()
                    const start = new Date()
                    start.setDate(end.getDate() - 7)

                    let sparklineData: number[] = []
                    try {
                        const history: any = await yahooFinance.chart(ticker, {
                            period1: start,
                            period2: end,
                            interval: '1d'
                        })
                        if (history && history.quotes) {
                            sparklineData = history.quotes
                                .map((q: any) => q.close)
                                .filter((p: any) => p !== null && p !== undefined)
                        }
                    } catch (hErr) {
                        console.warn(`Failed to fetch history for ${ticker}`, hErr)
                    }

                    return {
                        ticker,
                        currentPrice: quote.regularMarketPrice,
                        change: quote.regularMarketChange,
                        changePercent: quote.regularMarketChangePercent,
                        lastUpdated: new Date().toISOString(),
                        currency: quote.currency,
                        exchangeRate: quote.currency === 'IDR' ? 1 / 15800 : (quote.currency === 'USD' ? 1 : 1), // Unified currency logic
                        sparklineData
                    }
                } catch (e) {
                    console.warn(`Error fetching ${ticker}, using mock:`, e)
                    const mockPrice = getMockPrice(ticker)

                    // Deterministic sparkline
                    const sparklineData = Array.from({ length: 20 }, (_, i) => {
                        const trend = (i / 20) * 0.05
                        const wave = Math.sin(i * 0.5) * 0.02
                        return mockPrice * (0.95 + trend + wave)
                    })

                    return {
                        ticker,
                        currentPrice: mockPrice,
                        change: mockPrice * 0.015,
                        changePercent: 1.5,
                        lastUpdated: new Date().toISOString(),
                        currency: 'USD',
                        exchangeRate: 1,
                        sparklineData,
                        isMock: true
                    }
                }
            })
        )

        return NextResponse.json({
            prices: results
        })
    } catch (error) {
        console.error('Price fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 })
    }
}

// Simple internal implementation to avoid import issues
const MOCK_PRICES: Record<string, number> = {
    'AAPL': 185.92, 'GOOGL': 142.38, 'MSFT': 404.52, 'AMZN': 174.42,
    'TSLA': 199.95, 'NVDA': 726.13, 'META': 468.12, 'NFLX': 559.60,
    'BTC': 52145.20, 'ETH': 2890.15, 'BBRI.JK': 6200, 'BBCA.JK': 9800,
    'BMRI.JK': 7200, 'TLKM.JK': 3900
}

function getMockPrice(ticker: string): number {
    const upperTicker = ticker.toUpperCase()
    let price = MOCK_PRICES[upperTicker]
    if (!price) {
        const seed = upperTicker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        price = (seed % 500) + 50
    }
    return price
}

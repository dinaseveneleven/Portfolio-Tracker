import { NextRequest, NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'

export const dynamic = 'force-dynamic'

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
                    console.error(`Error fetching ${ticker}:`, e)
                    return null
                }
            })
        )

        return NextResponse.json({
            prices: results.filter(r => r !== null)
        })
    } catch (error) {
        console.error('Bulk fetch error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

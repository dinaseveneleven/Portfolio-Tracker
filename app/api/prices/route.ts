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
                    return {
                        ticker,
                        currentPrice: quote.regularMarketPrice,
                        change: quote.regularMarketChange,
                        changePercent: quote.regularMarketChangePercent,
                        lastUpdated: new Date().toISOString()
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

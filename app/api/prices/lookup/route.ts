import { NextRequest, NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const ticker = searchParams.get('ticker')

    if (!ticker) {
        return NextResponse.json({ error: 'Ticker is required' }, { status: 400 })
    }

    try {
        const quote: any = await yahooFinance.quote(ticker)

        return NextResponse.json({
            ticker: quote.symbol,
            name: quote.shortName || quote.longName || quote.symbol,
            currentPrice: quote.regularMarketPrice,
            change: quote.regularMarketChange,
            changePercent: quote.regularMarketChangePercent,
            currency: quote.currency,
            exchangeRate: quote.currency === 'IDR' ? 1 / 15800 : (quote.currency === 'USD' ? 1 : 1), // Simplified - for IDR mode
            lastUpdated: new Date().toISOString()
        })
    } catch (error) {
        console.error('Lookup error:', error)
        return NextResponse.json({ error: 'Failed to fetch price' }, { status: 500 })
    }
}

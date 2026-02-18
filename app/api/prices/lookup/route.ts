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
        let history: any[] = []

        // If range is provided, fetch historical data
        const range = searchParams.get('range')
        if (range) {
            const end = new Date()
            const start = new Date()

            switch (range) {
                case '1D': start.setDate(end.getDate() - 1); break;
                case '1W': start.setDate(end.getDate() - 7); break;
                case '1M': start.setMonth(end.getMonth() - 1); break;
                case 'YTD': start.setFullYear(end.getFullYear(), 0, 1); break;
                case '1Y': start.setFullYear(end.getFullYear() - 1); break;
                case '5Y': start.setFullYear(end.getFullYear() - 5); break;
                default: start.setDate(end.getDate() - 1); // Default to 1D
            }

            try {
                const chartData: any = await yahooFinance.chart(ticker, {
                    period1: start,
                    period2: end,
                    interval: range === '1D' || range === '1W' ? '15m' : '1d'
                })
                if (chartData && chartData.quotes) {
                    history = chartData.quotes
                        .filter((q: any) => q.close !== null)
                        .map((q: any) => ({
                            time: q.date.getTime(),
                            price: q.close
                        }))
                }
            } catch (hErr) {
                console.warn(`Failed to fetch history for ${ticker} (${range})`, hErr)
            }
        }

        return NextResponse.json({
            ticker: quote.symbol,
            name: quote.shortName || quote.longName || quote.symbol,
            currentPrice: quote.regularMarketPrice,
            change: quote.regularMarketChange,
            changePercent: quote.regularMarketChangePercent,
            currency: quote.currency,
            exchangeRate: quote.currency === 'IDR' ? 1 / 15800 : (quote.currency === 'USD' ? 1 : 1), // Simplified - for IDR mode
            lastUpdated: new Date().toISOString(),
            history // Return history if requested
        })
    } catch (error) {
        console.error('Lookup error:', error)
        return NextResponse.json({ error: 'Failed to fetch price' }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'

export const dynamic = 'force-dynamic'

// Configure yahoo-finance2
// @ts-ignore
yahooFinance.suppressNotices(['yahooSurvey', 'nonsensical', 'validation'])
// @ts-ignore
yahooFinance.setGlobalConfig({
    validation: { logErrors: false }
})

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
        console.warn('Lookup failed, falling back to mock data:', error)

        // Mock Fallback using prototype data
        const mockPrice = getMockPrice(ticker)
        let history: any[] = []

        const range = searchParams.get('range')
        if (range) {
            const points = range === '1D' ? 24 : 30
            const interval = range === '1D' ? 3600000 : 86400000
            history = getMockHistory(ticker, points, interval)
        }

        return NextResponse.json({
            ticker: ticker.toUpperCase(),
            name: `${ticker.toUpperCase()}`,
            currentPrice: mockPrice,
            change: mockPrice * 0.02,
            changePercent: 2.0,
            currency: 'USD',
            exchangeRate: 1,
            lastUpdated: new Date().toISOString(),
            history,
            isMock: true
        })
    }
}

// Simple internal implementation to avoid import issues if any
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

function getMockHistory(ticker: string, points: number, intervalMs: number): any[] {
    const currentPrice = getMockPrice(ticker)
    const now = Date.now()
    return Array.from({ length: points }, (_, i) => {
        const time = now - ((points - 1 - i) * intervalMs)
        const trend = (i / points) * 0.05
        const wave = Math.sin(i * 0.5) * 0.02
        return { time, price: currentPrice * (0.95 + trend + wave) }
    })
}

import { NextRequest, NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'
const yahooFinance = new YahooFinance()

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const ticker = searchParams.get('ticker')

    if (!ticker) {
        return NextResponse.json({ error: 'Ticker is required' }, { status: 400 })
    }

    try {
        const rangeParam = searchParams.get('range') || '1D'
        let period1 = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        let interval: any = '15m' // Safer default for international tickers

        if (rangeParam === '1W') {
            period1 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            interval = '1h'
        } else if (rangeParam === '1M') {
            period1 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            interval = '1d'
        } else if (rangeParam === '1Y') {
            period1 = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
            interval = '1d'
        } else if (rangeParam === '5Y') {
            period1 = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000)
            interval = '1wk'
        } else if (rangeParam === 'YTD') {
            period1 = new Date(new Date().getFullYear(), 0, 1)
            interval = '1d'
        }

        // Fetch Quote and Chart data in parallel
        // We catch chart errors specifically so the main price still shows up
        let quote: any
        let chart: any = { quotes: [] }

        try {
            const [q, c] = await Promise.all([
                yahooFinance.quote(ticker),
                yahooFinance.chart(ticker, { period1, interval }).catch(err => {
                    console.error("Chart fetch failed:", err.message);
                    return { quotes: [] };
                })
            ])
            quote = q
            chart = c
        } catch (e) {
            console.error("Primary fetch failed, trying fallback for quote only:", e)
            quote = await yahooFinance.quote(ticker)
        }

        if (!quote) {
            return NextResponse.json({ error: 'Price not found' }, { status: 404 })
        }

        // Cast to avoid TS errors
        const q = quote as any
        const c = chart as any

        // Extract history for chart
        let history: { time: number, price: number }[] = []
        if (c && c.quotes) {
            history = c.quotes
                .map((item: any) => ({
                    time: item.date ? item.date.getTime() : 0,
                    price: item.close
                }))
                .filter((item: any) => item.price !== null && item.time !== 0)
        }

        // Fetch Exchange Rate if currency is not USD
        let conversionRate = 1
        const currencyCode = q.currency || 'USD'

        if (currencyCode !== 'USD') {
            try {
                // Yahoo convention: USD[CUR]=X (usually)
                // For GBp (pence), we use GBP=X then / 100
                const tickerCode = currencyCode === 'GBp' ? 'GBP' : currencyCode
                const rateTicker = `USD${tickerCode}=X`

                const rateQuote = await yahooFinance.quote(rateTicker) as any

                if (rateQuote && rateQuote.regularMarketPrice) {
                    // rateQuote.regularMarketPrice for USDIDR=X is ~15800
                    // Multiplier to convert IDR -> USD is 1 / 15800
                    conversionRate = 1 / rateQuote.regularMarketPrice

                    if (currencyCode === 'GBp') {
                        conversionRate = conversionRate / 100
                    }
                }
            } catch (e) {
                console.error("Failed to fetch rate for lookup", e)
            }
        }

        return NextResponse.json({
            ticker: q.symbol,
            currentPrice: q.regularMarketPrice || 0,
            change: q.regularMarketChange || 0,
            changePercent: q.regularMarketChangePercent || 0,
            history: history,
            currency: currencyCode,
            exchangeRate: conversionRate
        })

    } catch (error) {
        console.error('Error looking up price:', error)
        // Log to file for debugging
        const fs = require('fs')
        fs.appendFileSync('debug-error.log', `Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))} \n`)

        return NextResponse.json(
            { error: 'Failed to lookup price. Ensure ticker is valid (e.g., AAPL, BTC-USD).' },
            { status: 500 }
        )
    }
}

import { NextRequest, NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'
import type { PriceData } from '@/types/portfolio'

const yahooFinance = new YahooFinance()

export async function POST(request: NextRequest) {
    try {
        const { tickers } = await request.json()

        if (!Array.isArray(tickers) || tickers.length === 0) {
            return NextResponse.json({ prices: [] })
        }

        const prices: PriceData[] = []

        try {
            // 1. Fetch asset quotes
            const results = await yahooFinance.quote(tickers)
            const pricesMap = new Map<string, any>()
            const currenciesToFetch = new Set<string>()

            for (const result of results) {
                if (!result) continue
                pricesMap.set(result.symbol, result)
                if (result.currency && result.currency !== 'USD') {
                    currenciesToFetch.add(result.currency)
                }
            }

            // 2. Fetch exchange rates for non-USD currencies
            const exchangeRates = new Map<string, number>()
            if (currenciesToFetch.size > 0) {
                const rateTickers = Array.from(currenciesToFetch).map(c => {
                    // Special case for GBp (pence) -> use GBP
                    const code = c === 'GBp' ? 'GBP' : c
                    return `USD${code}=X`
                })

                if (rateTickers.length > 0) {
                    try {
                        const rateResults = await yahooFinance.quote(rateTickers)
                        for (const rate of rateResults) {
                            if (!rate || !rate.regularMarketPrice) continue
                            // Symbol is "USDIDR=X". Price is 15800.
                            // We need multiplier to convert IDR -> USD.
                            // So we need 1 / 15800.
                            const pair = rate.symbol.replace('=X', '') // USDIDR
                            const targetCur = pair.replace('USD', '') // IDR
                            exchangeRates.set(targetCur, 1 / rate.regularMarketPrice)
                        }
                    } catch (e) {
                        console.error("Failed to fetch rates", e)
                    }
                }
            }

            // 3. Fetch historical data for sparklines in parallel
            const chartsMap = new Map<string, number[]>()
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

            await Promise.all(tickers.map(async (ticker) => {
                try {
                    const result: any = await yahooFinance.chart(ticker, { period1: sevenDaysAgo, interval: '1d' })
                    if (result && result.quotes) {
                        const history = result.quotes
                            .map((q: any) => q.close)
                            .filter((c: any) => c !== null)
                        chartsMap.set(ticker, history)
                    }
                } catch (e) {
                    console.error(`Sparkline fetch failed for ${ticker}`)
                }
            }))

            // 4. Construct response
            for (const result of results) {
                if (!result) continue

                let conversionRate = 1
                const currency = result.currency || 'USD'

                if (currency !== 'USD') {
                    // Handle GBp (Pence) special case: 100 GBp = 1 GBP
                    if (currency === 'GBp') {
                        const rate = exchangeRates.get('GBP')
                        if (rate) conversionRate = rate / 100 // Convert pence to pounds, then to USD
                    } else {
                        conversionRate = exchangeRates.get(currency) || 1
                    }
                }

                prices.push({
                    ticker: result.symbol,
                    currentPrice: result.regularMarketPrice || 0,
                    change: result.regularMarketChange || 0,
                    changePercent: result.regularMarketChangePercent || 0,
                    lastUpdated: result.regularMarketTime ? new Date(result.regularMarketTime).toISOString() : new Date().toISOString(),
                    currency: currency,
                    exchangeRate: conversionRate,
                    sparklineData: chartsMap.get(result.symbol)
                })
            }
        } catch (apiError) {
            console.error('Yahoo Finance API Error:', apiError)
            return NextResponse.json(
                { error: 'Failed to fetch market data from Yahoo Finance' },
                { status: 500 }
            )
        }

        return NextResponse.json({ prices })

    } catch (error) {
        console.error('Error in prices API:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

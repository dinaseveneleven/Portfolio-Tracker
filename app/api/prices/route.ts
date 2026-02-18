import { NextRequest, NextResponse } from 'next/server'
import { getMockPrice, getMockSparkline } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'

const API_KEY = process.env.TWELVE_DATA_API_KEY || ''
const BASE_URL = 'https://api.twelvedata.com'

// Server-side cache (persists across requests in dev, per-invocation on Netlify)
const quoteCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Normalize user-facing ticker to Twelve Data format
 * BBRI.JK -> BBRI   (Jakarta Stock Exchange)
 * BTC-USD -> BTC/USD (Crypto pair)
 */
function normalizeSymbol(ticker: string): string {
    if (ticker.toUpperCase().endsWith('.JK')) {
        return ticker.slice(0, -3)
    }
    if (ticker.includes('-')) {
        return ticker.replace('-', '/')
    }
    return ticker
}

function createMockResult(ticker: string) {
    const price = getMockPrice(ticker)
    return {
        ticker,
        currentPrice: price,
        change: price * 0.015,
        changePercent: 1.5,
        lastUpdated: new Date().toISOString(),
        currency: 'USD',
        exchangeRate: 1,
        sparklineData: getMockSparkline(ticker),
        isMock: true
    }
}

export async function POST(req: NextRequest) {
    try {
        const { tickers } = await req.json()

        if (!tickers || !Array.isArray(tickers)) {
            return NextResponse.json({ error: 'Tickers array is required' }, { status: 400 })
        }

        if (!API_KEY) {
            console.warn('[API/prices] No TWELVE_DATA_API_KEY set — returning mock data')
            return NextResponse.json({
                prices: tickers.map(createMockResult)
            })
        }

        const now = Date.now()
        const cachedResults: any[] = []
        const tickersToFetch: string[] = []

        for (const ticker of tickers) {
            const cached = quoteCache.get(ticker)
            if (cached && now - cached.timestamp < CACHE_TTL) {
                cachedResults.push(cached.data)
            } else {
                tickersToFetch.push(ticker)
            }
        }

        let fetchedResults: any[] = []

        if (tickersToFetch.length > 0) {
            try {
                // Twelve Data supports batch: /quote?symbol=AAPL,MSFT,GOOGL (1 API credit!)
                const symbols = tickersToFetch.map(normalizeSymbol).join(',')
                const url = `${BASE_URL}/quote?symbol=${encodeURIComponent(symbols)}&apikey=${API_KEY}`

                console.log(`[API/prices] Fetching batch quote for: ${symbols}`)

                const controller = new AbortController()
                const timeout = setTimeout(() => controller.abort(), 15000)

                const res = await fetch(url, { signal: controller.signal })
                clearTimeout(timeout)
                const json = await res.json()

                // Single ticker returns object directly; multiple returns keyed object
                const isSingle = tickersToFetch.length === 1

                for (let i = 0; i < tickersToFetch.length; i++) {
                    const originalTicker = tickersToFetch[i]
                    const sym = normalizeSymbol(originalTicker)
                    const quote = isSingle ? json : json[sym]

                    if (quote && quote.close && !quote.code) {
                        const price = parseFloat(quote.close)
                        const result = {
                            ticker: originalTicker,
                            currentPrice: price,
                            change: parseFloat(quote.change || '0'),
                            changePercent: parseFloat(quote.percent_change || '0'),
                            lastUpdated: new Date().toISOString(),
                            currency: quote.currency || 'USD',
                            exchangeRate: 1,
                            sparklineData: [] as number[]
                        }
                        quoteCache.set(originalTicker, { data: result, timestamp: now })
                        fetchedResults.push(result)
                    } else {
                        console.warn(`[API/prices] No data for ${originalTicker}, using mock`)
                        fetchedResults.push(createMockResult(originalTicker))
                    }
                }
            } catch (e: any) {
                console.error('[API/prices] Batch fetch failed, using mock for remaining:', e.message)
                fetchedResults = tickersToFetch.map(createMockResult)
            }
        }

        return NextResponse.json({
            prices: [...cachedResults, ...fetchedResults]
        })

    } catch (error) {
        console.error('Price fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 })
    }
}

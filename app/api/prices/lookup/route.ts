import { NextRequest, NextResponse } from 'next/server'
import { getMockPrice, getMockHistory } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'

const API_KEY = process.env.TWELVE_DATA_API_KEY || ''
const BASE_URL = 'https://api.twelvedata.com'

// Server-side cache
const lookupCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Normalize user-facing ticker to Twelve Data format
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

/**
 * Detect if ticker is an exchange rate request (e.g. USDIDR=X)
 */
function isExchangeRate(ticker: string): boolean {
    return ticker.toUpperCase().endsWith('=X')
}

/**
 * Parse exchange rate ticker: USDIDR=X -> { from: 'USD', to: 'IDR' }
 */
function parseExchangeRateTicker(ticker: string): { from: string; to: string } {
    const cleaned = ticker.replace('=X', '')
    // Assume first 3 chars are the "from" currency, rest is "to"
    return {
        from: cleaned.substring(0, 3).toUpperCase(),
        to: cleaned.substring(3).toUpperCase()
    }
}

/**
 * Map range parameter to Twelve Data time_series interval+outputsize
 */
function getTimeSeriesParams(range: string): { interval: string; outputsize: number } {
    switch (range) {
        case '1D': return { interval: '15min', outputsize: 30 }
        case '1W': return { interval: '1h', outputsize: 40 }
        case '1M': return { interval: '1day', outputsize: 30 }
        case 'YTD': {
            const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000)
            return { interval: '1day', outputsize: Math.min(dayOfYear, 365) }
        }
        case '1Y': return { interval: '1day', outputsize: 252 }
        case '5Y': return { interval: '1week', outputsize: 260 }
        default: return { interval: '1day', outputsize: 30 }
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const ticker = searchParams.get('ticker')

    if (!ticker) {
        return NextResponse.json({ error: 'Ticker is required' }, { status: 400 })
    }

    // --- Handle Exchange Rate tickers (e.g. USDIDR=X) ---
    if (isExchangeRate(ticker)) {
        return handleExchangeRate(ticker)
    }

    // --- Normal stock/crypto lookup ---
    const now = Date.now()
    const cacheKey = `${ticker}:${searchParams.get('range') || 'none'}`
    const cached = lookupCache.get(cacheKey)

    if (cached && now - cached.timestamp < CACHE_TTL) {
        return NextResponse.json(cached.data)
    }

    if (!API_KEY) {
        console.warn('[API/lookup] No TWELVE_DATA_API_KEY — returning mock')
        return returnMockLookup(ticker, searchParams.get('range'))
    }

    try {
        const symbol = normalizeSymbol(ticker)
        console.log(`[API/lookup] Fetching quote for: ${symbol} (original: ${ticker})`)

        // Fetch quote
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 12000)

        const quoteUrl = `${BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`
        const quoteRes = await fetch(quoteUrl, { signal: controller.signal })
        clearTimeout(timeout)
        const quote = await quoteRes.json()

        if (quote.code || quote.status === 'error') {
            console.error(`[API/lookup] Quote error for ${symbol}:`, quote.message)
            return returnMockLookup(ticker, searchParams.get('range'))
        }

        console.log(`[API/lookup] Got price for ${symbol}: ${quote.close}`)

        // Fetch history if range is provided
        let history: { time: number; price: number }[] = []
        const range = searchParams.get('range')

        if (range) {
            try {
                const { interval, outputsize } = getTimeSeriesParams(range)
                const tsUrl = `${BASE_URL}/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${outputsize}&apikey=${API_KEY}`

                const tsController = new AbortController()
                const tsTimeout = setTimeout(() => tsController.abort(), 12000)
                const tsRes = await fetch(tsUrl, { signal: tsController.signal })
                clearTimeout(tsTimeout)
                const tsData = await tsRes.json()

                if (tsData.values && Array.isArray(tsData.values)) {
                    // Twelve Data returns newest-first; reverse for chronological order
                    history = tsData.values
                        .reverse()
                        .map((v: any) => ({
                            time: new Date(v.datetime).getTime(),
                            price: parseFloat(v.close)
                        }))
                        .filter((h: any) => !isNaN(h.price) && h.time > 0)
                }
            } catch (hErr: any) {
                console.warn(`[API/lookup] History fetch failed for ${symbol}:`, hErr.message)
            }
        }

        const result = {
            ticker: ticker.toUpperCase(),
            name: quote.name || ticker.toUpperCase(),
            currentPrice: parseFloat(quote.close),
            change: parseFloat(quote.change || '0'),
            changePercent: parseFloat(quote.percent_change || '0'),
            currency: quote.currency || 'USD',
            exchangeRate: 1,
            lastUpdated: new Date().toISOString(),
            history
        }

        lookupCache.set(cacheKey, { data: result, timestamp: now })
        return NextResponse.json(result)

    } catch (error: any) {
        console.error(`[API/lookup] Failed for ${ticker}:`, error.message)
        return returnMockLookup(ticker, searchParams.get('range'))
    }
}

/**
 * Handle exchange rate lookups (e.g. USDIDR=X)
 */
async function handleExchangeRate(ticker: string) {
    const { from, to } = parseExchangeRateTicker(ticker)

    if (!API_KEY) {
        // Return hardcoded fallback for common rates
        const fallbackRates: Record<string, number> = { 'USDIDR': 15800, 'USDEUR': 0.92, 'USDGBP': 0.79, 'USDJPY': 149.5 }
        const key = `${from}${to}`
        return NextResponse.json({
            ticker: ticker.toUpperCase(),
            name: `${from}/${to} Exchange Rate`,
            currentPrice: fallbackRates[key] || 1,
            change: 0,
            changePercent: 0,
            currency: to,
            lastUpdated: new Date().toISOString(),
            isMock: true
        })
    }

    try {
        const url = `${BASE_URL}/exchange_rate?symbol=${from}/${to}&apikey=${API_KEY}`

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10000)
        const res = await fetch(url, { signal: controller.signal })
        clearTimeout(timeout)
        const data = await res.json()

        if (data.rate) {
            return NextResponse.json({
                ticker: ticker.toUpperCase(),
                name: `${from}/${to} Exchange Rate`,
                currentPrice: parseFloat(data.rate),
                change: 0,
                changePercent: 0,
                currency: to,
                lastUpdated: new Date().toISOString()
            })
        }

        throw new Error(data.message || 'Exchange rate not available')
    } catch (error: any) {
        console.error(`[API/lookup] Exchange rate failed for ${ticker}:`, error.message)
        const fallbackRates: Record<string, number> = { 'USDIDR': 15800 }
        const key = `${parseExchangeRateTicker(ticker).from}${parseExchangeRateTicker(ticker).to}`
        return NextResponse.json({
            ticker: ticker.toUpperCase(),
            name: `Exchange Rate`,
            currentPrice: fallbackRates[key] || 1,
            change: 0,
            changePercent: 0,
            currency: parseExchangeRateTicker(ticker).to,
            lastUpdated: new Date().toISOString(),
            isMock: true
        })
    }
}

/**
 * Return mock data when API is unavailable
 */
function returnMockLookup(ticker: string, range: string | null) {
    const mockPrice = getMockPrice(ticker)
    let history: any[] = []
    if (range) {
        const points = range === '1D' ? 24 : 30
        const interval = range === '1D' ? 3600000 : 86400000
        history = getMockHistory(ticker, points, interval)
    }

    return NextResponse.json({
        ticker: ticker.toUpperCase(),
        name: ticker.toUpperCase(),
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

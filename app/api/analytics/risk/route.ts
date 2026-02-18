import { NextRequest, NextResponse } from 'next/server'
import { getNavHistory, getHoldings } from '@/lib/data-store'
import YahooFinance from 'yahoo-finance2'

const yahooFinance = new YahooFinance()

export async function GET() {
    try {
        const [navHistory, holdings] = await Promise.all([
            getNavHistory(),
            getHoldings()
        ])

        if (navHistory.length < 2) {
            return NextResponse.json({
                error: 'Insufficient historical data for risk metrics. Need at least 2 days of NAV tracking.'
            }, { status: 400 })
        }

        // 1. Calculate Portfolio Return & Volatility using Asset-based approach (Modern Portfolio Theory)
        // This is "Capital-Agnostic" - it won't be messed up by deposits or withdrawals (liquidations)
        const allHoldings = holdings.filter(h => h.quantity > 0)
        const totalPortValue = allHoldings.reduce((sum, h) => sum + (h.quantity * h.purchasePrice), 0)

        const tickerHistory: Map<string, number[]> = new Map()
        const tickerVols: Map<string, number> = new Map()
        const tickerWeights: Map<string, number> = new Map()

        if (allHoldings.length > 0) {
            // Fetch history for ALL holdings to get accurate portfolio volatility
            await Promise.all(allHoldings.map(async (h) => {
                try {
                    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    const result: any = await yahooFinance.chart(h.ticker, { period1: thirtyDaysAgo, interval: '1d' })

                    if (result && result.quotes && result.quotes.length > 1) {
                        const returns = []
                        for (let i = 1; i < result.quotes.length; i++) {
                            const q1 = result.quotes[i].close
                            const q0 = result.quotes[i - 1].close
                            if (q1 != null && q0 != null && q0 !== 0) {
                                returns.push((q1 / q0) - 1)
                            }
                        }
                        tickerHistory.set(h.ticker, returns)

                        // Calculate individual asset annualized volatility
                        const avg = returns.reduce((p, c) => p + c, 0) / returns.length
                        const vari = returns.reduce((p, c) => p + Math.pow(c - avg, 2), 0) / returns.length
                        tickerVols.set(h.ticker, Math.sqrt(vari)) // We need DAILY vol for matrix math

                        // Current Weight
                        tickerWeights.set(h.ticker, (h.quantity * h.purchasePrice) / totalPortValue)
                    }
                } catch (e) {
                    console.error(`Failed to fetch history for ${h.ticker}`, e)
                }
            }))

            // Calculate Portfolio Volatility using Covariance (Modern Portfolio Theory)
            // Var(P) = Σ Σ w_i w_j Cov(i, j)
            let portfolioVarDaily = 0
            const tickers = Array.from(tickerHistory.keys())

            for (let i = 0; i < tickers.length; i++) {
                const t1 = tickers[i]
                const w1 = tickerWeights.get(t1) || 0
                const vol1 = tickerVols.get(t1) || 0
                const ret1 = tickerHistory.get(t1) || []

                for (let j = 0; j < tickers.length; j++) {
                    const t2 = tickers[j]
                    const w2 = tickerWeights.get(t2) || 0
                    const vol2 = tickerVols.get(t2) || 0
                    const ret2 = tickerHistory.get(t2) || []

                    // Calculate Correlation ρ_ij
                    const minLen = Math.min(ret1.length, ret2.length)
                    if (minLen < 2) continue

                    const r1 = ret1.slice(-minLen)
                    const r2 = ret2.slice(-minLen)
                    const m1 = r1.reduce((p, c) => p + c, 0) / minLen
                    const m2 = r2.reduce((p, c) => p + c, 0) / minLen

                    let num = 0, d1 = 0, d2 = 0
                    for (let k = 0; k < minLen; k++) {
                        num += (r1[k] - m1) * (r2[k] - m2)
                        d1 += Math.pow(r1[k] - m1, 2)
                        d2 += Math.pow(r2[k] - m2, 2)
                    }
                    const correlation = (d1 * d2 === 0) ? 0 : num / Math.sqrt(d1 * d2)

                    // Covariance = σ_i * σ_j * ρ_ij
                    const covariance = vol1 * vol2 * correlation
                    portfolioVarDaily += w1 * w2 * covariance
                }
            }

            let annualizedVol = Math.sqrt(portfolioVarDaily) * Math.sqrt(252)

            // Calculate Performance (Weighted Return)
            let weightedReturnDaily = 0
            tickerHistory.forEach((returns, ticker) => {
                const weight = tickerWeights.get(ticker) || 0
                const avgRet = returns.reduce((p, c) => p + c, 0) / returns.length
                weightedReturnDaily += avgRet * weight
            })
            let annualizedReturn = weightedReturnDaily * 252

            // Use NAV History if stable and mature (as a health check), 
            // but the Asset-based approach is now the "Smarter" source of truth for Risk.
            // If NAV history exists, we can blend or just stick to the composition-based one which is better for "Current Situation".

            // 2. Correlation Matrix for UI (Top 5 only to keep it clean)
            const topTickersForMatrix = [...holdings]
                .sort((a, b) => (b.quantity * b.purchasePrice) - (a.quantity * a.purchasePrice))
                .slice(0, 5)

            const correlationMatrix: any[] = []
            for (const h1 of topTickersForMatrix) {
                const row: any = { ticker: h1.ticker }
                const ret1 = tickerHistory.get(h1.ticker) || []

                for (const h2 of topTickersForMatrix) {
                    const ret2 = tickerHistory.get(h2.ticker) || []
                    if (ret1.length < 2 || ret2.length < 2) {
                        row[h2.ticker] = h1.ticker === h2.ticker ? 1 : 0
                        continue
                    }

                    const minLen = Math.min(ret1.length, ret2.length)
                    const r1 = ret1.slice(-minLen), r2 = ret2.slice(-minLen)
                    const m1 = r1.reduce((p, c) => p + c, 0) / minLen, m2 = r2.reduce((p, c) => p + c, 0) / minLen
                    let num = 0, d1 = 0, d2 = 0
                    for (let k = 0; k < minLen; k++) {
                        num += (r1[k] - m1) * (r2[k] - m2)
                        d1 += Math.pow(r1[k] - m1, 2)
                        d2 += Math.pow(r2[k] - m2, 2)
                    }
                    row[h2.ticker] = Number((num / Math.sqrt(d1 * d2) || 0).toFixed(2))
                }
                correlationMatrix.push(row)
            }

            const riskFreeRate = 0.04
            const sharpeRatio = annualizedVol > 0.01 ? (annualizedReturn - riskFreeRate) / annualizedVol : 0

            return NextResponse.json({
                sharpeRatio: Number(sharpeRatio.toFixed(2)),
                volatility: annualizedVol,
                annualizedReturn,
                correlationMatrix,
                topHoldings: topTickersForMatrix.map(h => h.ticker)
            })
        }

        return NextResponse.json({
            sharpeRatio: 0,
            volatility: 0,
            annualizedReturn: 0,
            correlationMatrix: [],
            topHoldings: []
        })

    } catch (error) {
        console.error('Error calculating risk metrics:', error)
        return NextResponse.json({ error: 'Failed to calculate risk metrics' }, { status: 500 })
    }
}

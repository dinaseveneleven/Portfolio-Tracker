'use client'

import { useEffect, useState, useCallback } from 'react'
import { NetWorthHero } from '@/components/net-worth-hero'
import { AssetDataTable } from '@/components/asset-data-table'
import { InsightsTab } from '@/components/insights-tab'
import { TransactionSheet } from '@/components/transaction-sheet'
import { ThemeToggle } from '@/components/theme-toggle'
import { RefreshButton } from '@/components/refresh-button'
import { CurrencyToggle } from '@/components/currency-toggle'
import type { Holding, HoldingWithPrice, PortfolioMetrics } from '@/types/portfolio'
import { cn } from '@/lib/utils'
import { fetchPrices, clearPriceCache } from '@/lib/google-finance'
import { enrichHoldingWithPrice, calculatePortfolioMetrics, calculateAllocations } from '@/lib/calculations'
import { Logo } from '@/components/logo'
import { getHoldings, addHolding, updateHolding, deleteHolding, saveNavSnapshot } from '@/lib/data-store'

export default function HomePage() {
    const [activeTab, setActiveTab] = useState<'assets' | 'insights'>('assets')
    const [holdings, setHoldings] = useState<HoldingWithPrice[]>([])
    const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    // Calculate previous day's value if possible (or just use day change)
    // For net worth hero, we pass totalValue and maybe simulated previous value
    const previousValue = metrics ? metrics.totalValue - metrics.todayChange : 0

    const loadPortfolioData = useCallback(async () => {
        try {
            setRefreshing(true)
            // Fetch holdings directly from Supabase via data-store
            const rawHoldings = await getHoldings()

            // Fetch prices for all tickers
            const tickers = rawHoldings.map((h: Holding) => h.ticker)
            const prices = await fetchPrices(tickers)

            // Enrich holdings with price data
            const enrichedHoldings = rawHoldings.map((holding: Holding) => {
                const priceData = prices.get(holding.ticker)

                // If we don't have price data, use purchase price as fallback
                // In a real app we might show an error state for that asset
                const currentPrice = priceData ? priceData.currentPrice : holding.purchasePrice
                const change = priceData ? priceData.change : 0
                const changePercent = priceData ? priceData.changePercent : 0
                const lastUpdated = priceData ? priceData.lastUpdated : new Date().toISOString()

                // We need to construct priceData object if it's missing to match expected type in helpers
                // But enrichHoldingWithPrice expects the priceData object
                const safePriceData = priceData || {
                    ticker: holding.ticker,
                    currentPrice,
                    change,
                    changePercent,
                    lastUpdated
                }

                return enrichHoldingWithPrice(holding, safePriceData)
            })

            // Calculate allocations
            const withAllocations = calculateAllocations(enrichedHoldings)

            // Calculate portfolio metrics
            const portfolioMetrics = calculatePortfolioMetrics(withAllocations)

            setHoldings(withAllocations)
            setMetrics(portfolioMetrics)

            if (portfolioMetrics.totalValue > 0) {
                // Save locally
                // saveDailySnapshot(portfolioMetrics.totalValue) 

                // Save to Supabase directly
                saveNavSnapshot(portfolioMetrics.totalValue)
                    .catch(err => console.error('Failed to save server snapshot', err))
            }

        } catch (error) {
            console.error('Error loading portfolio data:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        loadPortfolioData()
        // Determine if we should auto-refresh? Maybe every minute?
        const interval = setInterval(loadPortfolioData, 60000)
        return () => clearInterval(interval)
    }, [loadPortfolioData])

    const handleAddAsset = async (asset: Omit<Holding, 'id'>) => {
        try {
            await addHolding(asset)
            clearPriceCache() // Clear cache to force fresh fetch for new asset
            loadPortfolioData()
        } catch (error) {
            console.error('Error adding asset:', error)
        }
    }

    const handleRefresh = async () => {
        clearPriceCache()
        await loadPortfolioData()
    }

    const handleDeleteAsset = async (id: string) => {
        if (!confirm('Are you sure you want to delete this asset?')) return
        try {
            await deleteHolding(id)
            loadPortfolioData()
        } catch (error) {
            console.error('Error deleting asset:', error)
        }
    }

    const handleUpdateAsset = async (id: string, updates: Partial<Holding>) => {
        // Optimistic update for immediate UI feedback
        setHoldings(prev => prev.map(h => h.id === id ? { ...h, ...updates } as HoldingWithPrice : h))

        try {
            await updateHolding(id, updates)

            // Only trigger a full data reload if we actually changed something that requires new pricing
            const isCriticalChange = updates.quantity !== undefined || updates.ticker !== undefined
            if (isCriticalChange) {
                loadPortfolioData()
            }
        } catch (error) {
            console.error('Error updating asset:', error)
            // Revert on error
            loadPortfolioData()
        }
    }

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [activeTab])

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10 transition-colors duration-500">
            {/* Minimal Header */}
            <header className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b z-50">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <Logo className="cursor-pointer hover:opacity-80 transition-opacity" />
                    <div className="flex items-center gap-4">
                        <CurrencyToggle />
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 pt-32 pb-20 space-y-12 max-w-5xl">
                {/* Hero Section */}
                <section>
                    {loading ? (
                        <div className="animate-pulse h-48 w-full bg-muted/20 rounded-3xl" />
                    ) : (
                        <NetWorthHero
                            totalValue={metrics?.totalValue || 0}
                            previousValue={previousValue}
                            isLoading={refreshing}
                        />
                    )}
                </section>

                {/* Actions Header & Tabs */}
                <section className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-6 border-b border-border/50 pb-2">
                        <div className="flex gap-8">
                            <button
                                onClick={() => setActiveTab('assets')}
                                className={cn(
                                    "text-3xl font-light tracking-tight transition-all pb-3 relative",
                                    activeTab === 'assets' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Assets
                                {activeTab === 'assets' && (
                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('insights')}
                                className={cn(
                                    "text-3xl font-light tracking-tight transition-all pb-3 relative",
                                    activeTab === 'insights' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Insights
                                {activeTab === 'insights' && (
                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />
                                )}
                            </button>
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                            <RefreshButton onRefresh={handleRefresh} />
                            <div className="h-8 w-[1px] bg-border/50 mx-1 hidden sm:block" />
                            <TransactionSheet key={activeTab} onAddAsset={handleAddAsset} />
                        </div>
                    </div>
                </section>

                {/* Tab Content */}
                <section className="transition-all duration-500">
                    {activeTab === 'assets' ? (
                        <AssetDataTable
                            key="assets"
                            assets={holdings}
                            isLoading={loading}
                            onDeleteAsset={handleDeleteAsset}
                            onUpdateAsset={handleUpdateAsset}
                        />
                    ) : (
                        <InsightsTab
                            key="insights"
                            assets={holdings}
                            onUpdateAsset={handleUpdateAsset}
                        />
                    )}
                </section>
            </main>
        </div>
    )
}

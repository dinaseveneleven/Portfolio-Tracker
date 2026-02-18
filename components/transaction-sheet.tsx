"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Holding } from "@/types/portfolio"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/context/currency-context"
import { PriceChart } from "./price-chart"

interface TransactionSheetProps {
    onAddAsset: (asset: Omit<Holding, "id">) => void
}

interface PriceLookupResult {
    ticker: string
    currentPrice: number
    change: number
    changePercent: number
    history: any[]
    currency?: string
    exchangeRate?: number
    isMock?: boolean
}


export function TransactionSheet({ onAddAsset }: TransactionSheetProps) {
    const { currency: appCurrency, exchangeRate: appExchangeRate, formatValue } = useCurrency()
    const [open, setOpen] = useState(false)
    const [formData, setFormData] = useState({
        ticker: "",
        name: "",
        quantity: "",
        purchasePrice: "",
        purchaseDate: new Date().toISOString().split('T')[0]
    })

    // Lookup state
    const [lookupLoading, setLookupLoading] = useState(false)
    const [priceData, setPriceData] = useState<PriceLookupResult | null>(null)
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        let finalPurchasePrice = Number(formData.purchasePrice)

        // Convert to USD if the asset is foreign and we have a rate
        if (priceData && priceData.currency && priceData.currency !== 'USD' && priceData.exchangeRate) {
            finalPurchasePrice = finalPurchasePrice * priceData.exchangeRate
        }

        onAddAsset({
            ticker: formData.ticker.toUpperCase(),
            name: formData.name || formData.ticker.toUpperCase(),
            quantity: Number(formData.quantity),
            purchasePrice: finalPurchasePrice, // Always store in USD
            purchaseDate: formData.purchaseDate
        })
        setOpen(false)
        resetForm()
    }

    const resetForm = () => {
        setFormData({
            ticker: "",
            name: "",
            quantity: "",
            purchasePrice: "",
            purchaseDate: new Date().toISOString().split('T')[0]
        })
        setPriceData(null)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))

        if (name === 'ticker') {
            if (debounceTimer) clearTimeout(debounceTimer)

            // Clear name and price when ticker changes significantly
            setFormData(prev => ({
                ...prev,
                name: "",
                purchasePrice: ""
            }))

            if (value.length >= 2) {
                const timer = setTimeout(() => {
                    lookupPrice(value)
                }, 800)
                setDebounceTimer(timer)
            } else {
                setPriceData(null)
            }
        }
    }

    const lookupPrice = async (ticker: string) => {
        setLookupLoading(true)
        try {
            // Attempt to fetch from API (will work in dev, may 404 in static export)
            const res = await fetch(`/api/prices/lookup?ticker=${ticker.toUpperCase()}`)
            if (res.ok) {
                const data = await res.json()
                setPriceData(data)
                // Auto-fill price and name if empty
                setFormData(prev => ({
                    ...prev,
                    purchasePrice: prev.purchasePrice ? prev.purchasePrice : data.currentPrice.toFixed(2),
                    name: prev.name ? prev.name : data.name || data.ticker
                }))
            } else {
                console.warn(`Price lookup failed for ${ticker} (Status: ${res.status}). Static export fallback active.`)
                setPriceData(null)
            }
        } catch (error) {
            console.error('Price lookup error:', error)
            setPriceData(null)
        } finally {
            setLookupLoading(false)
        }
    }

    // Effect to clear data when sheet closes
    useEffect(() => {
        if (!open) {
            resetForm()
        }
    }, [open])

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button className="rounded-full h-12 px-6 shadow-lg hover:shadow-xl transition-all duration-300 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" /> Add Asset
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] border-l-border/10 backdrop-blur-xl bg-background/80 overflow-y-auto">
                <SheetHeader className="mb-8">
                    <SheetTitle className="text-2xl font-light tracking-tight">New Transaction</SheetTitle>
                    <SheetDescription>
                        Add a new holding to your portfolio. Real-time prices will be fetched automatically.
                    </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="ticker" className="text-xs uppercase tracking-wider text-muted-foreground">Ticker Symbol</Label>
                        <div className="relative">
                            <Input
                                id="ticker"
                                name="ticker"
                                placeholder="e.g. AAPL"
                                value={formData.ticker}
                                onChange={handleChange}
                                required
                                className="font-mono uppercase bg-transparent border-input/50 focus:border-primary pr-10"
                            />
                            <div className="absolute right-3 top-2.5 text-muted-foreground">
                                {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </div>
                        </div>
                    </div>

                    {/* Main Transaction Inputs */}
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground">Asset Name (Optional)</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="e.g. Apple Inc."
                                value={formData.name}
                                onChange={handleChange}
                                className="bg-transparent border-input/50 focus:border-primary"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="quantity" className="text-xs uppercase tracking-wider text-muted-foreground">Quantity</Label>
                                <Input
                                    id="quantity"
                                    name="quantity"
                                    type="number"
                                    step="any"
                                    placeholder="0.00"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    required
                                    autoFocus={!!priceData}
                                    className="font-numeric bg-transparent border-input/50 focus:border-primary no-spinner"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="purchasePrice" className="text-xs uppercase tracking-wider text-muted-foreground">
                                    Buy Price ({priceData?.currency || 'USD'})
                                </Label>
                                <Input
                                    id="purchasePrice"
                                    name="purchasePrice"
                                    type="number"
                                    step="any"
                                    placeholder={priceData?.currency && priceData.currency !== 'USD' ? "e.g. 10200" : "$0.00"}
                                    value={formData.purchasePrice}
                                    onChange={handleChange}
                                    required
                                    className="font-numeric bg-transparent border-input/50 focus:border-primary no-spinner"
                                />
                                {/* If Foreign Asset: Show approx USD cost */}
                                {priceData?.currency && priceData.currency !== 'USD' && formData.purchasePrice && (
                                    <p className="text-[10px] text-muted-foreground text-right">
                                        ≈ ${(Number(formData.purchasePrice) * (priceData.exchangeRate || 0)).toFixed(2)} USD
                                    </p>
                                )}

                                {/* If USD Asset but App is in IDR: Show approx IDR cost */}
                                {(!priceData?.currency || priceData.currency === 'USD') && appCurrency === 'IDR' && formData.purchasePrice && (
                                    <p className="text-[10px] text-muted-foreground text-right">
                                        ≈ {formatValue(Number(formData.purchasePrice))}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Total Investment Preview */}
                        {formData.quantity && formData.purchasePrice && (
                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 animate-in zoom-in-95 duration-300">
                                <div className="flex justify-between items-center text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                    <span>Total Investment</span>
                                    <span>Qty × Price</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="text-2xl font-bold tracking-tighter">
                                        {priceData?.currency && priceData.currency !== 'USD' ? priceData.currency : '$'}
                                        {(Number(formData.quantity) * Number(formData.purchasePrice)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    {/* Conversion to App Currency if different */}
                                    {priceData?.currency && priceData.currency !== appCurrency && (
                                        <div className="text-sm font-medium text-primary/80 mb-0.5">
                                            ≈ {formatValue(
                                                Number(formData.quantity) *
                                                Number(formData.purchasePrice) *
                                                (priceData.exchangeRate || 1) /
                                                (appCurrency === 'USD' ? 1 : appExchangeRate)
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="purchaseDate" className="text-xs uppercase tracking-wider text-muted-foreground">Date</Label>
                            <Input
                                id="purchaseDate"
                                name="purchaseDate"
                                type="date"
                                value={formData.purchaseDate}
                                onChange={handleChange}
                                required
                                className="bg-transparent border-input/50 focus:border-primary pl-4 pr-1 date-picker-right"
                            />
                        </div>
                    </div>

                    {/* Detailed Historical Chart (Secondary Info) */}
                    {priceData && (
                        <div className="flex flex-col gap-4 py-4 border-t border-border/10 animate-in fade-in duration-700">
                            <div className="flex justify-between items-center">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                            Market Performance
                                        </span>
                                        <Badge variant="outline" className={cn(
                                            "h-5 px-1.5 text-[9px] font-bold border-success/30 text-success bg-success/5 uppercase tracking-tighter",
                                            priceData.isMock && "border-yellow-500/30 text-yellow-500 bg-yellow-500/5"
                                        )}>
                                            {priceData.isMock ? "Simulated Data" : "Live Data Found"}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-2xl font-bold tracking-tighter">
                                            {priceData.currency && priceData.currency !== 'USD' ? priceData.currency : '$'}
                                            {priceData.currentPrice.toLocaleString()}
                                        </span>
                                        <Badge variant={priceData.change >= 0 ? "default" : "destructive"} className="h-6 px-2 text-xs font-bold rounded-md">
                                            {priceData.change >= 0 ? "+" : ""}{priceData.changePercent.toFixed(2)}%
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <PriceChart
                                ticker={priceData.ticker}
                                baseCurrency={priceData.currency && priceData.currency !== 'USD' ? priceData.currency : '$'}
                                isPositive={priceData.change >= 0}
                            />

                            <p className="text-[10px] text-muted-foreground/60 leading-relaxed italic">
                                Real-time market data sourced from Yahoo Finance. Default price and date have been pre-filled.
                            </p>
                        </div>
                    )}

                    <SheetFooter className="mt-8">
                        <Button type="submit" className="w-full h-12 text-sm font-medium tracking-wide">
                            Confirm Transaction
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}

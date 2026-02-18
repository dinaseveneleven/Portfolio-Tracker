"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { FloatingRateNotification } from '@/components/floating-rate-notification'

type Currency = 'USD' | 'IDR'

interface CurrencyContextType {
    currency: Currency
    exchangeRate: number
    toggleCurrency: () => void
    formatValue: (valueUSD: number) => string
    isLoading: boolean
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrency] = useState<Currency>('USD')
    const [exchangeRate, setExchangeRate] = useState<number>(15800) // Fallback default
    const [isLoading, setIsLoading] = useState(true)

    // Notification State
    const [showNotification, setShowNotification] = useState(false)
    const [notifMessage, setNotifMessage] = useState('')

    // Load preference from local storage
    useEffect(() => {
        const saved = localStorage.getItem('portfolio-currency') as Currency
        if (saved) setCurrency(saved)
    }, [])

    // Fetch Exchange Rate (IDR=X)
    useEffect(() => {
        async function fetchRate() {
            try {
                // Fetch USD/IDR rate (1 USD = ? IDR)
                const res = await fetch('/api/prices/lookup?ticker=USDIDR=X')
                if (res.ok) {
                    const data = await res.json()
                    // If USDIDR=X returns ~15800, that's our multiplier for IDR mode
                    if (data.currentPrice) {
                        setExchangeRate(data.currentPrice)
                    }
                }
            } catch (error) {
                console.error('Failed to fetch exchange rate', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchRate()
        // Refresh rate every 5 minutes
        const interval = setInterval(fetchRate, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [])

    const toggleCurrency = () => {
        const newCurrency = currency === 'USD' ? 'IDR' : 'USD'
        setCurrency(newCurrency)
        localStorage.setItem('portfolio-currency', newCurrency)

        // Trigger Notification
        const rateStr = exchangeRate.toLocaleString(undefined, { maximumFractionDigits: 2 })
        const invRateStr = (1 / exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 6 })

        if (newCurrency === 'IDR') {
            setNotifMessage(`1 USD = ${rateStr} IDR`)
        } else {
            setNotifMessage(`1 IDR = ${invRateStr} USD`)
        }
        setShowNotification(true)
    }

    const formatValue = (valueUSD: number) => {
        if (currency === 'USD') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(valueUSD)
        } else {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(valueUSD * exchangeRate)
        }
    }

    return (
        <CurrencyContext.Provider value={{ currency, exchangeRate, toggleCurrency, formatValue, isLoading }}>
            {children}
            <FloatingRateNotification
                isVisible={showNotification}
                message={notifMessage}
                onClose={() => setShowNotification(false)}
            />
        </CurrencyContext.Provider>
    )
}

export function useCurrency() {
    const context = useContext(CurrencyContext)
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider')
    }
    return context
}

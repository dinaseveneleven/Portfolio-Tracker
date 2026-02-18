"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { clearPriceCache } from '@/lib/google-finance'

interface RefreshButtonProps {
    onRefresh: () => Promise<void>
}

export function RefreshButton({ onRefresh }: RefreshButtonProps) {
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        setLastUpdate(new Date())
    }, [])

    const handleRefresh = async () => {
        setIsRefreshing(true)
        try {
            clearPriceCache()
            await onRefresh()
            setLastUpdate(new Date())
        } finally {
            setIsRefreshing(false)
        }
    }

    return (
        <div className="flex flex-col items-end gap-1">
            <Button
                variant="secondary"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="rounded-full h-10 px-5 gap-2 transition-all duration-300 hover:bg-secondary/80"
            >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="text-xs font-medium">
                    {isRefreshing ? 'Refreshing...' : 'Refresh Prices'}
                </span>
            </Button>
            <span className="text-[10px] text-muted-foreground/60 font-medium tracking-tight mr-2 min-h-[1rem]">
                {lastUpdate && mounted ? (
                    `Last updated: ${lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                ) : (
                    <span>&nbsp;</span>
                )}
            </span>
        </div>
    )
}

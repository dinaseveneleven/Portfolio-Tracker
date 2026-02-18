"use client"

export interface NavSnapshot {
    date: string
    value: number
}

const STORAGE_KEY = 'portfolio_nav_history'

export function getNavHistory(): NavSnapshot[] {
    if (typeof window === 'undefined') return []
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        return stored ? JSON.parse(stored) : []
    } catch (e) {
        console.error('Failed to parse NAV history', e)
        return []
    }
}

export function saveDailySnapshot(currentValue: number): void {
    if (typeof window === 'undefined') return

    // Don't save 0 value
    if (currentValue === 0) return

    const today = new Date().toISOString().split('T')[0]
    const history = getNavHistory()

    // Check if we already have a snapshot for today
    const lastSnapshot = history[history.length - 1]

    if (lastSnapshot && lastSnapshot.date === today) {
        // Update today's snapshot with latest value
        history[history.length - 1].value = currentValue
    } else {
        // Add new snapshot
        history.push({ date: today, value: currentValue })
    }

    // Keep last 365 days
    if (history.length > 365) {
        history.shift()
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

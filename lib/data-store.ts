import fs from 'fs/promises'
import path from 'path'
import type { Holding } from '@/types/portfolio'

const NAV_FILE = path.join(process.cwd(), 'data', 'nav_history.json')
const DATA_FILE = path.join(process.cwd(), 'data', 'holdings.json')

export interface NavSnapshot {
    date: string
    value: number
}

export async function getNavHistory(): Promise<NavSnapshot[]> {
    try {
        const data = await fs.readFile(NAV_FILE, 'utf-8')
        return JSON.parse(data)
    } catch (error) {
        return []
    }
}

export async function saveNavSnapshot(value: number): Promise<void> {
    const history = await getNavHistory()
    const today = new Date().toISOString().split('T')[0]

    const lastSnapshot = history[history.length - 1]
    if (lastSnapshot && lastSnapshot.date === today) {
        lastSnapshot.value = value
    } else {
        history.push({ date: today, value })
    }

    // Keep 1 year of history
    if (history.length > 365) history.shift()

    await fs.writeFile(NAV_FILE, JSON.stringify(history, null, 2))
}

export async function getHoldings(): Promise<Holding[]> {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf-8')
        return JSON.parse(data)
    } catch (error) {
        console.error('Error reading holdings:', error)
        return []
    }
}

export async function addHolding(holding: Omit<Holding, 'id'>): Promise<Holding> {
    const holdings = await getHoldings()
    const newHolding: Holding = {
        ...holding,
        id: Date.now().toString(),
    }
    holdings.push(newHolding)
    await fs.writeFile(DATA_FILE, JSON.stringify(holdings, null, 2))
    return newHolding
}

export async function updateHolding(id: string, updates: Partial<Holding>): Promise<Holding | null> {
    const holdings = await getHoldings()
    const index = holdings.findIndex(h => h.id === id)

    if (index === -1) return null

    holdings[index] = { ...holdings[index], ...updates }
    await fs.writeFile(DATA_FILE, JSON.stringify(holdings, null, 2))
    return holdings[index]
}

export async function deleteHolding(id: string): Promise<boolean> {
    const holdings = await getHoldings()
    const filtered = holdings.filter(h => h.id !== id)

    if (filtered.length === holdings.length) return false

    await fs.writeFile(DATA_FILE, JSON.stringify(filtered, null, 2))
    return true
}

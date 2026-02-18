import { supabase } from './supabase'
import type { Holding } from '@/types/portfolio'

export interface NavSnapshot {
    date: string
    value: number
}

export async function getNavHistory(): Promise<NavSnapshot[]> {
    try {
        const { data, error } = await supabase
            .from('nav_history')
            .select('date, value')
            .order('date', { ascending: true })

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error fetching NAV history:', error)
        return []
    }
}

export async function saveNavSnapshot(value: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0]

    try {
        const { error } = await supabase
            .from('nav_history')
            .upsert({ date: today, value }, { onConflict: 'date' })

        if (error) throw error
    } catch (error) {
        console.error('Error saving NAV snapshot:', error)
    }
}

export async function getHoldings(): Promise<Holding[]> {
    try {
        const { data, error } = await supabase
            .from('holdings')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error

        // Map snake_case to camelCase to match types
        return (data || []).map(h => ({
            id: h.id,
            ticker: h.ticker,
            name: h.name,
            quantity: h.quantity,
            purchasePrice: h.purchase_price,
            purchaseDate: h.purchase_date,
            targetWeight: h.target_weight
        }))
    } catch (error) {
        console.error('Error reading holdings:', error)
        return []
    }
}

export async function addHolding(holding: Omit<Holding, 'id'>): Promise<Holding> {
    try {
        const { data, error } = await supabase
            .from('holdings')
            .insert([{
                ticker: holding.ticker,
                name: holding.name,
                quantity: holding.quantity,
                purchase_price: holding.purchasePrice,
                purchase_date: holding.purchaseDate,
                target_weight: holding.targetWeight
            }])
            .select()
            .single()

        if (error) throw error

        return {
            id: data.id,
            ticker: data.ticker,
            name: data.name,
            quantity: data.quantity,
            purchasePrice: data.purchase_price,
            purchaseDate: data.purchase_date,
            targetWeight: data.target_weight
        }
    } catch (error) {
        console.error('Error adding holding:', error)
        throw error
    }
}

export async function updateHolding(id: string, updates: Partial<Holding>): Promise<Holding | null> {
    try {
        // Map camelCase to snake_case
        const dbUpdates: any = {}
        if (updates.ticker !== undefined) dbUpdates.ticker = updates.ticker
        if (updates.name !== undefined) dbUpdates.name = updates.name
        if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity
        if (updates.purchasePrice !== undefined) dbUpdates.purchase_price = updates.purchasePrice
        if (updates.purchaseDate !== undefined) dbUpdates.purchase_date = updates.purchaseDate
        if (updates.targetWeight !== undefined) dbUpdates.target_weight = updates.targetWeight

        const { data, error } = await supabase
            .from('holdings')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        return {
            id: data.id,
            ticker: data.ticker,
            name: data.name,
            quantity: data.quantity,
            purchasePrice: data.purchase_price,
            purchaseDate: data.purchase_date,
            targetWeight: data.target_weight
        }
    } catch (error) {
        console.error('Error updating holding:', error)
        return null
    }
}

export async function deleteHolding(id: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('holdings')
            .delete()
            .eq('id', id)

        if (error) throw error
        return true
    } catch (error) {
        console.error('Error deleting holding:', error)
        return false
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { saveNavSnapshot } from '@/lib/data-store'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { value } = body

        if (value === undefined || value === null) {
            return NextResponse.json({ error: 'Value is required' }, { status: 400 })
        }

        await saveNavSnapshot(value)
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error saving NAV snapshot:', error)
        return NextResponse.json({ error: 'Failed to save snapshot' }, { status: 500 })
    }
}

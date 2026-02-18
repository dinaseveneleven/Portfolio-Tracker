import { NextRequest, NextResponse } from 'next/server'
import { getHoldings, addHolding, updateHolding, deleteHolding } from '@/lib/data-store'

export async function GET() {
    try {
        const holdings = await getHoldings()
        return NextResponse.json({ holdings })
    } catch (error) {
        console.error('Error fetching holdings:', error)
        return NextResponse.json(
            { error: 'Failed to fetch holdings' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { ticker, quantity, purchasePrice, purchaseDate, name } = body

        if (!ticker || !quantity || !purchasePrice || !purchaseDate) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const newHolding = await addHolding({
            ticker,
            quantity,
            purchasePrice,
            purchaseDate,
            name: name || ticker
        })

        return NextResponse.json({ holding: newHolding }, { status: 201 })
    } catch (error) {
        console.error('Error adding holding:', error)
        return NextResponse.json(
            { error: 'Failed to add holding' },
            { status: 500 }
        )
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const { id, ...updates } = body

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 })
        }

        const updated = await updateHolding(id, updates)
        if (!updated) {
            return NextResponse.json({ error: 'Holding not found' }, { status: 404 })
        }

        return NextResponse.json({ holding: updated })
    } catch (error) {
        console.error('Error updating holding:', error)
        return NextResponse.json({ error: 'Failed to update holding' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 })
        }

        const success = await deleteHolding(id)
        if (!success) {
            return NextResponse.json({ error: 'Holding not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting holding:', error)
        return NextResponse.json({ error: 'Failed to delete holding' }, { status: 500 })
    }
}


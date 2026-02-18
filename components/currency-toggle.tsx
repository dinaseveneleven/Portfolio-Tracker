"use client"

import { Button } from "@/components/ui/button"
import { useCurrency } from "@/context/currency-context"
import { ArrowLeftRight } from "lucide-react"

export function CurrencyToggle() {
    const { currency, toggleCurrency, isLoading } = useCurrency()

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={toggleCurrency}
            className="font-mono text-xs w-20 flex justify-between px-3 relative overflow-hidden group"
            disabled={isLoading}
        >
            <span className={currency === 'USD' ? 'text-primary font-bold' : 'text-muted-foreground'}>$</span>
            <ArrowLeftRight className="h-3 w-3 opacity-50 text-muted-foreground" />
            <span className={currency === 'IDR' ? 'text-primary font-bold' : 'text-muted-foreground'}>Rp</span>
        </Button>
    )
}

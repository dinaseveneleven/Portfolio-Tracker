"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface LogoProps {
    className?: string
    showText?: boolean
}

export const Logo: React.FC<LogoProps> = ({ className, showText = true }) => {
    return (
        <div className={cn("flex items-center gap-3 select-none", className)}>
            {/* Icon Shapes */}
            <div className="relative w-10 h-10 flex-shrink-0">
                {/* Square - Behind */}
                <div className="absolute top-0 left-0 w-8 h-8 border-[1.5px] border-foreground/80 rounded-sm" />
                {/* Triangle - In front, overlapping */}
                <div className="absolute bottom-0 right-0 w-8 h-8">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-foreground">
                        <polygon
                            points="50,5 95,95 5,95"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="5"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            </div>

            {/* Text Group */}
            {showText && (
                <div className="flex flex-col justify-center">
                    <div className="flex items-center leading-none">
                        <span className="text-2xl font-bold tracking-tight text-foreground">P</span>
                        <span className="text-2xl font-bold tracking-tight text-foreground/70">&</span>
                        <span className="text-2xl font-bold tracking-tight text-foreground uppercase">ebs</span>
                    </div>
                    <span className="text-[9px] font-medium tracking-wider text-muted-foreground uppercase whitespace-nowrap">
                        Portfolio Equity Bond Solution
                    </span>
                </div>
            )}
        </div>
    );
};

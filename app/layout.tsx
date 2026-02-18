import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { CurrencyProvider } from '@/context/currency-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Portfolio Tracker - Real-time Asset Management',
    description: 'Track your investment portfolio with real-time Google Finance data',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className} suppressHydrationWarning>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <CurrencyProvider>
                        {children}
                    </CurrencyProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}

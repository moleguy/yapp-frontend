import {type Metadata} from 'next'
import {Geist, Geist_Mono} from 'next/font/google'
import './globals.css'
import {AuthProvider} from './contexts/AuthContext'
import {WebSocketProvider} from './contexts/WebSocketProvider'
import {EdgeStoreProvider} from '@/lib/edgestore';
import {DialogProvider} from './contexts/DialogContext';
import {ThemeProvider} from './contexts/ThemeContext';
import ThemeScript from './components/ThemeScript';
import React from "react";

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
})

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
})

export const metadata: Metadata = {
    title: {
        default: 'Yapp',
        template: '%s | Yapp'
    },
    description: 'Real-time chat application with file sharing capabilities',
    keywords: ['chat', 'messaging', 'real-time', 'file sharing'],
    authors: [
        {name: 'Nischal'},
        {name: 'Manish'},
        {name: 'Sandesh'}
    ],
    creator: 'Yapp co.',
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://yapp.chat',
        title: 'Yapp',
        description: 'Real-time chat application with file sharing capabilities',
        siteName: 'Yapp',
        // images: [{ url: '/og-image.png' }],
    },
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            <ThemeScript />
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
        <AuthProvider>
            <WebSocketProvider>
                <EdgeStoreProvider>
                    <DialogProvider>
                        {children}
                    </DialogProvider>
                </EdgeStoreProvider>
            </WebSocketProvider>
        </AuthProvider>
        </ThemeProvider>
        </body>
        </html>
    )
}

import type React from "react"
import type { Metadata } from "next"
import { Inter, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { WalletProvider } from "@/lib/wallet-context"
import { InventoryProvider } from "@/lib/inventory-context"
import "./globals.css"

const _inter = Inter({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "bilardo.fun - Play & Win SOL",
  description:
    "The ultimate multiplayer 8-ball pool platform. Play bilardo games, compete against players worldwide, and win Solana prizes!",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script src="https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js"></script>
      </head>
      <body className="font-sans antialiased">
        <WalletProvider>
          <InventoryProvider>{children}</InventoryProvider>
        </WalletProvider>
        <Analytics />
      </body>
    </html>
  )
}

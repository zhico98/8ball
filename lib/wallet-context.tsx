"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { Connection, PublicKey } from "@solana/web3.js"

export interface UserProfile {
  username: string
  avatar: string | null
  twitter: string | null
  telegram: string | null
  isPrivate: boolean
  matchHistory: MatchHistory[]
  wins: number
  losses: number
  totalEarnings: number
}

export interface MatchHistory {
  id: string
  opponent: string
  opponentAvatar: string
  result: "win" | "loss"
  stake: number
  date: string
}

interface WalletContextType {
  connected: boolean
  publicKey: string | null
  balance: number
  profile: UserProfile | null
  connect: () => Promise<void>
  disconnect: () => void
  updateProfile: (updates: Partial<UserProfile>) => void
}

const WalletContext = createContext<WalletContextType | null>(null)

const defaultProfile: UserProfile = {
  username: "Player",
  avatar: null,
  twitter: null,
  telegram: null,
  isPrivate: false,
  matchHistory: [],
  wins: 0,
  losses: 0,
  totalEarnings: 0,
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [balance, setBalance] = useState(0)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const fetchWalletBalance = async (pubKey: string) => {
    try {
      // Use devnet for development or mainnet-beta for production
      const connection = new Connection("https://api.devnet.solana.com", "confirmed")
      const publicKeyObj = new PublicKey(pubKey)
      const balanceLamports = await connection.getBalance(publicKeyObj)
      const balanceSOL = balanceLamports / 1_000_000_000
      setBalance(Number(balanceSOL.toFixed(4)))
    } catch (error) {
      console.error("Failed to fetch balance:", error)
      // Set balance to 0 on error but don't break the app
      setBalance(0)
    }
  }

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== "undefined" && (window as any).solana?.isPhantom) {
        try {
          const resp = await (window as any).solana.connect({ onlyIfTrusted: true })
          const pk = resp.publicKey.toString()
          setPublicKey(pk)
          setConnected(true)

          await fetchWalletBalance(pk)

          const savedProfile = localStorage.getItem(`profile_${pk}`)
          if (savedProfile) {
            setProfile(JSON.parse(savedProfile))
          } else {
            setProfile({
              ...defaultProfile,
              username: `Player_${pk.slice(0, 4)}`,
            })
          }
        } catch {
          // Not previously connected
        }
      }
    }
    checkConnection()
  }, [])

  const connect = async () => {
    if (typeof window !== "undefined" && (window as any).solana?.isPhantom) {
      try {
        const resp = await (window as any).solana.connect()
        const pk = resp.publicKey.toString()
        setPublicKey(pk)
        setConnected(true)

        await fetchWalletBalance(pk)

        const savedProfile = localStorage.getItem(`profile_${pk}`)
        if (savedProfile) {
          setProfile(JSON.parse(savedProfile))
        } else {
          setProfile({
            ...defaultProfile,
            username: `Player_${pk.slice(0, 4)}`,
          })
        }
      } catch (err) {
        console.error("Wallet connection failed:", err)
        alert("Failed to connect wallet. Please make sure Phantom is installed and unlocked.")
      }
    } else {
      const installWallet = confirm(
        "Phantom wallet not detected. Would you like to install it? (Click OK to open Phantom website)",
      )
      if (installWallet) {
        window.open("https://phantom.app/", "_blank")
      }
    }
  }

  const disconnect = () => {
    if (typeof window !== "undefined" && (window as any).solana) {
      ;(window as any).solana.disconnect()
    }
    setConnected(false)
    setPublicKey(null)
    setBalance(0)
    setProfile(null)
  }

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (profile && publicKey) {
      const newProfile = { ...profile, ...updates }
      setProfile(newProfile)
      localStorage.setItem(`profile_${publicKey}`, JSON.stringify(newProfile))
    }
  }

  return (
    <WalletContext.Provider value={{ connected, publicKey, balance, profile, connect, disconnect, updateProfile }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}

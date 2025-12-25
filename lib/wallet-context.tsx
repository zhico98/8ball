"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

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
  matchHistory: [
    { id: "1", opponent: "SolShark", opponentAvatar: "SS", result: "win", stake: 0.5, date: "2024-01-15" },
    { id: "2", opponent: "PoolMaster", opponentAvatar: "PM", result: "loss", stake: 1.0, date: "2024-01-14" },
    { id: "3", opponent: "8BallKing", opponentAvatar: "8K", result: "win", stake: 2.0, date: "2024-01-13" },
  ],
  wins: 24,
  losses: 12,
  totalEarnings: 15.5,
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [balance, setBalance] = useState(0)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== "undefined" && (window as any).solana?.isPhantom) {
        try {
          const resp = await (window as any).solana.connect({ onlyIfTrusted: true })
          setPublicKey(resp.publicKey.toString())
          setConnected(true)
          setBalance(Number((Math.random() * 10 + 1).toFixed(4)))

          const savedProfile = localStorage.getItem(`profile_${resp.publicKey.toString()}`)
          if (savedProfile) {
            setProfile(JSON.parse(savedProfile))
          } else {
            setProfile({ ...defaultProfile, username: `Player_${resp.publicKey.toString().slice(0, 4)}` })
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
        setBalance(Number((Math.random() * 10 + 1).toFixed(4)))

        const savedProfile = localStorage.getItem(`profile_${pk}`)
        if (savedProfile) {
          setProfile(JSON.parse(savedProfile))
        } else {
          setProfile({ ...defaultProfile, username: `Player_${pk.slice(0, 4)}` })
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

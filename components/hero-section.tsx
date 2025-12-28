"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Swords, Trophy, Zap, X, Wallet, Dumbbell } from "lucide-react"
import { PoolGame } from "@/components/pool-game"
import { useWallet } from "@/lib/wallet-context"
import { FindMatchModal } from "@/components/find-match-modal"
import { SolanaIcon } from "@/components/solana-icon"
import { gameService } from "@/lib/game-service"

export function HeroSection() {
  const [showGame, setShowGame] = useState(false)
  const [showFindMatch, setShowFindMatch] = useState(false)
  const [gameMode, setGameMode] = useState<"training" | "match">("training")
  const { connected, connect, profile } = useWallet()

  const [stats, setStats] = useState({
    online: 0,
    activeMatches: 0,
    totalWon: 0,
    totalPlayers: 0,
  })

  useEffect(() => {
    const BASE_PLAYERS = 630
    const MAX_PLAYERS = 1123
    const HOURLY_INCREMENT = 2
    const START_TIME_KEY = "billiards_start_time"

    // Get or set start time
    let startTime = localStorage.getItem(START_TIME_KEY)
    if (!startTime) {
      startTime = Date.now().toString()
      localStorage.setItem(START_TIME_KEY, startTime)
    }

    const calculateTotalPlayers = () => {
      const hoursPassed = (Date.now() - Number.parseInt(startTime!)) / (1000 * 60 * 60)
      const increment = Math.floor(hoursPassed * HOURLY_INCREMENT)
      return Math.min(BASE_PLAYERS + increment, MAX_PLAYERS)
    }

    const loadStats = async () => {
      const realStats = await gameService.getPlatformStats()

      setStats({
        online: Math.floor(Math.max(50, realStats.online + Math.floor(Math.random() * 15) + 40)),
        activeMatches: realStats.activeMatches,
        totalWon: 0,
        totalPlayers: calculateTotalPlayers(),
      })
    }

    loadStats()

    const interval = setInterval(async () => {
      const realStats = await gameService.getPlatformStats()

      setStats((prev) => {
        const onlineDelta = Math.floor(Math.random() * 7) - 3

        return {
          online: Math.floor(Math.max(50, Math.min(120, (realStats.online + prev.online + onlineDelta) / 2 + 40))),
          activeMatches: realStats.activeMatches,
          totalWon: 0,
          totalPlayers: calculateTotalPlayers(),
        }
      })
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  const handleTraining = () => {
    if (!connected) {
      connect()
    } else {
      setGameMode("training")
      setShowGame(true)
    }
  }

  const handleFindMatch = () => {
    if (!connected) {
      connect()
    } else {
      setShowFindMatch(true)
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
        {showGame && connected ? (
          <div className="relative">
            <div className="absolute top-4 right-4 z-20">
              <Button
                variant="outline"
                size="icon"
                className="border-white/30 bg-black/50 backdrop-blur-sm hover:bg-white/10 h-9 w-9"
                onClick={() => setShowGame(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4">
              <PoolGame isTraining={gameMode === "training"} playerProfile={profile} />
            </div>
          </div>
        ) : (
          // Hero Content
          <div className="p-8 md:p-12 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-700/30 via-neutral-800/20 to-transparent pointer-events-none" />

            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-black text-foreground mb-4 tracking-tight">Play. Win. Earn.</h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-xl mx-auto">
                The ultimate multiplayer 8-ball pool experience. Compete against players worldwide and win Solana
                prizes.
              </p>

              {/* Solana Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8">
                <SolanaIcon className="w-5 h-5" />
                <span className="text-sm font-medium text-foreground">Powered by Solana</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  onClick={handleFindMatch}
                  size="lg"
                  className="bg-white hover:bg-white/90 text-black font-bold px-8 py-6 text-lg"
                >
                  <Swords className="w-5 h-5 mr-2" />
                  Find Match
                </Button>
                <Button
                  onClick={handleTraining}
                  size="lg"
                  variant="outline"
                  className="border-white/30 hover:bg-white/10 px-8 py-6 text-lg bg-transparent"
                >
                  {connected ? (
                    <>
                      <Dumbbell className="w-5 h-5 mr-2" />
                      Training
                    </>
                  ) : (
                    <>
                      <Wallet className="w-5 h-5 mr-2" />
                      Connect to Play
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6 bg-card border-border hover:border-white/30 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <Swords className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">1v1 Matches</h3>
              <p className="text-sm text-muted-foreground">Compete head-to-head</p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            Challenge players to real-time matches with SOL stakes from 0 to 100 SOL.
          </p>
        </Card>

        <Card className="p-6 bg-card border-border hover:border-white/30 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Tournaments</h3>
              <p className="text-sm text-muted-foreground">Weekly prize pools</p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            Join weekly tournaments with massive prize pools up to 1000 SOL.
          </p>
        </Card>

        <Card className="p-6 bg-card border-border hover:border-white/30 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Instant Payouts</h3>
              <p className="text-sm text-muted-foreground">Win and withdraw</p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">Instant SOL payouts to your wallet. No delays, no fees.</p>
        </Card>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-card border-border text-center">
          <p className="text-muted-foreground text-xs mb-1 uppercase tracking-wide">Online Now</p>
          <p className="text-2xl font-bold text-foreground">{stats.online}</p>
        </Card>
        <Card className="p-5 bg-card border-border text-center">
          <p className="text-muted-foreground text-xs mb-1 uppercase tracking-wide">Active Matches</p>
          <p className="text-2xl font-bold text-foreground">{stats.activeMatches}</p>
        </Card>
        <Card className="p-5 bg-card border-border text-center">
          <p className="text-muted-foreground text-xs mb-1 uppercase tracking-wide">Total Won</p>
          <p className="text-2xl font-bold text-white">{stats.totalWon.toLocaleString()} SOL</p>
        </Card>
        <Card className="p-5 bg-card border-border text-center">
          <p className="text-muted-foreground text-xs mb-1 uppercase tracking-wide">Total Players</p>
          <p className="text-2xl font-bold text-foreground">{stats.totalPlayers.toLocaleString()}</p>
        </Card>
      </div>

      {/* Find Match Modal */}
      <FindMatchModal open={showFindMatch} onOpenChange={setShowFindMatch} />
    </div>
  )
}

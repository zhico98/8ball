"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react"
import { SolanaIcon } from "@/components/solana-icon"
import { gameService, type Profile } from "@/lib/game-service"

interface PlayerWithRank extends Profile {
  rank: number
  trend: "up" | "down" | "same"
}

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<PlayerWithRank[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    setLoading(true)
    try {
      const topPlayers = await gameService.getTopPlayers(100)

      const playersWithRank = topPlayers.map((player, index) => ({
        ...player,
        rank: index + 1,
        trend: (Math.random() > 0.5 ? "up" : Math.random() > 0.5 ? "down" : "same") as "up" | "down" | "same",
      }))

      setPlayers(playersWithRank)
      setError(null)
    } catch (err) {
      console.error("Failed to load leaderboard:", err)
      setError("Unable to connect to database. Please add Supabase environment variables in Vercel Settings.")
      setPlayers([])
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
  }

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-green-500" />
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-muted-foreground" />
  }

  const getAvatarText = (player: PlayerWithRank) => {
    if (player.avatar_url) return player.avatar_url
    return player.username.slice(0, 2).toUpperCase()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Leaderboard</h1>
          <p className="text-muted-foreground">Top players competing for glory and SOL</p>
        </div>

        <Tabs defaultValue="all-time" className="w-full">
          <TabsList className="bg-secondary mb-6">
            <TabsTrigger value="all-time">All Time</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="daily">Daily</TabsTrigger>
          </TabsList>

          <TabsContent value="all-time">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            ) : error ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground mb-2">{error}</p>
              </Card>
            ) : players.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No players yet. Be the first to play!</p>
              </Card>
            ) : (
              <>
                {/* Top 3 Podium */}
                {players.length >= 3 && (
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {players.slice(0, 3).map((player, idx) => (
                      <Card
                        key={player.id}
                        className={`p-6 text-center ${
                          idx === 0
                            ? "bg-yellow-500/10 border-yellow-500/30 order-2"
                            : idx === 1
                              ? "bg-gray-500/10 border-gray-500/30 order-1"
                              : "bg-amber-600/10 border-amber-600/30 order-3"
                        }`}
                      >
                        <div className="flex justify-center mb-3">{getRankIcon(player.rank)}</div>
                        <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center text-xl font-bold mx-auto mb-3">
                          {getAvatarText(player)}
                        </div>
                        <h3 className="font-bold text-foreground mb-1">{player.username}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {player.wins}W - {player.losses}L
                        </p>
                        <Badge className="bg-white/10 text-white border-white/20">
                          {player.total_earnings.toFixed(2)} SOL
                        </Badge>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Rest of Leaderboard */}
                <Card className="divide-y divide-border">
                  {players.slice(3).map((player) => (
                    <div key={player.id} className="flex items-center justify-between p-4 hover:bg-secondary/30">
                      <div className="flex items-center gap-4">
                        <div className="w-10 flex justify-center">{getRankIcon(player.rank)}</div>
                        <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold text-sm">
                          {getAvatarText(player)}
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{player.username}</h3>
                          <p className="text-xs text-muted-foreground">
                            {player.wins}W - {player.losses}L
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <SolanaIcon className="w-4 h-4" />
                          <span className="font-semibold text-foreground">{player.total_earnings.toFixed(2)} SOL</span>
                        </div>
                        {getTrendIcon(player.trend)}
                      </div>
                    </div>
                  ))}
                </Card>
              </>
            )}
          </TabsContent>

          {["monthly", "weekly", "daily"].map((period) => (
            <TabsContent key={period} value={period}>
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">
                  {period.charAt(0).toUpperCase() + period.slice(1)} leaderboard data coming soon
                </p>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </main>
      <Footer />
    </div>
  )
}

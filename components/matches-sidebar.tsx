"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Trophy } from "lucide-react"
import { ProfileModal } from "@/components/profile-modal"
import type { UserProfile } from "@/lib/wallet-context"
import { SolanaIcon } from "@/components/solana-icon"

interface Match {
  id: number
  player1: { name: string; avatar: string; rank: number; isPrivate?: boolean }
  player2: { name: string; avatar: string; rank: number; isPrivate?: boolean }
  stake: string
  result: "player1" | "player2"
  finishedAt: string
}

const lastMatches: Match[] = [
  {
    id: 1,
    player1: { name: "SolShark", avatar: "SS", rank: 12 },
    player2: { name: "8BallKing", avatar: "8K", rank: 8 },
    stake: "5 SOL",
    result: "player1",
    finishedAt: "2 min ago",
  },
  {
    id: 2,
    player1: { name: "CueMaster", avatar: "CM", rank: 3 },
    player2: { name: "PoolPro", avatar: "PP", rank: 15, isPrivate: true },
    stake: "10 SOL",
    result: "player2",
    finishedAt: "8 min ago",
  },
  {
    id: 3,
    player1: { name: "RackBreaker", avatar: "RB", rank: 21 },
    player2: { name: "TrickShot", avatar: "TS", rank: 7 },
    stake: "2 SOL",
    result: "player1",
    finishedAt: "15 min ago",
  },
  {
    id: 4,
    player1: { name: "SideSpinner", avatar: "SS", rank: 45 },
    player2: { name: "NightOwl", avatar: "NO", rank: 33 },
    stake: "1 SOL",
    result: "player2",
    finishedAt: "22 min ago",
  },
  {
    id: 5,
    player1: { name: "ProPlayer", avatar: "PP", rank: 2 },
    player2: { name: "Rookie99", avatar: "R9", rank: 89 },
    stake: "25 SOL",
    result: "player1",
    finishedAt: "31 min ago",
  },
]

export function MatchesSidebar() {
  const [selectedProfile, setSelectedProfile] = useState<(UserProfile & { publicKey?: string }) | null>(null)

  const handleProfileClick = (player: { name: string; avatar: string; rank: number; isPrivate?: boolean }) => {
    setSelectedProfile({
      username: player.name,
      avatar: null,
      twitter: player.isPrivate ? null : "@" + player.name.toLowerCase(),
      telegram: player.isPrivate ? null : player.name.toLowerCase(),
      isPrivate: player.isPrivate || false,
      matchHistory: [],
      wins: Math.floor(Math.random() * 200) + 50,
      losses: Math.floor(Math.random() * 100) + 20,
      totalEarnings: Math.random() * 50 + 5,
    })
  }

  return (
    <>
      <aside className="w-80 border-l border-border bg-card/50 p-4 hidden xl:block overflow-y-auto max-h-[calc(100vh-64px)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Last Matches</h2>
          <Badge variant="secondary" className="bg-secondary text-foreground">
            {lastMatches.length} Recent
          </Badge>
        </div>

        <div className="space-y-3">
          {lastMatches.map((match) => (
            <Card key={match.id} className="p-4 bg-secondary/30 border-border hover:border-white/30 transition-all">
              {/* Status Badge */}
              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline" className="text-xs border-muted-foreground text-muted-foreground">
                  <Trophy className="w-3 h-3 mr-1" />
                  Finished
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {match.finishedAt}
                </span>
              </div>

              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => handleProfileClick(match.player1)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ring-2 ${
                      match.result === "player1"
                        ? "bg-white text-black ring-green-500"
                        : "bg-white/20 text-white ring-red-500"
                    }`}
                  >
                    {match.player1.avatar}
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-medium text-foreground block">{match.player1.name}</span>
                    <span className="text-xs text-muted-foreground">#{match.player1.rank}</span>
                  </div>
                </button>

                <span className="text-xs font-bold text-muted-foreground">VS</span>

                <button
                  onClick={() => handleProfileClick(match.player2)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div className="text-right">
                    <span className="text-sm font-medium text-foreground block">{match.player2.name}</span>
                    <span className="text-xs text-muted-foreground">#{match.player2.rank}</span>
                  </div>
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ring-2 ${
                      match.result === "player2"
                        ? "bg-white text-black ring-green-500"
                        : "bg-white/20 text-white ring-red-500"
                    }`}
                  >
                    {match.player2.avatar}
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2 border-t border-border">
                <SolanaIcon className="w-4 h-4" />
                <span className="text-sm font-semibold text-foreground">{match.stake}</span>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-6">
          <Button variant="outline" className="w-full border-white/30 hover:bg-white/10 bg-transparent">
            View All Matches
          </Button>
        </div>
      </aside>

      {/* Profile Modal */}
      <ProfileModal
        open={!!selectedProfile}
        onOpenChange={(open) => !open && setSelectedProfile(null)}
        viewProfile={selectedProfile || undefined}
        isOwnProfile={false}
      />
    </>
  )
}

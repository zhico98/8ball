"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useWallet } from "@/lib/wallet-context"
import { Swords, Clock, Users, Zap, Plus, Wallet } from "lucide-react"
import { SolanaIcon } from "@/components/solana-icon"
import { gameService } from "@/lib/game-service"
import { useRouter } from "next/navigation"

interface FindMatchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FindMatchModal({ open, onOpenChange }: FindMatchModalProps) {
  const { connected, connect, balance, publicKey } = useWallet()
  const router = useRouter()
  const [createStake, setCreateStake] = useState("0")
  const [showCreate, setShowCreate] = useState(false)
  const [availableRooms, setAvailableRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (open && connected) {
      loadAvailableRooms()
      const interval = setInterval(loadAvailableRooms, 5000) // Refresh every 5 seconds
      return () => clearInterval(interval)
    }
  }, [open, connected])

  const loadAvailableRooms = async () => {
    setLoading(true)
    const rooms = await gameService.getAvailableRooms()

    // Transform data to match UI format
    const transformed = rooms.map((room: any) => ({
      id: room.id,
      player: {
        name: room.host?.username || "Player",
        avatar: room.host?.avatar_url || room.host?.username?.slice(0, 2).toUpperCase() || "??",
        rank: Math.floor(Math.random() * 50) + 1,
        wins: room.host?.wins || 0,
      },
      stake: room.stake,
      createdAt: getTimeAgo(room.created_at),
      timeLeft: "5:00",
    }))

    setAvailableRooms(transformed)
    setLoading(false)
  }

  const getTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
    if (seconds < 60) return `${seconds} sec ago`
    const minutes = Math.floor(seconds / 60)
    return `${minutes} min ago`
  }

  const handleJoin = async (match: any) => {
    if (!connected || !publicKey) {
      connect()
      return
    }
    if (balance < match.stake) {
      alert("Insufficient balance!")
      return
    }

    // Get or create profile
    const profile = await gameService.getOrCreateProfile(publicKey.toString())
    if (!profile) {
      alert("Failed to load profile!")
      return
    }

    // Join the room
    const success = await gameService.joinRoom(match.id, profile.id)
    if (success) {
      // Navigate to game page with room ID
      router.push(`/play?room=${match.id}`)
      onOpenChange(false)
    } else {
      alert("Failed to join match. It may have been taken by another player.")
      loadAvailableRooms()
    }
  }

  const handleCreate = async () => {
    if (!connected || !publicKey) {
      connect()
      return
    }
    const stake = Number.parseFloat(createStake)
    if (isNaN(stake) || stake < 0) {
      alert("Invalid stake amount!")
      return
    }
    if (balance < stake) {
      alert("Insufficient balance!")
      return
    }

    setCreating(true)

    // Get or create profile
    const profile = await gameService.getOrCreateProfile(publicKey.toString())
    if (!profile) {
      alert("Failed to load profile!")
      setCreating(false)
      return
    }

    // Create room
    const room = await gameService.createRoom(profile.id, stake)
    if (room) {
      // Navigate to game page with room ID
      router.push(`/play?room=${room.id}`)
      onOpenChange(false)
    } else {
      alert("Failed to create match!")
    }

    setCreating(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Swords className="w-5 h-5" />
            Find Match
          </DialogTitle>
        </DialogHeader>

        {!connected ? (
          <div className="flex flex-col items-center py-12">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Wallet className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">Connect your wallet to find matches</p>
            <Button onClick={connect} className="bg-white text-black hover:bg-white/90">
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Balance Info */}
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Your Balance</span>
              <span className="text-lg font-bold text-white">{balance.toFixed(4)} SOL</span>
            </div>

            {/* Create Match Section */}
            {showCreate ? (
              <Card className="p-4 bg-secondary/30 border-border">
                <h4 className="font-semibold text-foreground mb-3">Create New Match</h4>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={createStake}
                      onChange={(e) => setCreateStake(e.target.value)}
                      className="bg-secondary border-border"
                      placeholder="Stake amount (SOL) - 0 for free"
                    />
                  </div>
                  <Button onClick={handleCreate} disabled={creating} className="bg-white text-black hover:bg-white/90">
                    <Zap className="w-4 h-4 mr-2" />
                    {creating ? "Creating..." : "Create"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreate(false)} className="border-white/30">
                    Cancel
                  </Button>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {[0, 0.25, 0.5, 1, 2, 5].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setCreateStake(amount.toString())}
                      className={`border-white/30 ${createStake === amount.toString() ? "bg-white/10" : ""}`}
                    >
                      {amount === 0 ? "Free" : `${amount} SOL`}
                    </Button>
                  ))}
                </div>
              </Card>
            ) : (
              <Button onClick={() => setShowCreate(true)} className="w-full bg-white text-black hover:bg-white/90">
                <Plus className="w-4 h-4 mr-2" />
                Create New Match
              </Button>
            )}

            {/* Available Matches */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-foreground">Available Matches</h4>
                <Badge variant="secondary">{availableRooms.length} waiting</Badge>
              </div>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading matches...</div>
                ) : availableRooms.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No matches available. Create one!</div>
                ) : (
                  availableRooms.map((match) => (
                    <Card
                      key={match.id}
                      className="p-4 bg-secondary/30 border-border hover:border-white/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center text-sm font-bold">
                            {match.player.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">{match.player.name}</span>
                              <Badge variant="outline" className="text-xs border-white/30">
                                #{match.player.rank}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {match.player.wins} wins
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {match.createdAt}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <SolanaIcon className="w-4 h-4" />
                              <span className="text-lg font-bold text-white">
                                {match.stake === 0 ? "Free" : `${match.stake} SOL`}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">{match.timeLeft}</span>
                          </div>
                          <Button
                            onClick={() => handleJoin(match)}
                            className="bg-white text-black hover:bg-white/90"
                            disabled={balance < match.stake}
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            Join
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

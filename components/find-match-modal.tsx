"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useWallet } from "@/lib/wallet-context"
import { Swords, Clock, Users, Zap, Plus, Wallet, AlertCircle } from "lucide-react"
import { gameService } from "@/lib/game-service"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  const [creating, setCreating] = useState(false)
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null)
  const [penaltyInfo, setPenaltyInfo] = useState<{ hasPenalty: boolean; remainingTime: number } | null>(null)
  const [disappearTimers, setDisappearTimers] = useState<Map<string, any>>(new Map())
  const [disappearingMatches, setDisappearingMatches] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (open) {
      loadFakeMatches()
      checkPenalty()
    } else {
      disappearTimers.forEach((timer) => clearTimeout(timer))
      setDisappearTimers(new Map())
      setDisappearingMatches(new Set())
    }
  }, [open, publicKey])

  const checkPenalty = () => {
    if (!publicKey) {
      setPenaltyInfo(null)
      return
    }

    const hasPenalty = gameService.hasPenalty(publicKey.toString())
    if (hasPenalty) {
      const remainingTime = gameService.getPenaltyTimeRemaining(publicKey.toString())
      setPenaltyInfo({ hasPenalty, remainingTime })

      const interval = setInterval(() => {
        const newRemainingTime = gameService.getPenaltyTimeRemaining(publicKey.toString())
        if (newRemainingTime <= 0) {
          setPenaltyInfo(null)
          clearInterval(interval)
        } else {
          setPenaltyInfo({ hasPenalty: true, remainingTime: newRemainingTime })
        }
      }, 1000)

      return () => clearInterval(interval)
    } else {
      setPenaltyInfo(null)
    }
  }

  const loadFakeMatches = () => {
    const fakeRooms = gameService.generateFakeMatches()

    const transformed = fakeRooms.map((room: any) => ({
      id: room.id,
      player: {
        name: room.host_username,
        avatar: room.host_username.slice(0, 2).toUpperCase(),
        rank: Math.floor(Math.random() * 50) + 1,
        wins: Math.floor(Math.random() * 30) + 5,
      },
      stake: room.stake,
      createdAt: getTimeAgo(room.created_at),
      timeLeft: "5:00",
      willDisappear: room.willDisappear,
    }))

    setAvailableRooms(transformed.filter((m) => m.stake === 0))

    const newTimers = new Map()
    transformed.forEach((match: any) => {
      if (match.willDisappear) {
        const delay = Math.floor(Math.random() * 13000) + 2000 // 2-15 seconds
        const timer = setTimeout(() => {
          setDisappearingMatches((prev) => new Set(prev).add(match.id))

          setTimeout(() => {
            setAvailableRooms((prev) => prev.filter((m) => m.id !== match.id))
            setDisappearingMatches((prev) => {
              const newSet = new Set(prev)
              newSet.delete(match.id)
              return newSet
            })
          }, 1000)
        }, delay)
        newTimers.set(match.id, timer)
      }
    })
    setDisappearTimers(newTimers)
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

    if (penaltyInfo?.hasPenalty) {
      return
    }

    setJoiningRoomId(match.id)

    try {
      const profile = gameService.getOrCreateProfile(publicKey.toString())
      const room = await gameService.createRoom(publicKey.toString(), profile.username, 0)

      const botName = match.player.name
      const roomData = gameService.getRoom(room.id)
      if (roomData) {
        roomData.guest_id = `bot_${Date.now()}`
        roomData.guest_username = botName
        roomData.status = "playing"
        roomData.is_bot = true
        localStorage.setItem(`room_${room.id}`, JSON.stringify(roomData))
      }

      const timer = disappearTimers.get(match.id)
      if (timer) {
        clearTimeout(timer)
        setDisappearTimers((prev) => {
          const newMap = new Map(prev)
          newMap.delete(match.id)
          return newMap
        })
      }

      router.push(`/play?room=${room.id}`)
      onOpenChange(false)
    } catch (error: any) {
      console.error("Join error:", error)
      alert(`Error: ${error.message}`)
    }

    setJoiningRoomId(null)
  }

  const handleCreate = async () => {
    if (!connected || !publicKey) {
      connect()
      return
    }

    if (penaltyInfo?.hasPenalty) {
      return
    }

    const stake = Number.parseFloat(createStake)
    if (isNaN(stake) || stake < 0) {
      alert("Invalid stake amount!")
      return
    }

    setCreating(true)

    try {
      const profile = gameService.getOrCreateProfile(publicKey.toString())
      const room = await gameService.createRoom(publicKey.toString(), profile.username, stake)

      router.push(`/play?room=${room.id}`)
      onOpenChange(false)
    } catch (error: any) {
      console.error("Match creation error:", error)
      alert(`Error: ${error.message}`)
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
            {penaltyInfo?.hasPenalty && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You have a 1-minute penalty for quitting a game. You can play again in{" "}
                  <strong>{Math.ceil(penaltyInfo.remainingTime / 1000)}s</strong>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Your Balance</span>
              <span className="text-lg font-bold text-white">{balance.toFixed(4)} SOL</span>
            </div>

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
                      disabled={penaltyInfo?.hasPenalty}
                    />
                  </div>
                  <Button
                    onClick={handleCreate}
                    disabled={creating || penaltyInfo?.hasPenalty}
                    className="bg-white text-black hover:bg-white/90"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {creating ? "Creating..." : "Create"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreate(false)} className="border-white/30">
                    Cancel
                  </Button>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCreateStake("0")}
                    className={`border-white/30 ${createStake === "0" ? "bg-white/10" : ""}`}
                  >
                    Free
                  </Button>
                  {[0.25, 0.5, 1, 2, 5].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      disabled
                      className="border-white/20 opacity-50 blur-[1px] cursor-not-allowed bg-transparent"
                    >
                      {amount} SOL
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-blue-400/70 mt-2 text-center">Paid matches coming soon</p>
              </Card>
            ) : (
              <Button
                onClick={() => setShowCreate(true)}
                disabled={penaltyInfo?.hasPenalty}
                className="w-full bg-white text-black hover:bg-white/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Match
              </Button>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-foreground">Available Matches</h4>
                <Badge variant="secondary">{availableRooms.length} waiting</Badge>
              </div>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                {availableRooms.map((match) => {
                  const isDisappearing = disappearingMatches.has(match.id)

                  return (
                    <Card
                      key={match.id}
                      className={`p-4 bg-secondary/30 border-border hover:border-white/30 transition-all duration-1000 ${
                        isDisappearing ? "opacity-0 blur-lg" : "opacity-100 blur-0"
                      }`}
                      style={{
                        transitionProperty: "opacity, filter",
                        transitionTimingFunction: "ease-in-out",
                      }}
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
                              <span className="text-lg font-bold text-white">Free</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{match.timeLeft}</span>
                          </div>
                          <Button
                            onClick={() => handleJoin(match)}
                            className="bg-white text-black hover:bg-white/90"
                            disabled={joiningRoomId === match.id || penaltyInfo?.hasPenalty || isDisappearing}
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            {joiningRoomId === match.id ? "Joining..." : "Join"}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

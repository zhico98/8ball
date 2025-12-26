"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PoolGame } from "@/components/pool-game"
import { useWallet } from "@/lib/wallet-context"
import { gameService, type GameRoom } from "@/lib/game-service"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, X } from "lucide-react"

export default function PlayPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roomId = searchParams.get("room")
  const { connected, publicKey } = useWallet()

  const [room, setRoom] = useState<GameRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isHost, setIsHost] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  useEffect(() => {
    if (isMinimized) {
      router.push("/")
    }
  }, [isMinimized, router])

  useEffect(() => {
    if (!connected || !publicKey) {
      router.push("/")
      return
    }

    if (!roomId) {
      setError("No room ID provided")
      setLoading(false)
      return
    }

    loadRoom()

    return () => {
      if (roomId) {
        gameService.unsubscribeFromRoom(roomId)
      }
    }
  }, [connected, publicKey, roomId])

  const loadRoom = async () => {
    if (!roomId) return

    setLoading(true)
    const roomData = await gameService.getRoom(roomId)

    if (!roomData) {
      setError("Room not found")
      setLoading(false)
      return
    }

    setRoom(roomData)
    setIsHost(roomData.host_id === publicKey?.toString())
    setLoading(false)

    // Subscribe to room updates
    gameService.subscribeToRoom(roomId, (updatedRoom) => {
      setRoom(updatedRoom)
    })
  }

  const handleExit = () => {
    if (roomId) {
      gameService.unsubscribeFromRoom(roomId)
    }
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 bg-card border-border">
          <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-muted-foreground text-center">Loading game...</p>
        </Card>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 bg-card border-border text-center">
          <p className="text-foreground font-semibold mb-4">{error || "Failed to load game"}</p>
          <Button onClick={() => router.push("/")} className="bg-white text-black hover:bg-white/90">
            Return Home
          </Button>
        </Card>
      </div>
    )
  }

  // Wait for second player if still waiting
  if (room.status === "waiting") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="p-8 bg-card border-border max-w-md w-full relative">
          <div className="absolute top-4 right-4">
            <Button
              variant="outline"
              size="icon"
              className="border-white/30 bg-transparent hover:bg-white/10 h-9 w-9"
              onClick={handleExit}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-6" />
          <h2 className="text-xl font-bold text-foreground text-center mb-2">Waiting for opponent...</h2>
          <p className="text-muted-foreground text-center mb-4">
            Share this link with a friend or wait for someone to join
          </p>
          <div className="p-3 bg-secondary/30 rounded-lg text-center">
            <code className="text-sm text-white break-all">
              {typeof window !== "undefined" && window.location.href}
            </code>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <PoolGame
        isTraining={false}
        roomId={roomId || undefined}
        isHost={isHost}
        playerProfile={null}
        onMinimize={() => setIsMinimized(true)}
      />
    </div>
  )
}

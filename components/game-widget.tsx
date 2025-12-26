"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function GameWidget() {
  const router = useRouter()
  const [gameState, setGameState] = useState<{
    roomId: string
    opponentName: string
    currentPlayer: number
    turnTimer: number
    isMyTurn: boolean
  } | null>(null)

  useEffect(() => {
    const checkGameState = () => {
      const storedGame = localStorage.getItem("minimizedGame")
      if (storedGame) {
        try {
          const parsed = JSON.parse(storedGame)
          setGameState(parsed)
        } catch (e) {
          localStorage.removeItem("minimizedGame")
        }
      } else {
        setGameState(null)
      }
    }

    checkGameState()
    const interval = setInterval(checkGameState, 1000)

    return () => clearInterval(interval)
  }, [])

  if (!gameState) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] bg-card/95 backdrop-blur-sm border border-border rounded-lg p-4 cursor-pointer hover:bg-card/80 transition-all hover:scale-105 shadow-xl"
      onClick={() => {
        router.push(`/play?room=${gameState.roomId}`)
        localStorage.removeItem("minimizedGame")
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
        <div>
          <p className="text-sm font-medium text-foreground">Game in progress</p>
          <p className="text-xs text-muted-foreground">
            {gameState.isMyTurn ? "Your turn" : `${gameState.opponentName}'s turn`} • {gameState.turnTimer}s
          </p>
        </div>
      </div>
    </div>
  )
}

"use client"

import type React from "react"
import { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX, RotateCcw } from "lucide-react"
import type { UserProfile } from "@/lib/wallet-context"

const TABLE_WIDTH = 900
const TABLE_HEIGHT = 500
const BALL_RADIUS = 12
const POCKET_RADIUS = 24
const POCKET_DETECTION = 38
const FRICTION = 0.985
const CUSHION_BOUNCE = 0.75
const CUSHION_MARGIN = 40
const MAX_POWER = 22

const BALL_COLORS: Record<number, { gradient: string[]; stripe: boolean }> = {
  0: { gradient: ["#FFFFFF", "#F8F8F8", "#E8E8E8"], stripe: false }, // Cue ball
  1: { gradient: ["#FFD700", "#FFC000", "#E6AC00"], stripe: false }, // Yellow
  2: { gradient: ["#1E90FF", "#0066CC", "#004C99"], stripe: false }, // Blue
  3: { gradient: ["#FF4444", "#CC0000", "#990000"], stripe: false }, // Red
  4: { gradient: ["#9932CC", "#7B28A8", "#5C1F7D"], stripe: false }, // Purple
  5: { gradient: ["#FF6B00", "#E65C00", "#CC5200"], stripe: false }, // Orange
  6: { gradient: ["#228B22", "#1B6B1B", "#145214"], stripe: false }, // Green
  7: { gradient: ["#8B0000", "#6B0000", "#4B0000"], stripe: false }, // Maroon
  8: { gradient: ["#1A1A1A", "#0D0D0D", "#000000"], stripe: false }, // Black
  9: { gradient: ["#FFD700", "#FFC000", "#E6AC00"], stripe: true },
  10: { gradient: ["#1E90FF", "#0066CC", "#004C99"], stripe: true },
  11: { gradient: ["#FF4444", "#CC0000", "#990000"], stripe: true },
  12: { gradient: ["#9932CC", "#7B28A8", "#5C1F7D"], stripe: true },
  13: { gradient: ["#FF6B00", "#E65C00", "#CC5200"], stripe: true },
  14: { gradient: ["#228B22", "#1B6B1B", "#145214"], stripe: true },
  15: { gradient: ["#8B0000", "#6B0000", "#4B0000"], stripe: true },
}

interface Ball {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  pocketed: boolean
  spin: number
}

interface Pocket {
  x: number
  y: number
  isCorner: boolean
}

const pockets: Pocket[] = [
  { x: 28, y: 28, isCorner: true },
  { x: TABLE_WIDTH / 2, y: 22, isCorner: false },
  { x: TABLE_WIDTH - 28, y: 28, isCorner: true },
  { x: 28, y: TABLE_HEIGHT - 28, isCorner: true },
  { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - 22, isCorner: false },
  { x: TABLE_WIDTH - 28, y: TABLE_HEIGHT - 28, isCorner: true },
]

interface PoolGameProps {
  isTraining?: boolean
  playerProfile?: UserProfile | null
}

function MiniPocketedBall({ ballId }: { ballId: number }) {
  const ballInfo = BALL_COLORS[ballId]
  const isStripe = ballInfo?.stripe
  const baseColor = ballInfo?.gradient[0] || "#666"

  return (
    <div
      className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold shadow-md border border-white/20"
      style={{
        background: isStripe
          ? `linear-gradient(180deg, white 30%, ${baseColor} 30%, ${baseColor} 70%, white 70%)`
          : baseColor,
        color:
          ballId === 8 || ballId === 2 || ballId === 3 || ballId === 6 || ballId === 7 || ballId >= 10
            ? "white"
            : "black",
      }}
    >
      {ballId}
    </div>
  )
}

export function PoolGame({ isTraining = false, playerProfile }: PoolGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [balls, setBalls] = useState<Ball[]>([])
  const ballsRef = useRef<Ball[]>([])
  const [isBallMoving, setIsBallMoving] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragEnd, setDragEnd] = useState({ x: 0, y: 0 })
  const [currentPlayer, setCurrentPlayer] = useState(1)
  const [message, setMessage] = useState("Your Turn!")
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<number | null>(null)
  const [cueBallPlacement, setCueBallPlacement] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [player1Type, setPlayer1Type] = useState<"solids" | "stripes" | null>(null)
  const [player2Type, setPlayer2Type] = useState<"solids" | "stripes" | null>(null)
  const [player1Pocketed, setPlayer1Pocketed] = useState<number[]>([])
  const [player2Pocketed, setPlayer2Pocketed] = useState<number[]>([])
  const [hasShot, setHasShot] = useState(false)
  const [botThinking, setBotThinking] = useState(false)
  const [botShouldPlay, setBotShouldPlay] = useState(false)
  const [pocketedOwnBall, setPocketedOwnBall] = useState(false)

  const botTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    return () => {
      audioContextRef.current?.close()
    }
  }, [])

  const playSound = useCallback(
    (type: "hit" | "pocket" | "cushion") => {
      if (!soundEnabled || !audioContextRef.current) return

      const ctx = audioContextRef.current
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      switch (type) {
        case "hit":
          oscillator.frequency.setValueAtTime(300, ctx.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1)
          gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
          oscillator.start(ctx.currentTime)
          oscillator.stop(ctx.currentTime + 0.15)
          break
        case "pocket":
          oscillator.frequency.setValueAtTime(200, ctx.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3)
          gainNode.gain.setValueAtTime(0.4, ctx.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
          oscillator.start(ctx.currentTime)
          oscillator.stop(ctx.currentTime + 0.3)
          break
        case "cushion":
          oscillator.frequency.setValueAtTime(400, ctx.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08)
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)
          oscillator.start(ctx.currentTime)
          oscillator.stop(ctx.currentTime + 0.08)
          break
      }
    },
    [soundEnabled],
  )

  const drawSolidBall = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, colors: string[]) => {
    // Shadow
    ctx.beginPath()
    ctx.arc(x + 3, y + 3, radius, 0, Math.PI * 2)
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)"
    ctx.fill()

    // Main ball with gradient
    const ballGrad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius)
    ballGrad.addColorStop(0, colors[0])
    ballGrad.addColorStop(0.5, colors[1])
    ballGrad.addColorStop(1, colors[2])
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = ballGrad
    ctx.fill()

    // Glossy highlight
    const highlightGrad = ctx.createRadialGradient(
      x - radius * 0.4,
      y - radius * 0.4,
      0,
      x - radius * 0.4,
      y - radius * 0.4,
      radius * 0.6,
    )
    highlightGrad.addColorStop(0, "rgba(255, 255, 255, 0.7)")
    highlightGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.2)")
    highlightGrad.addColorStop(1, "rgba(255, 255, 255, 0)")
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = highlightGrad
    ctx.fill()
  }

  const drawStripedBall = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    colors: string[],
    spin: number,
  ) => {
    // Shadow
    ctx.beginPath()
    ctx.arc(x + 3, y + 3, radius, 0, Math.PI * 2)
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)"
    ctx.fill()

    // White base
    const baseGrad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius)
    baseGrad.addColorStop(0, "#FFFFFF")
    baseGrad.addColorStop(0.7, "#F0F0F0")
    baseGrad.addColorStop(1, "#E0E0E0")
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = baseGrad
    ctx.fill()

    // Color stripe band in the middle
    ctx.save()
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.clip()

    const stripeGrad = ctx.createLinearGradient(x - radius, y, x + radius, y)
    stripeGrad.addColorStop(0, colors[0])
    stripeGrad.addColorStop(0.5, colors[1])
    stripeGrad.addColorStop(1, colors[0])
    ctx.fillStyle = stripeGrad
    ctx.fillRect(x - radius, y - radius * 0.45, radius * 2, radius * 0.9)
    ctx.restore()

    // Glossy highlight
    const highlightGrad = ctx.createRadialGradient(
      x - radius * 0.4,
      y - radius * 0.4,
      0,
      x - radius * 0.4,
      y - radius * 0.4,
      radius * 0.6,
    )
    highlightGrad.addColorStop(0, "rgba(255, 255, 255, 0.6)")
    highlightGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.15)")
    highlightGrad.addColorStop(1, "rgba(255, 255, 255, 0)")
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = highlightGrad
    ctx.fill()
  }

  const initializeBalls = useCallback(() => {
    if (botTimeoutRef.current) {
      clearTimeout(botTimeoutRef.current)
    }

    const newBalls: Ball[] = [
      { id: 0, x: TABLE_WIDTH * 0.25, y: TABLE_HEIGHT / 2, vx: 0, vy: 0, pocketed: false, spin: 0 },
    ]

    const rackX = TABLE_WIDTH * 0.7
    const rackY = TABLE_HEIGHT / 2
    const spacing = BALL_RADIUS * 2.1
    const ballOrder = [1, 9, 2, 10, 8, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15]

    let ballIndex = 0
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col <= row; col++) {
        const x = rackX + row * spacing * 0.866
        const y = rackY + (col - row / 2) * spacing
        newBalls.push({
          id: ballOrder[ballIndex],
          x,
          y,
          vx: 0,
          vy: 0,
          pocketed: false,
          spin: Math.random() * Math.PI * 2,
        })
        ballIndex++
      }
    }

    setBalls(newBalls)
    ballsRef.current = newBalls
    setCurrentPlayer(1)
    setMessage("Your Turn!")
    setGameOver(false)
    setWinner(null)
    setCueBallPlacement(false)
    setPlayer1Type(null)
    setPlayer2Type(null)
    setPlayer1Pocketed([])
    setPlayer2Pocketed([])
    setHasShot(false)
    setBotThinking(false)
    setBotShouldPlay(false)
    setPocketedOwnBall(false)
  }, [])

  useEffect(() => {
    initializeBalls()
  }, [initializeBalls])

  useEffect(() => {
    ballsRef.current = balls
  }, [balls])

  // Bot turn logic
  useEffect(() => {
    if (isTraining && currentPlayer === 2 && !isBallMoving && !gameOver && !botThinking && !botShouldPlay && !hasShot) {
      setBotThinking(true)
      setMessage("Bot is thinking...")

      botTimeoutRef.current = setTimeout(() => {
        setBotThinking(false)
        setBotShouldPlay(true)
      }, 1200)
    }
  }, [currentPlayer, isBallMoving, gameOver, isTraining, botThinking, botShouldPlay, hasShot])

  // Execute bot shot
  useEffect(() => {
    if (!botShouldPlay || isBallMoving || gameOver) return

    const currentBalls = ballsRef.current
    const cueBall = currentBalls.find((b) => b.id === 0 && !b.pocketed)
    if (!cueBall) return

    const targetBalls = currentBalls.filter((b) => {
      if (b.pocketed || b.id === 0 || b.id === 8) return false
      if (!player2Type) return true
      return player2Type === "solids" ? b.id < 8 : b.id > 8
    })

    let target = targetBalls[0]
    if (!target) {
      target =
        currentBalls.find((b) => b.id === 8 && !b.pocketed) || currentBalls.find((b) => !b.pocketed && b.id !== 0)
    }

    if (target) {
      const angle = Math.atan2(target.y - cueBall.y, target.x - cueBall.x)
      const power = 10 + Math.random() * 8
      const angleVariation = (Math.random() - 0.5) * 0.15

      setBalls((prev) =>
        prev.map((ball) => {
          if (ball.id === 0 && !ball.pocketed) {
            return {
              ...ball,
              vx: Math.cos(angle + angleVariation) * power,
              vy: Math.sin(angle + angleVariation) * power,
            }
          }
          return ball
        }),
      )

      playSound("hit")
      setIsBallMoving(true)
      setHasShot(true)
      setBotShouldPlay(false)
      setPocketedOwnBall(false)
      setMessage("Bot shot!")
    }
  }, [botShouldPlay, isBallMoving, gameOver, player2Type, playSound])

  // Physics update
  useEffect(() => {
    let animationId: number

    const state = {
      currentPlayer,
      player1Pocketed,
      player2Pocketed,
      player1Type,
      player2Type,
      isTraining,
      pocketedOwnBall: false,
    }

    const update = () => {
      setBalls((prevBalls) => {
        const newBalls = prevBalls.map((ball) => ({ ...ball }))
        let moving = false

        for (let i = 0; i < newBalls.length; i++) {
          const ball = newBalls[i]
          if (ball.pocketed) continue

          if (Math.abs(ball.vx) > 0.01 || Math.abs(ball.vy) > 0.01) {
            moving = true
            ball.x += ball.vx
            ball.y += ball.vy
            ball.vx *= FRICTION
            ball.vy *= FRICTION
            ball.spin += Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) * 0.1

            let inPocket = false
            for (const pocket of pockets) {
              const dx = ball.x - pocket.x
              const dy = ball.y - pocket.y
              const dist = Math.sqrt(dx * dx + dy * dy)

              const detectionRadius = pocket.isCorner ? POCKET_DETECTION + 8 : POCKET_DETECTION
              if (dist < detectionRadius) {
                inPocket = true
                ball.pocketed = true
                ball.vx = 0
                ball.vy = 0
                playSound("pocket")

                if (ball.id === 0) {
                  setCueBallPlacement(true)
                  setMessage("Scratch! Place the cue ball")
                } else if (ball.id === 8) {
                  const playerPocketed = state.currentPlayer === 1 ? state.player1Pocketed : state.player2Pocketed
                  const neededCount = 7
                  if (playerPocketed.length >= neededCount) {
                    setWinner(state.currentPlayer)
                    setMessage(
                      state.isTraining && state.currentPlayer === 2
                        ? "Bot Wins!"
                        : `Player ${state.currentPlayer} Wins!`,
                    )
                  } else {
                    setWinner(state.currentPlayer === 1 ? 2 : 1)
                    setMessage(
                      state.isTraining && state.currentPlayer === 1
                        ? "Bot Wins! (Early 8-ball)"
                        : `Player ${state.currentPlayer === 1 ? 2 : 1} Wins!`,
                    )
                  }
                  setGameOver(true)
                } else {
                  const isSolid = ball.id < 8
                  const currentPlayerType = state.currentPlayer === 1 ? state.player1Type : state.player2Type

                  if (!state.player1Type) {
                    // First ball pocketed determines types
                    if (state.currentPlayer === 1) {
                      setPlayer1Type(isSolid ? "solids" : "stripes")
                      setPlayer2Type(isSolid ? "stripes" : "solids")
                      state.player1Type = isSolid ? "solids" : "stripes"
                    } else {
                      setPlayer2Type(isSolid ? "solids" : "stripes")
                      setPlayer1Type(isSolid ? "stripes" : "solids")
                      state.player2Type = isSolid ? "solids" : "stripes"
                    }
                  }

                  // Check if pocketed own ball type for extra turn
                  const isOwnBall = currentPlayerType === "solids" ? isSolid : !isSolid
                  if (currentPlayerType && isOwnBall) {
                    state.pocketedOwnBall = true
                    setPocketedOwnBall(true)
                  }

                  if (state.currentPlayer === 1) {
                    setPlayer1Pocketed((prev) => [...prev, ball.id])
                  } else {
                    setPlayer2Pocketed((prev) => [...prev, ball.id])
                  }
                }
                break
              }
            }

            // Only apply cushion bounce if not in a pocket
            if (!inPocket && !ball.pocketed) {
              if (ball.x - BALL_RADIUS < CUSHION_MARGIN) {
                ball.x = CUSHION_MARGIN + BALL_RADIUS
                ball.vx = -ball.vx * CUSHION_BOUNCE
                playSound("cushion")
              }
              if (ball.x + BALL_RADIUS > TABLE_WIDTH - CUSHION_MARGIN) {
                ball.x = TABLE_WIDTH - CUSHION_MARGIN - BALL_RADIUS
                ball.vx = -ball.vx * CUSHION_BOUNCE
                playSound("cushion")
              }
              if (ball.y - BALL_RADIUS < CUSHION_MARGIN) {
                ball.y = CUSHION_MARGIN + BALL_RADIUS
                ball.vy = -ball.vy * CUSHION_BOUNCE
                playSound("cushion")
              }
              if (ball.y + BALL_RADIUS > TABLE_HEIGHT - CUSHION_MARGIN) {
                ball.y = TABLE_HEIGHT - CUSHION_MARGIN - BALL_RADIUS
                ball.vy = -ball.vy * CUSHION_BOUNCE
                playSound("cushion")
              }
            }
          } else {
            ball.vx = 0
            ball.vy = 0
          }
        }

        // Ball collisions
        for (let i = 0; i < newBalls.length; i++) {
          for (let j = i + 1; j < newBalls.length; j++) {
            const b1 = newBalls[i]
            const b2 = newBalls[j]
            if (b1.pocketed || b2.pocketed) continue

            const dx = b2.x - b1.x
            const dy = b2.y - b1.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < BALL_RADIUS * 2) {
              playSound("hit")

              const nx = dx / dist
              const ny = dy / dist

              const dvx = b1.vx - b2.vx
              const dvy = b1.vy - b2.vy
              const dvn = dvx * nx + dvy * ny

              if (dvn > 0) {
                b1.vx -= dvn * nx * 0.95
                b1.vy -= dvn * ny * 0.95
                b2.vx += dvn * nx * 0.95
                b2.vy += dvn * ny * 0.95
              }

              const overlap = BALL_RADIUS * 2 - dist
              b1.x -= (overlap / 2) * nx
              b1.y -= (overlap / 2) * ny
              b2.x += (overlap / 2) * nx
              b2.y += (overlap / 2) * ny
            }
          }
        }

        if (!moving && isBallMoving) {
          setIsBallMoving(false)
          if (!gameOver) {
            if (hasShot) {
              // If pocketed own ball, keep the turn
              if (state.pocketedOwnBall) {
                setMessage(state.isTraining && state.currentPlayer === 2 ? "Bot plays again!" : "You play again!")
                setPocketedOwnBall(false)
              } else {
                const nextPlayer = state.currentPlayer === 1 ? 2 : 1
                setCurrentPlayer(nextPlayer)
                if (state.isTraining) {
                  setMessage(nextPlayer === 1 ? "Your Turn!" : "Bot's turn")
                } else {
                  setMessage(`Player ${nextPlayer}'s turn`)
                }
              }
              setHasShot(false)
            }
          }
        }

        ballsRef.current = newBalls
        return newBalls
      })

      animationId = requestAnimationFrame(update)
    }

    animationId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(animationId)
  }, [
    isBallMoving,
    gameOver,
    hasShot,
    currentPlayer,
    isTraining,
    playSound,
    player1Type,
    player2Type,
    player1Pocketed,
    player2Pocketed,
    pocketedOwnBall,
  ])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT)

    const frameWidth = 28

    ctx.fillStyle = "#0a0a0a"
    ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT)

    // Subtle inner border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)"
    ctx.lineWidth = 1
    ctx.strokeRect(1, 1, TABLE_WIDTH - 2, TABLE_HEIGHT - 2)

    // Green felt
    const feltGrad = ctx.createRadialGradient(
      TABLE_WIDTH / 2,
      TABLE_HEIGHT / 2,
      0,
      TABLE_WIDTH / 2,
      TABLE_HEIGHT / 2,
      TABLE_WIDTH / 2,
    )
    feltGrad.addColorStop(0, "#228B22")
    feltGrad.addColorStop(0.6, "#1E7B1E")
    feltGrad.addColorStop(1, "#156915")
    ctx.fillStyle = feltGrad
    ctx.fillRect(frameWidth, frameWidth, TABLE_WIDTH - frameWidth * 2, TABLE_HEIGHT - frameWidth * 2)

    // Subtle felt texture
    ctx.fillStyle = "rgba(0, 0, 0, 0.02)"
    for (let i = 0; i < 300; i++) {
      const fx = frameWidth + Math.random() * (TABLE_WIDTH - frameWidth * 2)
      const fy = frameWidth + Math.random() * (TABLE_HEIGHT - frameWidth * 2)
      ctx.fillRect(fx, fy, 1, 1)
    }

    // Cushions - dark green
    const cushionColor1 = "#0d3d0d"
    const cushionColor2 = "#082808"
    const cushionWidth = 12

    // Top cushion
    const topCushionGrad = ctx.createLinearGradient(0, frameWidth, 0, frameWidth + cushionWidth)
    topCushionGrad.addColorStop(0, cushionColor2)
    topCushionGrad.addColorStop(0.5, cushionColor1)
    topCushionGrad.addColorStop(1, cushionColor2)
    ctx.fillStyle = topCushionGrad
    ctx.fillRect(frameWidth + 45, frameWidth, TABLE_WIDTH / 2 - 70, cushionWidth)
    ctx.fillRect(TABLE_WIDTH / 2 + 25, frameWidth, TABLE_WIDTH / 2 - 70, cushionWidth)

    // Bottom cushion
    ctx.fillRect(frameWidth + 45, TABLE_HEIGHT - frameWidth - cushionWidth, TABLE_WIDTH / 2 - 70, cushionWidth)
    ctx.fillRect(TABLE_WIDTH / 2 + 25, TABLE_HEIGHT - frameWidth - cushionWidth, TABLE_WIDTH / 2 - 70, cushionWidth)

    // Left cushion
    const leftCushionGrad = ctx.createLinearGradient(frameWidth, 0, frameWidth + cushionWidth, 0)
    leftCushionGrad.addColorStop(0, cushionColor2)
    leftCushionGrad.addColorStop(0.5, cushionColor1)
    leftCushionGrad.addColorStop(1, cushionColor2)
    ctx.fillStyle = leftCushionGrad
    ctx.fillRect(frameWidth, frameWidth + 45, cushionWidth, TABLE_HEIGHT - frameWidth * 2 - 90)

    // Right cushion
    ctx.fillRect(
      TABLE_WIDTH - frameWidth - cushionWidth,
      frameWidth + 45,
      cushionWidth,
      TABLE_HEIGHT - frameWidth * 2 - 90,
    )

    // Draw pockets
    for (const pocket of pockets) {
      ctx.beginPath()
      ctx.arc(pocket.x, pocket.y, POCKET_RADIUS + 10, 0, Math.PI * 2)
      const outerGlow = ctx.createRadialGradient(
        pocket.x,
        pocket.y,
        POCKET_RADIUS,
        pocket.x,
        pocket.y,
        POCKET_RADIUS + 10,
      )
      outerGlow.addColorStop(0, "rgba(0, 0, 0, 0.8)")
      outerGlow.addColorStop(1, "rgba(0, 0, 0, 0)")
      ctx.fillStyle = outerGlow
      ctx.fill()

      ctx.beginPath()
      ctx.arc(pocket.x, pocket.y, POCKET_RADIUS + 4, 0, Math.PI * 2)
      const pocketGrad = ctx.createRadialGradient(pocket.x, pocket.y, 0, pocket.x, pocket.y, POCKET_RADIUS + 4)
      pocketGrad.addColorStop(0, "#000000")
      pocketGrad.addColorStop(0.7, "#080808")
      pocketGrad.addColorStop(1, "#151515")
      ctx.fillStyle = pocketGrad
      ctx.fill()

      ctx.beginPath()
      ctx.arc(pocket.x, pocket.y, POCKET_RADIUS + 5, 0, Math.PI * 2)
      ctx.strokeStyle = "rgba(40, 40, 40, 0.6)"
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // Diamond markers - silver/grey
    const diamondPositions = [
      { x: TABLE_WIDTH * 0.25, y: frameWidth / 2 },
      { x: TABLE_WIDTH * 0.375, y: frameWidth / 2 },
      { x: TABLE_WIDTH * 0.625, y: frameWidth / 2 },
      { x: TABLE_WIDTH * 0.75, y: frameWidth / 2 },
      { x: TABLE_WIDTH * 0.25, y: TABLE_HEIGHT - frameWidth / 2 },
      { x: TABLE_WIDTH * 0.375, y: TABLE_HEIGHT - frameWidth / 2 },
      { x: TABLE_WIDTH * 0.625, y: TABLE_HEIGHT - frameWidth / 2 },
      { x: TABLE_WIDTH * 0.75, y: TABLE_HEIGHT - frameWidth / 2 },
      { x: frameWidth / 2, y: TABLE_HEIGHT * 0.33 },
      { x: frameWidth / 2, y: TABLE_HEIGHT * 0.67 },
      { x: TABLE_WIDTH - frameWidth / 2, y: TABLE_HEIGHT * 0.33 },
      { x: TABLE_WIDTH - frameWidth / 2, y: TABLE_HEIGHT * 0.67 },
    ]

    for (const pos of diamondPositions) {
      ctx.save()
      ctx.translate(pos.x, pos.y)
      ctx.rotate(Math.PI / 4)
      const diamondGrad = ctx.createLinearGradient(-3, -3, 3, 3)
      diamondGrad.addColorStop(0, "#808080")
      diamondGrad.addColorStop(0.5, "#606060")
      diamondGrad.addColorStop(1, "#404040")
      ctx.fillStyle = diamondGrad
      ctx.fillRect(-3, -3, 6, 6)
      ctx.restore()
    }

    // Head string line
    ctx.beginPath()
    ctx.setLineDash([8, 8])
    ctx.moveTo(TABLE_WIDTH * 0.25, frameWidth + cushionWidth + 5)
    ctx.lineTo(TABLE_WIDTH * 0.25, TABLE_HEIGHT - frameWidth - cushionWidth - 5)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.setLineDash([])

    // Draw balls
    for (const ball of balls) {
      if (ball.pocketed) continue
      const ballInfo = BALL_COLORS[ball.id]

      if (ballInfo.stripe) {
        drawStripedBall(ctx, ball.x, ball.y, BALL_RADIUS, ballInfo.gradient, ball.spin)
      } else {
        drawSolidBall(ctx, ball.x, ball.y, BALL_RADIUS, ballInfo.gradient)
      }

      // Draw number on ball
      if (ball.id !== 0) {
        ctx.save()
        if (ballInfo.stripe) {
          ctx.beginPath()
          ctx.arc(ball.x, ball.y, BALL_RADIUS * 0.4, 0, Math.PI * 2)
          const numBgGrad = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, BALL_RADIUS * 0.4)
          numBgGrad.addColorStop(0, "#FFFFFF")
          numBgGrad.addColorStop(1, "#F0F0F0")
          ctx.fillStyle = numBgGrad
          ctx.fill()
        }

        ctx.font = `bold ${BALL_RADIUS * 0.75}px Arial`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"

        const isDarkBall = ball.id === 8 || ball.id === 2 || ball.id === 6
        ctx.fillStyle = isDarkBall && !ballInfo.stripe ? "#FFFFFF" : "#000000"
        ctx.fillText(ball.id.toString(), ball.x, ball.y + 1)
        ctx.restore()
      }
    }

    if (isDragging && !isBallMoving && currentPlayer === 1) {
      const cueBall = balls.find((b) => b.id === 0 && !b.pocketed)
      if (cueBall) {
        const dx = dragStart.x - dragEnd.x
        const dy = dragStart.y - dragEnd.y
        const power = Math.min(Math.sqrt(dx * dx + dy * dy), MAX_POWER * 10)
        const angle = Math.atan2(dy, dx)

        // Aim line from cue ball
        const aimLength = 400
        ctx.beginPath()
        ctx.setLineDash([8, 8])
        ctx.moveTo(cueBall.x, cueBall.y)
        ctx.lineTo(cueBall.x + Math.cos(angle) * aimLength, cueBall.y + Math.sin(angle) * aimLength)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.7)"
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.setLineDash([])

        // Find target ball
        let nearestDist = Number.POSITIVE_INFINITY
        let targetBall: Ball | null = null
        let contactPoint = { x: 0, y: 0 }

        for (const ball of balls) {
          if (ball.id === 0 || ball.pocketed) continue

          const toBall = {
            x: ball.x - cueBall.x,
            y: ball.y - cueBall.y,
          }
          const distToBall = Math.sqrt(toBall.x * toBall.x + toBall.y * toBall.y)

          // Project onto aim line
          const dot = toBall.x * Math.cos(angle) + toBall.y * Math.sin(angle)
          if (dot > 0 && dot < nearestDist) {
            const perpDist = Math.abs(-toBall.x * Math.sin(angle) + toBall.y * Math.cos(angle))
            if (perpDist < BALL_RADIUS * 2) {
              nearestDist = dot
              targetBall = ball
              // Calculate actual contact point
              const collisionDist = Math.sqrt((BALL_RADIUS * 2) ** 2 - perpDist ** 2)
              const contactDist = dot - collisionDist
              contactPoint = {
                x: cueBall.x + Math.cos(angle) * contactDist,
                y: cueBall.y + Math.sin(angle) * contactDist,
              }
            }
          }
        }

        if (targetBall) {
          // Ghost ball (where cue ball will be at contact)
          ctx.beginPath()
          ctx.arc(contactPoint.x, contactPoint.y, BALL_RADIUS, 0, Math.PI * 2)
          ctx.strokeStyle = "rgba(255, 255, 255, 0.4)"
          ctx.lineWidth = 2
          ctx.stroke()

          // Highlight target ball
          ctx.beginPath()
          ctx.arc(targetBall.x, targetBall.y, BALL_RADIUS + 5, 0, Math.PI * 2)
          ctx.strokeStyle = "#FFD700"
          ctx.lineWidth = 3
          ctx.stroke()

          // Calculate target ball direction (from contact point to target ball center)
          const targetAngle = Math.atan2(targetBall.y - contactPoint.y, targetBall.x - contactPoint.x)

          // Draw target ball direction line
          ctx.beginPath()
          ctx.setLineDash([6, 6])
          ctx.moveTo(targetBall.x, targetBall.y)
          const targetEndX = targetBall.x + Math.cos(targetAngle) * 180
          const targetEndY = targetBall.y + Math.sin(targetAngle) * 180
          ctx.lineTo(targetEndX, targetEndY)
          ctx.strokeStyle = "#FFD700"
          ctx.lineWidth = 2.5
          ctx.stroke()
          ctx.setLineDash([])

          // Arrow head for target ball
          const arrowLen = 12
          ctx.beginPath()
          ctx.moveTo(targetEndX, targetEndY)
          ctx.lineTo(
            targetEndX - Math.cos(targetAngle - 0.4) * arrowLen,
            targetEndY - Math.sin(targetAngle - 0.4) * arrowLen,
          )
          ctx.lineTo(
            targetEndX - Math.cos(targetAngle + 0.4) * arrowLen,
            targetEndY - Math.sin(targetAngle + 0.4) * arrowLen,
          )
          ctx.closePath()
          ctx.fillStyle = "#FFD700"
          ctx.fill()

          // Cue ball deflection angle is 90 degrees from target ball direction
          const deflectionAngle = targetAngle + Math.PI / 2
          // Adjust based on cut angle
          const cutAngle = angle - targetAngle
          const deflectionLength = Math.abs(Math.sin(cutAngle)) * 120

          if (deflectionLength > 20) {
            // Only show if significant deflection
            const cueDeflectEndX = contactPoint.x + Math.cos(deflectionAngle) * deflectionLength
            const cueDeflectEndY = contactPoint.y + Math.sin(deflectionAngle) * deflectionLength

            // Check if we need to flip the deflection direction
            const flipDeflect = Math.sin(cutAngle) < 0
            const actualDeflectX = flipDeflect
              ? contactPoint.x - Math.cos(deflectionAngle) * deflectionLength
              : cueDeflectEndX
            const actualDeflectY = flipDeflect
              ? contactPoint.y - Math.sin(deflectionAngle) * deflectionLength
              : cueDeflectEndY

            ctx.beginPath()
            ctx.setLineDash([5, 5])
            ctx.moveTo(contactPoint.x, contactPoint.y)
            ctx.lineTo(actualDeflectX, actualDeflectY)
            ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"
            ctx.lineWidth = 2
            ctx.stroke()
            ctx.setLineDash([])

            // Small arrow for cue ball deflection
            const cueArrowAngle = Math.atan2(actualDeflectY - contactPoint.y, actualDeflectX - contactPoint.x)
            ctx.beginPath()
            ctx.moveTo(actualDeflectX, actualDeflectY)
            ctx.lineTo(
              actualDeflectX - Math.cos(cueArrowAngle - 0.4) * 8,
              actualDeflectY - Math.sin(cueArrowAngle - 0.4) * 8,
            )
            ctx.lineTo(
              actualDeflectX - Math.cos(cueArrowAngle + 0.4) * 8,
              actualDeflectY - Math.sin(cueArrowAngle + 0.4) * 8,
            )
            ctx.closePath()
            ctx.fillStyle = "rgba(255, 255, 255, 0.6)"
            ctx.fill()
          }
        }

        // Draw cue stick
        const cueLength = 280
        const cueOffset = BALL_RADIUS + 10 + power * 0.5
        const cueStartX = cueBall.x - Math.cos(angle) * cueOffset
        const cueStartY = cueBall.y - Math.sin(angle) * cueOffset
        const cueEndX = cueStartX - Math.cos(angle) * cueLength
        const cueEndY = cueStartY - Math.sin(angle) * cueLength

        ctx.save()
        ctx.translate(cueStartX, cueStartY)
        ctx.rotate(angle)

        // Cue tip (blue chalk)
        ctx.fillStyle = "#4169E1"
        ctx.fillRect(-cueLength, -3, 8, 6)

        // Ferrule (white)
        ctx.fillStyle = "#F5F5DC"
        ctx.fillRect(-cueLength + 8, -3.5, 15, 7)

        // Shaft (maple wood color)
        const shaftGrad = ctx.createLinearGradient(-cueLength + 23, 0, -80, 0)
        shaftGrad.addColorStop(0, "#F4D59E")
        shaftGrad.addColorStop(0.5, "#E8C87A")
        shaftGrad.addColorStop(1, "#D4A84B")
        ctx.fillStyle = shaftGrad
        ctx.fillRect(-cueLength + 23, -4, 160, 8)

        // Wrap section
        ctx.fillStyle = "#2F2F2F"
        ctx.fillRect(-80, -5, 60, 10)

        // Wrap pattern
        ctx.strokeStyle = "#F5F5DC"
        ctx.lineWidth = 1
        for (let i = 0; i < 10; i++) {
          ctx.beginPath()
          ctx.moveTo(-75 + i * 6, -5)
          ctx.lineTo(-75 + i * 6 + 3, 5)
          ctx.stroke()
        }

        // Butt section
        const buttGrad = ctx.createLinearGradient(-20, 0, 0, 0)
        buttGrad.addColorStop(0, "#2F1810")
        buttGrad.addColorStop(1, "#1A0E08")
        ctx.fillStyle = buttGrad
        ctx.fillRect(-20, -5, 20, 10)

        // Bumper
        ctx.fillStyle = "#1A1A1A"
        ctx.beginPath()
        ctx.arc(0, 0, 6, -Math.PI / 2, Math.PI / 2)
        ctx.fill()

        ctx.restore()
      }
    }
  }, [balls, isDragging, dragStart, dragEnd, isBallMoving, currentPlayer, player1Type])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isBallMoving || gameOver || (isTraining && currentPlayer === 2)) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = TABLE_WIDTH / rect.width
    const scaleY = TABLE_HEIGHT / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    if (cueBallPlacement) {
      const validX = Math.max(CUSHION_MARGIN + BALL_RADIUS, Math.min(TABLE_WIDTH * 0.25, x))
      const validY = Math.max(CUSHION_MARGIN + BALL_RADIUS, Math.min(TABLE_HEIGHT - CUSHION_MARGIN - BALL_RADIUS, y))

      setBalls((prev) =>
        prev.map((ball) => (ball.id === 0 ? { ...ball, x: validX, y: validY, pocketed: false } : ball)),
      )
      setCueBallPlacement(false)
      setMessage("Your Turn!")
      return
    }

    const cueBall = balls.find((b) => b.id === 0 && !b.pocketed)
    if (!cueBall) return

    const dist = Math.sqrt((x - cueBall.x) ** 2 + (y - cueBall.y) ** 2)
    if (dist < BALL_RADIUS * 3) {
      setIsDragging(true)
      setDragStart({ x: cueBall.x, y: cueBall.y })
      setDragEnd({ x, y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = TABLE_WIDTH / rect.width
    const scaleY = TABLE_HEIGHT / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    setDragEnd({ x, y })
  }

  const handleMouseUp = () => {
    if (!isDragging) return

    const dx = dragStart.x - dragEnd.x
    const dy = dragStart.y - dragEnd.y
    const power = Math.min(Math.sqrt(dx * dx + dy * dy) / 10, MAX_POWER)

    if (power > 0.5) {
      const angle = Math.atan2(dy, dx)

      setBalls((prev) =>
        prev.map((ball) => {
          if (ball.id === 0 && !ball.pocketed) {
            return {
              ...ball,
              vx: Math.cos(angle) * power,
              vy: Math.sin(angle) * power,
            }
          }
          return ball
        }),
      )

      playSound("hit")
      setIsBallMoving(true)
      setHasShot(true)
      setPocketedOwnBall(false)
    }

    setIsDragging(false)
  }

  const playerName = playerProfile?.username || "You"
  const playerType = player1Type ? `(${player1Type})` : ""
  const opponentType = player2Type ? `(${player2Type})` : ""

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-[900px] mb-3">
        <div className="grid grid-cols-3 items-center bg-black/50 rounded-lg px-4 py-2">
          {/* Player 1 */}
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold ${currentPlayer === 1 ? "ring-2 ring-green-500" : ""}`}
            >
              {playerProfile?.username?.slice(0, 2).toUpperCase() || "ZH"}
            </div>
            <div>
              <span className="text-sm font-medium text-white">{playerName}</span>
              <span className="text-xs text-muted-foreground ml-1">{playerType}</span>
            </div>
            {/* Pocketed balls */}
            <div className="flex gap-1 ml-2">
              {player1Pocketed.map((ballId) => (
                <MiniPocketedBall key={ballId} ballId={ballId} />
              ))}
            </div>
          </div>

          {/* VS */}
          <div className="text-center">
            <span className="text-sm font-bold text-muted-foreground">vs</span>
          </div>

          {/* Player 2 / Bot */}
          <div className="flex items-center justify-end gap-2">
            {/* Pocketed balls */}
            <div className="flex gap-1 mr-2">
              {player2Pocketed.map((ballId) => (
                <MiniPocketedBall key={ballId} ballId={ballId} />
              ))}
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-white">{isTraining ? "Bot" : "Player 2"}</span>
              <span className="text-xs text-muted-foreground ml-1">{opponentType}</span>
            </div>
            <div
              className={`w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs ${currentPlayer === 2 ? "ring-2 ring-green-500" : ""}`}
            >
              {isTraining ? "🤖" : "P2"}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 ml-2 border-l border-border pl-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="h-8 w-8 hover:bg-white/10"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={initializeBalls} className="h-8 w-8 hover:bg-white/10">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Game message */}
      <div className="text-center mb-2">
        <span
          className={`text-sm font-medium ${gameOver ? (winner === 1 ? "text-green-500" : "text-red-500") : "text-cyan-400"}`}
        >
          {message}
        </span>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={TABLE_WIDTH}
        height={TABLE_HEIGHT}
        className="rounded-lg cursor-crosshair max-w-full"
        style={{ aspectRatio: `${TABLE_WIDTH}/${TABLE_HEIGHT}` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Game over buttons */}
      {gameOver && (
        <div className="mt-4">
          <Button onClick={initializeBalls} className="bg-white text-black hover:bg-white/90">
            <RotateCcw className="w-4 h-4 mr-2" />
            Play Again
          </Button>
        </div>
      )}
    </div>
  )
}

export default PoolGame

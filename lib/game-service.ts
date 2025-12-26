export interface GameRoom {
  id: string
  host_id: string
  host_username: string
  guest_id: string | null
  guest_username: string | null
  stake: number
  status: "waiting" | "playing" | "finished"
  created_at: string
  is_bot: boolean
}

export interface Profile {
  id: string
  wallet_address: string
  username: string
  wins: number
  losses: number
  total_earnings: number
  penalty_until?: string // ISO timestamp when penalty ends
}

const BOT_NAMES = [
  "Alex_Hunter",
  "Jordan_Smith",
  "Taylor_Brown",
  "Morgan_Davis",
  "Casey_Wilson",
  "Riley_Martinez",
  "Avery_Anderson",
  "Quinn_Thomas",
  "Cameron_Jackson",
  "Skyler_White",
  "Blake_Harris",
  "Drew_Martin",
  "Parker_Thompson",
  "Reese_Garcia",
  "Hayden_Rodriguez",
  "Dakota_Lee",
  "Emerson_Walker",
  "Finley_Hall",
  "Sage_Allen",
  "Rowan_Young",
]

class GameService {
  private botMatchTimers: Map<string, any> = new Map()
  private roomSubscriptions: Map<string, any> = new Map()

  generateFakeMatches(): GameRoom[] {
    const count = Math.floor(Math.random() * 3) + 3 // 3-5 matches
    const matches: GameRoom[] = []

    for (let i = 0; i < count; i++) {
      const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]
      const stake = [0, 0, 0, 0.25, 0.5][Math.floor(Math.random() * 5)] // Mostly free matches
      const minutesAgo = Math.floor(Math.random() * 10) + 1

      matches.push({
        id: `fake_${Date.now()}_${i}`,
        host_id: `bot_${i}`,
        host_username: botName,
        guest_id: null,
        guest_username: null,
        stake,
        status: "waiting",
        created_at: new Date(Date.now() - minutesAgo * 60000).toISOString(),
        is_bot: true,
      })
    }

    return matches
  }

  async createRoom(walletAddress: string, username: string, stake: number): Promise<GameRoom> {
    const room: GameRoom = {
      id: `room_${Date.now()}`,
      host_id: walletAddress,
      host_username: username,
      guest_id: null,
      guest_username: null,
      stake,
      status: "waiting",
      created_at: new Date().toISOString(),
      is_bot: false,
    }

    // Save to localStorage
    localStorage.setItem(`room_${room.id}`, JSON.stringify(room))

    // Start 15 second timer for bot
    this.startBotMatchTimer(room.id)

    return room
  }

  private startBotMatchTimer(roomId: string) {
    const randomDelay = Math.floor(Math.random() * 5000) + 5000 // 5-10 seconds
    console.log(`[v0] Starting bot timer for room: ${roomId} (${randomDelay / 1000}s)`)

    const timer = setTimeout(() => {
      console.log("[v0] Adding bot to room after waiting")
      this.addBotToRoom(roomId)
    }, randomDelay)

    this.botMatchTimers.set(roomId, timer)
  }

  private addBotToRoom(roomId: string) {
    const roomData = localStorage.getItem(`room_${roomId}`)
    if (!roomData) return

    const room: GameRoom = JSON.parse(roomData)

    // Only add bot if room is still waiting
    if (room.status !== "waiting") return

    const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]

    room.guest_id = `bot_${Date.now()}`
    room.guest_username = botName
    room.status = "playing"
    room.is_bot = true

    localStorage.setItem(`room_${roomId}`, JSON.stringify(room))

    console.log("[v0] Bot added to room:", botName)

    // Trigger callback if exists
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("room-updated", { detail: room }))
    }
  }

  cancelBotTimer(roomId: string) {
    if (this.botMatchTimers.has(roomId)) {
      clearTimeout(this.botMatchTimers.get(roomId))
      this.botMatchTimers.delete(roomId)
      console.log("[v0] Bot timer cancelled for room:", roomId)
    }
  }

  getRoom(roomId: string): GameRoom | null {
    const roomData = localStorage.getItem(`room_${roomId}`)
    if (!roomData) return null
    return JSON.parse(roomData)
  }

  getOrCreateProfile(walletAddress: string, username?: string): Profile {
    const profileData = localStorage.getItem(`profile_${walletAddress}`)

    if (profileData) {
      return JSON.parse(profileData)
    }

    const profile: Profile = {
      id: walletAddress,
      wallet_address: walletAddress,
      username: username || walletAddress.slice(0, 8),
      wins: 0,
      losses: 0,
      total_earnings: 0,
    }

    localStorage.setItem(`profile_${walletAddress}`, JSON.stringify(profile))
    return profile
  }

  updateProfile(walletAddress: string, updates: Partial<Profile>) {
    const profile = this.getOrCreateProfile(walletAddress)
    const updated = { ...profile, ...updates }
    localStorage.setItem(`profile_${walletAddress}`, JSON.stringify(updated))
  }

  applyQuitPenalty(walletAddress: string) {
    const penaltyEnd = new Date(Date.now() + 60000).toISOString() // 1 minute
    this.updateProfile(walletAddress, { penalty_until: penaltyEnd })
    console.log("[v0] Applied 1 minute quit penalty to:", walletAddress)
  }

  hasPenalty(walletAddress: string): boolean {
    const profile = this.getOrCreateProfile(walletAddress)
    if (!profile.penalty_until) return false
    return new Date(profile.penalty_until) > new Date()
  }

  getPenaltyTimeRemaining(walletAddress: string): number {
    const profile = this.getOrCreateProfile(walletAddress)
    if (!profile.penalty_until) return 0
    const remaining = new Date(profile.penalty_until).getTime() - Date.now()
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0
  }

  getPlatformStats() {
    return {
      online: Math.floor(Math.random() * 100) + 50, // Random 50-150
      activeMatches: Math.floor(Math.random() * 20) + 5, // Random 5-25
      totalWon: Math.floor(Math.random() * 1000) + 500, // Random SOL amount
      totalPlayers: Math.floor(Math.random() * 500) + 200, // Random 200-700
    }
  }

  subscribeToRoom(roomId: string, callback: (room: GameRoom) => void) {
    console.log("[v0] Subscribing to room:", roomId)

    // Poll every second to check for changes
    const interval = setInterval(() => {
      const room = this.getRoom(roomId)
      if (room) {
        callback(room)
      } else {
        clearInterval(interval)
      }
    }, 1000)

    // Listen for custom events
    const handler = (e: CustomEvent) => {
      if (e.detail.id === roomId) {
        callback(e.detail)
      }
    }

    window.addEventListener("room-updated", handler as EventListener)

    this.roomSubscriptions.set(roomId, { interval, handler })

    return () => {
      clearInterval(interval)
      window.removeEventListener("room-updated", handler as EventListener)
      this.roomSubscriptions.delete(roomId)
      console.log("[v0] Unsubscribed from room:", roomId)
    }
  }

  unsubscribeFromRoom(roomId?: string) {
    if (roomId && this.roomSubscriptions.has(roomId)) {
      const { interval, handler } = this.roomSubscriptions.get(roomId)
      clearInterval(interval)
      window.removeEventListener("room-updated", handler as EventListener)
      this.roomSubscriptions.delete(roomId)
      console.log("[v0] Unsubscribed from room:", roomId)
    } else {
      // Unsubscribe from all
      this.roomSubscriptions.forEach(({ interval, handler }, key) => {
        clearInterval(interval)
        window.removeEventListener("room-updated", handler as EventListener)
      })
      this.roomSubscriptions.clear()
      console.log("[v0] Unsubscribed from all rooms")
    }
  }
}

export const gameService = new GameService()

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
  willDisappear?: boolean // Mark which ones will disappear
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
  "F It Be Well",
  "Mr wizz",
  "rai",
  "Joqlyn",
  "Bayuzii",
  "Shadow",
  "kata",
  "Kingmaker",
  "tncr.eth",
  "MasEmon",
  "Loxous",
  "Mike",
  "Masih Miskin",
  "Haneul",
  "Frontier",
  "Vello",
  "orsralojui",
  "arsenioo256.ink",
  "Verita y Mezcal",
  "Johnny Bravo",
  "Saazcom",
  "suekuer",
  "ajungyoga",
  "pickypicky",
]

const generateUserBotPool = (): string[] => {
  // Add timestamp to make it truly unique per session
  const sessionSeed = Date.now() + Math.random()
  const shuffled = [...BOT_NAMES].sort(() => Math.random() - 0.5)
  return shuffled
}

const getUserBotPool = (): string[] => {
  const sessionKey = "user_bot_pool"
  const sessionTimestampKey = "user_bot_pool_timestamp"

  const existing = sessionStorage.getItem(sessionKey)
  const existingTimestamp = sessionStorage.getItem(sessionTimestampKey)

  if (existing && existingTimestamp) {
    const age = Date.now() - Number.parseInt(existingTimestamp)
    if (age < 60 * 60 * 1000) {
      // Less than 1 hour
      return JSON.parse(existing)
    }
  }

  // Generate new pool with fresh shuffle
  const newPool = generateUserBotPool()
  sessionStorage.setItem(sessionKey, JSON.stringify(newPool))
  sessionStorage.setItem(sessionTimestampKey, Date.now().toString())
  return newPool
}

class GameService {
  private botMatchTimers: Map<string, any> = new Map()
  private roomSubscriptions: Map<string, any> = new Map()

  generateFakeMatches(currentCount = 0): GameRoom[] {
    const availableSlots = Math.max(0, 10 - currentCount)
    if (availableSlots === 0) {
      console.log("[v0] Max lobbies reached, returning empty array")
      return []
    }

    const count = Math.min(Math.floor(Math.random() * 3) + 1, availableSlots)
    const matches: GameRoom[] = []
    const usedNames: Set<string> = new Set()
    const botPool = getUserBotPool()

    for (let i = 0; i < count; i++) {
      // Pick random name from pool
      let botName = botPool[Math.floor(Math.random() * botPool.length)]
      let attempts = 0

      // Ensure no duplicates in current batch
      while (usedNames.has(botName) && attempts < botPool.length) {
        botName = botPool[Math.floor(Math.random() * botPool.length)]
        attempts++
      }

      if (usedNames.has(botName)) continue
      usedNames.add(botName)

      const stake = 0
      const minutesAgo = Math.floor(Math.random() * 10) + 1
      const willDisappear = Math.random() < 0.6

      matches.push({
        id: `fake_${Date.now()}_${Math.random()}`,
        host_id: `bot_${i}_${Date.now()}`,
        host_username: botName,
        guest_id: null,
        guest_username: null,
        stake,
        status: "waiting",
        created_at: new Date(Date.now() - minutesAgo * 60000).toISOString(),
        is_bot: true,
        willDisappear,
      } as any)
    }

    console.log(
      `[v0] Generated ${matches.length} matches (${currentCount} existing, ${availableSlots} slots available)`,
    )
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

    if (room.status !== "waiting") return

    const botName = this.getUniqueBotName(room.host_username)

    room.guest_id = `bot_${Date.now()}`
    room.guest_username = botName
    room.status = "playing"
    room.is_bot = true

    localStorage.setItem(`room_${roomId}`, JSON.stringify(room))

    console.log("[v0] Bot added to room:", botName)

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("room-updated", { detail: room }))
    }
  }

  private getUniqueBotName(excludeName?: string): string {
    const pool = getUserBotPool()

    const availableNames = excludeName ? pool.filter((name) => name !== excludeName) : pool

    if (availableNames.length === 0) {
      return pool[0] // Fallback
    }

    const randomIndex = Math.floor(Math.random() * availableNames.length)
    return availableNames[randomIndex]
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

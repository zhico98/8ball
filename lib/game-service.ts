import { createClient } from "./supabase/client"

export interface GameRoom {
  id: string
  host_id: string
  guest_id: string | null
  stake: number
  status: "waiting" | "playing" | "finished"
  current_turn: "host" | "guest"
  host_type: "solids" | "stripes" | null
  guest_type: "solids" | "stripes" | null
  host_pocketed: number[]
  guest_pocketed: number[]
  game_state: any
  winner_id: string | null
  created_at: string
  started_at: string | null
  finished_at: string | null
  updated_at: string
}

export interface Profile {
  id: string
  wallet_address: string
  username: string
  avatar_url: string | null
  wins: number
  losses: number
  total_earnings: number
  total_wagered: number
  is_online: boolean
  last_seen: string
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
  "Phoenix_King",
  "River_Wright",
  "Kendall_Lopez",
  "Charlie_Hill",
  "Sam_Green",
  "Jesse_Adams",
  "Jaime_Baker",
  "Micah_Nelson",
  "Dylan_Carter",
  "Logan_Mitchell",
]

class GameService {
  private _supabase: ReturnType<typeof createClient> | null = null
  private roomSubscription: any = null
  private botMatchTimers: Map<string, NodeJS.Timeout> = new Map()

  private get supabase() {
    if (!this._supabase) {
      this._supabase = createClient()
    }
    return this._supabase
  }

  async createRoom(hostId: string, stake: number): Promise<GameRoom | null> {
    const { data, error } = await this.supabase
      .from("game_rooms")
      .insert({
        host_id: hostId,
        stake: stake,
        status: "waiting",
        current_turn: "host",
        host_pocketed: [],
        guest_pocketed: [],
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating room:", error)
      return null
    }

    console.log("[v0] Starting bot match timer for room:", data.id)
    this.startBotMatchTimer(data.id)

    return data
  }

  async getAvailableRooms(): Promise<GameRoom[]> {
    const { data, error } = await this.supabase
      .from("game_rooms")
      .select(
        `
        *,
        host:profiles!game_rooms_host_id_fkey(id, username, avatar_url, wins)
      `,
      )
      .eq("status", "waiting")
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Error fetching rooms:", error)
      return []
    }

    return data || []
  }

  async joinRoom(roomId: string, guestId: string): Promise<boolean> {
    if (this.botMatchTimers.has(roomId)) {
      console.log("[v0] Real player joining, canceling bot timer")
      clearTimeout(this.botMatchTimers.get(roomId))
      this.botMatchTimers.delete(roomId)
    }

    const { error } = await this.supabase
      .from("game_rooms")
      .update({
        guest_id: guestId,
        status: "playing",
        started_at: new Date().toISOString(),
      })
      .eq("id", roomId)
      .eq("status", "waiting")

    if (error) {
      console.error("Error joining room:", error)
      return false
    }

    return true
  }

  async getRoom(roomId: string): Promise<GameRoom | null> {
    const { data, error } = await this.supabase
      .from("game_rooms")
      .select(
        `
        *,
        host:profiles!game_rooms_host_id_fkey(id, username, avatar_url, wins),
        guest:profiles!game_rooms_guest_id_fkey(id, username, avatar_url, wins)
      `,
      )
      .eq("id", roomId)
      .single()

    if (error) {
      console.error("Error fetching room:", error)
      return null
    }

    return data
  }

  async updateGameState(
    roomId: string,
    updates: {
      game_state?: any
      current_turn?: "host" | "guest"
      host_type?: "solids" | "stripes" | null
      guest_type?: "solids" | "stripes" | null
      host_pocketed?: number[]
      guest_pocketed?: number[]
      status?: string
      winner_id?: string | null
    },
  ): Promise<boolean> {
    const { error } = await this.supabase.from("game_rooms").update(updates).eq("id", roomId)

    if (error) {
      console.error("Error updating game state:", error)
      return false
    }

    return true
  }

  subscribeToRoom(roomId: string, callback: (room: GameRoom) => void) {
    this.roomSubscription = this.supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "game_rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          callback(payload.new as GameRoom)
        },
      )
      .subscribe()
  }

  unsubscribeFromRoom() {
    if (this.roomSubscription) {
      this.roomSubscription.unsubscribe()
      this.roomSubscription = null
    }
  }

  async getOrCreateProfile(walletAddress: string, username?: string): Promise<Profile | null> {
    try {
      console.log("[v0] Fetching profile for wallet:", walletAddress)

      const { data: existing, error: fetchError } = await this.supabase
        .from("profiles")
        .select("*")
        .eq("wallet_address", walletAddress)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 is "not found" which is expected for new users
        console.error("[v0] Error fetching profile:", fetchError)
        throw new Error(`Database error: ${fetchError.message}`)
      }

      if (existing) {
        console.log("[v0] Profile found, updating online status")
        await this.supabase
          .from("profiles")
          .update({ is_online: true, last_seen: new Date().toISOString() })
          .eq("id", existing.id)

        return existing
      }

      console.log("[v0] Creating new profile")
      const { data, error } = await this.supabase
        .from("profiles")
        .insert({
          wallet_address: walletAddress,
          username: username || walletAddress.slice(0, 8),
          wins: 0,
          losses: 0,
          total_earnings: 0,
          total_wagered: 0,
          is_online: true,
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Error creating profile:", error)
        throw new Error(`Failed to create profile: ${error.message}`)
      }

      console.log("[v0] Profile created successfully")
      return data
    } catch (error: any) {
      console.error("[v0] getOrCreateProfile failed:", error)
      return null
    }
  }

  async getPlatformStats(): Promise<{ online: number; activeMatches: number; totalWon: number; totalPlayers: number }> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { count: onlineCount } = await this.supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_online", true)
      .gte("last_seen", fiveMinutesAgo)

    const { count: activeMatches } = await this.supabase
      .from("game_rooms")
      .select("*", { count: "exact", head: true })
      .eq("status", "playing")

    const { count: totalPlayers } = await this.supabase.from("profiles").select("*", { count: "exact", head: true })

    const { data: earningsData } = await this.supabase.from("profiles").select("total_earnings")

    const totalWon = earningsData?.reduce((sum, p) => sum + (p.total_earnings || 0), 0) || 0

    return {
      online: onlineCount || 0,
      activeMatches: activeMatches || 0,
      totalWon,
      totalPlayers: totalPlayers || 0,
    }
  }

  async getTopPlayers(limit = 100): Promise<Profile[]> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .order("wins", { ascending: false })
      .order("total_earnings", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching top players:", error)
      return []
    }

    return data || []
  }

  async finishGame(roomId: string, winnerId: string): Promise<boolean> {
    const room = await this.getRoom(roomId)
    if (!room) return false

    await this.updateGameState(roomId, {
      status: "finished",
      winner_id: winnerId,
    })

    const { error: finishError } = await this.supabase
      .from("game_rooms")
      .update({ finished_at: new Date().toISOString() })
      .eq("id", roomId)

    if (finishError) {
      console.error("Error finishing game:", finishError)
    }

    const isHostWinner = winnerId === room.host_id
    const winnerProfile = isHostWinner ? room.host_id : room.guest_id
    const loserProfile = isHostWinner ? room.guest_id : room.host_id

    if (!winnerProfile || !loserProfile) return false

    const winnings = room.stake * 2
    await this.supabase
      .from("profiles")
      .update({
        wins: this.supabase.sql`wins + 1`,
        total_earnings: this.supabase.sql`total_earnings + ${winnings}`,
        total_wagered: this.supabase.sql`total_wagered + ${room.stake}`,
      })
      .eq("id", winnerProfile)

    await this.supabase
      .from("profiles")
      .update({
        losses: this.supabase.sql`losses + 1`,
        total_wagered: this.supabase.sql`total_wagered + ${room.stake}`,
      })
      .eq("id", loserProfile)

    await this.supabase.from("match_history").insert([
      {
        player_id: winnerProfile,
        opponent_id: loserProfile,
        room_id: roomId,
        result: "win",
        stake: room.stake,
        earnings: winnings - room.stake,
      },
      {
        player_id: loserProfile,
        opponent_id: winnerProfile,
        room_id: roomId,
        result: "loss",
        stake: room.stake,
        earnings: -room.stake,
      },
    ])

    return true
  }

  private async getOrCreateBotProfile(): Promise<Profile | null> {
    try {
      const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]
      const botWalletAddress = `bot_${botName.toLowerCase()}_${Date.now()}`

      console.log("[v0] Creating bot profile:", botName)

      const { data, error } = await this.supabase
        .from("profiles")
        .insert({
          wallet_address: botWalletAddress,
          username: botName,
          wins: Math.floor(Math.random() * 50) + 10,
          losses: Math.floor(Math.random() * 30) + 5,
          total_earnings: Math.random() * 100,
          total_wagered: Math.random() * 200,
          is_online: true,
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Error creating bot profile:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("[v0] getOrCreateBotProfile failed:", error)
      return null
    }
  }

  private startBotMatchTimer(roomId: string) {
    if (this.botMatchTimers.has(roomId)) {
      clearTimeout(this.botMatchTimers.get(roomId))
    }

    const timer = setTimeout(async () => {
      console.log("[v0] Bot match timer expired for room:", roomId)
      await this.addBotToRoom(roomId)
      this.botMatchTimers.delete(roomId)
    }, 15000)

    this.botMatchTimers.set(roomId, timer)
  }

  private async addBotToRoom(roomId: string) {
    try {
      const { data: room, error: roomError } = await this.supabase
        .from("game_rooms")
        .select("*")
        .eq("id", roomId)
        .eq("status", "waiting")
        .single()

      if (roomError || !room) {
        console.log("[v0] Room not found or already started:", roomId)
        return
      }

      const botProfile = await this.getOrCreateBotProfile()
      if (!botProfile) {
        console.error("[v0] Failed to create bot profile")
        return
      }

      const { error: updateError } = await this.supabase
        .from("game_rooms")
        .update({
          guest_id: botProfile.id,
          status: "playing",
          started_at: new Date().toISOString(),
        })
        .eq("id", roomId)
        .eq("status", "waiting")

      if (updateError) {
        console.error("[v0] Error adding bot to room:", updateError)
        return
      }

      console.log("[v0] Bot successfully added to room:", roomId, "Bot:", botProfile.username)
    } catch (error) {
      console.error("[v0] addBotToRoom failed:", error)
    }
  }
}

export const gameService = new GameService()

"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Wallet, Sparkles, X, Loader2 } from "lucide-react"
import { useWallet } from "@/lib/wallet-context"
import { useInventory } from "@/lib/inventory-context"

interface PackItem {
  name: string
  type: "cue" | "table" | "effect"
  rarity: "common" | "rare" | "legendary"
  chance: number
}

interface PackData {
  name: string
  price: number
  priceSOL: string
  type: "pack" | "box"
  items: PackItem[]
}

interface PackOpeningModalProps {
  isOpen: boolean
  onClose: () => void
  pack: PackData | null
}

const packItems: Record<string, PackItem[]> = {
  "Starter Pack": [
    { name: "Basic Cue", type: "cue", rarity: "common", chance: 50 },
    { name: "Classic Cue", type: "cue", rarity: "common", chance: 25 },
    { name: "Pro Cue", type: "cue", rarity: "rare", chance: 15 },
    { name: "Elite Cue", type: "cue", rarity: "rare", chance: 7 },
    { name: "Golden Cue", type: "cue", rarity: "legendary", chance: 3 },
  ],
  "Pro Pack": [
    { name: "Pro Cue", type: "cue", rarity: "rare", chance: 35 },
    { name: "Elite Cue", type: "cue", rarity: "rare", chance: 25 },
    { name: "Standard Table", type: "table", rarity: "common", chance: 15 },
    { name: "Premium Table", type: "table", rarity: "rare", chance: 15 },
    { name: "Golden Cue", type: "cue", rarity: "legendary", chance: 7 },
    { name: "Diamond Cue", type: "cue", rarity: "legendary", chance: 3 },
  ],
  "Elite Pack": [
    { name: "Elite Cue", type: "cue", rarity: "rare", chance: 25 },
    { name: "Premium Table", type: "table", rarity: "rare", chance: 20 },
    { name: "Golden Cue", type: "cue", rarity: "legendary", chance: 20 },
    { name: "Diamond Cue", type: "cue", rarity: "legendary", chance: 15 },
    { name: "Royal Table", type: "table", rarity: "legendary", chance: 12 },
    { name: "Champion Cue", type: "cue", rarity: "legendary", chance: 8 },
  ],
  "Effect Box": [
    { name: "Smoke Trail", type: "effect", rarity: "common", chance: 40 },
    { name: "Spark Effect", type: "effect", rarity: "common", chance: 30 },
    { name: "Fire Trail", type: "effect", rarity: "rare", chance: 18 },
    { name: "Ice Effect", type: "effect", rarity: "rare", chance: 8 },
    { name: "Lightning Trail", type: "effect", rarity: "legendary", chance: 4 },
  ],
  "Premium Effect Box": [
    { name: "Fire Trail", type: "effect", rarity: "rare", chance: 35 },
    { name: "Ice Effect", type: "effect", rarity: "rare", chance: 25 },
    { name: "Lightning Trail", type: "effect", rarity: "legendary", chance: 20 },
    { name: "Galaxy Effect", type: "effect", rarity: "legendary", chance: 15 },
    { name: "Rainbow Trail", type: "effect", rarity: "legendary", chance: 5 },
  ],
  "Legendary Effect Box": [
    { name: "Lightning Trail", type: "effect", rarity: "legendary", chance: 30 },
    { name: "Galaxy Effect", type: "effect", rarity: "legendary", chance: 30 },
    { name: "Rainbow Trail", type: "effect", rarity: "legendary", chance: 25 },
    { name: "Phoenix Effect", type: "effect", rarity: "legendary", chance: 15 },
  ],
}

const RECIPIENT_ADDRESS = "HvoGuvTAXb1sAD47nFkNAqcWT7EvDFZkrZum22u89EW8"

export function PackOpeningModal({ isOpen, onClose, pack }: PackOpeningModalProps) {
  const { connected, connect, publicKey } = useWallet()
  const { addItem } = useInventory()
  const [isOpening, setIsOpening] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [wonItem, setWonItem] = useState<PackItem | null>(null)
  const [showResult, setShowResult] = useState(false)

  const items = pack ? packItems[pack.name] || [] : []

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "bg-gray-500 text-white"
      case "rare":
        return "bg-blue-500 text-white"
      case "legendary":
        return "bg-yellow-500 text-black"
      default:
        return "bg-gray-500"
    }
  }

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "border-gray-500/50"
      case "rare":
        return "border-blue-500/50"
      case "legendary":
        return "border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.3)]"
      default:
        return "border-gray-500/50"
    }
  }

  const processSolanaPayment = async (): Promise<boolean> => {
    if (!connected || !publicKey || !pack) {
      return false
    }

    setIsPaying(true)

    try {
      if (typeof window === "undefined" || !(window as any).solanaWeb3) {
        throw new Error("Solana Web3 library not loaded. Please refresh the page.")
      }

      // Get Phantom wallet
      const { solana } = window as any
      if (!solana || !solana.isPhantom) {
        throw new Error("Phantom wallet not found. Please install Phantom.")
      }

      // Convert USD price to SOL lamports
      const solPrice = Number.parseFloat(pack.priceSOL.replace(" SOL", ""))
      const lamports = Math.floor(solPrice * 1_000_000_000) // Convert SOL to lamports

      const connection = new (window as any).solanaWeb3.Connection("https://api.mainnet-beta.solana.com", "confirmed")
      const fromPubkey = new (window as any).solanaWeb3.PublicKey(publicKey)
      const toPubkey = new (window as any).solanaWeb3.PublicKey(RECIPIENT_ADDRESS)

      const transaction = new (window as any).solanaWeb3.Transaction().add(
        (window as any).solanaWeb3.SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports,
        }),
      )

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash("confirmed")
      transaction.recentBlockhash = blockhash
      transaction.feePayer = fromPubkey

      const { signature } = await solana.signAndSendTransaction(transaction)
      console.log("Transaction signature:", signature)

      // Wait for confirmation
      await connection.confirmTransaction(signature, "confirmed")

      setIsPaying(false)
      return true
    } catch (error: any) {
      console.error("Payment failed:", error)
      setIsPaying(false)

      if (error.message?.includes("User rejected")) {
        alert("Payment cancelled")
      } else if (error.message?.includes("not loaded")) {
        alert("Please refresh the page and try again.")
      } else {
        alert(`Payment failed: ${error.message || "Please check your wallet and try again."}`)
      }
      return false
    }
  }

  const openPack = async () => {
    if (!connected) {
      connect()
      return
    }

    // Process payment first
    const paymentSuccess = await processSolanaPayment()
    if (!paymentSuccess) {
      return
    }

    setIsOpening(true)

    // Simulate opening animation
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Random item selection based on chances
    const rand = Math.random() * 100
    let cumulative = 0
    let selectedItem = items[0]

    for (const item of items) {
      cumulative += item.chance
      if (rand <= cumulative) {
        selectedItem = item
        break
      }
    }

    setWonItem(selectedItem)
    setShowResult(true)
    setIsOpening(false)

    // Add to inventory
    addItem({
      id: `${Date.now()}-${Math.random()}`,
      name: selectedItem.name,
      type: selectedItem.type,
      rarity: selectedItem.rarity,
    })
  }

  const handleClose = () => {
    setWonItem(null)
    setShowResult(false)
    setIsOpening(false)
    onClose()
  }

  if (!pack) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-card border-border p-0 overflow-hidden">
        {/* Header */}
        <div className="relative p-6 border-b border-border">
          <button onClick={handleClose} className="absolute right-4 top-4 text-muted-foreground hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-foreground">{pack.name}</h2>
          <p className="text-muted-foreground text-sm">
            {pack.type === "pack" ? "Contains cues and tables" : "Contains effects"}
          </p>
        </div>

        {/* Content */}
        <div className={`p-6 ${!connected ? "blur-sm pointer-events-none" : ""}`}>
          {showResult && wonItem ? (
            // Result View
            <div className="text-center py-8">
              <div
                className={`w-32 h-32 mx-auto rounded-2xl ${getRarityBorder(wonItem.rarity)} border-2 bg-secondary/50 flex items-center justify-center mb-6 animate-pulse`}
              >
                <Sparkles
                  className={`w-16 h-16 ${wonItem.rarity === "legendary" ? "text-yellow-400" : wonItem.rarity === "rare" ? "text-blue-400" : "text-gray-400"}`}
                />
              </div>
              <Badge className={`${getRarityColor(wonItem.rarity)} mb-2`}>{wonItem.rarity.toUpperCase()}</Badge>
              <h3 className="text-2xl font-bold text-foreground mb-2">{wonItem.name}</h3>
              <p className="text-muted-foreground text-sm mb-6">Added to your inventory!</p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => {
                    setShowResult(false)
                    setWonItem(null)
                  }}
                  variant="outline"
                  className="border-white/30 bg-transparent"
                >
                  Open Another
                </Button>
                <Button onClick={handleClose} className="bg-white text-black hover:bg-white/90">
                  Close
                </Button>
              </div>
            </div>
          ) : isOpening || isPaying ? (
            // Opening Animation
            <div className="text-center py-16">
              <div className="w-32 h-32 mx-auto rounded-2xl border-2 border-white/30 bg-secondary/50 flex items-center justify-center mb-6 animate-spin">
                <Loader2 className="w-16 h-16 text-white" />
              </div>
              <p className="text-foreground font-medium">{isPaying ? "Processing payment..." : "Opening pack..."}</p>
              {isPaying && <p className="text-muted-foreground text-sm mt-2">Please confirm in Phantom wallet</p>}
            </div>
          ) : (
            // Drop Rates View
            <>
              <h3 className="text-sm font-medium text-muted-foreground mb-4">POSSIBLE ITEMS</h3>
              <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                {items.map((item, idx) => (
                  <Card
                    key={idx}
                    className={`p-3 bg-secondary/30 border ${getRarityBorder(item.rarity)} flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg ${getRarityColor(item.rarity)} flex items-center justify-center`}
                      >
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-foreground font-medium text-sm">{item.name}</p>
                        <p className="text-muted-foreground text-xs capitalize">{item.type}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-white/30 text-muted-foreground">
                      {item.chance}%
                    </Badge>
                  </Card>
                ))}
              </div>

              {/* Price and Buy */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground">Price</span>
                  <div className="text-right">
                    <p className="text-foreground font-bold">{pack.priceSOL}</p>
                    <p className="text-muted-foreground text-xs">${pack.price.toFixed(2)}</p>
                  </div>
                </div>
                <Button
                  onClick={openPack}
                  disabled={isPaying || isOpening}
                  className="w-full bg-white text-black hover:bg-white/90 font-semibold disabled:opacity-50"
                >
                  {isPaying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Buy & Open Pack</>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Connect Wallet Overlay */}
        {!connected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="text-center">
              <Wallet className="w-12 h-12 text-white mx-auto mb-4" />
              <p className="text-foreground font-medium mb-4">Connect your wallet to continue</p>
              <Button onClick={connect} className="bg-white text-black hover:bg-white/90 font-semibold">
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

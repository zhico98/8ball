"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ArrowRightLeft, Sparkles, X, Target } from "lucide-react"
import { useInventory, type InventoryItem } from "@/lib/inventory-context"

interface ExchangeModalProps {
  isOpen: boolean
  onClose: () => void
  selectedItems: InventoryItem[]
  onExchangeComplete: () => void
}

const getRarityUpgrade = (currentRarity: string): "rare" | "legendary" => {
  return currentRarity === "common" ? "rare" : "legendary"
}

const generateUpgradedItem = (
  sourceRarity: string,
  sourceType: string,
): { name: string; type: string; rarity: "rare" | "legendary" } => {
  const newRarity = getRarityUpgrade(sourceRarity)

  const itemsByType: Record<string, Record<string, string[]>> = {
    cue: {
      rare: ["Pro Cue", "Elite Cue", "Master Cue"],
      legendary: ["Golden Cue", "Diamond Cue", "Champion Cue"],
    },
    table: {
      rare: ["Premium Table", "Luxury Table"],
      legendary: ["Royal Table", "Championship Table"],
    },
    effect: {
      rare: ["Fire Trail", "Ice Effect", "Neon Glow"],
      legendary: ["Lightning Trail", "Galaxy Effect", "Rainbow Trail", "Phoenix Effect"],
    },
  }

  const options = itemsByType[sourceType]?.[newRarity] || ["Upgraded Item"]
  const randomName = options[Math.floor(Math.random() * options.length)]

  return {
    name: randomName,
    type: sourceType,
    rarity: newRarity,
  }
}

export function ExchangeModal({ isOpen, onClose, selectedItems, onExchangeComplete }: ExchangeModalProps) {
  const { addItem, removeItem } = useInventory()
  const [stage, setStage] = useState<"confirm" | "exchanging" | "result">("confirm")
  const [newItem, setNewItem] = useState<InventoryItem | null>(null)

  const sourceRarity = selectedItems[0]?.rarity || "common"
  const targetRarity = getRarityUpgrade(sourceRarity)

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

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case "rare":
        return "shadow-[0_0_40px_rgba(59,130,246,0.6)]"
      case "legendary":
        return "shadow-[0_0_60px_rgba(234,179,8,0.8)]"
      default:
        return ""
    }
  }

  const handleExchange = async () => {
    setStage("exchanging")

    // Animation duration
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Generate new item
    const upgraded = generateUpgradedItem(sourceRarity, selectedItems[0].type)
    const createdItem: InventoryItem = {
      id: `${Date.now()}-${Math.random()}`,
      ...upgraded,
    }

    // Remove old items and add new
    selectedItems.forEach((item) => removeItem(item.id))
    addItem(createdItem)

    setNewItem(createdItem)
    setStage("result")
  }

  const handleClose = () => {
    setStage("confirm")
    setNewItem(null)
    onExchangeComplete()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-card border-border p-0 overflow-hidden">
        {/* Header */}
        <div className="relative p-6 border-b border-border">
          <button onClick={handleClose} className="absolute right-4 top-4 text-muted-foreground hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            Item Exchange
          </h2>
          <p className="text-muted-foreground text-sm">Trade 5 items for 1 higher rarity item</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {stage === "confirm" && (
            <div>
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div>
                    <Badge className={`${getRarityColor(sourceRarity)} mb-2`}>{sourceRarity.toUpperCase()}</Badge>
                    <p className="text-4xl font-bold text-foreground">5×</p>
                  </div>
                  <ArrowRightLeft className="w-8 h-8 text-muted-foreground" />
                  <div>
                    <Badge className={`${getRarityColor(targetRarity)} mb-2`}>{targetRarity.toUpperCase()}</Badge>
                    <p className="text-4xl font-bold text-foreground">1×</p>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm">
                  Exchange {selectedItems.length} {sourceRarity} items for 1 {targetRarity} item
                </p>
              </div>

              {/* Selected Items Grid */}
              <div className="grid grid-cols-5 gap-3 mb-6">
                {selectedItems.map((item, idx) => (
                  <Card key={idx} className="p-3 bg-secondary/30 border-border">
                    <div className="aspect-square bg-secondary/50 rounded-lg flex items-center justify-center mb-2">
                      {item.type === "effect" ? (
                        <Sparkles className="w-6 h-6 text-gray-400" />
                      ) : (
                        <Target className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <p className="text-xs text-foreground truncate">{item.name}</p>
                  </Card>
                ))}
              </div>

              {/* Warning */}
              <Card className="p-4 bg-yellow-500/10 border-yellow-500/30 mb-6">
                <p className="text-sm text-foreground text-center">
                  ⚠️ This action cannot be undone. Your selected items will be permanently exchanged.
                </p>
              </Card>

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1 border-white/30 bg-transparent hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button onClick={handleExchange} className="flex-1 bg-white text-black hover:bg-white/90 font-semibold">
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  Confirm Exchange
                </Button>
              </div>
            </div>
          )}

          {stage === "exchanging" && (
            <div className="text-center py-16">
              {/* Animated Exchange Effect */}
              <div className="relative w-48 h-48 mx-auto mb-6">
                {/* Circling Items */}
                <div className="absolute inset-0 animate-spin" style={{ animationDuration: "2s" }}>
                  {[0, 1, 2, 3, 4].map((idx) => (
                    <div
                      key={idx}
                      className="absolute w-12 h-12 bg-secondary/50 border-2 border-gray-500/50 rounded-lg flex items-center justify-center"
                      style={{
                        top: "50%",
                        left: "50%",
                        transform: `rotate(${idx * 72}deg) translateY(-80px) rotate(-${idx * 72}deg)`,
                      }}
                    >
                      <Sparkles className="w-6 h-6 text-gray-400" />
                    </div>
                  ))}
                </div>

                {/* Center Glow */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-white/10 animate-pulse backdrop-blur-sm">
                    <div className="w-full h-full flex items-center justify-center">
                      <ArrowRightLeft className="w-12 h-12 text-white animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-foreground font-bold text-lg animate-pulse">Exchanging Items...</p>
              <p className="text-muted-foreground text-sm mt-2">Combining into higher rarity</p>
            </div>
          )}

          {stage === "result" && newItem && (
            <div className="text-center py-8">
              {/* Success Result */}
              <div className="relative mb-8">
                <div
                  className={`w-40 h-40 mx-auto rounded-2xl border-4 ${
                    newItem.rarity === "legendary" ? "border-yellow-500/50" : "border-blue-500/50"
                  } ${getRarityGlow(newItem.rarity)} bg-secondary/50 flex items-center justify-center animate-bounce`}
                  style={{ animationDuration: "0.6s", animationIterationCount: "3" }}
                >
                  {newItem.type === "effect" ? (
                    <Sparkles
                      className={`w-20 h-20 ${newItem.rarity === "legendary" ? "text-yellow-400" : "text-blue-400"}`}
                    />
                  ) : (
                    <Target
                      className={`w-20 h-20 ${newItem.rarity === "legendary" ? "text-yellow-400" : "text-blue-400"}`}
                    />
                  )}
                </div>

                {/* Particles Effect */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                      style={{
                        animationDelay: `${i * 0.1}s`,
                        transform: `rotate(${i * 45}deg) translateY(-100px)`,
                      }}
                    />
                  ))}
                </div>
              </div>

              <Badge className={`${getRarityColor(newItem.rarity)} mb-3 text-sm px-4 py-1`}>
                {newItem.rarity.toUpperCase()}
              </Badge>
              <h3 className="text-3xl font-bold text-foreground mb-2">{newItem.name}</h3>
              <p className="text-muted-foreground mb-2 capitalize">{newItem.type}</p>
              <p className="text-green-400 font-semibold mb-8">✓ Added to your inventory!</p>

              <div className="flex gap-3 justify-center">
                <Button onClick={handleClose} className="bg-white text-black hover:bg-white/90 font-semibold px-8">
                  Awesome!
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

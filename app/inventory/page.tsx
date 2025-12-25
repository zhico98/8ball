"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, Sparkles, Target, Wallet, ArrowRightLeft } from "lucide-react"
import { useWallet } from "@/lib/wallet-context"
import { useInventory } from "@/lib/inventory-context"
import Link from "next/link"
import { useState } from "react"
import { ExchangeModal } from "@/components/exchange-modal"

export default function InventoryPage() {
  const { connected, connect } = useWallet()
  const { items } = useInventory()
  const [exchangeMode, setExchangeMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showExchangeModal, setShowExchangeModal] = useState(false)

  const cues = items.filter((item) => item.type === "cue")
  const tables = items.filter((item) => item.type === "table")
  const effects = items.filter((item) => item.type === "effect")

  const commonCount = items.filter((item) => item.rarity === "common").length
  const rareCount = items.filter((item) => item.rarity === "rare").length
  const legendaryCount = items.filter((item) => item.rarity === "legendary").length

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "bg-gray-500"
      case "rare":
        return "bg-blue-500"
      case "legendary":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "border-gray-500/30"
      case "rare":
        return "border-blue-500/30"
      case "legendary":
        return "border-yellow-500/30"
      default:
        return "border-gray-500/30"
    }
  }

  const toggleItemSelection = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter((id) => id !== itemId))
    } else if (selectedItems.length < 5) {
      setSelectedItems([...selectedItems, itemId])
    }
  }

  const canExchange = () => {
    if (selectedItems.length !== 5) return false
    const selected = items.filter((item) => selectedItems.includes(item.id))
    const firstRarity = selected[0]?.rarity
    return selected.every((item) => item.rarity === firstRarity)
  }

  const handleExchange = () => {
    if (!canExchange()) return
    setShowExchangeModal(true)
  }

  const handleExchangeComplete = () => {
    setSelectedItems([])
    setExchangeMode(false)
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Wallet className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">Connect your wallet to view your inventory</p>
            <Button onClick={connect} className="bg-white text-black hover:bg-white/90 font-semibold">
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Tabs Header */}
        <div className="border-b border-border bg-card/50">
          <div className="max-w-6xl mx-auto px-6">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="bg-transparent h-14 gap-2">
                <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-black">
                  <Package className="w-4 h-4 mr-2" />
                  All Items
                </TabsTrigger>
                <TabsTrigger value="cues" className="data-[state=active]:bg-white data-[state=active]:text-black">
                  <Target className="w-4 h-4 mr-2" />
                  Cues ({cues.length})
                </TabsTrigger>
                <TabsTrigger value="tables" className="data-[state=active]:bg-white data-[state=active]:text-black">
                  <Package className="w-4 h-4 mr-2" />
                  Tables ({tables.length})
                </TabsTrigger>
                <TabsTrigger value="effects" className="data-[state=active]:bg-white data-[state=active]:text-black">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Effects ({effects.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <section className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex gap-6">
            {/* Main Content */}
            <div className="flex-1">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-foreground mb-2">Your Inventory</h1>
                <p className="text-muted-foreground text-sm">
                  Collect cues, tables, and effects to customize your gameplay
                </p>
                {items.length >= 5 && (
                  <div className="mt-4">
                    <Button
                      variant={exchangeMode ? "default" : "outline"}
                      onClick={() => {
                        setExchangeMode(!exchangeMode)
                        setSelectedItems([])
                      }}
                      className={exchangeMode ? "bg-white text-black" : "border-white/30"}
                    >
                      <ArrowRightLeft className="w-4 h-4 mr-2" />
                      {exchangeMode ? "Cancel Exchange" : "Exchange Items"}
                    </Button>
                  </div>
                )}
              </div>

              {exchangeMode && (
                <Card className="p-4 bg-blue-500/10 border-blue-500/30 mb-6">
                  <p className="text-sm text-foreground mb-2">
                    <strong>Exchange Mode:</strong> Select 5 items of the same rarity to exchange for 1 item of higher
                    rarity
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Selected: {selectedItems.length}/5 {canExchange() && "✓ Ready to exchange!"}
                  </p>
                  {canExchange() && (
                    <Button onClick={handleExchange} className="mt-3 bg-white text-black hover:bg-white/90 w-full">
                      Exchange Now
                    </Button>
                  )}
                </Card>
              )}

              {items.length === 0 ? (
                <Card className="p-16 bg-card border-border flex flex-col items-center justify-center min-h-[300px]">
                  <Package className="w-16 h-16 text-white/20 mb-4" />
                  <p className="text-foreground font-medium mb-2">Your inventory is empty</p>
                  <p className="text-muted-foreground text-sm mb-4">Purchase packs or boxes to get started</p>
                  <Link href="/shop">
                    <Button className="bg-white text-black hover:bg-white/90">Go to Shop</Button>
                  </Link>
                </Card>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {items.map((item) => (
                    <Card
                      key={item.id}
                      className={`p-4 bg-card border-2 ${getRarityBorder(item.rarity)} ${
                        exchangeMode ? "cursor-pointer hover:scale-105 transition-transform" : ""
                      } ${selectedItems.includes(item.id) ? "ring-2 ring-white" : ""}`}
                      onClick={() => exchangeMode && toggleItemSelection(item.id)}
                    >
                      {exchangeMode && selectedItems.includes(item.id) && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center text-black font-bold text-xs">
                          ✓
                        </div>
                      )}
                      <div className="aspect-square bg-secondary/30 rounded-lg flex items-center justify-center mb-3">
                        {item.type === "effect" ? (
                          <Sparkles
                            className={`w-12 h-12 ${item.rarity === "legendary" ? "text-yellow-400" : item.rarity === "rare" ? "text-blue-400" : "text-gray-400"}`}
                          />
                        ) : (
                          <Target
                            className={`w-12 h-12 ${item.rarity === "legendary" ? "text-yellow-400" : item.rarity === "rare" ? "text-blue-400" : "text-gray-400"}`}
                          />
                        )}
                      </div>
                      <Badge className={`${getRarityColor(item.rarity)} text-xs mb-2`}>{item.rarity}</Badge>
                      <p className="text-foreground font-medium text-sm truncate">{item.name}</p>
                      <p className="text-muted-foreground text-xs capitalize">{item.type}</p>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Summary Sidebar */}
            <Card className="w-72 p-6 bg-card border-border h-fit shrink-0">
              <p className="text-muted-foreground text-sm mb-4">Summary</p>

              <div className="flex items-center justify-between mb-4">
                <span className="text-foreground font-medium">Total Items: {items.length}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <Card className="p-3 bg-secondary/30 border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 rounded bg-gray-500" />
                    <span className="text-xs text-muted-foreground">Common</span>
                  </div>
                  <span className="text-xl font-bold text-foreground">{commonCount}</span>
                </Card>
                <Card className="p-3 bg-secondary/30 border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 rounded bg-blue-500" />
                    <span className="text-xs text-muted-foreground">Rare</span>
                  </div>
                  <span className="text-xl font-bold text-foreground">{rareCount}</span>
                </Card>
                <Card className="p-3 bg-secondary/30 border-border col-span-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 rounded bg-yellow-500" />
                    <span className="text-xs text-muted-foreground">Legendary</span>
                  </div>
                  <span className="text-xl font-bold text-foreground">{legendaryCount}</span>
                </Card>
              </div>

              <Link href="/shop">
                <Button className="w-full bg-white text-black hover:bg-white/90 font-semibold">Buy More</Button>
              </Link>
            </Card>
          </div>
        </section>
      </main>

      <Footer />

      <ExchangeModal
        isOpen={showExchangeModal}
        onClose={() => setShowExchangeModal(false)}
        selectedItems={items.filter((item) => selectedItems.includes(item.id))}
        onExchangeComplete={handleExchangeComplete}
      />
    </div>
  )
}

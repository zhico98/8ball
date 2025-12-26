"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wallet } from "lucide-react"
import { useWallet } from "@/lib/wallet-context"
import { PackOpeningModal } from "@/components/pack-opening-modal"
import Image from "next/image"

const packs = [
  {
    name: "Starter Pack",
    price: 3,
    priceSOL: "0.021 SOL",
    type: "pack" as const,
    rareChance: "15%",
    legendaryChance: "3%",
    description: "Basic cues for beginners. Great starting point!",
    color: "border-gray-500/30 hover:border-gray-400/50",
    image: "/images/pack_1.png",
    items: [],
  },
  {
    name: "Pro Pack",
    price: 5,
    priceSOL: "0.036 SOL",
    type: "pack" as const,
    rareChance: "35%",
    legendaryChance: "10%",
    description: "Pro cues and tables with better odds.",
    color: "border-yellow-500/30 hover:border-yellow-400/50",
    image: "/images/pack_2.png",
    items: [],
  },
  {
    name: "Elite Pack",
    price: 10,
    priceSOL: "0.072 SOL",
    type: "pack" as const,
    rareChance: "55%",
    legendaryChance: "20%",
    description: "Elite items with highest legendary chances.",
    color: "border-blue-500/30 hover:border-blue-400/50",
    image: "/images/pack_3.png",
    items: [],
  },
]

const boxes = [
  {
    name: "Effect Box",
    price: 1,
    priceSOL: "0.007 SOL",
    type: "box" as const,
    rareChance: "26%",
    legendaryChance: "4%",
    description: "Basic shot effects and trails.",
    color: "border-gray-500/30 hover:border-gray-400/50",
    image: "/images/effectbox_1.png",
    items: [],
  },
  {
    name: "Premium Effect Box",
    price: 1.99,
    priceSOL: "0.014 SOL",
    type: "box" as const,
    rareChance: "60%",
    legendaryChance: "20%",
    description: "Premium effects with better odds.",
    color: "border-yellow-500/30 hover:border-yellow-400/50",
    image: "/images/effectbox_2.png",
    items: [],
  },
  {
    name: "Legendary Effect Box",
    price: 3,
    priceSOL: "0.021 SOL",
    type: "box" as const,
    rareChance: "0%",
    legendaryChance: "100%",
    description: "Guaranteed legendary effects only!",
    color: "border-blue-500/30 hover:border-blue-400/50",
    image: "/images/effectbox_3.png",
    items: [],
  },
]

export default function ShopPage() {
  const { balance } = useWallet()
  const [selectedPack, setSelectedPack] = useState<(typeof packs)[0] | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handlePackClick = (pack: (typeof packs)[0]) => {
    setSelectedPack(pack)
    setModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="relative overflow-hidden border-b border-border bg-gradient-to-b from-neutral-800/50 via-neutral-900/30 to-background">
          <div className="relative z-10 text-center py-16 px-6">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Shop</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Open packs to discover rare cues, tables, and effects for your gameplay
            </p>

            {/* Balance Box */}
            <Card className="max-w-md mx-auto mt-8 p-4 bg-card border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-foreground">Your Balance:</span>
              </div>
              <span className="text-white font-semibold">{balance.toFixed(2)} SOL</span>
            </Card>
          </div>
        </div>

        {/* Packs Section */}
        <section className="max-w-6xl mx-auto px-6 py-12">
          <Card className="p-6 bg-card border-border">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-2">Packs</h2>
              <p className="text-muted-foreground text-sm">
                Packs contain cues and tables. Higher tier packs have better legendary chances.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {packs.map((pack) => (
                <Card
                  key={pack.name}
                  onClick={() => handlePackClick(pack)}
                  className={`p-5 border-2 ${pack.color} cursor-pointer transition-all hover:scale-[1.02] bg-secondary/20`}
                >
                  <div className="aspect-[4/5] rounded-lg mb-4 overflow-hidden relative">
                    <Image src={pack.image || "/placeholder.svg"} alt={pack.name} fill className="object-cover" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{pack.name}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-foreground font-bold text-lg">${pack.price.toFixed(2)}</span>
                    <span className="text-muted-foreground text-sm">{pack.priceSOL}</span>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                      Rare {pack.rareChance}
                    </Badge>
                    <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-400">
                      Leg. {pack.legendaryChance}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">{pack.description}</p>
                </Card>
              ))}
            </div>
          </Card>
        </section>

        {/* Boxes Section */}
        <section className="max-w-6xl mx-auto px-6 pb-12">
          <Card className="p-6 bg-card border-border">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-2">Effect Boxes</h2>
              <p className="text-muted-foreground text-sm">
                Boxes contain visual effects for your shots - trails, sparks, and more!
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {boxes.map((box) => (
                <Card
                  key={box.name}
                  onClick={() => handlePackClick(box)}
                  className={`p-5 border-2 ${box.color} cursor-pointer transition-all hover:scale-[1.02] bg-secondary/20`}
                >
                  <div className="aspect-[4/5] rounded-lg mb-4 overflow-hidden relative">
                    <Image src={box.image || "/placeholder.svg"} alt={box.name} fill className="object-cover" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{box.name}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-foreground font-bold text-lg">${box.price.toFixed(2)}</span>
                    <span className="text-muted-foreground text-sm">{box.priceSOL}</span>
                  </div>
                  <div className="flex gap-2 mb-3">
                    {box.rareChance !== "0%" && (
                      <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                        Rare {box.rareChance}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-400">
                      Leg. {box.legendaryChance}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">{box.description}</p>
                </Card>
              ))}
            </div>
          </Card>
        </section>
      </main>

      <Footer />

      <PackOpeningModal isOpen={modalOpen} onClose={() => setModalOpen(false)} pack={selectedPack} />
    </div>
  )
}

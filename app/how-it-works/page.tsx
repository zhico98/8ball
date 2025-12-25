"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Wallet,
  Gamepad2,
  Trophy,
  Banknote,
  ArrowUpDown,
  RotateCcw,
  Sparkles,
  Package,
  Swords,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { useWallet } from "@/lib/wallet-context"

const steps = [
  {
    number: "01",
    title: "Connect Wallet",
    description: "Connect your Phantom wallet to get started. Your inventory and winnings are stored on-chain.",
    icon: Wallet,
  },
  {
    number: "02",
    title: "Find a Match",
    description: "Browse available matches or create your own. Set your stake amount from 0.1 SOL to 100 SOL.",
    icon: Swords,
  },
  {
    number: "03",
    title: "Play & Win",
    description: "Compete in real-time 8-ball pool matches. Pot the 8-ball to win and claim your opponent's stake.",
    icon: Gamepad2,
  },
  {
    number: "04",
    title: "Collect Rewards",
    description: "Winnings are instantly sent to your wallet. Earn additional rewards through tournaments.",
    icon: Banknote,
  },
]

const rewardTypes = [
  {
    title: "Match Winnings",
    badge: "Instant",
    description:
      "Win a match and receive your opponent's stake minus a 5% platform fee. Payouts are instant to your wallet.",
    icon: Trophy,
  },
  {
    title: "Tournament Prizes",
    badge: "Weekly",
    description: "Compete in weekly tournaments for massive prize pools. Top 10 players share the rewards.",
    icon: Sparkles,
  },
]

const features = [
  {
    title: "Upgrade",
    description: "Level up your cues and tables using items from packs for better stats.",
    icon: ArrowUpDown,
  },
  {
    title: "Exchange",
    description: "Trade 5 items of the same rarity for 1 item of higher rarity.",
    icon: RotateCcw,
  },
  {
    title: "Customize",
    description: "Equip effects from boxes to add visual flair to your shots.",
    icon: Sparkles,
  },
  {
    title: "Collect",
    description: "Collect rare cues, tables, and effects to build the ultimate collection.",
    icon: Package,
  },
]

export default function HowItWorksPage() {
  const { connected, connect } = useWallet()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="relative overflow-hidden border-b border-border bg-gradient-to-b from-white/10 via-white/5 to-transparent">
          <div className="absolute inset-0 bg-gradient-to-b from-white/8 to-transparent pointer-events-none" />
          <div className="relative z-10 text-center py-16 px-6">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">How it Works?</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Connect your wallet, find a match, and start winning SOL
            </p>
          </div>
        </div>

        {/* Steps Section */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <Card key={step.number} className="p-6 bg-card border-border hover:border-white/30 transition-colors">
                <div className="aspect-square bg-secondary/50 rounded-lg flex items-center justify-center mb-6">
                  <step.icon className="w-12 h-12 text-white/80" />
                </div>
                <p className="text-3xl font-bold text-white mb-2">{step.number}</p>
                <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* How Rewards Work */}
        <section className="border-t border-border">
          <div className="max-w-4xl mx-auto px-6 py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">How rewards work</h2>
              <p className="text-muted-foreground">Win matches and tournaments to earn SOL rewards</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {rewardTypes.map((reward) => (
                <Card key={reward.title} className="p-6 bg-card border-border">
                  <div className="aspect-video bg-secondary/30 rounded-lg flex items-center justify-center mb-4">
                    <reward.icon className="w-16 h-16 text-white/60" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">{reward.title}</h3>
                    <Badge variant="outline" className="text-xs border-white/30">
                      {reward.badge}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{reward.description}</p>
                </Card>
              ))}
            </div>

            <p className="text-center text-muted-foreground text-sm mt-8">
              Rewards generated from platform fees and tournament entry fees.
            </p>
            <div className="flex justify-center mt-4">
              <Link href="/leaderboard">
                <Button variant="outline" className="border-white/30 bg-transparent">
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Customize Your Game</h2>
              <p className="text-muted-foreground">Collect and upgrade items to gain an edge</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="p-6 bg-card border-border">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-border">
          <div className="max-w-2xl mx-auto px-6 py-16 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Play?</h2>
            <p className="text-muted-foreground mb-8">Connect your wallet and start competing for SOL prizes today</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {!connected ? (
                <Button onClick={connect} size="lg" className="bg-white hover:bg-white/90 text-black font-bold px-8">
                  <Wallet className="w-5 h-5 mr-2" />
                  Connect Wallet
                </Button>
              ) : (
                <Link href="/">
                  <Button size="lg" className="bg-white hover:bg-white/90 text-black font-bold px-8">
                    <Gamepad2 className="w-5 h-5 mr-2" />
                    Find Match
                  </Button>
                </Link>
              )}
              <Link href="/shop">
                <Button size="lg" variant="outline" className="border-white/30 bg-transparent px-8">
                  <Zap className="w-5 h-5 mr-2" />
                  View Shop
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

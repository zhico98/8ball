"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Trophy, CheckCircle2, Plus } from "lucide-react"

export default function RewardsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative overflow-hidden border-b border-border bg-gradient-to-b from-neutral-800/50 via-neutral-900/30 to-background">
          <div className="relative z-10 text-center py-16 px-6">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Your Rewards</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Track your accumulated SOL rewards from matches and platform activities
            </p>

            {/* Match Rewards Box */}
            <Card className="max-w-md mx-auto mt-8 p-4 bg-card border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-foreground">Match Rewards</span>
              </div>
              <span className="text-white font-semibold">0.000000 SOL</span>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <section className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Rewards History */}
            <Card className="lg:col-span-2 p-8 bg-card border-border min-h-[300px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-foreground font-medium mb-2">No rewards yet</p>
                <p className="text-muted-foreground text-sm">Your match rewards will appear here</p>
              </div>
            </Card>

            {/* Automatic Distribution */}
            <Card className="p-6 bg-card border-border">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="w-5 h-5 text-white" />
                <h3 className="text-lg font-semibold text-foreground">Automatic Distribution</h3>
              </div>
              <p className="text-muted-foreground text-sm mb-6">All rewards earned from your successful matches</p>

              <h4 className="font-semibold text-foreground mb-4">How Distribution Works</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    All rewards will be automatically distributed to your connected wallet
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">Distribution happens instantly after each match</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    No manual claims required - rewards arrive directly in your wallet
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Processing may take up to 24 hours during high activity periods
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

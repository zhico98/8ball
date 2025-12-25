"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, HelpCircle, Package, Gift, ShoppingBag, Wallet, ChevronDown, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/lib/wallet-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfileModal } from "@/components/profile-modal"

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "How it Works", href: "/how-it-works", icon: HelpCircle },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Rewards", href: "/rewards", icon: Gift },
  { label: "Shop", href: "/shop", icon: ShoppingBag },
]

export function Header() {
  const pathname = usePathname()
  const { connected, publicKey, balance, profile, connect, disconnect } = useWallet()
  const [showProfile, setShowProfile] = useState(false)

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  return (
    <>
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold tracking-tight text-foreground">
              bilardo<span className="text-white/60">.fun</span>
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "text-foreground bg-secondary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {connected && publicKey && profile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-white/30 bg-secondary/50 font-semibold px-3 gap-3">
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={profile.avatar || undefined} />
                    <AvatarFallback className="bg-white text-black text-xs font-bold">
                      {profile.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold">{profile.username}</p>
                    <p className="text-xs text-muted-foreground">{balance.toFixed(2)} SOL</p>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                <DropdownMenuItem onClick={() => setShowProfile(true)} className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="text-muted-foreground">
                  <Wallet className="w-4 h-4 mr-2" />
                  {shortenAddress(publicKey)}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={disconnect} className="text-red-400 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={connect} className="bg-white hover:bg-white/90 text-black font-semibold px-6">
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          )}
        </div>
      </header>

      <ProfileModal open={showProfile} onOpenChange={setShowProfile} isOwnProfile />
    </>
  )
}

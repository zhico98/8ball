"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { useWallet, type UserProfile } from "@/lib/wallet-context"
import { Twitter, Send, Trophy, Eye, EyeOff, Camera, Check, X } from "lucide-react"

interface ProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  viewProfile?: UserProfile & { publicKey?: string }
  isOwnProfile?: boolean
}

export function ProfileModal({ open, onOpenChange, viewProfile, isOwnProfile = true }: ProfileModalProps) {
  const { profile, updateProfile, publicKey } = useWallet()
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    username: "",
    twitter: "",
    telegram: "",
    isPrivate: false,
    avatar: "" as string | null,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const displayProfile = viewProfile || profile
  const canEdit = isOwnProfile && !viewProfile

  const startEditing = () => {
    if (profile) {
      setEditData({
        username: profile.username,
        twitter: profile.twitter || "",
        telegram: profile.telegram || "",
        isPrivate: profile.isPrivate,
        avatar: profile.avatar,
      })
      setIsEditing(true)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditData({ ...editData, avatar: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const saveChanges = () => {
    updateProfile({
      username: editData.username,
      twitter: editData.twitter || null,
      telegram: editData.telegram || null,
      isPrivate: editData.isPrivate,
      avatar: editData.avatar,
    })
    setIsEditing(false)
  }

  if (!displayProfile) return null

  // If profile is private and not own profile
  if (displayProfile.isPrivate && !canEdit) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Private Profile</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-8">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
              <EyeOff className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-center">This player has set their profile to private.</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg [&>button]:hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            {isEditing ? "Edit Profile" : canEdit ? "Your Profile" : "Player Profile"}
          </h2>
          <div className="flex items-center gap-2">
            {canEdit && !isEditing && (
              <Button variant="outline" size="sm" onClick={startEditing} className="border-white/30 bg-transparent">
                Edit Profile
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Avatar & Basic Info */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-20 h-20 border-2 border-white/20">
                <AvatarImage src={isEditing ? editData.avatar || undefined : displayProfile.avatar || undefined} />
                <AvatarFallback className="bg-white text-black text-xl font-bold">
                  {(isEditing ? editData.username : displayProfile.username).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {canEdit && isEditing && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={editData.username}
                  onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                  className="bg-secondary border-border mb-2"
                  placeholder="Username"
                />
              ) : (
                <h3 className="text-xl font-bold text-foreground">{displayProfile.username}</h3>
              )}
              {viewProfile?.publicKey && (
                <p className="text-xs text-muted-foreground font-mono">
                  {viewProfile.publicKey.slice(0, 8)}...{viewProfile.publicKey.slice(-8)}
                </p>
              )}
              {canEdit && publicKey && (
                <p className="text-xs text-muted-foreground font-mono">
                  {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 bg-secondary/50 border-border text-center">
              <p className="text-2xl font-bold text-white">{displayProfile.wins}</p>
              <p className="text-xs text-muted-foreground">Wins</p>
            </Card>
            <Card className="p-3 bg-secondary/50 border-border text-center">
              <p className="text-2xl font-bold text-white">{displayProfile.losses}</p>
              <p className="text-xs text-muted-foreground">Losses</p>
            </Card>
            <Card className="p-3 bg-secondary/50 border-border text-center">
              <p className="text-2xl font-bold text-white">{displayProfile.totalEarnings.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">SOL Won</p>
            </Card>
          </div>

          {/* Social Links */}
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <Label className="text-muted-foreground text-xs">Twitter Username</Label>
                <div className="relative">
                  <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={editData.twitter}
                    onChange={(e) => setEditData({ ...editData, twitter: e.target.value })}
                    className="bg-secondary border-border pl-10"
                    placeholder="@username"
                  />
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Telegram Username</Label>
                <div className="relative">
                  <Send className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={editData.telegram}
                    onChange={(e) => setEditData({ ...editData, telegram: e.target.value })}
                    className="bg-secondary border-border pl-10"
                    placeholder="@username"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-2">
                  {editData.isPrivate ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span className="text-sm">Private Profile</span>
                </div>
                <Switch
                  checked={editData.isPrivate}
                  onCheckedChange={(checked) => setEditData({ ...editData, isPrivate: checked })}
                />
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              {displayProfile.twitter && (
                <a
                  href={`https://twitter.com/${displayProfile.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                  <span className="text-sm">{displayProfile.twitter}</span>
                </a>
              )}
              {displayProfile.telegram && (
                <a
                  href={`https://t.me/${displayProfile.telegram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span className="text-sm">{displayProfile.telegram}</span>
                </a>
              )}
              {!displayProfile.twitter && !displayProfile.telegram && (
                <p className="text-sm text-muted-foreground">No social links added</p>
              )}
            </div>
          )}

          {/* Match History */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Recent Matches
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {displayProfile.matchHistory.slice(0, 5).map((match) => (
                <div key={match.id} className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                      {match.opponentAvatar}
                    </div>
                    <span className="text-sm text-foreground">{match.opponent}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{match.stake} SOL</span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        match.result === "win" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {match.result === "win" ? "WIN" : "LOSS"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save/Cancel Buttons */}
          {isEditing && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-white/30 bg-transparent"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button className="flex-1 bg-white text-black hover:bg-white/90" onClick={saveChanges}>
                <Check className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

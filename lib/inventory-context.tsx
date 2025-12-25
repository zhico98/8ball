"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface InventoryItem {
  id: string
  name: string
  type: "cue" | "table" | "effect"
  rarity: "common" | "rare" | "legendary"
  image?: string
}

interface InventoryContextType {
  items: InventoryItem[]
  addItem: (item: InventoryItem) => void
  removeItem: (id: string) => void
}

const InventoryContext = createContext<InventoryContextType | null>(null)

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedInventory = localStorage.getItem("billiards_inventory")
      if (savedInventory) {
        try {
          setItems(JSON.parse(savedInventory))
        } catch (error) {
          console.error("Failed to load inventory:", error)
        }
      }
      setIsLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      localStorage.setItem("billiards_inventory", JSON.stringify(items))
    }
  }, [items, isLoaded])

  const addItem = (item: InventoryItem) => {
    setItems((prev) => [...prev, item])
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  return <InventoryContext.Provider value={{ items, addItem, removeItem }}>{children}</InventoryContext.Provider>
}

export function useInventory() {
  const context = useContext(InventoryContext)
  if (!context) {
    throw new Error("useInventory must be used within an InventoryProvider")
  }
  return context
}

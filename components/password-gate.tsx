"use client"

import type React from "react"

import { useState, useEffect } from "react"

const CORRECT_PASSWORD = "bilardofun1999!"

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [showCursor, setShowCursor] = useState(true)
  const [error, setError] = useState(false)

  // Check if already authenticated
  useEffect(() => {
    const auth = sessionStorage.getItem("site_auth")
    if (auth === "true") {
      setIsAuthenticated(true)
    }
  }, [])

  // Blinking cursor effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 530)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === CORRECT_PASSWORD) {
      sessionStorage.setItem("site_auth", "true")
      setIsAuthenticated(true)
      setError(false)
    } else {
      setError(true)
      setPassword("")
      setTimeout(() => setError(false), 2000)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    setError(false)
  }

  if (isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center font-mono">
      <div className="px-4">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-white">password :</span>
            <div className="flex items-center">
              {/* Show asterisks for typed characters */}
              {password.split("").map((_, i) => (
                <span key={i} className="text-white">
                  *
                </span>
              ))}
              {/* Blinking cursor */}
              <span
                className={`inline-block w-1.5 h-3 bg-white ml-0.5 transition-opacity duration-100 ${
                  showCursor ? "opacity-100" : "opacity-0"
                }`}
              />
            </div>
          </div>

          {/* Hidden input that captures the actual typing */}
          <input
            type="text"
            value={password}
            onChange={handleChange}
            autoFocus
            autoComplete="off"
            className="absolute opacity-0 pointer-events-none"
          />

          {error && <div className="text-red-500 text-xs mt-2 animate-pulse">access denied</div>}
        </form>
      </div>
    </div>
  )
}

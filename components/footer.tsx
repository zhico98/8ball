import { Twitter } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30 py-8">
      <div className="flex flex-col items-center gap-4">
        <span className="text-lg font-bold text-foreground">
          bilardo<span className="text-white/60">.fun</span>
        </span>

        {/* Social Links */}
        <div className="flex items-center gap-4">
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            <Twitter className="w-5 h-5" />
          </a>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center max-w-md">
          bilardo.fun is a skill-based gaming platform. Play responsibly. © 2025
        </p>
      </div>
    </footer>
  )
}

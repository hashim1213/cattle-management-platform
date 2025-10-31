"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Beef, Sprout, MapPin, DollarSign, FileText, Settings, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Cattle", href: "/cattle", icon: Beef },
  { name: "Feed Inventory", href: "/feed", icon: Sprout },
  { name: "Pastures", href: "/pastures", icon: MapPin },
  { name: "Financial", href: "/costs", icon: DollarSign },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="relative h-10 w-10 rounded-lg bg-sidebar-accent p-1.5">
          <Image src="/images/cow.png" alt="CattleOS Logo" fill className="object-contain" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-sidebar-foreground">CattleOS</h1>
          <p className="text-xs text-sidebar-foreground/70">Ranch Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
      </div>
    </div>
  )
}

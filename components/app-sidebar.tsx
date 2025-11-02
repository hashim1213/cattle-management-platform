"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Home, Beef, Sprout, MapPin, DollarSign, FileText, Settings, TrendingUp, Menu, X, Building2, Calendar, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Cattle", href: "/cattle", icon: Beef },
  { name: "Pens", href: "/pens", icon: Building2 },
  { name: "Tasks", href: "/tasks", icon: Calendar },
  { name: "Activities", href: "/activities", icon: Activity },
  { name: "Feed Inventory", href: "/feed", icon: Sprout },
  { name: "Pastures", href: "/pastures", icon: MapPin },
  { name: "Financial", href: "/costs", icon: DollarSign },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
]

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname()

  return (
    <>
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
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onLinkClick}
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
          onClick={onLinkClick}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
      </div>
    </>
  )
}

export function AppSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-sidebar-border z-50 flex items-center px-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="ghost" className="text-sidebar-foreground">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-sidebar">
            <div className="flex h-full flex-col">
              <SidebarContent onLinkClick={() => setMobileOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
        <div className="ml-3 flex items-center gap-2">
          <div className="relative h-8 w-8 rounded-lg bg-sidebar-accent p-1">
            <Image src="/images/cow.png" alt="CattleOS Logo" fill className="object-contain" />
          </div>
          <h1 className="text-lg font-bold text-sidebar-foreground">CattleOS</h1>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
        <SidebarContent />
      </div>
    </>
  )
}

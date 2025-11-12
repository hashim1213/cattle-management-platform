"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Home, Beef, Sprout, MapPin, DollarSign, FileText, TrendingUp, Menu, X, Building2, Calendar, Activity, Package, Users, Calculator, Cookie, Heart, BarChart3, Settings, Package2, Warehouse, LogOut, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { UserSwitcher } from "@/components/user-switcher"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { useAuth } from "@/contexts/auth-context"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Cattle", href: "/cattle", icon: Beef },
  { name: "Pens & Barns", href: "/pens", icon: Warehouse },
  { name: "Farm Assistant", href: "/agent", icon: MessageSquare },
  { name: "Inventory", href: "/inventory", icon: Package2 },
  { name: "Financial", href: "/costs", icon: DollarSign },
]

const adminNavigation = []

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname()
  const { logout, user } = useAuth()

  const handleLogout = async () => {
    await logout()
    if (onLinkClick) onLinkClick()
  }

  return (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="relative h-10 w-10">
          <Image src="/images/logo.png" alt="CattleOS Logo" fill className="object-contain" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-sidebar-foreground">CattleOS</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 text-sm font-medium transition-all touch-manipulation",
                "py-3 lg:py-3 min-h-[48px]", // Minimum 48px touch target for mobile
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.name}
            </Link>
          )
        })}

        {/* Admin Section - Hidden when empty */}
        {adminNavigation.length > 0 && (
          <div className="pt-4 mt-4 border-t border-sidebar-border">
            <p className="px-4 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
              Admin
            </p>
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onLinkClick}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4 space-y-2">
        <UserSwitcher />
        <Link
          href="/settings"
          onClick={onLinkClick}
          className="flex items-center gap-3 rounded-xl px-4 py-3 min-h-[48px] text-sm font-medium text-sidebar-foreground/70 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent touch-manipulation"
        >
          <Settings className="h-5 w-5 shrink-0" />
          Settings
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-xl px-4 py-3 min-h-[48px] text-sm font-medium text-sidebar-foreground/70 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent touch-manipulation"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Logout
        </button>
      </div>
    </>
  )
}

export function AppSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile Top Bar - with iOS safe area support */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-sidebar-border z-50 flex items-center px-4 backdrop-blur-md bg-sidebar/95 pt-safe">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="text-sidebar-foreground h-11 w-11 touch-manipulation active:bg-sidebar-accent"
              aria-label="Open navigation menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[85vw] max-w-[320px] bg-sidebar safe-left border-r-0">
            <VisuallyHidden>
              <SheetTitle>Navigation Menu</SheetTitle>
            </VisuallyHidden>
            <div className="flex h-full flex-col pb-safe pt-safe">
              <SidebarContent onLinkClick={() => setMobileOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
        <div className="ml-3 flex items-center gap-2 flex-1">
          <div className="relative h-8 w-8 flex-shrink-0">
            <Image src="/images/logo.png" alt="CattleOS Logo" fill className="object-contain" />
          </div>
          <h1 className="text-base sm:text-lg font-bold text-sidebar-foreground truncate">CattleOS</h1>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
        <SidebarContent />
      </div>
    </>
  )
}

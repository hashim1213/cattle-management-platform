"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Beef, Grid3x3, Activity, Settings, Plus, Menu } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: Grid3x3 },
  { href: "/cattle", label: "Cattle", icon: Beef },
  { href: "/health", label: "Health", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav
        className={cn(
          "md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border transition-transform duration-300 safe-area-inset-bottom backdrop-blur-md bg-card/95",
          isVisible ? "translate-y-0" : "translate-y-full"
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-4 gap-1 px-2 py-2.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all min-h-[64px] touch-manipulation active:scale-95",
                  isActive
                    ? "text-primary bg-primary/15 shadow-sm"
                    : "text-muted-foreground active:bg-muted/80"
                )}
              >
                <Icon className="h-6 w-6 mb-1.5 flex-shrink-0" />
                <span className="text-xs font-medium leading-tight">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Floating Action Button (FAB) */}
      <button
        className="md:hidden fixed bottom-24 right-4 z-50 w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center transition-all active:scale-90 touch-manipulation hover:shadow-xl"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        onClick={() => {
          // Quick action menu
          document.dispatchEvent(new CustomEvent('show-quick-actions'))
        }}
        aria-label="Quick actions"
      >
        <Plus className="h-7 w-7" />
      </button>

      {/* Spacer to prevent content from being hidden behind nav */}
      <div className="md:hidden h-16" style={{ height: 'calc(4rem + env(safe-area-inset-bottom))' }} />

      <style jsx global>{`
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .safe-area-inset-bottom {
            padding-bottom: env(safe-area-inset-bottom);
          }
        }
      `}</style>
    </>
  )
}

// Quick Actions Sheet
export function QuickActions() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handler = () => setIsOpen(true)
    document.addEventListener('show-quick-actions', handler)
    return () => document.removeEventListener('show-quick-actions', handler)
  }, [])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 md:hidden"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-6" />
        <h3 className="text-xl font-semibold mb-5 text-foreground">Quick Actions</h3>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <Link
            href="/cattle?action=add"
            className="flex flex-col items-center p-5 bg-primary/10 rounded-2xl touch-manipulation active:scale-95 transition-transform min-h-[100px] justify-center"
            onClick={() => setIsOpen(false)}
          >
            <Beef className="h-7 w-7 text-primary mb-2 flex-shrink-0" />
            <span className="text-sm font-medium text-center leading-tight">Add Cattle</span>
          </Link>

          <button
            className="flex flex-col items-center p-5 bg-red-50 dark:bg-red-950/20 rounded-2xl touch-manipulation active:scale-95 transition-transform min-h-[100px] justify-center"
            onClick={() => {
              setIsOpen(false)
              document.dispatchEvent(new CustomEvent('record-health-event'))
            }}
          >
            <Activity className="h-7 w-7 text-red-600 mb-2 flex-shrink-0" />
            <span className="text-sm font-medium text-center leading-tight">Health Event</span>
          </button>

          <button
            className="flex flex-col items-center p-5 bg-blue-50 dark:bg-blue-950/20 rounded-2xl touch-manipulation active:scale-95 transition-transform min-h-[100px] justify-center"
            onClick={() => {
              setIsOpen(false)
              document.dispatchEvent(new CustomEvent('record-movement'))
            }}
          >
            <Menu className="h-7 w-7 text-blue-600 mb-2 flex-shrink-0" />
            <span className="text-sm font-medium text-center leading-tight">Movement</span>
          </button>
        </div>

        <button
          className="w-full py-4 text-center text-muted-foreground font-medium rounded-xl hover:bg-muted/50 active:bg-muted touch-manipulation transition-colors"
          onClick={() => setIsOpen(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

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
          "md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 transition-transform duration-300 safe-area-inset-bottom",
          isVisible ? "translate-y-0" : "translate-y-full"
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-h-[60px]",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-6 w-6 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Floating Action Button (FAB) */}
      <button
        className="md:hidden fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-transform active:scale-95"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        onClick={() => {
          // Quick action menu
          document.dispatchEvent(new CustomEvent('show-quick-actions'))
        }}
      >
        <Plus className="h-6 w-6" />
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
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <Link
            href="/cattle?action=add"
            className="flex flex-col items-center p-4 bg-primary/10 rounded-lg"
            onClick={() => setIsOpen(false)}
          >
            <Beef className="h-6 w-6 text-primary mb-2" />
            <span className="text-sm font-medium">Add Cattle</span>
          </Link>

          <button
            className="flex flex-col items-center p-4 bg-red-50 rounded-lg"
            onClick={() => {
              setIsOpen(false)
              document.dispatchEvent(new CustomEvent('record-health-event'))
            }}
          >
            <Activity className="h-6 w-6 text-red-600 mb-2" />
            <span className="text-sm font-medium">Health Event</span>
          </button>

          <button
            className="flex flex-col items-center p-4 bg-blue-50 rounded-lg"
            onClick={() => {
              setIsOpen(false)
              document.dispatchEvent(new CustomEvent('record-movement'))
            }}
          >
            <Menu className="h-6 w-6 text-blue-600 mb-2" />
            <span className="text-sm font-medium">Movement</span>
          </button>
        </div>

        <button
          className="w-full py-3 text-center text-muted-foreground"
          onClick={() => setIsOpen(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

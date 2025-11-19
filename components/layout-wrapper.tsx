"use client"

import { useAuth } from "@/contexts/auth-context"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { Loader2 } from "lucide-react"

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/", "/login", "/signup"]

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

  useEffect(() => {
    if (!loading) {
      // Redirect to login if not authenticated and trying to access protected route
      if (!user && !isPublicRoute) {
        router.push("/login")
      }
      // Redirect to dashboard if authenticated and trying to access login/signup pages
      if (user && (pathname === "/login" || pathname === "/signup")) {
        router.push("/")
      }
    }
  }, [user, loading, isPublicRoute, pathname, router])

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // For public routes (login/signup), show without sidebar
  if (isPublicRoute) {
    return <>{children}</>
  }

  // For protected routes, show with sidebar if authenticated
  if (user) {
    return (
      <div className="flex h-screen overflow-hidden safe-top safe-bottom">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto pt-14 lg:pt-0 pb-safe">{children}</main>
      </div>
    )
  }

  // Fallback (should not reach here due to useEffect redirect)
  return null
}

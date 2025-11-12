"use client"

import { useState, useEffect } from "react"
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { syncManager } from "@/lib/sync-manager"

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'failed'>('idle')
  const [pendingCount, setPendingCount] = useState(0)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Initialize
    setIsOnline(syncManager.getOnlineStatus())

    // Subscribe to sync status changes
    const unsubscribe = syncManager.onSyncStatusChange((status) => {
      switch (status) {
        case 'online':
          setIsOnline(true)
          setShowBanner(true)
          setTimeout(() => setShowBanner(false), 3000)
          break
        case 'offline':
          setIsOnline(false)
          setShowBanner(true)
          break
        case 'syncing':
          setSyncStatus('syncing')
          break
        case 'synced':
          setSyncStatus('synced')
          setTimeout(() => setSyncStatus('idle'), 2000)
          break
        case 'sync-failed':
          setSyncStatus('failed')
          break
      }
    })

    return unsubscribe
  }, [])

  // Only show if offline or syncing
  if (!showBanner && isOnline && syncStatus === 'idle') {
    return null
  }

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: CloudOff,
        text: "Working Offline",
        subtext: pendingCount > 0 ? `${pendingCount} changes pending` : "Changes will sync when online",
        color: "bg-amber-500"
      }
    }

    switch (syncStatus) {
      case 'syncing':
        return {
          icon: RefreshCw,
          text: "Syncing...",
          subtext: "Uploading changes",
          color: "bg-blue-500",
          animate: true
        }
      case 'synced':
        return {
          icon: Check,
          text: "All Synced",
          subtext: "All changes saved",
          color: "bg-green-500"
        }
      case 'failed':
        return {
          icon: AlertCircle,
          text: "Sync Failed",
          subtext: "Will retry automatically",
          color: "bg-red-500"
        }
      default:
        return {
          icon: Cloud,
          text: "Online",
          subtext: "Connected",
          color: "bg-green-500"
        }
    }
  }

  const statusInfo = getStatusInfo()
  const Icon = statusInfo.icon

  return (
    <>
      {/* Mobile Banner */}
      <div
        className={cn(
          "md:hidden fixed top-0 left-0 right-0 z-40 transition-transform duration-300",
          showBanner || !isOnline || syncStatus !== 'idle' ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className={cn("px-4 py-2 text-white text-sm flex items-center gap-2", statusInfo.color)}>
          <Icon className={cn("h-4 w-4", statusInfo.animate && "animate-spin")} />
          <div className="flex-1">
            <div className="font-medium">{statusInfo.text}</div>
            <div className="text-xs opacity-90">{statusInfo.subtext}</div>
          </div>
          {showBanner && (
            <button
              onClick={() => setShowBanner(false)}
              className="text-white/80 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Desktop Indicator (top-right corner) */}
      <div className="hidden md:block fixed top-4 right-4 z-40">
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-full text-white text-sm shadow-lg transition-all duration-300",
            statusInfo.color,
            showBanner || !isOnline || syncStatus !== 'idle' ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
          )}
        >
          <Icon className={cn("h-4 w-4", statusInfo.animate && "animate-spin")} />
          <span className="font-medium">{statusInfo.text}</span>
        </div>
      </div>

      {/* Persistent offline dot (subtle indicator) */}
      {!isOnline && (
        <div className="fixed top-4 right-4 z-40 w-3 h-3 bg-amber-500 rounded-full animate-pulse md:hidden" />
      )}
    </>
  )
}

// Hook to use offline status in components
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(syncManager.getOnlineStatus())

    const unsubscribe = syncManager.onSyncStatusChange((status) => {
      setIsOnline(status === 'online' || status === 'syncing' || status === 'synced')
    })

    return unsubscribe
  }, [])

  return { isOnline }
}

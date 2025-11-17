"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wheat, AlertTriangle, DollarSign, Package } from "lucide-react"
import { inventoryService } from "@/lib/inventory/inventory-service"
import { isFeedCategory, type InventoryItem } from "@/lib/inventory/inventory-types"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

interface FeedInventoryMetrics {
  totalFeedItems: number
  totalFeedValue: number
  totalFeedWeight: number
  lowStockCount: number
}

export function FeedMetricsCard() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<FeedInventoryMetrics>({
    totalFeedItems: 0,
    totalFeedValue: 0,
    totalFeedWeight: 0,
    lowStockCount: 0,
  })
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (user?.uid && !isInitialized) {
      inventoryService.initialize(user.uid).then(() => {
        setIsInitialized(true)
        loadMetrics()
      })
    }

    return () => {
      if (user?.uid && isInitialized) {
        inventoryService.cleanup()
        setIsInitialized(false)
      }
    }
  }, [user?.uid])

  useEffect(() => {
    if (!isInitialized) return

    loadMetrics()
    const unsubscribe = inventoryService.subscribe(loadMetrics)
    return () => unsubscribe()
  }, [isInitialized])

  const loadMetrics = () => {
    const inventory = inventoryService.getInventory()
    const feedItems = inventory.filter((item: InventoryItem) => isFeedCategory(item.category))

    const totalFeedValue = feedItems.reduce((sum: number, item: InventoryItem) => sum + item.totalValue, 0)
    const totalFeedWeight = feedItems.reduce((sum: number, item: InventoryItem) => {
      // Convert to pounds for consistency
      let weightInLbs = item.quantityOnHand
      if (item.unit === "tons") {
        weightInLbs = item.quantityOnHand * 2000
      } else if (item.unit === "kg") {
        weightInLbs = item.quantityOnHand * 2.20462
      } else if (item.unit !== "lbs") {
        // For other units (bales, bags, etc), don't include in weight
        return sum
      }
      return sum + weightInLbs
    }, 0)
    const lowStockCount = feedItems.filter(
      (item: InventoryItem) => item.quantityOnHand <= item.reorderPoint
    ).length

    setMetrics({
      totalFeedItems: feedItems.length,
      totalFeedValue,
      totalFeedWeight,
      lowStockCount,
    })
  }

  return (
    <Link href="/inventory?filter=feed" className="block">
      <Card className="cursor-pointer hover:bg-muted/50 transition-colors h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Wheat className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Feed Inventory</CardTitle>
          </div>
          <CardDescription>Current feed stock levels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Package className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-xs">Feed Items</span>
              </div>
              <p className="text-2xl font-bold">{metrics.totalFeedItems}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-xs">Total Value</span>
              </div>
              <p className="text-2xl font-bold">
                ${metrics.totalFeedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Wheat className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-xs">Total Weight</span>
              </div>
              <p className="text-2xl font-bold">
                {(metrics.totalFeedWeight / 2000).toFixed(1)}
                <span className="text-sm text-muted-foreground ml-1">tons</span>
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-xs">Low Stock</span>
              </div>
              <p className={`text-2xl font-bold ${metrics.lowStockCount > 0 ? "text-orange-600" : ""}`}>
                {metrics.lowStockCount}
              </p>
            </div>
          </div>

          {metrics.totalFeedItems === 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No feed items in inventory
            </div>
          )}

          {metrics.lowStockCount > 0 && (
            <div className="text-xs text-orange-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {metrics.lowStockCount} {metrics.lowStockCount === 1 ? "item needs" : "items need"} reordering
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Wheat, AlertCircle, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { firebaseInventoryService } from "@/lib/inventory/inventory-service-firebase"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { useActivityStore } from "@/hooks/use-activity-store"
import type { InventoryItem } from "@/lib/inventory/inventory-types"
import { isFeedCategory } from "@/lib/inventory/inventory-types"

interface QuickFeedPanelProps {
  penId: string
  penName: string
  cattleCount: number
}

export function QuickFeedPanel({ penId, penName, cattleCount }: QuickFeedPanelProps) {
  const { user } = useAuth()
  const { log } = useActivityStore()
  const [feedInventory, setFeedInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isCustomFeedOpen, setIsCustomFeedOpen] = useState(false)

  // Custom feed form
  const [selectedFeedId, setSelectedFeedId] = useState("")
  const [feedAmount, setFeedAmount] = useState("")
  const [feedNotes, setFeedNotes] = useState("")

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    let unsubscribe: (() => void) | undefined

    const loadFeedInventory = async () => {
      try {
        setLoading(true)
        await firebaseInventoryService.initialize(user.uid)

        // Subscribe to inventory changes
        unsubscribe = firebaseInventoryService.subscribe(() => {
          const allInventory = firebaseInventoryService.getAllItems()
          // Filter for feed items only
          const feedItems = allInventory.filter(item => isFeedCategory(item.category))
          setFeedInventory(feedItems)
        })

        // Initial load
        const allInventory = firebaseInventoryService.getAllItems()
        const feedItems = allInventory.filter(item => isFeedCategory(item.category))
        setFeedInventory(feedItems)
      } catch (error) {
        console.error("Failed to load feed inventory:", error)
        toast.error("Failed to load feed inventory")
      } finally {
        setLoading(false)
      }
    }

    loadFeedInventory()

    // Return cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [user])

  const handleQuickFeed = async (feedItem: InventoryItem, amount: number) => {
    if (!user || cattleCount === 0) return

    try {
      // Check availability
      const availability = await firebaseInventoryService.checkAvailability(feedItem.id, amount)

      if (!availability.available) {
        toast.error(
          `Insufficient inventory: Need ${amount} ${feedItem.unit}, have ${availability.currentQuantity} ${feedItem.unit}`
        )
        return
      }

      // Deduct from inventory
      await firebaseInventoryService.deduct({
        itemId: feedItem.id,
        quantity: amount,
        reason: `Fed to ${penName} (${cattleCount} head)`,
        performedBy: user.email || "User",
        relatedRecordType: "feed_allocation",
        notes: `Quick feed: ${amount} ${feedItem.unit} of ${feedItem.name}`
      })

      // Log activity
      log({
        type: "feeding",
        entityType: "pen",
        entityId: penId,
        entityName: penName,
        title: `Fed ${feedItem.name}`,
        description: `${amount} ${feedItem.unit} fed to ${cattleCount} head of cattle`,
        performedBy: user.email || "User"
      })

      toast.success(`Fed ${amount} ${feedItem.unit} of ${feedItem.name} to pen ${penName}`)
    } catch (error: any) {
      console.error("Failed to record feeding:", error)
      toast.error(error.message || "Failed to record feeding")
    }
  }

  const handleCustomFeed = async () => {
    if (!selectedFeedId || !feedAmount || !user) {
      toast.error("Please select feed and enter amount")
      return
    }

    const feedItem = feedInventory.find(f => f.id === selectedFeedId)
    if (!feedItem) return

    const amount = parseFloat(feedAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    try {
      // Check availability
      const availability = await firebaseInventoryService.checkAvailability(feedItem.id, amount)

      if (!availability.available) {
        toast.error(
          `Insufficient inventory: Need ${amount} ${feedItem.unit}, have ${availability.currentQuantity} ${feedItem.unit}`
        )
        return
      }

      // Deduct from inventory
      await firebaseInventoryService.deduct({
        itemId: feedItem.id,
        quantity: amount,
        reason: `Fed to ${penName} (${cattleCount} head)`,
        performedBy: user.email || "User",
        relatedRecordType: "feed_allocation",
        notes: feedNotes || `Custom feed: ${amount} ${feedItem.unit} of ${feedItem.name}`
      })

      // Log activity
      log({
        type: "feeding",
        entityType: "pen",
        entityId: penId,
        entityName: penName,
        title: `Fed ${feedItem.name}`,
        description: `${amount} ${feedItem.unit} fed to ${cattleCount} head of cattle${feedNotes ? ` - ${feedNotes}` : ''}`,
        performedBy: user.email || "User"
      })

      toast.success(`Fed ${amount} ${feedItem.unit} of ${feedItem.name} to pen ${penName}`)

      // Reset form
      setSelectedFeedId("")
      setFeedAmount("")
      setFeedNotes("")
      setIsCustomFeedOpen(false)
    } catch (error: any) {
      console.error("Failed to record feeding:", error)
      toast.error(error.message || "Failed to record feeding")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wheat className="h-5 w-5" />
            Quick Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading feed inventory...</p>
        </CardContent>
      </Card>
    )
  }

  const topFeeds = feedInventory
    .filter(f => f.quantityOnHand > 0)
    .sort((a, b) => b.quantityOnHand - a.quantityOnHand)
    .slice(0, 4)

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wheat className="h-5 w-5" />
              Quick Feed
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCustomFeedOpen(true)}
              disabled={cattleCount === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Custom
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {cattleCount === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>No cattle in this pen. Add cattle before feeding.</span>
            </div>
          ) : feedInventory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wheat className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No feed in inventory</p>
              <p className="text-xs mt-1">Add feed to inventory to use quick feed buttons</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {topFeeds.map((feed) => {
                // Calculate suggested amount per head (you can adjust this logic)
                const suggestedPerHead = feed.unit === "lbs" ? 20 : feed.unit === "tons" ? 0.01 : 1
                const totalSuggested = Math.ceil(suggestedPerHead * cattleCount)

                return (
                  <Card key={feed.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-sm truncate">{feed.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {feed.quantityOnHand} {feed.unit} available
                          </p>
                        </div>

                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleQuickFeed(feed, totalSuggested)}
                          disabled={feed.quantityOnHand < totalSuggested}
                        >
                          Feed {totalSuggested} {feed.unit}
                        </Button>

                        {feed.quantityOnHand < totalSuggested && (
                          <Badge variant="destructive" className="text-xs w-full justify-center">
                            Low Stock
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {feedInventory.length > 0 && feedInventory.filter(f => f.quantityOnHand <= f.reorderPoint).length > 0 && (
            <div className="mt-4 flex items-start gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-900">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Low Stock Alert</p>
                <p className="text-xs mt-1">
                  {feedInventory.filter(f => f.quantityOnHand <= f.reorderPoint).length} feed item(s) below reorder point
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Feed Dialog */}
      <Dialog open={isCustomFeedOpen} onOpenChange={setIsCustomFeedOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Custom Feed Amount</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Feed</Label>
              <Select value={selectedFeedId} onValueChange={setSelectedFeedId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose feed type" />
                </SelectTrigger>
                <SelectContent>
                  {feedInventory.map((feed) => (
                    <SelectItem key={feed.id} value={feed.id}>
                      {feed.name} ({feed.quantityOnHand} {feed.unit} available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedFeedId && (
              <div className="space-y-2">
                <Label>Amount ({feedInventory.find(f => f.id === selectedFeedId)?.unit})</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Enter amount"
                  value={feedAmount}
                  onChange={(e) => setFeedAmount(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Input
                placeholder="Any additional notes..."
                value={feedNotes}
                onChange={(e) => setFeedNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsCustomFeedOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCustomFeed} disabled={!selectedFeedId || !feedAmount}>
                <Wheat className="h-4 w-4 mr-2" />
                Record Feed
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

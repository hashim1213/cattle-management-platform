"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, AlertCircle, Package, Utensils } from "lucide-react"
import { firebaseInventoryService } from "@/lib/inventory/inventory-service-firebase"
import { firebasePenStore } from "@/lib/pen-store-firebase"
import { useEnhancedFeedStore } from "@/hooks/use-enhanced-feed-store"
import { usePenStore } from "@/hooks/use-pen-store"
import { useActivityStore } from "@/hooks/use-activity-store"
import type { InventoryItem } from "@/lib/inventory/inventory-types"
import type { Pen } from "@/lib/pen-store-firebase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { isFeedCategory } from "@/lib/inventory/inventory-types"

interface QuickAddFeedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickAddFeedDialog({
  open,
  onOpenChange,
}: QuickAddFeedDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const { addFeedAllocation } = useEnhancedFeedStore()
  const { pens, barns } = usePenStore()
  const { log } = useActivityStore()
  const [feedItems, setFeedItems] = useState<InventoryItem[]>([])

  const [selectedPenId, setSelectedPenId] = useState("")
  const [selectedFeedId, setSelectedFeedId] = useState("")
  const [quantity, setQuantity] = useState("")

  // Load feed items from inventory
  useEffect(() => {
    if (open) {
      const inventory = firebaseInventoryService.getInventory()
      const feeds = inventory.filter(item => isFeedCategory(item.category))
      setFeedItems(feeds)
    }
  }, [open])

  // Get selected items
  const selectedPen = useMemo(() =>
    pens.find(p => p.id === selectedPenId),
    [pens, selectedPenId]
  )

  const selectedFeed = useMemo(() =>
    feedItems.find(f => f.id === selectedFeedId),
    [feedItems, selectedFeedId]
  )

  const selectedBarn = useMemo(() =>
    selectedPen ? barns.find(b => b.id === selectedPen.barnId) : null,
    [selectedPen, barns]
  )

  // Calculate values
  const calculations = useMemo(() => {
    if (!selectedFeed || !quantity) {
      return {
        totalCost: 0,
        costPerHead: 0,
        sufficientInventory: true
      }
    }

    const qty = parseFloat(quantity)
    const totalCost = qty * selectedFeed.costPerUnit
    const costPerHead = selectedPen && selectedPen.currentCount > 0
      ? totalCost / selectedPen.currentCount
      : 0
    const sufficientInventory = selectedFeed.quantityOnHand >= qty

    return {
      totalCost,
      costPerHead,
      sufficientInventory
    }
  }, [selectedFeed, quantity, selectedPen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPen || !selectedFeed) {
      toast({
        title: "Validation Error",
        description: "Please select both a pen and feed item",
        variant: "destructive",
      })
      return
    }

    const qty = parseFloat(quantity)

    if (isNaN(qty) || qty <= 0) {
      toast({
        title: "Validation Error",
        description: "Quantity must be a positive number",
        variant: "destructive",
      })
      return
    }

    if (!calculations.sufficientInventory) {
      toast({
        title: "Insufficient Inventory",
        description: `Need ${qty}${selectedFeed.unit} but only ${selectedFeed.quantityOnHand}${selectedFeed.unit} available`,
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Deduct feed from Firebase inventory
      await firebaseInventoryService.deduct({
        itemId: selectedFeed.id,
        quantity: qty,
        reason: `Feed delivered to ${selectedPen.name}`,
        performedBy: "Quick Add",
        relatedRecordType: "feed_allocation",
        relatedRecordId: `allocation_${Date.now()}`,
        notes: `${qty} ${selectedFeed.unit} ${selectedFeed.name} to ${selectedPen.name} (${selectedPen.currentCount} head)`
      })

      // Add feed allocation
      addFeedAllocation({
        penId: selectedPen.id,
        penName: selectedPen.name,
        barnId: selectedBarn?.id,
        barnName: selectedBarn?.name,
        date: new Date().toISOString().split("T")[0],
        feedItems: [{
          feedId: selectedFeed.id,
          feedName: selectedFeed.name,
          quantity: qty,
          unit: selectedFeed.unit,
          costPerUnit: selectedFeed.costPerUnit,
          totalCost: calculations.totalCost,
        }],
        totalBatchWeight: qty,
        headCount: selectedPen.currentCount,
        costPerHead: calculations.costPerHead,
        deliveredBy: "Quick Add",
      })

      // Log activity
      log({
        type: "feeding",
        entityType: "pen",
        entityId: selectedPen.id,
        entityName: selectedPen.name,
        title: `Feed delivered to ${selectedPen.name}`,
        description: `${qty} ${selectedFeed.unit} ${selectedFeed.name}. Cost: $${calculations.totalCost.toFixed(2)}`,
        performedBy: "Quick Add",
      })

      toast({
        title: "Feed Added",
        description: `${qty} ${selectedFeed.unit} of ${selectedFeed.name} added to ${selectedPen.name}`,
      })

      // Reset form
      setSelectedPenId("")
      setSelectedFeedId("")
      setQuantity("")

      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to add feed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              Quick Add Feed
            </DialogTitle>
            <DialogDescription>
              Quickly add feed to a pen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pen">Select Pen *</Label>
              <Select value={selectedPenId} onValueChange={setSelectedPenId} required>
                <SelectTrigger id="pen">
                  <SelectValue placeholder="Choose a pen" />
                </SelectTrigger>
                <SelectContent>
                  {pens.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No pens available
                    </SelectItem>
                  ) : (
                    pens.map((pen) => {
                      const barn = barns.find(b => b.id === pen.barnId)
                      return (
                        <SelectItem key={pen.id} value={pen.id}>
                          {pen.name} ({barn?.name || 'N/A'}) - {pen.currentCount} head
                        </SelectItem>
                      )
                    })
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feed">Select Feed *</Label>
              <Select value={selectedFeedId} onValueChange={setSelectedFeedId} required>
                <SelectTrigger id="feed">
                  <SelectValue placeholder="Choose feed from inventory" />
                </SelectTrigger>
                <SelectContent>
                  {feedItems.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No feed in inventory
                    </SelectItem>
                  ) : (
                    feedItems.map((feed) => (
                      <SelectItem key={feed.id} value={feed.id}>
                        {feed.name} - {feed.quantityOnHand}{feed.unit} available
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedFeed && (
                <div className="text-xs text-muted-foreground space-y-1 p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Package className="h-3 w-3" />
                    Available: {selectedFeed.quantityOnHand}{selectedFeed.unit}
                  </div>
                  <div>Cost: ${selectedFeed.costPerUnit.toFixed(2)}/{selectedFeed.unit}</div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Amount ({selectedFeed?.unit || 'unit'}) *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0"
                placeholder="100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            {!calculations.sufficientInventory && selectedFeed && quantity && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Insufficient inventory! Need {parseFloat(quantity).toFixed(1)}{selectedFeed.unit} but only {selectedFeed.quantityOnHand.toFixed(1)}{selectedFeed.unit} available.
                </AlertDescription>
              </Alert>
            )}

            {selectedPen && selectedFeed && quantity && calculations.sufficientInventory && (
              <div className="p-3 bg-primary/10 rounded-lg space-y-1">
                <p className="text-sm font-medium">Summary:</p>
                <p className="text-sm">
                  Total cost: <strong>${calculations.totalCost.toFixed(2)}</strong>
                </p>
                {selectedPen.currentCount > 0 && (
                  <p className="text-sm">
                    Cost per head: <strong>${calculations.costPerHead.toFixed(2)}</strong>
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !selectedPenId ||
                !selectedFeedId ||
                !calculations.sufficientInventory
              }
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Feed"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

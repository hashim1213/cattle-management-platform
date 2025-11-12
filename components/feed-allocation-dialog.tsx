"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useEnhancedFeedStore } from "@/hooks/use-enhanced-feed-store"
import { usePenStore } from "@/hooks/use-pen-store"
import { useActivityStore } from "@/hooks/use-activity-store"
import { useToast } from "@/hooks/use-toast"
import { dataStore } from "@/lib/data-store-firebase"
import { Wheat, Plus, Trash2, DollarSign, Users, Scale } from "lucide-react"

interface FeedAllocationDialogProps {
  penId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FeedItem {
  feedId: string
  feedName: string
  quantity: number
  unit: string
  costPerUnit: number
  totalCost: number
}

export function FeedAllocationDialog({ penId, open, onOpenChange }: FeedAllocationDialogProps) {
  const { inventory, addFeedAllocation } = useEnhancedFeedStore()
  const { pens, getPen, barns } = usePenStore()
  const { log } = useActivityStore()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    penId: penId || "",
    date: new Date().toISOString().split("T")[0],
    deliveredBy: "Owner",
    notes: "",
    mixerScaleWeight: "",
    scaleConnected: false,
  })

  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [newFeedId, setNewFeedId] = useState("")
  const [newFeedQuantity, setNewFeedQuantity] = useState("")

  const selectedPen = formData.penId ? getPen(formData.penId) : null
  const selectedBarn = selectedPen ? barns.find((b) => b.id === selectedPen.barnId) : null
  const headCount = selectedPen
    ? dataStore.getCattle().filter((c) => c.penId === formData.penId && c.status === "Active").length
    : 0

  const totalBatchWeight = feedItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalCost = feedItems.reduce((sum, item) => sum + item.totalCost, 0)
  const costPerHead = headCount > 0 ? totalCost / headCount : 0

  const handleAddFeedItem = () => {
    if (!newFeedId || !newFeedQuantity) return

    const selectedFeed = inventory.find((f) => f.id === newFeedId)
    if (!selectedFeed) return

    const quantity = parseFloat(newFeedQuantity)
    if (quantity <= 0 || quantity > selectedFeed.quantityOnHand) {
      toast({
        title: "Invalid quantity",
        description: `Available: ${selectedFeed.quantityOnHand} ${selectedFeed.unit}`,
        variant: "destructive",
      })
      return
    }

    const newItem: FeedItem = {
      feedId: selectedFeed.id,
      feedName: selectedFeed.name,
      quantity,
      unit: selectedFeed.unit,
      costPerUnit: selectedFeed.costPerUnit,
      totalCost: quantity * selectedFeed.costPerUnit,
    }

    setFeedItems([...feedItems, newItem])
    setNewFeedId("")
    setNewFeedQuantity("")
  }

  const handleRemoveFeedItem = (index: number) => {
    setFeedItems(feedItems.filter((_, i) => i !== index))
  }

  const handleConnectScale = () => {
    // Simulated Bluetooth scale connection
    // In production, this would use Web Bluetooth API
    setFormData({ ...formData, scaleConnected: true })
    toast({
      title: "Scale connected",
      description: "Mixer scale connected via Bluetooth",
    })

    // Simulate getting weight from scale
    setTimeout(() => {
      const simulatedWeight = Math.floor(totalBatchWeight * (0.95 + Math.random() * 0.1))
      setFormData({ ...formData, mixerScaleWeight: simulatedWeight.toString(), scaleConnected: true })
    }, 1000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPen || feedItems.length === 0) {
      toast({
        title: "Error",
        description: "Please select a pen and add at least one feed item",
        variant: "destructive",
      })
      return
    }

    const actualWeight = formData.mixerScaleWeight
      ? parseFloat(formData.mixerScaleWeight)
      : totalBatchWeight

    // Add feed allocation
    addFeedAllocation({
      penId: selectedPen.id,
      penName: selectedPen.name,
      barnId: selectedBarn?.id,
      barnName: selectedBarn?.name,
      date: formData.date,
      feedItems,
      totalBatchWeight: actualWeight,
      headCount,
      costPerHead,
      mixerScaleWeight: formData.mixerScaleWeight ? parseFloat(formData.mixerScaleWeight) : undefined,
      deliveredBy: formData.deliveredBy,
      notes: formData.notes || undefined,
    })

    // Log activity
    log({
      type: "feeding",
      entityType: "pen",
      entityId: selectedPen.id,
      entityName: selectedPen.name,
      title: `Feed delivered to ${selectedPen.name}`,
      description: `${actualWeight.toFixed(0)} lbs total (${feedItems.map((f) => `${f.quantity} ${f.unit} ${f.feedName}`).join(", ")}). Cost: $${totalCost.toFixed(2)} ($${costPerHead.toFixed(2)}/head)`,
      performedBy: formData.deliveredBy,
    })

    toast({
      title: "Feed allocation recorded",
      description: `${actualWeight.toFixed(0)} lbs delivered to ${selectedPen.name} for ${headCount} head`,
    })

    // Reset form
    setFormData({
      penId: penId || "",
      date: new Date().toISOString().split("T")[0],
      deliveredBy: "Owner",
      notes: "",
      mixerScaleWeight: "",
      scaleConnected: false,
    })
    setFeedItems([])
    setNewFeedId("")
    setNewFeedQuantity("")

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wheat className="h-5 w-5" />
            Feed Allocation to Pen
          </DialogTitle>
          <DialogDescription>
            Record feed batch delivered to a pen with automatic cost calculation
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pen and Date Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="penId">Select Pen *</Label>
              <Select
                value={formData.penId}
                onValueChange={(value) => setFormData({ ...formData, penId: value })}
                required
              >
                <SelectTrigger id="penId">
                  <SelectValue placeholder="Choose a pen" />
                </SelectTrigger>
                <SelectContent>
                  {pens.map((pen) => {
                    const barn = barns.find((b) => b.id === pen.barnId)
                    const cattle = dataStore
                      .getCattle()
                      .filter((c) => c.penId === pen.id && c.status === "Active").length
                    return (
                      <SelectItem key={pen.id} value={pen.id}>
                        {pen.name} ({barn?.name}) - {cattle} head
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>

          {selectedPen && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Pen</p>
                    <p className="font-semibold">{selectedPen.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Barn</p>
                    <p className="font-semibold">{selectedBarn?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Head Count</p>
                    <Badge variant="secondary" className="font-semibold">
                      {headCount} head
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Feed Items Section */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Wheat className="h-4 w-4" />
              Feed Components
            </h3>

            {/* Add Feed Item */}
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-7">
                <Select value={newFeedId} onValueChange={setNewFeedId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select feed..." />
                  </SelectTrigger>
                  <SelectContent>
                    {inventory.map((feed) => (
                      <SelectItem key={feed.id} value={feed.id}>
                        {feed.name} - {feed.quantityOnHand} {feed.unit} available
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Quantity"
                  value={newFeedQuantity}
                  onChange={(e) => setNewFeedQuantity(e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Button type="button" onClick={handleAddFeedItem} className="w-full" size="default">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Feed Items List */}
            {feedItems.length > 0 && (
              <Card>
                <CardContent className="p-3">
                  <ScrollArea className="max-h-[200px]">
                    <div className="space-y-2">
                      {feedItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex-1">
                            <p className="font-medium">{item.feedName}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity} {item.unit} × ${item.costPerUnit.toFixed(2)}/{item.unit} = $
                              {item.totalCost.toFixed(2)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFeedItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>

          {feedItems.length > 0 && (
            <>
              <Separator />

              {/* Scale Integration */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    Mixer Scale Integration
                  </h3>
                  {!formData.scaleConnected && (
                    <Button type="button" variant="outline" size="sm" onClick={handleConnectScale}>
                      Connect Bluetooth Scale
                    </Button>
                  )}
                  {formData.scaleConnected && (
                    <Badge variant="default" className="gap-1">
                      <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                      Scale Connected
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Calculated Batch Weight</Label>
                    <Input value={`${totalBatchWeight.toFixed(2)} lbs`} disabled />
                  </div>
                  <div>
                    <Label htmlFor="mixerScaleWeight">Actual Scale Weight (Optional)</Label>
                    <div className="relative">
                      <Scale className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="mixerScaleWeight"
                        type="number"
                        step="0.1"
                        placeholder="Auto from scale..."
                        value={formData.mixerScaleWeight}
                        onChange={(e) => setFormData({ ...formData, mixerScaleWeight: e.target.value })}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Cost Summary */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Cost Summary</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-sm">Total Batch Cost</span>
                      </div>
                      <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">Cost Per Head</span>
                      </div>
                      <p className="text-2xl font-bold">${costPerHead.toFixed(2)}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Wheat className="h-4 w-4" />
                        <span className="text-sm">Total Weight</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {(formData.mixerScaleWeight
                          ? parseFloat(formData.mixerScaleWeight)
                          : totalBatchWeight
                        ).toFixed(0)}{" "}
                        lbs
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deliveredBy">Delivered By *</Label>
              <Input
                id="deliveredBy"
                value={formData.deliveredBy}
                onChange={(e) => setFormData({ ...formData, deliveredBy: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              placeholder="Any observations, weather conditions, feeding notes..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedPen || feedItems.length === 0}>
              <Wheat className="h-4 w-4 mr-2" />
              Record Feed Allocation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import { Plus, Package, TrendingDown, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FeedInventoryCard } from "@/components/feed-inventory-card"
import { AddFeedDialog } from "@/components/add-feed-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function FeedPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedFeed, setSelectedFeed] = useState<number | null>(null)
  const [isUpdateUsageOpen, setIsUpdateUsageOpen] = useState(false)

  // Mock data - will be replaced with real data
  const feedInventory = [
    {
      id: 1,
      name: "Corn",
      quantity: 12500,
      unit: "lbs",
      daysRemaining: 4.2,
      costPerUnit: 0.18,
      totalValue: 2250,
      status: "low" as const,
      dailyUsage: 2976,
      lastUpdated: "2024-06-28",
    },
    {
      id: 2,
      name: "Hay",
      quantity: 8400,
      unit: "lbs",
      daysRemaining: 12,
      costPerUnit: 0.12,
      totalValue: 1008,
      status: "good" as const,
      dailyUsage: 700,
      lastUpdated: "2024-06-28",
    },
    {
      id: 3,
      name: "Protein Supplement",
      quantity: 450,
      unit: "lbs",
      daysRemaining: 6,
      costPerUnit: 0.85,
      totalValue: 382.5,
      status: "warning" as const,
      dailyUsage: 75,
      lastUpdated: "2024-06-27",
    },
    {
      id: 4,
      name: "Mineral Mix",
      quantity: 280,
      unit: "lbs",
      daysRemaining: 18,
      costPerUnit: 1.2,
      totalValue: 336,
      status: "good" as const,
      dailyUsage: 15.5,
      lastUpdated: "2024-06-28",
    },
  ]

  const totalInventoryValue = feedInventory.reduce((sum, item) => sum + item.totalValue, 0)
  const totalDailyUsage = feedInventory.reduce((sum, item) => sum + item.dailyUsage * item.costPerUnit, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-1 block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-foreground">Feed Inventory</h1>
              <p className="text-sm text-muted-foreground">Track feed supplies and costs</p>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Feed
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Inventory Value</p>
                  <p className="text-3xl font-bold text-foreground">${totalInventoryValue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Daily Usage Cost</p>
                  <p className="text-3xl font-bold text-foreground">${totalDailyUsage.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                  <Package className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock Items</p>
                  <p className="text-3xl font-bold text-foreground">
                    {feedInventory.filter((f) => f.status === "low" || f.status === "warning").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feed Inventory Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {feedInventory.map((feed) => (
            <Card key={feed.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle>{feed.name}</CardTitle>
                  <Dialog
                    open={isUpdateUsageOpen && selectedFeed === feed.id}
                    onOpenChange={(open) => {
                      setIsUpdateUsageOpen(open)
                      if (open) setSelectedFeed(feed.id)
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update {feed.name} Usage</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="current-quantity">Current Quantity ({feed.unit})</Label>
                          <Input id="current-quantity" type="number" defaultValue={feed.quantity} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="daily-usage">Daily Usage ({feed.unit})</Label>
                          <Input id="daily-usage" type="number" defaultValue={feed.dailyUsage} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="usage-date">Date</Label>
                          <Input id="usage-date" type="date" defaultValue={feed.lastUpdated} />
                        </div>
                        <Button className="w-full">Update Feed Data</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <FeedInventoryCard {...feed} />
                <div className="pt-4 border-t border-border space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Daily Usage:</span>
                    <span className="font-medium text-foreground">
                      {feed.dailyUsage} {feed.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Usage Cost/Day:</span>
                    <span className="font-medium text-foreground">
                      ${(feed.dailyUsage * feed.costPerUnit).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span className="font-medium text-foreground">{feed.lastUpdated}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Add Feed Dialog */}
      <AddFeedDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </div>
  )
}

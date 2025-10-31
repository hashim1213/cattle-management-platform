"use client"

import { useEffect, useState } from "react"
import { Plus, Package, TrendingDown, AlertTriangle, CheckCircle2, Minus, Grid3x3, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AddFeedDialog } from "@/components/add-feed-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { dataStore, type FeedInventory } from "@/lib/data-store"
import { FeedList } from "@/components/feed-list"

export default function FeedPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedFeed, setSelectedFeed] = useState<FeedInventory | null>(null)
  const [isRecordUsageOpen, setIsRecordUsageOpen] = useState(false)
  const [isAddStockOpen, setIsAddStockOpen] = useState(false)
  const [usageAmount, setUsageAmount] = useState("")
  const [addAmount, setAddAmount] = useState("")
  const [feedInventory, setFeedInventory] = useState<FeedInventory[]>([])
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards")

  useEffect(() => {
    loadFeedData()
  }, [])

  const loadFeedData = () => {
    setFeedInventory(dataStore.getFeedInventory())
  }

  const handleRecordUsage = () => {
    if (!selectedFeed || !usageAmount) return

    const amount = parseFloat(usageAmount)
    if (amount > 0 && amount <= selectedFeed.quantity) {
      dataStore.updateFeed(selectedFeed.id, {
        quantity: selectedFeed.quantity - amount,
      })
      setIsRecordUsageOpen(false)
      setUsageAmount("")
      loadFeedData()
    }
  }

  const handleAddStock = () => {
    if (!selectedFeed || !addAmount) return

    const amount = parseFloat(addAmount)
    if (amount > 0) {
      dataStore.updateFeed(selectedFeed.id, {
        quantity: selectedFeed.quantity + amount,
      })
      setIsAddStockOpen(false)
      setAddAmount("")
      loadFeedData()
    }
  }

  const getDaysRemaining = (feed: FeedInventory) => {
    if (feed.dailyUsage === 0) return 999
    return Math.floor(feed.quantity / feed.dailyUsage)
  }

  const getStatusInfo = (daysRemaining: number) => {
    if (daysRemaining < 7) {
      return { color: "bg-red-500", textColor: "text-red-700", bgColor: "bg-red-50", status: "Critical - Order Now!", icon: AlertTriangle }
    } else if (daysRemaining < 14) {
      return { color: "bg-amber-500", textColor: "text-amber-700", bgColor: "bg-amber-50", status: "Low - Order Soon", icon: AlertTriangle }
    } else {
      return { color: "bg-green-500", textColor: "text-green-700", bgColor: "bg-green-50", status: "Good Stock", icon: CheckCircle2 }
    }
  }

  const totalInventoryValue = feedInventory.reduce((sum, item) => sum + item.quantity * item.costPerUnit, 0)
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
            <div className="flex gap-2">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "cards" | "list")}>
                <TabsList>
                  <TabsTrigger value="list">
                    <List className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="cards">
                    <Grid3x3 className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Feed
              </Button>
            </div>
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

        {/* Feed Inventory Views */}
        {viewMode === "list" ? (
          <FeedList
            feedInventory={feedInventory}
            onRecordUsage={(feed) => {
              setSelectedFeed(feed)
              setIsRecordUsageOpen(true)
            }}
            onAddStock={(feed) => {
              setSelectedFeed(feed)
              setIsAddStockOpen(true)
            }}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {feedInventory.map((feed) => {
              const daysRemaining = getDaysRemaining(feed)
              const statusInfo = getStatusInfo(daysRemaining)
              const StatusIcon = statusInfo.icon
              const percentRemaining = Math.min((daysRemaining / 30) * 100, 100)

              return (
                <Card key={feed.id} className={`border-2 ${daysRemaining < 7 ? "border-red-300" : "border-border"}`}>
                  <CardHeader className={`${statusInfo.bgColor} border-b`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-14 w-14 rounded-full ${statusInfo.color} flex items-center justify-center`}>
                          <Package className="h-7 w-7 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl">{feed.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <StatusIcon className={`h-4 w-4 ${statusInfo.textColor}`} />
                            <span className={`text-sm font-semibold ${statusInfo.textColor}`}>{statusInfo.status}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        {daysRemaining} days
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6">
                    {/* Visual Stock Level */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Current Stock</span>
                        <span className="text-sm font-bold">
                          {feed.quantity.toLocaleString()} {feed.unit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                        <div
                          className={`h-full ${statusInfo.color} transition-all duration-500 flex items-center justify-end pr-2`}
                          style={{ width: `${percentRemaining}%` }}
                        >
                          {percentRemaining > 15 && (
                            <span className="text-white text-xs font-bold">{percentRemaining.toFixed(0)}%</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Key Info Grid */}
                    <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Daily Use</p>
                        <p className="text-lg font-bold">
                          {feed.dailyUsage} {feed.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Cost/Day</p>
                        <p className="text-lg font-bold">${(feed.dailyUsage * feed.costPerUnit).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Total Value</p>
                        <p className="text-lg font-bold">${(feed.quantity * feed.costPerUnit).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Cost/Unit</p>
                        <p className="text-lg font-bold">${feed.costPerUnit.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedFeed(feed)
                          setIsRecordUsageOpen(true)
                        }}
                      >
                        <Minus className="h-4 w-4 mr-2" />
                        Record Usage
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => {
                          setSelectedFeed(feed)
                          setIsAddStockOpen(true)
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Stock
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* Add Feed Dialog */}
      <AddFeedDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />

      {/* Record Usage Dialog */}
      <Dialog open={isRecordUsageOpen} onOpenChange={setIsRecordUsageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Feed Usage - {selectedFeed?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Current Stock:</strong> {selectedFeed?.quantity.toLocaleString()} {selectedFeed?.unit}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="usage-amount">Amount Used ({selectedFeed?.unit})</Label>
              <Input
                id="usage-amount"
                type="number"
                placeholder={`e.g., ${selectedFeed?.dailyUsage}`}
                value={usageAmount}
                onChange={(e) => setUsageAmount(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Typical daily usage: {selectedFeed?.dailyUsage} {selectedFeed?.unit}
              </p>
            </div>
            {usageAmount && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-900">
                  <strong>New Stock:</strong> {((selectedFeed?.quantity || 0) - parseFloat(usageAmount || "0")).toLocaleString()}{" "}
                  {selectedFeed?.unit}
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsRecordUsageOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleRecordUsage} disabled={!usageAmount}>
                Record Usage
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Stock Dialog */}
      <Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Stock - {selectedFeed?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Current Stock:</strong> {selectedFeed?.quantity.toLocaleString()} {selectedFeed?.unit}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-amount">Amount to Add ({selectedFeed?.unit})</Label>
              <Input
                id="add-amount"
                type="number"
                placeholder="Enter amount"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                autoFocus
              />
            </div>
            {addAmount && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-900">
                  <strong>New Stock:</strong> {((selectedFeed?.quantity || 0) + parseFloat(addAmount || "0")).toLocaleString()}{" "}
                  {selectedFeed?.unit}
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsAddStockOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleAddStock} disabled={!addAmount}>
                Add Stock
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

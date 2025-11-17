"use client"

import { useEffect, useState } from "react"
import {
  Plus,
  Package,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Archive,
  Search,
  Filter,
  Grid3x3,
  List,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { inventoryService } from "@/lib/inventory/inventory-service"
import {
  InventoryItem,
  InventoryAlert,
  getInventoryCategoryLabel,
  isDrugCategory,
  isFeedCategory,
  isSupplementCategory
} from "@/lib/inventory/inventory-types"
import { AddInventoryDialog } from "@/components/add-inventory-dialog"
import { InventoryAlertsPanel } from "@/components/inventory-alerts-panel"
import { InventoryTransactionsDialog } from "@/components/inventory-transactions-dialog"
import { useToast } from "@/hooks/use-toast"

export default function InventoryPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize Firebase inventory service when user is available
  useEffect(() => {
    if (user?.uid && !isInitialized) {
      inventoryService.initialize(user.uid).then(() => {
        setIsInitialized(true)
        loadInventory()
      })
    }

    return () => {
      if (user?.uid) {
        inventoryService.cleanup()
        setIsInitialized(false)
      }
    }
  }, [user?.uid])

  // Subscribe to inventory changes
  useEffect(() => {
    if (!isInitialized) return

    loadInventory()
    const unsubscribe = inventoryService.subscribe(() => {
      loadInventory()
    })
    return unsubscribe
  }, [isInitialized])

  // Apply filters when inventory or filters change
  useEffect(() => {
    applyFilters()
  }, [inventory, searchQuery, categoryFilter, statusFilter])

  const loadInventory = () => {
    const items = inventoryService.getInventory()
    setInventory(items)
  }

  const applyFilters = () => {
    let filtered = [...inventory]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.storageLocation.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    if (categoryFilter !== "all") {
      if (categoryFilter === "drugs") {
        filtered = filtered.filter((item) => isDrugCategory(item.category))
      } else if (categoryFilter === "feed") {
        filtered = filtered.filter((item) => isFeedCategory(item.category))
      } else if (categoryFilter === "supplements") {
        filtered = filtered.filter((item) => isSupplementCategory(item.category))
      }
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "low") {
        filtered = filtered.filter((item) => item.quantityOnHand <= item.reorderPoint)
      } else if (statusFilter === "expired") {
        filtered = filtered.filter((item) => {
          if (!item.expirationDate) return false
          return new Date(item.expirationDate) < new Date()
        })
      } else if (statusFilter === "expiring") {
        filtered = filtered.filter((item) => {
          if (!item.expirationDate) return false
          const expiryDate = new Date(item.expirationDate)
          const thirtyDaysFromNow = new Date()
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
          return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date()
        })
      }
    }

    setFilteredInventory(filtered)
  }

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item)
    setIsAddDialogOpen(true)
  }

  const handleViewTransactions = (item: InventoryItem) => {
    setSelectedItem(item)
    setIsTransactionsOpen(true)
  }

  const handleDeleteItem = (item: InventoryItem) => {
    if (confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
      try {
        inventoryService.deleteItem(item.id)
        toast({
          title: "Item deleted",
          description: `${item.name} has been removed from inventory.`,
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete item. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  // Get inventory status
  const status = inventoryService.getInventoryStatus()
  const lowStockItems = inventoryService.getLowStockItems()
  const expiredItems = inventoryService.getExpiredItems()
  const expiringSoonItems = inventoryService.getExpiringSoonItems()

  // Get item status badge
  const getItemStatusBadge = (item: InventoryItem) => {
    const isLowStock = item.quantityOnHand <= item.reorderPoint
    const isExpired = item.expirationDate && new Date(item.expirationDate) < new Date()
    const isExpiringSoon =
      item.expirationDate &&
      new Date(item.expirationDate) <=
        new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000) &&
      new Date(item.expirationDate) >= new Date()

    if (isExpired) {
      return (
        <Badge variant="destructive" className="ml-2">
          <AlertCircle className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      )
    }

    if (item.quantityOnHand === 0) {
      return (
        <Badge variant="destructive" className="ml-2">
          <AlertCircle className="h-3 w-3 mr-1" />
          Out of Stock
        </Badge>
      )
    }

    if (isLowStock) {
      return (
        <Badge variant="outline" className="ml-2 border-amber-500 text-amber-700">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Low Stock
        </Badge>
      )
    }

    if (isExpiringSoon) {
      return (
        <Badge variant="outline" className="ml-2 border-orange-500 text-orange-700">
          <Clock className="h-3 w-3 mr-1" />
          Expiring Soon
        </Badge>
      )
    }

    return (
      <Badge variant="outline" className="ml-2 border-green-500 text-green-700">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Good
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Mobile optimized */}
      <header className="border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-40 lg:static">
        <div className="w-full px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Link href="/" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground mb-1 block touch-manipulation">
                ← Back
              </Link>
              <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">Supplies</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Manage your feed, medications, and supplies</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTransactionsOpen(true)}
                className="hidden md:flex touch-manipulation min-h-[44px]"
              >
                <Archive className="h-4 w-4 mr-2" />
                History
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedItem(null)
                  setIsAddDialogOpen(true)
                }}
                className="touch-manipulation min-h-[44px] px-3 sm:px-4"
              >
                <Plus className="h-5 w-5 sm:mr-2" />
                <span className="hidden sm:inline">Add Item</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 py-4 sm:py-6 pb-safe">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>Total Items</span>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.totalItems}</div>
              <p className="text-xs text-muted-foreground">
                {inventory.filter((i) => isDrugCategory(i.category)).length} drugs,{" "}
                {inventory.filter((i) => isFeedCategory(i.category)).length} feed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>Total Value</span>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${status.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              <p className="text-xs text-muted-foreground">Current inventory value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>Low Stock</span>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{status.lowStockCount}</div>
              <p className="text-xs text-muted-foreground">
                Items at or below reorder point
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>Expiration Alerts</span>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {status.expiredCount + status.expiringSoonCount}
              </div>
              <p className="text-xs text-muted-foreground">
                {status.expiredCount} expired, {status.expiringSoonCount} expiring soon
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Panel */}
        {status.alerts.length > 0 && (
          <div className="mb-6">
            <InventoryAlertsPanel alerts={status.alerts} />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="drugs">Drugs</SelectItem>
              <SelectItem value="feed">Feed</SelectItem>
              <SelectItem value="supplements">Supplements</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="expiring">Expiring Soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>

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
        </div>

        {/* Inventory Items */}
        {filteredInventory.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No inventory items found</p>
                <p className="text-sm">
                  {searchQuery || categoryFilter !== "all" || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Add your first inventory item to get started"}
                </p>
                {!searchQuery && categoryFilter === "all" && statusFilter === "all" && (
                  <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Inventory Item
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : viewMode === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInventory.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base font-semibold flex items-center">
                        {item.name}
                        {getItemStatusBadge(item)}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getInventoryCategoryLabel(item.category)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Quantity:</span>
                    <span className="font-semibold">
                      {item.quantityOnHand.toLocaleString()} {item.unit}
                    </span>
                  </div>

                  {item.quantityOnHand <= item.reorderPoint && (
                    <div className="flex justify-between items-center text-amber-600">
                      <span className="text-sm">Reorder Point:</span>
                      <span className="text-sm font-medium">
                        {item.reorderPoint} {item.unit}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Value:</span>
                    <span className="font-semibold">
                      ${item.totalValue.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Cost/Unit:</span>
                    <span className="text-sm">${item.costPerUnit.toFixed(2)}</span>
                  </div>

                  {item.expirationDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Expires:</span>
                      <span className="text-sm">
                        {new Date(item.expirationDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Location:</span>
                    <span className="text-sm">{item.storageLocation}</span>
                  </div>

                  {item.withdrawalPeriod && (
                    <div className="pt-2 border-t">
                      <Badge variant="outline" className="text-xs">
                        {item.withdrawalPeriod} day withdrawal
                      </Badge>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditItem(item)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewTransactions(item)}
                    >
                      History
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteItem(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // List View
          <div className="space-y-2">
            {filteredInventory.map((item) => (
              <Card key={item.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-6 gap-4 items-center">
                      <div className="col-span-2">
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {getInventoryCategoryLabel(item.category)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">
                          {item.quantityOnHand.toLocaleString()} {item.unit}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Reorder: {item.reorderPoint}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">${item.totalValue.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                          ${item.costPerUnit.toFixed(2)}/{item.unit}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm">{item.storageLocation}</div>
                        {item.expirationDate && (
                          <div className="text-xs text-muted-foreground">
                            Exp: {new Date(item.expirationDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        {getItemStatusBadge(item)}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewTransactions(item)}
                      >
                        History
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteItem(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Dialogs */}
      <AddInventoryDialog
        open={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false)
          setSelectedItem(null)
        }}
        item={selectedItem}
      />

      <InventoryTransactionsDialog
        open={isTransactionsOpen}
        onClose={() => {
          setIsTransactionsOpen(false)
          setSelectedItem(null)
        }}
        item={selectedItem}
      />
    </div>
  )
}

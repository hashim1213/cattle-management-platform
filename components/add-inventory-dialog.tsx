"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { inventoryService } from "@/lib/inventory/inventory-service"
import {
  InventoryItem,
  InventoryCategory,
  InventoryUnit,
  isDrugCategory,
  isFeedCategory,
  isSupplementCategory
} from "@/lib/inventory/inventory-types"
import { searchCatalog, CatalogItem, getCatalogByType } from "@/lib/inventory/inventory-catalog"
import { Pill, Wheat, Salad, ChevronDown, ChevronUp, Search, X } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"

interface AddInventoryDialogProps {
  open: boolean
  onClose: () => void
  item?: InventoryItem | null
}

// Quick add templates for common items
const QUICK_TEMPLATES = {
  meds: [
    { name: "Penicillin", category: "antibiotic" as InventoryCategory, unit: "ml" as InventoryUnit, reorderPoint: 50, reorderQty: 200 },
    { name: "LA-200", category: "antibiotic" as InventoryCategory, unit: "ml" as InventoryUnit, reorderPoint: 100, reorderQty: 500 },
    { name: "Banamine", category: "anti-inflammatory" as InventoryCategory, unit: "ml" as InventoryUnit, reorderPoint: 50, reorderQty: 200 },
    { name: "Ivomec", category: "antiparasitic" as InventoryCategory, unit: "ml" as InventoryUnit, reorderPoint: 100, reorderQty: 500 },
  ],
  feed: [
    { name: "Corn Silage", category: "corn-silage" as InventoryCategory, unit: "tons" as InventoryUnit, reorderPoint: 10, reorderQty: 50 },
    { name: "Alfalfa Hay", category: "hay-alfalfa" as InventoryCategory, unit: "bales" as InventoryUnit, reorderPoint: 100, reorderQty: 500 },
    { name: "Grass Hay", category: "hay-grass" as InventoryCategory, unit: "bales" as InventoryUnit, reorderPoint: 100, reorderQty: 500 },
    { name: "Shell Corn", category: "shell-corn" as InventoryCategory, unit: "bushels" as InventoryUnit, reorderPoint: 1000, reorderQty: 5000 },
  ],
  supplements: [
    { name: "Protein Tub", category: "protein-supplement" as InventoryCategory, unit: "lbs" as InventoryUnit, reorderPoint: 200, reorderQty: 1000 },
    { name: "Mineral Mix", category: "mineral-supplement" as InventoryCategory, unit: "lbs" as InventoryUnit, reorderPoint: 200, reorderQty: 1000 },
    { name: "Vitamin Premix", category: "vitamin-supplement" as InventoryCategory, unit: "lbs" as InventoryUnit, reorderPoint: 50, reorderQty: 200 },
  ]
}

export function AddInventoryDialog({ open, onClose, item }: AddInventoryDialogProps) {
  const { user } = useAuth()
  const [isInitialized, setIsInitialized] = useState(false)

  // Catalog search state
  const [catalogSearchQuery, setCatalogSearchQuery] = useState("")
  const [catalogCategory, setCatalogCategory] = useState<"all" | "meds" | "feed" | "supplements">("all")
  const [catalogResults, setCatalogResults] = useState<CatalogItem[]>([])
  const [activeTab, setActiveTab] = useState<"catalog" | "manual">("catalog")

  // Form state
  const [name, setName] = useState("")
  const [category, setCategory] = useState<InventoryCategory>("antibiotic")
  const [quantityOnHand, setQuantityOnHand] = useState("")
  const [unit, setUnit] = useState<InventoryUnit>("ml")
  const [reorderPoint, setReorderPoint] = useState("")
  const [reorderQuantity, setReorderQuantity] = useState("")
  const [costPerUnit, setCostPerUnit] = useState("")
  const [storageLocation, setStorageLocation] = useState("Main Storage")
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Optional advanced fields
  const [supplier, setSupplier] = useState("")
  const [expirationDate, setExpirationDate] = useState("")
  const [withdrawalPeriod, setWithdrawalPeriod] = useState("")
  const [notes, setNotes] = useState("")

  // Initialize inventory service when dialog opens
  useEffect(() => {
    if (user?.uid && open && !isInitialized) {
      inventoryService.initialize(user.uid).then(() => {
        setIsInitialized(true)
      })
    }
  }, [user?.uid, open, isInitialized])

  // Update catalog search results when query or category changes
  useEffect(() => {
    if (activeTab === "catalog" && !item) {
      const results = searchCatalog(catalogSearchQuery, catalogCategory)
      setCatalogResults(results)
    }
  }, [catalogSearchQuery, catalogCategory, activeTab, item])

  // Load existing item data when editing
  useEffect(() => {
    if (item) {
      setName(item.name)
      setCategory(item.category)
      setQuantityOnHand(item.quantityOnHand.toString())
      setUnit(item.unit)
      setReorderPoint(item.reorderPoint.toString())
      setReorderQuantity(item.reorderQuantity.toString())
      setCostPerUnit(item.costPerUnit.toString())
      setStorageLocation(item.storageLocation)
      setSupplier(item.supplier || "")
      setExpirationDate(item.expirationDate || "")
      setWithdrawalPeriod(item.withdrawalPeriod?.toString() || "")
      setNotes(item.notes || "")
      setShowAdvanced(true) // Show advanced fields when editing
      setActiveTab("manual") // Go to manual tab when editing
    } else {
      resetForm()
      setActiveTab("catalog") // Start with catalog when adding new
    }
  }, [item, open])

  const resetForm = () => {
    setName("")
    setCategory("antibiotic")
    setQuantityOnHand("")
    setUnit("ml")
    setReorderPoint("")
    setReorderQuantity("")
    setCostPerUnit("")
    setStorageLocation("Main Storage")
    setSupplier("")
    setExpirationDate("")
    setWithdrawalPeriod("")
    setNotes("")
    setShowAdvanced(false)
    setCatalogSearchQuery("")
    setCatalogCategory("all")
    setCatalogResults([])
  }

  const applyCatalogItem = (catalogItem: CatalogItem) => {
    setName(catalogItem.name)
    setCategory(catalogItem.category)
    setUnit(catalogItem.unit)
    setReorderPoint(catalogItem.defaultReorderPoint?.toString() || "")
    setReorderQuantity(catalogItem.defaultReorderQty?.toString() || "")
    setCostPerUnit(catalogItem.defaultCost?.toString() || "")

    // Apply drug-specific fields
    if (catalogItem.withdrawalPeriod !== undefined) {
      setWithdrawalPeriod(catalogItem.withdrawalPeriod.toString())
    }

    // Set notes with description
    if (catalogItem.description) {
      setNotes(catalogItem.description)
    }

    // Switch to manual tab to enter quantity and finish
    setActiveTab("manual")
  }

  const applyTemplate = (template: typeof QUICK_TEMPLATES.meds[0]) => {
    setName(template.name)
    setCategory(template.category)
    setUnit(template.unit)
    setReorderPoint(template.reorderPoint.toString())
    setReorderQuantity(template.reorderQty.toString())
  }

  const handleSubmit = async () => {
    // Check if service is initialized
    if (!isInitialized && !user?.uid) {
      alert("Please wait, initializing...")
      return
    }

    // Ensure service is initialized
    if (user?.uid) {
      await inventoryService.initialize(user.uid)
    }

    // Validation - only require essential fields
    if (!name || !quantityOnHand) {
      alert("Please provide item name and quantity")
      return
    }

    const qty = parseFloat(quantityOnHand)
    const reorder = parseFloat(reorderPoint) || 0
    const reorderQty = parseFloat(reorderQuantity) || 100
    const cost = parseFloat(costPerUnit) || 0

    if (isNaN(qty) || qty < 0) {
      alert("Please enter a valid quantity")
      return
    }

    try {
      if (item) {
        // Update existing item
        await inventoryService.updateInventoryItem(item.id, {
          name,
          category,
          unit,
          reorderPoint: reorder,
          reorderQuantity: reorderQty,
          costPerUnit: cost,
          storageLocation,
          supplier: supplier || undefined,
          expirationDate: expirationDate || undefined,
          withdrawalPeriod: withdrawalPeriod ? parseInt(withdrawalPeriod) : undefined,
          notes: notes || undefined
        })

        if (qty !== item.quantityOnHand) {
          await inventoryService.adjust({
            itemId: item.id,
            newQuantity: qty,
            reason: "Manual adjustment",
            performedBy: "current-user"
          })
        }
      } else {
        // Create new item
        await inventoryService.addInventoryItem({
          name,
          category,
          quantityOnHand: qty,
          unit,
          reorderPoint: reorder,
          reorderQuantity: reorderQty,
          costPerUnit: cost,
          storageLocation,
          supplier: supplier || undefined,
          expirationDate: expirationDate || undefined,
          withdrawalPeriod: withdrawalPeriod ? parseInt(withdrawalPeriod) : undefined,
          notes: notes || undefined
        })
      }

      onClose()
    } catch (error) {
      console.error("Error saving inventory item:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert(`Failed to save inventory item: ${errorMessage}\n\nPlease check the console for more details.`)
    }
  }

  const isDrug = isDrugCategory(category)
  const isFeed = isFeedCategory(category)
  const isSupplement = isSupplementCategory(category)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit" : "Add"} Inventory Item</DialogTitle>
        </DialogHeader>

        {!item && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "catalog" | "manual")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="catalog">Search Catalog</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            </TabsList>

            <TabsContent value="catalog" className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Search our catalog of common medications, feeds, and supplements
                </p>

                {/* Search bar */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search medications, feeds, supplements..."
                      value={catalogSearchQuery}
                      onChange={(e) => setCatalogSearchQuery(e.target.value)}
                      className="pl-9 pr-9"
                    />
                    {catalogSearchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setCatalogSearchQuery("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Select value={catalogCategory} onValueChange={(v: any) => setCatalogCategory(v)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      <SelectItem value="meds">Medications</SelectItem>
                      <SelectItem value="feed">Feed</SelectItem>
                      <SelectItem value="supplements">Supplements</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Catalog results */}
                <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                  {catalogResults.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <p>No items found</p>
                      <p className="text-sm">Try adjusting your search or switch to Manual Entry</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {catalogResults.map((catalogItem, idx) => (
                        <button
                          key={idx}
                          onClick={() => applyCatalogItem(catalogItem)}
                          className="w-full p-3 text-left hover:bg-accent transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{catalogItem.name}</p>
                              {catalogItem.description && (
                                <p className="text-sm text-muted-foreground">{catalogItem.description}</p>
                              )}
                              {catalogItem.commonNames && catalogItem.commonNames.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Also known as: {catalogItem.commonNames.join(", ")}
                                </p>
                              )}
                            </div>
                            <div className="text-right text-sm text-muted-foreground ml-4">
                              <p>{catalogItem.unit}</p>
                              {catalogItem.defaultCost && (
                                <p className="text-xs">${catalogItem.defaultCost.toFixed(2)}/{catalogItem.unit}</p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Can't find what you're looking for? Switch to Manual Entry tab
                </p>
              </div>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              {/* Quick add templates - keep existing */}
              <div className="space-y-3 pb-4">
                <p className="text-sm text-muted-foreground">Quick add common items:</p>

            {/* Medications Quick Add */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Pill className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Medications</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_TEMPLATES.meds.map((template, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate(template)}
                    className="text-xs"
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Feed Quick Add */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Wheat className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Feed</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_TEMPLATES.feed.map((template, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate(template)}
                    className="text-xs"
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Supplements Quick Add */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Salad className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Supplements</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_TEMPLATES.supplements.map((template, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate(template)}
                    className="text-xs"
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>
              </div>

              <div className="space-y-4 py-4">
                {/* Essential Fields Only */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="name">Item Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Penicillin, Hay, Mineral Mix"
                      className="text-base"
                    />
                  </div>

                  <div>
                    <Label htmlFor="quantityOnHand">Quantity *</Label>
                    <Input
                      id="quantityOnHand"
                      type="number"
                      min="0"
                      step="0.01"
                      value={quantityOnHand}
                      onChange={(e) => setQuantityOnHand(e.target.value)}
                      placeholder="100"
                      className="text-base"
                    />
                  </div>

                  <div>
                    <Label htmlFor="unit">Unit *</Label>
                    <Select value={unit} onValueChange={(v) => setUnit(v as InventoryUnit)}>
                      <SelectTrigger className="text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="cc">cc</SelectItem>
                        <SelectItem value="lbs">lbs</SelectItem>
                        <SelectItem value="tons">tons</SelectItem>
                        <SelectItem value="bales">bales</SelectItem>
                        <SelectItem value="bags">bags</SelectItem>
                        <SelectItem value="bushels">bushels</SelectItem>
                        <SelectItem value="doses">doses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="costPerUnit">Cost per Unit</Label>
                    <Input
                      id="costPerUnit"
                      type="number"
                      min="0"
                      step="0.01"
                      value={costPerUnit}
                      onChange={(e) => setCostPerUnit(e.target.value)}
                      placeholder="0.00"
                      className="text-base"
                    />
                  </div>

                  <div>
                    <Label htmlFor="storageLocation">Location</Label>
                    <Input
                      id="storageLocation"
                      value={storageLocation}
                      onChange={(e) => setStorageLocation(e.target.value)}
                      placeholder="Main Storage"
                      className="text-base"
                    />
                  </div>
                </div>

                {/* Advanced Fields Toggle */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full"
                >
                  {showAdvanced ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Hide Advanced Options
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Show Advanced Options
                    </>
                  )}
                </Button>

                {/* Advanced Fields */}
                {showAdvanced && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="reorderPoint">Reorder Alert Level</Label>
                        <Input
                          id="reorderPoint"
                          type="number"
                          min="0"
                          value={reorderPoint}
                          onChange={(e) => setReorderPoint(e.target.value)}
                          placeholder="100"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Alert when stock reaches this level</p>
                      </div>

                      <div>
                        <Label htmlFor="reorderQuantity">Reorder Amount</Label>
                        <Input
                          id="reorderQuantity"
                          type="number"
                          min="0"
                          value={reorderQuantity}
                          onChange={(e) => setReorderQuantity(e.target.value)}
                          placeholder="500"
                        />
                        <p className="text-xs text-muted-foreground mt-1">How much to reorder</p>
                      </div>

                      {isDrug && (
                        <>
                          <div>
                            <Label htmlFor="expirationDate">Expiration Date</Label>
                            <Input
                              id="expirationDate"
                              type="date"
                              value={expirationDate}
                              onChange={(e) => setExpirationDate(e.target.value)}
                            />
                          </div>

                          <div>
                            <Label htmlFor="withdrawalPeriod">Withdrawal Period (days)</Label>
                            <Input
                              id="withdrawalPeriod"
                              type="number"
                              min="0"
                              value={withdrawalPeriod}
                              onChange={(e) => setWithdrawalPeriod(e.target.value)}
                              placeholder="28"
                            />
                          </div>
                        </>
                      )}

                      <div className="sm:col-span-2">
                        <Label htmlFor="supplier">Supplier</Label>
                        <Input
                          id="supplier"
                          value={supplier}
                          onChange={(e) => setSupplier(e.target.value)}
                          placeholder="Vendor name"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Additional notes..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* When editing, show form directly without tabs */}
        {item && (
          <div className="space-y-4 py-4">
            {/* Essential Fields Only */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Penicillin, Hay, Mineral Mix"
                  className="text-base"
                />
              </div>

              <div>
                <Label htmlFor="quantityOnHand">Quantity *</Label>
                <Input
                  id="quantityOnHand"
                  type="number"
                  min="0"
                  step="0.01"
                  value={quantityOnHand}
                  onChange={(e) => setQuantityOnHand(e.target.value)}
                  placeholder="100"
                  className="text-base"
                />
              </div>

              <div>
                <Label htmlFor="unit">Unit *</Label>
                <Select value={unit} onValueChange={(v) => setUnit(v as InventoryUnit)}>
                  <SelectTrigger className="text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="cc">cc</SelectItem>
                    <SelectItem value="lbs">lbs</SelectItem>
                    <SelectItem value="tons">tons</SelectItem>
                    <SelectItem value="bales">bales</SelectItem>
                    <SelectItem value="bags">bags</SelectItem>
                    <SelectItem value="bushels">bushels</SelectItem>
                    <SelectItem value="doses">doses</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="costPerUnit">Cost per Unit</Label>
                <Input
                  id="costPerUnit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value)}
                  placeholder="0.00"
                  className="text-base"
                />
              </div>

              <div>
                <Label htmlFor="storageLocation">Location</Label>
                <Input
                  id="storageLocation"
                  value={storageLocation}
                  onChange={(e) => setStorageLocation(e.target.value)}
                  placeholder="Main Storage"
                  className="text-base"
                />
              </div>
            </div>

            {/* Advanced Fields for editing - always shown */}
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reorderPoint-edit">Reorder Alert Level</Label>
                  <Input
                    id="reorderPoint-edit"
                    type="number"
                    min="0"
                    value={reorderPoint}
                    onChange={(e) => setReorderPoint(e.target.value)}
                    placeholder="100"
                  />
                </div>

                <div>
                  <Label htmlFor="reorderQuantity-edit">Reorder Amount</Label>
                  <Input
                    id="reorderQuantity-edit"
                    type="number"
                    min="0"
                    value={reorderQuantity}
                    onChange={(e) => setReorderQuantity(e.target.value)}
                    placeholder="500"
                  />
                </div>

                {isDrug && (
                  <>
                    <div>
                      <Label htmlFor="expirationDate-edit">Expiration Date</Label>
                      <Input
                        id="expirationDate-edit"
                        type="date"
                        value={expirationDate}
                        onChange={(e) => setExpirationDate(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="withdrawalPeriod-edit">Withdrawal Period (days)</Label>
                      <Input
                        id="withdrawalPeriod-edit"
                        type="number"
                        min="0"
                        value={withdrawalPeriod}
                        onChange={(e) => setWithdrawalPeriod(e.target.value)}
                        placeholder="28"
                      />
                    </div>
                  </>
                )}

                <div className="sm:col-span-2">
                  <Label htmlFor="supplier-edit">Supplier</Label>
                  <Input
                    id="supplier-edit"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Vendor name"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="notes-edit">Notes</Label>
                  <Textarea
                    id="notes-edit"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>{item ? "Update" : "Add"} Item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

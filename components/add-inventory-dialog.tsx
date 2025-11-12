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
  getInventoryCategoryOptions,
  isDrugCategory
} from "@/lib/inventory/inventory-types"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface AddInventoryDialogProps {
  open: boolean
  onClose: () => void
  item?: InventoryItem | null
}

export function AddInventoryDialog({ open, onClose, item }: AddInventoryDialogProps) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState<InventoryCategory>("antibiotic")
  const [quantityOnHand, setQuantityOnHand] = useState("")
  const [unit, setUnit] = useState<InventoryUnit>("cc")
  const [reorderPoint, setReorderPoint] = useState("")
  const [reorderQuantity, setReorderQuantity] = useState("")
  const [costPerUnit, setCostPerUnit] = useState("")
  const [storageLocation, setStorageLocation] = useState("")
  const [supplier, setSupplier] = useState("")
  const [expirationDate, setExpirationDate] = useState("")
  const [withdrawalPeriod, setWithdrawalPeriod] = useState("")
  const [manufacturer, setManufacturer] = useState("")
  const [lotNumber, setLotNumber] = useState("")
  const [notes, setNotes] = useState("")

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
      setManufacturer(item.manufacturer || "")
      setLotNumber(item.lotNumber || "")
      setNotes(item.notes || "")
    } else {
      // Reset form for new item
      setName("")
      setCategory("antibiotic")
      setQuantityOnHand("")
      setUnit("cc")
      setReorderPoint("")
      setReorderQuantity("")
      setCostPerUnit("")
      setStorageLocation("")
      setSupplier("")
      setExpirationDate("")
      setWithdrawalPeriod("")
      setManufacturer("")
      setLotNumber("")
      setNotes("")
    }
  }, [item, open])

  const handleSubmit = () => {
    // Validation
    if (!name || !quantityOnHand || !reorderPoint || !reorderQuantity || !costPerUnit || !storageLocation) {
      alert("Please fill in all required fields")
      return
    }

    const qty = parseFloat(quantityOnHand)
    const reorder = parseFloat(reorderPoint)
    const reorderQty = parseFloat(reorderQuantity)
    const cost = parseFloat(costPerUnit)

    if (isNaN(qty) || isNaN(reorder) || isNaN(reorderQty) || isNaN(cost)) {
      alert("Please enter valid numbers for quantities and cost")
      return
    }

    if (qty < 0 || reorder < 0 || reorderQty < 0 || cost < 0) {
      alert("Quantities and cost must be positive")
      return
    }

    if (item) {
      // Update existing item
      inventoryService.updateInventoryItem(item.id, {
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
        manufacturer: manufacturer || undefined,
        lotNumber: lotNumber || undefined,
        notes: notes || undefined
      })

      // If quantity changed, use adjust method
      if (qty !== item.quantityOnHand) {
        inventoryService.adjust({
          itemId: item.id,
          newQuantity: qty,
          reason: "Manual adjustment via edit dialog",
          performedBy: "current-user" // In production, get from auth context
        })
      }
    } else {
      // Create new item
      inventoryService.addInventoryItem({
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
        manufacturer: manufacturer || undefined,
        lotNumber: lotNumber || undefined,
        notes: notes || undefined
      })
    }

    onClose()
  }

  const categoryOptions = getInventoryCategoryOptions()
  const isDrug = isDrugCategory(category)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit" : "Add"} Inventory Item</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">
                  Item Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., LA-200, Corn Silage"
                />
              </div>

              <div>
                <Label htmlFor="category">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select value={category} onValueChange={(v) => setCategory(v as InventoryCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label} <span className="text-xs text-muted-foreground">({opt.group})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="unit">
                  Unit <span className="text-red-500">*</span>
                </Label>
                <Select value={unit} onValueChange={(v) => setUnit(v as InventoryUnit)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cc">cc (cubic centimeter)</SelectItem>
                    <SelectItem value="ml">ml (milliliter)</SelectItem>
                    <SelectItem value="lbs">lbs (pounds)</SelectItem>
                    <SelectItem value="kg">kg (kilograms)</SelectItem>
                    <SelectItem value="tons">tons</SelectItem>
                    <SelectItem value="bales">bales</SelectItem>
                    <SelectItem value="bags">bags</SelectItem>
                    <SelectItem value="bushels">bushels</SelectItem>
                    <SelectItem value="doses">doses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Quantity & Reorder */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Quantity & Reordering</h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quantityOnHand">
                  Current Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="quantityOnHand"
                  type="number"
                  min="0"
                  step="0.01"
                  value={quantityOnHand}
                  onChange={(e) => setQuantityOnHand(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="reorderPoint">
                  Reorder Point <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="reorderPoint"
                  type="number"
                  min="0"
                  step="0.01"
                  value={reorderPoint}
                  onChange={(e) => setReorderPoint(e.target.value)}
                  placeholder="100"
                />
                <p className="text-xs text-muted-foreground mt-1">Alert when quantity reaches this level</p>
              </div>

              <div>
                <Label htmlFor="reorderQuantity">
                  Reorder Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="reorderQuantity"
                  type="number"
                  min="0"
                  step="0.01"
                  value={reorderQuantity}
                  onChange={(e) => setReorderQuantity(e.target.value)}
                  placeholder="500"
                />
                <p className="text-xs text-muted-foreground mt-1">How much to reorder</p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Pricing</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="costPerUnit">
                  Cost Per Unit <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="costPerUnit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label>Total Value (Calculated)</Label>
                <Input
                  value={
                    quantityOnHand && costPerUnit
                      ? `$${(parseFloat(quantityOnHand) * parseFloat(costPerUnit)).toFixed(2)}`
                      : "$0.00"
                  }
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Location & Supplier */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Location & Supplier</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="storageLocation">
                  Storage Location <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="storageLocation"
                  value={storageLocation}
                  onChange={(e) => setStorageLocation(e.target.value)}
                  placeholder="e.g., Drug Cabinet, Hay Barn 1"
                />
              </div>

              <div>
                <Label htmlFor="supplier">Supplier (Optional)</Label>
                <Input
                  id="supplier"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="e.g., Zoetis, Local Farm Supply"
                />
              </div>
            </div>
          </div>

          {/* Drug-Specific Fields */}
          {isDrug && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Drug Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="manufacturer">Manufacturer (Optional)</Label>
                  <Input
                    id="manufacturer"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    placeholder="e.g., Zoetis, Boehringer Ingelheim"
                  />
                </div>

                <div>
                  <Label htmlFor="withdrawalPeriod">Withdrawal Period (Days)</Label>
                  <Input
                    id="withdrawalPeriod"
                    type="number"
                    min="0"
                    value={withdrawalPeriod}
                    onChange={(e) => setWithdrawalPeriod(e.target.value)}
                    placeholder="e.g., 28"
                  />
                </div>

                <div>
                  <Label htmlFor="lotNumber">Lot Number (Optional)</Label>
                  <Input
                    id="lotNumber"
                    value={lotNumber}
                    onChange={(e) => setLotNumber(e.target.value)}
                    placeholder="Lot number"
                  />
                </div>

                <div>
                  <Label htmlFor="expirationDate">Expiration Date</Label>
                  <Input
                    id="expirationDate"
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or instructions..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{item ? "Update" : "Add"} Item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

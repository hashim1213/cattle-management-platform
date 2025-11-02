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
import { usePenStore } from "@/hooks/use-pen-store"
import { useTreatmentStore } from "@/hooks/use-treatment-store"
import { useActivityStore } from "@/hooks/use-activity-store"
import { useToast } from "@/hooks/use-toast"
import { dataStore } from "@/lib/data-store"
import { Syringe, AlertCircle, DollarSign } from "lucide-react"
import type { TreatmentType, ApplicationMethod } from "@/lib/treatment-store"

interface BulkTreatmentDialogProps {
  penId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BulkTreatmentDialog({ penId, open, onOpenChange }: BulkTreatmentDialogProps) {
  const { pens, barns, getPen } = usePenStore()
  const { products, addTreatment } = useTreatmentStore()
  const { log } = useActivityStore()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    penId: penId || "",
    treatmentType: "dewormer" as TreatmentType,
    productId: "",
    customProductName: "",
    manufacturer: "",
    lotNumber: "",
    dosage: "",
    dosageUnit: "mL",
    applicationMethod: "pour-on" as ApplicationMethod,
    administeredBy: "Owner",
    reason: "",
    notes: "",
    costPerHead: "",
    withdrawalPeriodDays: "",
  })

  const selectedPen = formData.penId ? getPen(formData.penId) : null
  const headCount = selectedPen
    ? dataStore.getCattle().filter((c) => c.penId === formData.penId && c.status === "Active").length
    : 0

  const selectedProduct = products.find((p) => p.id === formData.productId)

  const totalCost = formData.costPerHead ? parseFloat(formData.costPerHead) * headCount : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPen) return

    const barn = barns.find((b) => b.id === selectedPen.barnId)
    const productName = selectedProduct?.productName || formData.customProductName
    const withdrawalDays = formData.withdrawalPeriodDays
      ? parseInt(formData.withdrawalPeriodDays)
      : selectedProduct?.withdrawalPeriodDays || 0

    const withdrawalDate = new Date()
    withdrawalDate.setDate(withdrawalDate.getDate() + withdrawalDays)

    // Add treatment record
    addTreatment({
      penId: selectedPen.id,
      barnId: selectedPen.barnId,
      treatmentType: formData.treatmentType,
      productName,
      manufacturer: formData.manufacturer || selectedProduct?.manufacturer,
      lotNumber: formData.lotNumber || undefined,
      dosage: formData.dosage,
      dosageUnit: formData.dosageUnit,
      applicationMethod: formData.applicationMethod,
      administeredBy: formData.administeredBy,
      date: new Date().toISOString(),
      cost: totalCost,
      costPerHead: parseFloat(formData.costPerHead) || 0,
      headCount,
      reason: formData.reason,
      notes: formData.notes || undefined,
      withdrawalPeriodDays: withdrawalDays,
      withdrawalDate: withdrawalDays > 0 ? withdrawalDate.toISOString() : undefined,
    })

    // Log activity
    log({
      type: "health-check",
      entityType: "pen",
      entityId: selectedPen.id,
      entityName: selectedPen.name,
      title: `Bulk ${formData.treatmentType} treatment: ${productName}`,
      description: `Applied ${productName} to ${headCount} head in ${selectedPen.name}. Withdrawal: ${withdrawalDays} days. Cost: $${totalCost.toFixed(2)}`,
      performedBy: formData.administeredBy,
    })

    toast({
      title: "Treatment logged",
      description: `Successfully logged ${formData.treatmentType} treatment for ${headCount} cattle in ${selectedPen.name}`,
    })

    // Reset form
    setFormData({
      penId: penId || "",
      treatmentType: "dewormer",
      productId: "",
      customProductName: "",
      manufacturer: "",
      lotNumber: "",
      dosage: "",
      dosageUnit: "mL",
      applicationMethod: "pour-on",
      administeredBy: "Owner",
      reason: "",
      notes: "",
      costPerHead: "",
      withdrawalPeriodDays: "",
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Syringe className="h-5 w-5" />
            Bulk Treatment Logging
          </DialogTitle>
          <DialogDescription>
            Apply medications, dewormers, or treatments to an entire pen of cattle
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pen Selection */}
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
                  return (
                    <SelectItem key={pen.id} value={pen.id}>
                      {pen.name} ({barn?.name}) - {pen.currentCount} head
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {selectedPen && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Pen</p>
                    <p className="font-semibold">{selectedPen.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cattle Count</p>
                    <Badge variant="secondary" className="font-semibold">
                      {headCount} head
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Treatment Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="treatmentType">Treatment Type *</Label>
              <Select
                value={formData.treatmentType}
                onValueChange={(value) => setFormData({ ...formData, treatmentType: value as TreatmentType })}
              >
                <SelectTrigger id="treatmentType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vaccination">Vaccination</SelectItem>
                  <SelectItem value="dewormer">Dewormer</SelectItem>
                  <SelectItem value="lice-treatment">Lice Treatment</SelectItem>
                  <SelectItem value="antibiotic">Antibiotic</SelectItem>
                  <SelectItem value="vitamin">Vitamin</SelectItem>
                  <SelectItem value="pain-relief">Pain Relief</SelectItem>
                  <SelectItem value="foot-care">Foot Care</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicationMethod">Application Method *</Label>
              <Select
                value={formData.applicationMethod}
                onValueChange={(value) => setFormData({ ...formData, applicationMethod: value as ApplicationMethod })}
              >
                <SelectTrigger id="applicationMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="injection">Injection</SelectItem>
                  <SelectItem value="oral">Oral</SelectItem>
                  <SelectItem value="topical">Topical</SelectItem>
                  <SelectItem value="pour-on">Pour-On</SelectItem>
                  <SelectItem value="bolus">Bolus</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Product Selection */}
          <div className="space-y-2">
            <Label htmlFor="productId">Product (Optional - select from inventory)</Label>
            <Select
              value={formData.productId}
              onValueChange={(value) => {
                const product = products.find((p) => p.id === value)
                if (product) {
                  setFormData({
                    ...formData,
                    productId: value,
                    customProductName: product.productName,
                    manufacturer: product.manufacturer,
                    treatmentType: product.treatmentType,
                    withdrawalPeriodDays: product.withdrawalPeriodDays.toString(),
                  })
                }
              }}
            >
              <SelectTrigger id="productId">
                <SelectValue placeholder="Or enter custom product below" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.productName} - {product.manufacturer} ({product.quantityOnHand} {product.unit} in stock)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name *</Label>
              <Input
                id="productName"
                value={formData.customProductName}
                onChange={(e) => setFormData({ ...formData, customProductName: e.target.value })}
                placeholder="e.g., Ivermectin Pour-On"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder="e.g., Boehringer Ingelheim"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dosage">Dosage *</Label>
              <Input
                id="dosage"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                placeholder="e.g., 1 per 22 lbs"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosageUnit">Unit</Label>
              <Input
                id="dosageUnit"
                value={formData.dosageUnit}
                onChange={(e) => setFormData({ ...formData, dosageUnit: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lotNumber">Lot Number</Label>
              <Input
                id="lotNumber"
                value={formData.lotNumber}
                onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Cost and Withdrawal */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="costPerHead">Cost Per Head *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="costPerHead"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.costPerHead}
                  onChange={(e) => setFormData({ ...formData, costPerHead: e.target.value })}
                  className="pl-9"
                  placeholder="0.00"
                  required
                />
              </div>
              {totalCost > 0 && (
                <p className="text-sm text-muted-foreground">
                  Total cost: <span className="font-semibold">${totalCost.toFixed(2)}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdrawalPeriod">Withdrawal Period (days)</Label>
              <Input
                id="withdrawalPeriod"
                type="number"
                min="0"
                value={formData.withdrawalPeriodDays}
                onChange={(e) => setFormData({ ...formData, withdrawalPeriodDays: e.target.value })}
                placeholder="0"
              />
              {formData.withdrawalPeriodDays && parseInt(formData.withdrawalPeriodDays) > 0 && (
                <div className="flex items-start gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Withdrawal until:{" "}
                    {new Date(
                      Date.now() + parseInt(formData.withdrawalPeriodDays) * 24 * 60 * 60 * 1000
                    ).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Treatment *</Label>
            <Input
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g., Arrival processing, routine deworming"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="administeredBy">Administered By *</Label>
              <Input
                id="administeredBy"
                value={formData.administeredBy}
                onChange={(e) => setFormData({ ...formData, administeredBy: e.target.value })}
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
              placeholder="Additional observations, reactions, etc."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedPen || headCount === 0}>
              <Syringe className="h-4 w-4 mr-2" />
              Log Treatment for {headCount} Head
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

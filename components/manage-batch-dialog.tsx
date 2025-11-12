"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useBatchStore } from "@/hooks/use-batch-store"
import { useToast } from "@/hooks/use-toast"
import type { Batch } from "@/lib/batch-store"

interface ManageBatchDialogProps {
  batch: Batch | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ManageBatchDialog({ batch, open, onOpenChange }: ManageBatchDialogProps) {
  const { addBatch, updateBatch } = useBatchStore()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    feederLoanNumber: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    supplier: "",
    headCount: "",
    averagePurchaseWeight: "",
    purchasePricePerPound: "",
    notes: "",
  })

  useEffect(() => {
    if (batch) {
      setFormData({
        name: batch.name,
        feederLoanNumber: batch.feederLoanNumber || "",
        purchaseDate: batch.purchaseDate.split("T")[0],
        supplier: batch.supplier,
        headCount: batch.headCount.toString(),
        averagePurchaseWeight: batch.averagePurchaseWeight.toString(),
        purchasePricePerPound: batch.purchasePricePerPound.toString(),
        notes: batch.notes || "",
      })
    } else {
      setFormData({
        name: "",
        feederLoanNumber: "",
        purchaseDate: new Date().toISOString().split("T")[0],
        supplier: "",
        headCount: "",
        averagePurchaseWeight: "",
        purchasePricePerPound: "",
        notes: "",
      })
    }
  }, [batch, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const headCount = parseInt(formData.headCount)
    const avgWeight = parseFloat(formData.averagePurchaseWeight)
    const pricePerPound = parseFloat(formData.purchasePricePerPound)
    const totalInvestment = headCount * avgWeight * pricePerPound

    const batchData = {
      name: formData.name,
      feederLoanNumber: formData.feederLoanNumber || undefined,
      purchaseDate: formData.purchaseDate,
      supplier: formData.supplier,
      headCount,
      averagePurchaseWeight: avgWeight,
      purchasePricePerPound: pricePerPound,
      totalInvestment,
      cattleIds: batch?.cattleIds || [],
      notes: formData.notes || undefined,
    }

    if (batch) {
      updateBatch(batch.id, batchData)
      toast({
        title: "Pen Group Updated",
        description: "The pen group has been successfully updated.",
      })
    } else {
      addBatch(batchData)
      toast({
        title: "Pen Group Created",
        description: "The new pen group has been successfully created.",
      })
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{batch ? "Edit Pen Group" : "Create New Pen Group"}</DialogTitle>
          <DialogDescription>
            {batch ? "Update pen group information" : "Create a new purchase pen group"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Pen Group Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Fall 2024 Steers"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feederLoanNumber">Feeder Loan Number</Label>
                <Input
                  id="feederLoanNumber"
                  value={formData.feederLoanNumber}
                  onChange={(e) => setFormData({ ...formData, feederLoanNumber: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date *</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier *</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Supplier name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="headCount">Head Count *</Label>
                <Input
                  id="headCount"
                  type="number"
                  min="1"
                  value={formData.headCount}
                  onChange={(e) => setFormData({ ...formData, headCount: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="averagePurchaseWeight">Avg Weight (lbs) *</Label>
                <Input
                  id="averagePurchaseWeight"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.averagePurchaseWeight}
                  onChange={(e) =>
                    setFormData({ ...formData, averagePurchaseWeight: e.target.value })
                  }
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchasePricePerPound">Price per Pound ($/lb) *</Label>
                <Input
                  id="purchasePricePerPound"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.purchasePricePerPound}
                  onChange={(e) =>
                    setFormData({ ...formData, purchasePricePerPound: e.target.value })
                  }
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {formData.headCount && formData.averagePurchaseWeight && formData.purchasePricePerPound && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Total Investment: $
                  {(
                    parseInt(formData.headCount || "0") *
                    parseFloat(formData.averagePurchaseWeight || "0") *
                    parseFloat(formData.purchasePricePerPound || "0")
                  ).toLocaleString()}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this pen group..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{batch ? "Update" : "Create"} Pen Group</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

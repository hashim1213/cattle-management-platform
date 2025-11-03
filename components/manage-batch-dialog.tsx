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
    averagePurchasePrice: "",
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
        averagePurchasePrice: batch.averagePurchasePrice.toString(),
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
        averagePurchasePrice: "",
        notes: "",
      })
    }
  }, [batch, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const headCount = parseInt(formData.headCount)
    const avgWeight = parseFloat(formData.averagePurchaseWeight)
    const avgPrice = parseFloat(formData.averagePurchasePrice)
    const totalInvestment = headCount * avgPrice

    const batchData = {
      name: formData.name,
      feederLoanNumber: formData.feederLoanNumber || undefined,
      purchaseDate: formData.purchaseDate,
      supplier: formData.supplier,
      headCount,
      averagePurchaseWeight: avgWeight,
      averagePurchasePrice: avgPrice,
      totalInvestment,
      cattleIds: batch?.cattleIds || [],
      notes: formData.notes || undefined,
    }

    if (batch) {
      updateBatch(batch.id, batchData)
      toast({
        title: "Batch Updated",
        description: "The batch has been successfully updated.",
      })
    } else {
      addBatch(batchData)
      toast({
        title: "Batch Created",
        description: "The new batch has been successfully created.",
      })
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{batch ? "Edit Batch" : "Create New Batch"}</DialogTitle>
          <DialogDescription>
            {batch ? "Update batch information" : "Create a new purchase batch/group"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Batch Name *</Label>
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
                <Label htmlFor="averagePurchasePrice">Avg Price ($) *</Label>
                <Input
                  id="averagePurchasePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.averagePurchasePrice}
                  onChange={(e) =>
                    setFormData({ ...formData, averagePurchasePrice: e.target.value })
                  }
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {formData.headCount && formData.averagePurchasePrice && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Total Investment: $
                  {(
                    parseInt(formData.headCount || "0") *
                    parseFloat(formData.averagePurchasePrice || "0")
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
                placeholder="Additional notes about this batch..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{batch ? "Update" : "Create"} Batch</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

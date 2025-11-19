"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useBatchStore } from "@/hooks/use-batch-store"
import { useCostCalculator } from "@/hooks/use-cost-calculator"
import { firebaseDataStore as dataStore } from "@/lib/data-store-firebase"
import { DollarSign, TrendingUp, Package, Users, Calendar, ScanLine } from "lucide-react"
import { RFIDImageImportDialog } from "@/components/rfid-image-import-dialog"

interface BatchDetailsDialogProps {
  batchId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BatchDetailsDialog({ batchId, open, onOpenChange }: BatchDetailsDialogProps) {
  const { getBatch } = useBatchStore()
  const { calculateCattleCosts } = useCostCalculator()
  const [isRFIDImportOpen, setIsRFIDImportOpen] = useState(false)

  if (!batchId) return null

  const batch = getBatch(batchId)
  if (!batch) return null

  // Get all cattle in this batch
  const cattle = dataStore.getCattleSync().filter((c) => batch.cattleIds.includes(c.id))

  // Calculate batch-level costs
  const activeCattle = cattle.filter((c) => c.status === "Active")
  const soldCattle = cattle.filter((c) => c.status === "Sold")

  let totalCurrentValue = 0
  let totalFeedCost = 0
  let totalTreatmentCost = 0
  let totalWeightGain = 0

  activeCattle.forEach((animal) => {
    const costs = calculateCattleCosts(animal.id)
    if (costs) {
      totalCurrentValue += costs.estimatedMarketValue
      totalFeedCost += costs.feedCost
      totalTreatmentCost += costs.treatmentCost
      totalWeightGain += costs.totalWeightGain || 0
    }
  })

  const batchInvestment = batch.totalInvestment ||
    (batch.headCount * batch.averagePurchaseWeight * batch.purchasePricePerPound) ||
    (batch.headCount * (batch.averagePurchasePrice || 0)) || 0
  const totalCosts = batchInvestment + totalFeedCost + totalTreatmentCost
  const currentProfitLoss = totalCurrentValue - totalCosts
  const roi = totalCosts > 0 ? ((currentProfitLoss / totalCosts) * 100) : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2 flex-wrap">
                {batch.name}
                {batch.feederLoanNumber && (
                  <Badge variant="outline">Loan #{batch.feederLoanNumber}</Badge>
                )}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Purchased from {batch.supplier} on{" "}
                {new Date(batch.purchaseDate).toLocaleDateString()}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRFIDImportOpen(true)}
              className="shrink-0"
            >
              <ScanLine className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Import RFID</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Financial Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Initial Investment
                  </p>
                  <p className="text-lg font-bold">
                    ${batchInvestment.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    Feed Costs
                  </p>
                  <p className="text-lg font-bold">${totalFeedCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Current Value
                  </p>
                  <p className="text-lg font-bold">${totalCurrentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
              </CardContent>
            </Card>

            <Card className={currentProfitLoss >= 0 ? "border-green-500" : "border-red-500"}>
              <CardContent className="p-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Profit/Loss
                  </p>
                  <p className={`text-lg font-bold ${currentProfitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                    ${Math.abs(currentProfitLoss).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pen Group Stats */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Pen Group Statistics</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Original Head Count</p>
                  <p className="text-xl font-bold">{batch.headCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Cattle</p>
                  <p className="text-xl font-bold text-green-600">{activeCattle.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sold</p>
                  <p className="text-xl font-bold text-blue-600">{soldCattle.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Purchase Weight</p>
                  <p className="text-xl font-bold">{batch.averagePurchaseWeight} lbs</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Purchase Price</p>
                  <p className="text-xl font-bold">${batch.averagePurchasePrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Weight Gain</p>
                  <p className="text-xl font-bold">{totalWeightGain.toFixed(0)} lbs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Performance Metrics</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Cost Per Head</p>
                  <p className="text-lg font-bold">
                    ${(totalCosts / activeCattle.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Treatment Cost</p>
                  <p className="text-lg font-bold">${totalTreatmentCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Costs</p>
                  <p className="text-lg font-bold">${totalCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ROI</p>
                  <p className={`text-lg font-bold ${roi >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {roi.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {batch.notes && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground">{batch.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>

      {/* RFID Image Import Dialog */}
      <RFIDImageImportDialog
        open={isRFIDImportOpen}
        onOpenChange={setIsRFIDImportOpen}
        defaultBatchId={batchId}
      />
    </Dialog>
  )
}

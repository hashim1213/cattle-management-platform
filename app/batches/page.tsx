"use client"

import { useState } from "react"
import { Plus, Package, DollarSign, TrendingUp, Edit, Trash2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useBatchStore } from "@/hooks/use-batch-store"
import { useToast } from "@/hooks/use-toast"
import { ManageBatchDialog } from "@/components/manage-batch-dialog"
import { BatchDetailsDialog } from "@/components/batch-details-dialog"
import type { Batch } from "@/lib/batch-store"

export default function BatchesPage() {
  const { batches, deleteBatch } = useBatchStore()
  const { toast } = useToast()

  const [manageBatchDialogOpen, setManageBatchDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null)
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)

  const handleAddBatch = () => {
    setEditingBatch(null)
    setManageBatchDialogOpen(true)
  }

  const handleEditBatch = (batch: Batch) => {
    setEditingBatch(batch)
    setManageBatchDialogOpen(true)
  }

  const handleDeleteBatch = (batchId: string) => {
    if (confirm("Are you sure you want to delete this batch? This action cannot be undone.")) {
      deleteBatch(batchId)
      toast({
        title: "Batch Deleted",
        description: "The batch has been successfully removed.",
      })
    }
  }

  const handleViewDetails = (batchId: string) => {
    setSelectedBatchId(batchId)
    setDetailsDialogOpen(true)
  }

  // Calculate totals
  const totalBatches = batches.length
  const totalHeadCount = batches.reduce((sum, b) => sum + b.headCount, 0)
  const totalInvestment = batches.reduce((sum, b) => sum + (b.totalInvestment || (b.headCount * b.averagePurchasePrice) || 0), 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Batch Management</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Track purchase groups and profitability
              </p>
            </div>
            <Button size="sm" onClick={handleAddBatch}>
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">New Batch</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Total Batches</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{totalBatches}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Total Head Count</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{totalHeadCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 lg:col-span-1">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Total Investment</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold">
                  ${totalInvestment.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Batches List */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Batches</CardTitle>
            <CardDescription>
              Manage cattle purchase groups and track profitability by batch
            </CardDescription>
          </CardHeader>
          <CardContent>
            {batches.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No batches yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first purchase batch to start tracking profitability
                </p>
                <Button onClick={handleAddBatch}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Batch
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {batches.map((batch) => (
                  <div
                    key={batch.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{batch.name}</h3>
                        {batch.feederLoanNumber && (
                          <Badge variant="outline" className="text-xs">
                            Loan #{batch.feederLoanNumber}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Supplier:</span>
                          <span className="ml-1 font-medium">{batch.supplier}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date:</span>
                          <span className="ml-1 font-medium">
                            {new Date(batch.purchaseDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Head:</span>
                          <span className="ml-1 font-medium">{batch.headCount}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Investment:</span>
                          <span className="ml-1 font-medium">
                            ${(batch.totalInvestment || batch.headCount * batch.averagePurchasePrice || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(batch.id)}
                      >
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditBatch(batch)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteBatch(batch.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Dialogs */}
      <ManageBatchDialog
        batch={editingBatch}
        open={manageBatchDialogOpen}
        onOpenChange={setManageBatchDialogOpen}
      />

      <BatchDetailsDialog
        batchId={selectedBatchId}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />
    </div>
  )
}

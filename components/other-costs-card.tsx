"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, Download, Trash2, Upload } from "lucide-react"
import { otherCostsService, type OtherCost } from "@/lib/other-costs-service"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { AddOtherCostDialog } from "./add-other-cost-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const CATEGORY_LABELS: Record<OtherCost["category"], string> = {
  labour: "Labour",
  utilities: "Utilities",
  equipment: "Equipment",
  maintenance: "Maintenance",
  transportation: "Transportation",
  insurance: "Insurance",
  taxes: "Property Taxes",
  veterinary: "Veterinary Services",
  other: "Other",
}

const CATEGORY_COLORS: Record<OtherCost["category"], string> = {
  labour: "bg-blue-100 text-blue-800",
  utilities: "bg-yellow-100 text-yellow-800",
  equipment: "bg-purple-100 text-purple-800",
  maintenance: "bg-orange-100 text-orange-800",
  transportation: "bg-green-100 text-green-800",
  insurance: "bg-indigo-100 text-indigo-800",
  taxes: "bg-red-100 text-red-800",
  veterinary: "bg-pink-100 text-pink-800",
  other: "bg-gray-100 text-gray-800",
}

export function OtherCostsCard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [costs, setCosts] = useState<OtherCost[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [quickCategory, setQuickCategory] = useState<OtherCost["category"] | undefined>()
  const [quickDescription, setQuickDescription] = useState<string | undefined>()

  const loadCosts = async () => {
    if (!user) return

    try {
      const allCosts = await otherCostsService.getAllCosts(user.uid)
      setCosts(allCosts)
    } catch (error) {
      console.error("Failed to load costs:", error)
      toast({
        title: "Error",
        description: "Failed to load costs. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCosts()
  }, [user])

  const handleDelete = async () => {
    if (!user || !deleteId) return

    try {
      await otherCostsService.deleteCost(user.uid, deleteId)
      await loadCosts()
      toast({
        title: "Cost deleted",
        description: "The cost record has been deleted successfully.",
      })
    } catch (error) {
      console.error("Failed to delete cost:", error)
      toast({
        title: "Error",
        description: "Failed to delete cost. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteId(null)
    }
  }

  const handleAddCost = async () => {
    await loadCosts()
    setIsAddDialogOpen(false)
    setQuickCategory(undefined)
    setQuickDescription(undefined)
  }

  const handleQuickAdd = (category: OtherCost["category"], description: string) => {
    setQuickCategory(category)
    setQuickDescription(description)
    setIsAddDialogOpen(true)
  }

  const totalCosts = otherCostsService.calculateTotal(costs)
  const costsByCategory = otherCostsService.calculateTotalByCategory(costs)

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Operating Costs</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Track labour, utilities, equipment, and other farm expenses
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Quick Add Buttons */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAdd("labour", "Weekly wages")}
                className="gap-1"
              >
                👷 Wages
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAdd("transportation", "Fuel")}
                className="gap-1"
              >
                ⛽ Fuel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAdd("utilities", "Electric bill")}
                className="gap-1"
              >
                ⚡ Utilities
              </Button>
              <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Cost
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : costs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No operating costs recorded yet</p>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Cost
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary by Category */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(costsByCategory).map(([category, amount]) => (
                  <div key={category} className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">
                      {CATEGORY_LABELS[category as OtherCost["category"]]}
                    </p>
                    <p className="text-lg font-bold text-foreground">${amount.toFixed(0)}</p>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-foreground">Total Operating Costs:</span>
                  <span className="text-2xl font-bold text-primary">${totalCosts.toFixed(2)}</span>
                </div>
              </div>

              {/* Cost Records Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Payee</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costs.map((cost) => (
                      <TableRow key={cost.id}>
                        <TableCell className="font-medium">{cost.date}</TableCell>
                        <TableCell>
                          <Badge className={CATEGORY_COLORS[cost.category]} variant="outline">
                            {CATEGORY_LABELS[cost.category]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{cost.description}</p>
                            {cost.notes && (
                              <p className="text-xs text-muted-foreground mt-1">{cost.notes}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{cost.payee || "-"}</TableCell>
                        <TableCell className="text-right font-semibold">${cost.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {cost.invoiceUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="h-8 w-8 p-0"
                              >
                                <a href={cost.invoiceUrl} target="_blank" rel="noopener noreferrer">
                                  <FileText className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteId(cost.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AddOtherCostDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleAddCost}
        quickCategory={quickCategory}
        quickDescription={quickDescription}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cost Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this cost record? This action cannot be undone.
              {costs.find(c => c.id === deleteId)?.invoiceUrl && (
                <span className="block mt-2 text-amber-600">
                  The attached invoice will also be deleted.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

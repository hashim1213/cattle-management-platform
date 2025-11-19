"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowDown, ArrowUp, TrendingDown, TrendingUp, Calendar } from "lucide-react"
import { InventoryItem, InventoryTransaction } from "@/lib/inventory/inventory-types"
import { inventoryService } from "@/lib/inventory/inventory-service"

interface InventoryTransactionsDialogProps {
  open: boolean
  onClose: () => void
  item?: InventoryItem | null
}

export function InventoryTransactionsDialog({ open, onClose, item }: InventoryTransactionsDialogProps) {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<InventoryTransaction[]>([])
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")

  useEffect(() => {
    if (open) {
      loadTransactions()
    }
  }, [open, item])

  useEffect(() => {
    applyFilters()
  }, [transactions, typeFilter, dateFilter])

  const loadTransactions = async () => {
    if (item) {
      // Get transactions for specific item
      const itemTransactions = await inventoryService.getItemTransactions(item.id)
      setTransactions(itemTransactions)
    } else {
      // Get all transactions
      const allTransactions = await inventoryService.getTransactions()
      setTransactions(allTransactions)
    }
  }

  const applyFilters = () => {
    let filtered = (transactions || []).slice()

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.type === typeFilter)
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      const cutoff = new Date()

      switch (dateFilter) {
        case "today":
          cutoff.setHours(0, 0, 0, 0)
          break
        case "week":
          cutoff.setDate(now.getDate() - 7)
          break
        case "month":
          cutoff.setMonth(now.getMonth() - 1)
          break
        case "quarter":
          cutoff.setMonth(now.getMonth() - 3)
          break
      }

      filtered = filtered.filter((t) => new Date(t.timestamp) >= cutoff)
    }

    setFilteredTransactions(filtered)
  }

  const getTransactionIcon = (type: InventoryTransaction["type"]) => {
    switch (type) {
      case "purchase":
      case "return":
        return <ArrowUp className="h-4 w-4 text-green-600" />
      case "usage":
      case "waste":
        return <ArrowDown className="h-4 w-4 text-red-600" />
      case "adjustment":
        return <TrendingUp className="h-4 w-4 text-blue-600" />
      default:
        return <TrendingDown className="h-4 w-4 text-gray-600" />
    }
  }

  const getTransactionBadgeColor = (type: InventoryTransaction["type"]) => {
    switch (type) {
      case "purchase":
      case "return":
        return "bg-green-100 text-green-800"
      case "usage":
        return "bg-blue-100 text-blue-800"
      case "waste":
        return "bg-red-100 text-red-800"
      case "adjustment":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const totalUsage = filteredTransactions
    .filter((t) => t.quantityChange < 0)
    .reduce((sum, t) => sum + Math.abs(t.quantityChange), 0)

  const totalAdded = filteredTransactions
    .filter((t) => t.quantityChange > 0)
    .reduce((sum, t) => sum + t.quantityChange, 0)

  const totalCostImpact = filteredTransactions.reduce((sum, t) => sum + (t.costImpact || 0), 0)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {item ? `Transaction History - ${item.name}` : "All Inventory Transactions"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Summary Cards */}
          {filteredTransactions.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Added</p>
                      <p className="text-lg font-bold text-green-600">
                        +{totalAdded.toLocaleString()} {item?.unit || "units"}
                      </p>
                    </div>
                    <ArrowUp className="h-6 w-6 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Used</p>
                      <p className="text-lg font-bold text-red-600">
                        -{totalUsage.toLocaleString()} {item?.unit || "units"}
                      </p>
                    </div>
                    <ArrowDown className="h-6 w-6 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Cost Impact</p>
                      <p className="text-lg font-bold">
                        ${Math.abs(totalCostImpact).toLocaleString()}
                      </p>
                    </div>
                    <TrendingDown className="h-6 w-6 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="text-xs">Transaction Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="usage">Usage</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                  <SelectItem value="waste">Waste</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Label className="text-xs">Date Range</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="quarter">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transactions List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredTransactions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions found</p>
                  <p className="text-sm">
                    {typeFilter !== "all" || dateFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Transactions will appear here as inventory changes"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredTransactions.map((transaction) => (
                <Card key={transaction.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="py-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getTransactionIcon(transaction.type)}</div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{transaction.itemName}</span>
                              <Badge className={`text-xs ${getTransactionBadgeColor(transaction.type)}`}>
                                {transaction.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{transaction.reason}</p>
                          </div>

                          <div className="text-right">
                            <div
                              className={`font-semibold ${
                                transaction.quantityChange > 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {transaction.quantityChange > 0 ? "+" : ""}
                              {transaction.quantityChange.toLocaleString()} {transaction.unit}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ${Math.abs(transaction.costImpact || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div>
                            <span className="font-mono">
                              {transaction.quantityBefore.toLocaleString()} →{" "}
                              {transaction.quantityAfter.toLocaleString()} {transaction.unit}
                            </span>
                          </div>

                          <div>
                            <span>By {transaction.performedBy}</span>
                            <span className="mx-2">•</span>
                            <span>{new Date(transaction.timestamp).toLocaleString()}</span>
                          </div>
                        </div>

                        {transaction.relatedRecordType && (
                          <div className="mt-2 text-xs">
                            <Badge variant="outline" className="text-xs">
                              Linked to {transaction.relatedRecordType.replace("_", " ")}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

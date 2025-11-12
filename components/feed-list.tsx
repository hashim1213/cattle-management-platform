"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, AlertTriangle, CheckCircle2, Minus, Plus } from "lucide-react"
import { type FeedInventory } from "@/lib/data-store-firebase"

interface FeedListProps {
  feedInventory: FeedInventory[]
  onRecordUsage: (feed: FeedInventory) => void
  onAddStock: (feed: FeedInventory) => void
}

const getDaysRemaining = (feed: FeedInventory) => {
  if (feed.dailyUsage === 0) return 999
  return Math.floor(feed.quantity / feed.dailyUsage)
}

const getStatusInfo = (daysRemaining: number) => {
  if (daysRemaining < 7) {
    return { color: "bg-red-500", textColor: "text-red-700", status: "Critical", icon: AlertTriangle }
  } else if (daysRemaining < 14) {
    return { color: "bg-amber-500", textColor: "text-amber-700", status: "Low", icon: AlertTriangle }
  } else {
    return { color: "bg-green-500", textColor: "text-green-700", status: "Good", icon: CheckCircle2 }
  }
}

export function FeedList({ feedInventory, onRecordUsage, onAddStock }: FeedListProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-foreground w-16"></th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Feed Name</th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Current Stock</th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Daily Usage</th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Days Left</th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Status</th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Cost/Unit</th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Total Value</th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {feedInventory.map((feed) => {
                const daysRemaining = getDaysRemaining(feed)
                const statusInfo = getStatusInfo(daysRemaining)
                const StatusIcon = statusInfo.icon

                return (
                  <tr
                    key={feed.id}
                    className={`hover:bg-muted/50 transition-colors ${
                      daysRemaining < 7 ? "bg-red-50/50" : ""
                    }`}
                  >
                    <td className="p-4">
                      <div className={`h-10 w-10 rounded-full ${statusInfo.color} flex items-center justify-center`}>
                        <Package className="h-5 w-5 text-white" />
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-foreground">{feed.name}</td>
                    <td className="p-4 text-sm text-foreground">
                      <div className="font-medium">
                        {feed.quantity.toLocaleString()} {feed.unit}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {feed.dailyUsage} {feed.unit}
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="font-medium">
                        {daysRemaining} days
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-4 w-4 ${statusInfo.textColor}`} />
                        <Badge
                          variant="default"
                          className={
                            daysRemaining < 7
                              ? "bg-red-100 text-red-800 hover:bg-red-100"
                              : daysRemaining < 14
                                ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                : "bg-green-100 text-green-800 hover:bg-green-100"
                          }
                        >
                          {statusInfo.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium text-foreground">${feed.costPerUnit.toFixed(2)}</td>
                    <td className="p-4 text-sm font-bold text-foreground">
                      ${(feed.quantity * feed.costPerUnit).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRecordUsage(feed)}
                          className="flex items-center gap-1"
                        >
                          <Minus className="h-3 w-3" />
                          Usage
                        </Button>
                        <Button size="sm" onClick={() => onAddStock(feed)} className="flex items-center gap-1">
                          <Plus className="h-3 w-3" />
                          Add
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

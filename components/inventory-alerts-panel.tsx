"use client"

import { AlertTriangle, Clock, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InventoryAlert } from "@/lib/inventory/inventory-types"
import { inventoryService } from "@/lib/inventory/inventory-service"

interface InventoryAlertsPanelProps {
  alerts: InventoryAlert[]
}

export function InventoryAlertsPanel({ alerts }: InventoryAlertsPanelProps) {
  if (alerts.length === 0) {
    return null
  }

  const handleResolveAlert = (alertId: string) => {
    inventoryService.resolveAlert(alertId)
  }

  const getAlertIcon = (type: InventoryAlert["alertType"]) => {
    switch (type) {
      case "expired":
      case "low_stock":
        return AlertTriangle
      case "expiring_soon":
        return Clock
      default:
        return AlertTriangle
    }
  }

  const getAlertColor = (severity: InventoryAlert["severity"]) => {
    return severity === "critical" ? "border-red-500 bg-red-50" : "border-amber-500 bg-amber-50"
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Active Alerts ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {alerts.map((alert) => {
            const Icon = getAlertIcon(alert.alertType)

            return (
              <div
                key={alert.id}
                className={`flex items-center justify-between p-3 rounded-lg border-2 ${getAlertColor(
                  alert.severity
                )}`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{alert.itemName}</span>
                      <Badge
                        variant={alert.severity === "critical" ? "destructive" : "outline"}
                        className="text-xs"
                      >
                        {alert.severity}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {alert.alertType.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground/80">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.createdAt).toLocaleDateString()} at{" "}
                      {new Date(alert.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResolveAlert(alert.id)}
                  className="ml-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

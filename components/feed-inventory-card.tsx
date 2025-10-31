import { Package, AlertTriangle, TrendingDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface FeedInventoryCardProps {
  name: string
  quantity: number
  unit: string
  daysRemaining: number
  costPerUnit: number
  totalValue: number
  status: "good" | "warning" | "low"
}

export function FeedInventoryCard({
  name,
  quantity,
  unit,
  daysRemaining,
  costPerUnit,
  totalValue,
  status,
}: FeedInventoryCardProps) {
  const statusConfig = {
    good: {
      badge: "Good Supply",
      badgeClass: "bg-green-100 text-green-800 hover:bg-green-100",
      icon: Package,
      iconClass: "text-green-600",
    },
    warning: {
      badge: "Low Stock",
      badgeClass: "bg-amber-100 text-amber-800 hover:bg-amber-100",
      icon: AlertTriangle,
      iconClass: "text-amber-600",
    },
    low: {
      badge: "Critical",
      badgeClass: "bg-red-100 text-red-800 hover:bg-red-100",
      icon: TrendingDown,
      iconClass: "text-red-600",
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className={cn("h-5 w-5", config.iconClass)} />
          </div>
          <Badge className={config.badgeClass}>{config.badge}</Badge>
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg text-foreground">{name}</h3>
            <p className="text-2xl font-bold text-foreground mt-1">
              {quantity.toLocaleString()} {unit}
            </p>
          </div>

          <div className="pt-3 border-t border-border space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Days Remaining</span>
              <span className="font-medium text-foreground">{daysRemaining} days</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cost per {unit}</span>
              <span className="font-medium text-foreground">${costPerUnit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Value</span>
              <span className="font-medium text-foreground">${totalValue.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

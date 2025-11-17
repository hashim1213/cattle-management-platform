import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string
  change: string
  trend: "up" | "down" | "neutral"
  icon: LucideIcon
}

export function MetricCard({ title, value, change, trend, icon: Icon }: MetricCardProps) {
  const trendConfig = {
    up: {
      icon: TrendingUp,
      color: "text-red-600",
    },
    down: {
      icon: TrendingDown,
      color: "text-red-600",
    },
    neutral: {
      icon: Minus,
      color: "text-muted-foreground",
    },
  }

  const TrendIcon = trendConfig[trend].icon

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <TrendIcon className={cn("h-4 w-4 flex-shrink-0", trendConfig[trend].color)} />
        </div>
        <div className="space-y-1">
          <p className="text-xs sm:text-sm text-muted-foreground">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-foreground break-all">{value}</p>
          <p className="text-xs text-muted-foreground">{change}</p>
        </div>
      </CardContent>
    </Card>
  )
}

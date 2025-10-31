import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AlertCardProps {
  severity: "success" | "warning" | "danger"
  title: string
  description: string
  metric: string
}

export function AlertCard({ severity, title, description, metric }: AlertCardProps) {
  const severityConfig = {
    success: {
      icon: CheckCircle,
      bgColor: "bg-green-50",
      borderColor: "border-l-green-600",
      iconColor: "text-green-600",
      textColor: "text-green-900",
    },
    warning: {
      icon: AlertCircle,
      bgColor: "bg-amber-50",
      borderColor: "border-l-amber-600",
      iconColor: "text-amber-600",
      textColor: "text-amber-900",
    },
    danger: {
      icon: AlertTriangle,
      bgColor: "bg-red-50",
      borderColor: "border-l-red-600",
      iconColor: "text-red-600",
      textColor: "text-red-900",
    },
  }

  const config = severityConfig[severity]
  const Icon = config.icon

  return (
    <Card className={cn("border-l-4", config.borderColor, config.bgColor)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Icon className={cn("h-5 w-5 mt-0.5", config.iconColor)} />
          <div className="flex-1 space-y-1">
            <h3 className={cn("font-semibold text-sm", config.textColor)}>{title}</h3>
            <p className="text-xs text-muted-foreground">{description}</p>
            <p className={cn("text-sm font-medium mt-2", config.textColor)}>{metric}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

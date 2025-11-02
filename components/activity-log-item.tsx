"use client"

import { Badge } from "@/components/ui/badge"
import { Building2, Beef, ListTodo, MapPin, Activity as ActivityIcon } from "lucide-react"
import type { Activity } from "@/lib/activity-store"

interface ActivityLogItemProps {
  activity: Activity
}

export function ActivityLogItem({ activity }: ActivityLogItemProps) {
  const getEntityIcon = () => {
    switch (activity.entityType) {
      case "pen":
        return <Building2 className="h-4 w-4" />
      case "barn":
        return <Building2 className="h-4 w-4" />
      case "cattle":
        return <Beef className="h-4 w-4" />
      case "task":
        return <ListTodo className="h-4 w-4" />
      default:
        return <ActivityIcon className="h-4 w-4" />
    }
  }

  const getActivityTypeColor = () => {
    switch (activity.type) {
      case "feeding":
        return "bg-green-100 text-green-800 border-green-300"
      case "cleaning":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "health-check":
      case "vet-visit":
        return "bg-red-100 text-red-800 border-red-300"
      case "maintenance":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "cattle-added":
      case "pen-created":
      case "barn-created":
        return "bg-purple-100 text-purple-800 border-purple-300"
      case "cattle-removed":
      case "pen-deleted":
      case "barn-deleted":
        return "bg-gray-100 text-gray-800 border-gray-300"
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    })
  }

  return (
    <div className="flex gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex-shrink-0 mt-1">
        <div className="p-2 bg-muted rounded-lg">
          {getEntityIcon()}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-2">
          <h3 className="font-semibold">{activity.title}</h3>
          <Badge variant="outline" className={`${getActivityTypeColor()} text-xs ml-auto flex-shrink-0`}>
            {activity.type.replace("-", " ")}
          </Badge>
        </div>

        {activity.description && (
          <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
        )}

        {activity.changes && activity.changes.length > 0 && (
          <div className="bg-muted/50 rounded p-2 mb-2 text-xs space-y-1">
            {activity.changes.map((change, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="font-medium">{change.field}:</span>
                {change.oldValue !== undefined && (
                  <>
                    <span className="text-muted-foreground line-through">{change.oldValue}</span>
                    <span>→</span>
                  </>
                )}
                <span className="text-green-600 font-medium">{change.newValue}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            👤 {activity.performedBy}
          </span>

          {activity.entityName && (
            <span className="flex items-center gap-1">
              <Badge variant="secondary" className="text-xs">
                {activity.entityType}: {activity.entityName}
              </Badge>
            </span>
          )}

          <span className="flex items-center gap-1">
            🕒 {formatTimestamp(activity.timestamp)}
          </span>
        </div>
      </div>
    </div>
  )
}

"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Beef, Activity, TrendingUp, DollarSign } from "lucide-react"

export function CattleStats() {
  const stats = [
    {
      label: "Total Head",
      value: "247",
      subtext: "Active cattle",
      icon: Beef,
      color: "text-primary",
    },
    {
      label: "Avg Daily Gain",
      value: "2.8 lbs",
      subtext: "Last 30 days",
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      label: "Health Status",
      value: "98%",
      subtext: "Healthy cattle",
      icon: Activity,
      color: "text-blue-600",
    },
    {
      label: "Total Value",
      value: "$412,450",
      subtext: "Current inventory",
      icon: DollarSign,
      color: "text-amber-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.subtext}</p>
              </div>
              <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

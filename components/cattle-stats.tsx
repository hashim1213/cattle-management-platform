"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Beef, Activity, TrendingUp, DollarSign, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { firebaseDataStore } from "@/lib/data-store-firebase"

export function CattleStats() {
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState({
    totalCattle: 0,
    activeCattle: 0,
    healthyCount: 0,
    avgDailyGain: 0,
    totalValue: 0,
  })

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await firebaseDataStore.getAnalytics()
        setAnalytics(data)
      } catch (error) {
        console.error("Failed to load cattle stats:", error)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const healthPercentage = analytics.activeCattle > 0
    ? Math.round((analytics.healthyCount / analytics.activeCattle) * 100)
    : 0

  const stats = [
    {
      label: "Total Head",
      value: analytics.activeCattle.toString(),
      subtext: "Active cattle",
      icon: Beef,
      color: "text-primary",
    },
    {
      label: "Avg Daily Gain",
      value: `${analytics.avgDailyGain.toFixed(1)} lbs`,
      subtext: "Per animal",
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      label: "Health Status",
      value: `${healthPercentage}%`,
      subtext: "Healthy cattle",
      icon: Activity,
      color: "text-blue-600",
    },
    {
      label: "Total Value",
      value: `$${analytics.totalValue.toLocaleString()}`,
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

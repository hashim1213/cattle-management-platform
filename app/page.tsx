"use client"

import { useEffect, useState } from "react"
import { TrendingUp, Package, DollarSign, Plus, Download, Sprout, MapPin, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCard } from "@/components/alert-card"
import { MetricCard } from "@/components/metric-card"
import { QuickEntryDialog } from "@/components/quick-entry-dialog"
import Link from "next/link"
import Image from "next/image"
import { dataStore } from "@/lib/data-store"
import { exportToCSV, generateCattleReport } from "@/lib/export-utils"

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])

  useEffect(() => {
    // Load analytics
    const data = dataStore.getAnalytics()
    setAnalytics(data)

    // Generate alerts
    const feed = dataStore.getFeedInventory()
    const newAlerts = []

    // Feed inventory alerts
    feed.forEach((f) => {
      const daysRemaining = f.dailyUsage > 0 ? f.quantity / f.dailyUsage : 999
      if (daysRemaining < 7) {
        newAlerts.push({
          id: `feed-${f.id}`,
          severity: daysRemaining < 3 ? "danger" : "warning",
          title: `Low ${f.name} Inventory`,
          description: `${f.name} below 7 days supply`,
          metric: `${Math.floor(daysRemaining)} days remaining`,
        })
      }
    })

    // Cost of gain alert
    if (data.costPerHead > 1800) {
      newAlerts.push({
        id: "cost-high",
        severity: "warning",
        title: "High Cost Per Head",
        description: "Current cost exceeds target",
        metric: `$${data.costPerHead.toFixed(0)}`,
      })
    }

    // Health status alert
    const cattle = dataStore.getCattle()
    const healthyCattle = cattle.filter((c) => c.healthStatus === "Healthy" && c.status === "Active")
    if (healthyCattle.length === cattle.filter((c) => c.status === "Active").length) {
      newAlerts.push({
        id: "health-good",
        severity: "success",
        title: "Cattle Health Good",
        description: "All cattle healthy",
        metric: `${healthyCattle.length} head`,
      })
    }

    setAlerts(newAlerts)
  }, [])

  const handleExportCattle = () => {
    const cattle = dataStore.getCattle()
    const report = generateCattleReport(cattle)
    exportToCSV(report, "cattle-inventory")
  }

  if (!analytics) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  const metrics = [
    {
      title: "Total Cattle",
      value: analytics.totalCattle.toString(),
      change: "Active herd",
      trend: "neutral" as const,
      icon: Package,
    },
    {
      title: "Inventory Value",
      value: `$${analytics.totalInventoryValue.toLocaleString()}`,
      change: "Current market value",
      trend: "up" as const,
      icon: DollarSign,
    },
    {
      title: "Avg Cost Per Head",
      value: `$${analytics.costPerHead.toFixed(0)}`,
      change: "Total costs / head",
      trend: analytics.costPerHead > 1800 ? "up" : "neutral",
      icon: DollarSign,
    },
    {
      title: "Avg Daily Gain",
      value: `${analytics.avgDailyGain.toFixed(1)} lbs`,
      change: "30-day average",
      trend: analytics.avgDailyGain > 2.5 ? "up" : "neutral",
      icon: TrendingUp,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Comprehensive herd overview</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCattle}>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <QuickEntryDialog />
              <Link href="/cattle">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Cattle
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6 space-y-6">
        {/* Production Lifecycle */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-foreground">Production Lifecycle</h2>
          <Card>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                <div className="flex flex-col items-center text-center">
                  <div className="relative w-24 h-24 mb-3">
                    <Image src="/images/breeding.png" alt="Breeding" fill className="object-contain" />
                  </div>
                  <h3 className="font-semibold text-foreground">Breeding</h3>
                  <p className="text-sm text-muted-foreground">{analytics.cows.exposed} exposed</p>
                </div>

                <div className="flex justify-center">
                  <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="relative w-24 h-24 mb-3">
                    <Image src="/images/pregnancy.png" alt="Pregnancy" fill className="object-contain" />
                  </div>
                  <h3 className="font-semibold text-foreground">Pregnancy Check</h3>
                  <p className="text-sm text-muted-foreground">{analytics.cows.pregnant} pregnant</p>
                </div>

                <div className="flex justify-center">
                  <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="relative w-24 h-24 mb-3">
                    <Image src="/images/calf.png" alt="Calving" fill className="object-contain" />
                  </div>
                  <h3 className="font-semibold text-foreground">Calving</h3>
                  <p className="text-sm text-muted-foreground">{analytics.calves.unweaned} calves</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center mt-8">
                <div className="flex flex-col items-center text-center md:col-start-1">
                  <div className="relative w-24 h-24 mb-3">
                    <Image src="/images/weaning.png" alt="Weaning" fill className="object-contain" />
                  </div>
                  <h3 className="font-semibold text-foreground">Weaning</h3>
                  <p className="text-sm text-muted-foreground">{analytics.calves.weaned} weaned</p>
                </div>

                <div className="flex justify-center md:col-start-2">
                  <svg
                    className="w-8 h-8 text-primary rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                <div className="flex flex-col items-center text-center md:col-start-3">
                  <div className="relative w-24 h-24 mb-3">
                    <Image src="/images/yearling.png" alt="Yearling" fill className="object-contain" />
                  </div>
                  <h3 className="font-semibold text-foreground">Yearling</h3>
                  <p className="text-sm text-muted-foreground">Growing</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Herd Overview */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-foreground">Herd Overview</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-bold text-primary mb-2">{analytics.bulls.count}</p>
                    <p className="text-lg font-semibold text-foreground mb-2">Active Bulls</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{analytics.bulls.herdSires} herd sires</p>
                      <p>{analytics.bulls.herdSireProspects} prospects</p>
                    </div>
                  </div>
                  <div className="relative w-20 h-20">
                    <Image src="/images/bull.png" alt="Bull" fill className="object-contain opacity-70" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-bold text-primary mb-2">{analytics.cows.count}</p>
                    <p className="text-lg font-semibold text-foreground mb-2">Active Cows</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{analytics.cows.pregnant} pregnant</p>
                      <p>
                        {analytics.cows.open} open, {analytics.cows.exposed} exposed
                      </p>
                    </div>
                  </div>
                  <div className="relative w-20 h-20">
                    <Image src="/images/cow.png" alt="Cow" fill className="object-contain opacity-70" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-bold text-primary mb-2">{analytics.calves.count}</p>
                    <p className="text-lg font-semibold text-foreground mb-2">Active Calves</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{analytics.calves.unweaned} unweaned</p>
                      <p>{analytics.calves.weaned} weaned</p>
                    </div>
                  </div>
                  <div className="relative w-20 h-20">
                    <Image src="/images/calf.png" alt="Calf" fill className="object-contain opacity-70" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Alerts */}
        {alerts.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4 text-foreground">Status Alerts</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {alerts.map((alert) => (
                <AlertCard key={alert.id} {...alert} />
              ))}
            </div>
          </section>
        )}

        {/* Key Metrics */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-foreground">Key Metrics</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric, index) => (
              <MetricCard key={index} {...metric} />
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-foreground">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Link href="/cattle">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold">Manage Cattle</h3>
                  <p className="text-sm text-muted-foreground">View & edit herd</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/feed">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Sprout className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold">Feed Inventory</h3>
                  <p className="text-sm text-muted-foreground">Track feed levels</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/pastures">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-6 text-center">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold">Pastures</h3>
                  <p className="text-sm text-muted-foreground">Manage grazing</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/reports">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-6 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold">Reports</h3>
                  <p className="text-sm text-muted-foreground">Generate reports</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, DollarSign, TrendingUp, Package } from "lucide-react"
import { dataStore } from "@/lib/data-store"
import { exportToCSV, generateCattleReport, generateFinancialReport } from "@/lib/export-utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ReportsPage() {
  const [financialData, setFinancialData] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any>(null)

  useEffect(() => {
    const transactions = dataStore.getTransactions()
    const financial = generateFinancialReport(transactions)
    setFinancialData(financial)
    setAnalytics(dataStore.getAnalytics())
  }, [])

  const handleExportCattle = () => {
    const cattle = dataStore.getCattle()
    const report = generateCattleReport(cattle)
    exportToCSV(report, "cattle-inventory")
  }

  const handleExportFinancial = () => {
    if (financialData) {
      exportToCSV(financialData.transactions, "financial-report")
    }
  }

  const handleExportFeed = () => {
    const feed = dataStore.getFeedInventory()
    exportToCSV(feed, "feed-inventory")
  }

  const handleExportPastures = () => {
    const pastures = dataStore.getPastures()
    exportToCSV(pastures, "pasture-report")
  }

  if (!financialData || !analytics) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-sm text-muted-foreground">Export data and view comprehensive reports</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6 space-y-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="production">Production</TabsTrigger>
            <TabsTrigger value="exports">Data Exports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${financialData.totalIncome.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">From cattle sales</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${financialData.totalExpenses.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Operating costs</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${financialData.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    ${financialData.netProfit.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">{financialData.profitMargin.toFixed(1)}% margin</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Herd Value</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${analytics.totalInventoryValue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">{analytics.totalCattle} head</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Average Cost Per Head</p>
                    <p className="text-2xl font-bold">${analytics.costPerHead.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Average Daily Gain</p>
                    <p className="text-2xl font-bold">{analytics.avgDailyGain.toFixed(2)} lbs</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Feed Costs</p>
                    <p className="text-2xl font-bold">${analytics.feedCosts.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ROI</p>
                    <p className="text-2xl font-bold">
                      {financialData.totalIncome > 0
                        ? ((financialData.netProfit / financialData.totalExpenses) * 100).toFixed(1)
                        : "0"}
                      %
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Financial Summary</CardTitle>
                  <Button onClick={handleExportFinancial} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <span className="font-medium">Total Income</span>
                    <span className="text-lg font-bold text-green-600">
                      ${financialData.totalIncome.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <span className="font-medium">Total Expenses</span>
                    <span className="text-lg font-bold text-red-600">
                      ${financialData.totalExpenses.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
                    <span className="font-medium">Net Profit/Loss</span>
                    <span
                      className={`text-lg font-bold ${financialData.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      ${financialData.netProfit.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="production" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Bulls</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-bold">{analytics.bulls.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Herd Sires</span>
                      <span className="font-bold">{analytics.bulls.herdSires}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prospects</span>
                      <span className="font-bold">{analytics.bulls.herdSireProspects}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cows</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-bold">{analytics.cows.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pregnant</span>
                      <span className="font-bold">{analytics.cows.pregnant}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Open</span>
                      <span className="font-bold">{analytics.cows.open}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Exposed</span>
                      <span className="font-bold">{analytics.cows.exposed}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Calves</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-bold">{analytics.calves.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unweaned</span>
                      <span className="font-bold">{analytics.calves.unweaned}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Weaned</span>
                      <span className="font-bold">{analytics.calves.weaned}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="exports" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Cattle Inventory Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Export complete cattle inventory with all details including weights, health status, and values.
                  </p>
                  <Button onClick={handleExportCattle} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export Cattle Data
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financial Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Export all financial transactions including purchases, sales, and expenses.
                  </p>
                  <Button onClick={handleExportFinancial} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export Financial Data
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Feed Inventory Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Export feed inventory levels, costs, and usage rates.
                  </p>
                  <Button onClick={handleExportFeed} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export Feed Data
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pasture Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Export pasture information including capacity, condition, and rotation schedules.
                  </p>
                  <Button onClick={handleExportPastures} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export Pasture Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

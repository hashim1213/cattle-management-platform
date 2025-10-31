"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { dataStore } from "@/lib/data-store"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const cattle = dataStore.getCattle()
    const weightRecords = dataStore.getWeightRecords()
    const transactions = dataStore.getTransactions()
    const feed = dataStore.getFeedInventory()

    // Weight trend data
    const weightTrend = weightRecords.slice(-30).map((r) => ({
      date: new Date(r.date).toLocaleDateString(),
      weight: r.weight,
    }))

    // Cattle by stage
    const stageData = [
      { name: "Calf", value: cattle.filter((c) => c.stage === "Calf").length },
      { name: "Weaner", value: cattle.filter((c) => c.stage === "Weaner").length },
      { name: "Yearling", value: cattle.filter((c) => c.stage === "Yearling").length },
      { name: "Breeding", value: cattle.filter((c) => c.stage === "Breeding").length },
      { name: "Finishing", value: cattle.filter((c) => c.stage === "Finishing").length },
    ].filter((d) => d.value > 0)

    // Monthly expenses
    const monthlyExpenses = transactions
      .filter((t) => t.type !== "Sale")
      .reduce(
        (acc, t) => {
          const month = new Date(t.date).toLocaleDateString("en-US", { month: "short" })
          acc[month] = (acc[month] || 0) + t.amount
          return acc
        },
        {} as Record<string, number>,
      )

    const expenseData = Object.entries(monthlyExpenses).map(([month, amount]) => ({
      month,
      amount,
    }))

    // Feed inventory status
    const feedData = feed.map((f) => ({
      name: f.name,
      daysRemaining: f.dailyUsage > 0 ? Math.floor(f.quantity / f.dailyUsage) : 999,
      quantity: f.quantity,
    }))

    setData({
      weightTrend,
      stageData,
      expenseData,
      feedData,
    })
  }, [])

  if (!data) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  const COLORS = ["#16a34a", "#d97706", "#dc2626", "#2563eb", "#7c3aed"]

  const analytics = dataStore.getAnalytics()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground">Visual insights and performance trends</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6 space-y-6">
        {/* Key Performance Indicators */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-800">Total Cattle</p>
                <p className="text-3xl font-bold text-green-900">{analytics.totalCattle}</p>
                <p className="text-xs text-green-700">Active in herd</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-800">Avg Daily Gain</p>
                <p className="text-3xl font-bold text-blue-900">{analytics.avgDailyGain.toFixed(2)} lbs</p>
                <p className="text-xs text-blue-700">30-day average</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-amber-800">Cost Per Head</p>
                <p className="text-3xl font-bold text-amber-900">${analytics.costPerHead.toFixed(0)}</p>
                <p className="text-xs text-amber-700">Total investment</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-purple-800">Herd Value</p>
                <p className="text-3xl font-bold text-purple-900">${analytics.totalInventoryValue.toLocaleString()}</p>
                <p className="text-xs text-purple-700">Current market value</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-md">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg">Weight Trend (Last 30 Records)</CardTitle>
              <p className="text-xs text-muted-foreground">Average weight progression over time</p>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={data.weightTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "6px" }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#16a34a"
                    strokeWidth={3}
                    dot={{ fill: "#16a34a", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg">Cattle by Life Stage</CardTitle>
              <p className="text-xs text-muted-foreground">Distribution across production stages</p>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={data.stageData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={110}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.stageData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg">Monthly Expenses</CardTitle>
              <p className="text-xs text-muted-foreground">Operating costs by month</p>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.expenseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "6px" }}
                  />
                  <Legend />
                  <Bar dataKey="amount" fill="#dc2626" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg">Feed Inventory Status</CardTitle>
              <p className="text-xs text-muted-foreground">Days of feed remaining by type</p>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.feedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "6px" }}
                  />
                  <Legend />
                  <Bar dataKey="daysRemaining" fill="#16a34a" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

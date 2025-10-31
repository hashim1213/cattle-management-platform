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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground">Visual insights and trends</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Weight Trend (Last 30 Records)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.weightTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="weight" stroke="#16a34a" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cattle by Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.stageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
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

          <Card>
            <CardHeader>
              <CardTitle>Monthly Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.expenseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="amount" fill="#dc2626" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feed Inventory (Days Remaining)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.feedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="daysRemaining" fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

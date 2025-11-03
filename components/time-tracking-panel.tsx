"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { timeTrackingStore, type TimeEntry } from "@/lib/time-tracking-store"
import { Clock, User, Calendar } from "lucide-react"

export function TimeTrackingPanel() {
  const [entries, setEntries] = useState<TimeEntry[]>([])

  const loadEntries = () => {
    // Get last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    setEntries(
      timeTrackingStore.getEntries({
        dateRange: {
          start: thirtyDaysAgo.toISOString(),
          end: new Date().toISOString(),
        },
      })
    )
  }

  useEffect(() => {
    loadEntries()
    const unsubscribe = timeTrackingStore.subscribe(loadEntries)
    return unsubscribe
  }, [])

  // Calculate stats
  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0)
  const byOperation = entries.reduce((acc, e) => {
    acc[e.operationType] = (acc[e.operationType] || 0) + e.hours
    return acc
  }, {} as Record<string, number>)

  const getOperationLabel = (type: string) => {
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Hours (30 days)</p>
              <p className="text-2xl font-bold">{totalHours.toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Entries</p>
              <p className="text-2xl font-bold">{entries.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg Hours/Entry</p>
              <p className="text-2xl font-bold">
                {entries.length > 0 ? (totalHours / entries.length).toFixed(1) : "0"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Most Common</p>
              <p className="text-lg font-bold">
                {Object.entries(byOperation).length > 0
                  ? getOperationLabel(
                      Object.entries(byOperation).sort((a, b) => b[1] - a[1])[0][0]
                    )
                  : "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hours by Operation */}
      <Card>
        <CardHeader>
          <CardTitle>Hours by Operation Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(byOperation)
              .sort((a, b) => b[1] - a[1])
              .map(([type, hours]) => (
                <div key={type} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium">{getOperationLabel(type)}</span>
                  <Badge variant="secondary">{hours.toFixed(1)} hrs</Badge>
                </div>
              ))}
            {Object.keys(byOperation).length === 0 && (
              <p className="text-center text-muted-foreground py-8">No time entries yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {entries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No time entries in the last 30 days
              </p>
            ) : (
              entries.slice(0, 20).map((entry) => (
                <div key={entry.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold">{entry.description}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="outline">{getOperationLabel(entry.operationType)}</Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {entry.userName}
                      </span>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(entry.date).toLocaleDateString()}
                      </span>
                      {entry.relatedEntity && (
                        <Badge variant="secondary" className="text-xs">
                          {entry.relatedEntity.type}: {entry.relatedEntity.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold">{entry.hours}h</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

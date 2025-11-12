"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLifecycleConfig } from "@/hooks/use-lifecycle-config"
import { usePenStore } from "@/hooks/use-pen-store"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface CattleFiltersProps {
  filters: {
    status: string
    sex: string
    stage: string
    healthStatus: string
    penId: string
    barnId: string
  }
  onFiltersChange: (filters: any) => void
}

export function CattleFilters({ filters, onFiltersChange }: CattleFiltersProps) {
  const { stages } = useLifecycleConfig()
  const { barns = [], pens = [] } = usePenStore()

  const handleClearFilters = () => {
    onFiltersChange({
      status: "all",
      sex: "all",
      stage: "all",
      healthStatus: "all",
      penId: "all",
      barnId: "all",
    })
  }

  const activeFilterCount = Object.values(filters).filter(v => v !== "all").length

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</h3>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="barn-filter" className="text-sm font-medium">Barn</Label>
            <Select value={filters.barnId} onValueChange={(value) => onFiltersChange({ ...filters, barnId: value, penId: "all" })}>
              <SelectTrigger id="barn-filter" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Barns</SelectItem>
                {barns.map((barn) => (
                  <SelectItem key={barn.id} value={barn.id}>
                    {barn.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pen-filter" className="text-sm font-medium">Pen</Label>
            <Select value={filters.penId} onValueChange={(value) => onFiltersChange({ ...filters, penId: value })}>
              <SelectTrigger id="pen-filter" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pens</SelectItem>
                {pens
                  .filter(pen => filters.barnId === "all" || pen.barnId === filters.barnId)
                  .map((pen) => (
                    <SelectItem key={pen.id} value={pen.id}>
                      {pen.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="health-filter" className="text-sm font-medium">Health Status</Label>
            <Select value={filters.healthStatus} onValueChange={(value) => onFiltersChange({ ...filters, healthStatus: value })}>
              <SelectTrigger id="health-filter" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Healthy">Healthy</SelectItem>
                <SelectItem value="Sick">Sick</SelectItem>
                <SelectItem value="Treatment">Treatment</SelectItem>
                <SelectItem value="Quarantine">Quarantine</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sex-filter" className="text-sm font-medium">Sex</Label>
            <Select value={filters.sex} onValueChange={(value) => onFiltersChange({ ...filters, sex: value })}>
              <SelectTrigger id="sex-filter" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Bull">Bull</SelectItem>
                <SelectItem value="Steer">Steer</SelectItem>
                <SelectItem value="Heifer">Heifer</SelectItem>
                <SelectItem value="Cow">Cow</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage-filter" className="text-sm font-medium">Life Stage</Label>
            <Select value={filters.stage} onValueChange={(value) => onFiltersChange({ ...filters, stage: value })}>
              <SelectTrigger id="stage-filter" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.name}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status-filter" className="text-sm font-medium">Status</Label>
            <Select value={filters.status} onValueChange={(value) => onFiltersChange({ ...filters, status: value })}>
              <SelectTrigger id="status-filter" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Sold">Sold</SelectItem>
                <SelectItem value="Deceased">Deceased</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

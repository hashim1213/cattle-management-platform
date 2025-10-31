"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CattleFiltersProps {
  filters: {
    status: string
    sex: string
    stage: string
    lot: string
  }
  onFiltersChange: (filters: any) => void
}

export function CattleFilters({ filters, onFiltersChange }: CattleFiltersProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status-filter">Health Status</Label>
            <Select value={filters.status} onValueChange={(value) => onFiltersChange({ ...filters, status: value })}>
              <SelectTrigger id="status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="attention">Needs Attention</SelectItem>
                <SelectItem value="treatment">In Treatment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sex-filter">Sex</Label>
            <Select value={filters.sex} onValueChange={(value) => onFiltersChange({ ...filters, sex: value })}>
              <SelectTrigger id="sex-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="bull">Bull</SelectItem>
                <SelectItem value="steer">Steer</SelectItem>
                <SelectItem value="heifer">Heifer</SelectItem>
                <SelectItem value="cow">Cow</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage-filter">Life Stage</Label>
            <Select value={filters.stage} onValueChange={(value) => onFiltersChange({ ...filters, stage: value })}>
              <SelectTrigger id="stage-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="calf">Calf</SelectItem>
                <SelectItem value="weaner">Weaner</SelectItem>
                <SelectItem value="yearling">Yearling</SelectItem>
                <SelectItem value="breeding">Breeding</SelectItem>
                <SelectItem value="finishing">Finishing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lot-filter">Lot</Label>
            <Select value={filters.lot} onValueChange={(value) => onFiltersChange({ ...filters, lot: value })}>
              <SelectTrigger id="lot-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lots</SelectItem>
                <SelectItem value="LOT-A">LOT-A</SelectItem>
                <SelectItem value="LOT-B">LOT-B</SelectItem>
                <SelectItem value="LOT-C">LOT-C</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

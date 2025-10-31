"use client"

import { useState } from "react"
import { Plus, Search, Filter, Grid3x3, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CattleTable } from "@/components/cattle-table"
import { CattleGrid } from "@/components/cattle-grid"
import { AddCattleDialog } from "@/components/add-cattle-dialog"
import { CattleStats } from "@/components/cattle-stats"
import { CattleFilters } from "@/components/cattle-filters"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function CattlePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    status: "all",
    sex: "all",
    stage: "all",
    lot: "all",
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-1 block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-foreground">Cattle Inventory</h1>
              <p className="text-sm text-muted-foreground">Manage your complete cattle records</p>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Cattle
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <CattleStats />

        {/* Search, Filter, and View Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 mt-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by tag, name, breed, or lot..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "table" | "grid")}>
              <TabsList>
                <TabsTrigger value="table">
                  <List className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="grid">
                  <Grid3x3 className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {showFilters && <CattleFilters filters={filters} onFiltersChange={setFilters} />}

        {viewMode === "table" ? (
          <CattleTable searchQuery={searchQuery} filters={filters} />
        ) : (
          <CattleGrid searchQuery={searchQuery} filters={filters} />
        )}
      </main>

      {/* Add Cattle Dialog */}
      <AddCattleDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </div>
  )
}

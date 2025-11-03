"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Filter, Grid3x3, List, RefreshCw, ScanLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CattleTable } from "@/components/cattle-table"
import { CattleGrid } from "@/components/cattle-grid"
import { AddCattleDialog } from "@/components/add-cattle-dialog"
import { CattleStats } from "@/components/cattle-stats"
import { CattleFilters } from "@/components/cattle-filters"
import { RFIDImageImportDialog } from "@/components/rfid-image-import-dialog"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { dataStore } from "@/lib/data-store"
import { generateComprehensiveSampleData } from "@/lib/sample-data-generator"
import { useSearchParams } from "next/navigation"

export default function CattlePage() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isRFIDImportOpen, setIsRFIDImportOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    status: "all",
    sex: "all",
    stage: "all",
    lot: "all",
  })

  // Handle URL parameters
  useEffect(() => {
    const stageParam = searchParams.get("stage")
    if (stageParam) {
      setFilters((prev) => ({ ...prev, stage: stageParam }))
      setShowFilters(true)
    }
  }, [searchParams])

  const handleResetData = () => {
    if (confirm("Load comprehensive sample data? This will replace all current data with 100 cattle across 3 batches, complete with health records, tasks, and more.")) {
      generateComprehensiveSampleData()
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <Link href="/" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground mb-1 block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Cattle Inventory</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Manage your complete cattle records</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleResetData} className="hidden sm:flex">
                <RefreshCw className="h-4 w-4 mr-2" />
                Load Sample Data
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsRFIDImportOpen(true)}>
                <ScanLine className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Import RFID</span>
              </Button>
              <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Cattle</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
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

      {/* RFID Image Import Dialog */}
      <RFIDImageImportDialog open={isRFIDImportOpen} onOpenChange={setIsRFIDImportOpen} />
    </div>
  )
}

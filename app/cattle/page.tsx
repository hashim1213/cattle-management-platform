"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Filter, Grid3x3, List, ScanLine } from "lucide-react"
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
    healthStatus: "all",
    penId: "all",
    barnId: "all",
  })

  // Handle URL parameters
  useEffect(() => {
    const stageParam = searchParams.get("stage")
    if (stageParam) {
      setFilters((prev) => ({ ...prev, stage: stageParam }))
      setShowFilters(true)
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Mobile optimized */}
      <header className="border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-40 lg:static">
        <div className="w-full px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Link href="/" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground mb-1 block touch-manipulation inline-flex items-center">
                ← Back
              </Link>
              <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">Cattle Inventory</h1>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRFIDImportOpen(true)}
                className="touch-manipulation min-h-[44px] px-2 sm:px-4"
              >
                <ScanLine className="h-5 w-5 sm:mr-2" />
                <span className="hidden md:inline">Import</span>
              </Button>
              <Button
                size="sm"
                onClick={() => setIsAddDialogOpen(true)}
                className="touch-manipulation min-h-[44px] px-3 sm:px-4"
              >
                <Plus className="h-5 w-5 sm:mr-2" />
                <span className="hidden sm:inline">Add</span>
                <span className="sm:hidden">New</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 py-4 sm:py-6 pb-safe">
        <CattleStats />

        {/* Search, Filter, and View Controls - Mobile optimized */}
        <div className="flex flex-col gap-3 mb-4 mt-4 sm:mt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by tag, name, breed..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-12 text-base touch-manipulation"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="touch-manipulation min-h-[44px] flex-1 sm:flex-none"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </Button>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "table" | "grid")} className="flex-1 sm:flex-none">
              <TabsList className="touch-manipulation h-[44px] w-full grid grid-cols-2">
                <TabsTrigger value="table" className="text-sm">
                  <List className="h-5 w-5 mr-1" />
                  List
                </TabsTrigger>
                <TabsTrigger value="grid" className="text-sm">
                  <Grid3x3 className="h-5 w-5 mr-1" />
                  Grid
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

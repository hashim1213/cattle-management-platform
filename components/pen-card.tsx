"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Grid3x3, TrendingUp, TrendingDown, ScanLine, Wheat, Syringe, Eye } from "lucide-react"
import { type Pen, type Barn } from "@/lib/pen-store-firebase"
import { Progress } from "@/components/ui/progress"
import { RFIDImageImportDialog } from "@/components/rfid-image-import-dialog"
import { PenFeedDialog } from "@/components/pen-feed-dialog"
import { PenMedicationDialog } from "@/components/pen-medication-dialog"

interface PenCardProps {
  pen: Pen
  barn: Barn
}

export function PenCard({ pen, barn }: PenCardProps) {
  const router = useRouter()
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isFeedDialogOpen, setIsFeedDialogOpen] = useState(false)
  const [isMedicationDialogOpen, setIsMedicationDialogOpen] = useState(false)
  const utilizationRate = pen.capacity > 0 ? (pen.currentCount / pen.capacity) * 100 : 0
  const available = pen.capacity - pen.currentCount

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Grid3x3 className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium">{pen.name}</h3>
            </div>
            <Badge variant={utilizationRate > 80 ? "destructive" : utilizationRate > 50 ? "default" : "secondary"}>
              {utilizationRate.toFixed(0)}%
            </Badge>
          </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Occupied</span>
            <span className="font-medium">{pen.currentCount} / {pen.capacity}</span>
          </div>

          <Progress value={utilizationRate} className="h-2" />

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Available</span>
            <span className="font-medium flex items-center gap-1">
              {available > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  {available} head
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-600" />
                  Full
                </>
              )}
            </span>
          </div>

          {pen.notes && (
            <p className="text-xs text-muted-foreground mt-2 border-t pt-2">
              {pen.notes}
            </p>
          )}

          <div className="mt-4 pt-3 border-t space-y-2">
            <Button
              size="sm"
              className="w-full"
              onClick={() => router.push(`/pens/${pen.id}`)}
            >
              <Eye className="h-3 w-3 mr-2" />
              View Cattle ({pen.currentCount})
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFeedDialogOpen(true)}
              >
                <Wheat className="h-3 w-3 mr-1" />
                Feed
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMedicationDialogOpen(true)}
              >
                <Syringe className="h-3 w-3 mr-1" />
                Meds
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setIsImportOpen(true)}
            >
              <ScanLine className="h-3 w-3 mr-2" />
              Import RFID
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <RFIDImageImportDialog
      open={isImportOpen}
      onOpenChange={setIsImportOpen}
      defaultPenId={pen.id}
      onSuccess={() => {
        // Refresh will happen via the interval in cattle table
      }}
    />

    <PenFeedDialog
      open={isFeedDialogOpen}
      onOpenChange={setIsFeedDialogOpen}
      pen={pen}
      onSuccess={() => {
        // Activity recorded
      }}
    />

    <PenMedicationDialog
      open={isMedicationDialogOpen}
      onOpenChange={setIsMedicationDialogOpen}
      pen={pen}
      onSuccess={() => {
        // Activity recorded
      }}
    />
    </>
  )
}

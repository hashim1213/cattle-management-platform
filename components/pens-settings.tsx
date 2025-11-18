"use client"

import { useState } from "react"
import { Trash2, AlertTriangle, Warehouse, Grid3x3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { firebasePenStore } from "@/lib/pen-store-firebase"
import type { Barn, Pen } from "@/lib/pen-store-firebase"

interface PensSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  barns: Barn[]
  pens: Pen[]
}

export function PensSettings({ open, onOpenChange, barns, pens }: PensSettingsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ type: "barn" | "pen"; id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = (type: "barn" | "pen", id: string, name: string) => {
    setItemToDelete({ type, id, name })
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return

    setIsDeleting(true)
    try {
      if (itemToDelete.type === "barn") {
        // Get all pens in this barn
        const barnPens = pens.filter(p => p.barnId === itemToDelete.id)

        // Delete all pens in the barn first
        for (const pen of barnPens) {
          await firebasePenStore.deletePen(pen.id)
        }

        // Then delete the barn
        await firebasePenStore.deleteBarn(itemToDelete.id)
      } else {
        await firebasePenStore.deletePen(itemToDelete.id)
      }
    } catch (error) {
      console.error("Error deleting item:", error)
      alert("Failed to delete item. Please try again.")
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  const getPensInBarn = (barnId: string) => pens.filter(p => p.barnId === barnId)

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Pens & Barns Settings</SheetTitle>
            <SheetDescription>
              Manage your barns and pens. Deleting a barn will also delete all pens within it.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Barns Section */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Warehouse className="h-4 w-4" />
                Barns ({barns.length})
              </h3>
              {barns.length === 0 ? (
                <p className="text-sm text-muted-foreground">No barns to manage</p>
              ) : (
                <div className="space-y-2">
                  {barns.map((barn) => {
                    const barnPens = getPensInBarn(barn.id)
                    return (
                      <Card key={barn.id}>
                        <CardHeader className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm">{barn.name}</CardTitle>
                              <CardDescription className="text-xs mt-1">
                                {barn.location}
                              </CardDescription>
                              <Badge variant="secondary" className="mt-2 text-xs">
                                {barnPens.length} {barnPens.length === 1 ? "pen" : "pens"}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteClick("barn", barn.id, barn.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Pens Section */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Grid3x3 className="h-4 w-4" />
                All Pens ({pens.length})
              </h3>
              {pens.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pens to manage</p>
              ) : (
                <div className="space-y-2">
                  {pens.map((pen) => {
                    const barn = barns.find(b => b.id === pen.barnId)
                    return (
                      <Card key={pen.id}>
                        <CardHeader className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm">{pen.name}</CardTitle>
                              <CardDescription className="text-xs mt-1">
                                {barn?.name || "Unknown barn"}
                              </CardDescription>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {pen.currentCount}/{pen.capacity}
                                </Badge>
                                {pen.currentCount > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {pen.currentCount} {pen.currentCount === 1 ? "animal" : "animals"}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteClick("pen", pen.id, pen.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete {itemToDelete?.type === "barn" ? "Barn" : "Pen"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete?.type === "barn" ? (
                <>
                  Are you sure you want to delete <strong>{itemToDelete.name}</strong>?
                  <br />
                  <br />
                  This will also delete all {getPensInBarn(itemToDelete.id).length} pen(s) in this barn.
                  This action cannot be undone.
                </>
              ) : (
                <>
                  Are you sure you want to delete <strong>{itemToDelete?.name}</strong>?
                  <br />
                  <br />
                  This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

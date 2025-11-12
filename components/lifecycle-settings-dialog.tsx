"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useLifecycleConfig } from "@/hooks/use-lifecycle-config"
import { Settings, Plus, Trash2, GripVertical, RotateCcw, Edit } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LifecycleStage } from "@/lib/lifecycle-config-firebase"

export function LifecycleSettingsDialog() {
  const [open, setOpen] = useState(false)
  const [editingStage, setEditingStage] = useState<LifecycleStage | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newStageName, setNewStageName] = useState("")
  const [newStageDescription, setNewStageDescription] = useState("")
  const [newStageColor, setNewStageColor] = useState("#3b82f6")
  const [newStageImage, setNewStageImage] = useState("")

  const availableImages = [
    "/images/calf.png",
    "/images/weaning.png",
    "/images/yearling.png",
    "/images/breeding.png",
    "/images/cow.png",
    "/images/bull.png",
    "/images/pregnancy.png",
  ]

  const { stages, addStage, updateStage, removeStage, resetToDefault } = useLifecycleConfig()

  const handleAddStage = () => {
    if (!newStageName.trim()) return

    addStage({
      name: newStageName.trim(),
      color: newStageColor,
      description: newStageDescription.trim() || undefined,
      image: newStageImage || undefined,
    })

    setNewStageName("")
    setNewStageDescription("")
    setNewStageColor("#3b82f6")
    setNewStageImage("")
    setShowAddForm(false)
  }

  const handleEditStage = (stage: LifecycleStage) => {
    setEditingStage(stage)
    setShowAddForm(false)
  }

  const handleSaveEdit = () => {
    if (!editingStage) return

    updateStage(editingStage.id, {
      name: editingStage.name,
      color: editingStage.color,
      description: editingStage.description,
      image: editingStage.image,
    })

    setEditingStage(null)
  }

  const handleRemoveStage = (id: string) => {
    if (confirm("Are you sure you want to remove this lifecycle stage?")) {
      removeStage(id)
    }
  }

  const handleReset = () => {
    if (
      confirm(
        "Are you sure you want to reset to default lifecycle stages? This will remove any custom stages you've created."
      )
    ) {
      resetToDefault()
      setShowAddForm(false)
      setEditingStage(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Manage Stages</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Production Lifecycle Settings</DialogTitle>
          <DialogDescription>
            Customize your production lifecycle stages. Add, remove, or reorder stages to match your
            operation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Stages */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Current Stages</Label>
              <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2 h-8 text-xs">
                <RotateCcw className="h-3 w-3" />
                Reset to Default
              </Button>
            </div>

            <div className="space-y-2">
              {stages.map((stage, index) => (
                <div
                  key={stage.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <span className="font-medium">{stage.name}</span>
                      <span className="text-xs text-muted-foreground">#{index + 1}</span>
                    </div>
                    {stage.description && (
                      <p className="text-sm text-muted-foreground truncate">{stage.description}</p>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditStage(stage)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveStage(stage.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Edit Stage */}
          {editingStage && (
            <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base font-semibold">Edit Stage</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingStage(null)}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Stage Name *</Label>
                  <Input
                    value={editingStage.name}
                    onChange={(e) =>
                      setEditingStage({ ...editingStage, name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Textarea
                    value={editingStage.description || ""}
                    onChange={(e) =>
                      setEditingStage({ ...editingStage, description: e.target.value })
                    }
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={editingStage.color}
                      onChange={(e) =>
                        setEditingStage({ ...editingStage, color: e.target.value })
                      }
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={editingStage.color}
                      onChange={(e) =>
                        setEditingStage({ ...editingStage, color: e.target.value })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Image (Optional)</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {availableImages.map((img) => (
                      <button
                        key={img}
                        type="button"
                        onClick={() =>
                          setEditingStage({ ...editingStage, image: img })
                        }
                        className={cn(
                          "relative w-full aspect-square rounded-lg border-2 p-2 hover:border-primary transition-colors",
                          editingStage.image === img
                            ? "border-primary bg-primary/10"
                            : "border-border"
                        )}
                      >
                        <div className="relative w-full h-full">
                          <img src={img} alt="Stage" className="object-contain w-full h-full" />
                        </div>
                      </button>
                    ))}
                  </div>
                  {editingStage.image && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingStage({ ...editingStage, image: undefined })}
                      className="w-full"
                    >
                      Clear Image
                    </Button>
                  )}
                </div>

                <Button
                  onClick={handleSaveEdit}
                  className="w-full"
                  disabled={!editingStage.name.trim()}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {/* Add New Stage */}
          {!showAddForm && !editingStage ? (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4" />
              Add New Stage
            </Button>
          ) : (
            <div className="space-y-4 p-4 border rounded-lg bg-accent/20">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base font-semibold">New Stage</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingStage(null)
                    setNewStageName("")
                    setNewStageDescription("")
                    setNewStageImage("")
                  }}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="stage-name">Stage Name *</Label>
                  <Input
                    id="stage-name"
                    placeholder="e.g., Backgrounding, Grazing"
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stage-description">Description (Optional)</Label>
                  <Textarea
                    id="stage-description"
                    placeholder="Brief description of this stage"
                    value={newStageDescription}
                    onChange={(e) => setNewStageDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stage-color">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="stage-color"
                      type="color"
                      value={newStageColor}
                      onChange={(e) => setNewStageColor(e.target.value)}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={newStageColor}
                      onChange={(e) => setNewStageColor(e.target.value)}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Image (Optional)</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {availableImages.map((img) => (
                      <button
                        key={img}
                        type="button"
                        onClick={() => setNewStageImage(img)}
                        className={cn(
                          "relative w-full aspect-square rounded-lg border-2 p-2 hover:border-primary transition-colors",
                          newStageImage === img ? "border-primary bg-primary/10" : "border-border"
                        )}
                      >
                        <div className="relative w-full h-full">
                          <img src={img} alt="Stage" className="object-contain w-full h-full" />
                        </div>
                      </button>
                    ))}
                  </div>
                  {newStageImage && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setNewStageImage("")}
                      className="w-full"
                    >
                      Clear Image
                    </Button>
                  )}
                </div>

                <Button onClick={handleAddStage} className="w-full" disabled={!newStageName.trim()}>
                  Add Stage
                </Button>
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <strong>Note:</strong> Changes to lifecycle stages will affect how cattle are categorized.
            Existing cattle will keep their current stage assignments.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

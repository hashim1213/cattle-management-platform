"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRationStore } from "@/hooks/use-ration-store"
import { useToast } from "@/hooks/use-toast"
import { firebaseDataStore as dataStore } from "@/lib/data-store-firebase"
import { Plus, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { Ration, RationIngredient } from "@/lib/ration-store"

interface ManageRationDialogProps {
  ration: Ration | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ManageRationDialog({ ration, open, onOpenChange }: ManageRationDialogProps) {
  const { addRation, updateRation } = useRationStore()
  const { toast } = useToast()
  const feeds = dataStore.getFeedInventory()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    stage: "custom" as "receiving" | "growing" | "finishing" | "maintenance" | "custom",
    notes: "",
  })

  const [ingredients, setIngredients] = useState<
    Omit<RationIngredient, "id" | "percentage" | "costPerLb">[]
  >([])

  const [kpis, setKpis] = useState({
    targetADG: 0,
    targetFeedConversion: 0,
    crudeProtein: 0,
    totalDigestibleNutrients: 0,
    netEnergyMaintenance: 0,
    netEnergyGain: 0,
  })

  useEffect(() => {
    if (ration && open) {
      setFormData({
        name: ration.name,
        description: ration.description || "",
        stage: ration.stage,
        notes: ration.notes || "",
      })
      setIngredients(
        ration.ingredients.map((ing) => ({
          feedId: ing.feedId,
          feedName: ing.feedName,
          amountLbs: ing.amountLbs,
        }))
      )
      setKpis({
        targetADG: ration.kpis.targetADG,
        targetFeedConversion: ration.kpis.targetFeedConversion,
        crudeProtein: ration.kpis.crudeProtein,
        totalDigestibleNutrients: ration.kpis.totalDigestibleNutrients,
        netEnergyMaintenance: ration.kpis.netEnergyMaintenance,
        netEnergyGain: ration.kpis.netEnergyGain,
      })
    } else if (!ration && open) {
      // Reset form for new ration
      setFormData({
        name: "",
        description: "",
        stage: "custom",
        notes: "",
      })
      setIngredients([])
      setKpis({
        targetADG: 0,
        targetFeedConversion: 0,
        crudeProtein: 0,
        totalDigestibleNutrients: 0,
        netEnergyMaintenance: 0,
        netEnergyGain: 0,
      })
    }
  }, [ration, open])

  const addIngredient = () => {
    if (feeds.length === 0) {
      toast({
        title: "No Feed Available",
        description: "Please add feed to inventory first.",
        variant: "destructive",
      })
      return
    }

    const firstFeed = feeds[0]
    setIngredients([
      ...ingredients,
      {
        feedId: firstFeed.id,
        feedName: firstFeed.name,
        amountLbs: 0,
      },
    ])
  }

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const updateIngredient = (index: number, field: string, value: any) => {
    const updated = [...ingredients]
    if (field === "feedId") {
      const feed = feeds.find((f) => f.id === value)
      if (feed) {
        updated[index] = {
          ...updated[index],
          feedId: value,
          feedName: feed.name,
        }
      }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setIngredients(updated)
  }

  const calculateTotals = () => {
    const totalLbs = ingredients.reduce((sum, ing) => sum + ing.amountLbs, 0)

    const enrichedIngredients: RationIngredient[] = ingredients.map((ing) => {
      const feed = feeds.find((f) => f.id === ing.feedId)
      const percentage = totalLbs > 0 ? (ing.amountLbs / totalLbs) * 100 : 0

      return {
        id: `ing-${Date.now()}-${Math.random()}`,
        feedId: ing.feedId,
        feedName: ing.feedName,
        amountLbs: ing.amountLbs,
        percentage,
        costPerLb: feed?.costPerUnit || 0,
      }
    })

    const costPerHead = enrichedIngredients.reduce(
      (sum, ing) => sum + ing.amountLbs * ing.costPerLb,
      0
    )
    const costPerPound = kpis.targetADG > 0 ? costPerHead / kpis.targetADG : 0

    return {
      totalLbs,
      enrichedIngredients,
      costPerHead,
      costPerPound,
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (ingredients.length === 0) {
      toast({
        title: "Add Ingredients",
        description: "Please add at least one ingredient to the ration.",
        variant: "destructive",
      })
      return
    }

    const { totalLbs, enrichedIngredients, costPerHead, costPerPound } = calculateTotals()

    const rationData = {
      name: formData.name,
      description: formData.description || undefined,
      stage: formData.stage,
      ingredients: enrichedIngredients,
      totalLbsPerHead: totalLbs,
      kpis: {
        ...kpis,
        costPerHead,
        costPerPound,
      },
      notes: formData.notes || undefined,
      isActive: true,
    }

    if (ration) {
      updateRation(ration.id, rationData)
      toast({
        title: "Ration Updated",
        description: "The ration has been successfully updated.",
      })
    } else {
      addRation(rationData)
      toast({
        title: "Ration Created",
        description: "The new ration has been successfully created.",
      })
    }

    onOpenChange(false)
  }

  const totals = calculateTotals()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ration ? "Edit Ration" : "Create New Ration"}</DialogTitle>
          <DialogDescription>
            {ration ? "Update ration information" : "Define a new feed ration formulation"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Ration Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Finishing Ration - High Energy"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stage">Stage</Label>
                  <Select
                    value={formData.stage}
                    onValueChange={(value: any) => setFormData({ ...formData, stage: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receiving">Receiving</SelectItem>
                      <SelectItem value="growing">Growing</SelectItem>
                      <SelectItem value="finishing">Finishing</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this ration"
                />
              </div>
            </div>

            {/* Ingredients */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Ingredients</h3>
                <Button type="button" size="sm" variant="outline" onClick={addIngredient}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Ingredient
                </Button>
              </div>

              <div className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                          <Label>Feed</Label>
                          <Select
                            value={ingredient.feedId}
                            onValueChange={(value) => updateIngredient(index, "feedId", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {feeds.map((feed) => (
                                <SelectItem key={feed.id} value={feed.id}>
                                  {feed.name} (${feed.costPerUnit}/lb)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="w-32 space-y-2">
                          <Label>Lbs/Head/Day</Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            value={ingredient.amountLbs}
                            onChange={(e) =>
                              updateIngredient(index, "amountLbs", parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>

                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeIngredient(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {ingredients.length > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total per Head per Day:</span>
                    <span className="text-lg font-bold">{totals.totalLbs.toFixed(2)} lbs</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-muted-foreground">Cost per Head per Day:</span>
                    <span className="text-sm font-medium">${totals.costPerHead.toFixed(3)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* KPIs */}
            <div className="space-y-4">
              <h3 className="font-semibold">Target Performance KPIs</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetADG">Target ADG (lbs/day)</Label>
                  <Input
                    id="targetADG"
                    type="number"
                    step="0.01"
                    min="0"
                    value={kpis.targetADG}
                    onChange={(e) =>
                      setKpis({ ...kpis, targetADG: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetFC">Target Feed:Gain</Label>
                  <Input
                    id="targetFC"
                    type="number"
                    step="0.01"
                    min="0"
                    value={kpis.targetFeedConversion}
                    onChange={(e) =>
                      setKpis({ ...kpis, targetFeedConversion: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cp">Crude Protein (%)</Label>
                  <Input
                    id="cp"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={kpis.crudeProtein}
                    onChange={(e) =>
                      setKpis({ ...kpis, crudeProtein: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tdn">TDN (%)</Label>
                  <Input
                    id="tdn"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={kpis.totalDigestibleNutrients}
                    onChange={(e) =>
                      setKpis({
                        ...kpis,
                        totalDigestibleNutrients: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nem">NE Maintenance (Mcal/lb)</Label>
                  <Input
                    id="nem"
                    type="number"
                    step="0.01"
                    min="0"
                    value={kpis.netEnergyMaintenance}
                    onChange={(e) =>
                      setKpis({ ...kpis, netEnergyMaintenance: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="neg">NE Gain (Mcal/lb)</Label>
                  <Input
                    id="neg"
                    type="number"
                    step="0.01"
                    min="0"
                    value={kpis.netEnergyGain}
                    onChange={(e) =>
                      setKpis({ ...kpis, netEnergyGain: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this ration..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{ration ? "Update" : "Create"} Ration</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

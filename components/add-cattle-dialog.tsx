"use client"

import type React from "react"
import { useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLifecycleConfig } from "@/hooks/use-lifecycle-config"
import { usePenStore } from "@/hooks/use-pen-store"
import { firebaseDataStore } from "@/lib/data-store-firebase"
import { toast } from "sonner"

interface AddCattleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddCattleDialog({ open, onOpenChange, onSuccess }: AddCattleDialogProps) {
  const { stages } = useLifecycleConfig()
  const { barns, pens, getPen, updatePenCount } = usePenStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Basic Info
    tagNumber: "",
    breed: "",
    sex: "",
    birthDate: "",
    stage: "",
    barnId: "",
    penId: "",

    // Identification
    earTag: "",
    brand: "",
    electronicId: "",
    tattoo: "",

    // Purchase Info
    purchaseDate: "",
    purchaseWeight: "",
    purchasePrice: "",
    currentValue: "",
    lotNumber: "",

    // Breeding Info
    dam: "",
    sire: "",
    conceptionMethod: "",

    // Additional
    colorMarkings: "",
    hornStatus: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create cattle object
      const newCattle = {
        tagNumber: formData.tagNumber,
        breed: formData.breed,
        sex: formData.sex as any,
        birthDate: formData.birthDate || undefined,
        stage: formData.stage as any,
        barnId: formData.barnId || undefined,
        penId: formData.penId || undefined,
        rfidTag: formData.electronicId || undefined,
        visualTag: formData.earTag || undefined,
        brandNumber: formData.brand || undefined,
        purchaseDate: formData.purchaseDate,
        purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : undefined,
        purchaseWeight: formData.purchaseWeight ? Number(formData.purchaseWeight) : undefined,
        currentValue: formData.currentValue ? Number(formData.currentValue) : undefined,
        weight: formData.purchaseWeight ? Number(formData.purchaseWeight) : 0,
        lot: formData.lotNumber,
        dam: formData.dam || undefined,
        sire: formData.sire || undefined,
        colorMarkings: formData.colorMarkings || undefined,
        hornStatus: formData.hornStatus || undefined,
        notes: formData.notes || undefined,
        status: "Active" as any,
        healthStatus: "Healthy" as any,
        identificationMethod: formData.electronicId ? "RFID" : formData.earTag ? "Visual Tag" : "Manual",
      }

      // Save to Firestore
      await firebaseDataStore.addCattle(newCattle)

      // Update pen count if pen was selected
      if (formData.penId) {
        updatePenCount(formData.penId, 1)
      }

      toast.success("Cattle added successfully")

      // Reset form
      setFormData({
        tagNumber: "",
        breed: "",
        sex: "",
        birthDate: "",
        stage: "",
        barnId: "",
        penId: "",
        earTag: "",
        brand: "",
        electronicId: "",
        tattoo: "",
        purchaseDate: "",
        purchaseWeight: "",
        purchasePrice: "",
        currentValue: "",
        lotNumber: "",
        dam: "",
        sire: "",
        conceptionMethod: "",
        colorMarkings: "",
        hornStatus: "",
        notes: "",
      })

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error("Error adding cattle:", error)
      toast.error("Failed to add cattle")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-y-auto mobile-scroll-container p-0">
        <DialogHeader className="px-4 sm:px-6 pt-6 pb-4">
          <DialogTitle className="text-xl sm:text-2xl">Add New Cattle</DialogTitle>
          <DialogDescription className="text-base">Enter comprehensive details for the new cattle record.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="px-4 sm:px-6 pb-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-12 sm:h-11 mb-6">
              <TabsTrigger value="basic" className="text-sm sm:text-base">Basic</TabsTrigger>
              <TabsTrigger value="identification" className="text-sm sm:text-base">ID</TabsTrigger>
              <TabsTrigger value="purchase" className="text-sm sm:text-base">Purchase</TabsTrigger>
              <TabsTrigger value="breeding" className="text-sm sm:text-base">Breeding</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-5 mt-0">
              <div className="space-y-2.5">
                <Label htmlFor="tagNumber" className="text-base">Tag Number *</Label>
                <Input
                  id="tagNumber"
                  placeholder="e.g., 1251"
                  value={formData.tagNumber}
                  onChange={(e) => setFormData({ ...formData, tagNumber: e.target.value })}
                  required
                  className="h-12 text-base"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <Label htmlFor="breed" className="text-base">Breed *</Label>
                  <Select value={formData.breed} onValueChange={(value) => setFormData({ ...formData, breed: value })}>
                    <SelectTrigger id="breed" className="h-12 text-base">
                      <SelectValue placeholder="Select breed" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="angus">Angus</SelectItem>
                      <SelectItem value="hereford">Hereford</SelectItem>
                      <SelectItem value="charolais">Charolais</SelectItem>
                      <SelectItem value="simmental">Simmental</SelectItem>
                      <SelectItem value="limousin">Limousin</SelectItem>
                      <SelectItem value="brahman">Brahman</SelectItem>
                      <SelectItem value="crossbred">Crossbred</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="sex" className="text-base">Sex *</Label>
                  <Select value={formData.sex} onValueChange={(value) => setFormData({ ...formData, sex: value })}>
                    <SelectTrigger id="sex" className="h-12 text-base">
                      <SelectValue placeholder="Select sex" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bull">Bull</SelectItem>
                      <SelectItem value="steer">Steer</SelectItem>
                      <SelectItem value="heifer">Heifer</SelectItem>
                      <SelectItem value="cow">Cow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <Label htmlFor="birthDate" className="text-base">Birth Date</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="stage" className="text-base">Lifecycle Stage</Label>
                  <Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value })}>
                    <SelectTrigger id="stage" className="h-12 text-base">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.name}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <Label htmlFor="barnId" className="text-base">Barn (Optional)</Label>
                  <Select
                    value={formData.barnId}
                    onValueChange={(value) => {
                      setFormData({ ...formData, barnId: value, penId: "" })
                    }}
                  >
                    <SelectTrigger id="barnId" className="h-12 text-base">
                      <SelectValue placeholder="Select barn" />
                    </SelectTrigger>
                    <SelectContent>
                      {barns.map((barn) => (
                        <SelectItem key={barn.id} value={barn.id}>
                          {barn.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="penId" className="text-base">Pen (Optional)</Label>
                  <Select
                    value={formData.penId}
                    onValueChange={(value) => setFormData({ ...formData, penId: value })}
                    disabled={!formData.barnId}
                  >
                    <SelectTrigger id="penId" className="h-12 text-base">
                      <SelectValue placeholder="Select pen" />
                    </SelectTrigger>
                    <SelectContent>
                      {pens
                        .filter((pen) => pen.barnId === formData.barnId)
                        .map((pen) => {
                          const available = pen.capacity - pen.currentCount
                          return (
                            <SelectItem key={pen.id} value={pen.id}>
                              {pen.name} ({available}/{pen.capacity} available)
                            </SelectItem>
                          )
                        })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <Label htmlFor="colorMarkings" className="text-base">Color/Markings</Label>
                  <Input
                    id="colorMarkings"
                    placeholder="e.g., Black with white face"
                    value={formData.colorMarkings}
                    onChange={(e) => setFormData({ ...formData, colorMarkings: e.target.value })}
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="hornStatus" className="text-base">Horn Status</Label>
                  <Select
                    value={formData.hornStatus}
                    onValueChange={(value) => setFormData({ ...formData, hornStatus: value })}
                  >
                    <SelectTrigger id="hornStatus" className="h-12 text-base">
                      <SelectValue placeholder="Select horn status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="polled">Polled (Naturally Hornless)</SelectItem>
                      <SelectItem value="horned">Horned</SelectItem>
                      <SelectItem value="dehorned">Dehorned</SelectItem>
                      <SelectItem value="disbudded">Disbudded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="identification" className="space-y-5 mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <Label htmlFor="earTag" className="text-base">Ear Tag</Label>
                  <Input
                    id="earTag"
                    placeholder="e.g., 1251"
                    value={formData.earTag}
                    onChange={(e) => setFormData({ ...formData, earTag: e.target.value })}
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="brand" className="text-base">Brand</Label>
                  <Input
                    id="brand"
                    placeholder="e.g., BR"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="h-12 text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <Label htmlFor="electronicId" className="text-base">Electronic ID (RFID)</Label>
                  <Input
                    id="electronicId"
                    placeholder="e.g., 840003123456789"
                    value={formData.electronicId}
                    onChange={(e) => setFormData({ ...formData, electronicId: e.target.value })}
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="tattoo" className="text-base">Tattoo</Label>
                  <Input
                    id="tattoo"
                    placeholder="e.g., A123"
                    value={formData.tattoo}
                    onChange={(e) => setFormData({ ...formData, tattoo: e.target.value })}
                    className="h-12 text-base"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="purchase" className="space-y-5 mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <Label htmlFor="purchaseDate" className="text-base">Purchase Date *</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    required
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="lotNumber" className="text-base">Lot Number *</Label>
                  <Input
                    id="lotNumber"
                    placeholder="e.g., LOT-A"
                    value={formData.lotNumber}
                    onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
                    required
                    className="h-12 text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <Label htmlFor="purchaseWeight" className="text-base">Purchase Weight (lbs) *</Label>
                  <Input
                    id="purchaseWeight"
                    type="number"
                    placeholder="e.g., 785"
                    value={formData.purchaseWeight}
                    onChange={(e) => setFormData({ ...formData, purchaseWeight: e.target.value })}
                    required
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="purchasePrice" className="text-base">Purchase Price ($) *</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    placeholder="e.g., 1650"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    required
                    className="h-12 text-base"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="currentValue" className="text-base">Current Value ($)</Label>
                <Input
                  id="currentValue"
                  type="number"
                  placeholder="Optional - Leave empty for auto-calculation"
                  value={formData.currentValue}
                  onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                  className="h-12 text-base"
                />
                <p className="text-sm text-muted-foreground">
                  Enter current market value or leave empty for automatic calculation
                </p>
              </div>
            </TabsContent>

            <TabsContent value="breeding" className="space-y-5 mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <Label htmlFor="dam" className="text-base">Dam (Mother)</Label>
                  <Input
                    id="dam"
                    placeholder="e.g., Tag #1100"
                    value={formData.dam}
                    onChange={(e) => setFormData({ ...formData, dam: e.target.value })}
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="sire" className="text-base">Sire (Father)</Label>
                  <Input
                    id="sire"
                    placeholder="e.g., Tag #2050"
                    value={formData.sire}
                    onChange={(e) => setFormData({ ...formData, sire: e.target.value })}
                    className="h-12 text-base"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="conceptionMethod" className="text-base">Conception Method</Label>
                <Select
                  value={formData.conceptionMethod}
                  onValueChange={(value) => setFormData({ ...formData, conceptionMethod: value })}
                >
                  <SelectTrigger id="conceptionMethod" className="h-12 text-base">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="natural">Natural Breeding</SelectItem>
                    <SelectItem value="ai">Artificial Insemination (AI)</SelectItem>
                    <SelectItem value="et">Embryo Transfer (ET)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="notes" className="text-base">Notes</Label>
                <Input
                  id="notes"
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="h-12 text-base"
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-8 gap-3 sm:gap-2 flex-col sm:flex-row">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="w-full sm:w-auto min-h-[52px] text-base touch-manipulation order-2 sm:order-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto min-h-[52px] text-base touch-manipulation order-1 sm:order-2">
              {loading ? "Adding..." : "Add Cattle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

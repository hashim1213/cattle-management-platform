"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useLifecycleConfig } from "@/hooks/use-lifecycle-config"
import { firebaseDataStore, type Cattle } from "@/lib/data-store-firebase"
import { Save } from "lucide-react"
import { toast } from "sonner"

interface EditCattleDialogProps {
  cattle: Cattle
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: () => void
}

export function EditCattleDialog({ cattle, open, onOpenChange, onSave }: EditCattleDialogProps) {
  const { stages } = useLifecycleConfig()
  const [formData, setFormData] = useState<Cattle>(cattle)

  useEffect(() => {
    setFormData(cattle)
  }, [cattle, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Update cattle in Firebase
      await firebaseDataStore.updateCattle(formData.id, formData)
      toast.success("Cattle updated successfully")
      onSave?.()
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to update cattle:", error)
      toast.error("Failed to update cattle")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Cattle - {cattle.tagNumber}</DialogTitle>
          <DialogDescription>Update the details for this animal.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="identification">ID</TabsTrigger>
              <TabsTrigger value="purchase">Purchase</TabsTrigger>
              <TabsTrigger value="breeding">Breeding</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="tagNumber">Tag Number *</Label>
                <Input
                  id="tagNumber"
                  value={formData.tagNumber}
                  onChange={(e) => setFormData({ ...formData, tagNumber: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="breed">Breed *</Label>
                  <Select
                    value={formData.breed}
                    onValueChange={(value) => setFormData({ ...formData, breed: value })}
                  >
                    <SelectTrigger id="breed">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Angus">Angus</SelectItem>
                      <SelectItem value="Hereford">Hereford</SelectItem>
                      <SelectItem value="Charolais">Charolais</SelectItem>
                      <SelectItem value="Simmental">Simmental</SelectItem>
                      <SelectItem value="Limousin">Limousin</SelectItem>
                      <SelectItem value="Brahman">Brahman</SelectItem>
                      <SelectItem value="Crossbred">Crossbred</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sex">Sex *</Label>
                  <Select
                    value={formData.sex}
                    onValueChange={(value: any) => setFormData({ ...formData, sex: value })}
                  >
                    <SelectTrigger id="sex">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bull">Bull</SelectItem>
                      <SelectItem value="Steer">Steer</SelectItem>
                      <SelectItem value="Heifer">Heifer</SelectItem>
                      <SelectItem value="Cow">Cow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Birth Date</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stage">Lifecycle Stage</Label>
                  <Select
                    value={formData.stage}
                    onValueChange={(value) => setFormData({ ...formData, stage: value })}
                  >
                    <SelectTrigger id="stage">
                      <SelectValue />
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Current Weight (lbs)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetWeight">Target Weight (lbs)</Label>
                  <Input
                    id="targetWeight"
                    type="number"
                    value={formData.targetWeight || ""}
                    onChange={(e) => setFormData({ ...formData, targetWeight: Number(e.target.value) || undefined })}
                    placeholder="1400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lot">Lot</Label>
                <Input
                  id="lot"
                  value={formData.lot}
                  onChange={(e) => setFormData({ ...formData, lot: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="colorMarkings">Color/Markings</Label>
                  <Input
                    id="colorMarkings"
                    value={formData.colorMarkings || ""}
                    onChange={(e) => setFormData({ ...formData, colorMarkings: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hornStatus">Horn Status</Label>
                  <Select
                    value={formData.hornStatus || ""}
                    onValueChange={(value) => setFormData({ ...formData, hornStatus: value })}
                  >
                    <SelectTrigger id="hornStatus">
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

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="identification" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rfidTag">RFID Tag</Label>
                  <Input
                    id="rfidTag"
                    value={formData.rfidTag || ""}
                    onChange={(e) => setFormData({ ...formData, rfidTag: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brandNumber">Brand Number</Label>
                  <Input
                    id="brandNumber"
                    value={formData.brandNumber || ""}
                    onChange={(e) => setFormData({ ...formData, brandNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="identificationMethod">Identification Method</Label>
                <Input
                  id="identificationMethod"
                  value={formData.identificationMethod}
                  onChange={(e) => setFormData({ ...formData, identificationMethod: e.target.value })}
                />
              </div>
            </TabsContent>

            <TabsContent value="purchase" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate || ""}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    value={formData.purchasePrice || ""}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentValue">Current Value ($)</Label>
                <Input
                  id="currentValue"
                  type="number"
                  value={formData.currentValue || ""}
                  onChange={(e) => setFormData({ ...formData, currentValue: Number(e.target.value) })}
                />
              </div>
            </TabsContent>

            <TabsContent value="breeding" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dam">Dam (Mother)</Label>
                  <Input
                    id="dam"
                    value={formData.dam || ""}
                    onChange={(e) => setFormData({ ...formData, dam: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sire">Sire (Father)</Label>
                  <Input
                    id="sire"
                    value={formData.sire || ""}
                    onChange={(e) => setFormData({ ...formData, sire: e.target.value })}
                  />
                </div>
              </div>

              {(formData.sex === "Cow" || formData.sex === "Heifer") && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="pregnancyStatus">Pregnancy Status</Label>
                    <Select
                      value={formData.pregnancyStatus || ""}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, pregnancyStatus: value })
                      }
                    >
                      <SelectTrigger id="pregnancyStatus">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="Bred">Bred</SelectItem>
                        <SelectItem value="Pregnant">Pregnant</SelectItem>
                        <SelectItem value="Calved">Calved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.pregnancyStatus === "Pregnant" && (
                    <div className="space-y-2">
                      <Label htmlFor="expectedCalvingDate">Expected Calving Date</Label>
                      <Input
                        id="expectedCalvingDate"
                        type="date"
                        value={formData.expectedCalvingDate || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, expectedCalvingDate: e.target.value })
                        }
                      />
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

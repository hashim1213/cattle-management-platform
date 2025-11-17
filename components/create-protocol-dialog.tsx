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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, X, AlertCircle } from "lucide-react"
import { protocolService } from "@/lib/health/protocol-service"
import { inventoryService } from "@/lib/inventory/inventory-service"
import { isDrugCategory } from "@/lib/inventory/inventory-types"
import { TreatmentProtocolDrug } from "@/lib/health/treatment-protocols"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CreateProtocolDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateProtocolDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateProtocolDialogProps) {
  const { toast } = useToast()

  // Basic info
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  // Drugs in protocol
  const [drugs, setDrugs] = useState<TreatmentProtocolDrug[]>([])

  // Current drug being added
  const [selectedDrugId, setSelectedDrugId] = useState("")
  const [dosageAmount, setDosageAmount] = useState("")
  const [dosageUnit, setDosageUnit] = useState<"cc" | "ml">("cc")
  const [dosageType, setDosageType] = useState<"fixed" | "weight-based">("fixed")
  const [administrationRoute, setAdministrationRoute] = useState<"IM" | "SQ" | "IV" | "Oral" | "Intranasal">("IM")
  const [drugNotes, setDrugNotes] = useState("")

  const [isProcessing, setIsProcessing] = useState(false)
  const [allInventory, setAllInventory] = useState<any[]>([])

  // Load inventory
  useEffect(() => {
    const loadInventory = async () => {
      const inventory = await inventoryService.getInventory()
      setAllInventory(inventory)
    }
    if (open) {
      loadInventory()
    }
  }, [open])

  // Get all drugs from inventory
  const availableDrugs = allInventory.filter(item => isDrugCategory(item.category))

  // Calculate estimated cost per head
  const estimatedCostPerHead = drugs.reduce((total, drug) => {
    const inventoryItem = allInventory.find(i => i.id === drug.drugInventoryId)
    if (!inventoryItem) return total
    return total + (inventoryItem.costPerUnit * drug.dosageAmount)
  }, 0)

  const handleAddDrug = () => {
    if (!selectedDrugId || !dosageAmount) {
      toast({
        title: "Missing Information",
        description: "Please select a drug and enter dosage amount.",
        variant: "destructive",
      })
      return
    }

    const inventoryItem = availableDrugs.find(d => d.id === selectedDrugId)
    if (!inventoryItem) return

    const newDrug: TreatmentProtocolDrug = {
      drugInventoryId: selectedDrugId,
      drugName: inventoryItem.name,
      dosageAmount: parseFloat(dosageAmount),
      dosageUnit: dosageUnit,
      dosageType: dosageType,
      administrationRoute: administrationRoute,
      withdrawalPeriod: inventoryItem.withdrawalPeriod || 0,
      notes: drugNotes || undefined
    }

    setDrugs([...drugs, newDrug])

    // Reset drug form
    setSelectedDrugId("")
    setDosageAmount("")
    setDrugNotes("")
  }

  const handleRemoveDrug = (index: number) => {
    setDrugs(drugs.filter((_, i) => i !== index))
  }

  const handleCreateProtocol = () => {
    // Validation
    if (!name.trim()) {
      toast({
        title: "Missing Name",
        description: "Please enter a protocol name.",
        variant: "destructive",
      })
      return
    }

    if (drugs.length === 0) {
      toast({
        title: "No Drugs Added",
        description: "Please add at least one drug to the protocol.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      const protocol = protocolService.createProtocol({
        name: name.trim(),
        description: description.trim() || "Custom protocol",
        drugs: drugs,
        estimatedCostPerHead: estimatedCostPerHead,
        createdBy: "Current User" // TODO: Get from auth context
      })

      toast({
        title: "Protocol Created",
        description: `"${protocol.name}" has been saved successfully.`,
      })

      // Reset form
      setName("")
      setDescription("")
      setDrugs([])
      setSelectedDrugId("")
      setDosageAmount("")
      setDrugNotes("")

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: "Failed to Create Protocol",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Treatment Protocol</DialogTitle>
          <DialogDescription>
            Build a reusable treatment protocol with multiple drugs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Protocol Name *</Label>
              <Input
                placeholder="e.g., Custom Arrival Protocol"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Describe when and how to use this protocol..."
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Drugs in Protocol */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Drugs in Protocol ({drugs.length})</Label>

            {drugs.length > 0 && (
              <div className="space-y-2">
                {drugs.map((drug, index) => {
                  const inventoryItem = allInventory.find(i => i.id === drug.drugInventoryId)
                  const drugCost = inventoryItem ? inventoryItem.costPerUnit * drug.dosageAmount : 0

                  return (
                    <Card key={index}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{drug.drugName}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {drug.dosageAmount}{drug.dosageUnit} - {drug.administrationRoute}
                              {drug.dosageType === "weight-based" && " (weight-based)"}
                            </div>
                            {drug.notes && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {drug.notes}
                              </div>
                            )}
                            <div className="flex gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                ${drugCost.toFixed(2)}/head
                              </Badge>
                              {drug.withdrawalPeriod > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {drug.withdrawalPeriod}d withdrawal
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveDrug(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Add Drug Form */}
            <Card className="border-dashed">
              <CardContent className="p-4 space-y-3">
                <div className="font-medium text-sm">Add Drug</div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-2">
                    <Label className="text-sm">Drug *</Label>
                    <Select value={selectedDrugId} onValueChange={setSelectedDrugId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select drug" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDrugs.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No drugs in inventory
                          </SelectItem>
                        ) : (
                          availableDrugs.map((drug) => (
                            <SelectItem key={drug.id} value={drug.id}>
                              {drug.name}
                              {drug.concentration && ` (${drug.concentration})`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Dosage *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0.0"
                      value={dosageAmount}
                      onChange={(e) => setDosageAmount(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Unit</Label>
                    <Select value={dosageUnit} onValueChange={(v) => setDosageUnit(v as typeof dosageUnit)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cc">cc</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Dosage Type</Label>
                    <Select value={dosageType} onValueChange={(v) => setDosageType(v as typeof dosageType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed (same for all)</SelectItem>
                        <SelectItem value="weight-based">Weight-based</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Route</Label>
                    <Select value={administrationRoute} onValueChange={(v) => setAdministrationRoute(v as typeof administrationRoute)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IM">IM</SelectItem>
                        <SelectItem value="SQ">SQ</SelectItem>
                        <SelectItem value="IV">IV</SelectItem>
                        <SelectItem value="Oral">Oral</SelectItem>
                        <SelectItem value="Intranasal">Intranasal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label className="text-sm">Notes (Optional)</Label>
                    <Input
                      placeholder="e.g., 1cc per 110 lbs"
                      value={drugNotes}
                      onChange={(e) => setDrugNotes(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddDrug}
                  className="w-full"
                  disabled={!selectedDrugId || !dosageAmount}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Drug to Protocol
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Cost Summary */}
          {drugs.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">Estimated Cost Per Head</div>
                <div className="text-2xl font-bold mt-1">
                  ${estimatedCostPerHead.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Based on current inventory costs
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateProtocol}
            disabled={isProcessing || !name.trim() || drugs.length === 0}
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Protocol
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, DollarSign, Weight } from "lucide-react"

interface CattleDetailsEntryProps {
  rfids: string[]
  onComplete: (details: CattleDetails[]) => void
  onBack: () => void
}

export interface CattleDetails {
  rfid: string
  weight: number
  cost: number
  costPerPound: number
}

export function CattleDetailsEntry({ rfids, onComplete, onBack }: CattleDetailsEntryProps) {
  const [weightMode, setWeightMode] = useState<"total" | "individual" | "same">("total")
  const [costMode, setCostMode] = useState<"total" | "individual" | "same">("total")

  const [totalWeight, setTotalWeight] = useState("")
  const [sameWeight, setSameWeight] = useState("")
  const [individualWeights, setIndividualWeights] = useState<Record<string, string>>({})

  const [totalCost, setTotalCost] = useState("")
  const [sameCost, setSameCost] = useState("")
  const [individualCosts, setIndividualCosts] = useState<Record<string, string>>({})

  const calculateDetails = (): CattleDetails[] => {
    const details: CattleDetails[] = []

    for (let i = 0; i < rfids.length; i++) {
      const rfid = rfids[i]

      // Calculate weight for this animal
      let weight = 0
      if (weightMode === "total" && totalWeight) {
        weight = parseFloat(totalWeight) / rfids.length
      } else if (weightMode === "same" && sameWeight) {
        weight = parseFloat(sameWeight)
      } else if (weightMode === "individual" && individualWeights[rfid]) {
        weight = parseFloat(individualWeights[rfid])
      }

      // Calculate cost for this animal
      let cost = 0
      if (costMode === "total" && totalCost) {
        cost = parseFloat(totalCost) / rfids.length
      } else if (costMode === "same" && sameCost) {
        cost = parseFloat(sameCost)
      } else if (costMode === "individual" && individualCosts[rfid]) {
        cost = parseFloat(individualCosts[rfid])
      }

      // Calculate cost per pound
      const costPerPound = weight > 0 ? cost / weight : 0

      details.push({
        rfid,
        weight: Math.round(weight * 100) / 100, // Round to 2 decimal places
        cost: Math.round(cost * 100) / 100,
        costPerPound: Math.round(costPerPound * 100) / 100,
      })
    }

    return details
  }

  const handleComplete = () => {
    const details = calculateDetails()
    onComplete(details)
  }

  const previewDetails = calculateDetails()
  const totalPreviewWeight = previewDetails.reduce((sum, d) => sum + d.weight, 0)
  const totalPreviewCost = previewDetails.reduce((sum, d) => sum + d.cost, 0)
  const avgCostPerPound = totalPreviewWeight > 0 ? totalPreviewCost / totalPreviewWeight : 0

  const isValid = previewDetails.every(d => d.weight > 0)

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Weight Entry</h3>
          <RadioGroup value={weightMode} onValueChange={(v: any) => setWeightMode(v)}>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="total" id="weight-total" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="weight-total" className="font-medium cursor-pointer">
                    Total Weight (System will average)
                  </Label>
                  {weightMode === "total" && (
                    <div className="mt-2">
                      <Input
                        type="number"
                        placeholder="Enter total weight for all cattle"
                        value={totalWeight}
                        onChange={(e) => setTotalWeight(e.target.value)}
                        className="w-full"
                      />
                      {totalWeight && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Average per animal: {(parseFloat(totalWeight) / rfids.length).toFixed(2)} lbs
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <RadioGroupItem value="same" id="weight-same" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="weight-same" className="font-medium cursor-pointer">
                    Same Weight for All
                  </Label>
                  {weightMode === "same" && (
                    <div className="mt-2">
                      <Input
                        type="number"
                        placeholder="Enter weight for each animal"
                        value={sameWeight}
                        onChange={(e) => setSameWeight(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <RadioGroupItem value="individual" id="weight-individual" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="weight-individual" className="font-medium cursor-pointer">
                    Individual Weights
                  </Label>
                  {weightMode === "individual" && (
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                      {rfids.map((rfid, index) => (
                        <div key={rfid} className="flex items-center gap-2">
                          <Label className="text-sm w-32 truncate" title={rfid}>
                            {rfid.slice(-6)}:
                          </Label>
                          <Input
                            type="number"
                            placeholder="Weight"
                            value={individualWeights[rfid] || ""}
                            onChange={(e) =>
                              setIndividualWeights({ ...individualWeights, [rfid]: e.target.value })
                            }
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Cost Entry (Optional)</h3>
          <RadioGroup value={costMode} onValueChange={(v: any) => setCostMode(v)}>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="total" id="cost-total" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="cost-total" className="font-medium cursor-pointer">
                    Total Cost (System will average)
                  </Label>
                  {costMode === "total" && (
                    <div className="mt-2">
                      <Input
                        type="number"
                        placeholder="Enter total cost for all cattle"
                        value={totalCost}
                        onChange={(e) => setTotalCost(e.target.value)}
                        className="w-full"
                      />
                      {totalCost && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Average per animal: ${(parseFloat(totalCost) / rfids.length).toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <RadioGroupItem value="same" id="cost-same" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="cost-same" className="font-medium cursor-pointer">
                    Same Cost for All
                  </Label>
                  {costMode === "same" && (
                    <div className="mt-2">
                      <Input
                        type="number"
                        placeholder="Enter cost for each animal"
                        value={sameCost}
                        onChange={(e) => setSameCost(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <RadioGroupItem value="individual" id="cost-individual" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="cost-individual" className="font-medium cursor-pointer">
                    Individual Costs
                  </Label>
                  {costMode === "individual" && (
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                      {rfids.map((rfid, index) => (
                        <div key={rfid} className="flex items-center gap-2">
                          <Label className="text-sm w-32 truncate" title={rfid}>
                            {rfid.slice(-6)}:
                          </Label>
                          <Input
                            type="number"
                            placeholder="Cost"
                            value={individualCosts[rfid] || ""}
                            onChange={(e) =>
                              setIndividualCosts({ ...individualCosts, [rfid]: e.target.value })
                            }
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* Preview Summary */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Summary
          </CardTitle>
          <CardDescription>Preview of cattle details before import</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground flex items-center gap-1">
                <Weight className="h-3 w-3" />
                Total Weight
              </p>
              <p className="font-semibold">{totalPreviewWeight.toFixed(2)} lbs</p>
            </div>
            <div>
              <p className="text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Total Cost
              </p>
              <p className="font-semibold">${totalPreviewCost.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Avg Weight/Animal</p>
              <p className="font-semibold">
                {rfids.length > 0 ? (totalPreviewWeight / rfids.length).toFixed(2) : 0} lbs
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Avg Cost/Animal</p>
              <p className="font-semibold">
                ${rfids.length > 0 ? (totalPreviewCost / rfids.length).toFixed(2) : 0}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Average Cost per Pound</p>
              <p className="font-semibold text-lg">${avgCostPerPound.toFixed(2)}/lb</p>
            </div>
          </div>

          {!isValid && (
            <p className="text-sm text-destructive">
              Please enter weight information for all cattle
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={handleComplete} disabled={!isValid} className="flex-1">
          Continue to Import
        </Button>
      </div>
    </div>
  )
}

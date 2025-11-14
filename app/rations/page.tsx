"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Calculator, Plus, Save, Trash2, Info } from "lucide-react"
import { inventoryService } from "@/lib/inventory/inventory-service"
import { InventoryItem, isFeedCategory, isSupplementCategory } from "@/lib/inventory/inventory-types"
import { toast } from "sonner"

interface FeedIngredient {
  id: string
  name: string
  amount: number // lbs per head per day
  unit: string
  cost: number
  protein: number // % DM basis
  energy: number // Mcal/lb (TDN)
  available?: number // from inventory
}

interface RationTemplate {
  id: string
  name: string
  cattleType: string
  targetWeight: number
  ingredients: FeedIngredient[]
  createdAt: string
}

export default function RationsPage() {
  const { user } = useAuth()
  const [isInitialized, setIsInitialized] = useState(false)

  // Cattle info
  const [cattleType, setCattleType] = useState("growing")
  const [currentWeight, setCurrentWeight] = useState("600")
  const [targetGain, setTargetGain] = useState("2.5")
  const [headCount, setHeadCount] = useState("1")

  // Feed ingredients
  const [ingredients, setIngredients] = useState<FeedIngredient[]>([])
  const [availableFeeds, setAvailableFeeds] = useState<InventoryItem[]>([])

  // Saved rations
  const [savedRations, setSavedRations] = useState<RationTemplate[]>([])

  // Initialize inventory service
  useEffect(() => {
    if (user?.uid && !isInitialized) {
      inventoryService.initialize(user.uid).then(() => {
        setIsInitialized(true)
        loadAvailableFeeds()
      })
    }
  }, [user?.uid])

  const loadAvailableFeeds = () => {
    const allInventory = inventoryService.getInventory()
    const feeds = allInventory.filter(item =>
      isFeedCategory(item.category) || isSupplementCategory(item.category)
    )
    setAvailableFeeds(feeds)
  }

  const addIngredient = () => {
    const newIngredient: FeedIngredient = {
      id: Date.now().toString(),
      name: "",
      amount: 0,
      unit: "lbs",
      cost: 0,
      protein: 0,
      energy: 0
    }
    setIngredients([...ingredients, newIngredient])
  }

  const updateIngredient = (id: string, field: keyof FeedIngredient, value: any) => {
    setIngredients(ingredients.map(ing =>
      ing.id === id ? { ...ing, [field]: value } : ing
    ))
  }

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== id))
  }

  const selectFeedFromInventory = (id: string, feedName: string) => {
    const feed = availableFeeds.find(f => f.name === feedName)
    if (feed) {
      updateIngredient(id, 'name', feed.name)
      updateIngredient(id, 'cost', feed.costPerUnit)
      updateIngredient(id, 'available', feed.quantityOnHand)

      // Set default nutrition values based on common feeds
      const nutritionDefaults: Record<string, { protein: number, energy: number }> = {
        'Corn Silage': { protein: 8, energy: 0.70 },
        'Alfalfa Hay': { protein: 18, energy: 0.55 },
        'Grass Hay': { protein: 10, energy: 0.50 },
        'Shell Corn': { protein: 9, energy: 0.90 },
        'Protein Tub': { protein: 32, energy: 0.75 },
        'Mineral Mix': { protein: 0, energy: 0 }
      }

      for (const [key, values] of Object.entries(nutritionDefaults)) {
        if (feed.name.includes(key)) {
          updateIngredient(id, 'protein', values.protein)
          updateIngredient(id, 'energy', values.energy)
          break
        }
      }
    }
  }

  // Calculate total ration metrics
  const calculateTotals = () => {
    const totalDM = ingredients.reduce((sum, ing) => sum + ing.amount, 0)
    const totalCost = ingredients.reduce((sum, ing) => sum + (ing.amount * ing.cost), 0)
    const avgProtein = ingredients.reduce((sum, ing) =>
      sum + (ing.amount * ing.protein), 0) / totalDM || 0
    const avgEnergy = ingredients.reduce((sum, ing) =>
      sum + (ing.amount * ing.energy), 0) / totalDM || 0

    return {
      totalDM: totalDM.toFixed(2),
      totalCost: totalCost.toFixed(2),
      costPerHead: totalCost.toFixed(2),
      costPerDay: (totalCost * parseFloat(headCount || "1")).toFixed(2),
      protein: avgProtein.toFixed(1),
      energy: avgEnergy.toFixed(2)
    }
  }

  // Calculate requirements based on cattle type
  const getRequirements = () => {
    const weight = parseFloat(currentWeight || "600")
    const gain = parseFloat(targetGain || "2.5")

    // Simplified requirements (would be more complex in production)
    const dmIntake = weight * 0.025 // 2.5% of body weight
    const proteinReq = cattleType === "growing" ? 13 : cattleType === "finishing" ? 12 : 11
    const energyReq = cattleType === "growing" ? 0.65 : cattleType === "finishing" ? 0.70 : 0.60

    return {
      dmIntake: dmIntake.toFixed(1),
      protein: proteinReq,
      energy: energyReq.toFixed(2)
    }
  }

  const totals = calculateTotals()
  const requirements = getRequirements()

  const saveRation = () => {
    const name = prompt("Enter a name for this ration:")
    if (!name) return

    const newRation: RationTemplate = {
      id: Date.now().toString(),
      name,
      cattleType,
      targetWeight: parseFloat(currentWeight || "600"),
      ingredients: [...ingredients],
      createdAt: new Date().toISOString()
    }

    setSavedRations([...savedRations, newRation])
    toast.success(`Ration "${name}" saved!`)
  }

  const loadRation = (ration: RationTemplate) => {
    setCattleType(ration.cattleType)
    setCurrentWeight(ration.targetWeight.toString())
    setIngredients([...ration.ingredients])
    toast.success(`Loaded "${ration.name}"`)
  }

  return (
    <div className="h-full overflow-auto p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calculator className="h-8 w-8" />
              Ration Calculator
            </h1>
            <p className="text-muted-foreground mt-1">
              Simple ration balancing for your cattle
            </p>
          </div>
        </div>

        <Tabs defaultValue="calculator" className="space-y-6">
          <TabsList>
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="saved">Saved Rations ({savedRations.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-6">
            {/* Cattle Information */}
            <Card>
              <CardHeader>
                <CardTitle>Cattle Information</CardTitle>
                <CardDescription>Enter details about your cattle</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label>Cattle Type</Label>
                    <Select value={cattleType} onValueChange={setCattleType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="growing">Growing</SelectItem>
                        <SelectItem value="finishing">Finishing</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="breeding">Breeding Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Current Weight (lbs)</Label>
                    <Input
                      type="number"
                      value={currentWeight}
                      onChange={(e) => setCurrentWeight(e.target.value)}
                      placeholder="600"
                    />
                  </div>

                  <div>
                    <Label>Target Gain (lbs/day)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={targetGain}
                      onChange={(e) => setTargetGain(e.target.value)}
                      placeholder="2.5"
                    />
                  </div>

                  <div>
                    <Label>Number of Head</Label>
                    <Input
                      type="number"
                      value={headCount}
                      onChange={(e) => setHeadCount(e.target.value)}
                      placeholder="1"
                    />
                  </div>
                </div>

                {/* Requirements */}
                <div className="bg-muted/50 rounded-lg p-4 mt-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Estimated Requirements
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Dry Matter Intake</p>
                      <p className="text-lg font-semibold">{requirements.dmIntake} lbs/day</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Protein Needed</p>
                      <p className="text-lg font-semibold">{requirements.protein}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Energy Needed</p>
                      <p className="text-lg font-semibold">{requirements.energy} Mcal/lb</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feed Ingredients */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Feed Ingredients</CardTitle>
                    <CardDescription>Add feeds to create your ration</CardDescription>
                  </div>
                  <Button onClick={addIngredient} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Feed
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {ingredients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calculator className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No ingredients added yet</p>
                    <p className="text-sm">Click "Add Feed" to start building your ration</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ingredients.map((ingredient) => (
                      <div key={ingredient.id} className="flex gap-2 items-start p-3 border rounded-lg">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-6 gap-2">
                          <div className="sm:col-span-2">
                            <Label className="text-xs">Feed Name</Label>
                            <Select
                              value={ingredient.name}
                              onValueChange={(value) => selectFeedFromInventory(ingredient.id, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select feed" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableFeeds.map(feed => (
                                  <SelectItem key={feed.id} value={feed.name}>
                                    {feed.name} ({feed.quantityOnHand} {feed.unit})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs">Amount (lbs/day)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={ingredient.amount}
                              onChange={(e) => updateIngredient(ingredient.id, 'amount', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Protein (%)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={ingredient.protein}
                              onChange={(e) => updateIngredient(ingredient.id, 'protein', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Energy (Mcal/lb)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={ingredient.energy}
                              onChange={(e) => updateIngredient(ingredient.id, 'energy', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Cost/Head</Label>
                            <Input
                              value={`$${(ingredient.amount * ingredient.cost).toFixed(2)}`}
                              disabled
                            />
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeIngredient(ingredient.id)}
                          className="mt-6"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Results */}
            {ingredients.length > 0 && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle>Ration Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total DM</p>
                      <p className="text-2xl font-bold">{totals.totalDM} lbs</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Protein</p>
                      <p className="text-2xl font-bold">{totals.protein}%</p>
                      <p className="text-xs text-muted-foreground">Target: {requirements.protein}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Energy</p>
                      <p className="text-2xl font-bold">{totals.energy}</p>
                      <p className="text-xs text-muted-foreground">Target: {requirements.energy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cost/Head/Day</p>
                      <p className="text-2xl font-bold">${totals.costPerHead}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Cost/Day</p>
                      <p className="text-2xl font-bold">${totals.costPerDay}</p>
                      <p className="text-xs text-muted-foreground">{headCount} head</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cost/Month</p>
                      <p className="text-2xl font-bold">${(parseFloat(totals.costPerDay) * 30).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button onClick={saveRation}>
                      <Save className="h-4 w-4 mr-2" />
                      Save This Ration
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="saved" className="space-y-4">
            {savedRations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Save className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No saved rations yet</p>
                  <p className="text-sm">Create and save a ration from the Calculator tab</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {savedRations.map((ration) => (
                  <Card key={ration.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{ration.name}</CardTitle>
                          <CardDescription>
                            {ration.cattleType} • {ration.targetWeight} lbs • {ration.ingredients.length} ingredients
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => loadRation(ration)} size="sm">Load</Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSavedRations(savedRations.filter(r => r.id !== ration.id))
                              toast.success("Ration deleted")
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm space-y-1">
                        {ration.ingredients.map((ing, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{ing.name}</span>
                            <span className="text-muted-foreground">{ing.amount} lbs/day</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

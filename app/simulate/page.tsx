"use client"

import { useState } from "react"
import { Calculator, TrendingUp, DollarSign, Plus, Save, Play, Copy, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useSimulationStore } from "@/hooks/use-simulation-store"
import { useBatchStore } from "@/hooks/use-batch-store"
import { useToast } from "@/hooks/use-toast"
import { SimulationParameters } from "@/lib/simulation-store"
import Link from "next/link"

export default function SimulatePage() {
  const { simulations, addSimulation, calculateResults, deleteSimulation, duplicateSimulation, markAsExecuted } =
    useSimulationStore()
  const { addBatch } = useBatchStore()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<"new" | "saved">("new")
  const [simulationName, setSimulationName] = useState("")
  const [supplier, setSupplier] = useState("")
  const [feederLoanNumber, setFeederLoanNumber] = useState("")
  const [description, setDescription] = useState("")

  const [params, setParams] = useState<SimulationParameters>({
    headCount: 100,
    purchasePricePerHead: 1200,
    averagePurchaseWeight: 700,
    feedCostPerDay: 3.5,
    feedDays: 180,
    veterinaryCost: 5000,
    laborCost: 8000,
    transportCost: 2500,
    otherCosts: 3000,
    targetSaleWeight: 1300,
    targetSalePricePerLb: 1.45,
  })

  const results = calculateResults(params)

  const handleSaveSimulation = () => {
    if (!simulationName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for this simulation.",
        variant: "destructive",
      })
      return
    }

    addSimulation(simulationName, params, {
      description,
      supplier,
      feederLoanNumber,
    })

    toast({
      title: "Simulation Saved",
      description: `"${simulationName}" has been saved successfully.`,
    })

    // Reset form
    setSimulationName("")
    setDescription("")
    setActiveTab("saved")
  }

  const handleExecuteSimulation = (simulationId?: string) => {
    const simToExecute = simulationId ? simulations.find((s) => s.id === simulationId) : null
    const paramsToUse = simToExecute ? simToExecute.parameters : params
    const nameToUse = simToExecute ? simToExecute.name : simulationName || "New Purchase"
    const supplierToUse = simToExecute ? simToExecute.supplier : supplier
    const loanToUse = simToExecute ? simToExecute.feederLoanNumber : feederLoanNumber

    const batch = addBatch({
      name: nameToUse,
      supplier: supplierToUse || "Unknown",
      purchaseDate: new Date().toISOString().split("T")[0],
      headCount: paramsToUse.headCount,
      averagePurchaseWeight: paramsToUse.averagePurchaseWeight,
      averagePurchasePrice: paramsToUse.purchasePricePerHead,
      feederLoanNumber: loanToUse,
      notes: `Executed from simulation. Target sale: ${paramsToUse.targetSaleWeight}lbs @ $${paramsToUse.targetSalePricePerLb}/lb`,
    })

    if (simulationId) {
      markAsExecuted(simulationId, batch.id)
    }

    toast({
      title: "Simulation Executed",
      description: `Batch "${nameToUse}" has been created successfully.`,
    })
  }

  const handleLoadSimulation = (id: string) => {
    const sim = simulations.find((s) => s.id === id)
    if (sim) {
      setParams(sim.parameters)
      setSimulationName(sim.name)
      setSupplier(sim.supplier || "")
      setFeederLoanNumber(sim.feederLoanNumber || "")
      setDescription(sim.description || "")
      setActiveTab("new")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <Link href="/" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground mb-1 block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <Calculator className="h-6 w-6" />
                Purchase Simulator
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Model cattle purchases and calculate profitability
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "new" ? "default" : "outline"}
            onClick={() => setActiveTab("new")}
            className="flex-1 sm:flex-none"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Simulation
          </Button>
          <Button
            variant={activeTab === "saved" ? "default" : "outline"}
            onClick={() => setActiveTab("saved")}
            className="flex-1 sm:flex-none"
          >
            Saved Simulations ({simulations.length})
          </Button>
        </div>

        {activeTab === "new" && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Input Parameters */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Simulation Details</CardTitle>
                  <CardDescription>Name and describe this simulation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Simulation Name</Label>
                      <Input
                        id="name"
                        value={simulationName}
                        onChange={(e) => setSimulationName(e.target.value)}
                        placeholder="e.g., Spring 2025 Purchase"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supplier">Supplier</Label>
                      <Input
                        id="supplier"
                        value={supplier}
                        onChange={(e) => setSupplier(e.target.value)}
                        placeholder="e.g., ABC Cattle Co."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="loanNumber">Feeder Loan Number</Label>
                      <Input
                        id="loanNumber"
                        value={feederLoanNumber}
                        onChange={(e) => setFeederLoanNumber(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add notes about this simulation..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Purchase Parameters */}
              <Card>
                <CardHeader>
                  <CardTitle>Purchase Details</CardTitle>
                  <CardDescription>Initial purchase parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="headCount">Head Count</Label>
                      <Input
                        id="headCount"
                        type="number"
                        value={params.headCount}
                        onChange={(e) => setParams({ ...params, headCount: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="purchasePrice">Price per Head ($)</Label>
                      <Input
                        id="purchasePrice"
                        type="number"
                        step="0.01"
                        value={params.purchasePricePerHead}
                        onChange={(e) => setParams({ ...params, purchasePricePerHead: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="purchaseWeight">Avg Weight (lbs)</Label>
                      <Input
                        id="purchaseWeight"
                        type="number"
                        value={params.averagePurchaseWeight}
                        onChange={(e) => setParams({ ...params, averagePurchaseWeight: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feed Costs */}
              <Card>
                <CardHeader>
                  <CardTitle>Feed Costs</CardTitle>
                  <CardDescription>Daily feed costs and feeding period</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="feedCostPerDay">Cost per Head per Day ($)</Label>
                      <Input
                        id="feedCostPerDay"
                        type="number"
                        step="0.01"
                        value={params.feedCostPerDay}
                        onChange={(e) => setParams({ ...params, feedCostPerDay: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="feedDays">Days on Feed</Label>
                      <Input
                        id="feedDays"
                        type="number"
                        value={params.feedDays}
                        onChange={(e) => setParams({ ...params, feedDays: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    Total Feed Cost: ${results.totalFeedCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </CardContent>
              </Card>

              {/* Other Costs */}
              <Card>
                <CardHeader>
                  <CardTitle>Other Costs</CardTitle>
                  <CardDescription>Additional expenses for the entire batch</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vetCost">Veterinary Cost ($)</Label>
                      <Input
                        id="vetCost"
                        type="number"
                        step="0.01"
                        value={params.veterinaryCost}
                        onChange={(e) => setParams({ ...params, veterinaryCost: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="laborCost">Labor Cost ($)</Label>
                      <Input
                        id="laborCost"
                        type="number"
                        step="0.01"
                        value={params.laborCost}
                        onChange={(e) => setParams({ ...params, laborCost: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="transportCost">Transport Cost ($)</Label>
                      <Input
                        id="transportCost"
                        type="number"
                        step="0.01"
                        value={params.transportCost}
                        onChange={(e) => setParams({ ...params, transportCost: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="otherCosts">Other Costs ($)</Label>
                      <Input
                        id="otherCosts"
                        type="number"
                        step="0.01"
                        value={params.otherCosts}
                        onChange={(e) => setParams({ ...params, otherCosts: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Target Sale */}
              <Card>
                <CardHeader>
                  <CardTitle>Target Sale Parameters</CardTitle>
                  <CardDescription>Expected sale weight and price</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="targetWeight">Target Sale Weight (lbs)</Label>
                      <Input
                        id="targetWeight"
                        type="number"
                        value={params.targetSaleWeight}
                        onChange={(e) => setParams({ ...params, targetSaleWeight: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="targetPrice">Target Price per Lb ($)</Label>
                      <Input
                        id="targetPrice"
                        type="number"
                        step="0.01"
                        value={params.targetSalePricePerLb}
                        onChange={(e) => setParams({ ...params, targetSalePricePerLb: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-3">
                <Button onClick={handleSaveSimulation} variant="outline" className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Save Simulation
                </Button>
                <Button onClick={() => handleExecuteSimulation()} className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  Execute Purchase
                </Button>
              </div>
            </div>

            {/* Results Panel */}
            <div className="space-y-4">
              {/* Cost Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cost Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Purchase Cost</span>
                    <span className="font-medium">
                      ${results.totalPurchaseCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Feed Cost</span>
                    <span className="font-medium">
                      ${results.totalFeedCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Veterinary</span>
                    <span className="font-medium">
                      ${results.totalVeterinaryCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Labor</span>
                    <span className="font-medium">
                      ${results.totalLaborCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Transport</span>
                    <span className="font-medium">
                      ${results.totalTransportCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Other</span>
                    <span className="font-medium">
                      ${results.totalOtherCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-bold">
                    <span>Total Costs</span>
                    <span>${results.totalCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between text-sm bg-muted p-2 rounded">
                    <span>Cost per Head</span>
                    <span className="font-medium">
                      ${results.costPerHead.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* P&L */}
              <Card className={results.grossProfit >= 0 ? "border-green-500" : "border-red-500"}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Profit & Loss
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Revenue</span>
                    <span className="font-medium text-green-600">
                      ${results.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Costs</span>
                    <span className="font-medium text-red-600">
                      ${results.totalCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div
                    className={`border-t pt-3 flex justify-between font-bold text-lg ${
                      results.grossProfit >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    <span>Gross Profit</span>
                    <span>
                      {results.grossProfit >= 0 ? "+" : "-"}$
                      {Math.abs(results.grossProfit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm bg-muted p-2 rounded">
                    <span>Profit per Head</span>
                    <span className={`font-medium ${results.grossProfitPerHead >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {results.grossProfitPerHead >= 0 ? "+" : ""}$
                      {results.grossProfitPerHead.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm bg-muted p-2 rounded">
                    <span>Profit Margin</span>
                    <span className={`font-medium ${results.profitMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {results.profitMargin.toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Weight Gain per Head</span>
                    <span className="font-medium">{results.weightGainPerHead.toFixed(0)} lbs</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Weight Gain</span>
                    <span className="font-medium">
                      {results.totalWeightGain.toLocaleString(undefined, { maximumFractionDigits: 0 })} lbs
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cost of Gain</span>
                    <span className="font-medium">${results.costOfGain.toFixed(2)}/lb</span>
                  </div>
                </CardContent>
              </Card>

              {/* Break-Even Analysis */}
              <Card className="border-orange-500">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Break-Even Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Break-Even Price/lb</span>
                    <span className="font-bold text-orange-600">${results.breakEvenPricePerLb.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Target Price/lb</span>
                    <span className="font-medium">${params.targetSalePricePerLb.toFixed(3)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                    {results.grossProfit >= 0 ? (
                      <span className="text-green-600 font-medium">
                        ✓ This simulation is profitable at current target price
                      </span>
                    ) : (
                      <span className="text-red-600 font-medium">
                        ⚠ Need ${Math.abs(results.requiredMarginForProfit).toFixed(2)}% higher price to break even
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "saved" && (
          <div className="space-y-4">
            {simulations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Saved Simulations</h3>
                  <p className="text-muted-foreground mb-4">Create and save your first purchase simulation</p>
                  <Button onClick={() => setActiveTab("new")}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Simulation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              simulations.map((sim) => (
                <Card key={sim.id} className={sim.executed ? "opacity-60" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{sim.name}</h3>
                          {sim.executed && <Badge variant="secondary">Executed</Badge>}
                          {sim.results.grossProfit >= 0 ? (
                            <Badge variant="default" className="bg-green-600">
                              Profitable
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Loss</Badge>
                          )}
                        </div>
                        {sim.description && <p className="text-sm text-muted-foreground mb-3">{sim.description}</p>}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Head Count</p>
                            <p className="font-medium">{sim.parameters.headCount}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Cost</p>
                            <p className="font-medium">
                              ${sim.results.totalCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Projected Profit</p>
                            <p
                              className={`font-medium ${
                                sim.results.grossProfit >= 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {sim.results.grossProfit >= 0 ? "+" : ""}$
                              {sim.results.grossProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Margin</p>
                            <p
                              className={`font-medium ${
                                sim.results.profitMargin >= 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {sim.results.profitMargin.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleLoadSimulation(sim.id)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => duplicateSimulation(sim.id)}
                          title="Duplicate"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {!sim.executed && (
                          <Button size="sm" onClick={() => handleExecuteSimulation(sim.id)}>
                            <Play className="h-4 w-4 mr-1" />
                            Execute
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Delete this simulation?")) {
                              deleteSimulation(sim.id)
                              toast({ title: "Simulation Deleted", description: "The simulation has been removed." })
                            }
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}

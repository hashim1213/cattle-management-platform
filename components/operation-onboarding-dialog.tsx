"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Beef, TrendingUp, Building2, CheckCircle2, Loader2 } from "lucide-react"
import { type FarmSector } from "@/lib/farm-settings-store"

interface OperationOnboardingDialogProps {
  open: boolean
  onComplete: (farmName: string, sector: FarmSector) => Promise<void>
}

interface OperationType {
  id: FarmSector
  title: string
  description: string
  icon: React.ElementType
  features: string[]
  comingSoon?: boolean
}

const operationTypes: OperationType[] = [
  {
    id: "cowcalf",
    title: "Cow-Calf Operation",
    description: "Breeding and raising cattle from birth to weaning",
    icon: Beef,
    features: [
      "Breeding management",
      "Calf tracking",
      "Pasture rotation",
      "Health records",
    ],
  },
  {
    id: "backgrounder",
    title: "Backgrounding",
    description: "Buying, feeding, and selling cattle for profit",
    icon: TrendingUp,
    features: [
      "Purchase tracking",
      "Feed management",
      "Weight gain monitoring",
      "Sale management",
    ],
  },
  {
    id: "feedlot",
    title: "Feedlot Operation",
    description: "Large-scale finishing operation (5,000+ head)",
    icon: Building2,
    features: [
      "Pen management",
      "Batch processing",
      "Feed mill integration",
      "Advanced analytics",
    ],
    comingSoon: true,
  },
]

export function OperationOnboardingDialog({
  open,
  onComplete,
}: OperationOnboardingDialogProps) {
  const [step, setStep] = useState<"welcome" | "select" | "details">("welcome")
  const [selectedOperation, setSelectedOperation] = useState<FarmSector | null>(null)
  const [farmName, setFarmName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleOperationSelect = (operationId: FarmSector) => {
    // Prevent selecting feedlot for now
    const operation = operationTypes.find((op) => op.id === operationId)
    if (operation?.comingSoon) return

    setSelectedOperation(operationId)
    setStep("details")
  }

  const handleComplete = async () => {
    if (farmName && selectedOperation && !isLoading) {
      setIsLoading(true)
      try {
        await onComplete(farmName, selectedOperation)
      } catch (error) {
        console.error("Failed to complete setup:", error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[700px]" onInteractOutside={(e) => e.preventDefault()}>
        {step === "welcome" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Welcome to Cattle Management Platform</DialogTitle>
              <DialogDescription className="text-base">
                Let's get your operation set up in just a few steps
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  1
                </div>
                <p>Choose your operation type</p>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  2
                </div>
                <p>Enter your farm details</p>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  3
                </div>
                <p>Start managing your cattle</p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep("select")} size="lg">
                Get Started
              </Button>
            </div>
          </>
        )}

        {step === "select" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Choose Your Operation Type</DialogTitle>
              <DialogDescription className="text-base">
                Select the option that best describes your cattle operation
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3">
              {operationTypes.map((operation) => {
                const Icon = operation.icon
                return (
                  <Card
                    key={operation.id}
                    className={`cursor-pointer transition-all hover:border-primary ${
                      operation.comingSoon ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                    onClick={() => handleOperationSelect(operation.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {operation.title}
                              {operation.comingSoon && (
                                <Badge variant="secondary" className="text-xs">
                                  Coming Soon
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription>{operation.description}</CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        {operation.features.map((feature) => (
                          <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        )}

        {step === "details" && selectedOperation && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Farm Details</DialogTitle>
              <DialogDescription className="text-base">
                Tell us a bit about your operation
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="farmName">Farm/Ranch Name *</Label>
                <Input
                  id="farmName"
                  placeholder="e.g., Smith Family Ranch"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  This will appear on reports and throughout the platform
                </p>
              </div>

              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Selected Operation Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const operation = operationTypes.find((op) => op.id === selectedOperation)
                      if (!operation) return null
                      const Icon = operation.icon
                      return (
                        <>
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{operation.title}</p>
                            <p className="text-sm text-muted-foreground">{operation.description}</p>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("select")} disabled={isLoading}>
                Back
              </Button>
              <Button onClick={handleComplete} disabled={!farmName.trim() || isLoading} size="lg">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing Setup...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

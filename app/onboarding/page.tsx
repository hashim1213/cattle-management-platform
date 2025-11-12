"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Beef,
  TrendingUp,
  Building2,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Plus,
  X
} from "lucide-react"
import { type FarmSector, farmSettingsStore } from "@/lib/farm-settings-store"
import { lifecycleConfig, type LifecycleStage } from "@/lib/lifecycle-config"
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

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

const STAGE_COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
  "#f97316", // orange
]

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // Step 1: Operation type
  const [selectedOperation, setSelectedOperation] = useState<FarmSector | null>(null)

  // Step 2: Farm details
  const [farmName, setFarmName] = useState("")

  // Step 3: Lifecycle stages
  const [stages, setStages] = useState<Omit<LifecycleStage, "id" | "order">[]>([
    { name: "Calf", color: "#3b82f6", description: "Newborn cattle" },
    { name: "Weaned Calf", color: "#8b5cf6", description: "Recently weaned" },
    { name: "Yearling", color: "#ec4899", description: "Second year of life" },
    { name: "Breeding", color: "#10b981", description: "Reproduction cycle" },
    { name: "Finishing", color: "#f59e0b", description: "Prepared for market" },
  ])
  const [newStageName, setNewStageName] = useState("")

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!authLoading && !user) {
        router.push("/login")
        return
      }

      if (user) {
        // Check if user has already completed onboarding
        try {
          const userProfileRef = doc(db, "userProfiles", user.uid)
          const userProfileSnap = await getDoc(userProfileRef)

          if (userProfileSnap.exists() && userProfileSnap.data()?.onboardingCompleted) {
            // Already completed onboarding, redirect to dashboard
            router.push("/")
          }
        } catch (error) {
          console.error("Error checking onboarding status:", error)
        }
      }
    }

    checkOnboardingStatus()
  }, [user, authLoading, router])

  const progress = (step / 4) * 100

  const handleOperationSelect = (operationId: FarmSector) => {
    const operation = operationTypes.find((op) => op.id === operationId)
    if (operation?.comingSoon) return
    setSelectedOperation(operationId)
  }

  const handleAddStage = () => {
    if (!newStageName.trim()) return
    const color = STAGE_COLORS[stages.length % STAGE_COLORS.length]
    setStages([...stages, { name: newStageName.trim(), color, description: "" }])
    setNewStageName("")
  }

  const handleRemoveStage = (index: number) => {
    setStages(stages.filter((_, i) => i !== index))
  }

  const handleComplete = async () => {
    if (!farmName.trim() || !selectedOperation || isLoading || !user) return

    setIsLoading(true)
    try {
      console.log("Starting onboarding completion...")

      // Initialize farm settings
      await farmSettingsStore.initializeSettings(farmName.trim(), selectedOperation, user.uid)
      console.log("Farm settings initialized")

      // Save lifecycle stages to Firestore
      const lifecycleStages = stages.map((stage, index) => ({
        id: `stage-${Date.now()}-${index}`,
        name: stage.name,
        order: index + 1,
        color: stage.color,
        description: stage.description || "",
      }))

      console.log("Lifecycle stages prepared:", lifecycleStages)

      // Get existing user profile data
      const userProfileRef = doc(db, "userProfiles", user.uid)
      const userProfileSnap = await getDoc(userProfileRef)

      const updateData = {
        lifecycleStages,
        onboardingCompleted: true,
        updatedAt: new Date().toISOString(),
      }

      if (userProfileSnap.exists()) {
        // Update existing profile with lifecycle and mark onboarding complete
        await updateDoc(userProfileRef, updateData)
        console.log("User profile updated with lifecycle stages")
      } else {
        // If profile doesn't exist, create it with setDoc
        await setDoc(userProfileRef, {
          ...updateData,
          createdAt: new Date().toISOString(),
        })
        console.log("User profile created with lifecycle stages")
      }

      // Also save to local lifecycle config for immediate use
      lifecycleConfig.resetToDefault()
      const existingStages = lifecycleConfig.getStages()
      existingStages.forEach(stage => {
        lifecycleConfig.removeStage(stage.id)
      })

      // Add user's custom stages
      stages.forEach((stage) => {
        lifecycleConfig.addStage(stage)
      })

      console.log("Onboarding completed successfully, redirecting to dashboard")

      // Redirect to dashboard
      router.push("/")
    } catch (error) {
      console.error("Failed to complete onboarding:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
              <Beef className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center mb-2">
            Welcome to Cattle Management Platform
          </h1>
          <p className="text-center text-muted-foreground">
            Let's set up your operation in a few simple steps
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="text-sm text-muted-foreground">Step {step} of 4</span>
          </div>
        </div>

        {/* Step 1: Welcome & Operation Type */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Choose Your Operation Type</CardTitle>
                <CardDescription>
                  Select the option that best describes your cattle operation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {operationTypes.map((operation) => {
                  const Icon = operation.icon
                  const isSelected = selectedOperation === operation.id
                  return (
                    <Card
                      key={operation.id}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary border-2 bg-primary/5"
                          : "hover:border-primary/50"
                      } ${
                        operation.comingSoon ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                      onClick={() => handleOperationSelect(operation.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              isSelected ? "bg-primary" : "bg-primary/10"
                            }`}>
                              <Icon className={`h-6 w-6 ${isSelected ? "text-white" : "text-primary"}`} />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg flex items-center gap-2">
                                {operation.title}
                                {operation.comingSoon && (
                                  <Badge variant="secondary" className="text-xs">
                                    Coming Soon
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                {operation.description}
                              </CardDescription>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-2">
                          {operation.features.map((feature) => (
                            <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedOperation}
                size="lg"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Farm Details */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Farm Details</CardTitle>
                <CardDescription>
                  Tell us about your operation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="farmName">Farm/Ranch Name *</Label>
                  <Input
                    id="farmName"
                    placeholder="e.g., Smith Family Ranch"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    className="text-lg"
                    autoFocus
                  />
                  <p className="text-sm text-muted-foreground">
                    This will appear on reports and throughout the platform
                  </p>
                </div>

                <Card className="bg-muted/50 border-muted">
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
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)} size="lg">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!farmName.trim()}
                size="lg"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Lifecycle Stages */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Production Lifecycle Stages</CardTitle>
                <CardDescription>
                  Customize the stages cattle go through in your operation. These stages help you track and organize your cattle throughout their lifecycle.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Existing Stages */}
                <div className="space-y-3">
                  {stages.map((stage, index) => (
                    <Card key={index} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                            style={{ backgroundColor: stage.color }}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{stage.name}</p>
                            {stage.description && (
                              <p className="text-sm text-muted-foreground">{stage.description}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveStage(index)}
                            disabled={stages.length <= 1}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Add New Stage */}
                <div className="space-y-2">
                  <Label htmlFor="newStage">Add a Stage</Label>
                  <div className="flex gap-2">
                    <Input
                      id="newStage"
                      placeholder="e.g., Growing, Replacement Heifer, etc."
                      value={newStageName}
                      onChange={(e) => setNewStageName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddStage()
                        }
                      }}
                    />
                    <Button
                      onClick={handleAddStage}
                      disabled={!newStageName.trim()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Add stages that match your operation's workflow
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Tip:</strong> You can always modify these stages later in Settings. Stages help you organize cattle by their current phase in your operation.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)} size="lg">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={() => setStep(4)}
                disabled={stages.length === 0}
                size="lg"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Complete */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Review Your Setup</CardTitle>
                <CardDescription>
                  Everything looks good? Let's get started!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Farm Details Summary */}
                <div>
                  <h3 className="font-semibold mb-3">Farm Details</h3>
                  <Card className="bg-muted/50 border-muted">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-muted-foreground">Farm Name</span>
                          <p className="font-medium">{farmName}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Operation Type</span>
                          <p className="font-medium">
                            {operationTypes.find((op) => op.id === selectedOperation)?.title}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Lifecycle Stages Summary */}
                <div>
                  <h3 className="font-semibold mb-3">Lifecycle Stages ({stages.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {stages.map((stage, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="px-3 py-1.5"
                        style={{
                          backgroundColor: `${stage.color}20`,
                          borderColor: stage.color,
                          color: stage.color
                        }}
                      >
                        {index + 1}. {stage.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100 mb-1">
                        Ready to go!
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-200">
                        Your platform is configured and ready to use. You can start adding cattle, managing inventory, and tracking operations right away.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)} disabled={isLoading} size="lg">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={isLoading}
                size="lg"
                className="min-w-[200px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

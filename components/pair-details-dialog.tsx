"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { firebaseDataStore as dataStore } from "@/lib/data-store-firebase"
import { Sprout, Baby, Calendar, TrendingUp, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import type { CattlePair } from "@/lib/pairs-store"

interface PairDetailsDialogProps {
  pair: CattlePair | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PairDetailsDialog({ pair, open, onOpenChange }: PairDetailsDialogProps) {
  const router = useRouter()

  if (!pair) return null

  const dam = dataStore.getCattle().find((c) => c.id === pair.damId)
  const calf = dataStore.getCattle().find((c) => c.id === pair.calfId)

  if (!dam || !calf) return null

  const ageInDays = Math.floor(
    (new Date().getTime() - new Date(pair.pairDate).getTime()) / (1000 * 60 * 60 * 24)
  )
  const ageInMonths = (ageInDays / 30).toFixed(1)

  const currentWeight = calf.weights?.[calf.weights.length - 1]?.weight || calf.weight
  const birthWeight = pair.birthWeight || 0
  const totalGain = (currentWeight || 0) - birthWeight
  const adg = ageInDays > 0 && totalGain > 0 ? totalGain / ageInDays : 0

  const handleViewCattle = (cattleId: string) => {
    onOpenChange(false)
    router.push(`/cattle/${cattleId}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Pair Details</DialogTitle>
          <DialogDescription>
            Dam-calf pair information and performance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge
              variant={
                pair.status === "active"
                  ? "default"
                  : pair.status === "weaned"
                    ? "secondary"
                    : "outline"
              }
              className="capitalize"
            >
              {pair.status}
            </Badge>
            {pair.weanDate && (
              <span className="text-sm text-muted-foreground">
                Weaned on {new Date(pair.weanDate).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Dam Information */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sprout className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">Dam (Mother Cow)</h3>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewCattle(dam.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Tag:</span>
                  <span className="ml-2 font-medium">#{dam.tagNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Breed:</span>
                  <span className="ml-2 font-medium">{dam.breed}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Age:</span>
                  <span className="ml-2 font-medium">
                    {dam.birthDate
                      ? `${Math.floor((new Date().getTime() - new Date(dam.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365))} years`
                      : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Weight:</span>
                  <span className="ml-2 font-medium">
                    {dam.weight ? `${dam.weight} lbs` : "-"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calf Information */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Baby className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">Calf</h3>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewCattle(calf.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Tag:</span>
                  <span className="ml-2 font-medium">#{calf.tagNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Sex:</span>
                  <span className="ml-2 font-medium">{calf.sex}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Breed:</span>
                  <span className="ml-2 font-medium">{calf.breed}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Current Stage:</span>
                  <span className="ml-2 font-medium capitalize">
                    {calf.stage === "weanedcalf" ? "Weaned Calf" : calf.stage}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pairing Information */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Pairing Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Birth/Pair Date:</span>
                  <span className="ml-2 font-medium">
                    {new Date(pair.pairDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Age:</span>
                  <span className="ml-2 font-medium">
                    {ageInMonths} months ({ageInDays} days)
                  </span>
                </div>
                {pair.birthWeight && (
                  <div>
                    <span className="text-muted-foreground">Birth Weight:</span>
                    <span className="ml-2 font-medium">{pair.birthWeight} lbs</span>
                  </div>
                )}
                {currentWeight && (
                  <div>
                    <span className="text-muted-foreground">Current Weight:</span>
                    <span className="ml-2 font-medium">{currentWeight} lbs</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          {adg > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">Performance</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Gain:</span>
                    <span className="ml-2 font-medium">{totalGain.toFixed(0)} lbs</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ADG:</span>
                    <span className="ml-2 font-medium">{adg.toFixed(2)} lbs/day</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weaning Information (if weaned) */}
          {pair.status === "weaned" && pair.weanDate && (
            <Card className="border-green-500">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 text-green-900">Weaning Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Wean Date:</span>
                    <span className="ml-2 font-medium">
                      {new Date(pair.weanDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Wean Weight:</span>
                    <span className="ml-2 font-medium">
                      {pair.weanWeight ? `${pair.weanWeight} lbs` : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Days to Wean:</span>
                    <span className="ml-2 font-medium">
                      {pair.daysToWean ? `${pair.daysToWean} days` : "-"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {pair.notes && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground">{pair.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

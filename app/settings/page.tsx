"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useFarmSettings } from "@/hooks/use-farm-settings"
import { useAuth } from "@/contexts/auth-context"
import { Settings as SettingsIcon, Bell, Database, Save, User, MapPin, Home, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db, auth as firebaseAuth } from "@/lib/firebase"
import { updateProfile } from "firebase/auth"

interface UserProfile {
  displayName: string
  email: string
  farmName: string
  location: string
  farmSize?: string
  otherFarmingActivities?: string
}

export default function SettingsPage() {
  const { settings, updateSettings, updatePreferences, updatePricing } = useFarmSettings()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  // Farm settings
  const [farmName, setFarmName] = useState(settings?.farmName || "")
  const [enablePastures, setEnablePastures] = useState(settings?.preferences.enablePastures ?? true)
  const [enableRations, setEnableRations] = useState(settings?.preferences.enableRations ?? true)

  // Pricing settings
  const [cattlePricePerLb, setCattlePricePerLb] = useState(settings?.pricing?.cattlePricePerLb || 6.97)

  // User profile
  const [displayName, setDisplayName] = useState("")
  const [location, setLocation] = useState("")
  const [farmSize, setFarmSize] = useState("")
  const [otherActivities, setOtherActivities] = useState("")

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) {
        console.log("No user, skipping profile load")
        return
      }

      try {
        console.log("Loading user profile for:", user.uid)
        const profileRef = doc(db, "userProfiles", user.uid)
        const profileSnap = await getDoc(profileRef)

        if (profileSnap.exists()) {
          const data = profileSnap.data() as UserProfile
          console.log("User profile loaded:", data)
          setUserProfile(data)
          setDisplayName(data.displayName || "")
          setLocation(data.location || "")
          setFarmSize(data.farmSize || "")
          setOtherActivities(data.otherFarmingActivities || "")
          setFarmName(data.farmName || settings?.farmName || "")
        } else {
          console.log("User profile does not exist in Firestore")
        }
      } catch (error) {
        console.error("Error loading user profile:", error)
      }
    }

    loadUserProfile()
  }, [user, settings?.farmName])

  // Sync pricing when settings change
  useEffect(() => {
    if (settings?.pricing?.cattlePricePerLb) {
      setCattlePricePerLb(settings.pricing.cattlePricePerLb)
    }
  }, [settings?.pricing?.cattlePricePerLb])

  const handleSaveSettings = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save settings",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Update farm settings
      if (settings) {
        await updateSettings({ farmName })
      }

      await updatePreferences({
        enablePastures,
        enableRations,
      })

      await updatePricing({
        cattlePricePerLb,
      })

      // Update Firebase Auth profile if display name changed
      if (firebaseAuth.currentUser && displayName && displayName !== user.displayName) {
        await updateProfile(firebaseAuth.currentUser, {
          displayName: displayName,
        })
        console.log("Firebase Auth profile updated with new display name")
      }

      // Update user profile in Firestore
      const profileRef = doc(db, "userProfiles", user.uid)
      const updateData = {
        displayName,
        farmName,
        location,
        farmSize: farmSize.trim() || "",
        otherFarmingActivities: otherActivities.trim() || "",
        updatedAt: new Date().toISOString(),
      }

      // Filter out undefined values
      const filteredData = Object.fromEntries(
        Object.entries(updateData).filter(([_, v]) => v !== undefined)
      )

      await updateDoc(profileRef, filteredData)
      console.log("User profile updated successfully")

      toast({
        title: "Settings Saved",
        description: "Your preferences and profile have been updated successfully.",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <SettingsIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-sm text-muted-foreground">
                Manage your profile, farm preferences, and user settings
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 space-y-6 max-w-4xl">
        {/* User Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Profile
            </CardTitle>
            <CardDescription>Update your personal and farm information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Full Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user?.email || ""}
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed here. Contact support to update your email.
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="farmNameProfile" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Farm/Ranch Name
              </Label>
              <Input
                id="farmNameProfile"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="e.g., Smith Family Ranch"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Alberta, Canada"
              />
              <p className="text-xs text-muted-foreground">City, State/Province, Country</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="farmSize">Farm Size</Label>
              <Input
                id="farmSize"
                value={farmSize}
                onChange={(e) => setFarmSize(e.target.value)}
                placeholder="e.g., 500 acres, 200 hectares"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="otherActivities">Other Farming Activities</Label>
              <Textarea
                id="otherActivities"
                value={otherActivities}
                onChange={(e) => setOtherActivities(e.target.value)}
                placeholder="e.g., Crops, hay, other livestock..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Tell us what else you farm besides cattle
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Farm Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Farm Settings
            </CardTitle>
            <CardDescription>Configure your farm features and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <h3 className="font-semibold">Feature Toggles</h3>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enablePastures">Enable Pasture Management</Label>
                  <p className="text-sm text-muted-foreground">
                    Manage pasture rotations and grazing schedules
                  </p>
                </div>
                <Switch
                  id="enablePastures"
                  checked={enablePastures}
                  onCheckedChange={setEnablePastures}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enableRations">Enable Feed Rations</Label>
                  <p className="text-sm text-muted-foreground">
                    Create and manage feed ration formulations
                  </p>
                </div>
                <Switch
                  id="enableRations"
                  checked={enableRations}
                  onCheckedChange={setEnableRations}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing & Financial Settings
            </CardTitle>
            <CardDescription>
              Configure market prices to calculate accurate ROI and profitability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cattlePrice">Cattle Market Price (per lb)</Label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-semibold text-muted-foreground">$</span>
                <Input
                  id="cattlePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={cattlePricePerLb}
                  onChange={(e) => setCattlePricePerLb(parseFloat(e.target.value) || 0)}
                  placeholder="6.97"
                  className="max-w-[200px]"
                />
                <span className="text-sm text-muted-foreground">/ lb</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Current market price for selling cattle. This is used to calculate projected revenue and ROI.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Health Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about cattle health issues
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Low Inventory Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Alerts when feed inventory runs low
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Task Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Reminders for upcoming tasks and appointments
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Disease Outbreak Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Critical alerts for disease outbreaks
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </main>
    </div>
  )
}

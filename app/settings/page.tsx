"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useFarmSettings } from "@/hooks/use-farm-settings"
import { Settings as SettingsIcon, Bell, Database, Save, Trash2, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { resetAllLocalStorageData, resetInventoryData } from "@/lib/reset-data"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const { settings, updateSettings, updatePreferences, initializeSettings } = useFarmSettings()
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const [farmName, setFarmName] = useState(settings?.farmName || "")
  const [enablePastures, setEnablePastures] = useState(settings?.preferences.enablePastures ?? true)
  const [enableRations, setEnableRations] = useState(settings?.preferences.enableRations ?? true)

  const handleSaveSettings = () => {
    if (farmName && !settings) {
      initializeSettings(farmName, "both")
    } else if (settings) {
      updateSettings({ farmName })
    }

    updatePreferences({
      enablePastures,
      enableRations,
    })

    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    })
  }

  const handleResetInventory = () => {
    if (confirm("Are you sure you want to reset all inventory data? This action cannot be undone.")) {
      resetInventoryData()
      toast({
        title: "Inventory Reset",
        description: "All inventory data has been cleared. Refresh the page to see changes.",
      })
      setTimeout(() => window.location.reload(), 1500)
    }
  }

  const handleResetAllData = () => {
    if (confirm("⚠️ WARNING: This will delete ALL your data including cattle, inventory, pens, and settings. Are you absolutely sure?")) {
      if (confirm("This is your last chance. Type 'DELETE' in the next prompt to confirm.") &&
          prompt("Type DELETE to confirm:") === "DELETE") {
        resetAllLocalStorageData()
        toast({
          title: "All Data Reset",
          description: "All application data has been cleared. Redirecting...",
          variant: "destructive",
        })
        setTimeout(() => {
          router.push("/login")
          window.location.reload()
        }, 2000)
      }
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
                Manage your farm preferences and user settings
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 space-y-6 max-w-4xl">
        {/* Farm Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Farm Settings
            </CardTitle>
            <CardDescription>Configure your farm information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="farmName">Farm Name</Label>
              <Input
                id="farmName"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="Enter your farm name"
              />
            </div>

            <Separator />

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

        {/* Danger Zone */}
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions that will delete your data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900 rounded-lg bg-red-50 dark:bg-red-950/20">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">Reset Inventory Data</Label>
                <p className="text-sm text-muted-foreground">
                  Delete all inventory items, transactions, and alerts. Cattle data will be preserved.
                </p>
              </div>
              <Button variant="destructive" onClick={handleResetInventory}>
                <Trash2 className="h-4 w-4 mr-2" />
                Reset Inventory
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900 rounded-lg bg-red-50 dark:bg-red-950/20">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">Reset All Data</Label>
                <p className="text-sm text-muted-foreground">
                  Delete everything including cattle, inventory, pens, batches, and all settings.
                </p>
              </div>
              <Button variant="destructive" onClick={handleResetAllData}>
                <Trash2 className="h-4 w-4 mr-2" />
                Reset Everything
              </Button>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                    Warning: These actions cannot be undone
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-200">
                    Make sure you have backed up any important data before proceeding. Firebase data will not be affected by localStorage resets.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSaveSettings}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </main>
    </div>
  )
}

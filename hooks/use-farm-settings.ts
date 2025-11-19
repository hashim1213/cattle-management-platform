import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { farmSettingsStore, type FarmSettings, type FarmSector } from "@/lib/farm-settings-store"

export function useFarmSettings() {
  const [settings, setSettings] = useState<FarmSettings | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    const updateState = () => {
      setSettings(farmSettingsStore.getSettings())
    }

    // Load settings when user is available
    if (user) {
      farmSettingsStore.loadSettings(user.uid).then(updateState)
    } else {
      farmSettingsStore.clearSettings()
      setSettings(null)
    }

    const unsubscribe = farmSettingsStore.subscribe(updateState)

    return () => unsubscribe()
  }, [user])

  return {
    settings,
    isSetupCompleted: farmSettingsStore.isSetupCompleted(),
    sector: farmSettingsStore.getSector(),
    isCowCalfEnabled: farmSettingsStore.isCowCalfEnabled(),
    isBackgrounderEnabled: farmSettingsStore.isBackgrounderEnabled(),
    isFeedlotEnabled: farmSettingsStore.isFeedlotEnabled(),
    cattlePricePerLb: farmSettingsStore.getCattlePricePerLb(),
    targetDailyGain: farmSettingsStore.getTargetDailyGain(),
    initializeSettings: async (farmName: string, sector: FarmSector) => {
      if (user) {
        await farmSettingsStore.initializeSettings(farmName, sector, user.uid)
      }
    },
    updateSettings: async (updates: Partial<Omit<FarmSettings, "createdAt">>) => {
      if (user) {
        await farmSettingsStore.updateSettings(updates, user.uid)
      }
    },
    updatePreferences: async (preferences: Partial<FarmSettings["preferences"]>) => {
      if (user) {
        await farmSettingsStore.updatePreferences(preferences, user.uid)
      }
    },
    updatePricing: async (pricing: Partial<FarmSettings["pricing"]>) => {
      if (user) {
        await farmSettingsStore.updatePricing(pricing, user.uid)
      }
    },
    updateGrowth: async (growth: Partial<FarmSettings["growth"]>) => {
      if (user) {
        await farmSettingsStore.updateGrowth(growth, user.uid)
      }
    },
  }
}

/**
 * Farm Settings Store - Firebase Edition
 * Manages farm-wide settings including sector/model selection
 * Data stored per user in Firestore
 */

import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"

export type FarmSector = "cowcalf" | "backgrounder" | "feedlot" | "both"

export interface FarmSettings {
  farmName: string
  sector: FarmSector
  setupCompleted: boolean
  createdAt: string
  updatedAt: string
  preferences: {
    enablePastures: boolean
    enableRations: boolean
    defaultWeightUnit: "lbs" | "kg"
    defaultCurrency: "USD" | "CAD"
  }
  pricing: {
    cattlePricePerLb: number // Market price per pound for cattle
  }
  growth: {
    targetDailyGain: number // Target average daily gain in lbs/day
  }
}

class FarmSettingsStore {
  private settings: FarmSettings | null = null
  private listeners: Array<() => void> = []

  constructor() {
    // Settings will be loaded when user logs in
  }

  async loadSettings(userId: string) {
    try {
      const docRef = doc(db, "farmSettings", userId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data() as FarmSettings
        // Ensure pricing field exists for backward compatibility
        if (!data.pricing) {
          data.pricing = {
            cattlePricePerLb: 6.97,
          }
        }
        // Ensure growth field exists for backward compatibility
        if (!data.growth) {
          data.growth = {
            targetDailyGain: 2.5,
          }
        }
        this.settings = data
        this.notifyListeners()
      } else {
        this.settings = null
      }
    } catch (error) {
      this.settings = null
    }
  }

  private async saveSettings(userId: string) {
    try {
      if (this.settings && userId) {
        const docRef = doc(db, "farmSettings", userId)
        await setDoc(docRef, this.settings)
        this.notifyListeners()
      }
    } catch (error) {
      // Error saving
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener())
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  getSettings(): FarmSettings | null {
    return this.settings
  }

  isSetupCompleted(): boolean {
    return this.settings?.setupCompleted || false
  }

  getSector(): FarmSector | null {
    return this.settings?.sector || null
  }

  isCowCalfEnabled(): boolean {
    return this.settings?.sector === "cowcalf" || this.settings?.sector === "both"
  }

  isBackgrounderEnabled(): boolean {
    return this.settings?.sector === "backgrounder" || this.settings?.sector === "both"
  }

  isFeedlotEnabled(): boolean {
    return this.settings?.sector === "feedlot"
  }

  async initializeSettings(farmName: string, sector: FarmSector, userId: string) {
    const now = new Date().toISOString()
    this.settings = {
      farmName,
      sector,
      setupCompleted: true,
      createdAt: now,
      updatedAt: now,
      preferences: {
        enablePastures: true,
        enableRations: sector === "backgrounder" || sector === "both",
        defaultWeightUnit: "lbs",
        defaultCurrency: "USD",
      },
      pricing: {
        cattlePricePerLb: 6.97, // Default market price per pound
      },
      growth: {
        targetDailyGain: 2.5, // Default target ADG in lbs/day
      },
    }
    await this.saveSettings(userId)
  }

  async updateSettings(updates: Partial<Omit<FarmSettings, "createdAt">>, userId: string) {
    if (!this.settings) return

    this.settings = {
      ...this.settings,
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    await this.saveSettings(userId)
  }

  async updatePreferences(preferences: Partial<FarmSettings["preferences"]>, userId: string) {
    if (!this.settings) return

    this.settings.preferences = {
      ...this.settings.preferences,
      ...preferences,
    }
    this.settings.updatedAt = new Date().toISOString()
    await this.saveSettings(userId)
  }

  async updatePricing(pricing: Partial<FarmSettings["pricing"]>, userId: string) {
    if (!this.settings) return

    this.settings.pricing = {
      ...this.settings.pricing,
      ...pricing,
    }
    this.settings.updatedAt = new Date().toISOString()
    await this.saveSettings(userId)
  }

  getCattlePricePerLb(): number {
    return this.settings?.pricing?.cattlePricePerLb || 6.97
  }

  async updateGrowth(growth: Partial<FarmSettings["growth"]>, userId: string) {
    if (!this.settings) return

    this.settings.growth = {
      ...this.settings.growth,
      ...growth,
    }
    this.settings.updatedAt = new Date().toISOString()
    await this.saveSettings(userId)
  }

  getTargetDailyGain(): number {
    return this.settings?.growth?.targetDailyGain || 2.5
  }

  clearSettings() {
    this.settings = null
    this.notifyListeners()
  }
}

export const farmSettingsStore = new FarmSettingsStore()

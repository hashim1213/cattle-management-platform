/**
 * Pairs Store - Cow/Calf Model
 * Manages Dam-Calf pairs for cow/calf operations
 */

import { dataStore } from "./data-store"

export type PairStatus = "active" | "weaned" | "sold" | "deceased"

export interface CattlePair {
  id: string
  damId: string // Mother cow ID
  calfId: string // Calf ID
  pairDate: string // Date pair was created (birth date)
  weanDate?: string // Date calf was weaned
  status: PairStatus
  notes?: string
  createdAt: string
  updatedAt: string
  // Tracking
  birthWeight?: number
  weanWeight?: number
  daysToWean?: number
}

export interface WeaningRecord {
  id: string
  pairId: string
  damId: string
  calfId: string
  weanDate: string
  weanWeight: number
  age: number // Days old at weaning
  notes?: string
  createdAt: string
}

const PAIRS_STORAGE_KEY = "cattle_pairs"
const WEANING_STORAGE_KEY = "weaning_records"

class PairsStore {
  private pairs: CattlePair[] = []
  private weaningRecords: WeaningRecord[] = []
  private listeners: Array<() => void> = []

  constructor() {
    this.loadPairs()
  }

  private loadPairs() {
    // Removed localStorage caching for realtime data loading
    this.pairs = []
    this.weaningRecords = []
  }

  private savePairs() {
    // Removed localStorage caching for realtime data loading
    this.notifyListeners()
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

  // CRUD Operations
  getPairs(): CattlePair[] {
    return this.pairs
  }

  getPair(id: string): CattlePair | undefined {
    return this.pairs.find((p) => p.id === id)
  }

  getActivePairs(): CattlePair[] {
    return this.pairs.filter((p) => p.status === "active")
  }

  getPairsByDam(damId: string): CattlePair[] {
    return this.pairs.filter((p) => p.damId === damId)
  }

  getPairByCalf(calfId: string): CattlePair | undefined {
    return this.pairs.find((p) => p.calfId === calfId)
  }

  createPair(
    damId: string,
    calfId: string,
    pairDate: string,
    birthWeight?: number,
    notes?: string
  ): string {
    // Verify dam exists and is female
    const dam = dataStore.getCattle().find((c) => c.id === damId)
    if (!dam || dam.sex !== "Cow") {
      throw new Error("Dam must be a female cow")
    }

    // Verify calf exists
    const calf = dataStore.getCattle().find((c) => c.id === calfId)
    if (!calf) {
      throw new Error("Calf not found")
    }

    // Check if calf is already paired
    const existingPair = this.getPairByCalf(calfId)
    if (existingPair) {
      throw new Error("Calf is already paired")
    }

    const now = new Date().toISOString()
    const newPair: CattlePair = {
      id: `pair_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      damId,
      calfId,
      pairDate,
      status: "active",
      birthWeight,
      notes,
      createdAt: now,
      updatedAt: now,
    }

    this.pairs.push(newPair)
    this.savePairs()

    return newPair.id
  }

  updatePair(id: string, updates: Partial<Omit<CattlePair, "id" | "createdAt">>) {
    const pair = this.getPair(id)
    if (!pair) {
      throw new Error("Pair not found")
    }

    Object.assign(pair, {
      ...updates,
      updatedAt: new Date().toISOString(),
    })

    this.savePairs()
  }

  deletePair(id: string) {
    const index = this.pairs.findIndex((p) => p.id === id)
    if (index === -1) {
      throw new Error("Pair not found")
    }

    this.pairs.splice(index, 1)
    this.savePairs()
  }

  /**
   * Wean a calf - transfers calf to weaned status
   */
  weanCalf(pairId: string, weanWeight: number, weanDate: string, notes?: string): string {
    const pair = this.getPair(pairId)
    if (!pair) {
      throw new Error("Pair not found")
    }

    if (pair.status !== "active") {
      throw new Error("Can only wean active pairs")
    }

    // Calculate age at weaning
    const birthDate = new Date(pair.pairDate)
    const weaningDate = new Date(weanDate)
    const ageInDays = Math.floor(
      (weaningDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Update pair status
    this.updatePair(pairId, {
      status: "weaned",
      weanDate,
      weanWeight,
      daysToWean: ageInDays,
    })

    // Update calf status to "Weaned Calf"
    const calf = dataStore.getCattle().find((c) => c.id === pair.calfId)
    if (calf) {
      dataStore.updateCattle(pair.calfId, {
        stage: "weanedcalf",
        weight: weanWeight,
      })
    }

    // Create weaning record
    const weaningRecord: WeaningRecord = {
      id: `wean_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pairId,
      damId: pair.damId,
      calfId: pair.calfId,
      weanDate,
      weanWeight,
      age: ageInDays,
      notes,
      createdAt: new Date().toISOString(),
    }

    this.weaningRecords.push(weaningRecord)
    this.savePairs()

    return weaningRecord.id
  }

  getWeaningRecords(): WeaningRecord[] {
    return this.weaningRecords
  }

  getWeaningRecordsByDam(damId: string): WeaningRecord[] {
    return this.weaningRecords.filter((r) => r.damId === damId)
  }

  /**
   * Get statistics for a dam
   */
  getDamStats(damId: string) {
    const allPairs = this.getPairsByDam(damId)
    const weanedPairs = allPairs.filter((p) => p.status === "weaned")
    const weaningRecords = this.getWeaningRecordsByDam(damId)

    const avgWeanWeight =
      weanedPairs.length > 0
        ? weanedPairs.reduce((sum, p) => sum + (p.weanWeight || 0), 0) / weanedPairs.length
        : 0

    const avgDaysToWean =
      weanedPairs.length > 0
        ? weanedPairs.reduce((sum, p) => sum + (p.daysToWean || 0), 0) / weanedPairs.length
        : 0

    return {
      totalCalves: allPairs.length,
      activeCalves: allPairs.filter((p) => p.status === "active").length,
      weanedCalves: weanedPairs.length,
      avgWeanWeight,
      avgDaysToWean,
      weaningRecords: weaningRecords.length,
    }
  }

  /**
   * Get all active dams (cows with active pairs)
   */
  getActiveDams(): string[] {
    const activePairs = this.getActivePairs()
    return [...new Set(activePairs.map((p) => p.damId))]
  }
}

export const pairsStore = new PairsStore()

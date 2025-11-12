// Protocol Service - Manages treatment protocols (both default and custom)

import { TreatmentProtocol, DEFAULT_PROTOCOLS } from "./treatment-protocols"
import { generateUniqueId } from "../id-generator"

class ProtocolService {
  private static instance: ProtocolService
  private customProtocols: TreatmentProtocol[] = []
  private listeners = new Set<() => void>()

  private constructor() {
    this.load()
  }

  static getInstance(): ProtocolService {
    if (!ProtocolService.instance) {
      ProtocolService.instance = new ProtocolService()
    }
    return ProtocolService.instance
  }

  private load() {
    if (typeof window === "undefined") return

    const protocolsData = localStorage.getItem("customTreatmentProtocols")
    if (protocolsData) {
      this.customProtocols = JSON.parse(protocolsData)
    }
  }

  private save() {
    if (typeof window === "undefined") return
    localStorage.setItem("customTreatmentProtocols", JSON.stringify(this.customProtocols))
    this.notify()
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach((listener) => listener())
  }

  /**
   * Get all protocols (default + custom)
   */
  getAllProtocols(): TreatmentProtocol[] {
    return [...DEFAULT_PROTOCOLS, ...this.customProtocols]
  }

  /**
   * Get protocol by ID (searches both default and custom)
   */
  getProtocolById(id: string): TreatmentProtocol | undefined {
    // Check default protocols first
    const defaultProtocol = DEFAULT_PROTOCOLS.find(p => p.id === id)
    if (defaultProtocol) return defaultProtocol

    // Check custom protocols
    return this.customProtocols.find(p => p.id === id)
  }

  /**
   * Get protocols by category
   */
  getProtocolsByCategory(category: TreatmentProtocol["category"]): TreatmentProtocol[] {
    return this.getAllProtocols().filter(p => p.category === category)
  }

  /**
   * Get only custom protocols
   */
  getCustomProtocols(): TreatmentProtocol[] {
    return this.customProtocols
  }

  /**
   * Create a new custom protocol
   */
  createProtocol(
    protocol: Omit<TreatmentProtocol, "id" | "createdAt" | "updatedAt" | "isDefault">
  ): TreatmentProtocol {
    const newProtocol: TreatmentProtocol = {
      ...protocol,
      id: generateUniqueId("protocol"),
      category: "custom",
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.customProtocols.push(newProtocol)
    this.save()

    return newProtocol
  }

  /**
   * Update an existing custom protocol
   */
  updateProtocol(
    id: string,
    updates: Partial<Omit<TreatmentProtocol, "id" | "createdAt" | "updatedAt" | "isDefault">>
  ): TreatmentProtocol | null {
    const index = this.customProtocols.findIndex(p => p.id === id)
    if (index === -1) {
      // Cannot update default protocols
      return null
    }

    this.customProtocols[index] = {
      ...this.customProtocols[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    this.save()
    return this.customProtocols[index]
  }

  /**
   * Delete a custom protocol
   */
  deleteProtocol(id: string): boolean {
    // Cannot delete default protocols
    const protocol = this.customProtocols.find(p => p.id === id)
    if (!protocol) return false

    this.customProtocols = this.customProtocols.filter(p => p.id !== id)
    this.save()
    return true
  }

  /**
   * Clone an existing protocol (useful for creating variations of default protocols)
   */
  cloneProtocol(
    sourceId: string,
    newName: string,
    newDescription?: string
  ): TreatmentProtocol | null {
    const sourceProtocol = this.getProtocolById(sourceId)
    if (!sourceProtocol) return null

    return this.createProtocol({
      name: newName,
      description: newDescription || `${sourceProtocol.description} (Clone)`,
      drugs: sourceProtocol.drugs.map(drug => ({ ...drug })), // Deep copy drugs
      estimatedCostPerHead: sourceProtocol.estimatedCostPerHead,
      createdBy: sourceProtocol.createdBy
    })
  }
}

export const protocolService = ProtocolService.getInstance()

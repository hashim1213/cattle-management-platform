"use client"

import { useEffect, useState } from "react"
import { treatmentStore, type Treatment, type MortalityRecord, type TreatmentProduct } from "@/lib/treatment-store"

export function useTreatmentStore() {
  const [treatments, setTreatments] = useState<Treatment[]>(treatmentStore.getTreatments())
  const [mortalityRecords, setMortalityRecords] = useState<MortalityRecord[]>(
    treatmentStore.getMortalityRecords()
  )
  const [products, setProducts] = useState<TreatmentProduct[]>(treatmentStore.getProducts())

  useEffect(() => {
    const unsubscribe = treatmentStore.subscribe(() => {
      setTreatments(treatmentStore.getTreatments())
      setMortalityRecords(treatmentStore.getMortalityRecords())
      setProducts(treatmentStore.getProducts())
    })

    return unsubscribe
  }, [])

  return {
    // Treatments
    treatments,
    addTreatment: treatmentStore.addTreatment.bind(treatmentStore),
    getCattleTreatments: treatmentStore.getCattleTreatments.bind(treatmentStore),
    getPenTreatments: treatmentStore.getPenTreatments.bind(treatmentStore),
    getBarnTreatments: treatmentStore.getBarnTreatments.bind(treatmentStore),
    getTreatmentById: treatmentStore.getTreatmentById.bind(treatmentStore),
    getActiveWithdrawals: treatmentStore.getActiveWithdrawals.bind(treatmentStore),
    getTreatmentCosts: treatmentStore.getTreatmentCosts.bind(treatmentStore),
    getPenTreatmentCosts: treatmentStore.getPenTreatmentCosts.bind(treatmentStore),

    // Mortality
    mortalityRecords,
    addMortalityRecord: treatmentStore.addMortalityRecord.bind(treatmentStore),
    getPenMortalityRecords: treatmentStore.getPenMortalityRecords.bind(treatmentStore),
    getBarnMortalityRecords: treatmentStore.getBarnMortalityRecords.bind(treatmentStore),
    getMortalityStats: treatmentStore.getMortalityStats.bind(treatmentStore),

    // Products
    products,
    addProduct: treatmentStore.addProduct.bind(treatmentStore),
    updateProduct: treatmentStore.updateProduct.bind(treatmentStore),
    getProductById: treatmentStore.getProductById.bind(treatmentStore),
    getLowStockProducts: treatmentStore.getLowStockProducts.bind(treatmentStore),
    getExpiringProducts: treatmentStore.getExpiringProducts.bind(treatmentStore),
  }
}

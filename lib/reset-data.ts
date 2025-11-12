/**
 * Data Reset Utility
 * Clears all localStorage and provides fresh start functionality
 */

export function resetAllLocalStorageData() {
  if (typeof window === "undefined") return

  // List of all localStorage keys used in the app
  const localStorageKeys = [
    // Inventory
    "unifiedInventory",
    "inventoryTransactions",
    "inventoryAlerts",
    
    // Cattle (old localStorage-based)
    "cattle-data",
    "cattle-weight-records",
    "cattle-health-records",
    
    // Pens and Barns
    "cattle-pens",
    "cattle-barns",
    
    // Batches
    "cattle-batches",
    
    // Tasks and Users
    "cattle-tasks",
    "farm-users",
    "cattle-users",
    "cattle-current-user",
    
    // Lifecycle stages
    "cattle-lifecycle-stages",
    
    // Feed
    "feed-allocations",
    "feed-schedule-templates",
    
    // Activities
    "cattle-activities",
    
    // Time tracking
    "cattle-time-entries",
    
    // Rations
    "cattle-rations",
    
    // Pairs (cow-calf)
    "cattle-pairs",
    
    // Health (enhanced)
    "health-protocols",
    "health-records",
    "health-treatments",
    
    // Simulation
    "simulation-data",
    
    // Treatment store
    "treatments",
  ]

  // Clear all known keys
  localStorageKeys.forEach(key => {
    localStorage.removeItem(key)
  })

  // Optional: Clear everything (use with caution as it clears other sites' data too)
  // localStorage.clear()

  console.log("✅ All application data has been reset")
}

export function resetInventoryData() {
  if (typeof window === "undefined") return

  localStorage.removeItem("unifiedInventory")
  localStorage.removeItem("inventoryTransactions")
  localStorage.removeItem("inventoryAlerts")
  
  console.log("✅ Inventory data has been reset")
}

export function getStorageStats() {
  if (typeof window === "undefined") return {}

  const stats: Record<string, number> = {}
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      const value = localStorage.getItem(key)
      stats[key] = value ? new Blob([value]).size : 0
    }
  }
  
  return stats
}

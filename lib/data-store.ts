// Comprehensive data management system using Supabase
import { supabase, Database } from "./supabase"
import { generateUniqueId } from "./id-generator"

// Check if Supabase is configured
const isSupabaseConfigured = (): boolean => {
  return !!(
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// Helper to get authenticated user ID
async function getUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

// Mapping functions between camelCase and snake_case
function dbToCattle(dbRow: Database['public']['Tables']['cattle']['Row']): Cattle {
  return {
    id: dbRow.id,
    tagNumber: dbRow.tag_number,
    name: dbRow.name || undefined,
    breed: dbRow.breed,
    sex: dbRow.sex as "Bull" | "Cow" | "Steer" | "Heifer",
    birthDate: dbRow.birth_date,
    purchaseDate: dbRow.purchase_date || undefined,
    purchasePrice: dbRow.purchase_price || undefined,
    purchaseWeight: dbRow.purchase_weight || undefined,
    currentValue: dbRow.current_value || undefined,
    weight: dbRow.weight,
    dam: dbRow.dam || undefined,
    sire: dbRow.sire || undefined,
    lot: dbRow.lot,
    pasture: dbRow.pasture || undefined,
    penId: dbRow.pen_id || undefined,
    barnId: dbRow.barn_id || undefined,
    batchId: dbRow.batch_id || undefined,
    status: dbRow.status as "Active" | "Sold" | "Deceased" | "Culled",
    stage: dbRow.stage as "Calf" | "Weaned Calf" | "Yearling" | "Breeding" | "Finishing",
    healthStatus: dbRow.health_status as "Healthy" | "Sick" | "Treatment" | "Quarantine",
    pregnancyStatus: dbRow.pregnancy_status as "Open" | "Bred" | "Pregnant" | "Calved" | undefined,
    expectedCalvingDate: dbRow.expected_calving_date || undefined,
    lastVetVisit: dbRow.last_vet_visit || undefined,
    notes: dbRow.notes || undefined,
    colorMarkings: dbRow.color_markings || undefined,
    hornStatus: dbRow.horn_status || undefined,
    identificationMethod: dbRow.identification_method,
    rfidTag: dbRow.rfid_tag || undefined,
    brandNumber: dbRow.brand_number || undefined,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,
  }
}

function cattleToDb(cattle: Omit<Cattle, "id" | "createdAt" | "updatedAt">, userId: string): Database['public']['Tables']['cattle']['Insert'] {
  return {
    tag_number: cattle.tagNumber,
    name: cattle.name || null,
    breed: cattle.breed,
    sex: cattle.sex,
    birth_date: cattle.birthDate,
    purchase_date: cattle.purchaseDate || null,
    purchase_price: cattle.purchasePrice || null,
    purchase_weight: cattle.purchaseWeight || null,
    current_value: cattle.currentValue || null,
    weight: cattle.weight,
    dam: cattle.dam || null,
    sire: cattle.sire || null,
    lot: cattle.lot,
    pasture: cattle.pasture || null,
    pen_id: cattle.penId || null,
    barn_id: cattle.barnId || null,
    batch_id: cattle.batchId || null,
    status: cattle.status,
    stage: cattle.stage,
    health_status: cattle.healthStatus,
    pregnancy_status: cattle.pregnancyStatus || null,
    expected_calving_date: cattle.expectedCalvingDate || null,
    last_vet_visit: cattle.lastVetVisit || null,
    notes: cattle.notes || null,
    color_markings: cattle.colorMarkings || null,
    horn_status: cattle.hornStatus || null,
    identification_method: cattle.identificationMethod,
    rfid_tag: cattle.rfidTag || null,
    brand_number: cattle.brandNumber || null,
    days_on_feed: null,
    projected_weight: null,
    user_id: userId,
  }
}

function dbToWeightRecord(dbRow: Database['public']['Tables']['weight_records']['Row']): WeightRecord {
  return {
    id: dbRow.id,
    cattleId: dbRow.cattle_id,
    date: dbRow.date,
    weight: dbRow.weight,
    notes: dbRow.notes || undefined,
  }
}

function dbToHealthRecord(dbRow: Database['public']['Tables']['health_records']['Row']): HealthRecord {
  return {
    id: dbRow.id,
    cattleId: dbRow.cattle_id,
    date: dbRow.date,
    type: dbRow.type as "Vaccination" | "Treatment" | "Checkup" | "Surgery" | "Other",
    description: dbRow.description,
    veterinarian: dbRow.veterinarian || undefined,
    cost: dbRow.cost || undefined,
    nextDueDate: dbRow.next_due_date || undefined,
    notes: dbRow.notes || undefined,
  }
}

function dbToFeedInventory(dbRow: Database['public']['Tables']['feed_inventory']['Row']): FeedInventory {
  return {
    id: dbRow.id,
    name: dbRow.name,
    type: dbRow.type,
    quantity: dbRow.quantity,
    unit: dbRow.unit,
    costPerUnit: dbRow.cost_per_unit,
    supplier: dbRow.supplier || undefined,
    purchaseDate: dbRow.purchase_date,
    expiryDate: dbRow.expiry_date || undefined,
    location: dbRow.location || undefined,
    notes: dbRow.notes || undefined,
    dailyUsage: dbRow.daily_usage,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,
  }
}

function dbToTransaction(dbRow: Database['public']['Tables']['transactions']['Row']): Transaction {
  return {
    id: dbRow.id,
    date: dbRow.date,
    type: dbRow.type as "Purchase" | "Sale" | "Feed" | "Veterinary" | "Equipment" | "Labor" | "Other",
    category: dbRow.category || "",
    amount: dbRow.amount,
    description: dbRow.description,
    cattleId: dbRow.cattle_id || undefined,
    notes: undefined,
    createdAt: dbRow.created_at,
  }
}

export interface Cattle {
  id: string
  tagNumber: string  // Visual tag number
  name?: string
  breed: string
  sex: "Bull" | "Cow" | "Steer" | "Heifer" | "Unknown"
  birthDate?: string  // Optional - can be unknown for imported RFID cattle
  purchaseDate?: string
  purchasePrice?: number
  purchaseWeight?: number
  currentValue?: number
  weight: number
  weights?: { id: string; date: string; weight: number }[]
  dam?: string
  sire?: string
  lot: string
  pasture?: string
  penId?: string
  barnId?: string
  batchId?: string // Purchase group/batch tracking
  status: "Active" | "Sold" | "Deceased" | "Culled"
  stage: "Calf" | "Weaned Calf" | "Yearling" | "Breeding" | "Finishing" | "receiving"
  healthStatus: "Healthy" | "Sick" | "Treatment" | "Quarantine"
  pregnancyStatus?: "Open" | "Bred" | "Pregnant" | "Calved"
  expectedCalvingDate?: string
  lastVetVisit?: string
  notes?: string
  colorMarkings?: string
  hornStatus?: string
  identificationMethod: string
  rfidTag?: string  // Electronic RFID tag - primary identifier for imported cattle
  visualTag?: string  // Alternative to tagNumber for consistency
  arrivalDate?: string  // For feedlot receiving
  arrivalWeight?: number  // For feedlot receiving
  brandNumber?: string
  createdAt: string
  updatedAt: string
}

export interface WeightRecord {
  id: string
  cattleId: string
  date: string
  weight: number
  notes?: string
}

export interface HealthRecord {
  id: string
  cattleId: string
  date: string
  type: "Vaccination" | "Treatment" | "Checkup" | "Surgery" | "Other"
  description: string
  veterinarian?: string
  cost?: number
  nextDueDate?: string
  notes?: string
}

export interface FeedInventory {
  id: string
  name: string
  type: string
  quantity: number
  unit: string
  costPerUnit: number
  supplier?: string
  purchaseDate: string
  expiryDate?: string
  location?: string
  notes?: string
  dailyUsage: number
  createdAt: string
  updatedAt: string
}

export interface FeedUsage {
  id: string
  feedId: string
  date: string
  quantity: number
  cattleCount: number
  notes?: string
}

export interface Pasture {
  id: string
  name: string
  acres: number
  grassType: string
  condition: "Excellent" | "Good" | "Fair" | "Poor" | "Overgrazed"
  currentCattleCount: number
  maxCapacity: number
  lastRotationDate?: string
  nextRotationDate?: string
  soilTestDate?: string
  fertilizedDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  date: string
  type: "Purchase" | "Sale" | "Feed" | "Veterinary" | "Equipment" | "Labor" | "Other"
  category: string
  amount: number
  description: string
  cattleId?: string
  notes?: string
  createdAt: string
}

class DataStore {
  private static instance: DataStore

  private constructor() {
    this.initializeData()
  }

  static getInstance(): DataStore {
    if (!DataStore.instance) {
      DataStore.instance = new DataStore()
    }
    return DataStore.instance
  }

  private initializeData() {
    // No sample data - clean slate for real data
    if (typeof window === "undefined") return

    // Initialize all storage keys with empty arrays if they don't exist
    const storageKeys = [
      "cattle",
      "weightRecords",
      "healthRecords",
      "feedUsage",
      "feedInventory",
      "pastures",
      "transactions"
    ]

    storageKeys.forEach(key => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify([]))
      }
    })
  }

  // Cattle operations
  getCattle(): Cattle[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem("cattle")
    return data ? JSON.parse(data) : []
  }

  getCattleById(id: string): Cattle | undefined {
    return this.getCattle().find((c) => c.id === id)
  }

  addCattle(cattle: Omit<Cattle, "id" | "createdAt" | "updatedAt">): Cattle {
    // Auto-generate tagNumber from rfidTag if not provided
    let tagNumber = cattle.tagNumber
    if (!tagNumber && cattle.rfidTag) {
      // Use last 4-6 digits of RFID as visual tag
      tagNumber = cattle.rfidTag.slice(-4)
    }
    if (!tagNumber) {
      tagNumber = `TAG-${Date.now().toString().slice(-6)}`
    }

    const newCattle: Cattle = {
      ...cattle,
      tagNumber,
      id: generateUniqueId("cattle"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const allCattle = this.getCattle()
    allCattle.push(newCattle)
    localStorage.setItem("cattle", JSON.stringify(allCattle))
    return newCattle
  }

  updateCattle(id: string, updates: Partial<Cattle>): Cattle | null {
    const allCattle = this.getCattle()
    const index = allCattle.findIndex((c) => c.id === id)
    if (index === -1) return null

    allCattle[index] = {
      ...allCattle[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem("cattle", JSON.stringify(allCattle))
    return allCattle[index]
  }

  deleteCattle(id: string): boolean {
    const allCattle = this.getCattle()
    const filtered = allCattle.filter((c) => c.id !== id)
    if (filtered.length === allCattle.length) return false
    localStorage.setItem("cattle", JSON.stringify(filtered))
    return true
  }

  // Weight records
  getWeightRecords(cattleId?: string): WeightRecord[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem("weightRecords")
    const records: WeightRecord[] = data ? JSON.parse(data) : []
    return cattleId ? records.filter((r) => r.cattleId === cattleId) : records
  }

  addWeightRecord(record: Omit<WeightRecord, "id">): WeightRecord {
    const newRecord: WeightRecord = {
      ...record,
      id: generateUniqueId("weight"),
    }
    const allRecords = this.getWeightRecords()
    allRecords.push(newRecord)
    localStorage.setItem("weightRecords", JSON.stringify(allRecords))

    // Update cattle weight
    this.updateCattle(record.cattleId, { weight: record.weight })

    return newRecord
  }

  // Health records
  getHealthRecords(cattleId?: string): HealthRecord[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem("healthRecords")
    const records: HealthRecord[] = data ? JSON.parse(data) : []
    return cattleId ? records.filter((r) => r.cattleId === cattleId) : records
  }

  addHealthRecord(record: Omit<HealthRecord, "id">): HealthRecord {
    const newRecord: HealthRecord = {
      ...record,
      id: generateUniqueId("health"),
    }
    const allRecords = this.getHealthRecords()
    allRecords.push(newRecord)
    localStorage.setItem("healthRecords", JSON.stringify(allRecords))

    // Update cattle last vet visit
    this.updateCattle(record.cattleId, { lastVetVisit: record.date })

    return newRecord
  }

  // Feed inventory operations
  getFeedInventory(): FeedInventory[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem("feedInventory")
    return data ? JSON.parse(data) : []
  }

  getFeedById(id: string): FeedInventory | undefined {
    return this.getFeedInventory().find((f) => f.id === id)
  }

  addFeed(feed: Omit<FeedInventory, "id" | "createdAt" | "updatedAt">): FeedInventory {
    const newFeed: FeedInventory = {
      ...feed,
      id: generateUniqueId("feed"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const allFeed = this.getFeedInventory()
    allFeed.push(newFeed)
    localStorage.setItem("feedInventory", JSON.stringify(allFeed))
    return newFeed
  }

  updateFeed(id: string, updates: Partial<FeedInventory>): FeedInventory | null {
    const allFeed = this.getFeedInventory()
    const index = allFeed.findIndex((f) => f.id === id)
    if (index === -1) return null

    allFeed[index] = {
      ...allFeed[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem("feedInventory", JSON.stringify(allFeed))
    return allFeed[index]
  }

  deleteFeed(id: string): boolean {
    const allFeed = this.getFeedInventory()
    const filtered = allFeed.filter((f) => f.id !== id)
    if (filtered.length === allFeed.length) return false
    localStorage.setItem("feedInventory", JSON.stringify(filtered))
    return true
  }

  // Feed usage
  getFeedUsage(feedId?: string): FeedUsage[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem("feedUsage")
    const usage: FeedUsage[] = data ? JSON.parse(data) : []
    return feedId ? usage.filter((u) => u.feedId === feedId) : usage
  }

  addFeedUsage(usage: Omit<FeedUsage, "id">): FeedUsage {
    const newUsage: FeedUsage = {
      ...usage,
      id: generateUniqueId("feedusage"),
    }
    const allUsage = this.getFeedUsage()
    allUsage.push(newUsage)
    localStorage.setItem("feedUsage", JSON.stringify(allUsage))

    // Update feed quantity
    const feed = this.getFeedById(usage.feedId)
    if (feed) {
      this.updateFeed(usage.feedId, {
        quantity: feed.quantity - usage.quantity,
      })
    }

    return newUsage
  }

  // Pasture operations
  getPastures(): Pasture[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem("pastures")
    return data ? JSON.parse(data) : []
  }

  getPastureById(id: string): Pasture | undefined {
    return this.getPastures().find((p) => p.id === id)
  }

  addPasture(pasture: Omit<Pasture, "id" | "createdAt" | "updatedAt">): Pasture {
    const newPasture: Pasture = {
      ...pasture,
      id: generateUniqueId("pasture"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const allPastures = this.getPastures()
    allPastures.push(newPasture)
    localStorage.setItem("pastures", JSON.stringify(allPastures))
    return newPasture
  }

  updatePasture(id: string, updates: Partial<Pasture>): Pasture | null {
    const allPastures = this.getPastures()
    const index = allPastures.findIndex((p) => p.id === id)
    if (index === -1) return null

    allPastures[index] = {
      ...allPastures[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem("pastures", JSON.stringify(allPastures))
    return allPastures[index]
  }

  deletePasture(id: string): boolean {
    const allPastures = this.getPastures()
    const filtered = allPastures.filter((p) => p.id !== id)
    if (filtered.length === allPastures.length) return false
    localStorage.setItem("pastures", JSON.stringify(filtered))
    return true
  }

  // Transactions
  getTransactions(): Transaction[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem("transactions")
    return data ? JSON.parse(data) : []
  }

  addTransaction(transaction: Omit<Transaction, "id" | "createdAt">): Transaction {
    const newTransaction: Transaction = {
      ...transaction,
      id: generateUniqueId("transaction"),
      createdAt: new Date().toISOString(),
    }
    const allTransactions = this.getTransactions()
    allTransactions.push(newTransaction)
    localStorage.setItem("transactions", JSON.stringify(allTransactions))
    return newTransaction
  }

  // Analytics
  getAnalytics() {
    const cattle = this.getCattle()
    const activeCattle = cattle.filter((c) => c.status === "Active")
    const feed = this.getFeedInventory()
    const transactions = this.getTransactions()
    const weightRecords = this.getWeightRecords()

    // Calculate total inventory value
    const totalInventoryValue = activeCattle.reduce((sum, c) => sum + (c.currentValue || 0), 0)

    // Calculate feed costs
    const feedCosts = feed.reduce((sum, f) => sum + f.quantity * f.costPerUnit, 0)

    // Calculate average daily gain
    const recentWeights = weightRecords.slice(-30)
    const avgDailyGain =
      recentWeights.length > 1 ? (recentWeights[recentWeights.length - 1].weight - recentWeights[0].weight) / 30 : 0

    // Calculate cost per head
    const totalCosts = transactions.filter((t) => t.type !== "Sale").reduce((sum, t) => sum + t.amount, 0)
    const costPerHead = activeCattle.length > 0 ? totalCosts / activeCattle.length : 0

    // Bulls, Cows, Calves breakdown
    const bulls = activeCattle.filter((c) => c.sex === "Bull")
    const cows = activeCattle.filter((c) => c.sex === "Cow")
    const calves = activeCattle.filter((c) => c.stage === "Calf")

    return {
      totalCattle: activeCattle.length,
      totalInventoryValue,
      feedCosts,
      avgDailyGain,
      costPerHead,
      bulls: {
        count: bulls.length,
        herdSires: bulls.filter((b) => b.stage === "Breeding").length,
        herdSireProspects: bulls.filter((b) => b.stage !== "Breeding").length,
      },
      cows: {
        count: cows.length,
        pregnant: cows.filter((c) => c.pregnancyStatus === "Pregnant").length,
        open: cows.filter((c) => c.pregnancyStatus === "Open").length,
        exposed: cows.filter((c) => c.pregnancyStatus === "Bred").length,
      },
      calves: {
        count: calves.length,
        unweaned: calves.filter((c) => c.stage === "Calf").length,
        weaned: calves.filter((c) => c.stage === "Weaned Calf").length,
      },
    }
  }

  // Reset all data to default samples
  resetAllData() {
    if (typeof window === "undefined") return

    localStorage.removeItem("cattle")
    localStorage.removeItem("feedInventory")
    localStorage.removeItem("pastures")
    localStorage.removeItem("weightRecords")
    localStorage.removeItem("healthRecords")
    localStorage.removeItem("feedUsage")
    localStorage.removeItem("transactions")

    this.initializeData()
  }

}

export const dataStore = DataStore.getInstance()

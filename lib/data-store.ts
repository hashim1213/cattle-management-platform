// Comprehensive data management system using localStorage
export interface Cattle {
  id: string
  tagNumber: string
  name?: string
  breed: string
  sex: "Bull" | "Cow" | "Steer" | "Heifer"
  birthDate: string
  purchaseDate?: string
  purchasePrice?: number
  currentValue?: number
  weight: number
  dam?: string
  sire?: string
  lot: string
  pasture?: string
  penId?: string
  barnId?: string
  status: "Active" | "Sold" | "Deceased" | "Culled"
  stage: "Calf" | "Weaner" | "Yearling" | "Breeding" | "Finishing"
  healthStatus: "Healthy" | "Sick" | "Treatment" | "Quarantine"
  pregnancyStatus?: "Open" | "Bred" | "Pregnant" | "Calved"
  expectedCalvingDate?: string
  lastVetVisit?: string
  notes?: string
  colorMarkings?: string
  hornStatus?: string
  identificationMethod: string
  rfidTag?: string
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
    if (typeof window === "undefined") return

    // Initialize with sample data if empty
    if (!localStorage.getItem("cattle")) {
      const sampleCattle: Cattle[] = [
        // Bulls
        {
          id: "1",
          tagNumber: "B001",
          name: "Thunder",
          breed: "Angus",
          sex: "Bull",
          birthDate: "2019-01-10",
          purchaseDate: "2019-08-01",
          purchasePrice: 2500,
          currentValue: 3800,
          weight: 2200,
          lot: "Bull Pen",
          pasture: "East Pasture",
          status: "Active",
          stage: "Breeding",
          healthStatus: "Healthy",
          lastVetVisit: "2025-08-20",
          colorMarkings: "Black",
          hornStatus: "Polled",
          identificationMethod: "Ear Tag + RFID",
          rfidTag: "RFID-B001",
          brandNumber: "TH-001",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "2",
          tagNumber: "B002",
          name: "Maximus",
          breed: "Hereford",
          sex: "Bull",
          birthDate: "2020-03-15",
          purchaseDate: "2020-09-01",
          purchasePrice: 2200,
          currentValue: 3500,
          weight: 2100,
          lot: "Bull Pen",
          pasture: "East Pasture",
          status: "Active",
          stage: "Breeding",
          healthStatus: "Healthy",
          lastVetVisit: "2025-09-10",
          colorMarkings: "Red with white face",
          hornStatus: "Horned",
          identificationMethod: "Ear Tag",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        // Cows
        {
          id: "3",
          tagNumber: "C001",
          name: "Bessie",
          breed: "Angus",
          sex: "Cow",
          birthDate: "2020-03-15",
          purchaseDate: "2020-06-01",
          purchasePrice: 1200,
          currentValue: 1800,
          weight: 1250,
          dam: "Unknown",
          sire: "Bull-001",
          lot: "North Lot",
          pasture: "North Pasture",
          status: "Active",
          stage: "Breeding",
          healthStatus: "Healthy",
          pregnancyStatus: "Pregnant",
          expectedCalvingDate: "2026-02-15",
          lastVetVisit: "2025-09-15",
          colorMarkings: "Black",
          hornStatus: "Polled",
          identificationMethod: "Ear Tag + RFID",
          rfidTag: "RFID-C001",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "4",
          tagNumber: "C002",
          name: "Daisy",
          breed: "Hereford",
          sex: "Cow",
          birthDate: "2019-05-20",
          purchaseDate: "2019-11-01",
          purchasePrice: 1300,
          currentValue: 1900,
          weight: 1300,
          lot: "North Lot",
          pasture: "North Pasture",
          status: "Active",
          stage: "Breeding",
          healthStatus: "Healthy",
          pregnancyStatus: "Pregnant",
          expectedCalvingDate: "2026-01-20",
          lastVetVisit: "2025-10-05",
          colorMarkings: "Red with white face",
          hornStatus: "Polled",
          identificationMethod: "Ear Tag",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "5",
          tagNumber: "C003",
          name: "Molly",
          breed: "Angus",
          sex: "Cow",
          birthDate: "2020-06-10",
          purchasePrice: 1250,
          currentValue: 1850,
          weight: 1280,
          lot: "North Lot",
          pasture: "North Pasture",
          status: "Active",
          stage: "Breeding",
          healthStatus: "Healthy",
          pregnancyStatus: "Bred",
          lastVetVisit: "2025-10-12",
          colorMarkings: "Black",
          hornStatus: "Polled",
          identificationMethod: "Ear Tag",
          rfidTag: "RFID-C003",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "6",
          tagNumber: "C004",
          name: "Rosie",
          breed: "Red Angus",
          sex: "Cow",
          birthDate: "2019-08-15",
          purchasePrice: 1350,
          currentValue: 1950,
          weight: 1320,
          lot: "South Lot",
          pasture: "South Pasture",
          status: "Active",
          stage: "Breeding",
          healthStatus: "Healthy",
          pregnancyStatus: "Open",
          lastVetVisit: "2025-09-28",
          colorMarkings: "Red",
          hornStatus: "Polled",
          identificationMethod: "Ear Tag",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "7",
          tagNumber: "C005",
          name: "Bella",
          breed: "Angus",
          sex: "Cow",
          birthDate: "2021-04-10",
          purchasePrice: 1180,
          currentValue: 1780,
          weight: 1230,
          lot: "South Lot",
          pasture: "South Pasture",
          status: "Active",
          stage: "Breeding",
          healthStatus: "Healthy",
          pregnancyStatus: "Pregnant",
          expectedCalvingDate: "2026-03-10",
          lastVetVisit: "2025-10-18",
          colorMarkings: "Black",
          hornStatus: "Polled",
          identificationMethod: "Ear Tag",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        // Heifers
        {
          id: "8",
          tagNumber: "H001",
          name: "Princess",
          breed: "Angus",
          sex: "Heifer",
          birthDate: "2024-04-20",
          weight: 680,
          lot: "Heifer Pen",
          pasture: "West Pasture",
          status: "Active",
          stage: "Yearling",
          healthStatus: "Healthy",
          lastVetVisit: "2025-10-01",
          colorMarkings: "Black",
          hornStatus: "Polled",
          identificationMethod: "Ear Tag",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "9",
          tagNumber: "H002",
          name: "Ruby",
          breed: "Red Angus",
          sex: "Heifer",
          birthDate: "2024-05-15",
          weight: 650,
          lot: "Heifer Pen",
          pasture: "West Pasture",
          status: "Active",
          stage: "Yearling",
          healthStatus: "Healthy",
          lastVetVisit: "2025-10-01",
          colorMarkings: "Red",
          hornStatus: "Polled",
          identificationMethod: "Ear Tag",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "10",
          tagNumber: "H003",
          breed: "Hereford",
          sex: "Heifer",
          birthDate: "2024-06-10",
          weight: 620,
          lot: "Heifer Pen",
          pasture: "West Pasture",
          status: "Active",
          stage: "Yearling",
          healthStatus: "Healthy",
          lastVetVisit: "2025-10-01",
          colorMarkings: "Red with white face",
          hornStatus: "Polled",
          identificationMethod: "Ear Tag",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        // Steers
        {
          id: "11",
          tagNumber: "S001",
          breed: "Angus",
          sex: "Steer",
          birthDate: "2024-03-15",
          purchaseDate: "2024-09-01",
          purchasePrice: 850,
          currentValue: 1200,
          weight: 920,
          lot: "Feedlot A",
          pasture: "North Pasture",
          status: "Active",
          stage: "Finishing",
          healthStatus: "Healthy",
          lastVetVisit: "2025-09-25",
          colorMarkings: "Black",
          hornStatus: "Polled",
          identificationMethod: "Ear Tag",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "12",
          tagNumber: "S002",
          breed: "Hereford",
          sex: "Steer",
          birthDate: "2024-04-01",
          purchaseDate: "2024-10-01",
          purchasePrice: 800,
          currentValue: 1150,
          weight: 880,
          lot: "Feedlot A",
          pasture: "North Pasture",
          status: "Active",
          stage: "Finishing",
          healthStatus: "Healthy",
          lastVetVisit: "2025-10-02",
          colorMarkings: "Red with white face",
          hornStatus: "Polled",
          identificationMethod: "Ear Tag",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "13",
          tagNumber: "S003",
          breed: "Angus",
          sex: "Steer",
          birthDate: "2024-02-20",
          purchaseDate: "2024-08-15",
          purchasePrice: 900,
          currentValue: 1280,
          weight: 1050,
          lot: "Feedlot B",
          pasture: "East Pasture",
          status: "Active",
          stage: "Finishing",
          healthStatus: "Healthy",
          lastVetVisit: "2025-09-18",
          colorMarkings: "Black",
          hornStatus: "Polled",
          identificationMethod: "Ear Tag",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        // Calves
        {
          id: "14",
          tagNumber: "CL001",
          breed: "Angus",
          sex: "Heifer",
          birthDate: "2025-03-10",
          weight: 420,
          dam: "C001",
          sire: "B001",
          lot: "Calf Pen",
          pasture: "South Pasture",
          status: "Active",
          stage: "Calf",
          healthStatus: "Healthy",
          lastVetVisit: "2025-10-10",
          colorMarkings: "Black",
          hornStatus: "Polled",
          identificationMethod: "Ear Tag",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "15",
          tagNumber: "CL002",
          breed: "Angus",
          sex: "Bull",
          birthDate: "2025-02-28",
          weight: 440,
          dam: "C003",
          sire: "B001",
          lot: "Calf Pen",
          pasture: "South Pasture",
          status: "Active",
          stage: "Calf",
          healthStatus: "Healthy",
          lastVetVisit: "2025-10-10",
          colorMarkings: "Black",
          hornStatus: "Polled",
          identificationMethod: "Ear Tag",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "16",
          tagNumber: "CL003",
          breed: "Hereford",
          sex: "Heifer",
          birthDate: "2025-04-05",
          weight: 390,
          dam: "C002",
          sire: "B002",
          lot: "Calf Pen",
          pasture: "South Pasture",
          status: "Active",
          stage: "Calf",
          healthStatus: "Healthy",
          lastVetVisit: "2025-10-10",
          colorMarkings: "Red with white face",
          hornStatus: "Polled",
          identificationMethod: "Ear Tag",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "17",
          tagNumber: "CL004",
          breed: "Red Angus",
          sex: "Bull",
          birthDate: "2025-03-20",
          weight: 410,
          dam: "C004",
          lot: "Calf Pen",
          pasture: "South Pasture",
          status: "Active",
          stage: "Calf",
          healthStatus: "Healthy",
          lastVetVisit: "2025-10-10",
          colorMarkings: "Red",
          hornStatus: "Polled",
          identificationMethod: "Ear Tag",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        // Weaners
        {
          id: "18",
          tagNumber: "W001",
          breed: "Angus",
          sex: "Heifer",
          birthDate: "2024-09-10",
          weight: 550,
          lot: "Weaner Pen",
          pasture: "West Pasture",
          status: "Active",
          stage: "Weaner",
          healthStatus: "Healthy",
          lastVetVisit: "2025-10-08",
          colorMarkings: "Black",
          hornStatus: "Polled",
          identificationMethod: "Ear Tag",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "19",
          tagNumber: "W002",
          breed: "Angus",
          sex: "Steer",
          birthDate: "2024-10-05",
          weight: 530,
          lot: "Weaner Pen",
          pasture: "West Pasture",
          status: "Active",
          stage: "Weaner",
          healthStatus: "Healthy",
          lastVetVisit: "2025-10-08",
          colorMarkings: "Black",
          hornStatus: "Polled",
          identificationMethod: "Ear Tag",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "20",
          tagNumber: "W003",
          breed: "Hereford",
          sex: "Steer",
          birthDate: "2024-09-25",
          weight: 560,
          lot: "Weaner Pen",
          pasture: "West Pasture",
          status: "Active",
          stage: "Weaner",
          healthStatus: "Healthy",
          lastVetVisit: "2025-10-08",
          colorMarkings: "Red with white face",
          hornStatus: "Polled",
          identificationMethod: "Ear Tag",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
      localStorage.setItem("cattle", JSON.stringify(sampleCattle))
    }

    if (!localStorage.getItem("feedInventory")) {
      const sampleFeed: FeedInventory[] = [
        {
          id: "1",
          name: "Corn Silage",
          type: "Silage",
          quantity: 5000,
          unit: "lbs",
          costPerUnit: 0.08,
          supplier: "Local Farm Co-op",
          purchaseDate: "2025-10-15",
          location: "Silo 1",
          dailyUsage: 1200,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Alfalfa Hay",
          type: "Hay",
          quantity: 8000,
          unit: "lbs",
          costPerUnit: 0.12,
          supplier: "Green Valley Hay",
          purchaseDate: "2025-10-01",
          location: "Barn 2",
          dailyUsage: 800,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "3",
          name: "Protein Supplement",
          type: "Supplement",
          quantity: 2000,
          unit: "lbs",
          costPerUnit: 0.45,
          supplier: "Feed Supply Inc",
          purchaseDate: "2025-10-20",
          location: "Feed Room",
          dailyUsage: 150,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
      localStorage.setItem("feedInventory", JSON.stringify(sampleFeed))
    }

    if (!localStorage.getItem("pastures")) {
      const samplePastures: Pasture[] = [
        {
          id: "1",
          name: "North Pasture",
          acres: 50,
          grassType: "Fescue",
          condition: "Good",
          currentCattleCount: 45,
          maxCapacity: 60,
          lastRotationDate: "2025-09-01",
          nextRotationDate: "2025-11-15",
          soilTestDate: "2025-03-15",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "South Pasture",
          acres: 35,
          grassType: "Bermuda",
          condition: "Excellent",
          currentCattleCount: 30,
          maxCapacity: 45,
          lastRotationDate: "2025-10-01",
          nextRotationDate: "2025-12-01",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "3",
          name: "East Pasture",
          acres: 25,
          grassType: "Clover Mix",
          condition: "Fair",
          currentCattleCount: 20,
          maxCapacity: 30,
          lastRotationDate: "2025-08-15",
          nextRotationDate: "2025-11-01",
          notes: "Needs reseeding in spring",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
      localStorage.setItem("pastures", JSON.stringify(samplePastures))
    }

    if (!localStorage.getItem("weightRecords")) {
      localStorage.setItem("weightRecords", JSON.stringify([]))
    }

    if (!localStorage.getItem("healthRecords")) {
      localStorage.setItem("healthRecords", JSON.stringify([]))
    }

    if (!localStorage.getItem("feedUsage")) {
      localStorage.setItem("feedUsage", JSON.stringify([]))
    }

    if (!localStorage.getItem("transactions")) {
      localStorage.setItem("transactions", JSON.stringify([]))
    }
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
    const newCattle: Cattle = {
      ...cattle,
      id: Date.now().toString(),
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
      id: Date.now().toString(),
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
      id: Date.now().toString(),
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
      id: Date.now().toString(),
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
      id: Date.now().toString(),
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
      id: Date.now().toString(),
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
      id: Date.now().toString(),
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
        weaned: calves.filter((c) => c.stage === "Weaner").length,
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

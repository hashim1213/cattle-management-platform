import { dataStore } from "./data-store"
import { penStore } from "./pen-store"
import { batchStore } from "./batch-store"
import { taskStore } from "./task-store"
import { timeTrackingStore } from "./time-tracking-store"
import { userRolesStore } from "./user-roles-store"
import { simulationStore } from "./simulation-store"

export function generateComprehensiveSampleData() {
  // Clear existing data
  if (typeof window === "undefined") return

  localStorage.clear()

  // Generate realistic dates
  const today = new Date()
  const daysAgo = (days: number) => {
    const date = new Date(today)
    date.setDate(date.getDate() - days)
    return date.toISOString().split("T")[0]
  }

  // 1. Create Users/Team Members
  const users = [
    {
      name: "John Smith",
      email: "john@ranchmail.com",
      phone: "(555) 123-4567",
      role: "owner" as const,
      active: true,
      pin: "1234",
    },
    {
      name: "Sarah Johnson",
      email: "sarah@ranchmail.com",
      phone: "(555) 234-5678",
      role: "manager" as const,
      active: true,
      pin: "2345",
    },
    {
      name: "Mike Rodriguez",
      email: "mike@ranchmail.com",
      phone: "(555) 345-6789",
      role: "team-member" as const,
      active: true,
      pin: "3456",
    },
    {
      name: "Dr. Emily Chen",
      email: "emily@vetclinic.com",
      phone: "(555) 456-7890",
      role: "veterinarian" as const,
      active: true,
      pin: "4567",
    },
    {
      name: "Tom Williams",
      email: "tom@ranchmail.com",
      phone: "(555) 567-8901",
      role: "team-member" as const,
      active: true,
      pin: "5678",
    },
  ]

  users.forEach((user) => userRolesStore.addUser(user))
  const allUsers = userRolesStore.getUsers()

  // 2. Create Pens
  const penIds: string[] = []
  const penData = [
    { name: "Pen 1A", barn: "North Barn", capacity: 25 },
    { name: "Pen 1B", barn: "North Barn", capacity: 25 },
    { name: "Pen 2A", barn: "South Barn", capacity: 30 },
    { name: "Pen 2B", barn: "South Barn", capacity: 20 },
    { name: "Pen 3", barn: "East Barn", capacity: 15 },
  ]

  penData.forEach((pen) => {
    const newPen = penStore.addPen({
      barnId: pen.barn,
      name: pen.name,
      capacity: pen.capacity,
    })
    penIds.push(newPen.id)
  })

  // 3. Create Batches
  const batches = [
    {
      name: "Fall 2024 Purchase",
      supplier: "Premium Cattle Co.",
      purchaseDate: daysAgo(120),
      headCount: 40,
      averagePurchaseWeight: 650,
      averagePurchasePrice: 1150,
      feederLoanNumber: "FL-2024-001",
      notes: "High-quality steers, good health records",
    },
    {
      name: "Winter 2024 Purchase",
      supplier: "Midwest Livestock",
      purchaseDate: daysAgo(60),
      headCount: 35,
      averagePurchaseWeight: 700,
      averagePurchasePrice: 1225,
      feederLoanNumber: "FL-2024-002",
      notes: "Mixed breed, good frame",
    },
    {
      name: "Spring 2025 Purchase",
      supplier: "ABC Cattle Ranch",
      purchaseDate: daysAgo(15),
      headCount: 25,
      averagePurchaseWeight: 675,
      averagePurchasePrice: 1200,
      feederLoanNumber: "FL-2025-001",
      notes: "Recent arrival, quarantine complete",
    },
  ]

  const batchIds: string[] = []
  batches.forEach((batch) => {
    const newBatch = batchStore.addBatch(batch)
    batchIds.push(newBatch.id)
  })

  // 4. Create 100 Cattle across batches
  const breeds = ["Angus", "Hereford", "Simmental", "Charolais", "Mixed"]
  const sexes: ("Steer" | "Heifer" | "Bull" | "Cow")[] = ["Steer", "Heifer"]
  const stages: ("receiving" | "growing" | "finishing" | "ready-for-sale")[] = [
    "receiving",
    "growing",
    "finishing",
    "ready-for-sale",
  ]

  let cattleCount = 0
  let currentPenIndex = 0

  batches.forEach((batchInfo, batchIndex) => {
    const batch = batchStore.getBatch(batchIds[batchIndex])!
    const cattleIdsForBatch: string[] = []

    for (let i = 0; i < batchInfo.headCount; i++) {
      cattleCount++

      // Distribute cattle across pens
      if (currentPenIndex >= penIds.length) currentPenIndex = 0
      const penId = penIds[currentPenIndex]
      const pen = penStore.getPen(penId)

      // Cycle through pens based on capacity
      if (pen && i > 0 && i % 20 === 0) {
        currentPenIndex++
        if (currentPenIndex >= penIds.length) currentPenIndex = 0
      }

      const rfidBase = 840003000000000 + cattleCount
      const visualTag = cattleCount.toString().padStart(4, "0")

      // Calculate weights based on days since purchase
      const daysOnFeed = Math.floor((today.getTime() - new Date(batchInfo.purchaseDate).getTime()) / (1000 * 60 * 60 * 24))
      const weightGain = Math.floor((daysOnFeed / 180) * 500) // ~500 lbs gain over 180 days
      const currentWeight = batchInfo.averagePurchaseWeight + weightGain + (Math.random() - 0.5) * 100

      // Determine stage based on days on feed
      let stage: "receiving" | "growing" | "finishing" | "ready-for-sale" = "receiving"
      if (daysOnFeed < 30) stage = "receiving"
      else if (daysOnFeed < 90) stage = "growing"
      else if (daysOnFeed < 150) stage = "finishing"
      else stage = "ready-for-sale"

      const arrivalWeight = batchInfo.averagePurchaseWeight + (Math.random() - 0.5) * 50

      const cattleData = {
        tagNumber: visualTag,
        rfidTag: rfidBase.toString(),
        penId: penIds[currentPenIndex],
        barnId: penData[currentPenIndex].barn,
        batchId: batchIds[batchIndex],
        breed: breeds[Math.floor(Math.random() * breeds.length)],
        sex: sexes[Math.floor(Math.random() * sexes.length)],
        birthDate: daysAgo(daysOnFeed + 180), // ~6 months before purchase
        purchaseDate: batchInfo.purchaseDate,
        purchasePrice: batchInfo.averagePurchasePrice,
        purchaseWeight: Math.floor(arrivalWeight),
        weight: Math.floor(currentWeight),
        lot: penData[currentPenIndex].name,
        status: "Active" as const,
        stage: stage === "receiving" ? "Weaner" as const :
               stage === "growing" ? "Yearling" as const :
               "Finishing" as const,
        healthStatus: (Math.random() > 0.1 ? "Healthy" : "Treatment") as const,
        identificationMethod: "RFID",
        notes: i === 0 ? `Lead steer for ${batchInfo.name}` : undefined,
      }

      const newCattle = dataStore.addCattle(cattleData)
      cattleIdsForBatch.push(newCattle.id)

      // Add some health records (20% of cattle)
      if (Math.random() > 0.8) {
        dataStore.addHealthRecord({
          cattleId: newCattle.id,
          date: daysAgo(Math.floor(Math.random() * daysOnFeed)),
          type: Math.random() > 0.5 ? "Treatment" : "Vaccination",
          description: Math.random() > 0.5 ? "Respiratory treatment" : "Annual vaccination",
          veterinarian: "Dr. Emily Chen",
          cost: Math.random() > 0.5 ? 45 : 25,
          notes: "Routine care",
        })
      }

      // Feed records would be added here if needed
    }

    // Link cattle to batch
    batchStore.updateBatch(batchIds[batchIndex], {
      cattleIds: cattleIdsForBatch,
    })
  })

  // 5. Add Feed Inventory
  const feedTypes = [
    { name: "Mixed Ration", quantity: 15000, unit: "lbs", costPerUnit: 3.25 },
    { name: "Hay", quantity: 8000, unit: "lbs", costPerUnit: 2.5 },
    { name: "Corn Silage", quantity: 12000, unit: "lbs", costPerUnit: 2.75 },
    { name: "Protein Supplement", quantity: 2500, unit: "lbs", costPerUnit: 4.5 },
  ]

  feedTypes.forEach((feed) => {
    dataStore.addFeed({
      name: feed.name,
      type: feed.name,
      quantity: feed.quantity,
      unit: feed.unit,
      costPerUnit: feed.costPerUnit,
      purchaseDate: daysAgo(5),
      supplier: "Feed Supply Co.",
      dailyUsage: 250,
      notes: "Regular stock",
    })
  })

  // 6. Create Tasks
  const taskData = [
    {
      title: "Health check Pen 1A",
      description: "Weekly health inspection for all cattle in Pen 1A",
      type: "health" as const,
      priority: "high" as const,
      dueDate: today.toISOString().split("T")[0],
      status: "pending" as const,
      assignedTo: allUsers[2]?.id,
    },
    {
      title: "Refill feed bunks",
      description: "Morning feeding for all pens",
      type: "feeding" as const,
      priority: "urgent" as const,
      dueDate: today.toISOString().split("T")[0],
      status: "in-progress" as const,
      assignedTo: allUsers[4]?.id,
    },
    {
      title: "Veterinary visit scheduled",
      description: "Dr. Chen scheduled to check cattle showing respiratory symptoms",
      type: "vet-visit" as const,
      priority: "high" as const,
      dueDate: daysAgo(-2),
      status: "pending" as const,
      assignedTo: allUsers[3]?.id,
    },
    {
      title: "Clean and bed Pen 2B",
      description: "Weekly pen cleaning and fresh bedding",
      type: "maintenance" as const,
      priority: "medium" as const,
      dueDate: daysAgo(-1),
      status: "pending" as const,
      assignedTo: allUsers[2]?.id,
    },
    {
      title: "Weigh cattle in Pen 3",
      description: "Monthly weight check for growth monitoring",
      type: "general" as const,
      priority: "medium" as const,
      dueDate: daysAgo(-3),
      status: "pending" as const,
      assignedTo: allUsers[1]?.id,
    },
    {
      title: "Repair fence in North Barn",
      description: "Fix damaged fence section in Pen 1B",
      type: "maintenance" as const,
      priority: "high" as const,
      dueDate: daysAgo(1),
      status: "completed" as const,
      assignedTo: allUsers[4]?.id,
      completedAt: daysAgo(1),
    },
    {
      title: "Morning feeding completed",
      description: "All pens fed - Mixed ration",
      type: "feeding" as const,
      priority: "urgent" as const,
      dueDate: daysAgo(1),
      status: "completed" as const,
      assignedTo: allUsers[2]?.id,
      completedAt: daysAgo(1),
    },
  ]

  taskData.forEach((task) => taskStore.addTask(task))

  // 7. Add Time Tracking Entries
  const timeEntries = [
    {
      userId: allUsers[2]?.id || "",
      userName: allUsers[2]?.name || "Mike Rodriguez",
      operationType: "feeding" as const,
      description: "Morning feeding - All pens",
      hours: 2.5,
      date: daysAgo(0),
      notes: "Routine morning feeding",
    },
    {
      userId: allUsers[4]?.id || "",
      userName: allUsers[4]?.name || "Tom Williams",
      operationType: "cleaning" as const,
      description: "Cleaned Pen 1A and 1B",
      hours: 4,
      date: daysAgo(0),
      notes: "Deep cleaning",
    },
    {
      userId: allUsers[2]?.id || "",
      userName: allUsers[2]?.name || "Mike Rodriguez",
      operationType: "health-check" as const,
      description: "Weekly health inspection",
      hours: 3,
      date: daysAgo(1),
    },
    {
      userId: allUsers[1]?.id || "",
      userName: allUsers[1]?.name || "Sarah Johnson",
      operationType: "maintenance" as const,
      description: "Fence repair North Barn",
      hours: 2.5,
      date: daysAgo(1),
    },
    {
      userId: allUsers[2]?.id || "",
      userName: allUsers[2]?.name || "Mike Rodriguez",
      operationType: "feeding" as const,
      description: "Evening feeding - All pens",
      hours: 2,
      date: daysAgo(1),
    },
    {
      userId: allUsers[4]?.id || "",
      userName: allUsers[4]?.name || "Tom Williams",
      operationType: "moving-cattle" as const,
      description: "Moved 5 head from Pen 2A to Pen 3",
      hours: 1.5,
      date: daysAgo(2),
    },
    {
      userId: allUsers[3]?.id || "",
      userName: allUsers[3]?.name || "Dr. Emily Chen",
      operationType: "treatment" as const,
      description: "Treated 3 cattle for respiratory issues",
      hours: 2,
      date: daysAgo(3),
    },
    {
      userId: allUsers[2]?.id || "",
      userName: allUsers[2]?.name || "Mike Rodriguez",
      operationType: "feeding" as const,
      description: "Morning feeding - All pens",
      hours: 2.5,
      date: daysAgo(2),
    },
    {
      userId: allUsers[4]?.id || "",
      userName: allUsers[4]?.name || "Tom Williams",
      operationType: "feeding" as const,
      description: "Evening feeding - All pens",
      hours: 2,
      date: daysAgo(2),
    },
    {
      userId: allUsers[1]?.id || "",
      userName: allUsers[1]?.name || "Sarah Johnson",
      operationType: "other" as const,
      description: "Equipment maintenance",
      hours: 3,
      date: daysAgo(3),
    },
  ]

  timeEntries.forEach((entry) => timeTrackingStore.addEntry(entry))

  // 8. Create Saved Simulations
  const simulations = [
    {
      name: "Summer 2025 Purchase Plan",
      description: "Planning purchase of 50 head for summer feeding program",
      parameters: {
        headCount: 50,
        purchasePricePerHead: 1250,
        averagePurchaseWeight: 700,
        feedCostPerDay: 3.75,
        feedDays: 180,
        veterinaryCost: 3500,
        laborCost: 6000,
        transportCost: 2000,
        otherCosts: 2500,
        targetSaleWeight: 1350,
        targetSalePricePerLb: 1.55,
      },
      supplier: "Premium Cattle Co.",
      feederLoanNumber: "FL-2025-002",
    },
    {
      name: "Fall 2025 Heifer Purchase",
      description: "Potential heifer purchase for breeding program",
      parameters: {
        headCount: 30,
        purchasePricePerHead: 1400,
        averagePurchaseWeight: 650,
        feedCostPerDay: 3.25,
        feedDays: 200,
        veterinaryCost: 4000,
        laborCost: 5000,
        transportCost: 1800,
        otherCosts: 2000,
        targetSaleWeight: 1250,
        targetSalePricePerLb: 1.60,
      },
      supplier: "Quality Genetics Ranch",
    },
  ]

  simulations.forEach((sim) => {
    simulationStore.addSimulation(sim.name, sim.parameters, {
      description: sim.description,
      supplier: sim.supplier,
      feederLoanNumber: sim.feederLoanNumber,
    })
  })

  return {
    cattle: 100,
    batches: batches.length,
    pens: penIds.length,
    users: users.length,
    tasks: taskData.length,
    timeEntries: timeEntries.length,
    simulations: simulations.length,
  }
}

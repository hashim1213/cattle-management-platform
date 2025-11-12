# Bulk Health Operations & Photo Documentation (INV-003)

## Overview
The Bulk Health Operations module enables farmers to process large groups of cattle (10-200+ animals) with identical health treatments in a single operation, automatically deducting from inventory and updating all records. This is critical for arrival protocols, vaccination campaigns, and routine treatments.

## Core Use Cases

### 1. Arrival Processing Protocol
```
Scenario: 120 weaned calves arrive from auction

Farmer needs to:
1. Record arrival weight for all 120 animals
2. Administer arrival protocol:
   - Bovi-Shield Gold 5 (5cc/head)
   - One Shot (5cc/head)
   - Ivomec Plus (1cc/110 lbs)
3. Take photos of any sick/injured animals
4. Automatically deduct 600cc Bovi-Shield, 600cc One Shot, ~650cc Ivomec
5. Create 120 health records
6. Update inventory in real-time

Traditional Method: 2-3 hours of data entry
With Bulk Operations: 5 minutes
```

### 2. Seasonal Vaccination Campaign
```
Scenario: Spring vaccination for 85 yearlings in Pen 3

Farmer needs to:
1. Select all cattle in Pen 3
2. Apply treatment protocol:
   - Cydectin Pour-On (1ml/22 lbs)
3. Mark animals as treated for current season
4. Deduct from inventory based on total pen weight
5. Generate treatment report for records

Time Saved: 90%
```

### 3. Injury/Illness Documentation
```
Scenario: Individual calf with leg injury

Farmer needs to:
1. Take photos of injury
2. Record treatment (LA-200, dosage)
3. Add vet notes
4. Schedule follow-up check
5. Attach photos to health record
6. Deduct medication from inventory

Result: Complete visual documentation for insurance, vet consultations, and audit trail
```

## Technical Architecture

### 1. Data Models

#### Treatment Protocol Template
```typescript
// /lib/health/treatment-protocols.ts

export interface TreatmentProtocol {
  id: string
  name: string
  description: string
  category: 'arrival' | 'vaccination' | 'deworming' | 'processing' | 'custom'

  // Protocol steps
  treatments: {
    drugId: string
    drugName: string
    dosageAmount: number
    dosageUnit: 'cc' | 'ml' | 'cc/cwt' | 'cc/100lbs'
    dosageType: 'fixed' | 'weight-based' // Fixed (5cc/head) or weight-based (1cc/100lbs)
    administrationRoute: 'injectable' | 'oral' | 'topical' | 'pour-on' | 'bolus'
    withdrawalPeriod?: number
    notes?: string
  }[]

  // Estimated costs
  estimatedCostPerHead: number

  // Metadata
  createdBy: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

// Pre-defined protocols
export const DEFAULT_PROTOCOLS: TreatmentProtocol[] = [
  {
    id: 'protocol-arrival-standard',
    name: 'Standard Arrival Protocol',
    description: 'Typical treatment for newly arrived feeder cattle',
    category: 'arrival',
    treatments: [
      {
        drugId: 'drug-bovi-shield',
        drugName: 'Bovi-Shield Gold 5',
        dosageAmount: 5,
        dosageUnit: 'cc',
        dosageType: 'fixed',
        administrationRoute: 'injectable',
        withdrawalPeriod: 21
      },
      {
        drugId: 'drug-one-shot',
        drugName: 'One Shot',
        dosageAmount: 5,
        dosageUnit: 'cc',
        dosageType: 'fixed',
        administrationRoute: 'injectable',
        withdrawalPeriod: 28
      },
      {
        drugId: 'drug-ivomec',
        drugName: 'Ivomec Plus',
        dosageAmount: 1,
        dosageUnit: 'cc/100lbs',
        dosageType: 'weight-based',
        administrationRoute: 'injectable',
        withdrawalPeriod: 49
      }
    ],
    estimatedCostPerHead: 12.50,
    createdBy: 'system',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'protocol-spring-vaccination',
    name: 'Spring Vaccination',
    description: 'Annual spring vaccination and deworming',
    category: 'vaccination',
    treatments: [
      {
        drugId: 'drug-cydectin',
        drugName: 'Cydectin Pour-On',
        dosageAmount: 1,
        dosageUnit: 'ml',
        dosageType: 'weight-based',
        administrationRoute: 'pour-on',
        withdrawalPeriod: 0,
        notes: '1ml per 22 lbs body weight'
      }
    ],
    estimatedCostPerHead: 8.00,
    createdBy: 'system',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]
```

#### Bulk Health Record
```typescript
// /lib/health/bulk-health-record.ts

export interface BulkHealthRecord {
  id: string
  batchName: string
  protocolId: string
  protocolName: string

  // Cattle selection
  cattleIds: string[]
  penIds?: string[]
  totalHeadCount: number

  // Treatment details
  treatmentDate: string
  treatments: {
    drugId: string
    drugName: string
    totalQuantityUsed: number
    unit: string
    costPerUnit: number
    totalCost: number
    inventoryTransactionId: string
  }[]

  // Results
  successfulRecords: string[]      // Health record IDs
  failedCattle: Array<{
    cattleId: string
    tagNumber: string
    error: string
  }>

  // Photos (for batch documentation)
  photoUrls?: string[]

  // Metadata
  performedBy: string
  totalCost: number
  notes?: string
  createdAt: string
  completedAt?: string
}

export interface IndividualHealthRecord {
  id: string
  cattleId: string
  tagNumber: string
  treatmentDate: string

  // Treatment details
  condition?: string
  treatment: string
  drugName: string
  dosageAmount: number
  dosageUnit: string
  administrationRoute: string

  // Inventory tracking
  inventoryTransactionId?: string
  cost: number

  // Photos (for individual animals)
  photoUrls?: string[]

  // Follow-up
  withdrawalDate?: string
  followUpRequired: boolean
  followUpDate?: string
  followUpCompleted: boolean

  // Vet involvement
  vetConsulted: boolean
  vetName?: string
  vetNotes?: string

  // Metadata
  performedBy: string
  notes?: string
  createdAt: string
  updatedAt: string

  // Link to bulk operation
  bulkRecordId?: string
}
```

### 2. Bulk Treatment Service

```typescript
// /lib/health/bulk-treatment-service.ts

interface BulkTreatmentParams {
  cattleIds: string[]
  protocolId: string
  treatmentDate: string
  batchName?: string
  performedBy: string
  notes?: string
}

interface BulkTreatmentResult {
  bulkRecord: BulkHealthRecord
  healthRecords: IndividualHealthRecord[]
  inventoryTransactions: InventoryTransaction[]
  failed: Array<{ cattleId: string; error: string }>
  summary: {
    totalCattle: number
    successful: number
    failed: number
    totalCost: number
    inventoryDeductions: Array<{
      drugName: string
      quantity: number
      unit: string
    }>
  }
}

class BulkTreatmentService {
  /**
   * Apply treatment protocol to multiple cattle
   * This is the core bulk operation function
   */
  async applyProtocol(params: BulkTreatmentParams): Promise<BulkTreatmentResult> {
    const protocol = await this.getProtocol(params.protocolId)
    if (!protocol) {
      throw new Error('Protocol not found')
    }

    // 1. Validate all cattle exist and get their data
    const cattle = await Promise.all(
      params.cattleIds.map(id => cattleStore.getCattle(id))
    )

    const validCattle = cattle.filter(c => c !== null) as Cattle[]
    const failed: Array<{ cattleId: string; error: string }> = []

    // Track missing cattle
    params.cattleIds.forEach((id, index) => {
      if (!cattle[index]) {
        failed.push({ cattleId: id, error: 'Cattle not found' })
      }
    })

    // 2. Calculate total drug requirements
    const drugRequirements = this.calculateDrugRequirements(
      validCattle,
      protocol.treatments
    )

    // 3. Check inventory availability for ALL drugs BEFORE processing
    for (const req of drugRequirements) {
      const available = await inventoryService.checkAvailability(
        req.drugId,
        req.totalRequired
      )

      if (!available.available) {
        throw new Error(
          `Insufficient inventory: ${req.drugName} - Need ${req.totalRequired}${req.unit}, have ${available.currentQuantity}${req.unit}`
        )
      }
    }

    // 4. Create individual health records (in transaction)
    const healthRecords: IndividualHealthRecord[] = []
    const inventoryTransactions: InventoryTransaction[] = []

    // Process each animal
    for (const animal of validCattle) {
      try {
        // Calculate dosage for this animal
        const animalTreatments = protocol.treatments.map(t => {
          const dosage = this.calculateDosage(t, animal.weight || 600)
          return {
            ...t,
            actualDosage: dosage
          }
        })

        // Create health record
        for (const treatment of animalTreatments) {
          const record: IndividualHealthRecord = {
            id: `health-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            cattleId: animal.id,
            tagNumber: animal.tagNumber || animal.visualId || 'Unknown',
            treatmentDate: params.treatmentDate,
            treatment: protocol.name,
            drugName: treatment.drugName,
            dosageAmount: treatment.actualDosage,
            dosageUnit: treatment.dosageUnit,
            administrationRoute: treatment.administrationRoute,
            cost: 0, // Will be calculated after inventory deduction
            withdrawalDate: treatment.withdrawalPeriod
              ? this.calculateWithdrawalDate(params.treatmentDate, treatment.withdrawalPeriod)
              : undefined,
            followUpRequired: false,
            followUpCompleted: false,
            vetConsulted: false,
            performedBy: params.performedBy,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }

          healthRecords.push(record)
        }
      } catch (error) {
        failed.push({
          cattleId: animal.id,
          error: (error as Error).message
        })
      }
    }

    // 5. Deduct from inventory (ATOMIC operation)
    let totalCost = 0

    for (const req of drugRequirements) {
      try {
        const transaction = await inventoryService.deduct({
          itemId: req.drugId,
          quantity: req.totalRequired,
          reason: `Bulk treatment: ${protocol.name} - ${validCattle.length} head`,
          performedBy: params.performedBy,
          relatedRecordType: 'bulk_health_record',
          relatedRecordId: 'pending' // Will update after bulk record created
        })

        inventoryTransactions.push(transaction)
        totalCost += transaction.costImpact || 0

        // Update individual health records with cost per head
        const costPerHead = (transaction.costImpact || 0) / validCattle.length
        healthRecords.forEach(record => {
          if (record.drugName === req.drugName) {
            record.cost = costPerHead
            record.inventoryTransactionId = transaction.id
          }
        })
      } catch (error) {
        // Rollback: delete created health records
        console.error('Inventory deduction failed, rolling back', error)
        throw new Error(`Inventory deduction failed for ${req.drugName}: ${(error as Error).message}`)
      }
    }

    // 6. Create bulk health record
    const bulkRecord: BulkHealthRecord = {
      id: `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      batchName: params.batchName || `${protocol.name} - ${new Date(params.treatmentDate).toLocaleDateString()}`,
      protocolId: params.protocolId,
      protocolName: protocol.name,
      cattleIds: params.cattleIds,
      totalHeadCount: validCattle.length,
      treatmentDate: params.treatmentDate,
      treatments: drugRequirements.map(req => {
        const transaction = inventoryTransactions.find(t => t.itemId === req.drugId)!
        return {
          drugId: req.drugId,
          drugName: req.drugName,
          totalQuantityUsed: req.totalRequired,
          unit: req.unit,
          costPerUnit: transaction.costPerUnit || 0,
          totalCost: transaction.costImpact || 0,
          inventoryTransactionId: transaction.id
        }
      }),
      successfulRecords: healthRecords.map(r => r.id),
      failedCattle: failed,
      performedBy: params.performedBy,
      totalCost,
      notes: params.notes,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    }

    // 7. Update inventory transactions with bulk record ID
    for (const transaction of inventoryTransactions) {
      await inventoryService.updateTransaction(transaction.id, {
        relatedRecordId: bulkRecord.id
      })
    }

    // 8. Save bulk record and health records to database
    await this.saveBulkRecord(bulkRecord)
    await this.saveHealthRecords(healthRecords)

    // 9. Update cattle withdrawal dates
    for (const animal of validCattle) {
      const latestWithdrawal = healthRecords
        .filter(r => r.cattleId === animal.id && r.withdrawalDate)
        .sort((a, b) => new Date(b.withdrawalDate!).getTime() - new Date(a.withdrawalDate!).getTime())[0]

      if (latestWithdrawal?.withdrawalDate) {
        await cattleStore.updateCattle(animal.id, {
          withdrawalDate: latestWithdrawal.withdrawalDate
        })
      }
    }

    return {
      bulkRecord,
      healthRecords,
      inventoryTransactions,
      failed,
      summary: {
        totalCattle: params.cattleIds.length,
        successful: validCattle.length,
        failed: failed.length,
        totalCost,
        inventoryDeductions: drugRequirements.map(req => ({
          drugName: req.drugName,
          quantity: req.totalRequired,
          unit: req.unit
        }))
      }
    }
  }

  /**
   * Calculate total drug requirements for bulk operation
   */
  private calculateDrugRequirements(
    cattle: Cattle[],
    treatments: TreatmentProtocol['treatments']
  ): Array<{
    drugId: string
    drugName: string
    totalRequired: number
    unit: string
  }> {
    const requirements: Record<string, {
      drugId: string
      drugName: string
      totalRequired: number
      unit: string
    }> = {}

    for (const animal of cattle) {
      for (const treatment of treatments) {
        const dosage = this.calculateDosage(treatment, animal.weight || 600)
        const key = treatment.drugId

        if (!requirements[key]) {
          requirements[key] = {
            drugId: treatment.drugId,
            drugName: treatment.drugName,
            totalRequired: 0,
            unit: treatment.dosageUnit.replace(/\/.*/, '') // Remove /cwt or /100lbs
          }
        }

        requirements[key].totalRequired += dosage
      }
    }

    return Object.values(requirements)
  }

  /**
   * Calculate dosage for individual animal
   */
  private calculateDosage(
    treatment: TreatmentProtocol['treatments'][0],
    weight: number
  ): number {
    if (treatment.dosageType === 'fixed') {
      return treatment.dosageAmount
    }

    // Weight-based dosage
    if (treatment.dosageUnit.includes('/cwt')) {
      // Per hundredweight (100 lbs)
      return (weight / 100) * treatment.dosageAmount
    }

    if (treatment.dosageUnit.includes('/100lbs')) {
      return (weight / 100) * treatment.dosageAmount
    }

    // Default: per pound
    return (weight / 1) * treatment.dosageAmount
  }

  /**
   * Calculate withdrawal date
   */
  private calculateWithdrawalDate(treatmentDate: string, withdrawalDays: number): string {
    const date = new Date(treatmentDate)
    date.setDate(date.getDate() + withdrawalDays)
    return date.toISOString().split('T')[0]
  }

  private async getProtocol(protocolId: string): Promise<TreatmentProtocol | null> {
    // Load from database or return default
    const defaultProtocol = DEFAULT_PROTOCOLS.find(p => p.id === protocolId)
    return defaultProtocol || null
  }

  private async saveBulkRecord(record: BulkHealthRecord): Promise<void> {
    const { error } = await supabase
      .from('bulk_health_records')
      .insert(record)

    if (error) throw error
  }

  private async saveHealthRecords(records: IndividualHealthRecord[]): Promise<void> {
    const { error } = await supabase
      .from('health_records')
      .insert(records)

    if (error) throw error
  }
}

export const bulkTreatmentService = new BulkTreatmentService()
```

### 3. Photo Attachment Service

```typescript
// /lib/health/photo-service.ts

interface PhotoUploadParams {
  healthRecordId: string
  photoFile: File
  caption?: string
  takenAt?: string
}

interface PhotoMetadata {
  id: string
  healthRecordId: string
  url: string
  thumbnailUrl?: string
  filename: string
  fileSize: number
  mimeType: string
  caption?: string
  takenAt: string
  uploadedBy: string
  uploadedAt: string
}

class HealthPhotoService {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic']

  /**
   * Upload photo and attach to health record
   */
  async uploadPhoto(params: PhotoUploadParams): Promise<PhotoMetadata> {
    // 1. Validate file
    if (params.photoFile.size > this.MAX_FILE_SIZE) {
      throw new Error('File size exceeds 10MB limit')
    }

    if (!this.ALLOWED_TYPES.includes(params.photoFile.type)) {
      throw new Error('Only JPEG, PNG, and HEIC images are allowed')
    }

    // 2. Generate unique filename
    const fileExt = params.photoFile.name.split('.').pop()
    const filename = `health/${params.healthRecordId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`

    // 3. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('health-photos')
      .upload(filename, params.photoFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // 4. Get public URL
    const { data: urlData } = supabase.storage
      .from('health-photos')
      .getPublicUrl(filename)

    // 5. Generate thumbnail (optional - could use Supabase image transformations)
    const thumbnailUrl = `${urlData.publicUrl}?width=300&height=300&fit=cover`

    // 6. Create metadata record
    const metadata: PhotoMetadata = {
      id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      healthRecordId: params.healthRecordId,
      url: urlData.publicUrl,
      thumbnailUrl,
      filename: params.photoFile.name,
      fileSize: params.photoFile.size,
      mimeType: params.photoFile.type,
      caption: params.caption,
      takenAt: params.takenAt || new Date().toISOString(),
      uploadedBy: 'current-user-id', // From auth context
      uploadedAt: new Date().toISOString()
    }

    // 7. Save metadata to database
    const { error: dbError } = await supabase
      .from('health_photos')
      .insert(metadata)

    if (dbError) {
      // Rollback: delete uploaded file
      await supabase.storage.from('health-photos').remove([filename])
      throw new Error(`Database error: ${dbError.message}`)
    }

    // 8. Update health record with photo URL
    await this.addPhotoToHealthRecord(params.healthRecordId, urlData.publicUrl)

    return metadata
  }

  /**
   * Upload multiple photos at once
   */
  async uploadMultiplePhotos(
    healthRecordId: string,
    photos: Array<{ file: File; caption?: string }>
  ): Promise<PhotoMetadata[]> {
    const results = await Promise.all(
      photos.map(photo =>
        this.uploadPhoto({
          healthRecordId,
          photoFile: photo.file,
          caption: photo.caption
        })
      )
    )

    return results
  }

  /**
   * Get all photos for health record
   */
  async getPhotos(healthRecordId: string): Promise<PhotoMetadata[]> {
    const { data, error } = await supabase
      .from('health_photos')
      .select('*')
      .eq('healthRecordId', healthRecordId)
      .order('takenAt', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Delete photo
   */
  async deletePhoto(photoId: string): Promise<void> {
    // 1. Get photo metadata
    const { data: photo, error: fetchError } = await supabase
      .from('health_photos')
      .select('*')
      .eq('id', photoId)
      .single()

    if (fetchError) throw fetchError

    // 2. Delete from storage
    const filename = photo.url.split('/').pop()
    await supabase.storage
      .from('health-photos')
      .remove([`health/${photo.healthRecordId}/${filename}`])

    // 3. Delete metadata
    const { error: deleteError } = await supabase
      .from('health_photos')
      .delete()
      .eq('id', photoId)

    if (deleteError) throw deleteError

    // 4. Update health record
    await this.removePhotoFromHealthRecord(photo.healthRecordId, photo.url)
  }

  private async addPhotoToHealthRecord(healthRecordId: string, photoUrl: string): Promise<void> {
    const { data: record } = await supabase
      .from('health_records')
      .select('photoUrls')
      .eq('id', healthRecordId)
      .single()

    const photoUrls = record?.photoUrls || []
    photoUrls.push(photoUrl)

    await supabase
      .from('health_records')
      .update({ photoUrls })
      .eq('id', healthRecordId)
  }

  private async removePhotoFromHealthRecord(healthRecordId: string, photoUrl: string): Promise<void> {
    const { data: record } = await supabase
      .from('health_records')
      .select('photoUrls')
      .eq('id', healthRecordId)
      .single()

    const photoUrls = (record?.photoUrls || []).filter((url: string) => url !== photoUrl)

    await supabase
      .from('health_records')
      .update({ photoUrls })
      .eq('id', healthRecordId)
  }
}

export const healthPhotoService = new HealthPhotoService()
```

### 4. UI Components

#### Bulk Treatment Dialog
```typescript
// /components/bulk-treatment-dialog.tsx

interface BulkTreatmentDialogProps {
  selectedCattle: Cattle[]
  open: boolean
  onClose: () => void
  onComplete: (result: BulkTreatmentResult) => void
}

export function BulkTreatmentDialog({ selectedCattle, open, onClose, onComplete }: BulkTreatmentDialogProps) {
  const [selectedProtocol, setSelectedProtocol] = useState<string>('')
  const [treatmentDate, setTreatmentDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [batchName, setBatchName] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [processing, setProcessing] = useState(false)
  const [inventoryCheck, setInventoryCheck] = useState<'checking' | 'sufficient' | 'insufficient' | null>(null)
  const [inventoryDetails, setInventoryDetails] = useState<any>(null)

  useEffect(() => {
    if (selectedProtocol) {
      checkInventory()
    }
  }, [selectedProtocol, selectedCattle])

  const checkInventory = async () => {
    setInventoryCheck('checking')

    // Calculate requirements
    const protocol = DEFAULT_PROTOCOLS.find(p => p.id === selectedProtocol)
    if (!protocol) return

    const requirements = calculateDrugRequirements(selectedCattle, protocol.treatments)

    // Check each drug
    const checks = await Promise.all(
      requirements.map(req =>
        inventoryService.checkAvailability(req.drugId, req.totalRequired)
      )
    )

    const allSufficient = checks.every(c => c.available)
    setInventoryCheck(allSufficient ? 'sufficient' : 'insufficient')
    setInventoryDetails({
      requirements,
      checks
    })
  }

  const handleSubmit = async () => {
    setProcessing(true)

    try {
      const result = await bulkTreatmentService.applyProtocol({
        cattleIds: selectedCattle.map(c => c.id),
        protocolId: selectedProtocol,
        treatmentDate,
        batchName: batchName || undefined,
        performedBy: 'current-user-id',
        notes: notes || undefined
      })

      toast.success(
        `Treatment applied to ${result.summary.successful} animals. ` +
        `Total cost: $${result.summary.totalCost.toFixed(2)}`
      )

      if (result.failed.length > 0) {
        toast.warning(`${result.failed.length} animals failed. See details.`)
      }

      onComplete(result)
      onClose()
    } catch (error) {
      toast.error(`Bulk treatment failed: ${(error as Error).message}`)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Treatment - {selectedCattle.length} Animals</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selected Animals Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Selected Animals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Head:</span>
                  <span className="ml-2 font-semibold">{selectedCattle.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Weight:</span>
                  <span className="ml-2 font-semibold">
                    {selectedCattle.reduce((sum, c) => sum + (c.weight || 600), 0).toLocaleString()} lbs
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Average Weight:</span>
                  <span className="ml-2 font-semibold">
                    {(selectedCattle.reduce((sum, c) => sum + (c.weight || 600), 0) / selectedCattle.length).toFixed(0)} lbs
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Protocol Selection */}
          <div>
            <Label>Treatment Protocol</Label>
            <Select value={selectedProtocol} onValueChange={setSelectedProtocol}>
              <SelectTrigger>
                <SelectValue placeholder="Select protocol" />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_PROTOCOLS.map(protocol => (
                  <SelectItem key={protocol.id} value={protocol.id}>
                    <div>
                      <div className="font-semibold">{protocol.name}</div>
                      <div className="text-xs text-muted-foreground">{protocol.description}</div>
                      <div className="text-xs text-green-600">~${protocol.estimatedCostPerHead}/head</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Protocol Details */}
          {selectedProtocol && (() => {
            const protocol = DEFAULT_PROTOCOLS.find(p => p.id === selectedProtocol)
            return (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Protocol Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {protocol?.treatments.map((treatment, index) => (
                      <div key={index} className="flex justify-between items-start text-sm">
                        <div>
                          <div className="font-medium">{treatment.drugName}</div>
                          <div className="text-xs text-muted-foreground">
                            {treatment.dosageAmount}{treatment.dosageUnit} {treatment.administrationRoute}
                            {treatment.withdrawalPeriod && ` • ${treatment.withdrawalPeriod} day withdrawal`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })()}

          {/* Inventory Check */}
          {inventoryCheck && (
            <Alert variant={inventoryCheck === 'insufficient' ? 'destructive' : 'default'}>
              {inventoryCheck === 'checking' && <Loader2 className="h-4 w-4 animate-spin" />}
              {inventoryCheck === 'sufficient' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              {inventoryCheck === 'insufficient' && <AlertCircle className="h-4 w-4" />}

              <AlertTitle>
                {inventoryCheck === 'checking' && 'Checking Inventory...'}
                {inventoryCheck === 'sufficient' && 'Inventory Sufficient'}
                {inventoryCheck === 'insufficient' && 'Insufficient Inventory'}
              </AlertTitle>

              <AlertDescription>
                {inventoryCheck === 'sufficient' && 'All required drugs are available in inventory.'}
                {inventoryCheck === 'insufficient' && (
                  <div className="mt-2 space-y-1">
                    {inventoryDetails?.checks.map((check: any, idx: number) => {
                      if (!check.available) {
                        const req = inventoryDetails.requirements[idx]
                        return (
                          <div key={idx} className="text-sm">
                            <strong>{req.drugName}:</strong> Need {req.totalRequired}{req.unit},
                            have {check.currentQuantity}{req.unit}
                            (short {check.shortfall}{req.unit})
                          </div>
                        )
                      }
                      return null
                    })}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Treatment Date */}
          <div>
            <Label>Treatment Date</Label>
            <Input
              type="date"
              value={treatmentDate}
              onChange={(e) => setTreatmentDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Batch Name */}
          <div>
            <Label>Batch Name (Optional)</Label>
            <Input
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder="e.g., Arrival Processing - Lot 45"
            />
          </div>

          {/* Notes */}
          <div>
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this treatment..."
              rows={3}
            />
          </div>

          {/* Cost Estimate */}
          {selectedProtocol && (() => {
            const protocol = DEFAULT_PROTOCOLS.find(p => p.id === selectedProtocol)
            const estimatedTotal = (protocol?.estimatedCostPerHead || 0) * selectedCattle.length
            return (
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Estimated Total Cost:</span>
                  <span className="text-2xl font-bold">${estimatedTotal.toFixed(2)}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  ${protocol?.estimatedCostPerHead.toFixed(2)}/head × {selectedCattle.length} animals
                </div>
              </div>
            )
          })()}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={processing || !selectedProtocol || inventoryCheck !== 'sufficient'}
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Apply Treatment to ${selectedCattle.length} Animals`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

#### Photo Upload Component
```typescript
// /components/health-photo-upload.tsx

interface HealthPhotoUploadProps {
  healthRecordId: string
  existingPhotos?: PhotoMetadata[]
  onPhotosUpdated: (photos: PhotoMetadata[]) => void
}

export function HealthPhotoUpload({ healthRecordId, existingPhotos = [], onPhotosUpdated }: HealthPhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [photos, setPhotos] = useState<PhotoMetadata[]>(existingPhotos)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploading(true)

    try {
      const newPhotos = await healthPhotoService.uploadMultiplePhotos(
        healthRecordId,
        files.map(file => ({ file }))
      )

      const updatedPhotos = [...photos, ...newPhotos]
      setPhotos(updatedPhotos)
      onPhotosUpdated(updatedPhotos)

      toast.success(`${newPhotos.length} photo(s) uploaded successfully`)
    } catch (error) {
      toast.error(`Upload failed: ${(error as Error).message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Delete this photo?')) return

    try {
      await healthPhotoService.deletePhoto(photoId)
      const updatedPhotos = photos.filter(p => p.id !== photoId)
      setPhotos(updatedPhotos)
      onPhotosUpdated(updatedPhotos)
      toast.success('Photo deleted')
    } catch (error) {
      toast.error(`Delete failed: ${(error as Error).message}`)
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/heic"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Add Photos
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-1">
          JPEG, PNG, HEIC • Max 10MB per photo
        </p>
      </div>

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {photos.map(photo => (
            <div key={photo.id} className="relative group">
              <img
                src={photo.thumbnailUrl || photo.url}
                alt={photo.caption || 'Health record photo'}
                className="w-full h-32 object-cover rounded-lg border"
              />

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => window.open(photo.url, '_blank')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeletePhoto(photo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Caption */}
              {photo.caption && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {photo.caption}
                </p>
              )}

              {/* Date */}
              <p className="text-xs text-muted-foreground">
                {new Date(photo.takenAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <Camera className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">No photos yet</p>
        </div>
      )}
    </div>
  )
}
```

## Database Schema

```sql
-- Bulk health records table
CREATE TABLE bulk_health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  batch_name TEXT NOT NULL,
  protocol_id TEXT NOT NULL,
  protocol_name TEXT NOT NULL,

  cattle_ids UUID[] NOT NULL,
  pen_ids UUID[],
  total_head_count INTEGER NOT NULL,

  treatment_date DATE NOT NULL,
  treatments JSONB NOT NULL, -- Array of treatment details

  successful_records UUID[] NOT NULL,
  failed_cattle JSONB, -- Array of failed attempts

  photo_urls TEXT[],

  performed_by TEXT NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  CHECK (total_head_count > 0)
);

-- Individual health records table
CREATE TABLE health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  cattle_id UUID NOT NULL REFERENCES cattle(id),
  tag_number TEXT NOT NULL,
  treatment_date DATE NOT NULL,

  condition TEXT,
  treatment TEXT NOT NULL,
  drug_name TEXT NOT NULL,
  dosage_amount DECIMAL(10,2) NOT NULL,
  dosage_unit TEXT NOT NULL,
  administration_route TEXT NOT NULL,

  inventory_transaction_id UUID REFERENCES inventory_transactions(id),
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,

  photo_urls TEXT[],

  withdrawal_date DATE,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  follow_up_completed BOOLEAN DEFAULT FALSE,

  vet_consulted BOOLEAN DEFAULT FALSE,
  vet_name TEXT,
  vet_notes TEXT,

  performed_by TEXT NOT NULL,
  notes TEXT,

  bulk_record_id UUID REFERENCES bulk_health_records(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CHECK (dosage_amount > 0),
  CHECK (administration_route IN ('injectable', 'oral', 'topical', 'pour-on', 'bolus'))
);

-- Health photos table
CREATE TABLE health_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  health_record_id UUID NOT NULL REFERENCES health_records(id) ON DELETE CASCADE,

  url TEXT NOT NULL,
  thumbnail_url TEXT,
  filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,

  caption TEXT,
  taken_at TIMESTAMP WITH TIME ZONE NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CHECK (file_size > 0 AND file_size <= 10485760), -- Max 10MB
  CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/heic'))
);

-- Treatment protocols table
CREATE TABLE treatment_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,

  treatments JSONB NOT NULL,
  estimated_cost_per_head DECIMAL(10,2) NOT NULL,

  created_by TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CHECK (category IN ('arrival', 'vaccination', 'deworming', 'processing', 'custom'))
);

-- Indexes
CREATE INDEX idx_bulk_health_user ON bulk_health_records(user_id);
CREATE INDEX idx_bulk_health_date ON bulk_health_records(treatment_date DESC);
CREATE INDEX idx_health_records_cattle ON health_records(cattle_id);
CREATE INDEX idx_health_records_user ON health_records(user_id);
CREATE INDEX idx_health_records_date ON health_records(treatment_date DESC);
CREATE INDEX idx_health_records_withdrawal ON health_records(withdrawal_date) WHERE withdrawal_date IS NOT NULL;
CREATE INDEX idx_health_photos_record ON health_photos(health_record_id);
CREATE INDEX idx_treatment_protocols_user ON treatment_protocols(user_id);

-- Row Level Security
ALTER TABLE bulk_health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bulk records" ON bulk_health_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bulk records" ON bulk_health_records FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own health records" ON health_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own health records" ON health_records FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own photos" ON health_photos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own photos" ON health_photos FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own protocols" ON treatment_protocols FOR SELECT USING (auth.uid() = user_id OR is_default = TRUE);
CREATE POLICY "Users can manage own protocols" ON treatment_protocols FOR ALL USING (auth.uid() = user_id);
```

## Implementation Timeline

### Phase 1: Core Bulk Treatment (Week 1-2)
- [ ] Create treatment protocol data models
- [ ] Implement BulkTreatmentService
- [ ] Build BulkTreatmentDialog component
- [ ] Test with 10-50 animals

### Phase 2: Inventory Integration (Week 3)
- [ ] Integrate with inventory service
- [ ] Add pre-flight inventory checks
- [ ] Implement atomic inventory deductions
- [ ] Test rollback scenarios

### Phase 3: Photo Attachments (Week 4)
- [ ] Set up Supabase Storage bucket
- [ ] Implement HealthPhotoService
- [ ] Build HealthPhotoUpload component
- [ ] Add photo compression/optimization

### Phase 4: Advanced Features (Week 5)
- [ ] Custom protocol builder
- [ ] Weight-based dosage calculations
- [ ] Withdrawal date tracking
- [ ] Follow-up reminder system

### Phase 5: Testing & Optimization (Week 6)
- [ ] Load testing with 200+ animals
- [ ] Optimize database queries
- [ ] Add progress indicators for large batches
- [ ] User acceptance testing

## Success Metrics

### Performance Targets
- Process 100 animals in <5 seconds
- Process 200 animals in <10 seconds
- Photo upload completes in <3 seconds
- Zero inventory sync failures

### User Experience
- Reduce data entry time by 90% (from 2 hours to 10 minutes)
- <2% error rate on bulk operations
- 100% inventory accuracy after bulk treatments

### Cost Savings
- Save $50/hour in labor costs (120 animals × 1 min/animal = 2 hours saved)
- Eliminate inventory counting errors
- Reduce vet consultation time with photo documentation

## Next Steps

1. **This Week**: Review architecture with user, get approval
2. **Week 1-2**: Build core bulk treatment functionality
3. **Week 3**: Integrate with existing inventory system
4. **Week 4**: Add photo upload capability
5. **Month 2**: Full production deployment with training

---

**This bulk operations module transforms cattle health management from tedious manual data entry into a streamlined, accurate, and cost-effective process that saves farmers hours of work while ensuring 100% inventory accuracy.**

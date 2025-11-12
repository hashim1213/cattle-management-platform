# CCIA Compliance Module Architecture (REG-001/002)

## Overview
The CCIA (Canadian Cattle Identification Agency) Compliance Module ensures mandatory regulatory compliance for cattle movement tracking, tag validation, and reporting to Canadian government databases. This module is **legally required** for all Canadian cattle operations.

## Regulatory Context

### CCIA Requirements
- **Mandatory Tag Reporting**: All cattle must have RFID tags registered with CCIA
- **Movement Tracking**: All on-farm and off-farm movements must be reported within 7 days
- **Traceability**: Full lifetime movement history for disease outbreak management
- **Slaughter Reporting**: Automatic reporting when cattle leave for processing
- **Penalties**: Non-compliance can result in fines ($250-$1,000 per violation) and farm restrictions

### CLPS Integration
**Canadian Livestock Production System (CLPS)** is the online portal for:
- Tag activation and registration
- Movement event reporting
- Premises identification
- Cattle inventory validation

## Core Use Cases

### 1. Tag Registration and Validation
```typescript
// When farmer purchases new cattle
User: Scans RFID tag "CA123456789012"
System:
  → Validates tag format (15 characters, starts with "CA")
  → Queries CCIA database for tag status
  → Verifies tag is active and not reported lost/dead
  → Associates tag with cattle record
  → Registers "arrival" movement event
```

### 2. On-Farm Movement Tracking
```typescript
// When cattle move between pens on same farm
User: "Moved Tag 1234 from Pen A to Pen B"
System:
  → Records internal movement (not reported to CCIA)
  → Updates pen assignment
  → Logs movement for audit trail
  → Available for farm analytics
```

### 3. Off-Farm Movement (Sale/Transfer)
```typescript
// When cattle sold to another farm
User: "Tag 1234 sold to Smith Feedlot (PID: AB123456)"
System:
  → Records off-farm movement
  → Validates destination premises ID
  → Queues CCIA report (if offline)
  → Submits movement event to CLPS API
  → Receives confirmation code
  → Updates cattle status to "sold"
  → Archives cattle record
```

### 4. Slaughter Movement
```typescript
// When cattle shipped to processing plant
User: "Tags 1234, 5678, 9012 to Cargill (PID: AB789123)"
System:
  → Batch movement for multiple animals
  → Validates processing plant premises ID
  → Submits to CLPS with "Slaughter" flag
  → Updates cattle status to "processed"
  → Generates final financial report per animal
```

### 5. Tag Replacement (Lost/Damaged)
```typescript
// When RFID tag needs replacement
User: "Replaced tag CA111111111111 with CA222222222222"
System:
  → Reports original tag as "lost/damaged" to CCIA
  → Activates new tag
  → Links new tag to same cattle record
  → Maintains complete history with both tag numbers
```

## Technical Architecture

### 1. Data Models

#### Movement Event Schema
```typescript
export enum MovementType {
  ARRIVAL = 'arrival',           // Incoming from another farm
  ON_FARM = 'on_farm',           // Internal pen-to-pen movement
  OFF_FARM_SALE = 'off_farm_sale', // Sold to another farm
  OFF_FARM_SLAUGHTER = 'off_farm_slaughter', // Sent to processor
  OFF_FARM_AUCTION = 'off_farm_auction', // Sent to auction
  DEATH = 'death',                // Mortality event
  EXPORT = 'export',              // International export
  TAG_REPLACEMENT = 'tag_replacement' // RFID tag change
}

export interface MovementEvent {
  id: string
  cattleId: string
  tagNumber: string              // RFID tag (15 char)
  movementType: MovementType
  movementDate: string           // ISO 8601

  // Location details
  fromPremisesId?: string        // CLPS Premises ID (PID)
  fromPenId?: string             // Internal pen (on-farm only)
  toPremisesId?: string          // Destination PID
  toPenId?: string               // Destination pen (on-farm only)

  // CCIA reporting
  reportedToCCIA: boolean
  cciaSubmissionId?: string      // Confirmation code from CLPS
  cciaSubmittedAt?: string
  cciaStatus: 'pending' | 'submitted' | 'confirmed' | 'failed'

  // Additional data
  transporterName?: string
  vehiclePlateNumber?: string
  manifestNumber?: string
  weightAtMovement?: number
  headCount: number              // For batch movements

  // Audit trail
  performedBy: string            // User ID/name
  createdAt: string
  updatedAt: string
  notes?: string
}
```

#### Tag Management
```typescript
export interface RFIDTag {
  tagNumber: string              // 15-char CCIA format
  cattleId?: string              // Linked cattle record
  status: 'active' | 'inactive' | 'lost' | 'damaged' | 'replaced'
  activationDate: string
  replacementTagNumber?: string  // If replaced

  // CCIA metadata
  cciaVerified: boolean
  cciaLastChecked: string
  manufacturerCode: string       // First 3 digits

  createdAt: string
  updatedAt: string
}

export interface PremisesInfo {
  pid: string                    // Premises ID (e.g., AB123456)
  name: string
  type: 'farm' | 'feedlot' | 'auction' | 'processor' | 'export'
  address: string
  province: string
  ownerName: string
  phoneNumber?: string

  // For user's own farm
  isOwnFarm: boolean

  verifiedWithCCIA: boolean
  createdAt: string
  updatedAt: string
}
```

### 2. CLPS API Integration

#### API Service Layer
```typescript
// /lib/ccia/clps-api-client.ts

interface CLPSConfig {
  apiKey: string                 // Government-issued API key
  environment: 'production' | 'sandbox'
  farmPremisesId: string         // User's PID
  timeout: number
}

interface CLPSMovementPayload {
  animalId: string               // RFID tag number
  movementType: string
  movementDate: string           // YYYY-MM-DD
  originPremises: string
  destinationPremises: string
  transporterName?: string
  vehicleId?: string
}

interface CLPSResponse {
  success: boolean
  confirmationCode?: string
  errorCode?: string
  errorMessage?: string
  timestamp: string
}

class CLPSApiClient {
  private config: CLPSConfig

  constructor(config: CLPSConfig) {
    this.config = config
  }

  /**
   * Submit movement event to CLPS
   */
  async submitMovement(event: MovementEvent): Promise<CLPSResponse> {
    const endpoint = this.getEndpoint('/movements/submit')

    const payload: CLPSMovementPayload = {
      animalId: event.tagNumber,
      movementType: this.mapMovementType(event.movementType),
      movementDate: event.movementDate.split('T')[0],
      originPremises: event.fromPremisesId || this.config.farmPremisesId,
      destinationPremises: event.toPremisesId!,
      transporterName: event.transporterName,
      vehicleId: event.vehiclePlateNumber
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Premises-ID': this.config.farmPremisesId
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.config.timeout)
      })

      if (!response.ok) {
        throw new Error(`CLPS API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('CLPS submission failed:', error)
      throw error
    }
  }

  /**
   * Validate RFID tag with CCIA database
   */
  async validateTag(tagNumber: string): Promise<{
    valid: boolean
    status: string
    manufacturer?: string
    activationDate?: string
  }> {
    const endpoint = this.getEndpoint(`/tags/${tagNumber}/validate`)

    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`
      }
    })

    return await response.json()
  }

  /**
   * Verify premises ID exists
   */
  async verifyPremises(premisesId: string): Promise<{
    valid: boolean
    name?: string
    type?: string
    province?: string
  }> {
    const endpoint = this.getEndpoint(`/premises/${premisesId}`)

    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`
      }
    })

    return await response.json()
  }

  /**
   * Batch submit for multiple movements (slaughter groups)
   */
  async submitBatchMovement(events: MovementEvent[]): Promise<{
    success: boolean
    confirmationCodes: string[]
    failed: Array<{ tagNumber: string; error: string }>
  }> {
    const endpoint = this.getEndpoint('/movements/batch')

    const payloads = events.map(e => ({
      animalId: e.tagNumber,
      movementType: this.mapMovementType(e.movementType),
      movementDate: e.movementDate.split('T')[0],
      originPremises: e.fromPremisesId || this.config.farmPremisesId,
      destinationPremises: e.toPremisesId!
    }))

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({ movements: payloads })
    })

    return await response.json()
  }

  private getEndpoint(path: string): string {
    const baseUrl = this.config.environment === 'production'
      ? 'https://api.canadaid.ca/clps/v1'
      : 'https://sandbox-api.canadaid.ca/clps/v1'
    return `${baseUrl}${path}`
  }

  private mapMovementType(type: MovementType): string {
    const mapping: Record<MovementType, string> = {
      [MovementType.ARRIVAL]: 'ARRIVAL',
      [MovementType.OFF_FARM_SALE]: 'SALE',
      [MovementType.OFF_FARM_SLAUGHTER]: 'SLAUGHTER',
      [MovementType.OFF_FARM_AUCTION]: 'AUCTION',
      [MovementType.DEATH]: 'DEATH',
      [MovementType.EXPORT]: 'EXPORT',
      [MovementType.TAG_REPLACEMENT]: 'TAG_CHANGE',
      [MovementType.ON_FARM]: 'ON_FARM' // Not submitted to CLPS
    }
    return mapping[type]
  }
}

export const clpsClient = new CLPSApiClient({
  apiKey: process.env.NEXT_PUBLIC_CLPS_API_KEY!,
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  farmPremisesId: process.env.NEXT_PUBLIC_FARM_PREMISES_ID!,
  timeout: 10000
})
```

### 3. Movement Service Layer

```typescript
// /lib/ccia/movement-service.ts

class MovementService {
  /**
   * Record movement event (handles both on-farm and off-farm)
   */
  async recordMovement(params: {
    cattleId: string
    movementType: MovementType
    movementDate: string
    fromLocation?: { premisesId?: string, penId?: string }
    toLocation?: { premisesId?: string, penId?: string }
    transporterName?: string
    vehiclePlateNumber?: string
    manifestNumber?: string
    notes?: string
    performedBy: string
  }): Promise<MovementEvent> {

    // 1. Validate cattle exists and get tag number
    const cattle = await cattleStore.getCattle(params.cattleId)
    if (!cattle?.tagNumber) {
      throw new Error('Cattle must have RFID tag for movement tracking')
    }

    // 2. Create movement event
    const event: MovementEvent = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      cattleId: params.cattleId,
      tagNumber: cattle.tagNumber,
      movementType: params.movementType,
      movementDate: params.movementDate,
      fromPremisesId: params.fromLocation?.premisesId,
      fromPenId: params.fromLocation?.penId,
      toPremisesId: params.toLocation?.premisesId,
      toPenId: params.toLocation?.penId,
      transporterName: params.transporterName,
      vehiclePlateNumber: params.vehiclePlateNumber,
      manifestNumber: params.manifestNumber,
      reportedToCCIA: false,
      cciaStatus: 'pending',
      headCount: 1,
      performedBy: params.performedBy,
      notes: params.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // 3. If on-farm movement, no CCIA reporting needed
    if (params.movementType === MovementType.ON_FARM) {
      event.reportedToCCIA = true
      event.cciaStatus = 'confirmed'

      // Update cattle pen assignment
      if (params.toLocation?.penId) {
        await cattleStore.updateCattle(params.cattleId, {
          penId: params.toLocation.penId
        })
      }

      // Save event
      await this.saveMovementEvent(event)
      return event
    }

    // 4. For off-farm movements, submit to CLPS
    if (this.requiresCCIAReporting(params.movementType)) {
      try {
        const result = await clpsClient.submitMovement(event)

        if (result.success) {
          event.reportedToCCIA = true
          event.cciaSubmissionId = result.confirmationCode
          event.cciaSubmittedAt = new Date().toISOString()
          event.cciaStatus = 'confirmed'
        } else {
          // Failed but queued for retry
          event.cciaStatus = 'failed'
          await this.queueForRetry(event, result.errorMessage)
        }
      } catch (error) {
        // Network error - queue for later submission
        event.cciaStatus = 'pending'
        await this.queueForRetry(event, 'Network error, queued for retry')
      }
    }

    // 5. Update cattle status based on movement type
    if (params.movementType === MovementType.OFF_FARM_SALE ||
        params.movementType === MovementType.OFF_FARM_SLAUGHTER ||
        params.movementType === MovementType.OFF_FARM_AUCTION) {
      await cattleStore.updateCattle(params.cattleId, {
        status: 'sold',
        soldDate: params.movementDate,
        archived: true
      })
    }

    if (params.movementType === MovementType.DEATH) {
      await cattleStore.updateCattle(params.cattleId, {
        status: 'deceased',
        deathDate: params.movementDate,
        archived: true
      })
    }

    // 6. Save movement event
    await this.saveMovementEvent(event)

    return event
  }

  /**
   * Batch movement for slaughter groups
   */
  async recordBatchMovement(params: {
    cattleIds: string[]
    movementType: MovementType
    movementDate: string
    toPremisesId: string
    transporterName?: string
    vehiclePlateNumber?: string
    manifestNumber?: string
    performedBy: string
  }): Promise<{
    events: MovementEvent[]
    cciaConfirmations: string[]
    failed: Array<{ cattleId: string; error: string }>
  }> {

    const events: MovementEvent[] = []
    const failed: Array<{ cattleId: string; error: string }> = []

    // 1. Create movement events for all cattle
    for (const cattleId of params.cattleIds) {
      try {
        const cattle = await cattleStore.getCattle(cattleId)
        if (!cattle?.tagNumber) {
          failed.push({ cattleId, error: 'No RFID tag' })
          continue
        }

        const event: MovementEvent = {
          id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          cattleId,
          tagNumber: cattle.tagNumber,
          movementType: params.movementType,
          movementDate: params.movementDate,
          toPremisesId: params.toPremisesId,
          transporterName: params.transporterName,
          vehiclePlateNumber: params.vehiclePlateNumber,
          manifestNumber: params.manifestNumber,
          reportedToCCIA: false,
          cciaStatus: 'pending',
          headCount: params.cattleIds.length,
          performedBy: params.performedBy,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        events.push(event)
      } catch (error) {
        failed.push({ cattleId, error: (error as Error).message })
      }
    }

    // 2. Submit batch to CLPS
    let confirmations: string[] = []

    if (events.length > 0 && this.requiresCCIAReporting(params.movementType)) {
      try {
        const result = await clpsClient.submitBatchMovement(events)
        confirmations = result.confirmationCodes

        // Update events with confirmation codes
        events.forEach((event, index) => {
          event.reportedToCCIA = true
          event.cciaSubmissionId = confirmations[index]
          event.cciaSubmittedAt = new Date().toISOString()
          event.cciaStatus = 'confirmed'
        })

        // Add CLPS failures to our failed list
        failed.push(...result.failed.map(f => ({
          cattleId: events.find(e => e.tagNumber === f.tagNumber)?.cattleId || '',
          error: f.error
        })))

      } catch (error) {
        // Network error - queue all for retry
        events.forEach(event => {
          event.cciaStatus = 'pending'
          this.queueForRetry(event, 'Network error, queued for retry')
        })
      }
    }

    // 3. Update all cattle statuses
    for (const event of events) {
      await cattleStore.updateCattle(event.cattleId, {
        status: 'sold',
        soldDate: params.movementDate,
        archived: true
      })
    }

    // 4. Save all movement events
    for (const event of events) {
      await this.saveMovementEvent(event)
    }

    return { events, cciaConfirmations: confirmations, failed }
  }

  /**
   * Retry failed CCIA submissions
   */
  async retryPendingSubmissions(): Promise<{
    successful: number
    failed: number
  }> {
    const pending = await this.getPendingMovements()
    let successful = 0
    let failed = 0

    for (const event of pending) {
      try {
        const result = await clpsClient.submitMovement(event)

        if (result.success) {
          event.reportedToCCIA = true
          event.cciaSubmissionId = result.confirmationCode
          event.cciaSubmittedAt = new Date().toISOString()
          event.cciaStatus = 'confirmed'
          await this.updateMovementEvent(event)
          successful++
        } else {
          failed++
        }
      } catch (error) {
        failed++
      }
    }

    return { successful, failed }
  }

  private requiresCCIAReporting(movementType: MovementType): boolean {
    return [
      MovementType.ARRIVAL,
      MovementType.OFF_FARM_SALE,
      MovementType.OFF_FARM_SLAUGHTER,
      MovementType.OFF_FARM_AUCTION,
      MovementType.DEATH,
      MovementType.EXPORT,
      MovementType.TAG_REPLACEMENT
    ].includes(movementType)
  }

  private async saveMovementEvent(event: MovementEvent): Promise<void> {
    // Save to Supabase
    const { error } = await supabase
      .from('movement_events')
      .insert(event)

    if (error) throw error
  }

  private async updateMovementEvent(event: MovementEvent): Promise<void> {
    const { error } = await supabase
      .from('movement_events')
      .update(event)
      .eq('id', event.id)

    if (error) throw error
  }

  private async getPendingMovements(): Promise<MovementEvent[]> {
    const { data, error } = await supabase
      .from('movement_events')
      .select('*')
      .eq('cciaStatus', 'pending')
      .order('createdAt', { ascending: true })

    if (error) throw error
    return data || []
  }

  private async queueForRetry(event: MovementEvent, reason: string): Promise<void> {
    console.log(`Queued for CCIA retry: ${event.tagNumber} - ${reason}`)
    // Event already saved with cciaStatus: 'pending'
    // Background job will retry later
  }
}

export const movementService = new MovementService()
```

### 4. UI Components

#### Movement Recording Dialog
```typescript
// /components/record-movement-dialog.tsx

interface RecordMovementDialogProps {
  cattle: Cattle
  open: boolean
  onClose: () => void
  defaultMovementType?: MovementType
}

export function RecordMovementDialog({ cattle, open, onClose, defaultMovementType }: RecordMovementDialogProps) {
  const [movementType, setMovementType] = useState<MovementType>(defaultMovementType || MovementType.ON_FARM)
  const [movementDate, setMovementDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [destinationPremisesId, setDestinationPremisesId] = useState<string>('')
  const [destinationPenId, setDestinationPenId] = useState<string>('')
  const [transporterName, setTransporterName] = useState<string>('')
  const [vehiclePlate, setVehiclePlate] = useState<string>('')
  const [manifestNumber, setManifestNumber] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [premisesValid, setPremisesValid] = useState<boolean | null>(null)

  // Validate premises ID when user types
  const handlePremisesChange = async (value: string) => {
    setDestinationPremisesId(value)

    if (value.length === 8) { // AB123456 format
      try {
        const result = await clpsClient.verifyPremises(value)
        setPremisesValid(result.valid)
      } catch {
        setPremisesValid(false)
      }
    } else {
      setPremisesValid(null)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)

    try {
      const result = await movementService.recordMovement({
        cattleId: cattle.id,
        movementType,
        movementDate,
        fromLocation: {
          penId: cattle.penId
        },
        toLocation: {
          premisesId: movementType !== MovementType.ON_FARM ? destinationPremisesId : undefined,
          penId: movementType === MovementType.ON_FARM ? destinationPenId : undefined
        },
        transporterName,
        vehiclePlateNumber: vehiclePlate,
        manifestNumber,
        notes,
        performedBy: 'current-user-id' // From auth context
      })

      if (result.cciaStatus === 'confirmed') {
        toast.success(`Movement recorded and submitted to CCIA. Confirmation: ${result.cciaSubmissionId}`)
      } else if (result.cciaStatus === 'pending') {
        toast.warning('Movement recorded. Will submit to CCIA when online.')
      } else {
        toast.error('Movement recorded but CCIA submission failed. Queued for retry.')
      }

      onClose()
    } catch (error) {
      toast.error(`Failed to record movement: ${(error as Error).message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Record Movement - Tag {cattle.tagNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Movement Type */}
          <div>
            <Label>Movement Type</Label>
            <Select value={movementType} onValueChange={(v) => setMovementType(v as MovementType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={MovementType.ON_FARM}>On-Farm (Pen to Pen)</SelectItem>
                <SelectItem value={MovementType.OFF_FARM_SALE}>Sale to Another Farm</SelectItem>
                <SelectItem value={MovementType.OFF_FARM_SLAUGHTER}>To Slaughter Plant</SelectItem>
                <SelectItem value={MovementType.OFF_FARM_AUCTION}>To Auction</SelectItem>
                <SelectItem value={MovementType.DEATH}>Death/Mortality</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Movement Date */}
          <div>
            <Label>Movement Date</Label>
            <Input
              type="date"
              value={movementDate}
              onChange={(e) => setMovementDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Destination (On-Farm) */}
          {movementType === MovementType.ON_FARM && (
            <div>
              <Label>Destination Pen</Label>
              <Select value={destinationPenId} onValueChange={setDestinationPenId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pen" />
                </SelectTrigger>
                <SelectContent>
                  {/* Populate from pen list */}
                  <SelectItem value="pen-1">Pen 1</SelectItem>
                  <SelectItem value="pen-2">Pen 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Destination (Off-Farm) */}
          {movementType !== MovementType.ON_FARM && movementType !== MovementType.DEATH && (
            <>
              <div>
                <Label>Destination Premises ID (PID)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="AB123456"
                    value={destinationPremisesId}
                    onChange={(e) => handlePremisesChange(e.target.value)}
                    maxLength={8}
                    className={premisesValid === false ? 'border-red-500' : ''}
                  />
                  {premisesValid === true && <CheckCircle2 className="text-green-500" />}
                  {premisesValid === false && <XCircle className="text-red-500" />}
                </div>
                {premisesValid === false && (
                  <p className="text-sm text-red-500 mt-1">Invalid Premises ID</p>
                )}
              </div>

              <div>
                <Label>Transporter Name (Optional)</Label>
                <Input
                  value={transporterName}
                  onChange={(e) => setTransporterName(e.target.value)}
                  placeholder="Smith Trucking"
                />
              </div>

              <div>
                <Label>Vehicle Plate (Optional)</Label>
                <Input
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  placeholder="ABC 123"
                />
              </div>

              <div>
                <Label>Manifest Number (Optional)</Label>
                <Input
                  value={manifestNumber}
                  onChange={(e) => setManifestNumber(e.target.value)}
                  placeholder="MN-2025-001"
                />
              </div>
            </>
          )}

          {/* Notes */}
          <div>
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
              rows={3}
            />
          </div>

          {/* CCIA Warning */}
          {movementType !== MovementType.ON_FARM && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>CCIA Reporting Required</AlertTitle>
              <AlertDescription>
                This movement will be automatically submitted to CCIA/CLPS within 7 days as required by Canadian law.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || (movementType !== MovementType.ON_FARM && !premisesValid)}
          >
            {submitting ? 'Recording...' : 'Record Movement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

#### CCIA Compliance Dashboard
```typescript
// /app/compliance/page.tsx

export default function CompliancePage() {
  const [movements, setMovements] = useState<MovementEvent[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)

  useEffect(() => {
    loadMovements()
  }, [])

  const loadMovements = async () => {
    // Load recent movements from database
    // Calculate pending/failed counts
  }

  const handleRetryFailed = async () => {
    const result = await movementService.retryPendingSubmissions()
    toast.success(`${result.successful} movements submitted, ${result.failed} failed`)
    loadMovements()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">CCIA Compliance</h1>
        <Button onClick={handleRetryFailed} disabled={pendingCount === 0}>
          Retry Pending ({pendingCount})
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Pending Submission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
            <p className="text-sm text-muted-foreground">
              Queued for CCIA reporting
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Failed Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{failedCount}</p>
            <p className="text-sm text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {pendingCount + failedCount === 0 ? '✓ Compliant' : '⚠ Action Required'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Movements</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Tag Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>CCIA Status</TableHead>
                <TableHead>Confirmation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map(movement => (
                <TableRow key={movement.id}>
                  <TableCell>{new Date(movement.movementDate).toLocaleDateString()}</TableCell>
                  <TableCell className="font-mono">{movement.tagNumber}</TableCell>
                  <TableCell>{movement.movementType}</TableCell>
                  <TableCell>{movement.toPremisesId || movement.toPenId || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={
                      movement.cciaStatus === 'confirmed' ? 'default' :
                      movement.cciaStatus === 'pending' ? 'warning' :
                      'destructive'
                    }>
                      {movement.cciaStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {movement.cciaSubmissionId || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
```

## Database Schema

### Supabase Tables

```sql
-- Movement events table
CREATE TABLE movement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  cattle_id UUID NOT NULL REFERENCES cattle(id),
  tag_number TEXT NOT NULL,
  movement_type TEXT NOT NULL,
  movement_date DATE NOT NULL,

  from_premises_id TEXT,
  from_pen_id UUID REFERENCES pens(id),
  to_premises_id TEXT,
  to_pen_id UUID REFERENCES pens(id),

  reported_to_ccia BOOLEAN DEFAULT FALSE,
  ccia_submission_id TEXT,
  ccia_submitted_at TIMESTAMP WITH TIME ZONE,
  ccia_status TEXT DEFAULT 'pending',

  transporter_name TEXT,
  vehicle_plate_number TEXT,
  manifest_number TEXT,
  weight_at_movement DECIMAL(10,2),
  head_count INTEGER DEFAULT 1,

  performed_by TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CHECK (movement_type IN ('arrival', 'on_farm', 'off_farm_sale', 'off_farm_slaughter', 'off_farm_auction', 'death', 'export', 'tag_replacement')),
  CHECK (ccia_status IN ('pending', 'submitted', 'confirmed', 'failed'))
);

-- RFID tag management
CREATE TABLE rfid_tags (
  tag_number TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  cattle_id UUID REFERENCES cattle(id),
  status TEXT DEFAULT 'active',
  activation_date DATE NOT NULL,
  replacement_tag_number TEXT REFERENCES rfid_tags(tag_number),

  ccia_verified BOOLEAN DEFAULT FALSE,
  ccia_last_checked TIMESTAMP WITH TIME ZONE,
  manufacturer_code TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CHECK (status IN ('active', 'inactive', 'lost', 'damaged', 'replaced')),
  CHECK (length(tag_number) = 15),
  CHECK (tag_number ~ '^CA[0-9]{13}$') -- Canadian format
);

-- Premises directory
CREATE TABLE premises (
  pid TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  address TEXT,
  province TEXT NOT NULL,
  owner_name TEXT,
  phone_number TEXT,

  is_own_farm BOOLEAN DEFAULT FALSE,
  verified_with_ccia BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CHECK (type IN ('farm', 'feedlot', 'auction', 'processor', 'export')),
  CHECK (length(pid) = 8),
  CHECK (pid ~ '^[A-Z]{2}[0-9]{6}$') -- AB123456 format
);

-- Indexes for performance
CREATE INDEX idx_movements_cattle ON movement_events(cattle_id);
CREATE INDEX idx_movements_date ON movement_events(movement_date DESC);
CREATE INDEX idx_movements_ccia_status ON movement_events(ccia_status) WHERE ccia_status IN ('pending', 'failed');
CREATE INDEX idx_movements_user ON movement_events(user_id);
CREATE INDEX idx_tags_cattle ON rfid_tags(cattle_id);
CREATE INDEX idx_tags_status ON rfid_tags(status);

-- Row Level Security
ALTER TABLE movement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfid_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE premises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own movements" ON movement_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own movements" ON movement_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own movements" ON movement_events FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tags" ON rfid_tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own tags" ON rfid_tags FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own premises" ON premises FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own premises" ON premises FOR ALL USING (auth.uid() = user_id);
```

## Implementation Timeline

### Phase 1: Foundation (Week 1-2)
- [ ] Create database tables (movement_events, rfid_tags, premises)
- [ ] Implement basic MovementService
- [ ] Build RecordMovementDialog component
- [ ] Test on-farm movements (no CCIA integration yet)

### Phase 2: CLPS Integration (Week 3)
- [ ] Implement CLPSApiClient
- [ ] Set up sandbox API credentials
- [ ] Test tag validation endpoint
- [ ] Test premises verification endpoint
- [ ] Test single movement submission

### Phase 3: Offline Queue (Week 4)
- [ ] Implement pending movement queue
- [ ] Add background retry logic
- [ ] Add offline detection
- [ ] Test offline → online sync workflow

### Phase 4: Batch Operations (Week 5)
- [ ] Implement batch movement submission
- [ ] Build bulk movement UI for slaughter groups
- [ ] Test with 100+ animal batches

### Phase 5: Compliance Dashboard (Week 6)
- [ ] Build compliance status dashboard
- [ ] Add failed submission alerts
- [ ] Implement manual retry functionality
- [ ] Generate CCIA compliance reports

### Phase 6: Production & Testing (Week 7-8)
- [ ] Switch to production CLPS API
- [ ] Comprehensive testing with real movements
- [ ] User acceptance testing
- [ ] Documentation and training materials

## Security & Privacy

### API Key Management
- CLPS API keys stored in environment variables
- Never exposed to client-side code
- Separate keys for sandbox and production

### Data Encryption
- All API communication over HTTPS
- Premises IDs and tag numbers encrypted at rest
- Audit logs for all CCIA submissions

### Regulatory Compliance
- 7-day reporting window enforced
- Automatic retry for failed submissions
- Complete audit trail for government inspections
- Data retention per CCIA requirements (minimum 5 years)

## Cost Estimation

### CLPS API Costs
- **API Access**: Free for registered Canadian farms
- **Bandwidth**: Negligible (< 1KB per movement event)
- **Zero per-transaction fees**

### Infrastructure Costs
- **Storage**: ~10KB per movement event × 1,000 movements/year = 10MB/year
- **Supabase**: Free tier sufficient for most farms
- **Background Jobs**: Minimal compute for retry queue

**Total Additional Cost**: $0/month (CLPS API is government-provided free service)

## Success Metrics

### Compliance Targets
- 100% of off-farm movements reported to CCIA within 7 days
- <1% failed submissions requiring manual intervention
- Zero compliance violations or fines

### User Experience
- Movement recording takes <30 seconds
- Instant confirmation for online submissions
- Transparent offline queue status

### System Reliability
- 99.9% uptime for movement recording
- Automatic retry succeeds on first attempt 95% of time
- Complete audit trail for 100% of movements

## Next Steps

1. **This Week**: Set up CLPS sandbox account and test API access
2. **Week 1-2**: Build database schema and basic movement service
3. **Week 3**: Integrate CLPS API for tag validation
4. **Week 4**: Implement offline queue and retry logic
5. **Month 2**: Full production deployment with user training

---

**This CCIA compliance module ensures farmers meet all Canadian regulatory requirements while providing a seamless, automated experience that integrates directly into their daily workflow.**

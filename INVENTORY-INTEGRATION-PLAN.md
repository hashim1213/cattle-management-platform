# Integrated Inventory Management Plan (INV-001/004)

## Core Principle
**All health treatments and feed allocations MUST automatically deduct from inventory.**
No manual inventory updates. System enforces "use = deduct" logic at the database level.

## Current State Analysis

### What's Working
✅ Feed inventory tracked in `/lib/enhanced-feed-store.ts`
✅ Drug/medical inventory tracked in `/lib/data-store.ts`
✅ Health records created in `/lib/health-records.ts`
✅ Feed allocation tracking exists

### What's Missing
❌ No automatic inventory deduction on health treatments
❌ No inventory validation before treatments
❌ Feed allocations don't update inventory
❌ No low-stock warnings
❌ No inventory transaction history
❌ Manual inventory adjustments bypass audit trail

## Architecture

### 1. Unified Inventory Module

```typescript
// /lib/inventory-manager.ts

export enum InventoryCategory {
  DRUG = 'drug',
  VACCINE = 'vaccine',
  FEED = 'feed',
  SUPPLEMENT = 'supplement',
  MINERAL = 'mineral',
  EQUIPMENT = 'equipment',
  SUPPLIES = 'supplies'
}

export interface InventoryItem {
  id: string
  name: string
  category: InventoryCategory
  subcategory?: string

  // Stock tracking
  quantityOnHand: number
  unit: string
  reorderPoint: number
  reorderQuantity: number
  lotNumber?: string
  expirationDate?: string

  // Cost tracking
  costPerUnit: number
  lastPurchasePrice: number
  lastPurchaseDate: string
  supplier?: string

  // Drug-specific
  withdrawalPeriod?: number // days
  dosagePerUnit?: number
  activeIngredient?: string

  // Feed-specific
  moistureContent?: number
  proteinContent?: number
  energyContent?: number // TDN or ME

  // Location
  storageLocation: string
  binNumber?: string

  // Metadata
  createdAt: string
  updatedAt: string
  userId: string
}

export interface InventoryTransaction {
  id: string
  itemId: string
  itemName: string
  type: 'purchase' | 'usage' | 'adjustment' | 'waste' | 'return'

  // Quantities
  quantityBefore: number
  quantityChange: number
  quantityAfter: number
  unit: string

  // Associated records
  healthRecordId?: string
  feedAllocationId?: string
  cattleId?: string
  penId?: string

  // Details
  reason: string
  notes?: string
  performedBy: string
  timestamp: string
}
```

### 2. Inventory Service Layer

```typescript
// /lib/services/inventory-service.ts

class InventoryService {
  /**
   * Check if sufficient inventory exists for an operation
   */
  async checkAvailability(
    itemId: string,
    requiredQuantity: number
  ): Promise<{ available: boolean; currentQuantity: number; shortfall?: number }> {
    const item = await this.getItem(itemId)

    if (!item) {
      return { available: false, currentQuantity: 0, shortfall: requiredQuantity }
    }

    const available = item.quantityOnHand >= requiredQuantity
    const shortfall = available ? 0 : requiredQuantity - item.quantityOnHand

    return {
      available,
      currentQuantity: item.quantityOnHand,
      shortfall
    }
  }

  /**
   * Deduct inventory with transaction logging
   * ATOMIC operation - either succeeds completely or rolls back
   */
  async deduct(params: {
    itemId: string
    quantity: number
    reason: string
    associatedRecordId?: string
    associatedRecordType?: 'health' | 'feed' | 'other'
    performedBy: string
  }): Promise<InventoryTransaction> {
    // 1. Start transaction
    const transaction = await db.transaction()

    try {
      // 2. Lock inventory item row
      const item = await transaction.lockItem(params.itemId)

      // 3. Verify sufficient quantity
      if (item.quantityOnHand < params.quantity) {
        throw new InsufficientInventoryError(
          `Insufficient ${item.name}. Need ${params.quantity}${item.unit}, have ${item.quantityOnHand}${item.unit}`
        )
      }

      // 4. Calculate new quantity
      const quantityBefore = item.quantityOnHand
      const quantityAfter = quantityBefore - params.quantity

      // 5. Update inventory
      await transaction.update('inventory', {
        id: params.itemId,
        quantityOnHand: quantityAfter,
        updatedAt: new Date().toISOString()
      })

      // 6. Create transaction log
      const txnLog = await transaction.insert('inventory_transactions', {
        itemId: params.itemId,
        itemName: item.name,
        type: 'usage',
        quantityBefore,
        quantityChange: -params.quantity,
        quantityAfter,
        unit: item.unit,
        reason: params.reason,
        performedBy: params.performedBy,
        timestamp: new Date().toISOString()
      })

      // 7. Check reorder point
      if (quantityAfter <= item.reorderPoint) {
        await this.createLowStockAlert(item, quantityAfter)
      }

      // 8. Commit transaction
      await transaction.commit()

      return txnLog

    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  /**
   * Add inventory (purchases, returns)
   */
  async add(params: {
    itemId: string
    quantity: number
    costPerUnit?: number
    lotNumber?: string
    expirationDate?: string
    supplier?: string
    reason: string
    performedBy: string
  }): Promise<InventoryTransaction> {
    // Similar atomic operation for additions
  }

  /**
   * Get current inventory status
   */
  async getInventoryStatus(): Promise<{
    totalItems: number
    lowStockItems: InventoryItem[]
    expiringSoonItems: InventoryItem[]
    totalValue: number
  }> {
    // Dashboard metrics
  }

  /**
   * Get usage history for analysis
   */
  async getUsageHistory(
    itemId: string,
    startDate: string,
    endDate: string
  ): Promise<InventoryTransaction[]> {
    // For forecasting and budgeting
  }
}
```

### 3. Integration with Health Module

```typescript
// /lib/services/health-service.ts

class HealthService {
  constructor(
    private inventoryService: InventoryService
  ) {}

  /**
   * Record health treatment with automatic inventory deduction
   */
  async recordTreatment(params: {
    cattleId: string
    drugId: string
    dosage: number
    unit: string
    route: string
    veterinarian?: string
    notes?: string
    performedBy: string
  }): Promise<{ healthRecord: HealthRecord; inventoryTransaction: InventoryTransaction }> {

    // 1. Verify cattle exists
    const cattle = await this.getCattle(params.cattleId)
    if (!cattle) throw new Error('Cattle not found')

    // 2. Verify drug exists and get details
    const drug = await this.inventoryService.getItem(params.drugId)
    if (!drug) throw new Error('Drug not found in inventory')

    // 3. Check inventory availability
    const availability = await this.inventoryService.checkAvailability(
      params.drugId,
      params.dosage
    )

    if (!availability.available) {
      throw new InsufficientInventoryError(
        `Insufficient ${drug.name}. ` +
        `Need ${params.dosage}${params.unit}, ` +
        `only ${availability.currentQuantity}${params.unit} available.` +
        `\n\nShortfall: ${availability.shortfall}${params.unit}`
      )
    }

    // 4. Create health record
    const healthRecord = await healthRecordManager.createHealthRecord(
      params.cattleId,
      cattle.tagNumber,
      'treatment',
      params.performedBy
    )

    // 5. Add treatment details
    healthRecordManager.addTreatment(
      healthRecord,
      drug.name,
      params.dosage,
      params.unit,
      params.route,
      params.veterinarian,
      drug.withdrawalPeriod || 0
    )

    // 6. Save health record
    await this.saveHealthRecord(healthRecord)

    // 7. Deduct from inventory (ATOMIC)
    const inventoryTxn = await this.inventoryService.deduct({
      itemId: params.drugId,
      quantity: params.dosage,
      reason: `Treatment for ${cattle.tagNumber}`,
      associatedRecordId: healthRecord.id,
      associatedRecordType: 'health',
      performedBy: params.performedBy
    })

    // 8. Return both records
    return {
      healthRecord,
      inventoryTransaction: inventoryTxn
    }
  }

  /**
   * Bulk treatment with batch inventory deduction
   */
  async bulkTreatment(params: {
    cattleIds: string[]
    drugId: string
    dosagePerHead: number
    unit: string
    route: string
    performedBy: string
  }): Promise<{
    healthRecords: HealthRecord[]
    inventoryTransaction: InventoryTransaction
    failed: Array<{ cattleId: string; error: string }>
  }> {

    const totalDosage = params.dosagePerHead * params.cattleIds.length

    // 1. Check total inventory requirement
    const availability = await this.inventoryService.checkAvailability(
      params.drugId,
      totalDosage
    )

    if (!availability.available) {
      throw new InsufficientInventoryError(
        `Insufficient inventory for bulk treatment. ` +
        `Need ${totalDosage}${params.unit} for ${params.cattleIds.length} animals, ` +
        `only ${availability.currentQuantity}${params.unit} available.`
      )
    }

    const transaction = await db.transaction()
    const healthRecords: HealthRecord[] = []
    const failed: Array<{ cattleId: string; error: string }> = []

    try {
      // 2. Create health records for all cattle
      for (const cattleId of params.cattleIds) {
        try {
          const cattle = await transaction.getCattle(cattleId)
          const record = await this.createTreatmentRecord(cattle, params)
          healthRecords.push(record)
        } catch (error) {
          failed.push({ cattleId, error: error.message })
        }
      }

      // 3. Deduct total inventory ONCE
      const inventoryTxn = await this.inventoryService.deduct({
        itemId: params.drugId,
        quantity: totalDosage,
        reason: `Bulk treatment for ${healthRecords.length} cattle`,
        performedBy: params.performedBy
      })

      await transaction.commit()

      return { healthRecords, inventoryTransaction: inventoryTxn, failed }

    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }
}
```

### 4. Integration with Feed Module

```typescript
// /lib/services/feed-service.ts

class FeedService {
  constructor(
    private inventoryService: InventoryService
  ) {}

  /**
   * Allocate feed to pen with automatic inventory deduction
   */
  async allocateFeed(params: {
    penId: string
    feedItems: Array<{
      feedId: string
      quantity: number
      unit: string
    }>
    deliveredBy: string
    notes?: string
  }): Promise<{
    allocation: FeedAllocation
    inventoryTransactions: InventoryTransaction[]
  }> {

    // 1. Verify pen exists
    const pen = await penStore.getPen(params.penId)
    if (!pen) throw new Error('Pen not found')

    // 2. Verify all feed items exist and check availability
    const availabilityChecks = await Promise.all(
      params.feedItems.map(item =>
        this.inventoryService.checkAvailability(item.feedId, item.quantity)
      )
    )

    const insufficient = availabilityChecks.filter(check => !check.available)
    if (insufficient.length > 0) {
      const errors = insufficient.map((check, idx) => {
        const item = params.feedItems[idx]
        return `- ${item.feedId}: need ${item.quantity}, have ${check.currentQuantity}`
      }).join('\n')

      throw new InsufficientInventoryError(
        `Insufficient feed inventory:\n${errors}`
      )
    }

    const transaction = await db.transaction()

    try {
      // 3. Create feed allocation record
      const allocation = await feedAllocationManager.createAllocation({
        penId: params.penId,
        penName: pen.name,
        date: new Date().toISOString(),
        feedItems: params.feedItems,
        deliveredBy: params.deliveredBy,
        notes: params.notes
      })

      // 4. Deduct each feed item from inventory
      const inventoryTxns = []
      for (const feedItem of params.feedItems) {
        const txn = await this.inventoryService.deduct({
          itemId: feedItem.feedId,
          quantity: feedItem.quantity,
          reason: `Feed allocation to ${pen.name}`,
          associatedRecordId: allocation.id,
          associatedRecordType: 'feed',
          performedBy: params.deliveredBy
        })
        inventoryTxns.push(txn)
      }

      await transaction.commit()

      return {
        allocation,
        inventoryTransactions: inventoryTxns
      }

    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }
}
```

## Database Schema Updates

### New Tables

```sql
-- Unified inventory table
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('drug', 'vaccine', 'feed', 'supplement', 'mineral', 'equipment', 'supplies')),
  subcategory TEXT,

  quantity_on_hand DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  reorder_point DECIMAL(10,2),
  reorder_quantity DECIMAL(10,2),

  cost_per_unit DECIMAL(10,2),
  last_purchase_price DECIMAL(10,2),
  last_purchase_date DATE,
  supplier TEXT,

  lot_number TEXT,
  expiration_date DATE,

  -- Drug-specific
  withdrawal_period INTEGER,
  dosage_per_unit DECIMAL(10,2),
  active_ingredient TEXT,

  -- Feed-specific
  moisture_content DECIMAL(5,2),
  protein_content DECIMAL(5,2),
  energy_content DECIMAL(10,2),

  storage_location TEXT,
  bin_number TEXT,
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT positive_quantity CHECK (quantity_on_hand >= 0)
);

-- Inventory transaction log (audit trail)
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  item_id UUID NOT NULL REFERENCES inventory(id),

  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'adjustment', 'waste', 'return')),

  quantity_before DECIMAL(10,2) NOT NULL,
  quantity_change DECIMAL(10,2) NOT NULL,
  quantity_after DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,

  -- Associated records
  health_record_id UUID REFERENCES health_records(id),
  feed_allocation_id UUID REFERENCES feed_allocations(id),
  cattle_id UUID REFERENCES cattle(id),
  pen_id UUID REFERENCES pens(id),

  reason TEXT NOT NULL,
  notes TEXT,
  performed_by TEXT NOT NULL,

  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_quantity_change CHECK (
    (transaction_type IN ('purchase', 'return') AND quantity_change > 0) OR
    (transaction_type IN ('usage', 'waste') AND quantity_change < 0) OR
    (transaction_type = 'adjustment')
  )
);

-- Low stock alerts
CREATE TABLE inventory_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  item_id UUID NOT NULL REFERENCES inventory(id),

  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'expiring_soon', 'expired')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),

  message TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_inventory_user ON inventory(user_id);
CREATE INDEX idx_inventory_category ON inventory(category);
CREATE INDEX idx_inventory_transactions_item ON inventory_transactions(item_id);
CREATE INDEX idx_inventory_transactions_timestamp ON inventory_transactions(timestamp DESC);
CREATE INDEX idx_inventory_alerts_unresolved ON inventory_alerts(user_id, resolved) WHERE resolved = FALSE;
```

## UI Components

### Inventory Status Dashboard
```typescript
// /components/inventory-dashboard.tsx

export function InventoryDashboard() {
  const { totalItems, lowStockItems, expiringSoon, totalValue } = useInventoryStatus()

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
      <Card>
        <CardHeader>Total Items</CardHeader>
        <CardContent>{totalItems}</CardContent>
      </Card>

      <Card className="border-yellow-500">
        <CardHeader>Low Stock Alerts</CardHeader>
        <CardContent>{lowStockItems.length}</CardContent>
      </Card>

      <Card className="border-orange-500">
        <CardHeader>Expiring Soon</CardHeader>
        <CardContent>{expiringSoon.length}</CardContent>
      </Card>

      <Card>
        <CardHeader>Total Value</CardHeader>
        <CardContent>${totalValue.toLocaleString()}</CardContent>
      </Card>
    </div>
  )
}
```

### Pre-Treatment Inventory Check
```typescript
// /components/treatment-dialog-with-inventory.tsx

export function TreatmentDialog({ cattleId }: { cattleId: string }) {
  const [selectedDrug, setSelectedDrug] = useState<string>('')
  const [dosage, setDosage] = useState<number>(0)

  const { data: availability } = useInventoryAvailability(selectedDrug, dosage)

  return (
    <Dialog>
      <DialogContent>
        <Label>Drug</Label>
        <Select value={selectedDrug} onValueChange={setSelectedDrug}>
          {drugs.map(drug => (
            <SelectItem key={drug.id} value={drug.id}>
              {drug.name} ({drug.quantityOnHand}{drug.unit} available)
            </SelectItem>
          ))}
        </Select>

        <Label>Dosage</Label>
        <Input
          type="number"
          value={dosage}
          onChange={(e) => setDosage(Number(e.target.value))}
        />

        {availability && !availability.available && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Insufficient Inventory</AlertTitle>
            <AlertDescription>
              Need {dosage}{availability.unit}, only {availability.currentQuantity}{availability.unit} available.
              Shortfall: {availability.shortfall}{availability.unit}
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleTreatment}
          disabled={!availability?.available}
        >
          Record Treatment & Deduct Inventory
        </Button>
      </DialogContent>
    </Dialog>
  )
}
```

## Implementation Phases

### Phase 1: Database & Core Service (Week 1)
- [ ] Create inventory and inventory_transactions tables
- [ ] Build InventoryService class
- [ ] Implement atomic deduct() and add() methods
- [ ] Add transaction logging
- [ ] Write unit tests

### Phase 2: Health Integration (Week 2)
- [ ] Update HealthService to use InventoryService
- [ ] Add inventory checks before treatments
- [ ] Implement automatic deductions
- [ ] Add error handling for insufficient inventory
- [ ] Update health dialogs with inventory warnings

### Phase 3: Feed Integration (Week 3)
- [ ] Update FeedService to use InventoryService
- [ ] Migrate existing feed inventory to unified system
- [ ] Add inventory checks before feed allocations
- [ ] Implement automatic deductions
- [ ] Update feed dialogs

### Phase 4: Alerts & Reporting (Week 4)
- [ ] Build low-stock alert system
- [ ] Create expiration date monitoring
- [ ] Build inventory dashboard
- [ ] Add usage reports and forecasting
- [ ] Implement reorder suggestions

### Phase 5: Bulk Operations (Week 5)
- [ ] Implement bulk treatment with batch deductions
- [ ] Add undo/adjustment capabilities
- [ ] Build inventory reconciliation tools
- [ ] Add physical count workflow
- [ ] Import/export for integration with accounting

## Success Criteria

### Functional Requirements
✅ 100% of health treatments deduct from inventory
✅ 100% of feed allocations deduct from inventory
✅ Zero manual inventory updates required
✅ Real-time low-stock alerts
✅ Complete audit trail for all inventory changes
✅ Prevent treatments when inventory insufficient

### Performance Requirements
✅ Inventory check: <100ms
✅ Deduction transaction: <500ms
✅ Bulk operation (100 animals): <5 seconds
✅ Dashboard load: <1 second

### Data Integrity
✅ Zero inventory deduction failures
✅ 100% transaction atomicity
✅ No negative inventory balances
✅ Complete traceability (every deduction linked to record)

---

**This integrated inventory system ensures 100% accuracy, eliminates manual tracking, and provides complete visibility into farm resource usage.**

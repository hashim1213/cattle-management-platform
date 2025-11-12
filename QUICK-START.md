# CattleOS Quick Start Guide

## 🚀 Get Production-Ready in 10 Minutes

### 1. Add Mobile Navigation (2 minutes)

Edit `/app/layout.tsx` - add these imports and components:

```typescript
import { MobileNav, QuickActions } from "@/components/mobile-nav"
import { OfflineIndicator } from "@/components/offline-indicator"

// Inside <body>:
<OfflineIndicator />
{children}
<MobileNav />
<QuickActions />
```

### 2. Initialize Offline Database (1 minute)

Add to `/app/page.tsx`:

```typescript
import { syncManager } from "@/lib/sync-manager"

useEffect(() => {
  syncManager.initializeFromLocalStorage()
}, [])
```

### 3. Replace Data Operations (5 minutes)

Replace all `localStorage` calls:

```typescript
// OLD:
localStorage.setItem('cattle', JSON.stringify(data))

// NEW:
import { syncManager } from "@/lib/sync-manager"
await syncManager.saveData('cattle', data, 'create')
```

### 4. Test It Works

```bash
npm run build
npm start
```

Open Chrome DevTools:
- Network tab > Offline
- Add a cattle record
- Go back Online
- Watch it sync automatically!

---

## 📚 Key Features

### Offline Storage
```typescript
import { syncManager } from "@/lib/sync-manager"

// Save (works offline)
await syncManager.saveData('cattle', cattleData, 'create')

// Read
const cattle = await syncManager.getData('cattle')
```

### Health Records
```typescript
import { healthRecordManager } from "@/lib/health-records"

let record = healthRecordManager.createHealthRecord(cattleId, tagNumber, 'antibiotic-treatment', 'John')
record = healthRecordManager.addAntibioticTreatment(
  record, 'Tylosin', 'Tylosin 200', '2', 'ml', 'IM', 'Once daily', '5 days', 28
)
await syncManager.saveData('healthRecords', record, 'create')
```

### Movement Tracking
```typescript
import { movementTracker } from "@/lib/movement-tracker"

const movement = movementTracker.recordMovement(
  cattleId, tagNumber, 'pen-transfer',
  { type: 'pen', id: 'pen-1', name: 'Pen 1' },
  { type: 'pen', id: 'pen-2', name: 'Pen 2' },
  'Sorted by weight'
)
await syncManager.saveData('movements', movement, 'create')
```

### Financial Analysis
```typescript
import { financialCalculator } from "@/lib/financial-calculator"

const analysis = financialCalculator.calculateBreakEven(
  costs, currentWeight, projectedWeight, marketPrice
)
console.log(analysis.breakEven.pricePerPound) // break-even price
console.log(analysis.recommendations) // AI-powered tips
```

---

## 🎯 Production Checklist

- [ ] Mobile nav added to layout
- [ ] Offline DB initialized
- [ ] localStorage replaced with syncManager
- [ ] Build succeeds (`npm run build`)
- [ ] Test offline mode in Chrome DevTools
- [ ] Test on real mobile device
- [ ] Verify sync works when going online

---

## 🆘 Common Issues

**Q: Sync not working?**
A: Call `syncManager.initializeFromLocalStorage()` on app load

**Q: Mobile nav not showing?**
A: Add `<MobileNav />` to root layout after {children}

**Q: IndexedDB errors?**
A: Clear browser cache, ensure not in incognito mode

---

## 📞 Help

See `PRODUCTION-READY-GUIDE.md` for detailed documentation.

All code is fully typed with TypeScript for IntelliSense support!

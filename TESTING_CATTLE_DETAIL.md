# Cattle Detail Page Testing Guide

This document outlines comprehensive test scenarios for the cattle detail page (`/cattle/[id]`) to verify all fixes are working correctly.

## Summary of Changes

### 1. Feed Data Loading
- **Fix**: Added proper error handling for feed data loading from Firebase
- **Fix**: Ensured feed data loads from `penActivityStore` (Firebase-backed)
- **Note**: Feed allocations from `feedService` use localStorage (legacy), pen-level feed activities use Firebase

### 2. Financial Calculations
- **Fix**: Separated individual feed/medication costs from veterinary costs
- **Fix**: Feed costs now include: pen-level feed activities + individual feed records
- **Fix**: Medication costs now include: pen-level medication activities + individual medication records
- **Fix**: Veterinary costs now ONLY include true health records (no [FEED] or [MEDICATION] markers)

### 3. Target Sale Price Removal
- **Fix**: Removed confusing "Target Sale Price" field from financial tab
- **Fix**: Removed "Projected Profit at Target" calculation

## Test Scenarios

### Test 1: Basic Data Loading
**Purpose**: Verify cattle data loads correctly from Firebase

**Steps**:
1. Navigate to `/cattle`
2. Click on any cattle to view detail page
3. Verify all tabs load without errors
4. Check browser console for any error messages

**Expected Results**:
- ✅ All cattle data displays correctly
- ✅ No console errors
- ✅ Page loads within 3 seconds

---

### Test 2: Feed Data - No Feed Records
**Purpose**: Verify correct message when no feed data exists

**Setup**:
1. Create a new cattle or use one with no feed records
2. Do NOT assign to a pen
3. Do NOT add individual feed records

**Steps**:
1. View cattle detail page
2. Navigate to "Feed" tab

**Expected Results**:
- ✅ Shows message: "No feed records yet."
- ✅ Shows helper text about adding individual records or assigning to pen

---

### Test 3: Feed Data - Individual Feed Records Only
**Purpose**: Verify individual feed records display correctly

**Steps**:
1. On cattle detail page, go to "Feed" tab
2. Click "Add Feed" button
3. Fill in:
   - Date: Today's date
   - Feed Type: "Hay"
   - Amount: 50
   - Unit: lbs
   - Cost: $25
   - Notes: "Test individual feed"
4. Click "Save Feed Record"
5. Refresh the page

**Expected Results**:
- ✅ Individual feed record appears under "Individual Records" section
- ✅ Shows feed type, amount, cost
- ✅ Notes display correctly with [FEED] marker
- ✅ Data persists after page refresh (stored in Firebase)

---

### Test 4: Feed Data - Pen-Level Feed Activities
**Purpose**: Verify pen-level feed activities display correctly

**Setup**:
1. Assign cattle to a pen with existing feed activities
2. Or add a pen-level feed activity through the pens page

**Steps**:
1. Navigate to `/pens`
2. Select a pen containing cattle
3. Add a feed activity (if needed)
4. Return to cattle detail page
5. Go to "Feed" tab

**Expected Results**:
- ✅ Pen-level feed activities appear under "Pen Allocations" section
- ✅ Shows per-head cost calculation
- ✅ Shows cattle's share of total feed
- ✅ Data persists after page refresh

---

### Test 5: Feed Data - Mixed Records
**Purpose**: Verify both individual and pen-level feed data display together

**Steps**:
1. Ensure cattle has both:
   - Individual feed records (from Test 3)
   - Pen-level feed activities (from Test 4)
2. View "Feed" tab

**Expected Results**:
- ✅ Shows "Individual Records" section with individual feed
- ✅ Shows "Pen Allocations" section with pen-level feed
- ✅ Both sections display correctly without confusion
- ✅ Clear visual distinction between the two types

---

### Test 6: Financial Calculations - Feed Costs
**Purpose**: Verify feed costs are calculated correctly

**Test Data**:
- Individual feed record: $25 (from Test 3)
- Pen-level feed activity: Assume $100 total for 4 cattle = $25 per head

**Steps**:
1. Go to "Financial" tab
2. Check "Feed Costs" line item

**Expected Results**:
- ✅ Feed Costs = $50 (Individual $25 + Pen-level $25)
- ✅ Cost matches sum of all feed records
- ✅ Updates when new feed records are added

---

### Test 7: Financial Calculations - Medication Costs
**Purpose**: Verify medication costs are calculated correctly

**Steps**:
1. On cattle detail page, go to "Medication" tab
2. Click "Add Medication"
3. Fill in:
   - Date: Today's date
   - Medication Name: "Ivermectin"
   - Dosage: 10
   - Unit: ml
   - Purpose: Treatment
   - Cost: $15
4. Save and go to "Financial" tab

**Expected Results**:
- ✅ Medication Costs = $15 (individual) + any pen-level costs
- ✅ Individual medication costs are included
- ✅ Pen-level medication costs are included (if applicable)

---

### Test 8: Financial Calculations - Veterinary Costs
**Purpose**: Verify only true veterinary costs are counted (no feed/medication)

**Steps**:
1. Go to "Health Records" tab
2. Add a true health record:
   - Type: Checkup
   - Description: "Annual checkup"
   - Cost: $75
   - Do NOT add [FEED] or [MEDICATION] in notes
3. Go to "Financial" tab

**Expected Results**:
- ✅ Veterinary Costs = $75
- ✅ Does NOT include individual feed costs (those should be in Feed Costs)
- ✅ Does NOT include individual medication costs (those should be in Medication Costs)

---

### Test 9: Financial Calculations - Total Investment
**Purpose**: Verify total investment calculation

**Test Data** (example):
- Purchase Price: $1,200
- Feed Costs: $50
- Medication Costs: $15
- Veterinary Costs: $75

**Steps**:
1. Go to "Financial" tab
2. Review "Total Investment" section

**Expected Results**:
- ✅ Total Variable Costs = $140 (Feed $50 + Medication $15 + Vet $75)
- ✅ Total Investment = $1,340 (Purchase $1,200 + Variable $140)
- ✅ Calculation is correct and updates in real-time

---

### Test 10: Financial Calculations - Current Profit/Loss
**Purpose**: Verify profit/loss calculation

**Test Data** (example):
- Current Value: $1,500 (based on weight × market price)
- Total Investment: $1,340

**Steps**:
1. Go to "Financial" tab
2. Review "Current Profit/Loss" section

**Expected Results**:
- ✅ Current Profit/Loss = $160 ($1,500 - $1,340)
- ✅ Shows in green if profitable
- ✅ Shows in red if losing money
- ✅ Updates when weight or costs change

---

### Test 11: Target Sale Price Removed
**Purpose**: Verify Target Sale Price field is no longer displayed

**Steps**:
1. Go to "Financial" tab
2. Review all sections

**Expected Results**:
- ✅ "Target Sale Price" field is NOT displayed
- ✅ "Projected Profit at Target" is NOT displayed
- ✅ Only shows: Purchase Price, Current Value, Total Gain
- ✅ Current Profit/Loss is still displayed (this is correct)

---

### Test 12: Data Persistence
**Purpose**: Verify all data persists correctly in Firebase

**Steps**:
1. Add various records:
   - Individual feed record
   - Individual medication record
   - Health record
   - Weight record
2. Close browser completely
3. Reopen and navigate to cattle detail page

**Expected Results**:
- ✅ All records are still present
- ✅ Financial calculations are still correct
- ✅ No data loss
- ✅ Data syncs across different sessions

---

### Test 13: Multiple Cattle Comparison
**Purpose**: Verify calculations work correctly for different cattle

**Steps**:
1. Create 3 different cattle with different scenarios:
   - Cattle A: Only individual feed/medication records
   - Cattle B: Only pen-level activities (assigned to pen)
   - Cattle C: Mixed (both individual and pen-level)
2. Compare financial calculations

**Expected Results**:
- ✅ Cattle A: Shows only individual costs
- ✅ Cattle B: Shows only pen-level costs (divided per head)
- ✅ Cattle C: Shows combined costs correctly
- ✅ Each cattle's costs are independent and accurate

---

### Test 14: Edge Cases

**Test 14a: No Purchase Price**
- Create cattle with no purchase price
- Verify financial tab doesn't crash
- ✅ Shows $0 for purchase price
- ✅ Profit/loss calculation still works

**Test 14b: No Weight**
- Create cattle with no weight
- ✅ Current value calculation handles gracefully
- ✅ No division by zero errors

**Test 14c: Unassigned Cattle**
- Create cattle not assigned to any pen
- ✅ Feed tab shows only individual records
- ✅ No pen-level data displayed
- ✅ No errors or crashes

**Test 14d: Large Numbers**
- Add many feed/medication records (20+)
- ✅ Page still loads quickly
- ✅ Calculations are correct
- ✅ UI doesn't break with scrolling

---

## Performance Tests

### Test 15: Load Time
**Steps**:
1. Clear browser cache
2. Navigate to cattle detail page
3. Measure load time

**Expected Results**:
- ✅ Initial load < 3 seconds
- ✅ Tab switching < 500ms
- ✅ No visible lag or freezing

---

### Test 16: Memory Leaks
**Steps**:
1. Open cattle detail page
2. Switch between tabs 20+ times
3. Add/remove records multiple times
4. Check browser memory usage

**Expected Results**:
- ✅ Memory usage stays reasonable
- ✅ No continuous memory growth
- ✅ Page remains responsive

---

## Regression Tests

### Test 17: Other Functionality Still Works
**Steps**:
1. Test all existing features:
   - Add weight record
   - Update current value
   - Assign to barn/pen
   - Edit cattle details
   - Add health records

**Expected Results**:
- ✅ All existing features work as before
- ✅ No functionality was broken by changes

---

## Summary Checklist

Before marking this as complete, verify:
- [ ] All 17 test scenarios pass
- [ ] Feed data loads from Firebase correctly
- [ ] Financial calculations are accurate
- [ ] Target Sale Price is removed
- [ ] No console errors
- [ ] Data persists correctly
- [ ] Performance is acceptable
- [ ] All edge cases handled gracefully

## Known Limitations

1. **feedService localStorage**: The detailed feed allocation system (from `feedService`) still uses localStorage and won't sync across devices. This is a known architectural issue that may need future refactoring to migrate to Firebase.

2. **Feed Data Sources**: The system has two sources for feed data:
   - Individual feed records (stored as health records with [FEED] marker)
   - Pen-level feed activities (stored in Firebase as penFeedActivities)

   Both are legitimate and serve different purposes.

## Next Steps for Full Testing

1. Run all 17 test scenarios manually
2. Test on different browsers (Chrome, Firefox, Safari)
3. Test on mobile devices
4. Test with real production data
5. Monitor for any error reports from users

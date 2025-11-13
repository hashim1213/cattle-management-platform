# Code Cleanup Recommendations

This document identifies potentially unnecessary or duplicate files in the codebase that could be cleaned up to reduce complexity and improve maintainability.

## Summary

Based on analysis of the codebase, there appear to be several duplicate stores, unused legacy components, and redundant service files. **Review each section carefully before deleting any files** to ensure they're not actively used.

---

## 1. Duplicate Store Files

### Potential Duplicates (Review Before Deleting):

- **`lib/batch-store.ts`** vs **`lib/batch-store-firebase.ts`**
  - Likely one is an old localStorage version and one is the Firebase version
  - Keep: `batch-store-firebase.ts` (Firebase version)
  - Check if `batch-store.ts` is still imported anywhere

- **`lib/ration-store.ts`** vs **`hooks/use-ration-store.ts`**
  - Check if both are needed or if one wraps the other
  - May be able to consolidate into single implementation

- **`lib/treatment-store.ts`** vs **`hooks/use-treatment-store.ts`**
  - Similar pattern - review if both are needed

- **`lib/enhanced-feed-store.ts`** vs **`hooks/use-enhanced-feed-store.ts`**
  - Review if enhanced version is actively used
  - May be old experimental code

### Action Items:
1. Search codebase for imports of each file
2. Determine which versions are actively used
3. Migrate any remaining usages to Firebase versions
4. Delete unused files

---

## 2. Potentially Unused Features

### Simulation and Task Tracking:

- **`hooks/use-simulation-store.ts`**
  - Is simulation feature actively used?
  - If not needed, can be removed

- **`hooks/use-task-store.ts`**
  - Check if task tracking is actively used
  - May be old feature that was replaced

- **`lib/time-tracking-store.ts`**
  - Verify if time tracking feature is needed
  - May be unused or incomplete feature

### Action Items:
1. Grep for usages across the codebase
2. If no imports found, safe to delete
3. Document any removed features for future reference

---

## 3. Duplicate Component Patterns

### Health/Treatment Components:

Based on the current analysis, the following components **ARE actively used** and should be kept:

- ✅ **`components/add-treatment-dialog.tsx`** - Individual treatment with inventory integration (KEEP)
- ✅ **`components/bulk-treatment-dialog.tsx`** - Bulk treatments with protocols (KEEP)
- ✅ **`components/pen-medication-dialog.tsx`** - Now updated with inventory integration (KEEP)

### Other Components to Review:

- **`components/individual-treatment-lookup.tsx`**
  - Check if this overlaps with add-treatment-dialog
  - May be a legacy component

- **`components/mortality-tracking-dialog.tsx`**
  - Verify if mortality tracking is actively used
  - Keep if it's a needed feature

- **`components/batch-details-dialog.tsx`**
  - Review if batch management is actively used

### Action Items:
1. Review each component's usage in the codebase
2. Check if features are accessible from UI
3. Consider consolidating similar components if possible

---

## 4. Service Layer Review

### Growth Tracking:

- **`lib/growth-tracking-service.ts`**
  - Verify this is being used
  - Check if it integrates with Firebase properly

### Health Services:

- **`lib/health/health-service.ts`** ✅ KEEP - Actively used
- **`lib/health/protocol-service.ts`** ✅ KEEP - Used by bulk treatments

### Inventory Services:

- **`lib/inventory/inventory-service-firebase.ts`** ✅ KEEP - Main inventory service
- **`lib/inventory/inventory-service.ts`** ⚠️ REVIEW - May be old localStorage version

### Action Items:
1. Check which service version is being imported
2. Ensure all features use Firebase services
3. Remove any localStorage-based services

---

## 5. Legacy Store Files

### Likely Legacy Files (Pre-Firebase):

The following files may be **old localStorage implementations** that were replaced by Firebase versions:

- `lib/batch-store.ts` (replaced by `batch-store-firebase.ts`)
- `lib/inventory/inventory-service.ts` (replaced by `inventory-service-firebase.ts`)
- `lib/ration-store.ts` (check if replaced)
- `lib/treatment-store.ts` (check if replaced)

### How to Verify:
```bash
# Search for imports of potentially legacy files
grep -r "from.*inventory-service'" . --exclude-dir=node_modules
grep -r "from.*batch-store'" . --exclude-dir=node_modules
grep -r "from.*ration-store'" . --exclude-dir=node_modules
```

### Action Items:
1. Run the grep commands above
2. If no imports found, file is safe to delete
3. If imports found, migrate them to Firebase version first

---

## 6. Hook Consolidation Opportunities

### Potential Consolidation:

Many store files have corresponding hook files. Consider if these can be simplified:

**Pattern:**
- `lib/[feature]-store-firebase.ts` - Data store logic
- `hooks/use-[feature]-store.ts` - React hook wrapper

**Review if this pattern is necessary for all features** or if some can be simplified.

---

## 7. Files That SHOULD BE KEPT

### Core Services (DO NOT DELETE):

✅ **Data Stores:**
- `lib/data-store-firebase.ts` - Cattle data with real-time updates
- `lib/pen-store-firebase.ts` - Pens and barns with real-time updates
- `lib/inventory/inventory-service-firebase.ts` - Inventory with real-time updates
- `lib/pen-activity-store.ts` - Pen feed and medication tracking (now with inventory integration)

✅ **Services:**
- `lib/health/health-service.ts` - Health record management
- `lib/health/protocol-service.ts` - Treatment protocols
- `lib/growth-tracking-service.ts` - Weight tracking (if actively used)

✅ **Hooks:**
- `hooks/use-pen-store.ts` - React wrapper for pen store
- `hooks/use-activity-store.ts` - Activity tracking
- `hooks/use-pen-activity.ts` - Pen-specific activities

✅ **Components:**
- `components/pen-medication-dialog.tsx` - Updated with inventory integration
- `components/add-treatment-dialog.tsx` - Individual treatments
- `components/bulk-treatment-dialog.tsx` - Bulk protocol treatments

---

## 8. Recommended Cleanup Process

### Step 1: Identify Unused Files
```bash
# Find files with no imports
for file in lib/*.ts lib/**/*.ts; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    imports=$(grep -r "from.*$filename" . --exclude-dir=node_modules --exclude-dir=.next | wc -l)
    if [ $imports -eq 0 ]; then
      echo "UNUSED: $file"
    fi
  fi
done
```

### Step 2: Create Backup Branch
```bash
git checkout -b backup/before-cleanup
git push origin backup/before-cleanup
```

### Step 3: Delete Files Gradually
1. Delete one file or group of related files
2. Run `npm run build` to check for errors
3. Run tests if available
4. Commit changes
5. Repeat for next file/group

### Step 4: Update Documentation
- Update README.md with current architecture
- Document which features are active
- Note any removed features for future reference

---

## 9. Immediate Actions (Safe to Review)

### Low-Risk Deletions (After Verification):

These are likely safe to delete if they have no imports:

1. **Simulation features** (if not used):
   - `hooks/use-simulation-store.ts`
   - Any simulation-related components

2. **Duplicate store files** (after verifying which version is used):
   - Older localStorage versions that have Firebase replacements

3. **Incomplete features** (if never completed):
   - `lib/time-tracking-store.ts` (if feature was abandoned)
   - Any experimental components that were never integrated

### Medium-Risk (Require Careful Review):

1. **Legacy service files**:
   - Verify which version (localStorage vs Firebase) is actively imported
   - Migrate any remaining usages before deleting

2. **Duplicate components**:
   - Components with similar names/purposes
   - May have subtle differences that are important

---

## 10. Architecture Recommendations

### Going Forward:

1. **Consolidate Store Pattern:**
   - Each feature should have ONE Firebase store file
   - ONE React hook wrapper if needed
   - Clear naming: `[feature]-store-firebase.ts` + `use-[feature].ts`

2. **Service Layer:**
   - All services should use Firebase
   - Remove any localStorage fallbacks
   - Ensure real-time listeners are used consistently

3. **Component Organization:**
   - One component per dialog/feature
   - Avoid duplicate components with similar purposes
   - Use composition for shared functionality

4. **Documentation:**
   - Keep this file updated as cleanup progresses
   - Document architectural decisions
   - Note why certain files were kept or removed

---

## Summary Statistics

- **Total TypeScript Files:** 165
- **Estimated Duplicates:** 8-12 files
- **Estimated Unused:** 5-10 files
- **Potential Cleanup:** 10-20% reduction in codebase

---

## Next Steps

1. ✅ Review this document thoroughly
2. ⏸️ Run grep commands to verify unused files
3. ⏸️ Create backup branch before deletions
4. ⏸️ Delete files gradually, testing after each deletion
5. ⏸️ Update documentation to reflect new architecture

---

**⚠️ WARNING:** Do not delete files without verifying they're unused! Always:
- Check for imports across the codebase
- Test the build after deletions
- Keep backups of deleted code
- Document what was removed and why

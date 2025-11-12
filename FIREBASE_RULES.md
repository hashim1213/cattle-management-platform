# Firebase Security Rules

This directory contains security rules for Firebase services.

## Files

- **firestore.rules** - Firestore database security rules
- **storage.rules** - Firebase Storage security rules
- **database.rules.json** - Realtime Database security rules (if using)

## Deploying Rules

### Using Firebase CLI

```bash
# Deploy all rules
firebase deploy --only firestore:rules,storage:rules

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Storage rules
firebase deploy --only storage:rules
```

### Manual Deployment via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to Firestore Database > Rules tab
4. Copy contents of `firestore.rules` and paste
5. Publish changes

## Rule Structure

### Firestore Rules

All data is scoped to authenticated users:
- Users can only read/write their own data
- Data is organized under `/users/{userId}/`
- Collections include: cattle, barns, pens, batches, feedActivities, etc.

### User Profile & Settings

- `/userProfiles/{userId}` - User profile data
- `/farmSettings/{userId}` - Farm settings and preferences

### Data Collections

All under `/users/{userId}/`:
- `cattle` - Individual cattle records
- `barns` - Barn management
- `pens` - Pen management
- `batches` - Pen groups/batches
- `penFeedActivities` - Pen-level feed tracking
- `penMedicationActivities` - Pen-level medication tracking
- `feedInventory` - Feed inventory items
- `medicationInventory` - Medication inventory
- `rations` - Feed ration formulations
- `activities` - Activity logs
- `pastures` - Pasture management

## Security Principles

1. **Authentication Required** - All operations require authenticated user
2. **Ownership Verification** - Users can only access their own data
3. **No Cross-User Access** - Users cannot read/write other users' data
4. **Deny by Default** - Anything not explicitly allowed is denied

## Testing Rules

Use Firebase Emulator Suite to test rules locally:

```bash
firebase emulators:start
```

Or test in Firebase Console Rules Playground.

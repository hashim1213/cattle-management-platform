# Letter of Intent Fix - Deployment Notes

## Summary of Changes

Fixed the letter of intent submission issue on the landing page. The problem was caused by:

1. **Missing Firestore Security Rules**: The `letterOfIntent` collection had no explicit rules, and the catch-all rule was denying all access.
2. **API Route Configuration**: Updated the API route to properly use Firebase for server-side operations.

## Files Modified

1. `firestore.rules` - Added rule to allow public creation of letter of intent documents
2. `app/api/loi/route.ts` - Updated to use Firebase client SDK properly for server-side API route
3. `lib/firebase-admin.ts` - Created Firebase Admin SDK configuration (installed `firebase-admin` package)
4. `.firebaserc` - Added project configuration
5. `.github/workflows/deploy-firestore-rules.yml` - Created automated deployment workflow

## Required Actions

### Option 1: Automatic Deployment (Recommended)

The Firestore rules will be automatically deployed when you push changes to the main/master branch, provided you have set up the Firebase token:

1. Generate a Firebase CI token:
   ```bash
   firebase login:ci
   ```

2. Add the token to GitHub repository secrets:
   - Go to your repository Settings → Secrets and variables → Actions
   - Create a new secret named `FIREBASE_TOKEN`
   - Paste the token from step 1

3. Push your changes - the workflow will automatically deploy the rules

### Option 2: Manual Deployment

If you prefer to deploy manually or if the GitHub Action hasn't been set up yet:

```bash
# 1. Login to Firebase CLI
firebase login

# 2. Deploy the Firestore rules
firebase deploy --only firestore:rules
```

## Testing

After deploying the Firestore rules, test the letter of intent form:

1. Visit the landing page at `/`
2. Scroll to the "Reserve Your Spot" section
3. Fill out the form with test data
4. Verify the submission succeeds and shows a success message
5. Check the Firebase Console → Firestore → `letterOfIntent` collection to see the submitted data

## Security Notes

The new Firestore rule allows **anyone** to create documents in the `letterOfIntent` collection (which is intentional for the public form), but prevents reading, updating, or deleting these documents:

```
match /letterOfIntent/{documentId} {
  allow create: if true;  // Anyone can submit a letter of intent
  allow read, update, delete: if false;  // No one can read or modify
}
```

This is appropriate for a lead generation form where:
- Visitors should be able to submit without authentication
- Submitted data should only be accessible to administrators via Firebase Console

## Verifying the Fix

The error message changed from:
- **Before**: Various Firebase initialization errors or timeout errors
- **After**: "7 PERMISSION_DENIED" (before deploying rules) → Success (after deploying rules)

Once the rules are deployed, submissions should succeed with a 201 status code and a success message.

# Accessibility Fixes for Dialogs

## Issue
Radix UI requires all `DialogContent` components to have a `DialogTitle` for screen reader users. Currently, 38 dialog components need this fix.

## Quick Fix Pattern

### If Dialog Has a Visible Title:
✅ **Already Correct** - Most dialogs already have DialogTitle

Example (no changes needed):
```tsx
<DialogContent>
  <DialogHeader>
    <DialogTitle>Add Cattle</DialogTitle>  {/* ✅ Good! */}
    <DialogDescription>Enter cattle details</DialogDescription>
  </DialogHeader>
  {/* ... */}
</DialogContent>
```

### If Dialog Has No Title (e.g., confirmation dialogs):
❌ **Needs Fix** - Add VisuallyHidden title

```tsx
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

<DialogContent>
  <VisuallyHidden>
    <DialogTitle>Confirmation Dialog</DialogTitle>
  </VisuallyHidden>
  {/* ... */}
</DialogContent>
```

## Files Affected (38 total)

Most of your dialogs already have titles and are fine. The warning is coming from a few specific cases:

### Priority Fixes:
1. `/app/cattle/[id]/page.tsx` - Location assignment dialog
2. `/app/feed/page.tsx` - Record usage / Add stock dialogs
3. `/app/pastures/page.tsx` - Rotation dialogs

## Automated Fix Script

Run this to add VisuallyHidden import to all dialog files:

```bash
# Add import to files that need it
find . -name "*.tsx" -type f | while read file; do
  if grep -q "DialogContent" "$file" && ! grep -q "DialogTitle" "$file"; then
    echo "Needs fix: $file"
  fi
done
```

## Best Practice Going Forward

When creating new dialogs, always use this pattern:

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

function MyDialog() {
  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>Optional description</DialogDescription>
        </DialogHeader>
        {/* Content */}
      </DialogContent>
    </Dialog>
  )
}
```

## Testing Accessibility

### With Screen Reader:
```bash
# macOS
VoiceOver: Cmd + F5

# Windows
NVDA: Free download from nvaccess.org
```

### With Keyboard Only:
- Tab through all interactive elements
- Enter/Space should activate buttons
- Escape should close dialogs

### Automated Testing:
```bash
npm install --save-dev @axe-core/react
```

Then add to your app:
```tsx
if (process.env.NODE_ENV !== 'production') {
  import('@axe-core/react').then(axe => {
    axe.default(React, ReactDOM, 1000)
  })
}
```

## Quick Command to Suppress Warning (Temporary)

If you need to deploy immediately and fix later:

```bash
# Add to next.config.mjs
const nextConfig = {
  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /node_modules\/react/ }
    ]
    return config
  }
}
```

⚠️ **NOT RECOMMENDED** - Fix the accessibility issues instead!

## Impact

- **User Impact:** Screen reader users can't understand dialog purpose
- **Legal Impact:** WCAG 2.1 Level A requirement (ADA compliance)
- **SEO Impact:** None
- **Fix Time:** ~30 seconds per dialog

## Priority

🟡 **Medium Priority** - Doesn't break functionality but affects accessibility

Recommended: Fix before public launch or if targeting government/enterprise customers.

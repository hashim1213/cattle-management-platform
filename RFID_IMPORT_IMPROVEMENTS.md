# RFID Import Improvements

## Overview
Enhanced the RFID PDF/Image import functionality with better OCR accuracy and flexible cattle entry workflow.

## New Features

### 1. OpenAI Vision OCR Integration
- **Better Accuracy**: Uses GPT-4o Vision API for superior text extraction from images and PDFs
- **Automatic Fallback**: If OpenAI fails or is not configured, automatically falls back to Tesseract OCR
- **Toggle Control**: Users can enable/disable OpenAI OCR via a switch in the import dialog
- **Configuration**: Requires `OPENAI_API_KEY` environment variable (see `.env.example`)

### 2. Enhanced Cattle Entry Workflow
After RFID numbers are extracted, users now enter detailed information before final import:

#### Weight Entry Modes
1. **Total Weight (Averaged)**
   - Enter total weight for all cattle
   - System automatically calculates average weight per animal
   - Example: 5000 lbs total ÷ 10 cattle = 500 lbs each

2. **Same Weight for All**
   - Enter a single weight value
   - Applied to all cattle uniformly
   - Example: All cattle are 550 lbs

3. **Individual Weights**
   - Enter specific weight for each animal
   - Provides granular control
   - Useful when each animal was weighed separately

#### Cost Entry Modes
1. **Total Cost (Averaged)**
   - Enter total purchase cost for all cattle
   - System automatically calculates average cost per animal
   - Example: $7500 total ÷ 10 cattle = $750 each

2. **Same Cost for All**
   - Enter a single cost value
   - Applied to all cattle uniformly
   - Example: All cattle cost $725 each

3. **Individual Costs**
   - Enter specific cost for each animal
   - Useful when cattle were purchased at different prices

#### Automatic Calculations
- **Cost per Pound**: Automatically calculated for each animal (Cost ÷ Weight)
- **Summary Preview**: Real-time summary showing:
  - Total weight across all cattle
  - Total cost across all cattle
  - Average weight per animal
  - Average cost per animal
  - Average cost per pound

### 3. Data Storage Enhancements
All imported cattle now include:
- `purchaseWeight`: Weight at time of purchase
- `purchasePrice`: Purchase cost
- `purchaseDate`: Date of import/purchase
- `arrivalWeight`: Same as purchase weight
- `weight`: Current weight (initialized to purchase weight)
- Notes include cost per pound calculation

## User Flow

1. **Step 1: Input**
   - Toggle OpenAI OCR on/off
   - Upload PDF/Image, capture photo, or paste text

2. **Step 2: Processing**
   - OCR extraction (OpenAI or Tesseract)
   - Automatic RFID parsing

3. **Step 3: Review**
   - Review detected RFID numbers
   - Edit/add/remove numbers
   - Select pen and batch

4. **Step 4: Details** (NEW)
   - Choose weight entry mode
   - Choose cost entry mode
   - Review summary with calculations

5. **Step 5: Import**
   - Create cattle records with all details
   - Update pen counts
   - Show success message with totals

## Setup

### Environment Variables
Create a `.env.local` file with:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

Get your API key from: https://platform.openai.com/api-keys

### Without OpenAI
The system works perfectly without OpenAI:
- Simply leave the OpenAI toggle off (or it will auto-fallback if API key is not configured)
- **PDFs are converted to images** and processed with Tesseract OCR
- Works great for scanned PDFs and image-based documents
- **No API key required** - completely free
- All other features work normally

## Technical Implementation

### Files Created
- `app/api/ocr/route.ts` - OpenAI Vision OCR API endpoint
- `components/cattle-details-entry.tsx` - Weight/cost entry component
- `.env.example` - Environment variable template

### Files Modified
- `components/rfid-image-import-dialog.tsx` - Main import dialog with new flow

### API Routes
- `POST /api/ocr` - Processes images using OpenAI Vision API
  - Input: FormData with file
  - Output: { text: string, success: boolean }

## Benefits

1. **PDF Support**: Both text-based and scanned/image-based PDFs are now supported:
   - **OpenAI Vision** (optional): Best accuracy for low-quality scans, handwritten numbers, complex layouts
   - **Tesseract OCR** (free): Automatic PDF to image conversion handles scanned PDFs without API key
   - **No more timeouts**: Both methods reliably process multi-page PDFs

2. **Accuracy**: OpenAI Vision provides significantly better OCR results than Tesseract, especially for:
   - Low-quality scans
   - Handwritten numbers
   - Complex document layouts
   - Poor lighting conditions

3. **Flexibility**: Weight/cost entry modes accommodate different farmer workflows:
   - Some farmers weigh cattle as a group
   - Some weigh individually
   - Some have uniform lots

4. **Financial Tracking**: Automatic cost per pound calculation helps farmers:
   - Track investment per animal
   - Compare costs across batches
   - Calculate ROI at sale time

5. **Data Integrity**: Real-time validation and preview prevents data entry errors

6. **User Experience**: Step-by-step workflow is intuitive and prevents mistakes

## Future Enhancements

Potential improvements:
- Support for additional OCR providers (Azure, Google Cloud Vision)
- Batch weight/cost templates (save common configurations)
- Import history and audit trail
- Export cost analysis reports
- Integration with livestock auction data

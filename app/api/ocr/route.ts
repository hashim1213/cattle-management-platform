import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const mimeType = file.type || 'image/png'
    const dataUrl = `data:${mimeType};base64,${base64}`

    const openai = new OpenAI({ apiKey })

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // gpt-4o is optimized for vision tasks
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract all cattle information from this image or PDF document. Look for:

**RFID/Tag Numbers** (REQUIRED - extract all you find):
1. Electronic RFID numbers (usually 15-16 digits, often starting with 840 for US or 124 for Canada)
2. Visual tag numbers (usually 4-6 digits)
3. McCall Livestock format: 4 digits followed by 12 digits
4. CCIA format: "CA" or "CAN" followed by 3-4 digits and 12 digits
5. Formatted numbers with dashes or spaces like "840-003-123456789"

**Additional Cattle Data** (if available in the document):
- Weight (in pounds or lbs)
- Breed (e.g., Angus, Hereford, Holstein, etc.)
- Sex (Bull, Heifer, Steer, Cow, etc.)
- Visual Tag (separate visual ID if different from RFID)
- Purchase Price or Cost (in dollars)
- Lot number or Batch ID
- Date information (arrival date, purchase date)

**Output Format:**
Return the data in a structured format. For each animal, use this format:
RFID: [tag number]
Visual Tag: [visual tag if available]
Weight: [weight in lbs if available]
Breed: [breed if available]
Sex: [sex if available]
Price: [price if available]
---

If only RFID numbers are available, list them one per line without additional fields.
Remove dashes and spaces from RFID numbers. Extract all unique cattle records you can find.`
            },
            {
              type: 'image_url',
              image_url: {
                url: dataUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
    })

    const extractedText = response.choices[0]?.message?.content || ''

    return NextResponse.json({
      text: extractedText,
      success: true,
    })
  } catch (error: any) {
    console.error('OpenAI OCR Error:', error)
    return NextResponse.json(
      {
        error: error?.message || 'Failed to process image with OpenAI',
        success: false
      },
      { status: 500 }
    )
  }
}

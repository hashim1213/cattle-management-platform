import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

export async function POST(request: NextRequest) {
  try {
    const { image, imageType } = await request.json()

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      )
    }

    // Initialize OpenAI client (lazy loading to avoid build-time errors)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Use OpenAI Vision to extract RFID numbers from the image
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using GPT-4 Omni for vision
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting RFID tag numbers and visual tag numbers from cattle documentation.
Extract ALL tag numbers you can find in the image, including:
- Electronic RFID tags (typically 15-16 digits like 840003123456789)
- Visual tags (4-6 digits)
- McCall Livestock format (e.g., 0124 000174878652)
- CCIA Canadian format (e.g., CA 124 000174878652)
- Any other numeric identifiers in lists or tables

Return ONLY the numbers, one per line, with no additional text or formatting.
Remove any spaces, dashes, or formatting from the numbers.
If you find structured data with multiple cattle, extract each tag number on a separate line.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all RFID and visual tag numbers from this cattle documentation. Return only the numbers, one per line.",
            },
            {
              type: "image_url",
              image_url: {
                url: image,
                detail: "high", // Use high detail for better accuracy
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0, // Use deterministic output for better consistency
    })

    const extractedText = response.choices[0]?.message?.content || ""

    return NextResponse.json({
      success: true,
      extractedText,
      model: "gpt-4o",
    })
  } catch (error: any) {
    console.error("OpenAI Vision OCR Error:", error)
    return NextResponse.json(
      {
        error: error?.message || "Failed to process image with OpenAI",
        details: error?.response?.data || null,
      },
      { status: 500 }
    )
  }
}

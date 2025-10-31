import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    if (!message) {
      return Response.json({ error: "Message is required" }, { status: 400 })
    }

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `You are a cattle management assistant. Parse the following farmer's input and extract structured data.
      
User input: "${message}"

Extract any relevant information about:
- Cattle (ear tag, breed, sex, weight, birth date, dam/sire)
- Feed inventory (type, quantity, cost)
- Weight updates (ear tag, new weight, date)
- Health records (ear tag, treatment, notes)

Respond with a brief confirmation message about what was recorded. Be concise and friendly.`,
    })

    return Response.json({
      message: text,
      success: true,
    })
  } catch (error) {
    console.error("[v0] Quick entry error:", error)
    return Response.json({ error: "Failed to process entry" }, { status: 500 })
  }
}

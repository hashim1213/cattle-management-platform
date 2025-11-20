import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const SYSTEM_PROMPT = `You are a proactive, friendly Farm Assistant for a cattle management platform. Your goal is to make farm management as EASY and CONVERSATIONAL as possible. Guide farmers through tasks naturally.

CORE PHILOSOPHY:
✅ BE PROACTIVE - Guide users, don't just wait for perfect input
✅ BE FLEXIBLE - Use smart defaults when info is missing
✅ BE CONVERSATIONAL - Talk naturally, not like a form
✅ TAKE ACTION - Create things immediately with available info
✅ BE FORGIVING - Missing info? Use "Unknown", "Mixed", "0", or reasonable defaults

SMART DEFAULTS STRATEGY:
When farmers don't provide info, use these defaults:
- tagNumber → Generate "AUTO_" + random number (e.g., "AUTO_1234")
- breed → "Mixed" or "Unknown"
- sex → "Unknown"
- weight → 0 (they can update later)
- name → Leave blank or use tag number
- location → "Main Area"
- capacity → 50
- quantity → 1
- category → Pick most common (e.g., "antibiotic" for meds)
- unit → Pick most common (e.g., "ml" for liquids, "lbs" for feed)

INTERACTION STYLE:
❌ Don't say: "I need more information"
✅ Instead: CREATE IT with defaults and mention what you assumed

Examples:
User: "Add an animal"
YOU: {
  "action": "addCattle",
  "params": {
    "tagNumber": "AUTO_1234",
    "breed": "Mixed",
    "sex": "Unknown",
    "weight": 0
  },
  "message": "✓ Added new animal! I assigned tag AUTO_1234 since you didn't specify. Set breed to 'Mixed' and weight to 0 - you can update these anytime. What tag number would you like to use instead?"
}

User: "Add animal 567"
YOU: {
  "action": "addCattle",
  "params": {"tagNumber": "567", "breed": "Mixed", "sex": "Unknown", "weight": 0},
  "message": "✓ Added animal #567! Using 'Mixed' breed and 'Unknown' sex as defaults. Want to tell me the breed or shall I keep it as Mixed?"
}

User: "Add Angus bull"
YOU: {
  "action": "addCattle",
  "params": {"tagNumber": "AUTO_5678", "breed": "Angus", "sex": "Bull", "weight": 0},
  "message": "✓ Added Angus bull! Assigned tag AUTO_5678. What weight should I record?"
}

AVAILABLE ACTIONS:

🐄 CATTLE:
- addCattle: tagNumber, breed, sex, weight (ALL optional - use defaults!)
- updateCattle: tagNumber/cattleId + any field to update
- deleteCattle: tagNumber or cattleId
- getCattleInfo: tagNumber/cattleId/penId
- getAllCattle: (no params)
- addWeightRecord: tagNumber/cattleId, weight

🏠 BARNS & PENS:
- addBarn: name (location defaults to "Main Area")
- addPen: name (barnId can be blank, capacity defaults to 50)
- deleteBarn/deletePen: barnId/penId
- getPenInfo: penId (optional)
- getCattleCountByPen: (no params)

💊 INVENTORY:
- addMedication: name (category="medication", quantity=1, unit="ml" as defaults)
- getInventoryInfo: itemName (optional)

🏥 HEALTH:
- addHealthRecord: tagNumber + medicationName + quantity
- logActivity: penId + activityType + description

📊 REPORTS:
- getFarmSummary: (no params)

RESPONSE FORMAT - IMPORTANT:
When performing an ACTION (add/update/delete), respond with ONLY a JSON object:
{
  "action": "actionName",
  "params": { ... with smart defaults ... },
  "message": "Friendly confirmation + what defaults you used + optional follow-up question"
}

For QUERIES or QUESTIONS (what's happening, show me, tell me), respond conversationally without JSON.

CRITICAL RULES:
1. ALWAYS take action when user requests to add/update/delete - don't just ask for more info
2. Use defaults liberally - farmers can update later
3. Mention what defaults you used in your message
4. Ask optional follow-up questions to refine
5. Be encouraging and helpful
6. When outputting JSON for actions, output ONLY the JSON object, no extra text

You're here to make farm management EFFORTLESS!`

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
  conversationId?: string
  userId?: string
  farmContext?: any
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { messages, conversationId, userId, farmContext } = body

    console.log('[Chat API] Request received:', {
      messageCount: messages?.length,
      conversationId,
      userId,
      hasUserId: !!userId,
      hasFarmContext: !!farmContext
    })

    if (!messages || messages.length === 0) {
      console.error('[Chat API] No messages provided')
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      )
    }

    if (!userId) {
      console.error('[Chat API] User ID not provided')
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('[Chat API] OpenAI API key not configured')
      return NextResponse.json(
        {
          error: "Farm Assistant is not configured. Please add your OpenAI API key to continue.",
          details: "Create a .env.local file in the project root and add: OPENAI_API_KEY=your_key_here",
          helpUrl: "https://platform.openai.com/api-keys"
        },
        { status: 500 }
      )
    }

    // Create enhanced system prompt with farm context if provided
    let enhancedSystemPrompt = SYSTEM_PROMPT

    if (farmContext) {
      console.log('[Chat API] Using provided farm context:', {
        cattle: farmContext.cattle?.total,
        pens: farmContext.pens?.total,
        inventory: farmContext.inventory?.total
      })

      enhancedSystemPrompt = `${SYSTEM_PROMPT}

CURRENT FARM STATUS & CONTEXT:
${farmContext.summary || ""}

Detailed Farm Data:
- Cattle: ${farmContext.cattle?.total || 0} total (Avg weight: ${farmContext.cattle?.avgWeight || 0} lbs)
  Status breakdown: ${JSON.stringify(farmContext.cattle?.byStatus || {})}
  Pen distribution: ${JSON.stringify(farmContext.cattle?.byPen || {})}
  ${farmContext.cattle?.healthIssues?.length > 0 ? `Health issues: ${farmContext.cattle.healthIssues.map((h: any) => `#${h.tagNumber} (${h.status})`).join(", ")}` : "No health issues"}

- Pens: ${farmContext.pens?.total || 0} total, ${farmContext.pens?.utilization || 0}% utilized
  ${farmContext.pens?.overcrowded?.length > 0 ? `Overcrowded: ${farmContext.pens.overcrowded.map((p: any) => p.name).join(", ")}` : ""}
  ${farmContext.pens?.empty?.length > 0 ? `Empty pens: ${farmContext.pens.empty.map((p: any) => p.name).join(", ")}` : ""}

- Inventory: ${farmContext.inventory?.total || 0} items (Total value: $${farmContext.inventory?.totalValue || 0})
  ${farmContext.inventory?.lowStock?.length > 0 ? `LOW STOCK: ${farmContext.inventory.lowStock.map((i: any) => `${i.name} (${i.quantity} ${i.unit})`).join(", ")}` : "All items well-stocked"}

- Recent Activity:
  ${farmContext.cattle?.recentAdditions?.length > 0 ? `Recent cattle additions: ${farmContext.cattle.recentAdditions.slice(0, 3).map((c: any) => `#${c.tagNumber}`).join(", ")}` : "No recent additions"}
  ${farmContext.health?.recentTreatments?.length > 0 ? `Recent treatments: ${farmContext.health.recentTreatments.slice(0, 3).map((t: any) => `#${t.cattleTag} (${t.medication})`).join(", ")}` : ""}

Use this context to provide intelligent, informed responses. You know EVERYTHING about this farm!`
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Call OpenAI with enhanced context
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: enhancedSystemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1500,
    })

    const assistantMessage = completion.choices[0].message.content || ""

    // Try to parse if it's a JSON action
    let action = null
    let finalMessage = assistantMessage

    try {
      // Look for JSON in the response
      let actionData = null

      // First try to parse the entire message as JSON
      try {
        const trimmedMessage = assistantMessage.trim()
        actionData = JSON.parse(trimmedMessage)
        console.log('[Chat API] Successfully parsed full message as JSON')
      } catch {
        // If that fails, try to extract JSON from the message
        const jsonBlockMatch = assistantMessage.match(/```json\s*(\{[\s\S]*?\})\s*```/)
        if (jsonBlockMatch) {
          try {
            actionData = JSON.parse(jsonBlockMatch[1])
            console.log('[Chat API] Extracted JSON from code block')
          } catch (e) {
            console.error('[Chat API] Failed to parse JSON from code block:', e)
          }
        } else {
          // Try to find any JSON object in the message
          const jsonMatch = assistantMessage.match(/\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}/)
          if (jsonMatch) {
            try {
              actionData = JSON.parse(jsonMatch[0])
              console.log('[Chat API] Extracted inline JSON object')
            } catch (e) {
              console.error('[Chat API] Failed to parse inline JSON:', e)
            }
          }
        }
      }

      if (actionData && actionData.action) {
        console.log('[Chat API] Action detected:', actionData.action)
        action = actionData
        finalMessage = actionData.message || assistantMessage
      }
    } catch (parseError) {
      // Not a JSON response or parsing failed
      console.log("[Chat API] No action detected, treating as conversational response")
    }

    return NextResponse.json({
      message: finalMessage,
      action: action, // Return action for client-side execution
      conversationId: conversationId || `conv_${Date.now()}`,
    })

  } catch (error: any) {
    console.error("Chat API error:", error)

    if (error.code === "insufficient_quota") {
      return NextResponse.json(
        { error: "OpenAI API quota exceeded. Please check your API key and billing." },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: error.message || "Failed to process chat message" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { actionExecutor } from "@/lib/agent/action-executor"
import { FarmContextBuilder } from "@/lib/ai/farm-context-builder"

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
    "tagNumber": "AUTO_${Math.random().toString().slice(2,6)}",
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
- addMedication: name (category="antibiotic", quantity=1, unit="ml" as defaults)
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
}

/**
 * Format query response data into human-readable text
 */
async function formatQueryResponse(action: string, data: any, aiMessage?: string): Promise<string> {
  let formatted = aiMessage || "Here's what I found:\n\n"

  switch (action) {
    case "getAllCattle":
      if (data.totalCount === 0) {
        formatted = "You don't have any cattle in your system yet."
      } else {
        formatted = `You have **${data.totalCount} cattle** total.\n\n`
        if (data.penSummary && data.penSummary.length > 0) {
          formatted += "**Distribution by pen:**\n"
          data.penSummary.forEach((pen: any) => {
            const penName = pen.penId === 'unassigned' ? 'Unassigned' : `Pen ${pen.penId}`
            formatted += `- ${penName}: ${pen.count} cattle\n`
          })
        }
      }
      break

    case "getFarmSummary":
      formatted = "**Farm Overview:**\n\n"
      formatted += `🐄 **Cattle:** ${data.cattle.total} total\n`
      formatted += `🏠 **Pens:** ${data.pens.total} total\n`
      formatted += `📦 **Inventory:** ${data.inventory.total} items (Total value: $${data.inventory.totalValue.toFixed(2)})\n`

      if (data.inventory.lowStockCount > 0) {
        formatted += `\n⚠️ **${data.inventory.lowStockCount} items are low in stock:**\n`
        data.inventory.lowStockItems.slice(0, 5).forEach((item: any) => {
          formatted += `- ${item.name}: ${item.quantity} ${item.unit}\n`
        })
      }

      if (data.pens.penList && data.pens.penList.length > 0) {
        formatted += `\n**Your pens:**\n`
        data.pens.penList.slice(0, 5).forEach((pen: any) => {
          formatted += `- ${pen.name} (Capacity: ${pen.capacity || 'Not set'})\n`
        })
      }
      break

    case "getCattleCountByPen":
      if (data && data.length > 0) {
        formatted = `**Cattle distribution across ${data.length} pens:**\n\n`
        data.forEach((pen: any) => {
          const utilization = pen.capacity ? ` (${Math.round((pen.count / pen.capacity) * 100)}% full)` : ''
          formatted += `- **${pen.name}:** ${pen.count} cattle${utilization}\n`
        })
      } else {
        formatted = "No pens found in your system."
      }
      break

    case "getPenInfo":
      if (Array.isArray(data)) {
        if (data.length === 0) {
          formatted = "No pens found."
        } else if (data.length === 1) {
          const pen = data[0]
          formatted = `**${pen.name}**\n`
          formatted += `- Capacity: ${pen.capacity || 'Not set'}\n`
          formatted += `- Notes: ${pen.notes || 'None'}\n`
        } else {
          formatted = `Found ${data.length} pens:\n`
          data.slice(0, 10).forEach((pen: any) => {
            formatted += `- ${pen.name} (Capacity: ${pen.capacity || 'Not set'})\n`
          })
        }
      } else if (data) {
        formatted = `**${data.name}**\n`
        formatted += `- Capacity: ${data.capacity || 'Not set'}\n`
        formatted += `- Notes: ${data.notes || 'None'}\n`
      }
      break

    case "getCattleInfo":
      if (Array.isArray(data)) {
        if (data.length === 0) {
          formatted = "No cattle found matching your criteria."
        } else if (data.length === 1) {
          const cattle = data[0]
          formatted = `**Cattle #${cattle.tagNumber || cattle.id}**\n`
          formatted += `- Tag: ${cattle.tagNumber || 'Not set'}\n`
          formatted += `- Pen: ${cattle.penId || 'Unassigned'}\n`
          if (cattle.breed) formatted += `- Breed: ${cattle.breed}\n`
          if (cattle.weight) formatted += `- Weight: ${cattle.weight} lbs\n`
        } else {
          formatted = `Found ${data.length} cattle:\n`
          data.slice(0, 10).forEach((cattle: any) => {
            formatted += `- Tag ${cattle.tagNumber || 'N/A'} (Pen: ${cattle.penId || 'Unassigned'})\n`
          })
        }
      }
      break

    case "getInventoryInfo":
      if (Array.isArray(data)) {
        if (data.length === 0) {
          formatted = "No inventory items found."
        } else {
          formatted = `**Inventory (${data.length} items):**\n\n`
          data.slice(0, 10).forEach((item: any) => {
            const lowStock = item.quantityOnHand <= item.reorderPoint ? ' ⚠️ LOW' : ''
            formatted += `- **${item.name}**: ${item.quantityOnHand} ${item.unit}${lowStock}\n`
            if (item.totalValue) formatted += `  Value: $${item.totalValue.toFixed(2)}\n`
          })
        }
      }
      break

    default:
      // Fallback to basic JSON formatting for unknown actions
      formatted = aiMessage || "Here's what I found:\n\n"
      formatted += `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``
  }

  return formatted
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { messages, conversationId, userId } = body

    console.log('[Chat API] Request received:', {
      messageCount: messages?.length,
      conversationId,
      userId,
      hasUserId: !!userId
    })

    if (!messages || messages.length === 0) {
      console.error('[Chat API] No messages provided')
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      )
    }

    if (!userId) {
      console.error('[Chat API] No userId provided in request body')
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 401 }
      )
    }

    console.log('[Chat API] User authenticated, userId:', userId)

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

    // Build comprehensive farm context for AI intelligence
    console.log('[Chat API] Building farm context...')
    const contextBuilder = new FarmContextBuilder(userId)
    const farmContext = await contextBuilder.buildContext()
    console.log('[Chat API] Farm context built:', {
      cattle: farmContext.cattle.total,
      pens: farmContext.pens.total,
      inventory: farmContext.inventory.total
    })

    // Create enhanced system prompt with farm context
    const enhancedSystemPrompt = `${SYSTEM_PROMPT}

CURRENT FARM STATUS & CONTEXT:
${farmContext.summary}

Detailed Farm Data:
- Cattle: ${farmContext.cattle.total} total (Avg weight: ${farmContext.cattle.avgWeight} lbs)
  Status breakdown: ${JSON.stringify(farmContext.cattle.byStatus)}
  Pen distribution: ${JSON.stringify(farmContext.cattle.byPen)}
  ${farmContext.cattle.healthIssues.length > 0 ? `Health issues: ${farmContext.cattle.healthIssues.map((h: any) => `#${h.tagNumber} (${h.status})`).join(", ")}` : "No health issues"}

- Pens: ${farmContext.pens.total} total, ${farmContext.pens.utilization}% utilized
  ${farmContext.pens.overcrowded.length > 0 ? `Overcrowded: ${farmContext.pens.overcrowded.map((p: any) => p.name).join(", ")}` : ""}
  ${farmContext.pens.empty.length > 0 ? `Empty pens: ${farmContext.pens.empty.map((p: any) => p.name).join(", ")}` : ""}

- Inventory: ${farmContext.inventory.total} items (Total value: $${farmContext.inventory.totalValue})
  ${farmContext.inventory.lowStock.length > 0 ? `LOW STOCK: ${farmContext.inventory.lowStock.map((i: any) => `${i.name} (${i.quantity} ${i.unit})`).join(", ")}` : "All items well-stocked"}

- Recent Activity:
  ${farmContext.cattle.recentAdditions.length > 0 ? `Recent cattle additions: ${farmContext.cattle.recentAdditions.slice(0, 3).map((c: any) => `#${c.tagNumber}`).join(", ")}` : "No recent additions"}
  ${farmContext.health.recentTreatments.length > 0 ? `Recent treatments: ${farmContext.health.recentTreatments.slice(0, 3).map((t: any) => `#${t.cattleTag} (${t.medication})`).join(", ")}` : ""}

Use this context to provide intelligent, informed responses. You know EVERYTHING about this farm!`

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
    let actionResult = null
    let finalMessage = assistantMessage

    try {
      // Look for JSON in the response - improved extraction
      let actionData = null

      // First try to parse the entire message as JSON
      try {
        const trimmedMessage = assistantMessage.trim()
        actionData = JSON.parse(trimmedMessage)
        console.log('[Chat API] Successfully parsed full message as JSON')
      } catch {
        // If that fails, try to extract JSON from the message
        // Look for JSON block between code fences or inline
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
        console.log('[Chat API] Executing action:', actionData.action, 'with params:', actionData.params)

        // Execute the action
        switch (actionData.action) {
            // Inventory actions
            case "addMedication":
              actionResult = await actionExecutor.addMedication(userId, actionData.params)
              break
            case "getInventoryInfo":
              actionResult = await actionExecutor.getInventoryInfo(userId, actionData.params?.itemName)
              break

            // Cattle actions
            case "addCattle":
              actionResult = await actionExecutor.addCattle(userId, actionData.params)
              break
            case "updateCattle":
              actionResult = await actionExecutor.updateCattle(userId, actionData.params)
              break
            case "deleteCattle":
              actionResult = await actionExecutor.deleteCattle(userId, actionData.params)
              break
            case "getCattleInfo":
              actionResult = await actionExecutor.getCattleInfo(userId, actionData.params)
              break
            case "getAllCattle":
              actionResult = await actionExecutor.getAllCattle(userId)
              break
            case "addWeightRecord":
              actionResult = await actionExecutor.addWeightRecord(userId, actionData.params)
              break

            // Health actions
            case "addHealthRecord":
              actionResult = await actionExecutor.addHealthRecord(userId, actionData.params)
              break

            // Pen actions
            case "addPen":
              actionResult = await actionExecutor.addPen(userId, actionData.params)
              break
            case "updatePen":
              actionResult = await actionExecutor.updatePen(userId, actionData.params)
              break
            case "deletePen":
              actionResult = await actionExecutor.deletePen(userId, actionData.params)
              break
            case "getPenInfo":
              actionResult = await actionExecutor.getPenInfo(userId, actionData.params?.penId)
              break
            case "getCattleCountByPen":
              actionResult = await actionExecutor.getCattleCountByPen(userId)
              break

            // Barn actions
            case "addBarn":
              actionResult = await actionExecutor.addBarn(userId, actionData.params)
              break
            case "deleteBarn":
              actionResult = await actionExecutor.deleteBarn(userId, actionData.params)
              break

            // Activity actions
            case "logActivity":
              actionResult = await actionExecutor.logActivity(userId, actionData.params)
              break

            // Summary/Stats actions
            case "getFarmSummary":
              actionResult = await actionExecutor.getFarmSummary(userId)
              break

            default:
              actionResult = {
                success: false,
                message: `Unknown action: ${actionData.action}`,
              }
        }

        console.log('[Chat API] Action result:', {
          action: actionData.action,
          success: actionResult?.success,
          message: actionResult?.message,
          error: actionResult?.error
        })

        // If action was successful, format response based on action type
        if (actionResult && actionResult.success) {
          // Use AI-generated message or fallback to action result
          finalMessage = actionData.message || actionResult.message

          // For query actions, format the data in a user-friendly way
          if (actionData.action.startsWith("get") && actionResult.data) {
            finalMessage = await formatQueryResponse(actionData.action, actionResult.data, actionData.message)
          }
          console.log('[Chat API] Action successful, formatted message length:', finalMessage.length)
        } else if (actionResult && !actionResult.success) {
          finalMessage = `Sorry, I encountered an error: ${actionResult.message || actionResult.error}`
          console.error('[Chat API] Action failed:', finalMessage)
        }
      }
    } catch (parseError) {
      // Not a JSON response or parsing failed
      console.log("[Chat API] JSON parsing failed or not an action response:", parseError)
      console.log("[Chat API] Using assistant message as-is")

      // If we got a parse error, it means the AI didn't format correctly
      // Log this for debugging but continue with the message
      if (parseError instanceof SyntaxError) {
        console.warn("[Chat API] AI returned invalid JSON format")
      }
    }

    return NextResponse.json({
      message: finalMessage,
      actionResult,
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

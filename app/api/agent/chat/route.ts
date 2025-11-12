import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { actionExecutor } from "@/lib/agent/action-executor"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `You are a helpful Farm Assistant for a cattle management platform. You help farmers manage their cattle operations through natural conversation.

You can help with:
1. Adding medications/inventory items
2. Updating pen information
3. Logging activities for pens
4. Recording health treatments
5. Querying cattle, pen, and inventory information
6. Providing farm summaries and statistics

When users ask you to perform actions, you should:
- Parse their request to understand the intent
- Extract relevant parameters
- Execute the appropriate action
- Provide clear, friendly confirmation

Available Actions:

WRITE ACTIONS (modify data):
- addMedication: Add medication to inventory (params: name, category, quantity, unit, costPerUnit, withdrawalPeriod, storageLocation, notes)
- updatePen: Update pen information (params: penId, name, capacity, notes)
- logActivity: Log an activity for a pen (params: penId, activityType, description, date, notes)
- addHealthRecord: Record health treatment and deduct inventory (params: cattleId/tagNumber/penId, medicationName, quantity, date, notes)

READ ACTIONS (query data):
- getCattleInfo: Get information about specific cattle (params: tagNumber, penId, or cattleId)
- getPenInfo: Get information about specific pens (params: penId - optional, omit to get all pens)
- getInventoryInfo: Get information about inventory items (params: itemName - optional, omit to get all items)
- getAllCattle: Get total cattle count with summary by pen (no params needed)
- getFarmSummary: Get comprehensive farm statistics including cattle, pens, and inventory (no params needed)
- getCattleCountByPen: Get cattle count per pen with pen details (no params needed)

Medication categories: antibiotic, antiparasitic, vaccine, anti-inflammatory, hormone, vitamin-injectable, drug-other
Common units: cc, ml, lbs, kg, tons, bales, bags, doses

When executing actions, you MUST respond with a JSON object containing:
{
  "action": "actionName",
  "params": { ... },
  "message": "A friendly, conversational message to the user explaining what you found or did"
}

IMPORTANT: For informational queries, you will receive the data back after executing the action. Use that data to craft a conversational, human-readable response. DO NOT just dump raw JSON data to the user.

Examples:
- User: "How many cattle do I have?" → Use getAllCattle action, then respond with: "You have [X] cattle total, distributed across [Y] pens."
- User: "What's in pen 3?" → Use getCattleInfo with penId, then respond with: "Pen 3 currently has [X] cattle."
- User: "Give me a farm overview" → Use getFarmSummary, then provide a nice summary of the stats.

Be conversational, friendly, and use farming terminology appropriately. Confirm actions before marking them complete.`

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

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 401 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file" },
        { status: 500 }
      )
    }

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const assistantMessage = completion.choices[0].message.content || ""

    // Try to parse if it's a JSON action
    let actionResult = null
    let finalMessage = assistantMessage

    try {
      // Look for JSON in the response
      const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const actionData = JSON.parse(jsonMatch[0])

        if (actionData.action) {
          // Execute the action
          switch (actionData.action) {
            case "addMedication":
              actionResult = await actionExecutor.addMedication(userId, actionData.params)
              break
            case "updatePen":
              actionResult = await actionExecutor.updatePen(userId, actionData.params)
              break
            case "logActivity":
              actionResult = await actionExecutor.logActivity(userId, actionData.params)
              break
            case "addHealthRecord":
              actionResult = await actionExecutor.addHealthRecord(userId, actionData.params)
              break
            case "getCattleInfo":
              actionResult = await actionExecutor.getCattleInfo(userId, actionData.params)
              break
            case "getPenInfo":
              actionResult = await actionExecutor.getPenInfo(userId, actionData.params?.penId)
              break
            case "getInventoryInfo":
              actionResult = await actionExecutor.getInventoryInfo(userId, actionData.params?.itemName)
              break
            case "getAllCattle":
              actionResult = await actionExecutor.getAllCattle(userId)
              break
            case "getFarmSummary":
              actionResult = await actionExecutor.getFarmSummary(userId)
              break
            case "getCattleCountByPen":
              actionResult = await actionExecutor.getCattleCountByPen(userId)
              break
            default:
              actionResult = {
                success: false,
                message: `Unknown action: ${actionData.action}`,
              }
          }

          // If action was successful, format response based on action type
          if (actionResult && actionResult.success) {
            // Use AI-generated message or fallback to action result
            finalMessage = actionData.message || actionResult.message

            // For query actions, format the data in a user-friendly way
            if (actionData.action.startsWith("get") && actionResult.data) {
              finalMessage = await formatQueryResponse(actionData.action, actionResult.data, actionData.message)
            }
          } else if (actionResult && !actionResult.success) {
            finalMessage = `Sorry, I encountered an error: ${actionResult.message || actionResult.error}`
          }
        }
      }
    } catch (parseError) {
      // Not a JSON response, just use the message as-is
      console.log("Not an action response, using as plain message")
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

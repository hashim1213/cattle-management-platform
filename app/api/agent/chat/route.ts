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

When users ask you to perform actions, you should:
- Parse their request to understand the intent
- Extract relevant parameters
- Execute the appropriate action
- Provide clear, friendly confirmation

Available Actions:
- addMedication: Add medication to inventory (params: name, category, quantity, unit, costPerUnit, withdrawalPeriod, storageLocation, notes)
- updatePen: Update pen information (params: penId, name, capacity, notes)
- logActivity: Log an activity for a pen (params: penId, activityType, description, date, notes)
- addHealthRecord: Record health treatment and deduct inventory (params: cattleId/tagNumber/penId, medicationName, quantity, date, notes)
- getCattleInfo: Get information about cattle (params: tagNumber, penId, or cattleId)
- getPenInfo: Get information about pens (params: penId optional)
- getInventoryInfo: Get information about inventory (params: itemName optional)

Medication categories: antibiotic, antiparasitic, vaccine, anti-inflammatory, hormone, vitamin-injectable, drug-other
Common units: cc, ml, lbs, kg, tons, bales, bags, doses

When executing actions, you MUST respond with a JSON object containing:
{
  "action": "actionName",
  "params": { ... },
  "message": "A friendly message to the user"
}

For informational queries (like "how many cattle in pen 3?"), execute the appropriate get action first, then provide a conversational response.

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
              actionResult = await actionExecutor.getPenInfo(userId, actionData.params.penId)
              break
            case "getInventoryInfo":
              actionResult = await actionExecutor.getInventoryInfo(userId, actionData.params.itemName)
              break
            default:
              actionResult = {
                success: false,
                message: `Unknown action: ${actionData.action}`,
              }
          }

          // If action was successful, use the result message
          if (actionResult && actionResult.success) {
            finalMessage = actionData.message || actionResult.message

            // For info queries, append the data in a friendly way
            if (actionData.action.startsWith("get") && actionResult.data) {
              if (Array.isArray(actionResult.data)) {
                if (actionResult.data.length > 0) {
                  finalMessage += `\n\nHere's what I found:\n${JSON.stringify(actionResult.data, null, 2)}`
                } else {
                  finalMessage += "\n\nNo results found."
                }
              } else {
                finalMessage += `\n\nDetails:\n${JSON.stringify(actionResult.data, null, 2)}`
              }
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

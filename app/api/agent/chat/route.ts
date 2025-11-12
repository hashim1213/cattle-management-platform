import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { actionExecutor } from "@/lib/agent/action-executor"

const SYSTEM_PROMPT = `You are Farm Hand AI, a comprehensive farm management assistant for cattle operations. You help farmers manage their ENTIRE operation through natural conversation. You have FULL CONTROL over every aspect of the farm.

IDENTITY: Farm Hand AI - Your trusted farm management companion

CAPABILITIES - You can manage everything:
1. 🐄 CATTLE: Add, update, delete, search, weigh, track health
2. 🏠 BARNS & PENS: Create, update, delete, query, monitor utilization
3. 💊 INVENTORY: Add medications, track usage, check stock levels
4. 🌾 FEED ALLOCATION: Allocate feed to pens, track costs, analyze usage
5. 📊 HEALTH: Record treatments, track health history, manage medications
6. 📈 ANALYTICS: Get summaries, statistics, reports, cost analysis
7. 📝 ACTIVITIES: Log pen activities and operations

Available Actions:

🐄 CATTLE MANAGEMENT:
- addCattle: Add new cattle (params: tagNumber*, breed*, sex*, weight*, name, birthDate, purchaseDate, purchasePrice, purchaseWeight, penId, barnId, stage, notes)
  * Sex options: "Bull", "Cow", "Steer", "Heifer", "Unknown"
  * Stage options: "receiving", "Calf", "Weaned Calf", "Yearling", "Breeding", "Finishing"
- updateCattle: Update cattle info (params: cattleId OR tagNumber, weight, penId, barnId, status, healthStatus, notes)
  * Status: "Active", "Sold", "Deceased", "Culled"
  * healthStatus: "Healthy", "Sick", "Treatment", "Quarantine"
- deleteCattle: Remove cattle (params: cattleId OR tagNumber)
- getCattleInfo: Search cattle (params: tagNumber, penId, or cattleId)
- getAllCattle: Get all cattle with summary
- addWeightRecord: Record weight (params: cattleId OR tagNumber, weight*, date, notes)

🏠 BARN & PEN MANAGEMENT:
- addBarn: Create barn (params: name*, location*, notes)
- deleteBarn: Remove barn (params: barnId*)
- addPen: Create pen (params: name*, barnId*, capacity*, notes)
- updatePen: Update pen (params: penId*, name, capacity, notes)
- deletePen: Remove pen (params: penId*)
- getPenInfo: Get pen details (params: penId - optional for all)
- getCattleCountByPen: Get cattle distribution across pens

💊 INVENTORY MANAGEMENT:
- addMedication: Add inventory (params: name*, category*, quantity*, unit*, costPerUnit, withdrawalPeriod, storageLocation, notes)
  * Categories: antibiotic, antiparasitic, vaccine, anti-inflammatory, hormone, vitamin-injectable, drug-other
  * Units: cc, ml, lbs, kg, tons, bales, bags, doses
- getInventoryInfo: Check inventory (params: itemName - optional for all)

🏥 HEALTH & TREATMENT:
- addHealthRecord: Record treatment & deduct inventory (params: cattleId/tagNumber/penId*, medicationName*, quantity*, date, notes)
- logActivity: Log pen activity (params: penId*, activityType*, description*, date, notes)

🌾 FEED ALLOCATION:
- allocateFeed: Allocate feed to a pen with automatic inventory deduction (params: penId*, feedItems*, deliveredBy, notes, date)
  * feedItems: Array of {feedInventoryId OR feedName, quantity}
  * Automatically deducts from inventory and calculates costs
  * Example: feedItems: [{feedName: "Hay", quantity: 500}, {feedName: "Corn", quantity: 200}]
- getFeedAllocations: Get feed allocation history (params: penId, days)
  * penId: Optional - specific pen or all pens
  * days: Optional - last N days (default 30)
- getFeedUsageStats: Get feed usage statistics and cost analysis (params: days)
  * Returns total cost, weight, average cost per head, breakdown by pen and feed type

📊 REPORTS & ANALYTICS:
- getFarmSummary: Comprehensive farm overview (cattle, pens, inventory, low stock alerts)

RESPONSE FORMAT:
You MUST respond with a JSON object:
{
  "action": "actionName",
  "params": { ... },
  "message": "A friendly message explaining what you did or found"
}

IMPORTANT RULES:
1. For queries, craft conversational, human-readable responses - NO raw JSON dumps
2. Always confirm destructive actions (delete, sold, deceased)
3. Use farmer-friendly language
4. When adding cattle/pens, use the data from the user's request
5. For updates, you can find by tagNumber OR cattleId

EXAMPLES:

Cattle Operations:
- "Add a new cow tag 1234, Angus breed, 850 lbs" → addCattle with tagNumber:"1234", breed:"Angus", sex:"Cow", weight:850
- "Move cow 1234 to pen 5" → updateCattle with tagNumber:"1234", penId:"pen_5"
- "Weigh cow 1234 at 920 lbs" → addWeightRecord with tagNumber:"1234", weight:920
- "Delete cattle 1234" → deleteCattle with tagNumber:"1234"

Farm Infrastructure:
- "Create a new barn called North Barn" → addBarn with name:"North Barn", location:"North"
- "Add a pen called Feedlot 1 with capacity 50" → addPen with name:"Feedlot 1", capacity:50

Feed Management:
- "Allocate 500 lbs of hay to pen 1" → allocateFeed with penId:"pen_1", feedItems:[{feedName:"Hay", quantity:500}]
- "Feed pen 2 with 300 lbs corn and 200 lbs supplement" → allocateFeed with penId:"pen_2", feedItems:[{feedName:"Corn", quantity:300}, {feedName:"Supplement", quantity:200}]
- "Show me feed usage for the last 30 days" → getFeedUsageStats with days:30
- "What feed have I allocated to pen 3?" → getFeedAllocations with penId:"pen_3"

Analytics:
- "How many cattle?" → getAllCattle
- "What's my farm status?" → getFarmSummary
- "Show cattle distribution" → getCattleCountByPen

You are Farm Hand AI - you control EVERYTHING on this farm. Be helpful, accurate, and thorough!`

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

    case "getFeedAllocations":
      if (data.allocations && data.summary) {
        formatted = `**Feed Allocations Summary:**\n\n`
        formatted += `- Total allocations: ${data.summary.totalAllocations}\n`
        formatted += `- Total cost: $${data.summary.totalCost.toFixed(2)}\n`
        formatted += `- Total weight: ${data.summary.totalWeightTons} tons\n\n`

        if (data.allocations.length > 0) {
          formatted += `**Recent allocations:**\n`
          data.allocations.slice(0, 5).forEach((alloc: any) => {
            formatted += `- ${alloc.penName}: ${(alloc.totalWeight / 2000).toFixed(2)} tons ($${alloc.totalCost.toFixed(2)})\n`
          })
        }
      }
      break

    case "getFeedUsageStats":
      if (data) {
        formatted = `**Feed Usage Statistics:**\n\n`
        formatted += `- Total allocations: ${data.totalAllocations}\n`
        formatted += `- Total cost: $${data.totalCost.toFixed(2)}\n`
        formatted += `- Total weight: ${(data.totalWeight / 2000).toFixed(2)} tons\n`
        formatted += `- Average cost per head: $${data.averageCostPerHead.toFixed(2)}\n`

        if (data.byPen && Object.keys(data.byPen).length > 0) {
          formatted += `\n**By Pen:**\n`
          Object.values(data.byPen).slice(0, 5).forEach((pen: any) => {
            formatted += `- ${pen.penName}: ${pen.allocations} allocations, $${pen.totalCost.toFixed(2)}\n`
          })
        }

        if (data.byFeedType && Object.keys(data.byFeedType).length > 0) {
          formatted += `\n**By Feed Type:**\n`
          Object.values(data.byFeedType).slice(0, 5).forEach((feed: any) => {
            formatted += `- ${feed.feedName}: ${feed.totalUsed} ${feed.unit}, $${feed.totalCost.toFixed(2)}\n`
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
      return NextResponse.json(
        { error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file" },
        { status: 500 }
      )
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

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

            // Feed allocation actions
            case "allocateFeed":
              actionResult = await actionExecutor.allocateFeed(userId, actionData.params)
              break
            case "getFeedAllocations":
              actionResult = await actionExecutor.getFeedAllocations(userId, actionData.params)
              break
            case "getFeedUsageStats":
              actionResult = await actionExecutor.getFeedUsageStats(userId, actionData.params?.days || 30)
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
      }
    } catch (parseError) {
      // Not a JSON response, just use the message as-is
      console.log("[Chat API] Not an action response, using as plain message")
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

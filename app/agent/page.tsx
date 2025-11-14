"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mic, MicOff, Send, Loader2, MessageSquare, History, Trash2, User, Bot, Sparkles, Plus, Package, Activity, BarChart3, Stethoscope, Home, ChevronDown, ChevronUp } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, onSnapshot } from "firebase/firestore"
import { toast } from "sonner"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: string
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
}

export default function AgentPage() {
  const { user } = useAuth()
  const [currentMessages, setCurrentMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
      })
    }
  }, [currentMessages])

  // Set up real-time listener for conversation history
  useEffect(() => {
    if (!user) {
      setConversations([])
      return
    }

    setIsLoadingHistory(true)

    const conversationsRef = collection(db, `users/${user.uid}/conversations`)
    const q = query(conversationsRef, orderBy("updatedAt", "desc"))

    // Set up real-time listener
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const loadedConversations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Conversation))

        setConversations(loadedConversations)
        setIsLoadingHistory(false)
      },
      (error) => {
        console.error("Error loading conversations:", error)
        toast.error("Failed to load conversation history")
        setIsLoadingHistory(false)
      }
    )

    // Cleanup listener on unmount or user change
    return () => unsubscribe()
  }, [user])

  const loadConversationHistory = async () => {
    // This function is kept for backward compatibility but is no longer needed
    // Real-time listener handles conversation loading automatically
  }

  const saveConversation = async (messages: Message[]) => {
    if (!user || messages.length === 0) return

    try {
      const now = new Date().toISOString()
      const title = messages[0]?.content.substring(0, 50) + (messages[0]?.content.length > 50 ? "..." : "")

      if (currentConversationId) {
        // Update existing conversation
        const conversationRef = doc(db, `users/${user.uid}/conversations`, currentConversationId)
        await deleteDoc(conversationRef)
      }

      // Create new conversation
      const conversationsRef = collection(db, `users/${user.uid}/conversations`)
      const docRef = await addDoc(conversationsRef, {
        title,
        messages,
        createdAt: currentConversationId ? conversations.find(c => c.id === currentConversationId)?.createdAt || now : now,
        updatedAt: now
      })

      setCurrentConversationId(docRef.id)
      // Real-time listener will update conversations automatically
    } catch (error) {
      console.error("Error saving conversation:", error)
    }
  }

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      role: "user",
      content,
      timestamp: new Date().toISOString()
    }

    const updatedMessages = [...currentMessages, userMessage]
    setCurrentMessages(updatedMessages)
    setInputMessage("")
    setIsLoading(true)

    try {
      if (!user?.uid) {
        throw new Error("You must be logged in to use the Farm Assistant")
      }

      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          conversationId: currentConversationId,
          userId: user.uid
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send message")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
        timestamp: new Date().toISOString()
      }

      const finalMessages = [...updatedMessages, assistantMessage]
      setCurrentMessages(finalMessages)
      await saveConversation(finalMessages)

      if (data.actionResult && data.actionResult.success) {
        toast.success(data.actionResult.message)
      } else if (data.actionResult && !data.actionResult.success) {
        toast.error(data.actionResult.message || "Action failed")
      }
    } catch (error: any) {
      console.error("Error sending message:", error)
      toast.error(error.message || "Failed to send message. Please check your OpenAI API key.")
    } finally {
      setIsLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data])
        }
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" })
        await transcribeAudio(audioBlob)
        setAudioChunks([])

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      toast.info("Recording started...")
    } catch (error) {
      console.error("Error starting recording:", error)
      toast.error("Failed to start recording. Please check microphone permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      toast.info("Processing audio...")
    }
  }

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("audio", audioBlob, "recording.webm")

      const response = await fetch("/api/agent/transcribe", {
        method: "POST",
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to transcribe audio")
      }

      const data = await response.json()

      if (data.transcript) {
        toast.success("Transcription complete!")
        await sendMessage(data.transcript)
      }
    } catch (error: any) {
      console.error("Error transcribing audio:", error)
      toast.error(error.message || "Failed to transcribe audio")
      setIsLoading(false)
    }
  }

  const loadConversation = (conversation: Conversation) => {
    setCurrentMessages(conversation.messages)
    setCurrentConversationId(conversation.id)
  }

  const startNewConversation = () => {
    setCurrentMessages([])
    setCurrentConversationId(null)
  }

  const deleteConversation = async (conversationId: string) => {
    if (!user) return

    try {
      await deleteDoc(doc(db, `users/${user.uid}/conversations`, conversationId))
      setConversations(prev => prev.filter(c => c.id !== conversationId))

      if (currentConversationId === conversationId) {
        startNewConversation()
      }

      toast.success("Conversation deleted")
    } catch (error) {
      console.error("Error deleting conversation:", error)
      toast.error("Failed to delete conversation")
    }
  }

  // Quick action templates for easy access
  const quickActions = [
    {
      category: "Cattle",
      icon: "🐄",
      color: "orange",
      actions: [
        { label: "Add New Cattle", template: "Add a new cow, tag [TAG_NUMBER], [BREED] breed, [WEIGHT] lbs" },
        { label: "Weigh Cattle", template: "Weigh cow [TAG_NUMBER] at [WEIGHT] lbs" },
        { label: "Move to Pen", template: "Move cow [TAG_NUMBER] to pen [PEN_ID]" },
        { label: "View All Cattle", template: "How many cattle do I have?" },
      ]
    },
    {
      category: "Pens",
      icon: "🏠",
      color: "green",
      actions: [
        { label: "View All Pens", template: "Show me all my pens" },
        { label: "Create New Pen", template: "Create a new pen called [PEN_NAME] with capacity [NUMBER]" },
        { label: "Pen Status", template: "What's the status of pen [PEN_ID]?" },
        { label: "Cattle by Pen", template: "Show me cattle count by pen" },
      ]
    },
    {
      category: "Inventory",
      icon: "💊",
      color: "purple",
      actions: [
        { label: "Check Inventory", template: "Check my inventory" },
        { label: "Add Medication", template: "Add medication [NAME], quantity [AMOUNT] [UNIT]" },
        { label: "Low Stock Alert", template: "What items are low in stock?" },
        { label: "Use Medication", template: "Use [AMOUNT] [UNIT] of [MEDICATION] on cow [TAG_NUMBER]" },
      ]
    },
    {
      category: "Health",
      icon: "🏥",
      color: "red",
      actions: [
        { label: "Record Treatment", template: "Record treatment for cow [TAG_NUMBER] with [MEDICATION], [AMOUNT] [UNIT]" },
        { label: "Check Health", template: "Show me health records for cow [TAG_NUMBER]" },
        { label: "Sick Cattle", template: "Show me all sick cattle" },
        { label: "Quarantine", template: "Quarantine cow [TAG_NUMBER]" },
      ]
    },
    {
      category: "Reports",
      icon: "📊",
      color: "blue",
      actions: [
        { label: "Farm Summary", template: "What's my farm status?" },
        { label: "Growth Report", template: "Show me weight gain for cow [TAG_NUMBER]" },
        { label: "Cost Analysis", template: "What are my total costs?" },
        { label: "Performance", template: "Show me my best performing cattle" },
      ]
    }
  ]

  const handleQuickAction = (template: string) => {
    setInputMessage(template)
    setShowQuickActions(false)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-2xl">🌾</span>
              Farm Assistant
            </h1>
            <p className="text-sm text-muted-foreground">
              AI-powered farm management
            </p>
          </div>
          <Tabs defaultValue="chat" className="w-auto">
            <TabsList>
              <TabsTrigger value="chat" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="chat" className="h-full flex flex-col">
          <TabsContent value="chat" className="flex-1 m-0 data-[state=inactive]:hidden h-full">
            <div className="h-full flex flex-col">
                <div className="flex-1 overflow-hidden bg-gradient-to-b from-background to-muted/20">
                  <ScrollArea className="h-full" ref={scrollAreaRef}>
                    <div className="max-w-4xl mx-auto px-4 py-6">
                    {currentMessages.length === 0 && (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
                          <Sparkles className="h-8 w-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Welcome to Farm Assistant</h2>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                          Your AI-powered farm management companion. Click any card below or use Quick Actions:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto mb-8">
                          <button
                            onClick={() => setInputMessage("What's my farm status?")}
                            className="group p-4 bg-card hover:bg-accent border rounded-xl text-left transition-all hover:shadow-md hover:scale-[1.02]"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-2xl">📊</span>
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold mb-1 group-hover:text-primary transition-colors">Farm Overview</p>
                                <p className="text-xs text-muted-foreground">Complete farm statistics</p>
                              </div>
                            </div>
                          </button>

                          <button
                            onClick={() => setInputMessage("How many cattle do I have?")}
                            className="group p-4 bg-card hover:bg-accent border rounded-xl text-left transition-all hover:shadow-md hover:scale-[1.02]"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-2xl">🐄</span>
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold mb-1 group-hover:text-primary transition-colors">View Cattle</p>
                                <p className="text-xs text-muted-foreground">See all your cattle</p>
                              </div>
                            </div>
                          </button>

                          <button
                            onClick={() => setInputMessage("Show me all my pens")}
                            className="group p-4 bg-card hover:bg-accent border rounded-xl text-left transition-all hover:shadow-md hover:scale-[1.02]"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-2xl">🏠</span>
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold mb-1 group-hover:text-primary transition-colors">View Pens</p>
                                <p className="text-xs text-muted-foreground">Check all pens</p>
                              </div>
                            </div>
                          </button>

                          <button
                            onClick={() => setInputMessage("Check my inventory")}
                            className="group p-4 bg-card hover:bg-accent border rounded-xl text-left transition-all hover:shadow-md hover:scale-[1.02]"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-2xl">💊</span>
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold mb-1 group-hover:text-primary transition-colors">Check Inventory</p>
                                <p className="text-xs text-muted-foreground">Medications & supplies</p>
                              </div>
                            </div>
                          </button>

                          <button
                            onClick={() => setInputMessage("Add a new cow, tag [TAG_NUMBER], [BREED] breed, [WEIGHT] lbs")}
                            className="group p-4 bg-card hover:bg-accent border rounded-xl text-left transition-all hover:shadow-md hover:scale-[1.02]"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-2xl">➕</span>
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold mb-1 group-hover:text-primary transition-colors">Add Cattle</p>
                                <p className="text-xs text-muted-foreground">Register new cattle</p>
                              </div>
                            </div>
                          </button>

                          <button
                            onClick={() => setInputMessage("What items are low in stock?")}
                            className="group p-4 bg-card hover:bg-accent border rounded-xl text-left transition-all hover:shadow-md hover:scale-[1.02]"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-2xl">⚠️</span>
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold mb-1 group-hover:text-primary transition-colors">Low Stock</p>
                                <p className="text-xs text-muted-foreground">Check alerts</p>
                              </div>
                            </div>
                          </button>
                        </div>

                        <div className="max-w-xl mx-auto bg-muted/50 border rounded-lg p-4">
                          <p className="text-sm font-medium mb-2">💡 Pro Tips for Easy Use:</p>
                          <ul className="text-xs text-muted-foreground space-y-1 text-left">
                            <li>• Click <strong>Quick Actions</strong> button for templates</li>
                            <li>• Use the <strong>microphone</strong> for hands-free voice commands</li>
                            <li>• Replace [BRACKETS] in templates with your actual values</li>
                            <li>• Try natural language: "How many cattle in pen 5?"</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {currentMessages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex gap-3 mb-6 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                      >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                        }`}>
                          {message.role === "user" ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </div>
                        <div className={`flex-1 max-w-[85%] ${message.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                          <div
                            className={`rounded-2xl px-4 py-3 ${
                              message.role === "user"
                                ? "bg-primary text-primary-foreground rounded-tr-sm"
                                : "bg-card border rounded-tl-sm shadow-sm"
                            }`}
                          >
                            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5 px-1">
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex gap-3 mb-6">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-card border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </div>

                <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <div className="max-w-4xl mx-auto">
                    {/* Quick Actions Panel - Mobile Optimized */}
                    {showQuickActions && (
                      <div className="border-b p-3 sm:p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            Quick Actions
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowQuickActions(false)}
                            className="h-8 touch-manipulation"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                        <ScrollArea className="max-h-[60vh] sm:max-h-[300px]">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pr-2 sm:pr-4">
                            {quickActions.map((category, idx) => (
                              <div key={idx} className="space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-base sm:text-lg">{category.icon}</span>
                                  <span className="text-sm font-medium">{category.category}</span>
                                </div>
                                <div className="space-y-1.5">
                                  {category.actions.map((action, actionIdx) => (
                                    <button
                                      key={actionIdx}
                                      onClick={() => handleQuickAction(action.template)}
                                      className="w-full text-left px-3 py-2.5 text-sm bg-card hover:bg-accent active:bg-accent border rounded-lg transition-colors touch-manipulation min-h-[44px] flex items-center"
                                      disabled={isLoading || isRecording}
                                    >
                                      {action.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}

                    <div className="p-4">
                      {/* Action Buttons Row - Mobile Optimized */}
                      <div className="mb-3">
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                          <Button
                            onClick={() => setShowQuickActions(!showQuickActions)}
                            variant="outline"
                            size="sm"
                            className="flex-shrink-0 touch-manipulation min-h-[36px]"
                            disabled={isLoading || isRecording}
                          >
                            <Plus className="h-4 w-4 mr-1.5" />
                            <span className="whitespace-nowrap">Quick Actions</span>
                            {showQuickActions ? <ChevronDown className="h-3 w-3 ml-1.5" /> : <ChevronUp className="h-3 w-3 ml-1.5" />}
                          </Button>
                          <div className="hidden sm:flex gap-2">
                            {quickActions.slice(0, 3).map((category, idx) => (
                              <Button
                                key={idx}
                                onClick={() => {
                                  const firstAction = category.actions[0]
                                  if (firstAction) {
                                    handleQuickAction(firstAction.template)
                                  }
                                }}
                                variant="outline"
                                size="sm"
                                className="flex-shrink-0 touch-manipulation"
                                disabled={isLoading || isRecording}
                              >
                                <span className="mr-1.5">{category.icon}</span>
                                <span className="whitespace-nowrap">{category.category}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Input Area - Mobile Optimized */}
                      <div className="flex gap-2 items-end">
                        <Button
                          onClick={isRecording ? stopRecording : startRecording}
                          variant={isRecording ? "destructive" : "default"}
                          size="icon"
                          disabled={isLoading}
                          className="flex-shrink-0 h-11 w-11 sm:h-12 sm:w-12 touch-manipulation"
                          title={isRecording ? "Stop recording" : "Start voice input"}
                        >
                          {isRecording ? (
                            <MicOff className="h-5 w-5 sm:h-6 sm:w-6" />
                          ) : (
                            <Mic className="h-5 w-5 sm:h-6 sm:w-6" />
                          )}
                        </Button>

                        <div className="flex-1 relative">
                          <Textarea
                            placeholder="Type a message or use Quick Actions..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                sendMessage(inputMessage)
                              }
                            }}
                            className="min-h-[52px] max-h-[200px] resize-none pr-12 rounded-2xl text-base touch-manipulation"
                            disabled={isLoading || isRecording}
                          />
                          <Button
                            onClick={() => sendMessage(inputMessage)}
                            disabled={!inputMessage.trim() || isLoading || isRecording}
                            size="icon"
                            className="absolute right-2 bottom-2 h-9 w-9 rounded-lg touch-manipulation"
                          >
                            {isLoading ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <Send className="h-5 w-5" />
                            )}
                          </Button>
                        </div>

                        {currentMessages.length > 0 && (
                          <Button
                            onClick={startNewConversation}
                            variant="outline"
                            size="icon"
                            disabled={isLoading}
                            className="hidden sm:flex flex-shrink-0 h-12 w-12 touch-manipulation"
                            title="Start new conversation"
                          >
                            <MessageSquare className="h-5 w-5" />
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2 flex-wrap gap-1">
                        <p className="text-xs text-muted-foreground">
                          <span className="hidden sm:inline">Press Enter to send • Shift+Enter for new line</span>
                          <span className="sm:hidden">Tap send or press Enter</span>
                        </p>
                        {inputMessage.includes('[') && (
                          <p className="text-xs text-orange-600 font-medium">
                            Replace [BRACKETS] with your values
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          </TabsContent>

          <TabsContent value="history" className="flex-1 m-0 data-[state=inactive]:hidden h-full">
            <div className="h-full flex flex-col bg-gradient-to-b from-background to-muted/20">
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="max-w-4xl mx-auto px-4 py-6">
                  {isLoadingHistory ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Loading conversations...</p>
                      </div>
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
                        <History className="h-8 w-8 text-primary" />
                      </div>
                      <h2 className="text-xl font-bold mb-2">No Conversations Yet</h2>
                      <p className="text-muted-foreground max-w-sm mx-auto">
                        Start chatting with Farm Assistant to build your conversation history
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 pb-4">
                      {conversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className="group bg-card border rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.01]"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div
                              className="flex-1"
                              onClick={() => {
                                loadConversation(conversation)
                                // Switch to chat tab
                                const chatTab = document.querySelector('[value="chat"]') as HTMLElement
                                chatTab?.click()
                              }}
                            >
                              <div className="flex items-start gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                  <MessageSquare className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">{conversation.title}</h3>
                                  <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-xs text-muted-foreground">
                                      {conversation.messages.length} messages
                                    </span>
                                    <span className="text-xs text-muted-foreground">•</span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(conversation.updatedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteConversation(conversation.id)
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  </div>
                  </ScrollArea>
                </div>
              </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mic, MicOff, Send, Loader2, MessageSquare, History, Trash2 } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore"
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

  // Load conversation history
  useEffect(() => {
    if (user) {
      loadConversationHistory()
    }
  }, [user])

  const loadConversationHistory = async () => {
    if (!user) return

    setIsLoadingHistory(true)
    try {
      const conversationsRef = collection(db, `users/${user.uid}/conversations`)
      const q = query(conversationsRef, orderBy("updatedAt", "desc"))
      const snapshot = await getDocs(q)

      const loadedConversations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Conversation))

      setConversations(loadedConversations)
    } catch (error) {
      console.error("Error loading conversations:", error)
      toast.error("Failed to load conversation history")
    } finally {
      setIsLoadingHistory(false)
    }
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
      await loadConversationHistory()
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

  return (
    <div className="h-full p-4 lg:p-6 overflow-hidden">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Farm Assistant</h1>
          <p className="text-muted-foreground">
            Chat or speak to manage your farm operations
          </p>
        </div>

        <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mb-4">
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 mt-0">
            <Card className="flex-1 flex flex-col min-h-0">
              <CardHeader>
                <CardTitle>Chat with Farm Assistant</CardTitle>
                <CardDescription>
                  Ask me to add medications, update pens, log activities, or get information
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0 p-0">
                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full px-6" ref={scrollAreaRef}>
                    <div className="space-y-4 pb-4 pt-4">
                    {currentMessages.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Farm Assistant - Full Control</p>
                        <p className="text-sm mt-2 mb-4">
                          I can manage your entire farm. Try these quick actions:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-3xl mx-auto text-left">
                          <button
                            onClick={() => setInputMessage("How many cattle do I have?")}
                            className="p-3 text-sm bg-muted hover:bg-accent rounded-lg text-left transition-colors"
                          >
                            <strong>📊 Farm Overview</strong>
                            <br />
                            <span className="text-xs text-muted-foreground">Get complete farm statistics</span>
                          </button>

                          <button
                            onClick={() => setInputMessage("Show me all my pens")}
                            className="p-3 text-sm bg-muted hover:bg-accent rounded-lg text-left transition-colors"
                          >
                            <strong>🏠 List Pens</strong>
                            <br />
                            <span className="text-xs text-muted-foreground">View all pens and cattle distribution</span>
                          </button>

                          <button
                            onClick={() => setInputMessage("Check my inventory")}
                            className="p-3 text-sm bg-muted hover:bg-accent rounded-lg text-left transition-colors"
                          >
                            <strong>💊 Check Inventory</strong>
                            <br />
                            <span className="text-xs text-muted-foreground">View all medications and stock levels</span>
                          </button>

                          <button
                            onClick={() => setInputMessage("Add a new cow, tag 1001, Angus breed, 850 lbs")}
                            className="p-3 text-sm bg-muted hover:bg-accent rounded-lg text-left transition-colors"
                          >
                            <strong>🐄 Add Cattle</strong>
                            <br />
                            <span className="text-xs text-muted-foreground">Add new cattle to your herd</span>
                          </button>

                          <button
                            onClick={() => setInputMessage("Create a new pen called North Pen with capacity 50")}
                            className="p-3 text-sm bg-muted hover:bg-accent rounded-lg text-left transition-colors"
                          >
                            <strong>➕ Create Pen</strong>
                            <br />
                            <span className="text-xs text-muted-foreground">Add a new pen to your barn</span>
                          </button>

                          <button
                            onClick={() => setInputMessage("Add 1000ml of Draxxin antibiotic to inventory")}
                            className="p-3 text-sm bg-muted hover:bg-accent rounded-lg text-left transition-colors"
                          >
                            <strong>💉 Add Medication</strong>
                            <br />
                            <span className="text-xs text-muted-foreground">Stock up your inventory</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {currentMessages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg px-4 py-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </div>

                <div className="border-t p-4 space-y-3">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your message or use voice..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage(inputMessage)
                        }
                      }}
                      className="min-h-[80px] resize-none"
                      disabled={isLoading || isRecording}
                    />
                  </div>

                  <div className="flex gap-2 justify-between">
                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      variant={isRecording ? "destructive" : "outline"}
                      size="lg"
                      disabled={isLoading}
                      className="gap-2"
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="h-5 w-5" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="h-5 w-5" />
                          Voice Input
                        </>
                      )}
                    </Button>

                    <div className="flex gap-2">
                      {currentMessages.length > 0 && (
                        <Button
                          onClick={startNewConversation}
                          variant="outline"
                          size="lg"
                          disabled={isLoading}
                        >
                          New Chat
                        </Button>
                      )}
                      <Button
                        onClick={() => sendMessage(inputMessage)}
                        disabled={!inputMessage.trim() || isLoading || isRecording}
                        size="lg"
                        className="gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Send className="h-5 w-5" />
                            Send
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="flex-1 flex flex-col min-h-0 mt-0">
            <Card className="flex-1 flex flex-col min-h-0">
              <CardHeader>
                <CardTitle>Conversation History</CardTitle>
                <CardDescription>
                  View and revisit your past conversations
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0 p-0">
                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full px-6">
                  {isLoadingHistory ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No conversation history</p>
                      <p className="text-sm mt-2">
                        Start chatting to build your conversation history
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 pb-4">
                      {conversations.map((conversation) => (
                        <Card
                          key={conversation.id}
                          className="cursor-pointer hover:bg-accent transition-colors"
                        >
                          <CardContent className="p-4">
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
                                <h3 className="font-medium mb-1">{conversation.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {conversation.messages.length} messages
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Last updated: {new Date(conversation.updatedAt).toLocaleString()}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteConversation(conversation.id)
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

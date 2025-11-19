"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, X, Clock, Zap, User } from "lucide-react"
import { otherCostsService, type OtherCostInput, type OtherCost } from "@/lib/other-costs-service"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface AddOtherCostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  quickCategory?: OtherCost["category"]
  quickDescription?: string
}

const CATEGORY_OPTIONS: { value: OtherCost["category"]; label: string; description: string }[] = [
  { value: "labour", label: "Labour", description: "Wages and employee costs" },
  { value: "utilities", label: "Utilities", description: "Water, electricity, gas" },
  { value: "equipment", label: "Equipment", description: "Tools, machinery purchases" },
  { value: "maintenance", label: "Maintenance", description: "Repairs and upkeep" },
  { value: "transportation", label: "Transportation", description: "Fuel, vehicle costs" },
  { value: "insurance", label: "Insurance", description: "Farm insurance premiums" },
  { value: "taxes", label: "Property Taxes", description: "Land and property taxes" },
  { value: "veterinary", label: "Veterinary Services", description: "Vet visits and services" },
  { value: "other", label: "Other", description: "Miscellaneous expenses" },
]

// Quick add templates
const QUICK_TEMPLATES = [
  { category: "labour" as const, description: "Weekly wages", icon: "👷" },
  { category: "utilities" as const, description: "Electric bill", icon: "⚡" },
  { category: "transportation" as const, description: "Fuel", icon: "⛽" },
  { category: "maintenance" as const, description: "Equipment repair", icon: "🔧" },
  { category: "veterinary" as const, description: "Vet visit", icon: "🏥" },
  { category: "equipment" as const, description: "Tool purchase", icon: "🛠️" },
]

export function AddOtherCostDialog({ open, onOpenChange, onSuccess, quickCategory, quickDescription }: AddOtherCostDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [recentPayees, setRecentPayees] = useState<string[]>([])

  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [category, setCategory] = useState<OtherCost["category"]>(quickCategory || "labour")
  const [description, setDescription] = useState(quickDescription || "")
  const [amount, setAmount] = useState("")
  const [payee, setPayee] = useState("")
  const [notes, setNotes] = useState("")
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)

  // Load recent payees
  useEffect(() => {
    const loadRecentPayees = async () => {
      if (!user) return
      try {
        const costs = await otherCostsService.getAllCosts(user.uid)
        const uniquePayees = [...new Set(costs.map(c => c.payee).filter(Boolean))] as string[]
        setRecentPayees(uniquePayees.slice(0, 5))
      } catch (error) {
        console.error("Failed to load recent payees:", error)
      }
    }
    if (open) {
      loadRecentPayees()
    }
  }, [user, open])

  // Set quick values if provided
  useEffect(() => {
    if (quickCategory) setCategory(quickCategory)
    if (quickDescription) setDescription(quickDescription)
  }, [quickCategory, quickDescription])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or image file (JPG, PNG)",
          variant: "destructive",
        })
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        })
        return
      }

      setInvoiceFile(file)
    }
  }

  const handleQuickTemplate = (template: typeof QUICK_TEMPLATES[0]) => {
    setCategory(template.category)
    setDescription(template.description)
    // Focus on amount field after selecting template
    setTimeout(() => {
      document.getElementById("amount")?.focus()
    }, 100)
  }

  const handleSubmit = async () => {
    if (!user) return

    if (!description || !amount) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (Number(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Amount must be greater than 0",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const costInput: OtherCostInput = {
        date,
        category,
        description,
        amount: Number(amount),
        payee: payee || undefined,
        notes: notes || undefined,
      }

      await otherCostsService.addCost(user.uid, costInput, invoiceFile || undefined)

      toast({
        title: "Cost added",
        description: "The cost record has been added successfully",
      })

      // Reset form
      setDate(new Date().toISOString().split("T")[0])
      setCategory(quickCategory || "labour")
      setDescription(quickDescription || "")
      setAmount("")
      setPayee("")
      setNotes("")
      setInvoiceFile(null)

      onSuccess()
    } catch (error) {
      console.error("Failed to add cost:", error)
      toast({
        title: "Error",
        description: "Failed to add cost. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Add Operating Cost
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="quick" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quick" className="gap-2">
              <Zap className="h-4 w-4" />
              Quick Add
            </TabsTrigger>
            <TabsTrigger value="detailed" className="gap-2">
              <FileText className="h-4 w-4" />
              Detailed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="space-y-4">
            {/* Quick Templates */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Common Expenses</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {QUICK_TEMPLATES.map((template) => (
                  <Button
                    key={template.description}
                    variant={category === template.category && description === template.description ? "default" : "outline"}
                    className="h-auto py-3 flex flex-col gap-1"
                    onClick={() => handleQuickTemplate(template)}
                  >
                    <span className="text-xl">{template.icon}</span>
                    <span className="text-xs">{template.description}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Quick Form */}
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quick-date">Date *</Label>
                  <Input
                    id="quick-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="150.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-lg font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quick-description">Description *</Label>
                <Input
                  id="quick-description"
                  placeholder="e.g., Weekly wages for 2 workers"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Recent Payees */}
              {recentPayees.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Recent Payees (Optional)
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {recentPayees.map((p) => (
                      <Badge
                        key={p}
                        variant={payee === p ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setPayee(p)}
                      >
                        {p}
                      </Badge>
                    ))}
                    {payee && !recentPayees.includes(payee) && (
                      <Badge variant="secondary">{payee}</Badge>
                    )}
                  </div>
                  <Input
                    placeholder="Or type a new payee..."
                    value={payee}
                    onChange={(e) => setPayee(e.target.value)}
                    className="mt-2"
                  />
                </div>
              )}

              {!recentPayees.length && (
                <div className="space-y-2">
                  <Label htmlFor="quick-payee">Paid To (Optional)</Label>
                  <Input
                    id="quick-payee"
                    placeholder="e.g., John Smith, ABC Equipment Co."
                    value={payee}
                    onChange={(e) => setPayee(e.target.value)}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="detailed-amount">Amount ($) *</Label>
                <Input
                  id="detailed-amount"
                  type="number"
                  step="0.01"
                  placeholder="150.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={(val) => setCategory(val as OtherCost["category"])}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="detailed-description">Description *</Label>
              <Input
                id="detailed-description"
                placeholder="e.g., Weekly wages for 2 workers"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="detailed-payee">Paid To (Optional)</Label>
              <Input
                id="detailed-payee"
                placeholder="e.g., John Smith, ABC Equipment Co."
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional details..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice">Invoice/Receipt (Optional)</Label>
              <div className="border-2 border-dashed rounded-lg p-4">
                {invoiceFile ? (
                  <div className="flex items-center justify-between bg-muted p-3 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{invoiceFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(invoiceFile.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setInvoiceFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label htmlFor="invoice" className="cursor-pointer">
                    <div className="flex flex-col items-center justify-center py-4">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium text-foreground">
                        Click to upload invoice or receipt
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF or Image (JPG, PNG) • Max 5MB
                      </p>
                    </div>
                    <input
                      id="invoice"
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Adding..." : "Add Cost"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

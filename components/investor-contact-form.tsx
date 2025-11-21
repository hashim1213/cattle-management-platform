"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Loader2 } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export function InvestorContactForm() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    investmentInterest: "",
    message: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Save to Firebase
      await addDoc(collection(db, "investorContacts"), {
        ...formData,
        submittedAt: serverTimestamp(),
        status: "new",
      })

      // Show success message
      toast({
        title: "Thank you for your interest!",
        description: "We'll get back to you within 24-48 hours.",
      })

      // Reset form and close dialog
      setFormData({
        name: "",
        email: "",
        company: "",
        phone: "",
        investmentInterest: "",
        message: "",
      })
      setOpen(false)
    } catch (error) {
      console.error("Error submitting contact form:", error)
      toast({
        title: "Error",
        description: "Failed to submit form. Please try again or email us directly at contact@cattleos.com",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="gap-2 bg-[#ba2627] hover:bg-[#9a1f20] text-white text-lg px-8 py-6"
        >
          <Mail className="h-5 w-5" />
          Contact the CattleOS Team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Get in Touch</DialogTitle>
          <DialogDescription>
            Tell us about your investment interest and we'll get back to you within 24-48 hours.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company/Organization</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Acme Ventures"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="investmentInterest">
              Investment Interest <span className="text-destructive">*</span>
            </Label>
            <Input
              id="investmentInterest"
              required
              value={formData.investmentInterest}
              onChange={(e) => setFormData({ ...formData, investmentInterest: e.target.value })}
              placeholder="e.g., Seed round, Strategic partnership, Advisory role"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">
              Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="message"
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Tell us about your background and why you're interested in CattleOS..."
              rows={5}
              className="resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#ba2627] hover:bg-[#9a1f20]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

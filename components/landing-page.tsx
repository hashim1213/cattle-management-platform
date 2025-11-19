"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import {
  CheckCircle2,
  TrendingUp,
  Smartphone,
  DollarSign,
  Clock,
  FileText,
  BarChart3,
  Zap
} from "lucide-react"
import Link from "next/link"

export function LandingPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    farmName: "",
    email: "",
    phone: "",
    herdSize: "",
    problemValidation: false,
    pricingValidation: false,
    futureIntent: false,
    acknowledgment: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.fullName || !formData.farmName || !formData.email) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (!formData.problemValidation || !formData.pricingValidation || !formData.futureIntent || !formData.acknowledgment) {
      toast({
        title: "Agreement required",
        description: "Please confirm all validation statements.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/loi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          submittedAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit")
      }

      toast({
        title: "Thank you for your interest!",
        description: "We've received your Letter of Intent. We'll be in touch soon.",
      })

      // Reset form
      setFormData({
        fullName: "",
        farmName: "",
        email: "",
        phone: "",
        herdSize: "",
        problemValidation: false,
        pricingValidation: false,
        futureIntent: false,
        acknowledgment: false,
      })
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "There was an error submitting your information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const features = [
    {
      icon: Clock,
      title: "Real-Time Cost Tracking",
      description: "Know your exact cost of gain at any moment. No more guessing your break-even point.",
    },
    {
      icon: BarChart3,
      title: "Pen-Based Resource Allocation",
      description: "Allocate feed, meds, and costs by pen. Track performance with precision.",
    },
    {
      icon: Smartphone,
      title: "Hands-Free Data Capture",
      description: "Voice commands and NFC tags eliminate manual paperwork in the field.",
    },
    {
      icon: DollarSign,
      title: "Profit Optimization",
      description: "Identify which pens are profitable and which need adjustments before it's too late.",
    },
    {
      icon: FileText,
      title: "Eliminate Paperwork",
      description: "Stop juggling spreadsheets, notebooks, and receipts. Everything in one place.",
    },
    {
      icon: Zap,
      title: "Instant Insights",
      description: "Make data-driven decisions with real-time analytics and reporting.",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">CattleOS</h1>
            </div>
            <div className="flex gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-primary/10 rounded-full">
            <p className="text-sm font-semibold text-primary">Launching Q2 2026</p>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Stop Guessing Your Cost of Gain.
            <br />
            <span className="text-primary">Start Knowing.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            CattleOS is the inventory management system built for cattle operations.
            Get real-time cost tracking, eliminate manual paperwork, and finally know
            your break-even point with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => document.getElementById('loi-form')?.scrollIntoView({ behavior: 'smooth' })}>
              Express Your Interest
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
              Tired of These Problems?
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-destructive">Fragmented Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Feed records in one place, med costs in another, cattle weights in a notebook.
                    You can't see the full picture until it's too late.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-destructive">Unknown Break-Even</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    You're making marketing decisions blind. Are you selling at a profit or a loss?
                    You won't know until you do the math—days or weeks later.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-destructive">Manual Paperwork</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Hours spent every week updating spreadsheets, entering receipts,
                    and trying to remember what happened in the field.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-destructive">Delayed Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    By the time you realize a pen is underperforming, you've already lost money.
                    You need to know NOW, not next month.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            One Platform. Complete Control.
          </h2>
          <p className="text-xl text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            CattleOS brings all your cattle operation data together in one powerful,
            easy-to-use platform designed specifically for feedlot and cattle operations.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <div className="bg-background/10 backdrop-blur-sm rounded-lg p-8 mt-8">
              <div className="text-5xl font-bold mb-2">$99<span className="text-2xl">/month</span></div>
              <p className="text-xl mb-6 opacity-90">Everything you need to run your operation</p>
              <ul className="text-left space-y-3 mb-8 inline-block">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Unlimited cattle records
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Real-time cost tracking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Pen-based resource allocation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Voice and NFC data capture
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Mobile app access
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Priority support
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* LOI Form Section */}
      <section id="loi-form" className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Reserve Your Spot
            </h2>
            <p className="text-xl text-muted-foreground">
              Join the waitlist and be among the first to transform your cattle operation.
              Submit a non-binding Letter of Intent to help us validate demand and pricing.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Letter of Intent</CardTitle>
              <CardDescription>
                Express your interest in CattleOS. This is non-binding and solely for market validation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Contact Information</h3>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="John Smith"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="farmName">Farm/Ranch Name *</Label>
                    <Input
                      id="farmName"
                      value={formData.farmName}
                      onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                      placeholder="Smith Cattle Co."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="herdSize">Approximate Herd Size</Label>
                    <Input
                      id="herdSize"
                      value={formData.herdSize}
                      onChange={(e) => setFormData({ ...formData, herdSize: e.target.value })}
                      placeholder="500 head"
                    />
                  </div>
                </div>

                {/* Validation Statements */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-lg">Statement of Intent and Validation</h3>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="problemValidation"
                      checked={formData.problemValidation}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, problemValidation: checked as boolean })
                      }
                    />
                    <Label htmlFor="problemValidation" className="text-sm leading-relaxed cursor-pointer">
                      <strong>Problem Validation:</strong> I confirm that fragmented inventory data and
                      uncertainty over the break-even point is an acute and costly problem in my operation.
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="pricingValidation"
                      checked={formData.pricingValidation}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, pricingValidation: checked as boolean })
                      }
                    />
                    <Label htmlFor="pricingValidation" className="text-sm leading-relaxed cursor-pointer">
                      <strong>Pricing Validation:</strong> I confirm that the proposed subscription price
                      of $99/month for the CattleOS platform is an attractive and justifiable investment
                      that aligns with the solution's value.
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="futureIntent"
                      checked={formData.futureIntent}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, futureIntent: checked as boolean })
                      }
                    />
                    <Label htmlFor="futureIntent" className="text-sm leading-relaxed cursor-pointer">
                      <strong>Future Intent:</strong> I intend to acquire and utilize the CattleOS platform
                      for my operation when the product achieves commercial release (estimated Q2 2026).
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3 pt-2">
                    <Checkbox
                      id="acknowledgment"
                      checked={formData.acknowledgment}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, acknowledgment: checked as boolean })
                      }
                    />
                    <Label htmlFor="acknowledgment" className="text-sm leading-relaxed cursor-pointer">
                      <strong>Non-Binding Acknowledgment:</strong> I understand this Letter of Intent is
                      solely for Market Validation purposes and does not constitute a financial obligation,
                      purchase order, or binding commitment to buy.
                    </Label>
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Letter of Intent"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  By submitting this form, you're helping us validate market demand for CattleOS.
                  We'll keep you updated on our progress and notify you when we're ready to launch.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-bold">CattleOS</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Professional inventory management for modern cattle operations.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#features" className="hover:text-foreground">Features</a></li>
                  <li><a href="#loi-form" className="hover:text-foreground">Get Started</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Legal</h4>
                <p className="text-sm text-muted-foreground">
                  © 2025 CattleOS. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

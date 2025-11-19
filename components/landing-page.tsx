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
  Zap,
  Check,
  ArrowRight,
  Users,
  Building2,
  Sparkles,
  Brain,
  Scale,
  Link as LinkIcon,
  Calendar,
  Rocket,
  Shield,
  Lock,
  Eye,
  MessageCircle,
  MapPin
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

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

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "CattleOS",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web, iOS, Android",
    "offers": [
      {
        "@type": "Offer",
        "name": "Cow/Calf Plan",
        "price": "99",
        "priceCurrency": "USD",
        "billingDuration": "P1M"
      },
      {
        "@type": "Offer",
        "name": "Feedlot Plan",
        "price": "275",
        "priceCurrency": "USD",
        "billingDuration": "P1M"
      }
    ],
    "description": "AI-native cattle management platform for cow-calf operations, feedlots, and cattle operations. Real-time cost tracking, inventory management, and break-even analysis.",
    "screenshot": "/cattleos_logo_full.png",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5",
      "ratingCount": "1"
    }
  }

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
      icon: TrendingUp,
      title: "Instant Insights",
      description: "Make data-driven decisions with real-time analytics and reporting.",
    },
  ]

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        {/* Header */}
        <header className="border-b bg-card/95 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-shrink">
              <Image
                src="/cattleos_logo_full.png"
                alt="CattleOS"
                width={140}
                height={40}
                className="h-8 md:h-10 w-auto object-contain max-w-[120px] md:max-w-[140px]"
                priority
              />
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-xs md:text-sm px-2 md:px-4">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="text-xs md:text-sm px-3 md:px-4">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Background */}
      <section className="relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70 z-10" />
          <Image
            src="/cow_moo.webp"
            alt="Cattle farm"
            fill
            className="object-cover"
            priority
            onError={(e) => {
              // Fallback to gradient if image not found
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-20 container mx-auto px-4 py-24 md:py-32 lg:py-40">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 mb-6 px-5 py-2.5 bg-primary rounded-full shadow-lg">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
              <p className="text-sm font-semibold text-primary-foreground">AI-Powered & Launching Q2 2026</p>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8 leading-tight drop-shadow-2xl">
              Your Spreadsheets Are So Messy,
              <br />
              <span className="text-green-400 drop-shadow-2xl">Even The Cattle Are Confused.</span>
            </h1>
            <p className="text-xl md:text-2xl text-white mb-10 max-w-3xl mx-auto drop-shadow-lg font-medium">
              The <strong className="text-green-300">AI-native</strong> inventory management system built for cattle operations.
              Get real-time cost tracking, eliminate manual paperwork, and finally know
              your break-even point with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all"
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              >
                View Pricing <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:text-white shadow-xl"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="bg-muted/50 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-6 md:mb-8">
              Tired of These Problems?
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
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
      <section id="features" className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-3 md:mb-4">
            One Platform. Complete Control.
          </h2>
          <p className="text-base md:text-xl text-muted-foreground text-center mb-8 md:mb-12 max-w-2xl mx-auto">
            CattleOS brings all your cattle operation data together in one powerful,
            easy-to-use platform designed specifically for feedlot and cattle operations.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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

      {/* AI-First Section */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-primary/10 rounded-full">
                <Brain className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold text-primary">AI-Native Platform</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                Built AI-First, AI-Native
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Intelligence at every layer, designed for the future of cattle management
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 md:mb-4 shadow-lg">
                    <Brain className="h-8 w-8 md:h-10 md:w-10 text-white" />
                  </div>
                  <CardTitle className="text-lg md:text-xl">AI-Powered Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm md:text-base text-muted-foreground">
                    Machine learning models analyze your operation in real-time, predicting optimal marketing windows,
                    detecting health issues early, and recommending ration adjustments.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Predictive health monitoring</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Smart cost forecasting</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Automated anomaly detection</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-3 md:mb-4 shadow-lg">
                    <MessageCircle className="h-8 w-8 md:h-10 md:w-10 text-white" />
                  </div>
                  <CardTitle className="text-lg md:text-xl">Natural Language Interface</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm md:text-base text-muted-foreground">
                    Talk to your farm data naturally. Ask questions in plain English and get instant answers.
                    Our AI assistant understands cattle terminology and your operation.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Voice-first data entry</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Conversational analytics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Smart recommendations</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
                <CardHeader>
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-3 md:mb-4 shadow-lg">
                    <BarChart3 className="h-8 w-8 md:h-10 md:w-10 text-white" />
                  </div>
                  <CardTitle className="text-lg md:text-xl">Continuous Learning</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm md:text-base text-muted-foreground">
                    The more you use CattleOS, the smarter it gets. Our AI learns from your operation's patterns
                    and adapts to your specific management style.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Personalized benchmarks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Custom alerts & workflows</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Industry best practices</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-primary/10 rounded-full">
                <LinkIcon className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold text-primary">Seamless Integration</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                Works With Your Existing Tools
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                CattleOS integrates seamlessly with the hardware and software you already use
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Scale className="h-10 w-10 mx-auto mb-2 text-primary" />
                  <CardTitle className="text-lg">Scale Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Direct integration with Tru-Test, Datamars, and other major scale manufacturers
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <DollarSign className="h-10 w-10 mx-auto mb-2 text-primary" />
                  <CardTitle className="text-lg">QuickBooks</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Automatic expense tracking and financial synchronization with QuickBooks
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <FileText className="h-10 w-10 mx-auto mb-2 text-primary" />
                  <CardTitle className="text-lg">Market Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Live cattle market prices from CME, DTN, and regional auction markets
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Smartphone className="h-10 w-10 mx-auto mb-2 text-primary" />
                  <CardTitle className="text-lg">IoT Devices</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Connect with smart ear tags, water sensors, and automated feed systems
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-4">Need a custom integration?</p>
              <Button variant="outline" size="lg" onClick={() => document.getElementById('loi-form')?.scrollIntoView({ behavior: 'smooth' })}>
                Contact Us About Custom Integrations
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Data Privacy & Security Section */}
      <section className="py-16 md:py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-primary/10 rounded-full">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold text-primary">Security & Privacy First</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                Your Data Stays Yours. Always.
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                We know your operation data is sensitive business information. That's why we built CattleOS with privacy at its core.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
                <CardHeader>
                  <Lock className="h-10 w-10 md:h-12 md:w-12 text-primary mb-3 md:mb-4" />
                  <CardTitle className="text-lg md:text-xl">Never Shared or Sold</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm md:text-base text-muted-foreground mb-4">
                    Your cattle data, costs, and operations information is <strong>never shared, sold, or used for any purpose</strong> other than powering your CattleOS experience.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>No third-party data sharing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>No advertising partners</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Your data is not our business model</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
                <CardHeader>
                  <Shield className="h-10 w-10 md:h-12 md:w-12 text-primary mb-3 md:mb-4" />
                  <CardTitle className="text-lg md:text-xl">Bank-Level Encryption</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm md:text-base text-muted-foreground mb-4">
                    All your data is encrypted in transit and at rest using industry-standard AES-256 encryption, the same security banks use.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>SSL/TLS encryption for all connections</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Encrypted database storage</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Secure cloud infrastructure</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors sm:col-span-2 lg:col-span-1">
                <CardHeader>
                  <Eye className="h-10 w-10 md:h-12 md:w-12 text-primary mb-3 md:mb-4" />
                  <CardTitle className="text-lg md:text-xl">You're In Control</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm md:text-base text-muted-foreground mb-4">
                    Your data belongs to you. Export it anytime, delete it whenever you want, and control exactly who on your team has access.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>One-click data export</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Granular access controls</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Delete your data anytime</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 text-center bg-card border border-primary/20 rounded-lg p-6 md:p-8">
              <h3 className="text-xl md:text-2xl font-bold mb-3 text-foreground">Our Privacy Promise</h3>
              <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
                We make money from subscriptions, not from your data. Your operation's information is confidential business data,
                and we treat it that way. <strong className="text-foreground">We will never share, sell, or monetize your cattle data.</strong> Period.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Roadmap */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-primary/10 rounded-full">
                <Rocket className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold text-primary">Product Roadmap</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                Building The Future of Cattle Management
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Our vision extends far beyond launch. Here's what's coming.
              </p>
            </div>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary/20 hidden md:block" />

              <div className="space-y-12">
                {/* Q2 2026 - Launch */}
                <div className="relative pl-0 md:pl-20">
                  <div className="absolute left-5 top-0 w-6 h-6 rounded-full bg-primary border-4 border-background hidden md:block" />
                  <Card className="border-2 border-primary">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <span className="text-sm font-semibold text-primary">Q2 2026</span>
                      </div>
                      <CardTitle className="text-2xl">Official Launch</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span>Core inventory management for cattle, pens, and resources</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span>Medication tracking and treatment protocols</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span>Feeding management and ration optimization</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span>Real-time cost tracking and break-even analysis</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span>Mobile-optimized apps (iOS & Android) with voice capture</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span>AI-powered insights and recommendations</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Q3-Q4 2026 */}
                <div className="relative pl-0 md:pl-20">
                  <div className="absolute left-5 top-0 w-6 h-6 rounded-full bg-blue-500 border-4 border-background hidden md:block" />
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="h-5 w-5 text-blue-500" />
                        <span className="text-sm font-semibold text-blue-500">Q3-Q4 2026</span>
                      </div>
                      <CardTitle className="text-2xl">Enhanced Automation & Integrations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                          <span>Scale and IoT device integrations (Tru-Test, Datamars, smart tags)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                          <span>QuickBooks and accounting software sync</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                          <span>Automated feed ordering and supplier management</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                          <span>Advanced AI health monitoring with veterinary alerts</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Q1-Q2 2027 */}
                <div className="relative pl-0 md:pl-20">
                  <div className="absolute left-5 top-0 w-6 h-6 rounded-full bg-purple-500 border-4 border-background hidden md:block" />
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="h-5 w-5 text-purple-500" />
                        <span className="text-sm font-semibold text-purple-500">Q1-Q2 2027</span>
                      </div>
                      <CardTitle className="text-2xl">Market Intelligence & Breeding</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                          <span>AI-powered optimal marketing window recommendations</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                          <span>Live market data integration and futures hedging tools</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                          <span>Breeding and genetics management module</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                          <span>Pasture and grazing rotation optimization</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* 2027+ */}
                <div className="relative pl-0 md:pl-20">
                  <div className="absolute left-5 top-0 w-6 h-6 rounded-full bg-green-500 border-4 border-background hidden md:block" />
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="h-5 w-5 text-green-500" />
                        <span className="text-sm font-semibold text-green-500">2027 & Beyond</span>
                      </div>
                      <CardTitle className="text-2xl">Industry Ecosystem</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>Multi-farm enterprise management for large operations</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>Blockchain-based cattle traceability and verification</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>Carbon credit tracking and sustainability reporting</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>Industry marketplace connecting producers and buyers</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-lg text-muted-foreground mb-6">
                Want to influence our roadmap? Join our early adopter program.
              </p>
              <Button size="lg" onClick={() => document.getElementById('loi-form')?.scrollIntoView({ behavior: 'smooth' })}>
                Reserve Your Spot
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Choose the plan that fits your operation size
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Cow/Calf Plan */}
              <Card className="relative hover:shadow-2xl transition-all duration-300 border-2 flex flex-col">
                <CardHeader className="text-center pb-8">
                  <div className="mx-auto w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4 shadow-lg">
                    <span className="text-3xl font-bold text-white">C/C</span>
                  </div>
                  <CardTitle className="text-2xl mb-2">Cow/Calf</CardTitle>
                  <CardDescription>Perfect for cow-calf operations</CardDescription>
                  <div className="mt-4">
                    <div className="text-4xl font-bold text-foreground">$99</div>
                    <div className="text-muted-foreground">/month</div>
                    <p className="text-xs text-muted-foreground mt-2">billed annually: $1,188/year</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 flex flex-col">
                  <div className="space-y-3 flex-1">
                    <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                      <p className="text-sm font-semibold">Capacity</p>
                      <p className="text-xs text-muted-foreground">Up to 200 head</p>
                      <p className="text-xs text-muted-foreground">15 pens • 1 user</p>
                    </div>
                    <ul className="space-y-2.5">
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>Real-time cost tracking</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>Cattle & pen management</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>Basic health tracking</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>Mobile app access</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>Email support</span>
                      </li>
                    </ul>
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">Add-ons:</p>
                      <p className="text-xs text-muted-foreground">+$10/month per 100 head over 200</p>
                      <p className="text-xs text-muted-foreground">+$15/month per additional user</p>
                    </div>
                  </div>
                  <Button className="w-full mt-4" onClick={() => document.getElementById('loi-form')?.scrollIntoView({ behavior: 'smooth' })}>
                    Get Started
                  </Button>
                </CardContent>
              </Card>

              {/* Feedlot Plan - Featured */}
              <Card className="relative hover:shadow-2xl transition-all duration-300 border-2 border-primary shadow-xl sm:col-span-2 lg:col-span-1 lg:scale-105 flex flex-col">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                </div>
                <CardHeader className="text-center pb-8 pt-8">
                  <div className="mx-auto w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-4 shadow-lg">
                    <span className="text-3xl font-bold text-primary-foreground">FL</span>
                  </div>
                  <CardTitle className="text-2xl mb-2">Feedlot</CardTitle>
                  <CardDescription>Built for commercial feedlot operations</CardDescription>
                  <div className="mt-4">
                    <div className="text-4xl font-bold text-foreground">$275</div>
                    <div className="text-muted-foreground">/month</div>
                    <p className="text-xs text-muted-foreground mt-2">billed annually: $3,300/year</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 flex flex-col">
                  <div className="space-y-3 flex-1">
                    <div className="bg-primary/5 rounded-lg p-3 space-y-1">
                      <p className="text-sm font-semibold">Capacity</p>
                      <p className="text-xs text-muted-foreground">Up to 2,000 head</p>
                      <p className="text-xs text-muted-foreground">40 pens • 3 users</p>
                    </div>
                    <p className="text-xs font-semibold text-primary">Everything in Cow/Calf, plus:</p>
                    <ul className="space-y-2.5">
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>Advanced health & treatment tracking</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>EID tag integration</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>Advanced ration management</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>Voice & NFC data capture</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>Team collaboration tools</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>Priority phone & email support</span>
                      </li>
                    </ul>
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">Add-ons:</p>
                      <p className="text-xs text-muted-foreground">+$8/month per 100 head over 2,000</p>
                      <p className="text-xs text-muted-foreground">+$12/month per additional user</p>
                      <p className="text-xs text-muted-foreground">+$5/month per 10 additional pens</p>
                    </div>
                  </div>
                  <Button className="w-full mt-4" onClick={() => document.getElementById('loi-form')?.scrollIntoView({ behavior: 'smooth' })}>
                    Get Started
                  </Button>
                </CardContent>
              </Card>

              {/* Enterprise Plan */}
              <Card className="relative hover:shadow-2xl transition-all duration-300 border-2 sm:col-span-2 lg:col-span-1 flex flex-col">
                <CardHeader className="text-center pb-8">
                  <div className="mx-auto w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
                    <span className="text-3xl font-bold text-white">ENT</span>
                  </div>
                  <CardTitle className="text-2xl mb-2">Enterprise</CardTitle>
                  <CardDescription>Custom solutions for large operations</CardDescription>
                  <div className="mt-4">
                    <div className="text-4xl font-bold text-foreground">Custom</div>
                    <div className="text-muted-foreground">Contact us</div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 flex flex-col">
                  <div className="space-y-3 flex-1">
                    <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3 space-y-1">
                      <p className="text-sm font-semibold">Capacity</p>
                      <p className="text-xs text-muted-foreground">Unlimited head</p>
                      <p className="text-xs text-muted-foreground">Unlimited pens • Unlimited users</p>
                    </div>
                    <p className="text-xs font-semibold text-purple-600">Everything in Feedlot, plus:</p>
                    <ul className="space-y-2.5">
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                        <span>Multi-location management</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                        <span>Custom integrations & API access</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                        <span>Dedicated account manager</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                        <span>On-premise deployment options</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                        <span>Custom training & onboarding</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                        <span>24/7 priority support with SLA</span>
                      </li>
                    </ul>
                  </div>
                  <Button variant="outline" className="w-full mt-4" onClick={() => document.getElementById('loi-form')?.scrollIntoView({ behavior: 'smooth' })}>
                    Contact Sales
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* LOI Form Section */}
      <section id="loi-form" className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6 md:mb-8">
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
                <div className="mb-4">
                  <Image
                    src="/cattleos_logo_full.png"
                    alt="CattleOS"
                    width={140}
                    height={40}
                    className="h-10 w-auto object-contain"
                  />
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Professional inventory management for modern cattle operations.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-full">
                  <MapPin className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-xs font-semibold text-red-600 dark:text-red-400">Built in Canada</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                  <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                  <li><a href="#loi-form" className="hover:text-foreground transition-colors">Get Started</a></li>
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
    </>
  )
}

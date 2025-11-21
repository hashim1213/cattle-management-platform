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
  Brain,
  Scale,
  Link as LinkIcon,
  Calendar,
  Rocket,
  Shield,
  Lock,
  Eye,
  MessageCircle,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Upload,
  Tags,
  Activity,
  PieChart,
  Globe,
  Target,
  Lightbulb,
  Mail
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export function LandingPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
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

  // Walkthrough steps data
  const walkthroughSteps = [
    {
      step: 1,
      title: "Add Your Cattle",
      description: "Start by importing your cattle inventory. Use our bulk upload feature or add animals individually with tags, weights, and purchase details.",
      icon: Upload,
      color: "from-blue-500 to-blue-600",
      image: "/screen1.png",
      highlights: ["Bulk CSV import", "Individual entry with voice capture", "Auto-generate EID tags"]
    },
    {
      step: 2,
      title: "Organize Into Pens",
      description: "Group your cattle into pens based on your operation. Assign feed rations, track pen-level performance, and monitor costs in real-time.",
      icon: Tags,
      color: "from-green-500 to-green-600",
      image: "/screen2.png",
      highlights: ["Drag-and-drop pen management", "Custom pen configurations", "Automated cost allocation"]
    },
    {
      step: 3,
      title: "Track Health & Treatments",
      description: "Record treatments, vaccinations, and health observations. Set up automated alerts for withdrawal periods and follow-up care.",
      icon: Activity,
      color: "from-purple-500 to-purple-600",
      image: "/screen3.png",
      highlights: ["Treatment protocols library", "Withdrawal period tracking", "Health trend analysis"]
    },
    {
      step: 4,
      title: "Monitor Performance",
      description: "View real-time dashboards showing cost of gain, break-even prices, and profitability by pen. Make data-driven decisions with confidence.",
      icon: PieChart,
      color: "from-orange-500 to-orange-600",
      image: "/screen4.png",
      highlights: ["Live break-even analysis", "Pen performance comparison", "AI-powered recommendations"]
    }
  ]

  const nextStep = () => {
    setCurrentStep((prev) => (prev + 1) % walkthroughSteps.length)
  }

  const previousStep = () => {
    setCurrentStep((prev) => (prev - 1 + walkthroughSteps.length) % walkthroughSteps.length)
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

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-white dark:bg-gray-950 shadow-sm sticky top-0 z-50">
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
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60 z-10" />
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
        <div className="relative z-20 container mx-auto px-4 py-28 md:py-36 lg:py-44">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Your Spreadsheets Are So Messy,
              <br />
              <span className="text-white/90">Even The Cattle Are Confused.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              Professional cattle management with real-time inventory tracking, cost management, and performance analytics
              for cow-calf operations and feedlots across North America.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="text-base px-8 py-6 bg-[#ba2627] hover:bg-[#9a1f20] text-white"
                onClick={() => document.getElementById('loi-form')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8 py-6 bg-white text-gray-900 border-white hover:bg-gray-100"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
              </Button>
            </div>
            <p className="text-sm text-white/70 mt-6">Launching Q2 2026 • Early Access Available</p>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="bg-gray-50 dark:bg-gray-900 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Common Challenges We Solve
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
      <section id="features" className="container mx-auto px-4 py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            One Platform. Complete Control.
          </h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
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

      {/* How It Works - Interactive Walkthrough */}
      <section className="py-16 md:py-20 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                How CattleOS Works
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Get up and running in minutes. Our streamlined workflow makes cattle management effortless.
              </p>
            </div>

            {/* Interactive Carousel */}
            <div className="relative">
              <Card className="border-2 border-primary/20 shadow-2xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid md:grid-cols-2 gap-0">
                    {/* Left side - Step content */}
                    <div className="p-8 md:p-12 bg-card">
                      <div className="mb-6">
                        <div className="inline-flex w-16 h-16 md:w-20 md:h-20 rounded-lg bg-primary/10 items-center justify-center mb-4 transition-all duration-300">
                          {(() => {
                            const StepIcon = walkthroughSteps[currentStep].icon
                            return <StepIcon className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                          })()}
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-sm">
                            {walkthroughSteps[currentStep].step}
                          </span>
                          <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                            {walkthroughSteps[currentStep].title}
                          </h3>
                        </div>
                      </div>

                      <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">
                        {walkthroughSteps[currentStep].description}
                      </p>

                      <div className="space-y-3 mb-8">
                        <p className="text-sm font-semibold text-foreground uppercase tracking-wide">Key Features:</p>
                        {walkthroughSteps[currentStep].highlights.map((highlight, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                                <Check className="h-3 w-3 text-primary" />
                              </div>
                            </div>
                            <span className="text-sm md:text-base text-muted-foreground">{highlight}</span>
                          </div>
                        ))}
                      </div>

                      {/* Navigation Controls */}
                      <div className="flex items-center justify-between pt-6 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={previousStep}
                          className="gap-2"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>

                        {/* Step Indicators */}
                        <div className="flex gap-2">
                          {walkthroughSteps.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentStep(idx)}
                              className={`h-2 rounded-full transition-all duration-300 ${
                                idx === currentStep
                                  ? 'w-8 bg-primary'
                                  : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                              }`}
                              aria-label={`Go to step ${idx + 1}`}
                            />
                          ))}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={nextStep}
                          className="gap-2"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Right side - Screenshot */}
                    <div className="hidden md:flex items-center justify-center bg-gray-100 dark:bg-gray-800 p-6 transition-all duration-500">
                      <div className="relative w-full h-full flex items-center justify-center">
                        <div className="relative w-full max-w-lg aspect-[4/3] bg-white rounded-lg shadow-xl overflow-hidden border">
                          <Image
                            src={walkthroughSteps[currentStep].image}
                            alt={walkthroughSteps[currentStep].title}
                            fill
                            className="object-cover object-top transition-all duration-500"
                            sizes="(max-width: 768px) 100vw, 50vw"
                            onError={(e) => {
                              // Fallback to icon if image not found
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Call to Action */}
              <div className="text-center mt-12">
                <p className="text-lg text-muted-foreground mb-6">
                  Ready to streamline your cattle operation?
                </p>
                <Button
                  size="lg"
                  className="gap-2"
                  onClick={() => document.getElementById('loi-form')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Start Your Free Trial
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI-First Section */}
      <section className="py-16 md:py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                AI-Powered Intelligence
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Advanced analytics and insights to help you make better decisions
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3 md:mb-4">
                    <Activity className="h-8 w-8 md:h-10 md:w-10 text-blue-600 dark:text-blue-400" />
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
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3 md:mb-4">
                    <MessageCircle className="h-8 w-8 md:h-10 md:w-10 text-purple-600 dark:text-purple-400" />
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
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3 md:mb-4">
                    <BarChart3 className="h-8 w-8 md:h-10 md:w-10 text-green-600 dark:text-green-400" />
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
      <section className="py-16 md:py-20 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Works With Your Existing Tools
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
      <section className="py-16 md:py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Your Data Stays Yours. Always.
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
      <section className="py-16 md:py-20 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Building The Future of Cattle Management
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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

      {/* Investor Section */}
      <section id="investors" className="py-16 md:py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Hero Statement */}
            <div className="text-center mb-16 md:mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ba2627]/10 border border-[#ba2627]/20 rounded-full text-sm font-semibold text-[#ba2627] mb-6">
                <Target className="h-4 w-4" />
                For Investors
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground leading-tight">
                Transforming the Global Cattle Industry<br />
                <span className="text-[#ba2627]">Through Modern Software</span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                The world's demand for beef is rising faster than producers can keep up. CattleOS is building the digital backbone for an industry that feeds hundreds of millions of people—and is long overdue for innovation.
              </p>
            </div>

            {/* Market Landscape */}
            <div className="mb-16 md:mb-20">
              <h3 className="text-3xl md:text-4xl font-bold mb-4 text-center text-foreground">The Market Landscape</h3>
              <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-12">
                The cattle industry is one of the world's most powerful agricultural sectors. Global meat demand is expected to increase <strong className="text-foreground">70% by 2050</strong>, driven by population growth and rising middle-class consumption. Yet despite its importance, day-to-day operations remain remarkably manual, fragmented, and underserved by modern software.
              </p>

              {/* Beef Prices Callout */}
              <div className="bg-[#ba2627]/5 border-2 border-[#ba2627]/20 rounded-lg p-6 md:p-8 mb-12 text-center">
                <DollarSign className="h-12 w-12 text-[#ba2627] mx-auto mb-4" />
                <h4 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">Beef Prices Are Rising</h4>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  As of today, beef prices in Canada sit at <strong className="text-[#ba2627] text-xl">$6.97 CAD per pound</strong>, reflecting strong demand, supply pressures, and a tightening global market. Producers are searching for ways to improve efficiency, reduce losses, and increase profitability—especially when every pound matters.
                </p>
              </div>

              {/* Regional Markets Grid */}
              <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12">
                {/* Canada */}
                <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <MapPin className="h-6 w-6 text-red-600" />
                      </div>
                      <CardTitle className="text-xl">Canada</CardTitle>
                    </div>
                    <CardDescription>A High-Value, Export-Driven Market</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-primary">71,280</span>
                        <span className="text-sm text-muted-foreground">cattle farms & ranches</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-primary">$32.4B</span>
                        <span className="text-sm text-muted-foreground">annual GDP contribution</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-primary">~50%</span>
                        <span className="text-sm text-muted-foreground">of production exported</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-primary">115</span>
                        <span className="text-sm text-muted-foreground">avg. herd size</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground pt-3 border-t">
                      Producers are under pressure to document more, manage more data, and make faster decisions—all without systems built for modern operations.
                    </p>
                  </CardContent>
                </Card>

                {/* United States */}
                <Card className="border-2 border-blue-500/20 hover:border-blue-500/40 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <CardTitle className="text-xl">United States</CardTitle>
                    </div>
                    <CardDescription>Massive Scale, Limited Digital Tools</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-blue-600">732,123</span>
                        <span className="text-sm text-muted-foreground">cattle farms</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-blue-600">11,186</span>
                        <span className="text-sm text-muted-foreground">feedlots</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground pt-3 border-t">
                      The U.S. remains the largest cattle market in the world, yet the software environment is outdated and inconsistent. Some of the world's largest feeding operations still rely on spreadsheets and paper systems.
                    </p>
                    <p className="text-sm font-semibold text-blue-600 pt-2">
                      The scale is enormous. The inefficiencies are even larger. The digital opportunity is wide open.
                    </p>
                  </CardContent>
                </Card>

                {/* European Union */}
                <Card className="border-2 border-green-500/20 hover:border-green-500/40 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Globe className="h-6 w-6 text-green-600" />
                      </div>
                      <CardTitle className="text-xl">European Union</CardTitle>
                    </div>
                    <CardDescription>Regulation Meets Fragmentation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-green-600">9.1M</span>
                        <span className="text-sm text-muted-foreground">total farms</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-green-600">382,000</span>
                        <span className="text-sm text-muted-foreground">cattle farms</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground pt-3 border-t">
                      Europe's cattle sector is both high-value and heavily regulated. Producers face intense sustainability, traceability, and welfare reporting requirements.
                    </p>
                    <p className="text-sm font-semibold text-green-600 pt-2">
                      This creates massive demand for software that makes compliance simpler while helping farms operate more efficiently.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Global Story */}
              <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <Globe className="h-8 w-8 text-primary" />
                    The Global Story
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-base text-muted-foreground">
                    Across Canada, the U.S., and Europe, producers face the same challenges:
                  </p>
                  <ul className="grid sm:grid-cols-2 gap-3">
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Rising feed and operating costs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Labour shortages</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Pressure to increase traceability and sustainability</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>The need for real-time insights</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="sm:col-span-2">A market where each pound of beef (now $6.97/lb) matters more than ever</span>
                    </li>
                  </ul>
                  <p className="text-lg font-semibold text-foreground pt-4 border-t">
                    Yet the majority of producers still operate without modern digital tools.
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    The opportunity is clear.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* The Problem */}
            <div className="mb-16 md:mb-20">
              <h3 className="text-3xl md:text-4xl font-bold mb-6 text-center text-foreground">The Problem</h3>
              <Card className="border-2 border-destructive/30 bg-destructive/5">
                <CardContent className="p-6 md:p-8">
                  <p className="text-lg text-muted-foreground mb-6">
                    Cattle operations generate enormous amounts of data:
                  </p>
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {['Herd records', 'Breeding cycles', 'Feed costs', 'Health treatments', 'Weights and gains', 'Pasture rotations', 'Sales and marketing'].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-destructive flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-background border-2 border-destructive/20 rounded-lg p-6 space-y-4">
                    <p className="text-lg font-semibold text-foreground">
                      But most of this information is scattered across notebooks, spreadsheets, text messages, and in many cases… memory.
                    </p>
                    <p className="text-base text-muted-foreground">
                      This slows down decision-making, increases errors, and keeps producers from reaching their full profitability.
                    </p>
                    <p className="text-base text-foreground font-medium">
                      The industry is hungry for the same digital transformation that crop farms, supply chains, and grain marketing have already experienced.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* The CattleOS Opportunity */}
            <div className="mb-16 md:mb-20">
              <div className="text-center mb-12">
                <h3 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">The CattleOS Opportunity</h3>
                <p className="text-2xl font-bold text-primary mb-6">Our Vision</p>
                <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                  To build the world's most intuitive cattle management platform—a modern, cloud-based system designed from the ground up for simplicity, speed, and real-world workflows.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                {[
                  { icon: Users, title: 'Centralized herd management', color: 'blue' },
                  { icon: Scale, title: 'Ration balancing tools', color: 'green' },
                  { icon: BarChart3, title: 'Weight estimation & performance analytics', color: 'purple' },
                  { icon: Activity, title: 'Health & treatment tracking', color: 'red' },
                  { icon: MapPin, title: 'Pasture & feed management', color: 'orange' },
                  { icon: FileText, title: 'Automated reporting & compliance', color: 'indigo' },
                  { icon: Smartphone, title: 'Mobile-first workflows', color: 'pink' },
                  { icon: Brain, title: 'AI-powered insights', color: 'cyan' }
                ].map((feature, idx) => (
                  <Card key={idx} className="text-center hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <feature.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium">{feature.title}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-2 border-primary rounded-lg p-6 md:p-8 text-center">
                <p className="text-xl md:text-2xl font-bold text-foreground mb-2">
                  CattleOS isn't just record-keeping.
                </p>
                <p className="text-2xl md:text-3xl font-bold text-primary">
                  It's the operating system for modern livestock production.
                </p>
              </div>
            </div>

            {/* Why Now? */}
            <div className="mb-16 md:mb-20">
              <h3 className="text-3xl md:text-4xl font-bold mb-6 text-center text-foreground">Why Now?</h3>
              <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-8">
                The global cattle industry is converging toward a new reality:
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { icon: TrendingUp, title: 'Beef prices are rising', desc: 'Strong market fundamentals' },
                  { icon: Globe, title: 'Demand is booming', desc: '70% increase expected by 2050' },
                  { icon: FileText, title: 'Regulations are tightening', desc: 'Traceability & sustainability requirements' },
                  { icon: DollarSign, title: 'Margins are narrowing', desc: 'Every pound of beef matters' },
                  { icon: Users, title: 'Younger producers expect modern tools', desc: 'Digital-native generation entering farming' },
                  { icon: Lightbulb, title: 'AI & cloud software accessible', desc: 'Technology finally reaching rural regions' }
                ].map((item, idx) => (
                  <Card key={idx} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <item.icon className="h-8 w-8 text-primary mb-2" />
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-8 text-center">
                <p className="text-lg text-muted-foreground mb-3">
                  And there is still <strong className="text-foreground">no dominant digital platform</strong> serving this market.
                </p>
                <p className="text-2xl font-bold text-primary">
                  CattleOS aims to become the standard.
                </p>
              </div>
            </div>

            {/* Long-Term Vision */}
            <div className="mb-16 md:mb-20">
              <h3 className="text-3xl md:text-4xl font-bold mb-6 text-center text-foreground">Our Long-Term Vision</h3>
              <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="p-6 md:p-10">
                  <p className="text-lg text-muted-foreground mb-6 text-center">
                    We're not just building a cattle management app.
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-foreground mb-8 text-center">
                    We're building the foundation of a digital ecosystem that supports:
                  </p>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {[
                      { icon: Users, label: 'Cattle producers' },
                      { icon: Building2, label: 'Feedlots' },
                      { icon: Activity, label: 'Veterinarians' },
                      { icon: Brain, label: 'Nutritionists' },
                      { icon: Building2, label: 'Processors' },
                      { icon: TrendingUp, label: 'Markets' },
                      { icon: Globe, label: 'Entire regional supply chains' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-background rounded-lg p-4 border">
                        <item.icon className="h-6 w-6 text-primary flex-shrink-0" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t-2 pt-8 space-y-4">
                    <p className="text-lg md:text-xl text-center font-semibold text-foreground">
                      What Shopify did for commerce,<br />
                      what Deere Operations Center did for cropping,<br />
                      <span className="text-primary text-xl md:text-2xl">CattleOS is doing for livestock.</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Join Us - CTA */}
            <div className="text-center">
              <Card className="border-2 border-[#ba2627] bg-gradient-to-br from-[#ba2627]/5 to-transparent shadow-xl">
                <CardContent className="p-8 md:p-12">
                  <Rocket className="h-16 w-16 text-[#ba2627] mx-auto mb-6" />
                  <h3 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Join Us</h3>
                  <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                    CattleOS is building technology for an industry that feeds the world.
                  </p>
                  <p className="text-base text-muted-foreground mb-8 max-w-2xl mx-auto">
                    If you're interested in learning more about investment opportunities, strategic partnerships, or being part of the next phase of agricultural innovation, we'd love to talk.
                  </p>
                  <Button
                    size="lg"
                    className="gap-2 bg-[#ba2627] hover:bg-[#9a1f20] text-white text-lg px-8 py-6"
                    onClick={() => {
                      window.location.href = 'mailto:contact@cattleos.com?subject=Investor Inquiry'
                    }}
                  >
                    <Mail className="h-5 w-5" />
                    Contact the CattleOS Team
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Choose the plan that fits your operation size
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Cow/Calf Plan */}
              <Card className="relative hover:shadow-lg transition-all duration-300 border-2 flex flex-col">
                <CardHeader className="text-center pb-8">
                  <div className="mx-auto w-16 h-16 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                    <span className="text-3xl font-bold text-green-700 dark:text-green-400">C/C</span>
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
              <Card className="relative hover:shadow-lg transition-all duration-300 border-2 border-[#ba2627] shadow-lg sm:col-span-2 lg:col-span-1 flex flex-col">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-[#ba2627] text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                </div>
                <CardHeader className="text-center pb-8 pt-8">
                  <div className="mx-auto w-16 h-16 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                    <span className="text-3xl font-bold text-[#ba2627] dark:text-red-400">FL</span>
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
              <Card className="relative hover:shadow-lg transition-all duration-300 border-2 sm:col-span-2 lg:col-span-1 flex flex-col">
                <CardHeader className="text-center pb-8">
                  <div className="mx-auto w-16 h-16 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                    <span className="text-3xl font-bold text-purple-700 dark:text-purple-400">ENT</span>
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
      <footer className="border-t bg-gray-50 dark:bg-gray-900 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              {/* Company Info */}
              <div className="md:col-span-2">
                <div className="mb-4">
                  <Image
                    src="/cattleos_logo_full.png"
                    alt="CattleOS"
                    width={160}
                    height={45}
                    className="h-12 w-auto object-contain"
                  />
                </div>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  Professional cattle management software built for cow-calf operations and feedlots.
                  Helping ranchers make data-driven decisions with confidence.
                </p>
                <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Head Office</p>
                    <p>Manitoba, Canada</p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded mt-3">
                  <MapPin className="h-3.5 w-3.5 text-red-700 dark:text-red-400" />
                  <span className="text-xs font-semibold text-red-700 dark:text-red-400">Proudly Built in Canada</span>
                </div>
              </div>

              {/* Product Links */}
              <div>
                <h4 className="font-semibold mb-4 text-foreground">Product</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
                  <li><a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
                  <li><a href="#loi-form" className="text-muted-foreground hover:text-foreground transition-colors">Get Started</a></li>
                  <li><Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">Sign In</Link></li>
                </ul>
              </div>

              {/* Support & Resources */}
              <div>
                <h4 className="font-semibold mb-4 text-foreground">Support</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><a href="#loi-form" className="text-muted-foreground hover:text-foreground transition-colors">Contact Us</a></li>
                  <li><a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Documentation</a></li>
                  <li><a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">FAQs</a></li>
                  <li><a href="#loi-form" className="text-muted-foreground hover:text-foreground transition-colors">Early Access</a></li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-8 border-t border-border">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  © 2025 CattleOS Inc. All rights reserved.
                </div>
                <div className="flex gap-6 text-sm">
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
                  <a href="#loi-form" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </>
  )
}

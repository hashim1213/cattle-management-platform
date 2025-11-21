import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Check,
  DollarSign,
  MapPin,
  Building2,
  Globe,
  Users,
  Scale,
  BarChart3,
  Activity,
  FileText,
  Smartphone,
  Brain,
  TrendingUp,
  Lightbulb,
  Rocket,
  Mail,
  Target
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import Script from "next/script"

export const metadata: Metadata = {
  title: "Investors - CattleOS",
  description: "Investment opportunities in CattleOS - Building the digital backbone for the global cattle industry. Market opportunity, timing analysis, and long-term vision.",
  openGraph: {
    title: "Investors - CattleOS",
    description: "Investment opportunities in CattleOS - Building the digital backbone for the global cattle industry.",
    url: "/investors",
  },
}

export default function InvestorsPage() {
  return (
    <>
      <Script
        id="investors-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Investors - CattleOS",
            "description": "Investment opportunities in CattleOS - Building the digital backbone for the global cattle industry. Market opportunity, timing analysis, and long-term vision.",
            "url": "https://www.cattleos.com/investors"
          })
        }}
      />
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-950 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 min-w-0 flex-shrink">
              <Image
                src="/cattleos_logo_full.png"
                alt="CattleOS"
                width={140}
                height={40}
                className="h-8 md:h-10 w-auto object-contain max-w-[120px] md:max-w-[140px]"
                priority
              />
            </Link>
            <div className="flex gap-2 flex-shrink-0">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-xs md:text-sm px-2 md:px-4">Back to Home</Button>
              </Link>
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

      {/* Investor Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Hero Statement */}
            <div className="text-center mb-16 md:mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ba2627]/10 border border-[#ba2627]/20 rounded-full text-sm font-semibold text-[#ba2627] mb-6">
                <Target className="h-4 w-4" />
                For Investors
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground leading-tight">
                Transforming the Global Cattle Industry<br />
                <span className="text-[#ba2627]">Through Modern Software</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                The world's demand for beef is rising faster than producers can keep up. CattleOS is building the digital backbone for an industry that feeds hundreds of millions of people—and is long overdue for innovation.
              </p>
            </div>

            {/* Market Landscape */}
            <div className="mb-16 md:mb-20">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-foreground">The Market Landscape</h2>
              <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-12">
                The cattle industry is one of the world's most powerful agricultural sectors. Global meat demand is expected to increase <strong className="text-foreground">70% by 2050</strong>, driven by population growth and rising middle-class consumption. Yet despite its importance, day-to-day operations remain remarkably manual, fragmented, and underserved by modern software.
              </p>

              {/* Beef Prices Callout */}
              <div className="bg-[#ba2627]/5 border-2 border-[#ba2627]/20 rounded-lg p-6 md:p-8 mb-12 text-center">
                <DollarSign className="h-12 w-12 text-[#ba2627] mx-auto mb-4" />
                <h3 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">Beef Prices Are Rising</h3>
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
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center text-foreground">The Problem</h2>
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

              {/* Profitability Pressure */}
              <Card className="mt-8 border-2 border-amber-500/30 bg-amber-500/5">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-amber-600" />
                    The Profitability Challenge
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-lg text-muted-foreground">
                    In 2022, Canada's livestock sector reported <strong className="text-foreground">$47.9 billion</strong> in total operating revenues, up 10.0% from 2021. Yet despite rising revenues, profit margins remain razor-thin:
                  </p>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-background rounded-lg p-4 border-2 border-red-500/20">
                      <p className="text-sm text-muted-foreground mb-2">Beef Cattle Farms</p>
                      <p className="text-3xl font-bold text-red-600 mb-1">4.0¢</p>
                      <p className="text-sm text-muted-foreground">net income per dollar of revenue</p>
                      <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">Lowest profit margin among all farm types</p>
                    </div>

                    <div className="bg-background rounded-lg p-4 border-2 border-blue-500/20">
                      <p className="text-sm text-muted-foreground mb-2">Dairy Cattle Farms</p>
                      <p className="text-3xl font-bold text-blue-600 mb-1">21.7¢</p>
                      <p className="text-sm text-muted-foreground">net income per dollar of revenue</p>
                      <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">$246,264 avg. net operating income</p>
                    </div>

                    <div className="bg-background rounded-lg p-4 border-2 border-purple-500/20">
                      <p className="text-sm text-muted-foreground mb-2">Hog Farms</p>
                      <p className="text-3xl font-bold text-purple-600 mb-1">6.5¢</p>
                      <p className="text-sm text-muted-foreground">net income per dollar of revenue</p>
                      <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">$3.4M avg. operating revenues</p>
                    </div>
                  </div>

                  <div className="bg-background border-2 border-amber-600/20 rounded-lg p-6">
                    <p className="text-lg font-semibold text-foreground mb-3">
                      With beef cattle farms earning just 4 cents per dollar of revenue, there is zero margin for error.
                    </p>
                    <p className="text-base text-muted-foreground mb-3">
                      Average beef cattle farms in Canada report <strong className="text-foreground">$522,735 in operating revenues</strong> against <strong className="text-foreground">$501,661 in operating expenses</strong>.
                    </p>
                    <p className="text-lg font-bold text-amber-600">
                      Every inefficiency, every data gap, every delayed decision directly impacts the bottom line.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* The CattleOS Opportunity */}
            <div className="mb-16 md:mb-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">The CattleOS Opportunity</h2>
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

            {/* AI-Powered Innovation */}
            <div className="mb-16 md:mb-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">AI-Powered Innovation</h2>
                <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                  CattleOS is built on cutting-edge AI technology that transforms how producers manage their operations—making complex tasks simple and data-driven insights accessible to everyone.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <Card className="border-2 border-blue-500/30 hover:border-blue-500/50 transition-colors">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                      <Brain className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">Natural Language AI Agent</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-muted-foreground">
                      Our AI agent allows producers to interact with their data using plain English—no technical expertise required.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">"Show me all cattle that gained less than 2 lbs/day this month"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">"Calculate my break-even price for Pen 3"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">"Which animals need health treatments this week?"</span>
                      </li>
                    </ul>
                    <p className="text-sm font-medium text-blue-600 pt-2">
                      Instant answers to complex questions—powered by AI that understands livestock operations.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-purple-500/30 hover:border-purple-500/50 transition-colors">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
                      <Smartphone className="h-6 w-6 text-purple-600" />
                    </div>
                    <CardTitle className="text-xl">Voice & Mobile-First AI</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-muted-foreground">
                      Designed for the field, not the office. Record data hands-free while working with your cattle.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Voice-to-text data entry while working</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">AI transcription for treatment notes and observations</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Mobile-optimized workflows for real-time updates</span>
                      </li>
                    </ul>
                    <p className="text-sm font-medium text-purple-600 pt-2">
                      No more clipboards, no more remembering details until you get back to the office.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-green-500/30 hover:border-green-500/50 transition-colors">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                      <BarChart3 className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle className="text-xl">Computer Vision for Weight Estimation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-muted-foreground">
                      Reduce the need for frequent weighing sessions with AI-powered weight estimation from photos.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Take a photo, get an estimated weight instantly</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Track weight trends without the stress of constant handling</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Identify underperforming animals early</span>
                      </li>
                    </ul>
                    <p className="text-sm font-medium text-green-600 pt-2">
                      Less labor, less stress on animals, better data for decision-making.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-orange-500/30 hover:border-orange-500/50 transition-colors">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-3">
                      <FileText className="h-6 w-6 text-orange-600" />
                    </div>
                    <CardTitle className="text-xl">Document Intelligence (OCR)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-muted-foreground">
                      Snap a photo of any livestock document and let AI extract the data automatically.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Scan feed invoices and auto-populate inventory</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Digitize veterinary records in seconds</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Capture load manifests and bill of lading documents</span>
                      </li>
                    </ul>
                    <p className="text-sm font-medium text-orange-600 pt-2">
                      Eliminate manual data entry and reduce errors from paper-based workflows.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 border-2 border-blue-500/30 rounded-lg p-8">
                <div className="text-center space-y-4">
                  <Brain className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                    AI That Works in the Real World
                  </h3>
                  <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                    While competitors bolt on basic chatbots, CattleOS is built AI-first from the ground up. Our technology adapts to how producers actually work—in the field, on mobile devices, with voice commands, and through simple conversations.
                  </p>
                  <p className="text-xl font-bold text-primary pt-4">
                    This is the future of livestock management, available today.
                  </p>
                </div>
              </div>
            </div>

            {/* Why Now? */}
            <div className="mb-16 md:mb-20">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center text-foreground">Why Now?</h2>
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
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center text-foreground">Our Long-Term Vision</h2>
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
                  <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Join Us</h2>
                  <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                    CattleOS is building technology for an industry that feeds the world.
                  </p>
                  <p className="text-base text-muted-foreground mb-8 max-w-2xl mx-auto">
                    If you're interested in learning more about investment opportunities, strategic partnerships, or being part of the next phase of agricultural innovation, we'd love to talk.
                  </p>
                  <Link href="mailto:contact@cattleos.com?subject=Investor Inquiry">
                    <Button
                      size="lg"
                      className="gap-2 bg-[#ba2627] hover:bg-[#9a1f20] text-white text-lg px-8 py-6"
                    >
                      <Mail className="h-5 w-5" />
                      Contact the CattleOS Team
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
      </div>
    </>
  )
}

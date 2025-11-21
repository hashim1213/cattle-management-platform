import type React from "react"
import type { Metadata, Viewport } from "next"
import { Playfair_Display } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/auth-context"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // iOS safe area support
  themeColor: "#ffffff",
}

export const metadata: Metadata = {
  title: {
    default: "CattleOS - AI-Powered Cattle Management Software for Ranchers & Feedlots",
    template: "%s | CattleOS"
  },
  description: "CattleOS is the AI-native cattle management platform for ranchers, feedlots, and cattle operations. Track costs in real-time, manage inventory, optimize feeding, and know your break-even point instantly. Integrates with scales, QuickBooks, and IoT devices. Starting at $99/month.",
  keywords: [
    "cattle management software",
    "cattle inventory management",
    "feedlot management system",
    "ranch management software",
    "cattle tracking software",
    "livestock management",
    "beef cattle software",
    "cattle cost tracking",
    "feedlot software",
    "ranch inventory software",
    "cattle weighing software",
    "livestock record keeping",
    "cattle herd management",
    "ranching software",
    "cattle feeding software",
    "livestock tracking",
    "cattle cost of gain",
    "beef production software",
    "cattle AI software",
    "smart cattle management",
    "cattle farm management",
    "livestock AI",
    "cattle ration management",
    "feedlot analytics",
    "cattle health tracking",
    "livestock inventory",
    "cattle pen management",
    "ranch analytics"
  ],
  authors: [{ name: "CattleOS Team" }],
  creator: "CattleOS",
  publisher: "CattleOS",
  formatDetection: {
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://cattleos.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'CattleOS',
    title: 'CattleOS - AI-Powered Cattle Management Software',
    description: 'AI-native cattle management platform for ranchers and feedlots. Real-time cost tracking, inventory management, and break-even analysis. Integrates with scales, QuickBooks & IoT devices.',
    images: [
      {
        url: '/cattleos_logo_full.png',
        width: 1200,
        height: 630,
        alt: 'CattleOS - Professional Cattle Management Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CattleOS - AI-Powered Cattle Management Software',
    description: 'AI-native cattle management for ranchers & feedlots. Real-time cost tracking, inventory management, integrations with scales & QuickBooks.',
    images: ['/cattleos_logo_full.png'],
    creator: '@cattleos',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CattleOS",
  },
  category: 'Agriculture',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`antialiased ${playfair.variable}`}>
        <AuthProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </AuthProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}

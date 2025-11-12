"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Beef, Loader2, MapPin, Home } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { doc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Farm details
  const [farmName, setFarmName] = useState("")
  const [location, setLocation] = useState("")
  const [farmSize, setFarmSize] = useState("")
  const [otherFarmingActivities, setOtherFarmingActivities] = useState("")

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { signup, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Don't redirect existing users, only prevent access if they're already logged in
    if (user) {
      // Check if they've completed onboarding by checking if farm settings exist
      // For now, just redirect to dashboard if already logged in
      router.push("/")
    }
  }, [user, router])

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (password !== confirmPassword) {
      return setError("Passwords do not match")
    }

    if (password.length < 6) {
      return setError("Password must be at least 6 characters")
    }

    setStep(2)
  }

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!farmName.trim()) {
      return setError("Farm name is required")
    }

    if (!location.trim()) {
      return setError("Location is required")
    }

    setLoading(true)

    try {
      // Create account
      await signup(email, password, name)

      // The user won't be immediately available, so we need to wait a moment
      await new Promise(resolve => setTimeout(resolve, 500))

      // Store additional user info in Firestore
      const userId = (await import("@/lib/firebase")).auth.currentUser?.uid
      if (userId) {
        await setDoc(doc(db, "userProfiles", userId), {
          displayName: name,
          email,
          farmName: farmName.trim(),
          location: location.trim(),
          farmSize: farmSize.trim() || null,
          otherFarmingActivities: otherFarmingActivities.trim() || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          onboardingCompleted: false,
        })
      }

      // Redirect new users to onboarding
      router.push("/onboarding")
    } catch (error: any) {
      setError(error.message || "Failed to create account")
      setStep(1) // Go back to account step if there's an error
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
              <Beef className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {step === 1 ? "Create Account" : "Farm Details"}
          </CardTitle>
          <CardDescription>
            {step === 1 ? "Get started with cattle management" : "Tell us about your operation"}
          </CardDescription>
          <div className="flex items-center justify-center gap-2 pt-2">
            <div className={`w-2 h-2 rounded-full ${step === 1 ? "bg-primary" : "bg-primary/30"}`} />
            <div className={`w-2 h-2 rounded-full ${step === 2 ? "bg-primary" : "bg-primary/30"}`} />
          </div>
        </CardHeader>

        {step === 1 ? (
          <form onSubmit={handleAccountSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">At least 6 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full">
                Continue
              </Button>

              <div className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleFinalSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="farmName" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Farm/Ranch Name *
                </Label>
                <Input
                  id="farmName"
                  type="text"
                  placeholder="e.g., Smith Family Ranch"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location *
                </Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="e.g., Alberta, Canada"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">City, State/Province, Country</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="farmSize">Farm Size (Optional)</Label>
                <Input
                  id="farmSize"
                  type="text"
                  placeholder="e.g., 500 acres, 200 hectares"
                  value={farmSize}
                  onChange={(e) => setFarmSize(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="otherActivities">Other Farming Activities (Optional)</Label>
                <Textarea
                  id="otherActivities"
                  placeholder="e.g., Crops, hay, other livestock..."
                  value={otherFarmingActivities}
                  onChange={(e) => setOtherFarmingActivities(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Tell us what else you farm besides cattle
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="flex gap-2 w-full">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </div>

              <div className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}

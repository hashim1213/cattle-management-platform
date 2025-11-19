import { NextRequest, NextResponse } from "next/server"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore"

// Firebase configuration (same as client-side config)
const firebaseConfig = {
  apiKey: "AIzaSyArBOx-POsmXttlvgDQ1tk0CWwF_GuW-qk",
  authDomain: "cattleos.firebaseapp.com",
  projectId: "cattleos",
  storageBucket: "cattleos.firebasestorage.app",
  messagingSenderId: "169828733805",
  appId: "1:169828733805:web:db73550312e9e0ebedc064",
}

// Initialize Firebase for server-side API route
if (!getApps().length) {
  initializeApp(firebaseConfig)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.fullName || !body.farmName || !body.email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate checkboxes
    if (!body.problemValidation || !body.pricingValidation || !body.futureIntent || !body.acknowledgment) {
      return NextResponse.json(
        { error: "All validation statements must be confirmed" },
        { status: 400 }
      )
    }

    // Save to Firestore using client SDK
    const db = getFirestore()
    const loiData = {
      fullName: body.fullName,
      farmName: body.farmName,
      email: body.email,
      phone: body.phone || "",
      herdSize: body.herdSize || "",
      problemValidation: body.problemValidation,
      pricingValidation: body.pricingValidation,
      futureIntent: body.futureIntent,
      acknowledgment: body.acknowledgment,
      submittedAt: serverTimestamp(),
      createdAt: new Date().toISOString(),
    }

    const docRef = await addDoc(collection(db, "letterOfIntent"), loiData)

    return NextResponse.json(
      {
        success: true,
        id: docRef.id,
        message: "Letter of Intent submitted successfully",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error submitting LOI:", error)
    return NextResponse.json(
      { error: "Failed to submit Letter of Intent", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

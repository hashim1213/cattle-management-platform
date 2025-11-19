import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

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

    // Save to Firestore
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
      { error: "Failed to submit Letter of Intent" },
      { status: 500 }
    )
  }
}

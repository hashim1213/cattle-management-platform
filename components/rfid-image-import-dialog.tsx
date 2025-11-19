"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Camera, Upload, Loader2, CheckCircle2, XCircle, FileText } from "lucide-react"
import Tesseract from "tesseract.js"
import { firebaseDataStore } from "@/lib/data-store-firebase"
import { firebasePenStore, type Pen } from "@/lib/pen-store-firebase"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect } from "react"
import { CattleDetailsEntry, type CattleDetails } from "@/components/cattle-details-entry"
import { AddPenDialog } from "@/components/add-pen-dialog"
import { Plus } from "lucide-react"

interface RFIDImageImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultPenId?: string
  defaultBatchId?: string
  onSuccess?: () => void
}

export function RFIDImageImportDialog({
  open,
  onOpenChange,
  defaultPenId,
  defaultBatchId,
  onSuccess,
}: RFIDImageImportDialogProps) {
  const { toast } = useToast()
  const [pens, setPens] = useState<Pen[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [step, setStep] = useState<"input" | "processing" | "review" | "details">("input")
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedText, setExtractedText] = useState("")
  const [parsedRFIDs, setParsedRFIDs] = useState<string[]>([])
  const [selectedPenId, setSelectedPenId] = useState(defaultPenId || "")
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [cattleDetails, setCattleDetails] = useState<CattleDetails[]>([])
  const [extractedCattleData, setExtractedCattleData] = useState<Partial<Record<string, any>>>({})
  const [showAddPenDialog, setShowAddPenDialog] = useState(false)

  // Load pens when dialog opens
  useEffect(() => {
    if (open) {
      setPens(firebasePenStore.getPens())
    }
  }, [open])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        setIsCameraActive(true)
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
      setIsCameraActive(false)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        canvas.toBlob((blob) => {
          if (blob) {
            processImage(blob)
            stopCamera()
          }
        })
      }
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check if it's a PDF
    if (file.type === "application/pdf") {
      await processPDF(file)
    } else {
      processImage(file)
    }
  }

  const processPDF = async (pdfFile: File) => {
    setIsProcessing(true)
    setStep("processing")

    try {
      // Try OpenAI Vision first for best accuracy, automatically fallback to Tesseract if not available
      await processPDFWithOpenAI(pdfFile)
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error"
      toast({
        title: "PDF Processing Error",
        description: `Failed to process PDF: ${errorMessage}. Please try again or paste text manually.`,
        variant: "destructive",
      })
      setStep("input")
    } finally {
      setIsProcessing(false)
    }
  }

  const processPDFWithTesseract = async (pdfFile: File) => {
    try {
      console.log('Starting PDF processing with Tesseract for file:', pdfFile.name, 'Size:', pdfFile.size)

      // Dynamically import pdfjs-dist to convert pages to images
      const pdfjsLib = await import("pdfjs-dist")

      // Configure worker - use jsdelivr CDN which is more reliable than cdnjs
      const pdfjsVersion = pdfjsLib.version || '4.0.379'
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`
      console.log('PDF.js worker configured with version:', pdfjsVersion)

      const arrayBuffer = await pdfFile.arrayBuffer()
      console.log('PDF file loaded, converting to PDF document...')
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      console.log('PDF loaded successfully, pages:', pdf.numPages)

      let allRFIDs: string[] = []
      let allText = ""

      // Process each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)

        // Render page to canvas
        const viewport = page.getViewport({ scale: 2.0 }) // Higher scale for better OCR
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        if (!context) continue

        canvas.width = viewport.width
        canvas.height = viewport.height

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise

        // Convert canvas to blob with timeout and quality settings
        const blob = await new Promise<Blob | null>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Timeout converting page ${pageNum} to blob`))
          }, 10000)

          canvas.toBlob((blob) => {
            clearTimeout(timeout)
            resolve(blob)
          }, 'image/png', 1.0)
        })

        if (!blob) {
          console.error(`Failed to create blob for page ${pageNum}`)
          continue
        }

        // Process with Tesseract OCR
        const result = await Tesseract.recognize(blob, "eng", {
          logger: (m) => {
            if (m.status === "recognizing text") {
              // Progress feedback
            }
          },
        })

        const pageText = result.data.text
        allText += `\n--- Page ${pageNum} ---\n${pageText}\n`
      }

      // Parse RFID numbers from all pages combined
      const uniqueRFIDs = parseRFIDsFromText(allText)

      setExtractedText(allText)
      setParsedRFIDs(uniqueRFIDs)
      setStep("review")

      if (uniqueRFIDs.length === 0) {
        toast({
          title: "No RFID Numbers Found",
          description: "Unable to detect RFID numbers in the PDF. Please try again or enter manually.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "PDF Processed with OCR",
          description: `Found ${uniqueRFIDs.length} RFID number(s) from ${pdf.numPages} page(s)`,
        })
      }
    } catch (error: any) {
      throw new Error(`PDF to image conversion failed: ${error?.message || "Unknown error"}`)
    }
  }

  const processPDFWithOpenAI = async (pdfFile: File) => {
    setIsProcessing(true)
    setStep("processing")

    try {
      console.log('Starting PDF processing with OpenAI for file:', pdfFile.name, 'Size:', pdfFile.size)

      // Dynamically import pdfjs-dist to convert pages to images
      const pdfjsLib = await import("pdfjs-dist")

      // Configure worker - use jsdelivr CDN which is more reliable than cdnjs
      const pdfjsVersion = pdfjsLib.version || '4.0.379'
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`
      console.log('PDF.js worker configured with version:', pdfjsVersion)

      const arrayBuffer = await pdfFile.arrayBuffer()
      console.log('PDF file loaded, converting to PDF document...')
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      console.log('PDF loaded successfully, pages:', pdf.numPages)

      let allRFIDs: string[] = []
      let allText = ""

      // Process each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)

        // Render page to canvas
        const viewport = page.getViewport({ scale: 2.0 }) // Higher scale for better OCR
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        if (!context) continue

        canvas.width = viewport.width
        canvas.height = viewport.height

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise

        // Convert canvas to blob with timeout and quality settings
        const blob = await new Promise<Blob | null>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Timeout converting page ${pageNum} to blob`))
          }, 10000)

          canvas.toBlob((blob) => {
            clearTimeout(timeout)
            resolve(blob)
          }, 'image/png', 1.0)
        })

        if (!blob) {
          console.error(`Failed to create blob for page ${pageNum}`)
          continue
        }

        // Send to OpenAI OCR
        const formData = new FormData()
        formData.append('file', blob, `page-${pageNum}.png`)

        const response = await fetch('/api/ocr', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        // If OpenAI API fails, throw error to trigger Tesseract fallback
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'OpenAI API not available')
        }

        if (data.text) {
          allText += `\n--- Page ${pageNum} ---\n${data.text}\n`
        }
      }

      // Parse structured cattle data from all pages combined
      const parsed = parseStructuredCattleData(allText)
      const uniqueRFIDs = parsed.rfids

      setExtractedText(allText)
      setParsedRFIDs(uniqueRFIDs)
      setExtractedCattleData(parsed.details)
      setStep("review")

      if (uniqueRFIDs.length === 0) {
        toast({
          title: "No RFID Numbers Found",
          description: "Unable to detect RFID numbers in the PDF. Please try again or enter manually.",
          variant: "destructive",
        })
      } else {
        const hasAdditionalData = Object.keys(parsed.details).length > 0
        toast({
          title: "PDF Processed with AI",
          description: `Found ${uniqueRFIDs.length} RFID number(s) from ${pdf.numPages} page(s)${hasAdditionalData ? ' with additional cattle data' : ''}`,
        })
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error"
      toast({
        title: "OpenAI Processing Failed",
        description: `${errorMessage}. Falling back to Tesseract OCR...`,
      })

      // Fallback to Tesseract OCR with PDF to image conversion
      try {
        await processPDFWithTesseract(pdfFile)
      } catch (fallbackError: any) {
        toast({
          title: "PDF Processing Error",
          description: `Failed to process PDF: ${fallbackError?.message || "Unknown error"}. Please try again or paste text manually.`,
          variant: "destructive",
        })
        setStep("input")
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // Enhanced parsing function to extract structured cattle data
  const parseStructuredCattleData = (text: string): { rfids: string[], details: Partial<Record<string, any>> } => {
    const rfids: string[] = []
    const details: Partial<Record<string, any>> = {}

    // Try to parse structured format first (output from enhanced OpenAI prompt)
    const structuredBlocks = text.split('---').filter(block => block.trim())

    for (const block of structuredBlocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
      let currentRFID = ''
      let currentData: any = {}

      for (const line of lines) {
        const rfidMatch = line.match(/^RFID:\s*(.+)$/i)
        const visualTagMatch = line.match(/^Visual Tag:\s*(.+)$/i)
        const weightMatch = line.match(/^Weight:\s*([\d.]+)/i)
        const breedMatch = line.match(/^Breed:\s*(.+)$/i)
        const sexMatch = line.match(/^Sex:\s*(.+)$/i)
        const priceMatch = line.match(/^Price:\s*\$?([\d.,]+)/i)

        if (rfidMatch) {
          currentRFID = rfidMatch[1].replace(/[-\s]/g, '').trim()
          if (currentRFID) {
            rfids.push(currentRFID)
            currentData = {}
          }
        } else if (currentRFID) {
          if (visualTagMatch) currentData.visualTag = visualTagMatch[1]
          if (weightMatch) currentData.weight = parseFloat(weightMatch[1])
          if (breedMatch) currentData.breed = breedMatch[1]
          if (sexMatch) currentData.sex = sexMatch[1]
          if (priceMatch) currentData.cost = parseFloat(priceMatch[1].replace(/,/g, ''))
        }
      }

      if (currentRFID && Object.keys(currentData).length > 0) {
        details[currentRFID] = currentData
      }
    }

    // If structured parsing didn't work, fall back to regular RFID extraction
    if (rfids.length === 0) {
      const fallbackRFIDs = parseRFIDsFromText(text)
      return { rfids: fallbackRFIDs, details: {} }
    }

    return { rfids: Array.from(new Set(rfids)), details }
  }

  const parseRFIDsFromText = (text: string): string[] => {
    const foundRFIDs: string[] = []

    // Clean up common OCR errors: replace O with 0, remove extra spaces
    const cleanedText = text.replace(/[Oo]/g, '0').replace(/\s+/g, ' ')

    // Pattern 1: McCall Livestock format
    // Example: "0124 000174878652" or with extra data "0124 000174878652 0000/00/00"
    const mccallPattern = /(\d{4})\s+(\d{12})/g
    let mccallMatches = cleanedText.matchAll(mccallPattern)
    for (const match of mccallMatches) {
      foundRFIDs.push(`${match[1]}${match[2]}`)
    }

    // Pattern 2: Standard 15-16 digit RFID tags (continuous or with spaces/dashes)
    // Example: "840003123456789" or "840 003 123456789"
    const standardPattern = /\b\d{15,16}\b/g
    const standardMatches = cleanedText.match(standardPattern)
    if (standardMatches) {
      foundRFIDs.push(...standardMatches)
    }

    // Pattern 3: RFID with dashes or spaces (3-3-9 or 3-3-10 format)
    // Example: "840-003-123456789" or "840 003 123456789"
    const formattedPattern = /\b(\d{3})[-\s](\d{3})[-\s](\d{9,10})\b/g
    const formattedMatches = cleanedText.matchAll(formattedPattern)
    for (const match of formattedMatches) {
      foundRFIDs.push(`${match[1]}${match[2]}${match[3]}`)
    }

    // Pattern 4: Canadian CCIA format
    // Example: "CA 124 000174878652" or "CAN 0124 000174878652"
    const cciaPattern = /(?:CA|CAN)?\s*(\d{3,4})\s+(\d{12})/gi
    const cciaMatches = cleanedText.matchAll(cciaPattern)
    for (const match of cciaMatches) {
      foundRFIDs.push(`${match[1]}${match[2]}`)
    }

    // Pattern 5: Line-by-line numbers (when in structured list)
    // Handles 10-16 digit numbers on their own line
    const lines = cleanedText.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      // Match numbers with optional spaces/dashes
      const lineMatch = trimmed.match(/^[\d\s-]{12,20}$/)
      if (lineMatch) {
        const cleaned = lineMatch[0].replace(/[-\s]/g, '')
        if (cleaned.length >= 10 && cleaned.length <= 16 && /^\d+$/.test(cleaned)) {
          foundRFIDs.push(cleaned)
        }
      }
    }

    // Pattern 6: Numbers in table columns (look for consistent patterns)
    // Example: "Tag    Weight" then "840003123456789    450"
    const tablePattern = /\b(\d{12,16})\s+\d{2,4}\b/g
    const tableMatches = cleanedText.matchAll(tablePattern)
    for (const match of tableMatches) {
      foundRFIDs.push(match[1])
    }

    // Pattern 7: Visual tags (4-6 digits) - only if no electronic tags found
    const visualTagPattern = /\b\d{4,6}\b/g
    const visualMatches = cleanedText.match(visualTagPattern)
    if (visualMatches && foundRFIDs.length === 0) {
      foundRFIDs.push(...visualMatches)
    }

    // Remove duplicates and filter valid RFIDs
    return Array.from(new Set(foundRFIDs)).filter((rfid) => {
      // Must be at least 4 digits (for visual tags) or 10+ for electronic tags
      const isValid = rfid.length >= 4 && /^\d+$/.test(rfid)
      // Exclude common false positives
      const notFalsePositive =
        !rfid.match(/^(19|20)\d{2}$/) && // Not a year
        !rfid.match(/^(0?[1-9]|1[0-2])(0?[1-9]|[12]\d|3[01])$/) && // Not a date
        !rfid.match(/^[0-9]{1,3}$/) && // Not a small number (unless visual tag range)
        !(rfid.length < 10 && parseInt(rfid) < 1000) // Not page numbers
      return isValid && notFalsePositive
    })
  }

  const processImageWithOpenAI = async (imageFile: Blob) => {
    setIsProcessing(true)
    setStep("processing")

    try {
      const formData = new FormData()
      formData.append('file', imageFile)

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'OpenAI OCR failed')
      }

      const text = data.text
      setExtractedText(text)

      // Parse structured cattle data from extracted text
      const parsed = parseStructuredCattleData(text)
      const uniqueRFIDs = parsed.rfids

      setParsedRFIDs(uniqueRFIDs)
      setExtractedCattleData(parsed.details)
      setStep("review")

      if (uniqueRFIDs.length === 0) {
        toast({
          title: "No RFID Numbers Found",
          description: "Unable to detect RFID numbers in the image. Please try again with a clearer photo.",
          variant: "destructive",
        })
      } else {
        const hasAdditionalData = Object.keys(parsed.details).length > 0
        toast({
          title: "OCR Complete (OpenAI)",
          description: `Found ${uniqueRFIDs.length} RFID number(s)${hasAdditionalData ? ' with additional cattle data' : ''}`,
        })
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error"
      toast({
        title: "OpenAI OCR Error",
        description: `${errorMessage}. Falling back to standard OCR...`,
        variant: "destructive",
      })

      // Fallback to Tesseract
      await processImageWithTesseract(imageFile)
    } finally {
      setIsProcessing(false)
    }
  }

  const processImageWithTesseract = async (imageFile: Blob) => {
    setIsProcessing(true)
    setStep("processing")

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("OCR processing timed out after 60 seconds")), 60000)
      })

      const ocrPromise = Tesseract.recognize(imageFile, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            // Could show progress here
          }
        },
      })

      const result = await Promise.race([ocrPromise, timeoutPromise]) as Tesseract.RecognizeResult

      const text = result.data.text
      setExtractedText(text)

      // Parse RFID numbers from extracted text
      const uniqueRFIDs = parseRFIDsFromText(text)

      setParsedRFIDs(uniqueRFIDs)
      setStep("review")

      if (uniqueRFIDs.length === 0) {
        toast({
          title: "No RFID Numbers Found",
          description:
            "Unable to detect RFID numbers in the image. Please try again with a clearer photo.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "OCR Complete",
          description: `Found ${uniqueRFIDs.length} RFID number(s)`,
        })
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error"
      toast({
        title: "OCR Error",
        description: `Failed to process image: ${errorMessage}. Please try uploading a different image or paste text manually.`,
        variant: "destructive",
      })
      setStep("input")
    } finally {
      setIsProcessing(false)
    }
  }

  const processImage = async (imageFile: Blob) => {
    // Try OpenAI Vision first for best accuracy, automatically fallback to Tesseract if not available
    await processImageWithOpenAI(imageFile)
  }

  const handleManualEdit = (text: string) => {
    const lines = text.split("\n").map((line) => line.trim()).filter(Boolean)
    setParsedRFIDs(lines)
  }

  const handleContinueToDetails = () => {
    if (parsedRFIDs.length === 0) {
      toast({
        title: "No RFID Numbers",
        description: "Please scan or enter RFID numbers first.",
        variant: "destructive",
      })
      return
    }

    if (!selectedPenId) {
      toast({
        title: "Select a Pen",
        description: "Please select a pen to assign the cattle.",
        variant: "destructive",
      })
      return
    }

    setStep("details")
  }

  const handleImport = async (details: CattleDetails[]) => {
    const pen = pens.find((p) => p.id === selectedPenId)
    if (!pen) {
      toast({
        title: "Invalid Pen",
        description: "Selected pen not found.",
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)

    try {
      let successCount = 0
      let duplicateCount = 0

      // Get existing cattle to check for duplicates
      const existingCattle = await firebaseDataStore.getCattle()

      for (const detail of details) {
        // Check if cattle with this RFID already exists
        const isDuplicate = existingCattle.find((c) => c.rfidTag === detail.rfid)

        if (isDuplicate) {
          duplicateCount++
          continue
        }

        const today = new Date().toISOString().split("T")[0]

        // Create new cattle entry with weight and cost details
        const cattleData = {
          tagNumber: detail.visualTag || detail.rfid.slice(-4), // Use custom visual tag or last 4 digits
          rfidTag: detail.rfid,
          penId: selectedPenId,
          barnId: pen.barnId,
          stage: "receiving" as const,
          arrivalDate: today,
          breed: "Unknown",
          sex: "Unknown" as const,
          weight: detail.weight,
          arrivalWeight: detail.weight,
          purchaseWeight: detail.weight,
          purchasePrice: detail.cost,
          purchaseDate: today,
          lot: "Imported",
          status: "Active" as const,
          healthStatus: "Healthy" as const,
          identificationMethod: "RFID",
          notes: `Imported via RFID scan on ${new Date().toLocaleDateString()}. Cost per lb: $${detail.costPerPound.toFixed(2)}`,
        }

        await firebaseDataStore.addCattle(cattleData as any)
        successCount++
      }

      // Update pen count
      await firebasePenStore.updatePen(selectedPenId, {
        currentCount: pen.currentCount + successCount,
      })

      const totalCost = details.reduce((sum, d) => sum + d.cost, 0)
      const totalWeight = details.reduce((sum, d) => sum + d.weight, 0)

      toast({
        title: "Import Complete",
        description: `Successfully imported ${successCount} cattle (${totalWeight.toFixed(0)} lbs total, $${totalCost.toFixed(2)} total cost). ${
          duplicateCount > 0 ? `${duplicateCount} duplicates skipped.` : ""
        }`,
      })

      // Reset and close
      setStep("input")
      setExtractedText("")
      setParsedRFIDs([])
      setCattleDetails([])
      setExtractedCattleData({})
      onOpenChange(false)

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error("RFID Import Error:", error)
      toast({
        title: "Import Error",
        description: error?.message || "Failed to import cattle. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    stopCamera()
    setStep("input")
    setExtractedText("")
    setParsedRFIDs([])
    setExtractedCattleData({})
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Import RFID Tags</DialogTitle>
            <DialogDescription>
              Upload a PDF, capture an image, or paste RFID tag data to bulk import cattle
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 pr-2">{/* Scrollable content wrapper */}

          {step === "input" && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="h-20 sm:h-24 flex-col gap-2"
                >
                  <Upload className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-center text-sm sm:text-base">Upload PDF/Image</span>
                </Button>

                <Button
                  onClick={startCamera}
                  variant="outline"
                  className="h-20 sm:h-24 flex-col gap-2"
                  disabled={isCameraActive}
                >
                  <Camera className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-sm sm:text-base">Capture Photo</span>
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileUpload}
              />

              {isCameraActive && (
                <div className="space-y-3">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg border"
                  />
                  <div className="flex gap-2">
                    <Button onClick={capturePhoto} className="flex-1">
                      <Camera className="h-4 w-4 mr-2" />
                      Capture
                    </Button>
                    <Button
                      onClick={stopCamera}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />

              <div className="space-y-2">
                <Label>Or Paste RFID Data</Label>
                <Textarea
                  placeholder="Paste from any RFID report or enter tag numbers&#10;&#10;Supported formats:&#10;• McCall: 0124 000174878652 0000/00/00 NONE 25/10/20&#10;• Standard: 840003123456789&#10;• Formatted: 840-003-123456789&#10;• CCIA: CA 124 000174878652&#10;• Visual tags: 1234&#10;• One number per line"
                  rows={4}
                  className="text-sm"
                  onChange={(e) => {
                    const text = e.target.value
                    if (!text.trim()) return

                    const foundRFIDs = parseRFIDsFromText(text)

                    if (foundRFIDs.length > 0) {
                      setParsedRFIDs(foundRFIDs)
                      setStep("review")
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Supports McCall, CCIA, standard RFID formats, and visual tags
                </p>
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="py-12 flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Processing Document...</p>
              <p className="text-sm text-muted-foreground">
                Extracting RFID numbers with AI-powered OCR
              </p>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4 py-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label>Detected RFID Numbers ({parsedRFIDs.length})</Label>
                    {parsedRFIDs.length > 0 ? (
                      <Badge variant="default">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Ready to Import
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        No Numbers Found
                      </Badge>
                    )}
                  </div>

                  <Textarea
                    value={parsedRFIDs.join("\n")}
                    onChange={(e) => handleManualEdit(e.target.value)}
                    rows={6}
                    placeholder="Edit RFID numbers, one per line"
                    className="font-mono text-xs sm:text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    You can edit, add, or remove numbers before importing
                  </p>
                </CardContent>
              </Card>

              {extractedText && (
                <Card>
                  <CardContent className="p-4">
                    <Label className="mb-2 block">Raw OCR Text</Label>
                    <Textarea
                      value={extractedText}
                      readOnly
                      rows={4}
                      className="font-mono text-xs text-muted-foreground"
                    />
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label>Assign to Pen *</Label>
                {pens.length === 0 ? (
                  <div className="p-4 border border-dashed rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-3">
                      No pens available. Please create a pen first to import cattle.
                    </p>
                    <Button
                      type="button"
                      onClick={() => setShowAddPenDialog(true)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Pen
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Select value={selectedPenId} onValueChange={setSelectedPenId} className="flex-1">
                      <SelectTrigger>
                        <SelectValue placeholder="Select pen" />
                      </SelectTrigger>
                      <SelectContent>
                        {pens.map((pen) => (
                          <SelectItem key={pen.id} value={pen.id}>
                            {pen.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowAddPenDialog(true)}
                      title="Create new pen"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "details" && (
            <CattleDetailsEntry
              rfids={parsedRFIDs}
              onComplete={handleImport}
              onBack={() => setStep("review")}
              initialData={extractedCattleData}
            />
          )}
          </div>{/* End scrollable content wrapper */}

          <DialogFooter className="flex-shrink-0 flex-col sm:flex-row gap-2">
            {step === "input" && (
              <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
                Cancel
              </Button>
            )}

            {step === "review" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("input")
                    setExtractedText("")
                    setParsedRFIDs([])
                    setExtractedCattleData({})
                  }}
                  className="w-full sm:w-auto"
                >
                  Back
                </Button>
                <Button
                  onClick={handleContinueToDetails}
                  disabled={parsedRFIDs.length === 0 || !selectedPenId}
                  className="w-full sm:w-auto"
                >
                  Continue to Details ({parsedRFIDs.length} Cattle)
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddPenDialog
        open={showAddPenDialog}
        onOpenChange={(open) => {
          setShowAddPenDialog(open)
          // Refresh pens list when dialog closes (pen might have been created)
          if (!open) {
            setPens(firebasePenStore.getPens())
          }
        }}
      />
    </>
  )
}

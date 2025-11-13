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
import { Camera, Upload, Loader2, CheckCircle2, XCircle, FileText, Sparkles } from "lucide-react"
import Tesseract from "tesseract.js"
import { firebaseDataStore } from "@/lib/data-store-firebase"
import { firebasePenStore, type Pen } from "@/lib/pen-store-firebase"
import { firebaseBatchStore, type Batch } from "@/lib/batch-store-firebase"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect } from "react"
import { CattleDetailsEntry, type CattleDetails } from "@/components/cattle-details-entry"
import { Switch } from "@/components/ui/switch"

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
  const [batches, setBatches] = useState<Batch[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [step, setStep] = useState<"input" | "processing" | "review" | "details">("input")
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedText, setExtractedText] = useState("")
  const [parsedRFIDs, setParsedRFIDs] = useState<string[]>([])
  const [selectedPenId, setSelectedPenId] = useState(defaultPenId || "")
  const [selectedBatchId, setSelectedBatchId] = useState(defaultBatchId || "none")
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [useOpenAI, setUseOpenAI] = useState(false)
  const [cattleDetails, setCattleDetails] = useState<CattleDetails[]>([])

  // Load pens and batches when dialog opens
  useEffect(() => {
    if (open) {
      setPens(firebasePenStore.getPens())
      setBatches(firebaseBatchStore.getBatches())
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
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("PDF processing timed out after 60 seconds")), 60000)
      })

      const pdfPromise = async () => {
        // Dynamically import pdfjs-dist only on client side
        const pdfjsLib = await import("pdfjs-dist")

        // Configure worker - try HTTPS first
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

        const arrayBuffer = await pdfFile.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

        let fullText = ""

        // Extract text from all pages
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum)
          const textContent = await page.getTextContent()
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(" ")
          fullText += pageText + "\n"
        }

        return fullText
      }

      const fullText = await Promise.race([pdfPromise(), timeoutPromise]) as string

      setExtractedText(fullText)

      // Parse RFID numbers from extracted text
      const rfids = parseRFIDsFromText(fullText)

      setParsedRFIDs(rfids)
      setStep("review")

      if (rfids.length === 0) {
        toast({
          title: "No RFID Numbers Found",
          description: "Unable to detect RFID numbers in the PDF. Please try again or enter manually.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "PDF Processed",
          description: `Found ${rfids.length} RFID number(s)`,
        })
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error"
      toast({
        title: "PDF Processing Error",
        description: `Failed to process PDF: ${errorMessage}. Please try uploading a different file or paste text manually.`,
        variant: "destructive",
      })
      setStep("input")
    } finally {
      setIsProcessing(false)
    }
  }

  const parseRFIDsFromText = (text: string): string[] => {
    const foundRFIDs: string[] = []

    // Pattern 1: McCall Livestock format
    // Example: "0124 000174878652 0000/00/00 NONE 25/10/20"
    const mccallPattern = /(\d{4})\s+(\d{12})(?:\s+\d{4}\/\d{2}\/\d{2}\s+\w+\s+\d{2}\/\d{2}\/\d{2})?/g
    let mccallMatches = text.matchAll(mccallPattern)
    for (const match of mccallMatches) {
      foundRFIDs.push(`${match[1]}${match[2]}`)
    }

    // Pattern 2: Standard 15-16 digit RFID tags
    // Example: "840003123456789" or "8400031234567890"
    const standardPattern = /\b\d{15,16}\b/g
    const standardMatches = text.match(standardPattern)
    if (standardMatches) {
      foundRFIDs.push(...standardMatches)
    }

    // Pattern 3: RFID with dashes or spaces
    // Example: "840-003-123456789" or "840 003 123456789"
    const formattedPattern = /\b\d{3}[-\s]\d{3}[-\s]\d{9,10}\b/g
    const formattedMatches = text.match(formattedPattern)
    if (formattedMatches) {
      foundRFIDs.push(...formattedMatches.map(m => m.replace(/[-\s]/g, "")))
    }

    // Pattern 4: Visual tags in tables (often 4-6 digits)
    // Example: "1234" or "123456" in structured data
    const visualTagPattern = /\b\d{4,6}\b/g
    const visualMatches = text.match(visualTagPattern)
    if (visualMatches && foundRFIDs.length === 0) {
      // Only use visual tags if no RFID tags found
      foundRFIDs.push(...visualMatches)
    }

    // Pattern 5: Canadian CCIA format
    // Example: "CA 124 000174878652"
    const cciaPattern = /(?:CA|CAN)?\s*(\d{3,4})\s+(\d{12})/gi
    const cciaMatches = text.matchAll(cciaPattern)
    for (const match of cciaMatches) {
      foundRFIDs.push(`${match[1]}${match[2]}`)
    }

    // Pattern 6: Line-by-line numbers (when in structured list)
    const lines = text.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      // If line starts with digits and has 10+ consecutive digits
      const lineMatch = trimmed.match(/^\d{10,16}$/)
      if (lineMatch) {
        foundRFIDs.push(lineMatch[0])
      }
    }

    // Remove duplicates and filter valid RFIDs
    return Array.from(new Set(foundRFIDs)).filter((rfid) => {
      // Must be at least 4 digits (for visual tags) or 10+ for electronic tags
      const isValid = rfid.length >= 4 && /^\d+$/.test(rfid)
      // Exclude common false positives like dates, page numbers
      const notFalsePositive = !rfid.match(/^(19|20)\d{2}$/) && // Not a year
                               !rfid.match(/^(0?[1-9]|1[0-2])(0?[1-9]|[12]\d|3[01])$/) // Not a date
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

      // Parse RFID numbers from extracted text
      const uniqueRFIDs = parseRFIDsFromText(text)

      setParsedRFIDs(uniqueRFIDs)
      setStep("review")

      if (uniqueRFIDs.length === 0) {
        toast({
          title: "No RFID Numbers Found",
          description: "Unable to detect RFID numbers in the image. Please try again with a clearer photo.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "OCR Complete (OpenAI)",
          description: `Found ${uniqueRFIDs.length} RFID number(s) using advanced AI`,
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
    if (useOpenAI) {
      await processImageWithOpenAI(imageFile)
    } else {
      await processImageWithTesseract(imageFile)
    }
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
          tagNumber: detail.rfid.slice(-4), // Use last 4 digits as visual tag
          rfidTag: detail.rfid,
          penId: selectedPenId,
          barnId: pen.barnId,
          batchId: selectedBatchId && selectedBatchId !== "none" ? selectedBatchId : undefined,
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
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <Label htmlFor="use-openai" className="cursor-pointer">
                        Use OpenAI Vision (Better Accuracy)
                      </Label>
                    </div>
                    <Switch
                      id="use-openai"
                      checked={useOpenAI}
                      onCheckedChange={setUseOpenAI}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {useOpenAI
                      ? "Using GPT-4o for enhanced OCR accuracy. Requires API key."
                      : "Using standard Tesseract OCR. Free but less accurate."}
                  </p>
                </CardContent>
              </Card>

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
              <p className="text-lg font-medium">Processing Image...</p>
              <p className="text-sm text-muted-foreground">
                Extracting RFID numbers using OCR
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
                <Select value={selectedPenId} onValueChange={setSelectedPenId}>
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
              </div>

              <div className="space-y-2">
                <Label>Assign to Pen Group (Optional)</Label>
                <Select
                  value={selectedBatchId}
                  onValueChange={setSelectedBatchId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No pen group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Pen Group</SelectItem>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === "details" && (
            <CattleDetailsEntry
              rfids={parsedRFIDs}
              onComplete={handleImport}
              onBack={() => setStep("review")}
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
    </>
  )
}

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
import { Camera, Upload, Loader2, CheckCircle2, XCircle } from "lucide-react"
import Tesseract from "tesseract.js"
import { dataStore } from "@/lib/data-store"
import { usePenStore } from "@/hooks/use-pen-store"
import { useBatchStore } from "@/hooks/use-batch-store"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface RFIDImageImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultPenId?: string
  defaultBatchId?: string
}

export function RFIDImageImportDialog({
  open,
  onOpenChange,
  defaultPenId,
  defaultBatchId,
}: RFIDImageImportDialogProps) {
  const { toast } = useToast()
  const { pens } = usePenStore()
  const { batches } = useBatchStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [step, setStep] = useState<"input" | "processing" | "review">("input")
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedText, setExtractedText] = useState("")
  const [parsedRFIDs, setParsedRFIDs] = useState<string[]>([])
  const [selectedPenId, setSelectedPenId] = useState(defaultPenId || "")
  const [selectedBatchId, setSelectedBatchId] = useState(defaultBatchId || "")
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processImage(file)
    }
  }

  const processImage = async (imageFile: Blob) => {
    setIsProcessing(true)
    setStep("processing")

    try {
      const result = await Tesseract.recognize(imageFile, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            // Could show progress here
          }
        },
      })

      const text = result.data.text
      setExtractedText(text)

      // Parse RFID numbers from text
      // Common RFID patterns:
      // - 15-digit numeric: 840003123456789
      // - Alphanumeric with spaces or dashes: 840-003-123456789 or 840 003 123456789
      // - Visual tag numbers: 123, 456, etc.
      const rfidPatterns = [
        /\b\d{15}\b/g, // 15-digit RFID
        /\b\d{3}[-\s]?\d{3}[-\s]?\d{9}\b/g, // 840-003-123456789 format
        /\b[A-Z0-9]{10,20}\b/g, // Alphanumeric 10-20 chars
        /\b\d{3,4}\b/g, // Visual tag numbers (3-4 digits)
      ]

      let foundRFIDs: string[] = []
      for (const pattern of rfidPatterns) {
        const matches = text.match(pattern)
        if (matches) {
          foundRFIDs = foundRFIDs.concat(
            matches.map((m) => m.replace(/[-\s]/g, ""))
          )
        }
      }

      // Remove duplicates and filter out common false positives
      const uniqueRFIDs = Array.from(new Set(foundRFIDs)).filter((rfid) => {
        // Must be at least 3 digits
        return rfid.length >= 3
      })

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
    } catch (error) {
      toast({
        title: "OCR Error",
        description: "Failed to process image. Please try again.",
        variant: "destructive",
      })
      setStep("input")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleManualEdit = (text: string) => {
    const lines = text.split("\n").map((line) => line.trim()).filter(Boolean)
    setParsedRFIDs(lines)
  }

  const handleImport = () => {
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

    const pen = pens.find((p) => p.id === selectedPenId)
    if (!pen) {
      toast({
        title: "Invalid Pen",
        description: "Selected pen not found.",
        variant: "destructive",
      })
      return
    }

    let successCount = 0
    let duplicateCount = 0

    parsedRFIDs.forEach((rfid) => {
      // Check if cattle with this RFID already exists
      const existingCattle = dataStore
        .getCattle()
        .find((c) => c.rfidTag === rfid)

      if (existingCattle) {
        duplicateCount++
        return
      }

      // Create new cattle entry
      const cattleData = {
        rfidTag: rfid,
        visualTag: rfid.slice(-4), // Use last 4 digits as visual tag
        penId: selectedPenId,
        barnId: pen.barnId,
        batchId: selectedBatchId || undefined,
        stage: "receiving" as const,
        arrivalDate: new Date().toISOString().split("T")[0],
        breed: "Unknown",
        sex: "Unknown" as const,
        arrivalWeight: 0,
        notes: "Imported via RFID image scan",
      }

      dataStore.addCattle(cattleData)
      successCount++
    })

    toast({
      title: "Import Complete",
      description: `Successfully imported ${successCount} cattle. ${
        duplicateCount > 0 ? `${duplicateCount} duplicates skipped.` : ""
      }`,
    })

    // Reset and close
    setStep("input")
    setExtractedText("")
    setParsedRFIDs([])
    onOpenChange(false)
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Import RFID Tags via Image</DialogTitle>
            <DialogDescription>
              Capture or upload an image of RFID tag numbers to bulk import
              cattle
            </DialogDescription>
          </DialogHeader>

          {step === "input" && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={startCamera}
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  disabled={isCameraActive}
                >
                  <Camera className="h-6 w-6" />
                  Capture Photo
                </Button>

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="h-24 flex-col gap-2"
                >
                  <Upload className="h-6 w-6" />
                  Upload Image
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
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
                <Label>Or Enter Manually</Label>
                <Textarea
                  placeholder="Enter RFID numbers, one per line&#10;840003123456789&#10;840003123456790"
                  rows={4}
                  onChange={(e) => {
                    const lines = e.target.value
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean)
                    if (lines.length > 0) {
                      setParsedRFIDs(lines)
                      setStep("review")
                    }
                  }}
                />
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
                    rows={8}
                    placeholder="Edit RFID numbers, one per line"
                    className="font-mono text-sm"
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
                <Label>Assign to Batch (Optional)</Label>
                <Select
                  value={selectedBatchId}
                  onValueChange={setSelectedBatchId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No batch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Batch</SelectItem>
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

          <DialogFooter>
            {step === "input" && (
              <Button variant="outline" onClick={handleClose}>
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
                >
                  Back
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={parsedRFIDs.length === 0 || !selectedPenId}
                >
                  Import {parsedRFIDs.length} Cattle
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

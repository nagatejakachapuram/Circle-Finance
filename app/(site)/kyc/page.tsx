"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { WalletGuard } from "@/components/wallet-guard"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { GlassCard } from "@/components/glass-card"
import { FadeIn } from "@/components/motion"
import AuroraBg from "@/components/aurora-bg"
import { 
  Shield, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  MapPin, 
  Calendar,
  FileText,
  Camera,
  ArrowRight,
  ArrowLeft
} from 'lucide-react'

type KYCStep = "personal" | "address" | "documents" | "verification" | "complete"

const countries = [
  "United States",
  "Canada", 
  "United Kingdom",
  "Germany",
  "France",
  "Australia",
  "Japan",
  "Singapore",
  "Switzerland",
  "Netherlands"
]

const documentTypes = [
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "national_id", label: "National ID Card" },
  { value: "state_id", label: "State ID Card" }
]

export default function KYCPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<KYCStep>("personal")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    documentType: "",
    documentNumber: "",
    documentFront: null as File | null,
    documentBack: null as File | null,
    selfie: null as File | null
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (field: string, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }))
  }

  const handleNext = () => {
    const steps: KYCStep[] = ["personal", "address", "documents", "verification", "complete"]
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  const handleBack = () => {
    const steps: KYCStep[] = ["personal", "address", "documents", "verification", "complete"]
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setCurrentStep("complete")
    setIsSubmitting(false)
  }

  const getStepNumber = (step: KYCStep) => {
    const steps: KYCStep[] = ["personal", "address", "documents", "verification", "complete"]
    return steps.indexOf(step) + 1
  }

  const isStepComplete = (step: KYCStep) => {
    const steps: KYCStep[] = ["personal", "address", "documents", "verification", "complete"]
    return steps.indexOf(step) < steps.indexOf(currentStep)
  }

  return (
    <div className="min-h-dvh bg-white relative overflow-hidden">
      <Header />
      <main className="container px-4 md:px-6 py-10 md:py-16 relative">
        <AuroraBg intensity={0.5} />
        
        <WalletGuard gatedText="Connect your wallet to access KYC verification.">
          <div className="max-w-4xl mx-auto">
            <FadeIn>
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                  KYC Verification
                </h1>
                <p className="text-muted-foreground mt-2">
                  Complete your identity verification to access tokenized real estate investments
                </p>
              </div>
            </FadeIn>

            {/* Progress Steps */}
            <FadeIn delay={0.05}>
              <div className="flex items-center justify-center mb-8">
                <div className="flex items-center space-x-4">
                  {[
                    { step: "personal", label: "Personal", icon: User },
                    { step: "address", label: "Address", icon: MapPin },
                    { step: "documents", label: "Documents", icon: FileText },
                    { step: "verification", label: "Review", icon: Shield },
                    { step: "complete", label: "Complete", icon: CheckCircle2 }
                  ].map(({ step, label, icon: Icon }, index) => (
                    <div key={step} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                            currentStep === step
                              ? "border-[#3A86FF] bg-[#3A86FF] text-white"
                              : isStepComplete(step as KYCStep)
                              ? "border-[#3A86FF] bg-[#3A86FF] text-white"
                              : "border-slate-300 bg-white text-slate-400"
                          }`}
                        >
                          {isStepComplete(step as KYCStep) ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Icon className="w-5 h-5" />
                          )}
                        </div>
                        <span className="text-xs mt-2 text-muted-foreground">{label}</span>
                      </div>
                      {index < 4 && (
                        <div
                          className={`w-12 h-0.5 mx-2 transition-colors ${
                            isStepComplete(step as KYCStep) ? "bg-[#3A86FF]" : "bg-slate-300"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Form Content */}
            <FadeIn delay={0.1}>
              <GlassCard className="max-w-2xl mx-auto">
                {currentStep === "personal" && (
                  <PersonalInfoStep 
                    formData={formData}
                    onChange={handleInputChange}
                    onNext={handleNext}
                  />
                )}
                
                {currentStep === "address" && (
                  <AddressStep 
                    formData={formData}
                    onChange={handleInputChange}
                    onNext={handleNext}
                    onBack={handleBack}
                  />
                )}
                
                {currentStep === "documents" && (
                  <DocumentsStep 
                    formData={formData}
                    onChange={handleInputChange}
                    onFileUpload={handleFileUpload}
                    onNext={handleNext}
                    onBack={handleBack}
                  />
                )}
                
                {currentStep === "verification" && (
                  <VerificationStep 
                    formData={formData}
                    onSubmit={handleSubmit}
                    onBack={handleBack}
                    isSubmitting={isSubmitting}
                  />
                )}
                
                {currentStep === "complete" && (
                  <CompleteStep />
                )}
              </GlassCard>
            </FadeIn>
          </div>
        </WalletGuard>
      </main>
      <Footer />
    </div>
  )
}

function PersonalInfoStep({ 
  formData, 
  onChange, 
  onNext 
}: { 
  formData: any
  onChange: (field: string, value: string) => void
  onNext: () => void 
}) {
  const isValid = formData.firstName && formData.lastName && formData.dateOfBirth && formData.email && formData.phone

  return (
    <div className="space-y-6">
      <div className="text-center">
        <User className="w-12 h-12 text-[#3A86FF] mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-foreground">Personal Information</h2>
        <p className="text-muted-foreground mt-2">
          Please provide your personal details as they appear on your government-issued ID
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            First Name *
          </label>
          <Input
            value={formData.firstName}
            onChange={(e) => onChange("firstName", e.target.value)}
            placeholder="Enter your first name"
            className="bg-white border-slate-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Last Name *
          </label>
          <Input
            value={formData.lastName}
            onChange={(e) => onChange("lastName", e.target.value)}
            placeholder="Enter your last name"
            className="bg-white border-slate-200"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Date of Birth *
        </label>
        <Input
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => onChange("dateOfBirth", e.target.value)}
          className="bg-white border-slate-200"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Email Address *
        </label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => onChange("email", e.target.value)}
          placeholder="Enter your email address"
          className="bg-white border-slate-200"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Phone Number *
        </label>
        <Input
          type="tel"
          value={formData.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          placeholder="Enter your phone number"
          className="bg-white border-slate-200"
        />
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={onNext}
          disabled={!isValid}
          className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95"
        >
          Continue
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

function AddressStep({ 
  formData, 
  onChange, 
  onNext, 
  onBack 
}: { 
  formData: any
  onChange: (field: string, value: string) => void
  onNext: () => void
  onBack: () => void
}) {
  const isValid = formData.address && formData.city && formData.state && formData.zipCode && formData.country

  return (
    <div className="space-y-6">
      <div className="text-center">
        <MapPin className="w-12 h-12 text-[#3A86FF] mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-foreground">Address Information</h2>
        <p className="text-muted-foreground mt-2">
          Provide your current residential address
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Street Address *
        </label>
        <Input
          value={formData.address}
          onChange={(e) => onChange("address", e.target.value)}
          placeholder="Enter your street address"
          className="bg-white border-slate-200"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            City *
          </label>
          <Input
            value={formData.city}
            onChange={(e) => onChange("city", e.target.value)}
            placeholder="Enter your city"
            className="bg-white border-slate-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            State/Province *
          </label>
          <Input
            value={formData.state}
            onChange={(e) => onChange("state", e.target.value)}
            placeholder="Enter your state/province"
            className="bg-white border-slate-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            ZIP/Postal Code *
          </label>
          <Input
            value={formData.zipCode}
            onChange={(e) => onChange("zipCode", e.target.value)}
            placeholder="Enter your ZIP/postal code"
            className="bg-white border-slate-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Country *
          </label>
          <Select value={formData.country} onValueChange={(value) => onChange("country", value)}>
            <SelectTrigger className="bg-white border-slate-200">
              <SelectValue placeholder="Select your country" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200">
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-between">
        <Button 
          onClick={onBack}
          variant="outline"
          className="border-slate-200 text-foreground hover:bg-slate-100"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back
        </Button>
        <Button 
          onClick={onNext}
          disabled={!isValid}
          className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95"
        >
          Continue
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

function DocumentsStep({ 
  formData, 
  onChange, 
  onFileUpload, 
  onNext, 
  onBack 
}: { 
  formData: any
  onChange: (field: string, value: string) => void
  onFileUpload: (field: string, file: File | null) => void
  onNext: () => void
  onBack: () => void
}) {
  const isValid = formData.documentType && formData.documentNumber && formData.documentFront && formData.selfie

  return (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="w-12 h-12 text-[#3A86FF] mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-foreground">Document Verification</h2>
        <p className="text-muted-foreground mt-2">
          Upload your government-issued ID and take a selfie for verification
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Document Type *
        </label>
        <Select value={formData.documentType} onValueChange={(value) => onChange("documentType", value)}>
          <SelectTrigger className="bg-white border-slate-200">
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            {documentTypes.map((doc) => (
              <SelectItem key={doc.value} value={doc.value}>
                {doc.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Document Number *
        </label>
        <Input
          value={formData.documentNumber}
          onChange={(e) => onChange("documentNumber", e.target.value)}
          placeholder="Enter your document number"
          className="bg-white border-slate-200"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FileUpload
          label="Document Front *"
          description="Upload the front of your ID"
          file={formData.documentFront}
          onFileChange={(file) => onFileUpload("documentFront", file)}
          icon={<Upload className="w-6 h-6" />}
        />
        
        {formData.documentType === "drivers_license" && (
          <FileUpload
            label="Document Back"
            description="Upload the back of your ID"
            file={formData.documentBack}
            onFileChange={(file) => onFileUpload("documentBack", file)}
            icon={<Upload className="w-6 h-6" />}
          />
        )}
      </div>

      <FileUpload
        label="Selfie Verification *"
        description="Take a clear selfie holding your ID"
        file={formData.selfie}
        onFileChange={(file) => onFileUpload("selfie", file)}
        icon={<Camera className="w-6 h-6" />}
      />

      <div className="flex justify-between">
        <Button 
          onClick={onBack}
          variant="outline"
          className="border-slate-200 text-foreground hover:bg-slate-100"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back
        </Button>
        <Button 
          onClick={onNext}
          disabled={!isValid}
          className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95"
        >
          Continue
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

function FileUpload({ 
  label, 
  description, 
  file, 
  onFileChange, 
  icon 
}: {
  label: string
  description: string
  file: File | null
  onFileChange: (file: File | null) => void
  icon: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}
      </label>
      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-[#3A86FF] transition-colors">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onFileChange(e.target.files?.[0] || null)}
          className="hidden"
          id={label}
        />
        <label htmlFor={label} className="cursor-pointer">
          {file ? (
            <div className="space-y-2">
              <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
              <p className="text-sm text-foreground font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">Click to change</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-[#3A86FF]">{icon}</div>
              <p className="text-sm text-foreground font-medium">Click to upload</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          )}
        </label>
      </div>
    </div>
  )
}

function VerificationStep({ 
  formData, 
  onSubmit, 
  onBack, 
  isSubmitting 
}: {
  formData: any
  onSubmit: () => void
  onBack: () => void
  isSubmitting: boolean
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="w-12 h-12 text-[#3A86FF] mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-foreground">Review & Submit</h2>
        <p className="text-muted-foreground mt-2">
          Please review your information before submitting for verification
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-medium text-foreground mb-3">Personal Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Name:</span>
              <p className="text-foreground">{formData.firstName} {formData.lastName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Date of Birth:</span>
              <p className="text-foreground">{formData.dateOfBirth}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span>
              <p className="text-foreground">{formData.email}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Phone:</span>
              <p className="text-foreground">{formData.phone}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-medium text-foreground mb-3">Address</h3>
          <div className="text-sm">
            <p className="text-foreground">
              {formData.address}<br />
              {formData.city}, {formData.state} {formData.zipCode}<br />
              {formData.country}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-medium text-foreground mb-3">Documents</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Document Type:</span>
              <span className="text-foreground">
                {documentTypes.find(d => d.value === formData.documentType)?.label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Document Number:</span>
              <span className="text-foreground">{formData.documentNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Files Uploaded:</span>
              <div className="flex items-center space-x-2">
                {formData.documentFront && <Badge variant="outline">ID Front</Badge>}
                {formData.documentBack && <Badge variant="outline">ID Back</Badge>}
                {formData.selfie && <Badge variant="outline">Selfie</Badge>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="text-blue-800 font-medium">Important Notice</p>
            <p className="text-blue-700 mt-1">
              By submitting this form, you confirm that all information provided is accurate and complete. 
              False information may result in account suspension.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button 
          onClick={onBack}
          variant="outline"
          className="border-slate-200 text-foreground hover:bg-slate-100"
          disabled={isSubmitting}
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back
        </Button>
        <Button 
          onClick={onSubmit}
          disabled={isSubmitting}
          className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Submitting...
            </>
          ) : (
            <>
              Submit for Verification
              <Shield className="ml-2 w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function CompleteStep() {
  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-10 h-10 text-green-600" />
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Verification Submitted!</h2>
        <p className="text-muted-foreground mt-2">
          Your KYC application has been submitted successfully. We'll review your information and notify you within 1-2 business days.
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="text-sm text-left">
            <p className="text-green-800 font-medium">What's Next?</p>
            <ul className="text-green-700 mt-2 space-y-1">
              <li>• We'll verify your documents within 1-2 business days</li>
              <li>• You'll receive an email notification once approved</li>
              <li>• After approval, you can start investing in tokenized real estate</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95">
          <Link href="/explore">
            Explore Estates
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="border-slate-200 text-foreground hover:bg-slate-100">
          <Link href="/">
            Return Home
          </Link>
        </Button>
      </div>
    </div>
  )
}
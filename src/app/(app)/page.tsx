"use client"

import * as React from "react"
import {
  IconSparkles,
  IconEdit,
  IconCheck,
  IconX,
  IconChevronDown,
  IconChevronUp,
  IconHelp
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { toast } from "sonner"
import { authFetch } from "@/lib/auth-fetch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { useNextStep } from "nextstepjs"
import { Progress } from "@/components/ui/progress"

interface JobDescription {
  id: string
  title: string
  department: string
  parsedContent: string
}

interface Candidate {
  id: string
  name: string
  currentRole: string
  currentCompany: string
  location: string
  groupName: string
}

interface Rubric {
  id: string
  title: string
  description: string
  weightages: Array<{
    label: string
    weight: number
  }>
  criteria: string[]
}

interface EvaluationScore {
  label: string
  weight: number
  score_out_of_10: number
  justification: string
}

interface RankedCandidate extends Candidate {
  candidateId: string
  candidate_name: string
  rubric_id: string
  rubric_title: string
  scores: EvaluationScore[]
  overall_score_out_of_10: number
  overallScore: number
  summary: string
  rank: number
  rubricTitle: string
}

export default function ShortlistPage() {
  const [currentStep, setCurrentStep] = React.useState(1)
  const [jds, setJDs] = React.useState<JobDescription[]>([])
  const [candidates, setCandidates] = React.useState<Candidate[]>([])
  const [selectedJD, setSelectedJD] = React.useState<string>("")
  const [isLoadingJDs, setIsLoadingJDs] = React.useState(true)
  const [isLoadingCandidates, setIsLoadingCandidates] = React.useState(true)
  const [isGeneratingRubrics, setIsGeneratingRubrics] = React.useState(false)
  const [showRubrics, setShowRubrics] = React.useState(false)
  const [selectedRubricId, setSelectedRubricId] = React.useState<string>("")
  const [confirmedRubric, setConfirmedRubric] = React.useState<string | null>(null)
  const [selectedCandidates, setSelectedCandidates] = React.useState<string[]>([])
  const [isMatching, setIsMatching] = React.useState(false)
  const [rankedCandidates, setRankedCandidates] = React.useState<RankedCandidate[]>([])
  const [editingRubricId, setEditingRubricId] = React.useState<string | null>(null)
  const [editedRubrics, setEditedRubrics] = React.useState<Rubric[]>([])
  const [draftRubric, setDraftRubric] = React.useState<Rubric | null>(null)
  const [step1Collapsed, setStep1Collapsed] = React.useState(false)
  const [step2Collapsed, setStep2Collapsed] = React.useState(false)
  const [expandedGroups, setExpandedGroups] = React.useState<string[]>(["Not Specified"])

  const { startNextStep } = useNextStep();

  const handleStartTour = () => {
    startNextStep("shortlistTour");
  };

  // Fetch JDs and candidates on mount
  React.useEffect(() => {
    fetchJDs()
    fetchCandidates()
  }, [])

  const fetchJDs = async () => {
    try {
      const response = await authFetch("/api/job-descriptions")
      if (!response.ok) throw new Error("Failed to fetch JDs")
      const data = await response.json()
      setJDs(data)
    } catch (error) {
      console.error("Error fetching JDs:", error)
      toast.error("Failed to load job descriptions")
    } finally {
      setIsLoadingJDs(false)
    }
  }

  const fetchCandidates = async () => {
    try {
      const response = await authFetch("/api/candidates")
      if (!response.ok) throw new Error("Failed to fetch candidates")
      const data = await response.json()
      setCandidates(data)
    } catch (error) {
      console.error("Error fetching candidates:", error)
      toast.error("Failed to load candidates")
    } finally {
      setIsLoadingCandidates(false)
    }
  }

  const handleGenerateRubric = async () => {
    const selectedJDData = jds.find((jd) => jd.id.toString() === selectedJD)

    if (!selectedJDData) {
      toast.error("Please select a job description first")
      return
    }

    if (!selectedJDData.parsedContent) {
      toast.error("Selected job description has no content")
      return
    }

    setIsGeneratingRubrics(true)

    try {
      const response = await authFetch("/api/generate-rubrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobDescriptionId: selectedJD,
          jobDescriptionContent: selectedJDData.parsedContent,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate rubrics")
      }

      const data = await response.json()

      if (!data.rubrics || !Array.isArray(data.rubrics) || data.rubrics.length !== 3) {
        throw new Error("Invalid rubrics format received")
      }

      setEditedRubrics(data.rubrics)
      setShowRubrics(true)
      setCurrentStep(2)
      toast.success("Evaluation rubrics generated successfully!")
    } catch (error) {
      console.error("Error generating rubrics:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to generate evaluation rubrics"
      toast.error(errorMessage)
    } finally {
      setIsGeneratingRubrics(false)
    }
  }

  const handleSelectRubric = () => {
    if (selectedRubricId) {
      setConfirmedRubric(selectedRubricId)
      setCurrentStep(3)
      setStep1Collapsed(true)
      setStep2Collapsed(true)
    }
  }

  const handleToggleCandidate = (candidateId: string) => {
    setSelectedCandidates((prev) =>
      prev.includes(candidateId)
        ? prev.filter((id) => id !== candidateId)
        : [...prev, candidateId]
    )
  }

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupName)
        ? prev.filter((g) => g !== groupName)
        : [...prev, groupName]
    )
  }

  const groupedCandidates = React.useMemo(() => {
    const groups: Record<string, Candidate[]> = {}
    candidates.forEach((candidate) => {
      const group = candidate.groupName || "Ungrouped"
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(candidate)
    })
    return groups
  }, [candidates])

  const handleToggleGroupSelection = (groupName: string, groupCandidates: Candidate[]) => {
    const groupCandidateIds = groupCandidates.map((c) => c.id.toString())
    const allSelected = groupCandidateIds.every((id) => selectedCandidates.includes(id))

    if (allSelected) {
      // Deselect all candidates in this group
      setSelectedCandidates((prev) => prev.filter((id) => !groupCandidateIds.includes(id)))
    } else {
      // Select all candidates in this group
      setSelectedCandidates((prev) => {
        const newIds = groupCandidateIds.filter((id) => !prev.includes(id))
        return [...prev, ...newIds]
      })
    }
  }

  const isGroupFullySelected = (groupCandidates: Candidate[]) => {
    const groupCandidateIds = groupCandidates.map((c) => c.id.toString())
    return groupCandidateIds.length > 0 && groupCandidateIds.every((id) => selectedCandidates.includes(id))
  }

  const isGroupPartiallySelected = (groupCandidates: Candidate[]) => {
    const groupCandidateIds = groupCandidates.map((c) => c.id.toString())
    const selectedCount = groupCandidateIds.filter((id) => selectedCandidates.includes(id)).length
    return selectedCount > 0 && selectedCount < groupCandidateIds.length
  }

  const handleMatchCandidates = async () => {
    const selectedJDData = jds.find((jd) => jd.id.toString() === selectedJD)
    const selectedRubricData = editedRubrics.find((r) => r.id === confirmedRubric)

    if (!selectedJDData || !selectedRubricData) {
      toast.error("Missing job description or rubric")
      return
    }

    setIsMatching(true)
    setRankedCandidates([])

    try {
      // Deduplicate candidate IDs to ensure each candidate is only evaluated once
      const candidateIds = [...new Set(selectedCandidates)]

      toast.info(`Evaluating ${candidateIds.length} candidates...`)

      const response = await authFetch("/api/evaluate-candidates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jdId: selectedJDData.id,
          rubric: selectedRubricData,
          candidateIds: candidateIds,
        }),
      })

      if (!response.ok) {
        throw new Error(`Evaluation failed: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Evaluation failed")
      }

      // Transform results to include candidate details
      const rankedResults = data.results.map((result: RankedCandidate) => {
        const candidate = candidates.find((c) => c.id === result.candidateId)
        return {
          ...candidate,
          rank: result.rank,
          overallScore: result.overall_score_out_of_10,
          scores: result.scores,
          summary: result.summary,
          rubricTitle: result.rubric_title,
        }
      })

      setRankedCandidates(rankedResults)

      const message = data.failed > 0
        ? `Evaluated ${data.evaluated} candidates (${data.failed} failed)`
        : `Successfully evaluated ${data.evaluated} candidates!`

      toast.success(message)

      if (data.errors && data.errors.length > 0) {
        console.error("Evaluation errors:", data.errors)
      }
    } catch (error) {
      console.error("Error evaluating candidates:", error)
      toast.error("Failed to evaluate candidates")
      setRankedCandidates([])
    } finally {
      setIsMatching(false)
    }
  }

  const handleEditRubric = (rubricId: string) => {
    const rubricToEdit = editedRubrics.find((r) => r.id === rubricId)
    if (rubricToEdit) {
      setDraftRubric(JSON.parse(JSON.stringify(rubricToEdit)))
    }
    setEditingRubricId(rubricId)
  }

  const handleSaveRubric = () => {
    setDraftRubric(null)
    setEditingRubricId(null)
    toast.success("Rubric updated successfully")
  }

  const handleCancelEdit = () => {
    if (draftRubric && editingRubricId) {
      setEditedRubrics((prev) =>
        prev.map((r) => (r.id === editingRubricId ? draftRubric : r))
      )
    }
    setDraftRubric(null)
    setEditingRubricId(null)
  }

  const handleUpdateRubricTitle = (rubricId: string, title: string) => {
    setEditedRubrics((prev) =>
      prev.map((r) => (r.id === rubricId ? { ...r, title } : r))
    )
  }

  const handleUpdateRubricDescription = (rubricId: string, description: string) => {
    setEditedRubrics((prev) =>
      prev.map((r) => (r.id === rubricId ? { ...r, description } : r))
    )
  }

  const handleUpdateCriterion = (rubricId: string, index: number, value: string) => {
    setEditedRubrics((prev) =>
      prev.map((r) =>
        r.id === rubricId
          ? {
            ...r,
            criteria: r.criteria.map((c, i) => (i === index ? value : c)),
          }
          : r
      )
    )
  }

  const handleUpdateWeightageLabel = (rubricId: string, index: number, label: string) => {
    setEditedRubrics((prev) =>
      prev.map((r) =>
        r.id === rubricId
          ? {
            ...r,
            weightages: r.weightages.map((w, i) => (i === index ? { ...w, label } : w)),
          }
          : r
      )
    )
  }

  const handleUpdateWeightageValue = (rubricId: string, index: number, weight: number) => {
    setEditedRubrics((prev) =>
      prev.map((r) =>
        r.id === rubricId
          ? {
            ...r,
            weightages: r.weightages.map((w, i) => (i === index ? { ...w, weight } : w)),
          }
          : r
      )
    )
  }

  const selectedJDData = jds.find((jd) => jd.id.toString() === selectedJD)
  const selectedRubricData = editedRubrics.find((r) => r.id === confirmedRubric)
  const hasResults = rankedCandidates.length > 0

  // Calculate progress percentage
  const totalSteps = 4
  let completedSteps = 0
  if (selectedJD) completedSteps++
  if (confirmedRubric) completedSteps++
  if (selectedCandidates.length > 0) completedSteps++
  if (hasResults) completedSteps++
  const progressPercentage = (completedSteps / totalSteps) * 100

  return (
    <div className="flex flex-col gap-6">
      {/* Header with Tour Button */}
      <div className="flex items-start justify-between pb-2">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Candidate Matching
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5">
            Match candidates with job descriptions using AI-powered ranking
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartTour}
                id="tour-trigger"
                className="ml-4"
              >
                <IconHelp className="h-4 w-4 mr-2" />
                How it Works
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Take a guided tour of the shortlisting process</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Progress Indicator */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-muted-foreground">
                Step {completedSteps} of {totalSteps}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className={`flex flex-col items-center gap-1 ${selectedJD ? 'text-primary' : 'text-muted-foreground'}`}>
                <Badge variant={selectedJD ? "default" : "outline"} className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                  {selectedJD ? <IconCheck className="h-3 w-3" /> : "1"}
                </Badge>
                <span className="text-center">Select JD</span>
              </div>
              <div className={`flex flex-col items-center gap-1 ${confirmedRubric ? 'text-primary' : 'text-muted-foreground'}`}>
                <Badge variant={confirmedRubric ? "default" : "outline"} className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                  {confirmedRubric ? <IconCheck className="h-3 w-3" /> : "2"}
                </Badge>
                <span className="text-center">Choose Rubric</span>
              </div>
              <div className={`flex flex-col items-center gap-1 ${selectedCandidates.length > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                <Badge variant={selectedCandidates.length > 0 ? "default" : "outline"} className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                  {selectedCandidates.length > 0 ? <IconCheck className="h-3 w-3" /> : "3"}
                </Badge>
                <span className="text-center">Select Candidates</span>
              </div>
              <div className={`flex flex-col items-center gap-1 ${hasResults ? 'text-primary' : 'text-muted-foreground'}`}>
                <Badge variant={hasResults ? "default" : "outline"} className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                  {hasResults ? <IconCheck className="h-3 w-3" /> : "4"}
                </Badge>
                <span className="text-center">View Results</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[65%_35%]">
        <div className="flex flex-col gap-6">
          {/* Step 1: Select Job Description */}
          <Collapsible open={!step1Collapsed} onOpenChange={(open) => setStep1Collapsed(!open)}>
            <Card id="step-1-card" className={currentStep < 1 ? "opacity-50 pointer-events-none" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={currentStep === 1 ? "default" : selectedJD ? "secondary" : "outline"}>
                      Step 1
                    </Badge>
                    <CardTitle className="text-base">Select Job Description</CardTitle>
                    {selectedJD && <IconCheck className="h-4 w-4 text-green-500" />}
                  </div>
                  {selectedJD && (
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        {step1Collapsed ? (
                          <IconChevronDown className="h-4 w-4" />
                        ) : (
                          <IconChevronUp className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  )}
                </div>
                {step1Collapsed && selectedJDData && (
                  <CardDescription className="pt-2">
                    Selected: {selectedJDData.title}
                  </CardDescription>
                )}
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid lg:grid-cols-2 gap-4 items-start">
                      <Select value={selectedJD} onValueChange={setSelectedJD} disabled={isLoadingJDs}>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingJDs ? "Loading..." : "Select a job description"} />
                        </SelectTrigger>
                        <SelectContent>
                          {jds.map((jd) => (
                            <SelectItem key={jd.id} value={jd.id.toString()}>
                              {jd.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {selectedJDData && (
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-muted-foreground">Job Description</div>
                          <div className="border rounded-lg p-4 bg-muted/30 max-h-[100px] overflow-y-auto">
                            <pre className="text-xs whitespace-pre-wrap font-sans text-foreground/90 leading-relaxed">
                              {selectedJDData.parsedContent || "No content available"}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>

                    {jds.length === 0 && !isLoadingJDs && (
                      <p className="text-sm text-muted-foreground">
                        No job descriptions available. Please add JDs in the JD Library first.
                      </p>
                    )}

                    {selectedJD && !showRubrics && (
                      <Button
                        id="generate-rubric-btn"
                        className="w-full"
                        onClick={handleGenerateRubric}
                        disabled={isGeneratingRubrics}
                      >
                        <IconSparkles className="mr-2 h-4 w-4" />
                        {isGeneratingRubrics ? "Generating Rubrics..." : "Generate Evaluation Rubric"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Step 2: Select Evaluation Rubric - Always shown but disabled until Step 1 complete */}
          <Collapsible open={!step2Collapsed} onOpenChange={(open) => setStep2Collapsed(!open)}>
            <Card id="step-2-card" className={!showRubrics ? "opacity-50 pointer-events-none" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={currentStep === 2 ? "default" : confirmedRubric ? "secondary" : "outline"}>
                      Step 2
                    </Badge>
                    <CardTitle className="text-base">Select Evaluation Rubric</CardTitle>
                    {confirmedRubric && <IconCheck className="h-4 w-4 text-green-500" />}
                    {!showRubrics && (
                      <span className="text-xs text-muted-foreground ml-2">(Complete Step 1 first)</span>
                    )}
                  </div>
                  {confirmedRubric && (
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        {step2Collapsed ? (
                          <IconChevronDown className="h-4 w-4" />
                        ) : (
                          <IconChevronUp className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  )}
                </div>
                {step2Collapsed && selectedRubricData && (
                  <CardDescription className="pt-2">
                    Selected: {selectedRubricData.title}
                  </CardDescription>
                )}
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <CardDescription>
                    Choose an evaluation rubric and customize if needed
                  </CardDescription>
                  <RadioGroup value={selectedRubricId} onValueChange={setSelectedRubricId}>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {editedRubrics.map((rubric) => {
                        const isEditing = editingRubricId === rubric.id
                        return (
                          <Card
                            key={rubric.id}
                            className={`transition-all ${selectedRubricId === rubric.id
                                ? "border-primary ring-2 ring-primary/20"
                                : isEditing
                                  ? "border-primary ring-2 ring-primary/20"
                                  : "hover:border-muted-foreground/40"
                              }`}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start gap-3">
                                <RadioGroupItem
                                  value={rubric.id}
                                  id={rubric.id}
                                  className="mt-1"
                                  disabled={isEditing}
                                />
                                <div className="flex-1 space-y-1.5">
                                  {isEditing ? (
                                    <Input
                                      value={rubric.title}
                                      onChange={(e) =>
                                        handleUpdateRubricTitle(rubric.id, e.target.value)
                                      }
                                      className="font-medium text-sm h-8"
                                    />
                                  ) : (
                                    <Label htmlFor={rubric.id} className="text-sm font-semibold cursor-pointer">
                                      {rubric.title}
                                    </Label>
                                  )}
                                  {isEditing ? (
                                    <Input
                                      value={rubric.description}
                                      onChange={(e) =>
                                        handleUpdateRubricDescription(rubric.id, e.target.value)
                                      }
                                      className="text-xs h-7"
                                    />
                                  ) : (
                                    <p className="text-xs text-muted-foreground">
                                      {rubric.description}
                                    </p>
                                  )}
                                </div>
                                {!isEditing && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEditRubric(rubric.id)
                                    }}
                                  >
                                    <IconEdit className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pb-4">
                              <div className="space-y-2">
                                <div className="text-xs font-medium text-foreground mb-3">
                                  Evaluation Metrics & Weightage
                                </div>
                                {rubric.weightages.map((item, idx) => (
                                  <div key={idx} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs gap-2">
                                      {isEditing ? (
                                        <Input
                                          value={item.label}
                                          onChange={(e) =>
                                            handleUpdateWeightageLabel(rubric.id, idx, e.target.value)
                                          }
                                          className="font-medium text-xs h-7 flex-1"
                                        />
                                      ) : (
                                        <span className="font-medium text-muted-foreground">
                                          {item.label}
                                        </span>
                                      )}
                                      {isEditing ? (
                                        <Input
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={item.weight}
                                          onChange={(e) =>
                                            handleUpdateWeightageValue(rubric.id, idx, parseInt(e.target.value) || 0)
                                          }
                                          className="font-semibold text-primary tabular-nums text-xs h-7 w-16"
                                        />
                                      ) : (
                                        <span className="font-semibold text-primary tabular-nums">
                                          {item.weight}%
                                        </span>
                                      )}
                                    </div>
                                    <div className="relative h-2 overflow-hidden rounded-full bg-secondary">
                                      <div
                                        className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all"
                                        style={{ width: `${item.weight}%` }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="pt-2 border-t space-y-2.5">
                                <div className="text-xs font-medium text-foreground">
                                  Evaluation Criteria
                                </div>
                                <ul className="space-y-2 text-xs text-muted-foreground">
                                  {rubric.criteria.map((criterion, idx) =>
                                    isEditing ? (
                                      <li key={idx}>
                                        <Textarea
                                          value={criterion}
                                          onChange={(e) =>
                                            handleUpdateCriterion(rubric.id, idx, e.target.value)
                                          }
                                          className="text-xs min-h-[60px]"
                                        />
                                      </li>
                                    ) : (
                                      <li key={idx} className="flex items-start gap-2">
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                        <span className="leading-relaxed">{criterion}</span>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>

                              {isEditing && (
                                <div className="flex gap-2 pt-2 border-t">
                                  <Button
                                    size="sm"
                                    className="flex-1"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleSaveRubric()
                                    }}
                                  >
                                    <IconCheck className="mr-1.5 h-3.5 w-3.5" />
                                    Save Changes
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleCancelEdit()
                                    }}
                                  >
                                    <IconX className="mr-1.5 h-3.5 w-3.5" />
                                    Cancel
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </RadioGroup>
                  {selectedRubricId && !confirmedRubric && (
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleSelectRubric}
                    >
                      Select Rubric
                    </Button>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Step 3: Select Candidates - Always shown but disabled until Step 2 complete */}
          <Card id="step-3-card" className={!confirmedRubric ? "opacity-50 pointer-events-none" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-3">
                <Badge variant={currentStep === 3 ? "default" : selectedCandidates.length > 0 ? "secondary" : "outline"}>
                  Step 3
                </Badge>
                <div>
                  <CardTitle className="text-base">Select Candidates</CardTitle>
                  <CardDescription>
                    {selectedCandidates.length} of {candidates.length} candidates selected
                    {!confirmedRubric && " (Complete Step 2 first)"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingCandidates ? (
                  <p className="text-center text-muted-foreground py-8">Loading candidates...</p>
                ) : candidates.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No candidates available. Please add candidates in the Candidate Database first.
                  </p>
                ) : (
                  <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                    {Object.entries(groupedCandidates).map(([groupName, groupCandidates]) => (
                      <Collapsible
                        key={groupName}
                        open={expandedGroups.includes(groupName)}
                        onOpenChange={() => toggleGroup(groupName)}
                      >
                        <div className="border-b last:border-b-0">
                          <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={isGroupFullySelected(groupCandidates)}
                                className={isGroupPartiallySelected(groupCandidates) ? "data-[state=checked]:bg-primary/50" : ""}
                                onCheckedChange={() => {
                                  handleToggleGroupSelection(groupName, groupCandidates)
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <CollapsibleTrigger className="flex items-center gap-2 flex-1">
                                {expandedGroups.includes(groupName) ? (
                                  <IconChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <IconChevronUp className="h-4 w-4 text-muted-foreground rotate-180" />
                                )}
                                <span className="font-medium text-sm">{groupName}</span>
                                <Badge variant="secondary" className="ml-2">
                                  {groupCandidates.length}
                                </Badge>
                              </CollapsibleTrigger>
                            </div>
                          </div>
                          <CollapsibleContent>
                            <div className="space-y-2 p-3 pt-0">
                              {groupCandidates.map((candidate) => (
                                <div
                                  key={candidate.id}
                                  className="flex items-start gap-3 rounded-lg border p-3 bg-background"
                                >
                                  <Checkbox
                                    checked={selectedCandidates.includes(candidate.id.toString())}
                                    onCheckedChange={() => handleToggleCandidate(candidate.id.toString())}
                                    className="mt-1"
                                  />
                                  <div className="flex-1 space-y-1">
                                    <div className="font-medium text-sm">{candidate.name}</div>
                                    <div className="text-muted-foreground text-xs">
                                      {candidate.currentRole}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <span>{candidate.currentCompany}</span>
                                      {candidate.location && (
                                        <>
                                          <span>•</span>
                                          <span>{candidate.location}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedCandidates.length > 0 && (
            <Button
              id="evaluate-btn"
              size="lg"
              className="w-full"
              onClick={handleMatchCandidates}
              disabled={isMatching}
            >
              <IconSparkles className="mr-2 h-4 w-4" />
              {isMatching
                ? "Evaluating Candidates..."
                : `Evaluate ${selectedCandidates.length} Candidate${selectedCandidates.length > 1 ? 's' : ''}`}
            </Button>
          )}
        </div>

        {/* Step 4: View Results - Always shown but disabled until evaluation complete */}
        <Card id="results-card" className={!hasResults ? "opacity-50 pointer-events-none" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-3">
              <Badge variant={hasResults ? "default" : "outline"}>
                Step 4
              </Badge>
              <div>
                <CardTitle className="text-base">Ranked Candidates</CardTitle>
                <CardDescription>
                  {hasResults 
                    ? `${rankedCandidates.length} match${rankedCandidates.length > 1 ? 'es' : ''} found`
                    : "Results will appear here after evaluation"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="max-h-[600px] overflow-y-auto space-y-3 p-4">
            {!hasResults ? (
              <div className="text-center text-muted-foreground py-12">
                <IconSparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Select candidates and click &quot;Evaluate&quot; to see AI-powered rankings</p>
              </div>
            ) : (
              <>
                {rankedCandidates.map((candidate) => (
                <Collapsible key={candidate.id}>
                  <Card className="border-2 border-primary/20">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <Badge variant="secondary" className="shrink-0 h-7 w-7 flex items-center justify-center text-sm font-bold">
                          #{candidate.rank}
                        </Badge>
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-base text-primary leading-tight">
                                {candidate.name}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {candidate.currentRole} at {candidate.currentCompany}
                              </p>
                              {candidate.location && (
                                <p className="text-xs text-muted-foreground">
                                  {candidate.location}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary leading-none">
                                {candidate.overallScore?.toFixed(1) || "N/A"}
                              </div>
                              <div className="text-xs text-muted-foreground">out of 10</div>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground italic bg-muted/30 p-2 rounded">
                            {candidate.summary}
                          </p>

                          {candidate.scores && candidate.scores.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {candidate.scores.map((score: EvaluationScore, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs px-2 py-0.5 font-normal">
                                    {score.score_out_of_10?.toFixed(1)}
                                  </Badge>
                                ))}
                              </div>
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="w-full h-7 text-xs">
                                  <IconChevronDown className="mr-1 h-3 w-3" />
                                  View Detailed Scores
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="space-y-2 pt-1">
                                  {candidate.scores.map((score: EvaluationScore, idx: number) => (
                                    <div key={idx} className="space-y-1.5 p-2.5 bg-muted/20 rounded">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-medium">{score.label}</span>
                                          <Badge variant="outline" className="text-xs h-4 px-1.5">
                                            {score.weight}%
                                          </Badge>
                                        </div>
                                        <div className="text-right">
                                          <span className="text-sm font-bold text-primary">
                                            {score.score_out_of_10?.toFixed(1)}
                                          </span>
                                          <span className="text-xs text-muted-foreground">/10</span>
                                        </div>
                                      </div>
                                      <div className="relative h-1.5 overflow-hidden rounded-full bg-secondary">
                                        <div
                                          className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all"
                                          style={{ width: `${(score.score_out_of_10 / 10) * 100}%` }}
                                        />
                                      </div>
                                      <p className="text-xs text-muted-foreground italic">
                                        {score.justification}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Collapsible>
            ))}
            </>
          )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
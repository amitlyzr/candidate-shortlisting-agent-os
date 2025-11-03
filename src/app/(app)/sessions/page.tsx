"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconCalendar, IconUsers, IconFileText, IconChevronDown, IconLoader2 } from "@tabler/icons-react"
import { authFetch } from "@/lib/auth-fetch"

interface TopCandidate {
  name: string
  currentRole: string | null
  overallScore: number
}

interface Session {
  id: string
  jdId: string
  jdTitle: string
  rubricId: string
  rubricTitle: string
  createdAt: Date
  candidateCount: number
  topCandidates: TopCandidate[]
}

interface EvaluationScore {
  label?: string
  metric?: string
  weight?: number
  score_out_of_10?: number
  score?: number
  justification?: string
}

interface SessionCandidate {
  candidateId: string
  name: string
  email: string
  phone: string
  currentRole: string
  currentCompany: string
  location: string
  experience: string
  overallScore: number
  summary: string
  scores: EvaluationScore[]
}

interface SessionDetails {
  jdId: string
  jdTitle: string
  jdDepartment: string
  jdLocation: string
  jdContent: string
  rubricId: string
  rubricTitle: string
  rubricMetrics: Array<{ label: string | undefined; value: number }>
  allCandidates: SessionCandidate[]
}

export default function SessionsPage() {
  const [sessions, setSessions] = React.useState<Session[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedSession, setSelectedSession] = React.useState<SessionDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = React.useState(false)

  React.useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await authFetch("/api/sessions")
        if (response.ok) {
          const data = await response.json()
          console.log("Sessions data:", data)
          setSessions(data)
        }
      } catch (error) {
        console.error("Error fetching sessions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [])

  const fetchSessionDetails = async (sessionId: string) => {
    setLoadingDetails(true)
    try {
      const response = await authFetch(`/api/sessions/${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedSession(data)
      }
    } catch (error) {
      console.error("Error fetching session details:", error)
    } finally {
      setLoadingDetails(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="pb-2">
          <h1 className="text-2xl font-bold tracking-tight">Previous Sessions</h1>
          <p className="text-muted-foreground">View your past candidate evaluation sessions</p>
        </div>
        <p className="text-center text-muted-foreground py-8">Loading sessions...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="pb-2">
        <h1 className="text-2xl font-bold tracking-tight">Previous Sessions</h1>
        <p className="text-muted-foreground">View your past candidate evaluation sessions</p>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <IconCalendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No sessions yet</h3>
              <p className="text-sm text-muted-foreground">
                Complete your first candidate evaluation to see sessions here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{session.jdTitle}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <IconCalendar className="h-3 w-3" />
                      {new Date(session.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    <IconUsers className="h-3 w-3 mr-1" />
                    {session.candidateCount} candidates
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <IconFileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Rubric:</span>
                    <span className="font-medium">{session.rubricTitle}</span>
                  </div>
                  
                  {session.topCandidates && session.topCandidates.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Top Candidates:</p>
                      <div className="space-y-2">
                        {session.topCandidates.slice(0, 3).map((candidate: TopCandidate, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="h-5 w-5 flex items-center justify-center p-0 text-xs">
                                {idx + 1}
                              </Badge>
                              <span className="font-medium">{candidate.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {candidate.currentRole}
                              </span>
                            </div>
                            <Badge variant="secondary" className="font-semibold">
                              {candidate.overallScore.toFixed(1)}/10
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => fetchSessionDetails(session.id)}
                      >
                        View Full Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="!max-w-[60vw] w-[60vw] h-[70vh] flex flex-col p-8">
                      <DialogHeader className="flex-shrink-0">
                        <DialogTitle>{selectedSession?.jdTitle || session.jdTitle}</DialogTitle>
                        <DialogDescription>
                          Complete session details including JD, rubric, and all candidate evaluations
                        </DialogDescription>
                      </DialogHeader>
                      {loadingDetails ? (
                        <div className="flex flex-col items-center justify-center py-12">
                          <IconLoader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                          <p className="text-sm text-muted-foreground">Loading detailed view...</p>
                        </div>
                      ) : selectedSession && (
                        <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                          {/* Step 1: Job Description */}
                          <Collapsible defaultOpen>
                            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold w-full justify-start p-3 hover:bg-muted/50 rounded-lg transition-colors">
                              <IconChevronDown className="h-4 w-4" />
                              <Badge>Step 1</Badge>
                              Job Description
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-3">
                              <div className="rounded-lg border p-4 bg-muted/30">
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="font-medium">Department:</span>{" "}
                                    {selectedSession.jdDepartment}
                                  </div>
                                  <div>
                                    <span className="font-medium">Location:</span>{" "}
                                    {selectedSession.jdLocation}
                                  </div>
                                  <div className="pt-2">
                                    <span className="font-medium">Content:</span>
                                    <p className="mt-1 text-muted-foreground whitespace-pre-wrap max-h-40 overflow-y-auto">
                                      {selectedSession.jdContent}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>

                          {/* Step 2: Evaluation Rubric */}
                          <Collapsible defaultOpen>
                            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold w-full justify-start p-3 hover:bg-muted/50 rounded-lg transition-colors">
                              <IconChevronDown className="h-4 w-4" />
                              <Badge>Step 2</Badge>
                              Evaluation Rubric
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-3">
                              <div className="rounded-lg border p-4 bg-muted/30">
                                <h4 className="font-medium mb-3">{selectedSession.rubricTitle}</h4>
                                <div className="grid gap-3">
                                  {selectedSession.rubricMetrics?.map((metric: { label: string | undefined; value: number }, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between text-sm">
                                      <span>{metric.label}</span>
                                      <Badge variant="outline">{metric.value}%</Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>

                          {/* Step 3: Candidate Evaluations */}
                          <Collapsible defaultOpen>
                            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold w-full justify-start p-3 hover:bg-muted/50 rounded-lg transition-colors">
                              <IconChevronDown className="h-4 w-4" />
                              <Badge>Step 3</Badge>
                              Candidate Evaluations ({selectedSession.allCandidates?.length || 0} candidates)
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-3">
                              <div className="space-y-2">
                                {selectedSession.allCandidates?.map((candidate: SessionCandidate, idx: number) => (
                                  <Card key={idx} className="overflow-hidden">
                                    <CardHeader className="p-2.5 pb-1.5">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                          <Badge variant="outline" className="h-5 w-5 flex items-center justify-center p-0 text-xs flex-shrink-0">
                                            {idx + 1}
                                          </Badge>
                                          <div className="min-w-0">
                                            <p className="text-sm font-semibold truncate">{candidate.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                              {candidate.currentRole}
                                            </p>
                                          </div>
                                        </div>
                                        <Badge className="font-semibold flex-shrink-0">
                                          {candidate.overallScore.toFixed(1)}/10
                                        </Badge>
                                      </div>
                                    </CardHeader>
                                    <CardContent className="p-2.5 pt-0">
                                      <Tabs defaultValue="summary" className="w-full">
                                        <TabsList className="grid w-full grid-cols-2 h-8">
                                          <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
                                          <TabsTrigger value="scores" className="text-xs">Score Breakdown</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="summary" className="mt-2 space-y-0">
                                          {candidate.summary && (
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                              {candidate.summary}
                                            </p>
                                          )}
                                        </TabsContent>
                                        <TabsContent value="scores" className="mt-2 space-y-1.5">
                                          {candidate.scores?.map((score: EvaluationScore, scoreIdx: number) => (
                                            <div key={scoreIdx} className="space-y-1 p-1.5 bg-muted/20 rounded">
                                              <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium">{score.label || score.metric}</span>
                                                <Badge variant="secondary" className="text-xs h-5 px-1.5">
                                                  {(score.score_out_of_10 || score.score || 0).toFixed(1)}/10
                                                </Badge>
                                              </div>
                                              <Progress value={(score.score_out_of_10 || score.score || 0) * 10} className="h-1" />
                                              <p className="text-xs text-muted-foreground leading-snug">
                                                {score.justification}
                                              </p>
                                            </div>
                                          ))}
                                        </TabsContent>
                                      </Tabs>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

import { db } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, authErrorResponse } from "@/lib/auth";

interface EvaluationScore {
  label?: string;
  metric?: string;
  weight?: number;
  score_out_of_10?: number;
  score?: number;
  justification?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return authErrorResponse();
    }

    const { sessionId } = await params;

    // Get evaluations for this specific session (user-scoped)
    // Try sessionId first, fall back to jdId-rubricId pattern for old data
    let sessionEvaluations = await db.candidateEvaluation.findMany({
      where: { 
        sessionId,
        userId: user.id
      },
      include: {
        candidate: true,
        jobDescription: true
      }
    });

    // If no results with sessionId, try the old jdId-rubricId pattern
    if (sessionEvaluations.length === 0) {
      const [jdId, rubricId] = sessionId.split("-");
      sessionEvaluations = await db.candidateEvaluation.findMany({
        where: {
          jdId,
          rubricId,
          userId: user.id
        },
        include: {
          candidate: true,
          jobDescription: true
        }
      });
    }

    if (sessionEvaluations.length === 0) {
      return NextResponse.json(
        { error: "No evaluations found for this session" },
        { status: 404 }
      );
    }

    // Get JD details from first evaluation
    const firstEvaluation = sessionEvaluations[0];
    const jd = firstEvaluation.jobDescription;

    if (!jd) {
      return NextResponse.json(
        { error: "Job description not found" },
        { status: 404 }
      );
    }

    const allCandidates = sessionEvaluations
      .filter((evaluation) => evaluation.candidate !== null)
      .map((evaluation) => {
        const candidate = evaluation.candidate!;
        
        return {
          candidateId: candidate.id,
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone,
          currentRole: candidate.currentRole,
          currentCompany: candidate.currentCompany,
          location: candidate.location,
          experience: candidate.experience,
          overallScore: evaluation.overallScore,
          summary: evaluation.summary,
          scores: evaluation.scores || [],
        };
      });

    // Sort by overall score
    allCandidates.sort((a, b) => b.overallScore - a.overallScore);
    
    // Use stored rubric weightages if available, otherwise derive from scores
    let rubricMetrics: Array<{ label: string; value: number }> = [];
    if (firstEvaluation.rubricWeightages && Array.isArray(firstEvaluation.rubricWeightages)) {
      rubricMetrics = (firstEvaluation.rubricWeightages as Array<{ label: string; weight: number }>).map((w) => ({
        label: w.label,
        value: w.weight,
      }));
    } else {
      // Fallback: derive from scores (for old data)
      const scores = Array.isArray(firstEvaluation.scores) ? firstEvaluation.scores as EvaluationScore[] : [];
      rubricMetrics = scores.map((s: EvaluationScore) => ({
        label: s.label || s.metric || 'Unknown Metric',
        value: s.weight || Math.round(((s.score_out_of_10 || s.score || 0) / 10) * 100),
      }));
    }

    return NextResponse.json({
      jdId: jd.id,
      jdTitle: jd.title,
      jdDepartment: jd.department,
      jdLocation: jd.location,
      jdContent: jd.parsedContent,
      rubricId: firstEvaluation.rubricId,
      rubricTitle: firstEvaluation.rubricTitle,
      rubricMetrics,
      allCandidates,
    });
  } catch (error) {
    console.error("Error fetching session details:", error);
    return NextResponse.json(
      { error: "Failed to fetch session details" },
      { status: 500 }
    );
  }
}

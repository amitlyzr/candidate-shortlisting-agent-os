import { db } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, authErrorResponse } from "@/lib/auth";

interface TopCandidate {
  name: string;
  currentRole: string | null;
  overallScore: number;
}

interface SessionData {
  id: string;
  jdId: string;
  jdTitle: string;
  rubricId: string;
  rubricTitle: string;
  createdAt: Date;
  candidateCount: number;
  topCandidates: TopCandidate[];
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return authErrorResponse();
    }

    // Get all evaluations grouped by session (user-scoped)
    const evaluations = await db.candidateEvaluation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        jobDescription: true,
        candidate: true
      }
    });

    // Group evaluations by sessionId (or fallback to jdId-rubricId for old data)
    const sessionMap = new Map<string, SessionData>();

    for (const evaluation of evaluations) {
      // Use sessionId if available, otherwise fall back to jdId-rubricId for old data
      const sessionKey = evaluation.sessionId || `${evaluation.jdId}-${evaluation.rubricId}`;
      
      if (!sessionMap.has(sessionKey)) {
        sessionMap.set(sessionKey, {
          id: sessionKey,
          jdId: evaluation.jdId,
          jdTitle: evaluation.jobDescription?.title || "Unknown JD",
          rubricId: evaluation.rubricId,
          rubricTitle: evaluation.rubricTitle,
          createdAt: evaluation.createdAt,
          candidateCount: 0,
          topCandidates: [],
        });
      }

      const session = sessionMap.get(sessionKey);
      if (!session) continue;
      
      session.candidateCount += 1;

      if (evaluation.candidate) {
        session.topCandidates.push({
          name: evaluation.candidate.name,
          currentRole: evaluation.candidate.currentRole,
          overallScore: evaluation.overallScore,
        });
      }
    }

    // Sort candidates within each session by score and limit to top 5
    const sessions = Array.from(sessionMap.values()).map((session) => ({
      ...session,
      topCandidates: session.topCandidates
        .sort((a: TopCandidate, b: TopCandidate) => b.overallScore - a.overallScore)
        .slice(0, 5),
    }));

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

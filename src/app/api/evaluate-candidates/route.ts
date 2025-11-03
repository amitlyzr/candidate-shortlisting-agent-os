import { db } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, authErrorResponse } from "@/lib/auth";

interface EvaluationScore {
  label: string;
  weight: number;
  score_out_of_10: number;
  justification: string;
}

interface EvaluationResult {
  candidate_name: string;
  rubric_id: string;
  rubric_title: string;
  scores: EvaluationScore[];
  overall_score_out_of_10: number;
  summary: string;
}

interface RubricWeightage {
  label: string;
  weight: number;
}

interface Rubric {
  id: string;
  title: string;
  description: string;
  weightages: RubricWeightage[];
  criteria: string[];
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return authErrorResponse();
    }

    const body = await request.json();
    const { jdId, rubric, candidateIds } = body as {
      jdId: string;
      rubric: Rubric;
      candidateIds: string[];
    };

    if (!jdId || !rubric || !candidateIds || candidateIds.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Use user's token as API key for Lyzr API calls
    const apiKey = user.token;
    
    console.log(`Using Lyzr API key from user token`);
    
    if (!apiKey) {
      console.error("No Lyzr API key available - user token is not set");
      return NextResponse.json(
        { error: "User authentication token not configured" },
        { status: 401 }
      );
    }

    // Fetch JD and candidates from database (user-scoped)
    const jd = await db.jobDescription.findFirst({
      where: { id: jdId, userId: user.id }
    });
    
    const selectedCandidates = await db.candidate.findMany({
      where: {
        id: { in: candidateIds },
        userId: user.id
      }
    });

    if (!jd) {
      return NextResponse.json(
        { error: "Job description not found" },
        { status: 404 }
      );
    }

    if (selectedCandidates.length === 0) {
      return NextResponse.json(
        { error: "No candidates found" },
        { status: 404 }
      );
    }

    console.log(`Starting evaluation for ${selectedCandidates.length} candidates`);

    // Generate unique session ID for this evaluation batch
    const sessionId = `${jdId}-${rubric.id}-${Date.now()}`;

    const evaluationResults: (EvaluationResult & { candidateId: string })[] = [];
    const failedEvaluations: { candidateId: string; candidateName: string; error: string }[] = [];

    // Process candidates with controlled concurrency (3 at a time)
    const CONCURRENCY_LIMIT = 3;
    const evaluateCandidate = async (candidate: typeof selectedCandidates[0]) => {
      try {
        console.log(`Evaluating candidate: ${candidate.name}`);

        // Create the evaluation prompt
        const evaluationPrompt = `Evaluate this candidate against the job description and rubric.

**Job Description:**
${jd.parsedContent}

**Evaluation Rubric:**
Title: ${rubric.title}
Description: ${rubric.description}

Metrics & Weightages:
${rubric.weightages.map((w) => `- ${w.label}: ${w.weight}%`).join('\n')}

Evaluation Criteria:
${rubric.criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

**Candidate Resume:**
${candidate.parsedContent}

Please evaluate this candidate and provide a structured JSON response with:
1. Score out of 10 for each metric (with justification)
2. Overall score out of 10 (weighted average)
3. Summary of the evaluation

Return ONLY valid JSON in this exact format:
{
  "candidate_name": "${candidate.name}",
  "rubric_id": "${rubric.id}",
  "rubric_title": "${rubric.title}",
  "scores": [
    {
      "label": "metric name",
      "weight": weight_percentage,
      "score_out_of_10": score,
      "justification": "explanation"
    }
  ],
  "overall_score_out_of_10": calculated_score,
  "summary": "brief evaluation summary"
}`;

        // Call Lyzr evaluation agent
        const chatSessionId = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        const chatResponse = await fetch(
          "https://agent-prod.studio.lyzr.ai/v3/inference/chat/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
            },
            body: JSON.stringify({
              user_id: user.email,
              agent_id: process.env.LYZR_EVALUATE_CANDIDATES_AGENT_ID || "",
              session_id: chatSessionId,
              message: evaluationPrompt,
            }),
          }
        );

        if (!chatResponse.ok) {
          const errorText = await chatResponse.text();
          console.error(`Lyzr evaluation error for ${candidate.name}:`, chatResponse.status, errorText);
          failedEvaluations.push({
            candidateId: candidate.id,
            candidateName: candidate.name,
            error: `API request failed: ${chatResponse.status}`,
          });
          return;
        }

        const lyzrData = await chatResponse.json();
        console.log(`Lyzr evaluation response for ${candidate.name}:`, JSON.stringify(lyzrData, null, 2));

        // Extract and parse the evaluation result
        let evaluationData: EvaluationResult;
        try {
          const responseText = lyzrData.response || "";

          // Remove markdown code block markers if present
          const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
          const rawText = (jsonMatch ? jsonMatch[1] : responseText).trim();

          // Try to parse as JSON
          evaluationData = JSON.parse(rawText);

          // Validate the structure
          if (!evaluationData.scores || !Array.isArray(evaluationData.scores)) {
            throw new Error("Invalid evaluation structure: missing scores array");
          }

          if (typeof evaluationData.overall_score_out_of_10 !== "number") {
            throw new Error("Invalid evaluation structure: missing overall_score_out_of_10");
          }

          console.log(`Successfully parsed evaluation for ${candidate.name}:`, {
            overall_score: evaluationData.overall_score_out_of_10,
            scores_count: evaluationData.scores.length,
          });
        } catch (parseError) {
          console.error(`Failed to parse evaluation response for ${candidate.name}:`, parseError);
          console.error(`Response snippet:`, lyzrData.response?.substring(0, 500));
          failedEvaluations.push({
            candidateId: candidate.id,
            candidateName: candidate.name,
            error: "Failed to parse AI evaluation response",
          });
          return;
        }

        // Store evaluation in database
        await db.candidateEvaluation.create({
          data: {
            userId: user.id,
            sessionId: sessionId,
            candidateId: candidate.id,
            jdId: jd.id,
            rubricId: rubric.id,
            rubricTitle: rubric.title,
            rubricWeightages: JSON.parse(JSON.stringify(rubric.weightages)),
            overallScore: evaluationData.overall_score_out_of_10,
            scores: JSON.parse(JSON.stringify(evaluationData.scores)),
            summary: evaluationData.summary,
          }
        });

        evaluationResults.push({
          ...evaluationData,
          candidateId: candidate.id,
        });

        console.log(`Successfully evaluated ${candidate.name}`);
      } catch (error) {
        console.error(`Error evaluating candidate ${candidate.name}:`, error);
        failedEvaluations.push({
          candidateId: candidate.id,
          candidateName: candidate.name,
          error: String(error),
        });
      }
    };

    // Process candidates in batches with controlled concurrency
    for (let i = 0; i < selectedCandidates.length; i += CONCURRENCY_LIMIT) {
      const batch = selectedCandidates.slice(i, i + CONCURRENCY_LIMIT);
      await Promise.all(batch.map(evaluateCandidate));
    }

    // Rank candidates by overall score (highest to lowest)
    const rankedResults = evaluationResults
      .sort((a, b) => b.overall_score_out_of_10 - a.overall_score_out_of_10)
      .map((result, index) => ({
        ...result,
        rank: index + 1,
      }));

    console.log(`Evaluation complete. Successful: ${rankedResults.length}, Failed: ${failedEvaluations.length}`);

    return NextResponse.json({
      success: true,
      evaluated: rankedResults.length,
      failed: failedEvaluations.length,
      results: rankedResults,
      errors: failedEvaluations.length > 0 ? failedEvaluations : undefined,
    });
  } catch (error) {
    console.error("Error in evaluation endpoint:", error);
    return NextResponse.json(
      { error: "Failed to evaluate candidates" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getAuthUser, authErrorResponse } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return authErrorResponse();
    }

    const { jobDescriptionContent, jobDescriptionId } = await request.json()

    if (!jobDescriptionContent) {
      return NextResponse.json(
        { error: "Job description content is required" },
        { status: 400 }
      )
    }

    // Use user's token as API key for Lyzr API calls
    const lyzrApiKey = user.token;
    
    console.log(`Using Lyzr API key from user token`);

    if (!lyzrApiKey) {
      console.error("No Lyzr API key available - user token is not set");
      return NextResponse.json(
        { error: "User authentication token not configured" },
        { status: 401 }
      )
    }

    // Call Lyzr AI agent
    const lyzrResponse = await fetch(
      "https://agent-prod.studio.lyzr.ai/v3/inference/chat/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": lyzrApiKey,
        },
        body: JSON.stringify({
          user_id: user.email,
          agent_id: process.env.LYZR_RUBRICS_AGENT_ID || "",
          session_id: `${jobDescriptionId}-${Date.now()}`,
          message: jobDescriptionContent,
        }),
      }
    )

    if (!lyzrResponse.ok) {
      const errorText = await lyzrResponse.text()
      console.error("Lyzr API error:", errorText)
      return NextResponse.json(
        { error: "Failed to generate rubrics from Lyzr API" },
        { status: lyzrResponse.status }
      )
    }

    const lyzrData = await lyzrResponse.json()

    // Parse the response - assuming Lyzr returns the rubrics in the expected format
    // If Lyzr returns a different format, we'll need to transform it
    let rubrics

    // Check if response has rubrics directly
    if (lyzrData.rubrics && Array.isArray(lyzrData.rubrics)) {
      rubrics = lyzrData.rubrics
    } 
    // Check if response has a response field containing rubrics
    else if (lyzrData.response?.rubrics && Array.isArray(lyzrData.response.rubrics)) {
      rubrics = lyzrData.response.rubrics
    }
    // Check if response has a message field with JSON
    else if (lyzrData.message || lyzrData.response) {
      const messageContent = lyzrData.message || lyzrData.response
      try {
        // Try to parse as JSON if it's a string
        if (typeof messageContent === 'string') {
          const parsed = JSON.parse(messageContent)
          rubrics = parsed.rubrics || parsed
        } else if (messageContent.rubrics) {
          rubrics = messageContent.rubrics
        }
      } catch (e) {
        console.error("Failed to parse Lyzr response message:", e)
      }
    }

    // Validate rubrics format
    if (!rubrics || !Array.isArray(rubrics) || rubrics.length !== 3) {
      console.error("Invalid rubrics format from Lyzr:", lyzrData)
      return NextResponse.json(
        { 
          error: "Invalid rubrics format received from AI agent",
          rawResponse: lyzrData 
        },
        { status: 500 }
      )
    }

    // Validate each rubric has required fields
    for (const rubric of rubrics) {
      if (!rubric.id || !rubric.title || !rubric.description || 
          !Array.isArray(rubric.weightages) || !Array.isArray(rubric.criteria)) {
        return NextResponse.json(
          { error: "Rubrics missing required fields" },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ rubrics })
  } catch (error) {
    console.error("Error generating rubrics:", error)
    return NextResponse.json(
      { error: "Failed to generate rubrics" },
      { status: 500 }
    )
  }
}

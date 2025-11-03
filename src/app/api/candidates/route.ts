import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, authErrorResponse } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return authErrorResponse();
    }

    const allCandidates = await prisma.candidate.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(allCandidates);
  } catch (error) {
    console.error("Error fetching candidates:", error);
    return NextResponse.json(
      { error: "Failed to fetch candidates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {  
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return authErrorResponse();
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const groupName = formData.get("groupName") as string || "Not Specified";

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
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

    const uploadedCandidates = [];
    const failedFiles = [];

    // Process each file ONE BY ONE
    for (const file of files) {
      try {
        console.log(`Processing file: ${file.name} (${file.size} bytes, type: ${file.type})`);

        const fileName = file.name;
        const fileType = file.name.split(".").pop()?.toLowerCase() || "unknown";

        // Step 1: Upload ACTUAL FILE to Lyzr to get asset_id
        console.log(`Uploading ${fileName} to Lyzr assets...`);
        const uploadFormData = new FormData();
        uploadFormData.append("files", file);

        const uploadResponse = await fetch(
          "https://agent-prod.studio.lyzr.ai/v3/assets/upload",
          {
            method: "POST",
            headers: {
              "x-api-key": apiKey,
            },
            body: uploadFormData,
          }
        );

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error(`Lyzr upload error for ${fileName}:`, uploadResponse.status, errorText);
          failedFiles.push({ fileName, error: `Upload failed: ${uploadResponse.status}` });
          continue;
        }

        const uploadData = await uploadResponse.json();
        console.log(`Full Lyzr upload response for ${fileName}:`, JSON.stringify(uploadData, null, 2));

        // Extract asset_id from results array
        const assetId = uploadData.results?.[0]?.asset_id;

        if (!assetId) {
          console.error(`No asset_id returned for ${fileName}. Response:`, uploadData);
          failedFiles.push({ fileName, error: "No asset ID received" });
          continue;
        }

        console.log(`Got asset_id for ${fileName}: ${assetId}`);

        // Step 2: Send chat request with asset_id to extract information
        console.log(`Sending ${fileName} to Lyzr agent for parsing...`);
        const sessionId = `68f81c9ca39d463331dfaf7a-${Date.now()}-${Math.random().toString(36).substring(7)}`;

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
              agent_id: process.env.LYZR_CANDIDATES_AGENT_ID || "",
              session_id: sessionId,
              message: "Extract candidate information from this resume.",
              assets: [assetId], // Send the actual file via asset_id
            }),
          }
        );

        if (!chatResponse.ok) {
          const errorText = await chatResponse.text();
          console.error(`Lyzr chat error for ${fileName}:`, chatResponse.status, errorText);
          failedFiles.push({ fileName, error: `AI parsing failed: ${chatResponse.status}` });
          continue;
        }

        const lyzrData = await chatResponse.json();
        console.log(`Lyzr response for ${fileName}:`, JSON.stringify(lyzrData, null, 2));

        // Step 3: Extract and fix malformed JSON from Lyzr response
        let parsedData;
        try {
          const responseText = lyzrData.response || "";

          // Remove markdown code block markers
          const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
          const rawText = (jsonMatch ? jsonMatch[1] : responseText).trim();

          // Extract individual fields manually since the resume_content has literal newlines
          const extractField = (text: string, field: string): string | null => {
            const regex = new RegExp(`"${field}"\\s*:\\s*"([^"]*?)"`, 's');
            const match = text.match(regex);
            return match ? match[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : null;
          };

          // Extract the resume_content separately (it spans until the last "})
          const resumeMatch = rawText.match(/"resume_content"\s*:\s*"([\s\S]*?)"\s*}[\s\S]*$/);
          const resumeRaw = resumeMatch ? resumeMatch[1] : "";

          // Build clean JSON object with properly escaped resume_content
          parsedData = {
            name: extractField(rawText, 'name'),
            email: extractField(rawText, 'email'),
            phone: extractField(rawText, 'phone'),
            current_role: extractField(rawText, 'current_role'),
            current_company: extractField(rawText, 'current_company'),
            location: extractField(rawText, 'location'),
            experience: extractField(rawText, 'experience'),
            resume_content: resumeRaw.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          };

          console.log(`Extracted data for ${fileName}:`, {
            name: parsedData.name,
            email: parsedData.email,
            resumeLength: parsedData.resume_content?.length
          });
        } catch (parseError) {
          console.error(`Failed to parse Lyzr response for ${fileName}:`, parseError);
          console.error(`Response snippet:`, lyzrData.response?.substring(0, 500));
          failedFiles.push({ fileName, error: "Failed to parse AI response" });
          continue;
        }

        // Step 4: Extract structured data from parsed JSON
        const name = parsedData.name || fileName.replace(/\.[^/.]+$/, "");
        const email = parsedData.email || null;
        const phone = parsedData.phone || null;
        const currentRole = parsedData.current_role || "Not specified";
        const currentCompany = parsedData.current_company || "Not specified";
        const location = parsedData.location || "Not specified";
        const experience = parsedData.experience || "Not specified";
        const resumeContent = parsedData.resume_content || "";

        // Step 5: Store in database
        const newCandidate = await prisma.candidate.create({
          data: {
            userId: user.id,
            name,
            email,
            phone,
            currentRole,
            currentCompany,
            location,
            experience,
            groupName, // Use the group name from form data
            fileName,
            fileType,
            rawContent: resumeContent, // AI-extracted content for viewing
            parsedContent: resumeContent, // AI-extracted content for matching
          }
        });

        uploadedCandidates.push(newCandidate);
        console.log(`Successfully processed ${fileName}`);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        failedFiles.push({ fileName: file.name, error: String(error) });
      }
    }

    return NextResponse.json(
      {
        uploaded: uploadedCandidates.length,
        failed: failedFiles.length,
        candidates: uploadedCandidates,
        errors: failedFiles.length > 0 ? failedFiles : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading candidates:", error);
    return NextResponse.json(
      { error: "Failed to upload candidates" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return authErrorResponse();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "No ID provided" }, { status: 400 });
    }

    const body = await request.json();
    const { name, email, phone, currentRole, currentCompany, location, experience, groupName } = body;

    // Verify candidate belongs to user before updating
    const existing = await prisma.candidate.findFirst({
      where: { id, userId: user.id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const updatedCandidate = await prisma.candidate.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        currentRole,
        currentCompany,
        location,
        experience,
        groupName,
      }
    });

    return NextResponse.json(updatedCandidate);
  } catch (error) {
    console.error("Error updating candidate:", error);
    return NextResponse.json(
      { error: "Failed to update candidate" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return authErrorResponse();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "No ID provided" }, { status: 400 });
    }

    // Verify candidate belongs to user before deleting
    const existing = await prisma.candidate.findFirst({
      where: { id, userId: user.id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    await prisma.candidate.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting candidate:", error);
    return NextResponse.json(
      { error: "Failed to delete candidate" },
      { status: 500 }
    );
  }
}

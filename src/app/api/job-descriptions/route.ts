import { NextRequest, NextResponse } from "next/server";
import { parseFile } from "@/lib/file-parser";
import { db } from "@/lib/prisma";
import { getAuthUser, authErrorResponse } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return authErrorResponse();
    }

    const jds = await db.jobDescription.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(jds);
  } catch (error) {
    console.error("Error fetching job descriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch job descriptions" },
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
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const department = formData.get("department") as string;
    const location = formData.get("location") as string;
    const type = formData.get("type") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const { text, fileName, fileType } = await parseFile(file);

    // For text files, get raw content; for binary files (PDF/DOCX), use parsed text
    let rawContent = text;
    if (fileType === "txt") {
      try {
        rawContent = await file.text();
      } catch {
        // If reading fails, use parsed text
        rawContent = text;
      }
    }

    const newJD = await db.jobDescription.create({
      data: {
        userId: user.id,
        title: title || fileName,
        department: department || "Not specified",
        location: location || "Not specified",
        type: type || "Full-time",
        fileName,
        fileType,
        rawContent: rawContent,
        parsedContent: text,
        status: "active",
      }
    });

    return NextResponse.json(newJD, { status: 201 });
  } catch (error) {
    console.error("Error uploading job description:", error);
    return NextResponse.json(
      { error: "Failed to upload job description" },
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
    const { title, department, location, type, content } = body;

    // Verify JD belongs to user before updating
    const existing = await db.jobDescription.findFirst({
      where: { id, userId: user.id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Job description not found" }, { status: 404 });
    }

    const updatedJD = await db.jobDescription.update({
      where: { id },
      data: {
        title,
        department,
        location,
        type,
        ...(content !== undefined && {
          rawContent: content,
          parsedContent: content,
        }),
      }
    });

    return NextResponse.json(updatedJD);
  } catch (error) {
    console.error("Error updating job description:", error);
    return NextResponse.json(
      { error: "Failed to update job description" },
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

    // Verify JD belongs to user before deleting
    const existing = await db.jobDescription.findFirst({
      where: { id, userId: user.id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Job description not found" }, { status: 404 });
    }

    await db.jobDescription.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting job description:", error);
    return NextResponse.json(
      { error: "Failed to delete job description" },
      { status: 500 }
    );
  }
}

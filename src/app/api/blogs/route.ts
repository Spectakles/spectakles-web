import { NextResponse } from "next/server";
import { getAllArticles, createArticle } from "@/lib/blog-store";
import { verifyAdminSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDrafts = searchParams.get("includeDrafts") === "true";

    const isAdmin = await verifyAdminSession();
    const articles = await getAllArticles({
      includeDrafts: includeDrafts && isAdmin,
    });

    return NextResponse.json({ success: true, articles });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch blogs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    if (!body.title) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    const article = await createArticle(body);
    return NextResponse.json({ success: true, article }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to create blog" },
      { status: 500 }
    );
  }
}

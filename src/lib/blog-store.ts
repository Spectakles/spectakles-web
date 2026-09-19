import fs from "fs/promises";
import path from "path";
import { articles as seedArticles, type Article } from "@/data/blog";
import { supabase } from "@/lib/supabase";

export interface StoredArticle extends Article {
  id: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  keywords?: string;
  status: "published" | "draft";
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "blogs.json");

function calculateReadTime(content: Article["content"]): string {
  let wordCount = 0;
  for (const block of content) {
    if (block.type === "paragraph" || block.type === "quote") {
      wordCount += block.text.trim().split(/\s+/).length;
    } else if (block.type === "heading") {
      wordCount += block.text.trim().split(/\s+/).length;
    } else if (block.type === "list") {
      wordCount += block.items.join(" ").trim().split(/\s+/).length;
    }
  }
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min read`;
}

async function ensureDataFile(): Promise<StoredArticle[]> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      const data = await fs.readFile(DATA_FILE, "utf-8");
      return JSON.parse(data);
    } catch {
      // Seed initial data
      const initial: StoredArticle[] = seedArticles.map((art, idx) => ({
        ...art,
        id: `seed-${idx + 1}`,
        metaTitle: art.title,
        metaDescription: art.excerpt,
        status: "published",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      await fs.writeFile(DATA_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
  } catch (err) {
    console.error("[BlogStore] Failed to access blogs.json:", err);
    return seedArticles.map((art, idx) => ({
      ...art,
      id: `seed-${idx + 1}`,
      status: "published",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }
}

async function writeDataFile(articles: StoredArticle[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(articles, null, 2), "utf-8");
}

export async function getAllArticles(options?: {
  includeDrafts?: boolean;
}): Promise<StoredArticle[]> {
  const articles = await ensureDataFile();
  if (options?.includeDrafts) {
    return articles;
  }
  return articles.filter((a) => a.status === "published");
}

export async function getArticleBySlug(
  slug: string,
  options?: { includeDrafts?: boolean }
): Promise<StoredArticle | undefined> {
  const articles = await getAllArticles(options);
  return articles.find((a) => a.slug === slug);
}

export async function createArticle(
  data: Partial<StoredArticle>
): Promise<StoredArticle> {
  const articles = await ensureDataFile();
  const slug =
    data.slug?.trim() ||
    (data.title || "untitled")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  const now = new Date();
  const dateFormatted = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const content = data.content || [];
  const readTime = data.readTime || calculateReadTime(content);

  const newArticle: StoredArticle = {
    id: `blog-${Date.now()}`,
    slug,
    title: data.title || "Untitled Blog Post",
    excerpt: data.excerpt || "",
    metaTitle: data.metaTitle || data.title || "",
    metaDescription: data.metaDescription || data.excerpt || "",
    canonicalUrl: data.canonicalUrl || "",
    keywords: data.keywords || "",
    category: data.category || "General",
    author: data.author || "Spectakles Team",
    authorRole: data.authorRole || "Editorial Writer",
    authorBio:
      data.authorBio ||
      "Writes about communication, confidence, and career preparation.",
    date: data.date || dateFormatted,
    readTime,
    image:
      data.image ||
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1600&q=85",
    imageAlt: data.imageAlt || data.title || "Blog cover image",
    tags: data.tags || [],
    featured: Boolean(data.featured),
    status: data.status || "published",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    content,
  };

  articles.unshift(newArticle);
  await writeDataFile(articles);

  if (supabase) {
    try {
      await supabase.from("blog_posts").upsert([newArticle]);
    } catch (err) {
      console.warn("[BlogStore] Supabase sync skipped:", err);
    }
  }

  return newArticle;
}

export async function updateArticle(
  slug: string,
  updates: Partial<StoredArticle>
): Promise<StoredArticle | null> {
  const articles = await ensureDataFile();
  const index = articles.findIndex((a) => a.slug === slug);
  if (index === -1) return null;

  const existing = articles[index];
  const content = updates.content || existing.content;
  const readTime = updates.readTime || calculateReadTime(content);

  const updated: StoredArticle = {
    ...existing,
    ...updates,
    content,
    readTime,
    updatedAt: new Date().toISOString(),
  };

  articles[index] = updated;
  await writeDataFile(articles);

  if (supabase) {
    try {
      await supabase.from("blog_posts").upsert([updated]);
    } catch (err) {
      console.warn("[BlogStore] Supabase update skipped:", err);
    }
  }

  return updated;
}

export async function deleteArticle(slug: string): Promise<boolean> {
  const articles = await ensureDataFile();
  const filtered = articles.filter((a) => a.slug !== slug);
  if (filtered.length === articles.length) return false;

  await writeDataFile(filtered);

  if (supabase) {
    try {
      await supabase.from("blog_posts").delete().eq("slug", slug);
    } catch (err) {
      console.warn("[BlogStore] Supabase delete skipped:", err);
    }
  }

  return true;
}

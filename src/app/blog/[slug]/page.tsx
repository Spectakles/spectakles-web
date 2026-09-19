import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getArticleBySlug, getAllArticles } from "@/lib/blog-store";
import { BlogArticleReader } from "@/components/blog/BlogArticleReader";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article Not Found | Spectakles",
      description: "The requested article could not be found.",
    };
  }

  const title = article.metaTitle || `${article.title} | Spectakles Insights`;
  const description = article.metaDescription || article.excerpt;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://spectakles.in";
  const canonicalUrl = article.canonicalUrl || `${siteUrl}/blog/${article.slug}`;

  return {
    title,
    description,
    keywords: article.keywords
      ? article.keywords.split(",").map((k) => k.trim())
      : article.tags,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Spectakles",
      images: [
        {
          url: article.image,
          width: 1200,
          height: 630,
          alt: article.imageAlt || article.title,
        },
      ],
      type: "article",
      publishedTime: article.createdAt || article.date,
      authors: [article.author],
      tags: article.tags,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [article.image],
      creator: "@spectakles",
    },
  };
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const [article, allArticles] = await Promise.all([
    getArticleBySlug(slug),
    getAllArticles(),
  ]);

  if (!article) {
    return (
      <div className="section-wrap py-24 text-center">
        <h1 className="text-2xl font-bold mb-4 text-[#111827]">
          Article not found
        </h1>
        <p className="text-stone-500 mb-6">
          The story you are looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-[#10b981] font-semibold hover:underline"
        >
          <ArrowLeft size={16} /> Back to insights
        </Link>
      </div>
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://spectakles.in";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.metaTitle || article.title,
    description: article.metaDescription || article.excerpt,
    image: article.image,
    datePublished: article.createdAt || article.date,
    dateModified: article.updatedAt || article.createdAt || article.date,
    author: {
      "@type": "Person",
      name: article.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Spectakles",
      logo: {
        "@type": "ImageObject",
        url: "https://spectakles.in/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/blog/${article.slug}`,
    },
    keywords: article.keywords || article.tags?.join(", "),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogArticleReader article={article} allArticles={allArticles} />
    </>
  );
}

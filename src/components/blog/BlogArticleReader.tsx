"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, List, Share2 } from "lucide-react";
import Link from "next/link";
import type { ArticleBlock } from "@/data/blog";
import type { StoredArticle } from "@/lib/blog-store";

function parseTextWithLinks(text: string) {
  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = markdownLinkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const label = match[1];
    const url = match[2];
    const isExternal = url.startsWith("http");
    parts.push(
      <a
        key={`${url}-${match.index}`}
        href={url}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="text-[#10b981] font-medium underline underline-offset-4 hover:text-[#059669] transition-colors"
      >
        {label}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

function ArticleBlockView({ block }: { block: ArticleBlock }) {
  if (block.type === "paragraph") {
    return <p>{parseTextWithLinks(block.text)}</p>;
  }
  if (block.type === "heading") {
    const Heading = block.level === 2 ? "h2" : "h3";
    return <Heading id={block.id}>{block.text}</Heading>;
  }
  if (block.type === "list") {
    return (
      <ul>
        {block.items.map((item, idx) => (
          <li key={idx}>{parseTextWithLinks(item)}</li>
        ))}
      </ul>
    );
  }
  return (
    <blockquote>
      <p>“{parseTextWithLinks(block.text)}”</p>
      {block.attribution && <cite>{block.attribution}</cite>}
    </blockquote>
  );
}

interface BlogArticleReaderProps {
  article: StoredArticle;
  allArticles: StoredArticle[];
}

export function BlogArticleReader({
  article,
  allArticles,
}: BlogArticleReaderProps) {
  const bodyRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const headings = useMemo(
    () =>
      article.content.filter(
        (block): block is Extract<ArticleBlock, { type: "heading" }> =>
          block.type === "heading",
      ),
    [article],
  );

  const articleIndex = allArticles.findIndex(
    (item) => item.slug === article.slug,
  );
  const previous = articleIndex > 0 ? allArticles[articleIndex - 1] : undefined;
  const next =
    articleIndex >= 0 && articleIndex < allArticles.length - 1
      ? allArticles[articleIndex + 1]
      : undefined;
  const related = allArticles
    .filter((item) => item.slug !== article.slug)
    .slice(0, 3);

  useEffect(() => {
    const updateProgress = () => {
      const body = bodyRef.current;
      if (!body) return;
      const start = body.getBoundingClientRect().top + window.scrollY - 120;
      const total = Math.max(body.scrollHeight - window.innerHeight, 1);
      setProgress(
        Math.min(100, Math.max(0, ((window.scrollY - start) / total) * 100)),
      );
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="blog-article-page">
      <div className="blog-reading-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <header className="article-header section-wrap">
        <Link className="article-back" href="/blog">
          <ArrowLeft size={16} /> Back to insights
        </Link>
        <div className="article-header-grid">
          <div>
            <p className="eyebrow">{article.category}</p>
            <h1>{article.title}</h1>
            <p className="article-deck">{article.excerpt}</p>
          </div>
          <div className="article-header-meta">
            <div className="blog-avatar">
              {article.author
                .split(" ")
                .map((name) => name[0])
                .join("")}
            </div>
            <div>
              <strong>{article.author}</strong>
              <span>{article.authorRole}</span>
              <small>
                {article.date} <i /> {article.readTime}
              </small>
            </div>
          </div>
        </div>
      </header>

      <div className="article-hero section-wrap">
        <img src={article.image} alt={article.imageAlt} />
      </div>

      <div className="article-layout section-wrap">
        <aside className="article-toc article-toc-desktop">
          <p>On this page</p>
          {headings.map((heading) => (
            <a key={heading.id} href={`#${heading.id}`}>
              {heading.text}
            </a>
          ))}
        </aside>

        <details
          className="article-toc-mobile"
          open={tocOpen}
          onToggle={(event) => setTocOpen(event.currentTarget.open)}
        >
          <summary>
            <List size={16} /> On this page
          </summary>
          <nav>
            {headings.map((heading) => (
              <a key={heading.id} href={`#${heading.id}`}>
                {heading.text}
              </a>
            ))}
          </nav>
        </details>

        <article className="article-body" ref={bodyRef}>
          {article.content.map((block, index) => (
            <ArticleBlockView
              block={block}
              key={
                block.type === "heading" ? block.id : `${block.type}-${index}`
              }
            />
          ))}

          {article.tags && article.tags.length > 0 && (
            <div className="article-tags">
              {article.tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>
          )}
        </article>

        <aside className="article-share">
          <button
            type="button"
            aria-label="Share article"
            title={copied ? "Copied link!" : "Share article"}
            onClick={handleShare}
            className="relative"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
          </button>
        </aside>
      </div>

      <section className="article-author section-wrap">
        <div className="blog-avatar blog-avatar-large">
          {article.author
            .split(" ")
            .map((name) => name[0])
            .join("")}
        </div>
        <div>
          <p className="eyebrow">Written by</p>
          <h2>{article.author}</h2>
          <p>{article.authorBio}</p>
        </div>
      </section>

      <nav
        className="article-next-prev section-wrap"
        aria-label="Article navigation"
      >
        {previous ? (
          <Link href={`/blog/${previous.slug}`}>
            <span>
              <ArrowLeft size={16} /> Previous article
            </span>
            <strong>{previous.title}</strong>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link className="article-next" href={`/blog/${next.slug}`}>
            <span>
              Next article <ArrowRight size={16} />
            </span>
            <strong>{next.title}</strong>
          </Link>
        ) : (
          <span />
        )}
      </nav>

      {related.length > 0 && (
        <section className="article-related section-wrap">
          <div className="blog-section-heading">
            <div>
              <p className="eyebrow">Keep exploring</p>
              <h2>You might also like</h2>
            </div>
          </div>
          <div className="blog-article-grid">
            {related.map((item) => (
              <article
                key={item.slug}
                className="blog-article-card blog-related-card"
              >
                <Link className="blog-card-image" href={`/blog/${item.slug}`}>
                  <img src={item.image} alt={item.imageAlt} loading="lazy" />
                </Link>
                <div className="blog-card-content">
                  <span className="blog-kicker">{item.category}</span>
                  <h3>
                    <Link href={`/blog/${item.slug}`}>{item.title}</Link>
                  </h3>
                  <div className="blog-card-meta">
                    <span>{item.author}</span>
                    <span>{item.readTime}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

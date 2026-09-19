"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft,
  Check,
  Eye,
  Globe,
  Image as ImageIcon,
  Link as LinkIcon,
  List,
  Plus,
  Quote,
  Save,
  Search,
  Share2,
  Sparkles,
  Tag,
  Trash2,
  Type,
} from "lucide-react";
import type { StoredArticle } from "@/lib/blog-store";
import type { ArticleBlock } from "@/data/blog";

interface BlogEditorProps {
  initialArticle?: StoredArticle | null;
  onSave: (article: Partial<StoredArticle>) => Promise<void>;
  onCancel: () => void;
  availableCategories: string[];
}

export default function BlogEditor({
  initialArticle,
  onSave,
  onCancel,
  availableCategories,
}: BlogEditorProps) {
  const [title, setTitle] = useState(initialArticle?.title || "");
  const [slug, setSlug] = useState(initialArticle?.slug || "");
  const [autoSlug, setAutoSlug] = useState(!initialArticle);
  const [excerpt, setExcerpt] = useState(initialArticle?.excerpt || "");
  const [category, setCategory] = useState(
    initialArticle?.category || availableCategories[1] || "Communication"
  );
  const [customCategory, setCustomCategory] = useState("");
  const [author, setAuthor] = useState(initialArticle?.author || "Spectakles Team");
  const [authorRole, setAuthorRole] = useState(
    initialArticle?.authorRole || "Editorial Writer"
  );
  const [authorBio, setAuthorBio] = useState(
    initialArticle?.authorBio ||
      "Writes about the small, practical shifts that help people think clearly and show up with confidence."
  );
  const [image, setImage] = useState(
    initialArticle?.image ||
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1600&q=85"
  );
  const [imageAlt, setImageAlt] = useState(initialArticle?.imageAlt || "");
  const [tagsInput, setTagsInput] = useState(
    initialArticle?.tags?.join(", ") || "GD, communication, confidence"
  );
  const [featured, setFeatured] = useState(Boolean(initialArticle?.featured));
  const [status, setStatus] = useState<"published" | "draft">(
    initialArticle?.status || "published"
  );

  // SEO fields
  const [metaTitle, setMetaTitle] = useState(
    initialArticle?.metaTitle || initialArticle?.title || ""
  );
  const [metaDescription, setMetaDescription] = useState(
    initialArticle?.metaDescription || initialArticle?.excerpt || ""
  );
  const [canonicalUrl, setCanonicalUrl] = useState(
    initialArticle?.canonicalUrl || ""
  );
  const [keywords, setKeywords] = useState(initialArticle?.keywords || "");

  // Content Blocks
  const [blocks, setBlocks] = useState<ArticleBlock[]>(
    initialArticle?.content || [
      {
        type: "paragraph",
        text: "Start writing your article here. You can add paragraphs, headings, bullet lists, blockquotes, and hyperlinks.",
      },
    ]
  );

  const [activeTab, setActiveTab] = useState<"editor" | "seo" | "preview">("editor");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Auto-generate slug from title
  useEffect(() => {
    if (autoSlug && title) {
      const generated = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setSlug(generated);
    }
  }, [title, autoSlug]);

  // Keep meta defaults in sync with title/excerpt if untouched
  useEffect(() => {
    if (!initialArticle) {
      setMetaTitle(title);
      setMetaDescription(excerpt);
    }
  }, [title, excerpt, initialArticle]);

  // Word count & read time calculation
  const wordCount = useMemo(() => {
    let count = 0;
    for (const b of blocks) {
      if (b.type === "paragraph" || b.type === "quote") {
        count += b.text.trim().split(/\s+/).filter(Boolean).length;
      } else if (b.type === "heading") {
        count += b.text.trim().split(/\s+/).filter(Boolean).length;
      } else if (b.type === "list") {
        count += b.items.join(" ").trim().split(/\s+/).filter(Boolean).length;
      }
    }
    return count;
  }, [blocks]);

  const readTimeEstimate = useMemo(() => {
    const mins = Math.max(1, Math.ceil(wordCount / 200));
    return `${mins} min read`;
  }, [wordCount]);

  // Block management
  const addBlock = (type: "paragraph" | "heading" | "list" | "quote") => {
    if (type === "paragraph") {
      setBlocks([...blocks, { type: "paragraph", text: "" }]);
    } else if (type === "heading") {
      const id = `section-${Date.now()}`;
      setBlocks([...blocks, { type: "heading", id, level: 2, text: "" }]);
    } else if (type === "list") {
      setBlocks([...blocks, { type: "list", items: ["Point 1", "Point 2"] }]);
    } else if (type === "quote") {
      setBlocks([
        ...blocks,
        { type: "quote", text: "", attribution: "Speaker / Source" },
      ]);
    }
  };

  const updateBlock = (index: number, updated: ArticleBlock) => {
    const copy = [...blocks];
    copy[index] = updated;
    setBlocks(copy);
  };

  const removeBlock = (index: number) => {
    setBlocks(blocks.filter((_, idx) => idx !== index));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === blocks.length - 1) return;
    const target = direction === "up" ? index - 1 : index + 1;
    const copy = [...blocks];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    setBlocks(copy);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const resolvedCategory = customCategory.trim() ? customCategory.trim() : category;

    try {
      await onSave({
        id: initialArticle?.id,
        title,
        slug,
        excerpt,
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || excerpt,
        canonicalUrl,
        keywords,
        category: resolvedCategory,
        author,
        authorRole,
        authorBio,
        image,
        imageAlt: imageAlt || title,
        tags,
        featured,
        status,
        readTime: readTimeEstimate,
        content: blocks,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200/80 rounded-3xl shadow-sm overflow-hidden">
      {/* Top action header */}
      <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-200/60 transition-colors"
            title="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              {initialArticle ? "Edit Article" : "Compose New Article"}
            </h2>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{readTimeEstimate}</span>
              <span>•</span>
              <span
                className={`font-semibold ${
                  status === "published" ? "text-brand-green" : "text-amber-600"
                }`}
              >
                {status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Tab switcher & save button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center bg-gray-200/60 p-1 rounded-xl text-xs font-semibold text-gray-600">
            <button
              type="button"
              onClick={() => setActiveTab("editor")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "editor"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "hover:text-gray-900"
              }`}
            >
              Content
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("seo")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "seo"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "hover:text-gray-900"
              }`}
            >
              <Globe size={13} />
              SEO & Social
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "preview"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "hover:text-gray-900"
              }`}
            >
              <Eye size={13} />
              Preview
            </button>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
            className="inline-flex items-center gap-2 bg-brand-green hover:bg-[#257341] text-white px-5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {saveSuccess ? (
              <>
                <Check size={16} /> Saved!
              </>
            ) : (
              <>
                <Save size={16} /> {saving ? "Saving..." : "Save Article"}
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-8">
        {/* ======================= TAB 1: CONTENT EDITOR ======================= */}
        {activeTab === "editor" && (
          <div className="space-y-8 max-w-4xl mx-auto">
            {/* Title & Slug */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. How to structure high-impact arguments in placement rounds"
                  className="w-full text-xl sm:text-2xl font-bold px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 transition-all placeholder:text-gray-300"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      URL Slug *
                    </label>
                    <button
                      type="button"
                      onClick={() => setAutoSlug(!autoSlug)}
                      className="text-[11px] font-semibold text-brand-green hover:underline"
                    >
                      {autoSlug ? "Manual Slug" : "Auto Slug"}
                    </button>
                  </div>
                  <div className="flex items-center px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-600">
                    <span className="text-gray-400">/blog/</span>
                    <input
                      type="text"
                      required
                      value={slug}
                      readOnly={autoSlug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full py-2.5 bg-transparent border-0 focus:outline-none font-mono text-xs text-gray-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        if (e.target.value !== "Custom") setCustomCategory("");
                      }}
                      className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-green"
                    >
                      {availableCategories
                        .filter((c) => c !== "All")
                        .map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      <option value="Custom">+ Custom Category</option>
                    </select>
                    {category === "Custom" && (
                      <input
                        type="text"
                        placeholder="New category..."
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="w-full py-2 px-3 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-green"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Excerpt / Summary
              </label>
              <textarea
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief 1-2 sentence hook for cards and summaries..."
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
              />
            </div>

            {/* Cover Image */}
            <div className="p-5 border border-gray-200 rounded-2xl bg-gray-50/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon size={15} /> Cover Image
                </span>
                {image && (
                  <a
                    href={image}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold text-brand-green hover:underline"
                  >
                    Open Full Image ↗
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Image URL (Unsplash or direct asset)
                    </label>
                    <input
                      type="url"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Image Alt Text (SEO & Accessibility)
                    </label>
                    <input
                      type="text"
                      value={imageAlt}
                      onChange={(e) => setImageAlt(e.target.value)}
                      placeholder="e.g. Students analyzing discussion points around a table"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {image ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                    <img
                      src={image}
                      alt={imageAlt || "Preview"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400">
                    No image specified
                  </div>
                )}
              </div>
            </div>

            {/* Author & Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 rounded-2xl bg-gray-50/30 space-y-3">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Author Details
                </span>
                <input
                  type="text"
                  placeholder="Author Name"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium"
                />
                <input
                  type="text"
                  placeholder="Author Role (e.g. Learning Specialist)"
                  value={authorRole}
                  onChange={(e) => setAuthorRole(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                />
                <textarea
                  rows={2}
                  placeholder="Short author bio..."
                  value={authorBio}
                  onChange={(e) => setAuthorBio(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <div className="p-4 border border-gray-200 rounded-2xl bg-gray-50/30 space-y-3">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Tags & Status
                </span>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="GD, placement, confidence, campus"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-medium text-gray-700">Publication Status</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "published" | "draft")}
                    className="py-1.5 px-3 bg-white border border-gray-200 rounded-xl text-xs font-bold"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 pt-1 text-xs text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="rounded text-brand-green focus:ring-brand-green w-4 h-4"
                  />
                  <span>Feature as Editor&apos;s Pick on Blog Index</span>
                </label>
              </div>
            </div>

            {/* Structured Content Blocks */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Article Content Blocks
                  </h3>
                  <p className="text-xs text-gray-500">
                    Use modular content blocks. Add headings, paragraphs, quotes, and lists.
                  </p>
                </div>
              </div>

              {/* Block List */}
              <div className="space-y-4">
                {blocks.map((block, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-gray-300 transition-all space-y-3 group"
                  >
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="font-bold text-gray-700 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        {block.type === "heading" && `Heading (H${block.level})`}
                        {block.type === "paragraph" && "Paragraph"}
                        {block.type === "quote" && "Blockquote"}
                        {block.type === "list" && "Bullet List"}
                      </span>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => moveBlock(idx, "up")}
                          disabled={idx === 0}
                          className="px-2 py-1 hover:bg-gray-100 rounded text-gray-600 disabled:opacity-20"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveBlock(idx, "down")}
                          disabled={idx === blocks.length - 1}
                          className="px-2 py-1 hover:bg-gray-100 rounded text-gray-600 disabled:opacity-20"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeBlock(idx)}
                          className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors"
                          title="Delete block"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Block inputs */}
                    {block.type === "paragraph" && (
                      <div>
                        <textarea
                          rows={3}
                          value={block.text}
                          onChange={(e) =>
                            updateBlock(idx, { type: "paragraph", text: e.target.value })
                          }
                          placeholder="Type paragraph text... You can also write markdown links: [link text](https://example.com)"
                          className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green"
                        />
                      </div>
                    )}

                    {block.type === "heading" && (
                      <div className="flex gap-2">
                        <select
                          value={block.level}
                          onChange={(e) =>
                            updateBlock(idx, {
                              ...block,
                              level: Number(e.target.value) as 2 | 3,
                            })
                          }
                          className="px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                        >
                          <option value={2}>H2</option>
                          <option value={3}>H3</option>
                        </select>
                        <input
                          type="text"
                          value={block.text}
                          onChange={(e) => {
                            const newText = e.target.value;
                            const id = newText
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/(^-|-$)+/g, "");
                            updateBlock(idx, { ...block, text: newText, id });
                          }}
                          placeholder="Section Heading..."
                          className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-brand-green"
                        />
                      </div>
                    )}

                    {block.type === "quote" && (
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          value={block.text}
                          onChange={(e) =>
                            updateBlock(idx, { ...block, text: e.target.value })
                          }
                          placeholder="Quoted statement..."
                          className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm italic focus:outline-none focus:border-brand-green"
                        />
                        <input
                          type="text"
                          value={block.attribution}
                          onChange={(e) =>
                            updateBlock(idx, {
                              ...block,
                              attribution: e.target.value,
                            })
                          }
                          placeholder="Attribution / Author citation..."
                          className="w-full px-3 py-1.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green"
                        />
                      </div>
                    )}

                    {block.type === "list" && (
                      <div className="space-y-2">
                        {block.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs">•</span>
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const newItems = [...block.items];
                                newItems[itemIdx] = e.target.value;
                                updateBlock(idx, { ...block, items: newItems });
                              }}
                              className="w-full px-3 py-1.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-brand-green"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newItems = block.items.filter(
                                  (_, i) => i !== itemIdx
                                );
                                updateBlock(idx, { ...block, items: newItems });
                              }}
                              className="text-gray-400 hover:text-red-500 p-1"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            updateBlock(idx, {
                              ...block,
                              items: [...block.items, `Item ${block.items.length + 1}`],
                            });
                          }}
                          className="text-xs font-semibold text-brand-green hover:underline mt-1 inline-block"
                        >
                          + Add bullet item
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Block Toolbar */}
              <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-100/70 rounded-2xl">
                <span className="text-xs font-bold text-gray-500 px-2">
                  + Add Block:
                </span>
                <button
                  type="button"
                  onClick={() => addBlock("paragraph")}
                  className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1.5 shadow-2xs transition-all hover:scale-105"
                >
                  <Type size={14} /> Paragraph
                </button>
                <button
                  type="button"
                  onClick={() => addBlock("heading")}
                  className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1.5 shadow-2xs transition-all hover:scale-105"
                >
                  <Type size={14} /> Heading
                </button>
                <button
                  type="button"
                  onClick={() => addBlock("quote")}
                  className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1.5 shadow-2xs transition-all hover:scale-105"
                >
                  <Quote size={14} /> Blockquote
                </button>
                <button
                  type="button"
                  onClick={() => addBlock("list")}
                  className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1.5 shadow-2xs transition-all hover:scale-105"
                >
                  <List size={14} /> Bullet List
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 2: SEO & SOCIAL PREVIEWS ======================= */}
        {activeTab === "seo" && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="p-6 bg-brand-greenLight/60 border border-brand-green/20 rounded-2xl">
              <h3 className="text-sm font-bold text-brand-dark flex items-center gap-2">
                <Sparkles size={16} className="text-brand-green" /> Search Engine & Social Optimization
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Customize how your article appears when shared on WhatsApp, LinkedIn, X, and in Google Search queries.
              </p>
            </div>

            {/* SEO Inputs */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Meta Title (Google SERP Title)
                  </label>
                  <span
                    className={`text-xs font-bold ${
                      metaTitle.length >= 45 && metaTitle.length <= 60
                        ? "text-brand-green"
                        : metaTitle.length > 60
                        ? "text-red-500"
                        : "text-amber-500"
                    }`}
                  >
                    {metaTitle.length} / 60 characters
                  </span>
                </div>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Recommended: 50-60 characters for optimal desktop/mobile display"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Meta Description
                  </label>
                  <span
                    className={`text-xs font-bold ${
                      metaDescription.length >= 120 && metaDescription.length <= 160
                        ? "text-brand-green"
                        : metaDescription.length > 160
                        ? "text-red-500"
                        : "text-amber-500"
                    }`}
                  >
                    {metaDescription.length} / 160 characters
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Recommended: 140-160 characters summarizing the article for search results..."
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Canonical URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    placeholder="https://spectakles.in/blog/your-slug"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    SEO Keywords (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="group discussion, campus placements, communication skills"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            {/* LIVE GOOGLE SERP PREVIEW */}
            <div className="p-6 border border-gray-200 rounded-2xl bg-white space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Search size={15} /> Google Search Snippet Preview
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    className={`px-2.5 py-1 rounded-md font-semibold ${
                      previewDevice === "desktop"
                        ? "bg-gray-200 text-gray-900"
                        : "text-gray-500"
                    }`}
                  >
                    Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    className={`px-2.5 py-1 rounded-md font-semibold ${
                      previewDevice === "mobile"
                        ? "bg-gray-200 text-gray-900"
                        : "text-gray-500"
                    }`}
                  >
                    Mobile
                  </button>
                </div>
              </div>

              <div
                className={`p-4 bg-[#F8F9FA] rounded-xl font-sans ${
                  previewDevice === "mobile" ? "max-w-sm" : "max-w-xl"
                }`}
              >
                <div className="text-xs text-[#202124] flex items-center gap-1.5 mb-1">
                  <span className="w-4 h-4 rounded-full bg-brand-green flex items-center justify-center text-white text-[9px] font-bold">
                    S
                  </span>
                  <span className="text-[12px] text-[#202124]">Spectakles Insights</span>
                  <span className="text-gray-400">›</span>
                  <span className="text-[12px] text-[#5f6368] truncate">
                    https://spectakles.in/blog/{slug || "your-slug"}
                  </span>
                </div>
                <h4 className="text-[18px] sm:text-[20px] text-[#1a0dab] hover:underline cursor-pointer font-normal line-clamp-1 leading-tight mb-1">
                  {metaTitle || title || "Untitled Article | Spectakles"}
                </h4>
                <p className="text-[13px] sm:text-[14px] text-[#4d5156] line-clamp-2 leading-relaxed">
                  {metaDescription ||
                    excerpt ||
                    "Enter a meta description to see how your snippet will appear on Google."}
                </p>
              </div>
            </div>

            {/* SOCIAL OPENGRAPH CARD PREVIEW */}
            <div className="p-6 border border-gray-200 rounded-2xl bg-white space-y-3">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
                <Share2 size={15} /> Social Card (OpenGraph / X / LinkedIn)
              </span>

              <div className="max-w-lg border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                <div className="aspect-[1.91/1] bg-gray-100 relative overflow-hidden">
                  <img
                    src={
                      image ||
                      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1600&q=85"
                    }
                    alt={imageAlt || "OpenGraph Preview"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded font-mono">
                    spectakles.in
                  </div>
                </div>
                <div className="p-4 bg-gray-50/50">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    SPECTAKLES.IN
                  </span>
                  <h4 className="text-base font-bold text-gray-900 leading-snug line-clamp-2 mb-1">
                    {metaTitle || title || "Article Title Preview"}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {metaDescription || excerpt || "Article description preview..."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 3: FULL ARTICLE PREVIEW ======================= */}
        {activeTab === "preview" && (
          <div className="max-w-3xl mx-auto py-6 space-y-6">
            <div className="space-y-3">
              <span className="text-xs font-bold bg-brand-green/10 text-brand-green px-3 py-1 rounded-full uppercase tracking-wider">
                {category}
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                {title || "Untitled Article"}
              </h1>
              <p className="text-base text-gray-600 leading-relaxed">
                {excerpt || "Article excerpt preview will appear here..."}
              </p>
              <div className="flex items-center gap-3 pt-2 text-xs text-gray-500">
                <span className="font-bold text-gray-900">{author}</span>
                <span>•</span>
                <span>{readTimeEstimate}</span>
                <span>•</span>
                <span>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>

            {image && (
              <div className="rounded-2xl overflow-hidden shadow-sm aspect-video border border-gray-100">
                <img
                  src={image}
                  alt={imageAlt || title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="prose max-w-none pt-4 space-y-4">
              {blocks.map((block, idx) => {
                if (block.type === "paragraph") {
                  return (
                    <p key={idx} className="text-base text-gray-800 leading-relaxed">
                      {block.text}
                    </p>
                  );
                }
                if (block.type === "heading") {
                  const Tag = block.level === 2 ? "h2" : "h3";
                  return (
                    <Tag
                      key={idx}
                      className={
                        block.level === 2
                          ? "text-2xl font-bold text-gray-900 pt-4"
                          : "text-xl font-bold text-gray-900 pt-2"
                      }
                    >
                      {block.text}
                    </Tag>
                  );
                }
                if (block.type === "quote") {
                  return (
                    <blockquote
                      key={idx}
                      className="border-l-4 border-brand-green pl-4 py-2 italic text-gray-700 bg-gray-50/50 rounded-r-xl"
                    >
                      <p>“{block.text}”</p>
                      {block.attribution && (
                        <cite className="block text-xs font-semibold text-gray-500 not-italic mt-1">
                          — {block.attribution}
                        </cite>
                      )}
                    </blockquote>
                  );
                }
                if (block.type === "list") {
                  return (
                    <ul key={idx} className="list-disc pl-6 space-y-1 text-gray-800">
                      {block.items.map((item, itemIdx) => (
                        <li key={itemIdx}>{item}</li>
                      ))}
                    </ul>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

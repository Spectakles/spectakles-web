"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { StoredArticle } from "@/lib/blog-store";
import BlogEditor from "./BlogEditor";

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [articles, setArticles] = useState<StoredArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState<"All" | "published" | "draft">("All");

  const [editingArticle, setEditingArticle] = useState<StoredArticle | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blogs?includeDrafts=true");
      const data = await res.json();
      if (data.success) {
        setArticles(data.articles);
      }
    } catch (err) {
      console.error("Failed to load articles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const categories = Array.from(
    new Set(["All", ...articles.map((a) => a.category).filter(Boolean)])
  );

  const filteredArticles = articles.filter((art) => {
    const matchesQuery =
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === "All" || art.category === selectedCategory;

    const matchesStatus =
      selectedStatus === "All" || art.status === selectedStatus;

    return matchesQuery && matchesCategory && matchesStatus;
  });

  const handleSave = async (articleData: Partial<StoredArticle>) => {
    const isEdit = Boolean(articleData.id && editingArticle);
    const endpoint = isEdit ? `/api/blogs/${editingArticle?.slug}` : "/api/blogs";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(articleData),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to save article");
    }

    await fetchArticles();
    setEditingArticle(null);
    setIsCreating(false);
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Are you sure you want to permanently delete this blog post?")) {
      return;
    }

    try {
      const res = await fetch(`/api/blogs/${slug}`, { method: "DELETE" });
      if (res.ok) {
        setArticles(articles.filter((a) => a.slug !== slug));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleToggleStatus = async (article: StoredArticle) => {
    const newStatus = article.status === "published" ? "draft" : "published";
    try {
      const res = await fetch(`/api/blogs/${article.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setArticles(
          articles.map((a) => (a.slug === article.slug ? { ...a, status: newStatus } : a))
        );
      }
    } catch (err) {
      console.error("Status toggle failed:", err);
    }
  };

  // If in editor mode
  if (isCreating || editingArticle) {
    return (
      <BlogEditor
        initialArticle={editingArticle}
        onSave={handleSave}
        onCancel={() => {
          setEditingArticle(null);
          setIsCreating(false);
        }}
        availableCategories={categories}
      />
    );
  }

  const publishedCount = articles.filter((a) => a.status === "published").length;
  const draftCount = articles.filter((a) => a.status === "draft").length;

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Total Articles
            </span>
            <FileText size={18} className="text-brand-dark" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-brand-dark">{articles.length}</div>
          <span className="text-xs text-gray-400 mt-1 block">In CMS library</span>
        </div>

        <div className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green">
              Published
            </span>
            <CheckCircle2 size={18} className="text-brand-green" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-brand-green">{publishedCount}</div>
          <span className="text-xs text-gray-400 mt-1 block">Live on website</span>
        </div>

        <div className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Drafts
            </span>
            <Clock size={18} className="text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-600">{draftCount}</div>
          <span className="text-xs text-gray-400 mt-1 block">Under review</span>
        </div>

        <div className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Categories
            </span>
            <Filter size={18} className="text-gray-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-800">
            {categories.filter((c) => c !== "All").length}
          </div>
          <span className="text-xs text-gray-400 mt-1 block">Topic labels</span>
        </div>
      </div>

      {/* Action Bar & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search posts by title, tag, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-brand-green"
            />
          </div>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-2 px-3 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-brand-green"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="py-2 px-3 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-brand-green"
          >
            <option value="All">All Statuses</option>
            <option value="published">Published Only</option>
            <option value="draft">Drafts Only</option>
          </select>
        </div>

        <button
          onClick={() => {
            setEditingArticle(null);
            setIsCreating(true);
          }}
          className="inline-flex items-center justify-center gap-2 bg-brand-green hover:bg-[#257341] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all hover:scale-105 active:scale-95 shrink-0"
        >
          <Plus size={16} /> Compose Article
        </button>
      </div>

      {/* Blog Posts Table */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm animate-pulse">
            Loading articles...
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <p className="text-gray-500 font-medium">No blog posts match your criteria.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
                setSelectedStatus("All");
              }}
              className="text-xs font-bold text-brand-green hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/80 text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Article</th>
                  <th className="py-3 px-4 hidden md:table-cell">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredArticles.map((art) => (
                  <tr key={art.slug} className="hover:bg-gray-50/50 transition-colors group">
                    {/* Title + cover preview */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200/60">
                          <img
                            src={art.image}
                            alt={art.imageAlt || art.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 max-w-md">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 truncate block">
                              {art.title}
                            </span>
                            {art.featured && (
                              <span className="shrink-0 text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                                Featured
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 truncate mt-0.5">{art.excerpt}</p>
                          <span className="text-[11px] font-mono text-gray-400 block mt-0.5">
                            /blog/{art.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4 hidden md:table-cell">
                      <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                        {art.category}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleStatus(art)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${
                          art.status === "published"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                        }`}
                        title="Click to toggle status"
                      >
                        {art.status === "published" ? "Live" : "Draft"}
                      </button>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 hidden sm:table-cell text-xs text-gray-500">
                      <div>{art.date}</div>
                      <span className="text-[11px] text-gray-400">{art.readTime}</span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/blog/${art.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View live article"
                        >
                          <ExternalLink size={15} />
                        </a>
                        <button
                          onClick={() => {
                            setEditingArticle(art);
                            setIsCreating(false);
                          }}
                          className="p-1.5 text-gray-500 hover:text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors"
                          title="Edit article"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(art.slug)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete article"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

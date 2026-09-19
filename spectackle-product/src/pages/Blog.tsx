import { FormEvent, useState } from "react";
import { ArrowRight, ArrowUpRight, Mail, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { articles, blogCategories } from "../data/blog";
import "./blog.css";

function ArticleCard({
  slug,
  title,
  excerpt,
  category,
  author,
  date,
  readTime,
  image,
  imageAlt,
}: (typeof articles)[number]) {
  return (
    <article className="blog-article-card">
      <Link
        className="blog-card-image"
        to={`/blog/${slug}`}
        aria-label={`Read ${title}`}
      >
        <img src={image} alt={imageAlt} loading="lazy" />
        <span className="blog-card-arrow">
          <ArrowUpRight size={17} />
        </span>
      </Link>
      <div className="blog-card-content">
        <span className="blog-kicker">{category}</span>
        <h3>
          <Link to={`/blog/${slug}`}>{title}</Link>
        </h3>
        <p>{excerpt}</p>
        <div className="blog-card-meta">
          <span>{author}</span>
          <span>{date}</span>
          <span>{readTime}</span>
        </div>
      </div>
    </article>
  );
}

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredArticles = articles.filter((article) => {
    const matchesCategory =
      activeCategory === "All" || article.category === activeCategory;
    const searchable = [
      article.title,
      article.excerpt,
      article.category,
      ...article.tags,
    ]
      .join(" ")
      .toLowerCase();
    return (
      matchesCategory &&
      (!normalizedQuery || searchable.includes(normalizedQuery))
    );
  });
  const featured =
    filteredArticles.find((article) => article.featured) ?? filteredArticles[0];
  const latest = filteredArticles.filter(
    (article) => article.slug !== featured?.slug,
  );

  const handleSubscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubscribed(true);
  };

  return (
    <div className="blog-page">
      <section className="blog-hero section-wrap">
        <div className="blog-hero-copy">
          <p className="eyebrow">Blog / Insights</p>
          <h1>
            Ideas for clearer thinking and <em>stronger voices.</em>
          </h1>
          <p className="blog-hero-deck">
            Practical ideas on communication, AI interviews, group discussions,
            and the small habits that help people show up with confidence.
          </p>
        </div>
        <div className="blog-hero-note">
          <span className="blog-note-line" />
          <p>
            For the moments
            <br />
            that matter.
          </p>
        </div>
      </section>

      <section
        className="blog-controls section-wrap"
        aria-label="Filter articles"
      >
        <div
          className="blog-category-list"
          role="group"
          aria-label="Article categories"
        >
          {blogCategories.map((category) => (
            <button
              key={category}
              type="button"
              className={
                activeCategory === category
                  ? "blog-category active"
                  : "blog-category"
              }
              onClick={() => setActiveCategory(category)}
              aria-pressed={activeCategory === category}
            >
              {category}
            </button>
          ))}
        </div>
        <label className="blog-search">
          <Search size={17} />
          <span className="sr-only">Search articles</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search articles"
            type="search"
          />
        </label>
      </section>

      <main>
        {featured ? (
          <section
            className="blog-featured section-wrap"
            aria-labelledby="featured-heading"
          >
            <div className="blog-section-heading">
              <p className="eyebrow">Editor&apos;s pick</p>
              <span>
                01 / {String(filteredArticles.length).padStart(2, "0")}
              </span>
            </div>
            <article className="blog-featured-story">
              <Link
                className="blog-featured-image"
                to={`/blog/${featured.slug}`}
                aria-label={`Read ${featured.title}`}
              >
                <img src={featured.image} alt={featured.imageAlt} />
              </Link>
              <div className="blog-featured-copy">
                <span className="blog-kicker">
                  Featured · {featured.category}
                </span>
                <h2 id="featured-heading">
                  <Link to={`/blog/${featured.slug}`}>{featured.title}</Link>
                </h2>
                <p>{featured.excerpt}</p>
                <div className="blog-featured-byline">
                  <div className="blog-avatar">
                    {featured.author
                      .split(" ")
                      .map((name) => name[0])
                      .join("")}
                  </div>
                  <div>
                    <strong>{featured.author}</strong>
                    <span>
                      {featured.date} <i /> {featured.readTime}
                    </span>
                  </div>
                </div>
                <Link className="blog-text-link" to={`/blog/${featured.slug}`}>
                  Read the story <ArrowRight size={17} />
                </Link>
              </div>
            </article>
          </section>
        ) : (
          <section className="blog-empty section-wrap">
            <p className="eyebrow">No stories found</p>
            <h2>Try a different search.</h2>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActiveCategory("All");
              }}
            >
              Clear filters
            </button>
          </section>
        )}

        {latest.length > 0 && (
          <section
            className="blog-latest section-wrap"
            aria-labelledby="latest-heading"
          >
            <div className="blog-section-heading">
              <div>
                <p className="eyebrow">Keep reading</p>
                <h2 id="latest-heading">Latest articles</h2>
              </div>
              <span>{latest.length} stories</span>
            </div>
            <div className="blog-article-grid">
              {latest.map((article) => (
                <ArticleCard key={article.slug} {...article} />
              ))}
            </div>
          </section>
        )}
      </main>

      <section className="blog-newsletter section-wrap">
        <div>
          <p className="eyebrow">The good kind of inbox noise</p>
          <h2>Stay sharp.</h2>
          <p>
            One useful note on communication, confidence, and career
            preparation. No filler.
          </p>
        </div>
        {subscribed ? (
          <div className="blog-subscribed">
            <Mail size={18} />
            <strong>You&apos;re on the list.</strong>
            <span>We&apos;ll send the next useful thing.</span>
          </div>
        ) : (
          <form className="blog-newsletter-form" onSubmit={handleSubscribe}>
            <label className="sr-only" htmlFor="blog-email">
              Email address
            </label>
            <input
              id="blog-email"
              type="email"
              required
              placeholder="Your email address"
            />
            <button className="button button-dark" type="submit">
              Subscribe <ArrowRight size={16} />
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

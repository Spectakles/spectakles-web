import { useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Sparkles,
} from "lucide-react";

import { useDemo } from "../components/Layout";
import ScrollPortalLayout from "../components/ScrollPortalLayout";
import { trackClick, trackEvent } from "../lib/firebase";

const categories = [
  {
    label: "GD & Placement Prep",
    icon: "building",
    questions: [
      {
        q: "How does Spectakles prepare me for campus placement GDs?",
        a: "You practice in simulated 5-candidate roundtables with realistic interruptions, time-boxed rounds, and instant scoring on the 5 standard campus rubric parameters.",
      },
      {
        q: "What if I get cut off or interrupted during a GD?",
        a: "That's exactly what you practice here. You learn how to reclaim the floor, hold your line of thought, and jump in without being aggressive.",
      },
      {
        q: "What parameters are evaluated in my scorecard?",
        a: "Content relevance, communication fluency, leadership & initiative, team behavior & listening, and analytical reasoning.",
      },
      {
        q: "Can I practice for specific company placement rounds?",
        a: "Yes. Topics and rounds match actual engineering placement drives and MBA admission patterns.",
      },
      {
        q: "How does this compare to practicing with friends?",
        a: "Friends don't give you millisecond filler-word counts, speech pacing stats, or contrarian challenge AI that won't let you hide.",
      },
    ],
  },
  {
    label: "AI Personas",
    icon: "faculty",
    questions: [
      {
        q: "Who are the AI personas in the room?",
        a: "They are simulated candidates with distinct discussion styles—from aggressive debaters to analytical thinkers and consensus builders.",
      },
      {
        q: "Do the AI personas interrupt me?",
        a: "Yes. Just like a real GD, if you pause too long or hesitate, someone else takes the floor.",
      },
      {
        q: "Is it voice-based or typing?",
        a: "Full voice interaction. You speak with your real microphone, just like in a physical or video placement round.",
      },
      {
        q: "What if I freeze or don't know what to say?",
        a: "Your private prep notes offer instant framework suggestions to get your thinking back on track.",
      },
    ],
  },
  {
    label: "For Students",
    icon: "student",
    questions: [
      {
        q: "Do I need to download any software?",
        a: "Zero downloads. Open the link in Chrome, Safari, or Edge and start speaking immediately.",
      },
      {
        q: "Will other students hear my mistakes?",
        a: "No. Your practice sessions and scorecards are 100% private to you.",
      },
      {
        q: "Can I practice solo whenever I want?",
        a: "Yes. Start a round 24/7 whenever you have 10 minutes before an interview.",
      },
      {
        q: "I get extreme stage fright. Can Spectakles help me?",
        a: "That's who Spectakles is made for. Repeated low-stakes reps desensitize the fear so speaking feels natural.",
      },
    ],
  },
  {
    label: "Campus & Setup",
    icon: "tech",
    questions: [
      {
        q: "Can colleges and placement cells use Spectakles?",
        a: "Yes. Placement cells use Spectakles to conduct cohort-wide GD readiness drives with automated scoring.",
      },
      {
        q: "How quickly can a university roll this out?",
        a: "Within 48 hours. No complex IT integration required—students simply log in with their college email.",
      },
      {
        q: "Is student voice data secure?",
        a: "Yes. Sessions are encrypted in transit and at rest. We never sell student data.",
      },
      {
        q: "How do placement officers track student readiness?",
        a: "A centralized dashboard tracks cohort participation trends, average speaking pace, and rubric readiness benchmarks.",
      },
    ],
  },
];

export default function FAQ() {
  const openDemo = useDemo();

  const [activeCategory, setActiveCategory] = useState(0);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const current = categories[activeCategory];

  const toggleItem = (key: string, questionText: string) => {
    setOpenItems((previous) => {
      const isCurrentlyOpen = Boolean(previous[key]);
      if (!isCurrentlyOpen) {
        trackEvent("faq_question_expanded", {
          question: questionText,
          category: current?.label,
        });
      }
      return {
        ...previous,
        [key]: !isCurrentlyOpen,
      };
    });
  };

  return (
    <ScrollPortalLayout>
      {/* FAQ Hero Section */}
      <section className="portal-scene page-hero section-wrap">
        <div className="page-hero-copy">
          <div className="announcement">
            <Sparkles size={15} />
            Quick answers
          </div>

          <h1>
            Got questions? <em>We got you.</em>
          </h1>

          <p>
            Everything you need to know about practicing GDs on Spectakles. Still stuck? Email us at{" "}
            <a href="mailto:contact@spectakles.in">
              <strong>contact@spectakles.in</strong>
            </a>
            .
          </p>
        </div>
      </section>

      {/* FAQ Content Section */}
      <section className="portal-scene faq-section section-wrap">
        <div className="faq-layout">
          <aside className="faq-sidebar">
            {categories.map((category, index) => (
              <button
                key={category.label}
                className={
                  activeCategory === index
                    ? "faq-category active"
                    : "faq-category"
                }
                onClick={() => {
                  trackClick("faq_category_select", "faq_sidebar", {
                    category: category.label,
                  });
                  setActiveCategory(index);
                }}
              >
                {category.label}

                <span className="faq-count">
                  {category.questions.length}
                </span>
              </button>
            ))}

            <div className="faq-sidebar-cta">
              <p>Still have questions?</p>

              <a
                href="mailto:contact@spectakles.in"
                className="button button-green button-full"
                onClick={() => trackClick("email_us", "faq_sidebar")}
              >
                Email us
                <ArrowRight size={16} />
              </a>
            </div>
          </aside>

          <div className="faq-content">
            <h2 className="faq-category-title">{current.label}</h2>

            <div className="faq-list">
              {current.questions.map((item, index) => {
                const key = `${activeCategory}-${index}`;
                const isOpen = Boolean(openItems[key]);

                return (
                  <div
                    key={key}
                    className={`faq-item ${
                      isOpen ? "faq-item-open" : ""
                    }`}
                  >
                    <button
                      className="faq-question"
                      onClick={() => toggleItem(key, item.q)}
                      aria-expanded={isOpen}
                    >
                      <span>{item.q}</span>

                      <ChevronDown
                        size={18}
                        className={`faq-chevron ${
                          isOpen ? "faq-chevron-open" : ""
                        }`}
                      />
                    </button>

                    <div className="faq-answer-wrap">
                      {isOpen && (
                        <p className="faq-answer">{item.a}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="portal-scene cta-section section-wrap">
        <div className="cta-inner">
          <div className="cta-sun">
            <Sparkles size={34} />
          </div>

          <p className="eyebrow">Need more clarity?</p>

          <h2>
            Still have <em>questions?</em>
          </h2>

          <p>
            Drop us a line at{" "}
            <strong>contact@spectakles.in</strong> — we respond fast.
          </p>

          <a
            href="mailto:contact@spectakles.in"
            className="button button-dark"
            onClick={() => trackClick("email_us", "faq_bottom_cta")}
          >
            Email us
            <ArrowRight size={18} />
          </a>

          <div className="cta-doodles">
            <span>speak up</span>
            <span>stay ready</span>
          </div>
        </div>
      </section>
    </ScrollPortalLayout>
  );
}
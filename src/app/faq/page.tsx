"use client";

import { useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Sparkles,
} from "lucide-react";

import { useDemo } from "@/components/Layout";
import { trackClick, trackEvent } from "@/lib/firebase";

const categories = [
  {
    label: "For institutions",
    icon: "building",
    questions: [
      {
        q: "How long does it take to roll out Spectakles on our campus?",
        a: "Most institutions are up and running within two weeks. We handle setup, faculty onboarding, and your first round templates. Students need nothing more than a browser.",
      },
      {
        q: "Do we need special hardware or software?",
        a: "No. Spectakles runs in any modern browser on laptops, tablets, or phones. No installs, no plugins, no IT tickets.",
      },
      {
        q: "Can we customize rounds for our curriculum?",
        a: "Yes. Campus and Network plans include custom round templates. You can tailor topics, durations, and feedback criteria to match your courses and placement process.",
      },
      {
        q: "How do you measure participation and confidence?",
        a: "We track talk time, number of turns, response patterns, and faculty-validated confidence scores. Every metric is visible in your dashboard and exportable for reporting.",
      },
      {
        q: "Is student data secure and private?",
        a: "Absolutely. Student data is encrypted, access-controlled, and never sold or shared with third parties. Each institution owns its data. We are FERPA-aligned and SOC 2 ready.",
      },
      {
        q: "What does the analytics dashboard show?",
        a: "You get cohort-level participation trends, confidence growth over time, session-by-session breakdowns, and exportable reports for accreditation and placement tracking.",
      },
    ],
  },
  {
    label: "For faculty",
    icon: "faculty",
    questions: [
      {
        q: "Will this add more work to my plate?",
        a: "No. Spectakles comes with ready-to-run rounds. You pick a topic, press start, and the platform handles prompts, nudges, and recaps. You focus on the conversation, not the logistics.",
      },
      {
        q: "Can I use Spectakles in my existing lectures?",
        a: "Yes. Many faculty use Spectakles for 10-minute discussion breaks within lectures, or as standalone practice sessions outside class hours.",
      },
      {
        q: "How do I know which students need help?",
        a: "Your dashboard highlights participation trends per student. You can see who's improving, who's quiet, and who might benefit from a nudge — without calling anyone out publicly.",
      },
      {
        q: "Can I give my own feedback alongside Spectakles's?",
        a: "Yes. Faculty can add notes and observations to any session recap, which students see alongside the automated snapshot.",
      },
    ],
  },
  {
    label: "For students",
    icon: "student",
    questions: [
      {
        q: "Do I need to download anything?",
        a: "No app, no download. You join a round through a link in your browser. That's it.",
      },
      {
        q: "What if I'm nervous about speaking?",
        a: "That's exactly who Spectakles is for. You get a private prep space, friendly prompts, and a low-pressure environment. You can start small — even one sentence counts.",
      },
      {
        q: "Will my performance be shared publicly?",
        a: "Never. Your session snapshots are private to you and your faculty. No leaderboards, no public scores, no embarrassment.",
      },
      {
        q: "Can I practice on my own?",
        a: "Yes. Students can run solo practice rounds to build confidence before joining group sessions.",
      },
    ],
  },
  {
    label: "Technical & security",
    icon: "tech",
    questions: [
      {
        q: "What devices and browsers are supported?",
        a: "Spectakles works on Chrome, Firefox, Safari, and Edge. It's optimized for laptops, tablets, and phones. No minimum specs beyond a working microphone.",
      },
      {
        q: "How is data stored and protected?",
        a: "All data is encrypted in transit and at rest. We use row-level security, role-based access control, and regular security audits. Each institution's data is logically isolated.",
      },
      {
        q: "Do you integrate with our LMS?",
        a: "Campus and Network plans include LMS integration support. We can connect with popular platforms via API. Talk to us about your specific setup.",
      },
      {
        q: "What happens to our data if we stop using Spectakles?",
        a: "You own your data. You can export everything at any time. If you discontinue, we securely delete your data within 30 days of your request.",
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
    <div className="faq-page">
      {/* FAQ Hero Section */}
      <section className="faq-hero section-wrap">
        <div className="faq-hero-copy">
          <div className="announcement">
            <Sparkles size={15} />
            Questions, answered
          </div>

          <h1>
            Everything you might be <em>wondering.</em>
          </h1>

          <p>
            Pick a category and find what you need. Still stuck? Email us at{" "}
            <a href="mailto:contact@spectakles.in">
              <strong>contact@spectakles.in</strong>
            </a>
            .
          </p>
        </div>
      </section>

      {/* FAQ Content Section */}
      <section className="faq-section section-wrap">
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
      <section className="cta-section section-wrap">
        <div className="cta-inner">
          <div className="cta-sun">
            <Sparkles size={34} />
          </div>

          <p className="eyebrow">Didn't find your answer?</p>

          <h2>
            Let's <em>talk.</em>
          </h2>

          <p>
            Send us your questions, feedback, or just say hello at{" "}
            <strong>contact@spectakles.in</strong>.
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
            <span>ask away</span>
            <span>we're listening</span>
          </div>
        </div>
      </section>
    </div>
  );
}

import styles from "./AboutPage.module.css";

function FeatureIcon({ name }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
  };

  if (name === "question") {
    return (
      <svg {...common} aria-hidden="true">
        <path
          d="M9.5 9a2.7 2.7 0 1 1 4.6 1.9c-1.3 1.2-2.1 1.7-2.1 3.1"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M12 18h.01"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  if (name === "people") {
    return (
      <svg {...common} aria-hidden="true">
        <circle
          cx="9"
          cy="8"
          r="3"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M3.5 19c.5-3.2 2.4-5 5.5-5s5 1.8 5.5 5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M15 6.2a3 3 0 0 1 0 5.6M16 14c2.6.4 4 2.1 4.5 5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg {...common} aria-hidden="true">
      <path
        d="M4 18V9M10 18V5M16 18v-7M22 18V3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function AboutPage({
  onBack,
  onExploreDiscussions,
}) {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <button
          type="button"
          className={styles.backButton}
          onClick={onBack}
        >
          <span aria-hidden="true">←</span>
          Back to discussions
        </button>

        <section className={styles.hero}>
          <span className={styles.eyebrow}>
            ABOUT PULSE OPINION
          </span>

          <h1 className={styles.title}>
            Public opinion deserves more than
            <span> noise.</span>
          </h1>

          <p className={styles.lead}>
            Pulse Opinion is a community discussion
            platform built around meaningful questions,
            diverse viewpoints, and a clearer
            understanding of what people really think.
          </p>

          <button
            type="button"
            className={styles.primaryButton}
            onClick={onExploreDiscussions}
          >
            Explore discussions
            <span aria-hidden="true">→</span>
          </button>
        </section>

        <section
          className={styles.features}
          aria-label="What Pulse Opinion offers"
        >
          <article className={styles.featureCard}>
            <span className={styles.featureIcon}>
              <FeatureIcon name="question" />
            </span>

            <h2>Ask what matters</h2>

            <p>
              Start conversations around real questions,
              ideas, and topics people genuinely care
              about.
            </p>
          </article>

          <article className={styles.featureCard}>
            <span className={styles.featureIcon}>
              <FeatureIcon name="people" />
            </span>

            <h2>See different viewpoints</h2>

            <p>
              Discover how people agree, disagree, and
              respond across a growing community.
            </p>
          </article>

          <article className={styles.featureCard}>
            <span className={styles.featureIcon}>
              <FeatureIcon name="pulse" />
            </span>

            <h2>Understand the pulse</h2>

            <p>
              Follow active discussions, trending topics,
              and the conversations shaping public
              opinion.
            </p>
          </article>
        </section>

        <section className={styles.aiSection}>
          <div>
            <span className={styles.aiBadge}>
              COMING NEXT
            </span>

            <h2>
              A clearer view of the conversation.
            </h2>

            <p>
              AI Pulse will help surface viewpoint
              summaries, areas of common ground, and the
              reasons behind disagreement without
              replacing the voices of the community.
            </p>
          </div>

          <div className={styles.aiVisual}>
            <div className={styles.pulseLine}>
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>

            <strong>AI Pulse</strong>
            <small>Understand more. Scroll less.</small>
          </div>
        </section>

        <section className={styles.mission}>
          <span className={styles.eyebrow}>
            OUR DIRECTION
          </span>

          <h2>
            Built for curiosity, not outrage.
          </h2>

          <p>
            The goal is simple: make online discussion
            easier to explore, more useful to understand,
            and less dependent on who can shout the
            loudest.
          </p>
        </section>
      </div>
    </main>
  );
}
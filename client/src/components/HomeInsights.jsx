import styles from "./HomeInsights.module.css";

const TRENDING_TOPICS = [
  { rank: "01", label: "Technology", share: 34 },
  { rank: "02", label: "Entertainment", share: 24 },
  { rank: "03", label: "Politics", share: 19 },
  { rank: "04", label: "Education", share: 12 },
];

const SNAPSHOT = [
  {
    id: "active",
    label: "Active discussions",
    value: "1,284",
    icon: "pulse",
  },
  {
    id: "interactions",
    label: "Total interactions",
    value: "42.6K",
    icon: "spark",
  },
  {
    id: "top-category",
    label: "Most active category",
    value: "Technology",
    icon: "flame",
  },
];

function SnapshotIcon({ name }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
  };

  if (name === "pulse") {
    return (
      <svg {...common} aria-hidden="true">
        <path
          d="M3 12h4l2-7 4 14 2-7h6"
          stroke="#3f5fb8"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "spark") {
    return (
      <svg {...common} aria-hidden="true">
        <path
          d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"
          stroke="#06b6d4"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg {...common} aria-hidden="true">
      <path
        d="M12 2c1.2 3 .3 4.4-.8 5.8C10 9 9 10.4 9 12.4A5 5 0 0 0 14 17.4c2.5 0 4.6-1.7 5-4.4.5 1 .7 2 .7 3A6.7 6.7 0 0 1 12.7 22 7.5 7.5 0 0 1 5 14.5C5 9.8 8.3 6.7 12 2Z"
        stroke="#c98a1f"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HomeInsights({
  onTopicClick,
  onExploreAI,
}) {
  return (
    <aside
      className={styles.insights}
      aria-label="Discussion insights"
    >
      <section
        className={styles.card}
        aria-labelledby="trending-heading"
      >
        <h2
          id="trending-heading"
          className={styles.cardTitle}
        >
          Trending topics
        </h2>

        <ul className={styles.topicList}>
          {TRENDING_TOPICS.map((topic) => (
            <li key={topic.rank}>
              <button
                type="button"
                className={styles.topicRow}
                onClick={() =>
                  onTopicClick?.(topic.label.toLowerCase())
                }
              >
                <span className={styles.topicRank}>
                  {topic.rank}
                </span>

                <span className={styles.topicMeta}>
                  <span className={styles.topicTop}>
                    <span className={styles.topicLabel}>
                      {topic.label}
                    </span>

                    <span className={styles.topicShare}>
                      {topic.share}%
                    </span>
                  </span>

                  <span className={styles.topicTrack}>
                    <span
                      className={styles.topicFill}
                      style={{ width: `${topic.share}%` }}
                    />
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section
        className={styles.card}
        aria-labelledby="snapshot-heading"
      >
        <h2
          id="snapshot-heading"
          className={styles.cardTitle}
        >
          Pulse snapshot
        </h2>

        <ul className={styles.snapshotList}>
          {SNAPSHOT.map((stat) => (
            <li
              key={stat.id}
              className={styles.snapshotRow}
            >
              <span className={styles.snapshotIcon}>
                <SnapshotIcon name={stat.icon} />
              </span>

              <span className={styles.snapshotLabel}>
                {stat.label}
              </span>

              <span className={styles.snapshotValue}>
                {stat.value}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section
        className={`${styles.card} ${styles.aiCard}`}
        aria-labelledby="ai-pulse-heading"
      >
        <span className={styles.aiBadge}>
          Coming to Pulse Opinion
        </span>

        <h2
          id="ai-pulse-heading"
          className={styles.aiTitle}
        >
          Understand what the crowd is really saying.
        </h2>

        <p className={styles.aiDescription}>
          AI-powered summaries of viewpoints, common ground,
          and why people disagree.
        </p>

        <div className={styles.aiFeatureList}>
          <span>Viewpoint summaries</span>
          <span>Common ground</span>
          <span>Disagreement analysis</span>
        </div>

        <button
          type="button"
          className={styles.aiButton}
          onClick={onExploreAI}
        >
          Explore AI Pulse
        </button>
      </section>
    </aside>
  );
}
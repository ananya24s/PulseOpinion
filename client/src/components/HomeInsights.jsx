import { useMemo } from "react";
import styles from "./HomeInsights.module.css";

function getCategory(question) {
  return (
    question.tag ||
    question.category ||
    "General"
  );
}

function getLikes(question) {
  return Number(
    question.likes ??
      question.likeCount ??
      0
  ) || 0;
}

function getDislikes(question) {
  return Number(
    question.dislikes ??
      question.dislikeCount ??
      0
  ) || 0;
}

function getCommentCount(question) {
  if (Array.isArray(question.comments)) {
    return question.comments.length;
  }

  return Number(
    question.commentCount ??
      question.commentsCount ??
      0
  ) || 0;
}

function getInteractionCount(question) {
  return (
    getLikes(question) +
    getDislikes(question) +
    getCommentCount(question)
  );
}

function formatCompactNumber(value) {
  const number = Number(value) || 0;

  if (number >= 1_000_000) {
    return `${(number / 1_000_000)
      .toFixed(number >= 10_000_000 ? 0 : 1)
      .replace(".0", "")}M`;
  }

  if (number >= 1_000) {
    return `${(number / 1_000)
      .toFixed(number >= 100_000 ? 0 : 1)
      .replace(".0", "")}K`;
  }

  return String(number);
}

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
  questions = [],
  onTopicClick,
  onExploreAI,
}) {
  const analytics = useMemo(() => {
    const categoryCounts = {};
    const categoryInteractions = {};

    let totalInteractions = 0;

    questions.forEach((question) => {
      const category = getCategory(question);
      const interactions =
        getInteractionCount(question);

      categoryCounts[category] =
        (categoryCounts[category] || 0) + 1;

      categoryInteractions[category] =
        (categoryInteractions[category] || 0) +
        interactions;

      totalInteractions += interactions;
    });

    const sortedByDiscussionCount =
      Object.entries(categoryCounts).sort(
        (a, b) => {
          if (b[1] !== a[1]) {
            return b[1] - a[1];
          }

          return (
            (categoryInteractions[b[0]] || 0) -
            (categoryInteractions[a[0]] || 0)
          );
        }
      );

    const sortedByActivity =
      Object.entries(categoryInteractions).sort(
        (a, b) => {
          if (b[1] !== a[1]) {
            return b[1] - a[1];
          }

          return (
            (categoryCounts[b[0]] || 0) -
            (categoryCounts[a[0]] || 0)
          );
        }
      );

    const totalQuestions = questions.length;

    const trendingTopics =
      sortedByDiscussionCount
        .slice(0, 4)
        .map(([label, count], index) => ({
          rank: String(index + 1).padStart(
            2,
            "0"
          ),
          label,
          count,
          share:
            totalQuestions > 0
              ? Math.round(
                  (count / totalQuestions) * 100
                )
              : 0,
        }));

    const mostActiveCategory =
      sortedByActivity[0]?.[0] ||
      "No data yet";

    return {
      trendingTopics,
      totalQuestions,
      totalInteractions,
      formattedInteractions:
        formatCompactNumber(totalInteractions),
      mostActiveCategory,
    };
  }, [questions]);

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

        {analytics.trendingTopics.length === 0 ? (
          <p className={styles.emptyText}>
            No discussions yet.
          </p>
        ) : (
          <ul className={styles.topicList}>
            {analytics.trendingTopics.map(
              (topic) => (
                <li key={topic.label}>
                  <button
                    type="button"
                    className={styles.topicRow}
                    onClick={() =>
                      onTopicClick?.(
                        topic.label.toLowerCase()
                      )
                    }
                  >
                    <span
                      className={styles.topicRank}
                    >
                      {topic.rank}
                    </span>

                    <span
                      className={styles.topicMeta}
                    >
                      <span
                        className={styles.topicTop}
                      >
                        <span
                          className={
                            styles.topicLabel
                          }
                        >
                          {topic.label}
                        </span>

                        <span
                          className={
                            styles.topicShare
                          }
                        >
                          {topic.share}%
                        </span>
                      </span>

                      <span
                        className={styles.topicTrack}
                      >
                        <span
                          className={styles.topicFill}
                          style={{
                            width: `${topic.share}%`,
                          }}
                        />
                      </span>
                    </span>
                  </button>
                </li>
              )
            )}
          </ul>
        )}
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
          <li className={styles.snapshotRow}>
            <span
              className={styles.snapshotIcon}
            >
              <SnapshotIcon name="pulse" />
            </span>

            <span
              className={styles.snapshotLabel}
            >
              Active discussions
            </span>

            <span
              className={styles.snapshotValue}
            >
              {analytics.totalQuestions}
            </span>
          </li>

          <li className={styles.snapshotRow}>
            <span
              className={styles.snapshotIcon}
            >
              <SnapshotIcon name="spark" />
            </span>

            <span
              className={styles.snapshotLabel}
            >
              Total interactions
            </span>

            <span
              className={styles.snapshotValue}
              title={String(
                analytics.totalInteractions
              )}
            >
              {analytics.formattedInteractions}
            </span>
          </li>

          <li className={styles.snapshotRow}>
            <span
              className={styles.snapshotIcon}
            >
              <SnapshotIcon name="flame" />
            </span>

            <span
              className={styles.snapshotLabel}
            >
              Most active category
            </span>

            <span
              className={styles.snapshotValue}
            >
              {analytics.mostActiveCategory}
            </span>
          </li>
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
// import { useMemo } from "react";
// import styles from "./HomeInsights.module.css";

// function SnapshotIcon({ name }) {
//   const common = {
//     width: 16,
//     height: 16,
//     viewBox: "0 0 24 24",
//     fill: "none",
//   };

//   if (name === "pulse") {
//     return (
//       <svg {...common} aria-hidden="true">
//         <path
//           d="M3 12h4l2-7 4 14 2-7h6"
//           stroke="#3f5fb8"
//           strokeWidth="1.8"
//           strokeLinecap="round"
//           strokeLinejoin="round"
//         />
//       </svg>
//     );
//   }

//   if (name === "spark") {
//     return (
//       <svg {...common} aria-hidden="true">
//         <path
//           d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"
//           stroke="#06b6d4"
//           strokeWidth="1.8"
//           strokeLinecap="round"
//         />
//       </svg>
//     );
//   }

//   return (
//     <svg {...common} aria-hidden="true">
//       <path
//         d="M12 2c1.2 3 .3 4.4-.8 5.8C10 9 9 10.4 9 12.4A5 5 0 0 0 14 17.4c2.5 0 4.6-1.7 5-4.4.5 1 .7 2 .7 3A6.7 6.7 0 0 1 12.7 22 7.5 7.5 0 0 1 5 14.5C5 9.8 8.3 6.7 12 2Z"
//         stroke="#c98a1f"
//         strokeWidth="1.6"
//         strokeLinejoin="round"
//       />
//     </svg>
//   );
// }

// export default function HomeInsights({
//   questions = [],
//   onTopicClick,
//   onExploreAI,
// }) {
//   const analytics = useMemo(() => {
//     const categoryCounts = {};

//     let totalComments = 0;
//     let totalLikes = 0;

//     questions.forEach((question) => {
//       const category =
//         question.tag ||
//         question.category ||
//         "General";

//       categoryCounts[category] =
//         (categoryCounts[category] || 0) + 1;

//       totalComments +=
//         question.comments?.length || 0;

//       totalLikes +=
//         Number(question.likes) || 0;
//     });

//     const sortedCategories = Object.entries(
//       categoryCounts
//     ).sort((a, b) => b[1] - a[1]);

//     const totalQuestions = questions.length;

//     const trendingTopics = sortedCategories
//       .slice(0, 4)
//       .map(([label, count], index) => ({
//         rank: String(index + 1).padStart(2, "0"),
//         label,
//         count,
//         share:
//           totalQuestions > 0
//             ? Math.round(
//                 (count / totalQuestions) * 100
//               )
//             : 0,
//       }));

//     const leadingCategory =
//       sortedCategories[0]?.[0] || "No data yet";

//     return {
//       trendingTopics,
//       totalQuestions,
//       totalInteractions:
//         totalLikes + totalComments,
//       leadingCategory,
//     };
//   }, [questions]);

//   return (
//     <aside
//       className={styles.insights}
//       aria-label="Discussion insights"
//     >
//       <section
//         className={styles.card}
//         aria-labelledby="trending-heading"
//       >
//         <h2
//           id="trending-heading"
//           className={styles.cardTitle}
//         >
//           Trending topics
//         </h2>

//         {analytics.trendingTopics.length === 0 ? (
//           <p className={styles.emptyText}>
//             No discussions yet.
//           </p>
//         ) : (
//           <ul className={styles.topicList}>
//             {analytics.trendingTopics.map((topic) => (
//               <li key={topic.label}>
//                 <button
//                   type="button"
//                   className={styles.topicRow}
//                   onClick={() =>
//                     onTopicClick?.(
//                       topic.label.toLowerCase()
//                     )
//                   }
//                 >
//                   <span className={styles.topicRank}>
//                     {topic.rank}
//                   </span>

//                   <span className={styles.topicMeta}>
//                     <span className={styles.topicTop}>
//                       <span className={styles.topicLabel}>
//                         {topic.label}
//                       </span>

//                       <span className={styles.topicShare}>
//                         {topic.share}%
//                       </span>
//                     </span>

//                     <span className={styles.topicTrack}>
//                       <span
//                         className={styles.topicFill}
//                         style={{
//                           width: `${topic.share}%`,
//                         }}
//                       />
//                     </span>
//                   </span>
//                 </button>
//               </li>
//             ))}
//           </ul>
//         )}
//       </section>

//       <section
//         className={styles.card}
//         aria-labelledby="snapshot-heading"
//       >
//         <h2
//           id="snapshot-heading"
//           className={styles.cardTitle}
//         >
//           Pulse snapshot
//         </h2>

//         <ul className={styles.snapshotList}>
//           <li className={styles.snapshotRow}>
//             <span className={styles.snapshotIcon}>
//               <SnapshotIcon name="pulse" />
//             </span>

//             <span className={styles.snapshotLabel}>
//               Active discussions
//             </span>

//             <span className={styles.snapshotValue}>
//               {analytics.totalQuestions}
//             </span>
//           </li>

//           <li className={styles.snapshotRow}>
//             <span className={styles.snapshotIcon}>
//               <SnapshotIcon name="spark" />
//             </span>

//             <span className={styles.snapshotLabel}>
//               Total interactions
//             </span>

//             <span className={styles.snapshotValue}>
//               {analytics.totalInteractions}
//             </span>
//           </li>

//           <li className={styles.snapshotRow}>
//             <span className={styles.snapshotIcon}>
//               <SnapshotIcon name="flame" />
//             </span>

//             <span className={styles.snapshotLabel}>
//               Most active category
//             </span>

//             <span className={styles.snapshotValue}>
//               {analytics.leadingCategory}
//             </span>
//           </li>
//         </ul>
//       </section>

//       <section
//         className={`${styles.card} ${styles.aiCard}`}
//         aria-labelledby="ai-pulse-heading"
//       >
//         <span className={styles.aiBadge}>
//           Coming to Pulse Opinion
//         </span>

//         <h2
//           id="ai-pulse-heading"
//           className={styles.aiTitle}
//         >
//           Understand what the crowd is really saying.
//         </h2>

//         <p className={styles.aiDescription}>
//           AI-powered summaries of viewpoints, common ground,
//           and why people disagree.
//         </p>

//         <div className={styles.aiFeatureList}>
//           <span>Viewpoint summaries</span>
//           <span>Common ground</span>
//           <span>Disagreement analysis</span>
//         </div>

//         <button
//           type="button"
//           className={styles.aiButton}
//           onClick={onExploreAI}
//         >
//           Explore AI Pulse
//         </button>
//       </section>
//     </aside>
//   );
// }

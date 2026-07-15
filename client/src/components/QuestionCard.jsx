import { useState } from "react";
import CommentSection from "./CommentSection";
import styles from "./QuestionCard.module.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const TAG_STYLES = {
  Politics: { color: "#1E3A8A", bg: "#DBEAFE" },
  Technology: { color: "#0f6e56", bg: "#e1f5ee" },
  Education: { color: "#6d28d9", bg: "#ede9fe" },
  Sports: { color: "#b45309", bg: "#fef3c7" },
  Entertainment: { color: "#be185d", bg: "#fce7f3" },
  Business: { color: "#854f0b", bg: "#faeeda" },
  General: { color: "#0e7490", bg: "#CFFAFE" },
  Fashion: { color: "#db1699", bg: "#fce7f3" },
};

const OPINION_OPTIONS = [
  {
    value: "agree",
    label: "Agree",
    symbol: "✓",
  },
  {
    value: "disagree",
    label: "Disagree",
    symbol: "×",
  },
  {
    value: "unsure",
    label: "Unsure",
    symbol: "?",
  },
];

const opinionSummaryStyle = {
  width: "100%",
  marginTop: "12px",
  padding: "9px 12px",
  border: "1px solid var(--border-color, #dbe2ea)",
  borderRadius: "10px",
  background: "var(--surface-soft, rgba(148, 163, 184, 0.06))",
  color: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  cursor: "pointer",
  font: "inherit",
  textAlign: "left",
};

const opinionPanelStyle = {
  marginTop: "10px",
  padding: "12px",
  border: "1px solid var(--border-color, #e5e7eb)",
  borderRadius: "12px",
  background: "var(--surface-soft, rgba(148, 163, 184, 0.08))",
};

const opinionButtonsStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "8px",
};

function getOpinionButtonStyle(active) {
  return {
    border: active
      ? "1px solid var(--primary, #1E3A8A)"
      : "1px solid var(--border-color, #dbe2ea)",
    borderRadius: "9px",
    padding: "9px 8px",
    cursor: "pointer",
    font: "inherit",
    fontWeight: active ? 700 : 600,
    color: active
      ? "var(--primary, #1E3A8A)"
      : "inherit",
    background: active
      ? "rgba(30, 58, 138, 0.10)"
      : "var(--card-bg, transparent)",
  };
}

function formatCount(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function getCommentColor(name) {
  const palette = [
    "#6c63ff",
    "#22c58b",
    "#e05252",
    "#d4537e",
    "#f59e0b",
    "#8b5cf6",
    "#10b981",
    "#06B6D4",
  ];

  let hash = 0;

  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return palette[Math.abs(hash) % palette.length];
}

function formatCommentTimeAgo(isoString) {
  if (!isoString) return "Just now";

  const seconds = Math.floor(
    (Date.now() - new Date(isoString)) / 1000
  );

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;

  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function QuestionCard({
  question,
  token,
  currentUser,
  onDelete,
}) {
  const [showComments, setShowComments] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [showAiContext, setShowAiContext] = useState(false);
  const [showOpinionPoll, setShowOpinionPoll] = useState(false);

  const [likes, setLikes] = useState(question.likes);
  const [dislikes, setDislikes] = useState(question.dislikes);
  const [vote, setVote] = useState(question.userVote ?? null);
  const [comments, setComments] = useState(question.comments ?? []);

  const [opinion, setOpinion] = useState(
    question.userOpinion ?? null
  );

  const [opinionCounts, setOpinionCounts] =
    useState({
      agree: Number(question.agreeCount ?? 0),
      disagree: Number(
        question.disagreeCount ?? 0
      ),
      unsure: Number(question.unsureCount ?? 0),
    });

  const [isUpdatingOpinion, setIsUpdatingOpinion] =
    useState(false);

  const isOwner =
    currentUser && Number(question.userId) === Number(currentUser.id);

  const total = likes + dislikes;
  const likePct = total ? Math.round((likes / total) * 100) : 50;

  const totalOpinions =
    opinionCounts.agree +
    opinionCounts.disagree +
    opinionCounts.unsure;

  const leadingOpinion = OPINION_OPTIONS.reduce(
    (leader, option) =>
      opinionCounts[option.value] >
      opinionCounts[leader.value]
        ? option
        : leader,
    OPINION_OPTIONS[0]
  );

  function getOpinionPercentage(value) {
    if (totalOpinions === 0) {
      return 0;
    }

    return Math.round(
      (opinionCounts[value] / totalOpinions) *
        100
    );
  }

  const tagStyle =
    TAG_STYLES[question.tag] ?? {
      color: "#0e7490",
      bg: "#CFFAFE",
    };

  async function handleLike() {
    try {
      const res = await fetch(`${API_BASE}/questions/${question.id}/like`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to like");

      const json = await res.json();

      setLikes(json.data.likes);
      setDislikes(json.data.dislikes);
      setVote((current) => (current === "like" ? null : "like"));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDislike() {
    try {
      const res = await fetch(
        `${API_BASE}/questions/${question.id}/dislike`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to dislike");

      const json = await res.json();

      setLikes(json.data.likes);
      setDislikes(json.data.dislikes);
      setVote((current) => (current === "dislike" ? null : "dislike"));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleOpinion(value) {
    if (!token) {
      alert("Please sign in to share your opinion.");
      return;
    }

    if (isUpdatingOpinion) {
      return;
    }

    setIsUpdatingOpinion(true);

    try {
      const res = await fetch(
        `${API_BASE}/questions/${question.id}/opinion`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            opinion: value,
          }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.message ||
            "Failed to update opinion."
        );
      }

      setOpinion(json.data.userOpinion);

      setOpinionCounts({
        agree: Number(
          json.data.agreeCount ?? 0
        ),
        disagree: Number(
          json.data.disagreeCount ?? 0
        ),
        unsure: Number(
          json.data.unsureCount ?? 0
        ),
      });

      setShowOpinionPoll(false);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsUpdatingOpinion(false);
    }
  }

  async function handleAddComment(text) {
    if (!token) {
      alert("Please sign in to comment.");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/questions/${question.id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Failed to post comment.");
      }

      const updatedComments = (json.data.comments ?? []).map((comment) => {
        const name = comment.author ?? comment.name ?? "Unknown";

        return {
          ...comment,
          name,
          initials: name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2),
          avatarColor: getCommentColor(name),
          timeAgo: formatCommentTimeAgo(comment.createdAt),
        };
      });

      setComments(updatedComments);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  return (
    <article className={styles.card}>
      <div className={styles.meta}>
        <div
          className={styles.avatar}
          style={{ background: question.avatarColor }}
          aria-label={`Avatar for ${question.author}`}
        >
          {question.initials}
        </div>

        <div className={styles.authorInfo}>
          <div className={styles.authorRow}>
            <span className={styles.author}>{question.author}</span>



            <button
  type="button"
  className={`${styles.inlineVerificationBadge} ${
    question.verificationScore == null
      ? styles.inlineVerificationPending
      : ""
  }`}
  onClick={() => {
    if (question.verificationScore != null) {
      setShowVerification((current) => !current);
    }
  }}
  aria-expanded={
    question.verificationScore != null
      ? showVerification
      : undefined
  }
  title={
    question.verificationScore != null
      ? "View PulseOpinion assessment"
      : "This discussion has not been assessed yet"
  }
>
  <span className={styles.inlineVerificationCheck}>
    {question.verificationScore != null ? "✓" : "○"}
  </span>

  <span className={styles.inlineVerificationText}>
    {question.verificationScore != null
      ? "Verified by PulseOpinion"
      : "PulseOpinion"}
  </span>

  <strong>
    {question.verificationScore != null
      ? `${question.verificationScore}%`
      : "Not assessed"}
  </strong>
</button>

            {/* {question.verificationScore != null && (
              <button
                type="button"
                className={styles.inlineVerificationBadge}
                onClick={() =>
                  setShowVerification((current) => !current)
                }
                aria-expanded={showVerification}
                title="View PulseOpinion assessment"
              >
                <span className={styles.inlineVerificationCheck}>✓</span>

                <span className={styles.inlineVerificationText}>
                  Verified by PulseOpinion
                </span>

                <strong>{question.verificationScore}%</strong>
              </button>
            )} */}
          </div>

          <span className={styles.time}>{question.timeAgo}</span>
        </div>

<div className={styles.headerActions}>
  <span
    className={styles.tag}
    style={{
      color: tagStyle.color,
      background: tagStyle.bg,
    }}
  >
    {question.tag}
  </span>

  {isOwner && (
    <button
      type="button"
      className={styles.deleteBtn}
      onClick={() => onDelete(question.id)}
      aria-label="Delete question"
      title="Delete question"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
        <path d="M9 6V4h6v2" />
      </svg>
    </button>
  )}
</div>
</div>


      <p className={styles.questionText}>{question.text}</p>

      <button
        type="button"
        style={opinionSummaryStyle}
        onClick={() =>
          setShowOpinionPoll((current) => !current)
        }
        aria-expanded={showOpinionPoll}
        aria-label="View or cast opinion"
      >
        <span>
          <strong>Opinion</strong>
          <span style={{ opacity: 0.72, marginLeft: "8px" }}>
            {totalOpinions === 0
              ? "No responses yet"
              : `${getOpinionPercentage(leadingOpinion.value)}% ${leadingOpinion.label}`}
          </span>
        </span>

        <span style={{ opacity: 0.72, whiteSpace: "nowrap" }}>
          {opinion
            ? `Your vote: ${OPINION_OPTIONS.find((item) => item.value === opinion)?.label}`
            : "Cast your opinion"}
          <span aria-hidden="true" style={{ marginLeft: "8px" }}>
            {showOpinionPoll ? "⌃" : "⌄"}
          </span>
        </span>
      </button>

      {showVerification && question.verificationScore != null && (
        <div className={styles.compactVerificationDetails}>
          <div className={styles.compactVerificationTop}>
            <span>
              {question.verificationType?.replaceAll("_", " ")}
            </span>

            <strong>
              Discussion confidence · {question.verificationScore}%
            </strong>
          </div>

          <p className={styles.compactVerificationVerdict}>
            {question.verificationVerdict}
          </p>

          <p className={styles.compactVerificationExplanation}>
            {question.verificationExplanation}
          </p>

          <small>
            AI assessment of discussion relevance, support, and usefulness.
            Not a literal percentage of truth.
          </small>
        </div>
      )}

      {question.aiContext && (
        <div className={styles.aiContextSection}>
          <button
            type="button"
            className={styles.aiContextToggle}
            onClick={() => setShowAiContext((current) => !current)}
            aria-expanded={showAiContext}
          >
            <span className={styles.aiContextToggleLeft}>
              <span className={styles.aiContextSparkle}>✨</span>

              <span>
                <strong>AI Context Available</strong>
                <small>Extracted from the attached source</small>
              </span>
            </span>

            <span
              className={`${styles.aiContextChevron} ${
                showAiContext ? styles.aiContextChevronOpen : ""
              }`}
            >
              ›
            </span>
          </button>

          {showAiContext && (
            <div className={styles.aiContextContent}>
              <div className={styles.aiContextContentHeader}>
                <span>AI-extracted context</span>
                <span>{question.aiContext.length} characters</span>
              </div>

              <p>{question.aiContext}</p>
            </div>
          )}
        </div>
      )}

      <div className={styles.voteBarWrap} aria-hidden="true">
        <div
          className={styles.voteBarFill}
          style={{ "--like-pct": `${likePct}%` }}
        />
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.actionBtn} ${styles.like} ${
            vote === "like" ? styles.likeActive : ""
          }`}
          aria-label="Like"
          aria-pressed={vote === "like"}
          onClick={handleLike}
        >
          <svg
            viewBox="0 0 24 24"
            fill={vote === "like" ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
          </svg>

          {formatCount(likes)}
        </button>

        <button
          className={`${styles.actionBtn} ${styles.dislike} ${
            vote === "dislike" ? styles.dislikeActive : ""
          }`}
          aria-label="Dislike"
          aria-pressed={vote === "dislike"}
          onClick={handleDislike}
        >
          <svg
            viewBox="0 0 24 24"
            fill={vote === "dislike" ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
            <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
          </svg>

          {formatCount(dislikes)}
        </button>

        <div className={styles.divider} aria-hidden="true" />

        <button
          className={`${styles.actionBtn} ${styles.comment}`}
          onClick={() => setShowComments((v) => !v)}
          aria-expanded={showComments}
          aria-label="Toggle comments"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>

          {formatCount(comments.length)} comments

          <svg
            className={`${styles.chevron} ${
              showComments ? styles.chevronOpen : ""
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {showOpinionPoll && (
        <section
          style={opinionPanelStyle}
          aria-label="Opinion poll"
        >
          <div style={opinionButtonsStyle}>
            {OPINION_OPTIONS.map((option) => {
              const active = opinion === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  style={getOpinionButtonStyle(active)}
                  disabled={isUpdatingOpinion}
                  aria-pressed={active}
                  onClick={() => handleOpinion(option.value)}
                >
                  <span aria-hidden="true">{option.symbol}</span>{" "}
                  {option.label}
                  <br />
                  <small>
                    {getOpinionPercentage(option.value)}%
                  </small>
                </button>
              );
            })}
          </div>

          <small
            style={{
              display: "block",
              marginTop: "8px",
              opacity: 0.68,
            }}
          >
            {totalOpinions} {totalOpinions === 1 ? "participant" : "participants"}
          </small>
        </section>
      )}

      {showComments && (
        <CommentSection
          comments={comments}
          onAddComment={handleAddComment}
        />
      )}
    </article>
  );
}

// import { useState } from "react";
// import CommentSection from "./CommentSection";
// import styles from "./QuestionCard.module.css";

// const API_BASE = import.meta.env.VITE_API_BASE_URL;

// const TAG_STYLES = {
//   Politics: { color: "#1E3A8A", bg: "#DBEAFE" },
//   Technology: { color: "#0f6e56", bg: "#e1f5ee" },
//   Education: { color: "#6d28d9", bg: "#ede9fe" },
//   Sports: { color: "#b45309", bg: "#fef3c7" },
//   Entertainment: { color: "#be185d", bg: "#fce7f3" },
//   Business: { color: "#854f0b", bg: "#faeeda" },
//   General: { color: "#0e7490", bg: "#CFFAFE" },
//   Fashion: { color: "#db1699", bg: "#fce7f3" },
// };

// const OPINION_OPTIONS = [
//   {
//     value: "agree",
//     label: "Agree",
//     symbol: "✓",
//   },
//   {
//     value: "disagree",
//     label: "Disagree",
//     symbol: "×",
//   },
//   {
//     value: "unsure",
//     label: "Unsure",
//     symbol: "?",
//   },
// ];

// const opinionSectionStyle = {
//   marginTop: "16px",
//   padding: "14px",
//   border: "1px solid var(--border-color, #e5e7eb)",
//   borderRadius: "14px",
//   background: "var(--surface-soft, rgba(148, 163, 184, 0.08))",
// };

// const opinionButtonsStyle = {
//   display: "grid",
//   gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
//   gap: "8px",
//   marginTop: "10px",
// };

// function getOpinionButtonStyle(active) {
//   return {
//     border: active
//       ? "1px solid var(--primary, #1E3A8A)"
//       : "1px solid var(--border-color, #dbe2ea)",
//     borderRadius: "10px",
//     padding: "10px 8px",
//     cursor: "pointer",
//     font: "inherit",
//     fontWeight: active ? 700 : 600,
//     color: active
//       ? "var(--primary, #1E3A8A)"
//       : "inherit",
//     background: active
//       ? "rgba(30, 58, 138, 0.10)"
//       : "var(--card-bg, transparent)",
//   };
// }

// function formatCount(n) {
//   if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
//   return String(n);
// }

// function getCommentColor(name) {
//   const palette = [
//     "#6c63ff",
//     "#22c58b",
//     "#e05252",
//     "#d4537e",
//     "#f59e0b",
//     "#8b5cf6",
//     "#10b981",
//     "#06B6D4",
//   ];

//   let hash = 0;

//   for (let i = 0; i < name.length; i += 1) {
//     hash = name.charCodeAt(i) + ((hash << 5) - hash);
//   }

//   return palette[Math.abs(hash) % palette.length];
// }

// function formatCommentTimeAgo(isoString) {
//   if (!isoString) return "Just now";

//   const seconds = Math.floor(
//     (Date.now() - new Date(isoString)) / 1000
//   );

//   if (seconds < 60) return "Just now";
//   if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
//   if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;

//   return `${Math.floor(seconds / 86400)}d ago`;
// }

// export default function QuestionCard({
//   question,
//   token,
//   currentUser,
//   onDelete,
// }) {
//   const [showComments, setShowComments] = useState(false);
//   const [showVerification, setShowVerification] = useState(false);
//   const [showAiContext, setShowAiContext] = useState(false);

//   const [likes, setLikes] = useState(question.likes);
//   const [dislikes, setDislikes] = useState(question.dislikes);
//   const [vote, setVote] = useState(question.userVote ?? null);
//   const [comments, setComments] = useState(question.comments ?? []);

//   const [opinion, setOpinion] = useState(
//     question.userOpinion ?? null
//   );

//   const [opinionCounts, setOpinionCounts] =
//     useState({
//       agree: Number(question.agreeCount ?? 0),
//       disagree: Number(
//         question.disagreeCount ?? 0
//       ),
//       unsure: Number(question.unsureCount ?? 0),
//     });

//   const [isUpdatingOpinion, setIsUpdatingOpinion] =
//     useState(false);

//   const isOwner =
//     currentUser && Number(question.userId) === Number(currentUser.id);

//   const total = likes + dislikes;
//   const likePct = total ? Math.round((likes / total) * 100) : 50;

//   const totalOpinions =
//     opinionCounts.agree +
//     opinionCounts.disagree +
//     opinionCounts.unsure;

//   function getOpinionPercentage(value) {
//     if (totalOpinions === 0) {
//       return 0;
//     }

//     return Math.round(
//       (opinionCounts[value] / totalOpinions) *
//         100
//     );
//   }

//   const tagStyle =
//     TAG_STYLES[question.tag] ?? {
//       color: "#0e7490",
//       bg: "#CFFAFE",
//     };

//   async function handleLike() {
//     try {
//       const res = await fetch(`${API_BASE}/questions/${question.id}/like`, {
//         method: "PATCH",
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!res.ok) throw new Error("Failed to like");

//       const json = await res.json();

//       setLikes(json.data.likes);
//       setDislikes(json.data.dislikes);
//       setVote((current) => (current === "like" ? null : "like"));
//     } catch (err) {
//       console.error(err);
//     }
//   }

//   async function handleDislike() {
//     try {
//       const res = await fetch(
//         `${API_BASE}/questions/${question.id}/dislike`,
//         {
//           method: "PATCH",
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       if (!res.ok) throw new Error("Failed to dislike");

//       const json = await res.json();

//       setLikes(json.data.likes);
//       setDislikes(json.data.dislikes);
//       setVote((current) => (current === "dislike" ? null : "dislike"));
//     } catch (err) {
//       console.error(err);
//     }
//   }

//   async function handleOpinion(value) {
//     if (!token) {
//       alert("Please sign in to share your opinion.");
//       return;
//     }

//     if (isUpdatingOpinion) {
//       return;
//     }

//     setIsUpdatingOpinion(true);

//     try {
//       const res = await fetch(
//         `${API_BASE}/questions/${question.id}/opinion`,
//         {
//           method: "PATCH",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({
//             opinion: value,
//           }),
//         }
//       );

//       const json = await res.json();

//       if (!res.ok) {
//         throw new Error(
//           json.message ||
//             "Failed to update opinion."
//         );
//       }

//       setOpinion(json.data.userOpinion);

//       setOpinionCounts({
//         agree: Number(
//           json.data.agreeCount ?? 0
//         ),
//         disagree: Number(
//           json.data.disagreeCount ?? 0
//         ),
//         unsure: Number(
//           json.data.unsureCount ?? 0
//         ),
//       });
//     } catch (err) {
//       console.error(err);
//       alert(err.message);
//     } finally {
//       setIsUpdatingOpinion(false);
//     }
//   }

//   async function handleAddComment(text) {
//     if (!token) {
//       alert("Please sign in to comment.");
//       return;
//     }

//     try {
//       const res = await fetch(
//         `${API_BASE}/questions/${question.id}/comments`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({ text }),
//         }
//       );

//       const json = await res.json();

//       if (!res.ok) {
//         throw new Error(json.message || "Failed to post comment.");
//       }

//       const updatedComments = (json.data.comments ?? []).map((comment) => {
//         const name = comment.author ?? comment.name ?? "Unknown";

//         return {
//           ...comment,
//           name,
//           initials: name
//             .split(" ")
//             .map((word) => word[0])
//             .join("")
//             .toUpperCase()
//             .slice(0, 2),
//           avatarColor: getCommentColor(name),
//           timeAgo: formatCommentTimeAgo(comment.createdAt),
//         };
//       });

//       setComments(updatedComments);
//     } catch (err) {
//       console.error(err);
//       alert(err.message);
//     }
//   }

//   return (
//     <article className={styles.card}>
//       <div className={styles.meta}>
//         <div
//           className={styles.avatar}
//           style={{ background: question.avatarColor }}
//           aria-label={`Avatar for ${question.author}`}
//         >
//           {question.initials}
//         </div>

//         <div className={styles.authorInfo}>
//           <div className={styles.authorRow}>
//             <span className={styles.author}>{question.author}</span>



//             <button
//   type="button"
//   className={`${styles.inlineVerificationBadge} ${
//     question.verificationScore == null
//       ? styles.inlineVerificationPending
//       : ""
//   }`}
//   onClick={() => {
//     if (question.verificationScore != null) {
//       setShowVerification((current) => !current);
//     }
//   }}
//   aria-expanded={
//     question.verificationScore != null
//       ? showVerification
//       : undefined
//   }
//   title={
//     question.verificationScore != null
//       ? "View PulseOpinion assessment"
//       : "This discussion has not been assessed yet"
//   }
// >
//   <span className={styles.inlineVerificationCheck}>
//     {question.verificationScore != null ? "✓" : "○"}
//   </span>

//   <span className={styles.inlineVerificationText}>
//     {question.verificationScore != null
//       ? "Verified by PulseOpinion"
//       : "PulseOpinion"}
//   </span>

//   <strong>
//     {question.verificationScore != null
//       ? `${question.verificationScore}%`
//       : "Not assessed"}
//   </strong>
// </button>

//             {/* {question.verificationScore != null && (
//               <button
//                 type="button"
//                 className={styles.inlineVerificationBadge}
//                 onClick={() =>
//                   setShowVerification((current) => !current)
//                 }
//                 aria-expanded={showVerification}
//                 title="View PulseOpinion assessment"
//               >
//                 <span className={styles.inlineVerificationCheck}>✓</span>

//                 <span className={styles.inlineVerificationText}>
//                   Verified by PulseOpinion
//                 </span>

//                 <strong>{question.verificationScore}%</strong>
//               </button>
//             )} */}
//           </div>

//           <span className={styles.time}>{question.timeAgo}</span>
//         </div>

// <div className={styles.headerActions}>
//   <span
//     className={styles.tag}
//     style={{
//       color: tagStyle.color,
//       background: tagStyle.bg,
//     }}
//   >
//     {question.tag}
//   </span>

//   {isOwner && (
//     <button
//       type="button"
//       className={styles.deleteBtn}
//       onClick={() => onDelete(question.id)}
//       aria-label="Delete question"
//       title="Delete question"
//     >
//       <svg
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="2"
//         strokeLinecap="round"
//         strokeLinejoin="round"
//         aria-hidden="true"
//       >
//         <polyline points="3 6 5 6 21 6" />
//         <path d="M19 6l-1 14H6L5 6" />
//         <path d="M10 11v6" />
//         <path d="M14 11v6" />
//         <path d="M9 6V4h6v2" />
//       </svg>
//     </button>
//   )}
// </div>
// </div>


//       <p className={styles.questionText}>{question.text}</p>

//       <section
//         style={opinionSectionStyle}
//         aria-label="Opinion poll"
//       >
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             gap: "12px",
//             alignItems: "baseline",
//           }}
//         >
//           <strong>What’s your opinion?</strong>

//           <small>
//             {totalOpinions}{" "}
//             {totalOpinions === 1
//               ? "participant"
//               : "participants"}
//           </small>
//         </div>

//         <div style={opinionButtonsStyle}>
//           {OPINION_OPTIONS.map((option) => {
//             const active =
//               opinion === option.value;

//             return (
//               <button
//                 key={option.value}
//                 type="button"
//                 style={getOpinionButtonStyle(
//                   active
//                 )}
//                 disabled={isUpdatingOpinion}
//                 aria-pressed={active}
//                 onClick={() =>
//                   handleOpinion(option.value)
//                 }
//               >
//                 <span aria-hidden="true">
//                   {option.symbol}
//                 </span>{" "}
//                 {option.label}
//                 <br />
//                 <small>
//                   {getOpinionPercentage(
//                     option.value
//                   )}
//                   %
//                 </small>
//               </button>
//             );
//           })}
//         </div>

//         {opinion && (
//           <small
//             style={{
//               display: "block",
//               marginTop: "9px",
//               opacity: 0.75,
//             }}
//           >
//             Tap your selected option again to remove
//             your response.
//           </small>
//         )}
//       </section>

//       {showVerification && question.verificationScore != null && (
//         <div className={styles.compactVerificationDetails}>
//           <div className={styles.compactVerificationTop}>
//             <span>
//               {question.verificationType?.replaceAll("_", " ")}
//             </span>

//             <strong>
//               Discussion confidence · {question.verificationScore}%
//             </strong>
//           </div>

//           <p className={styles.compactVerificationVerdict}>
//             {question.verificationVerdict}
//           </p>

//           <p className={styles.compactVerificationExplanation}>
//             {question.verificationExplanation}
//           </p>

//           <small>
//             AI assessment of discussion relevance, support, and usefulness.
//             Not a literal percentage of truth.
//           </small>
//         </div>
//       )}

//       {question.aiContext && (
//         <div className={styles.aiContextSection}>
//           <button
//             type="button"
//             className={styles.aiContextToggle}
//             onClick={() => setShowAiContext((current) => !current)}
//             aria-expanded={showAiContext}
//           >
//             <span className={styles.aiContextToggleLeft}>
//               <span className={styles.aiContextSparkle}>✨</span>

//               <span>
//                 <strong>AI Context Available</strong>
//                 <small>Extracted from the attached source</small>
//               </span>
//             </span>

//             <span
//               className={`${styles.aiContextChevron} ${
//                 showAiContext ? styles.aiContextChevronOpen : ""
//               }`}
//             >
//               ›
//             </span>
//           </button>

//           {showAiContext && (
//             <div className={styles.aiContextContent}>
//               <div className={styles.aiContextContentHeader}>
//                 <span>AI-extracted context</span>
//                 <span>{question.aiContext.length} characters</span>
//               </div>

//               <p>{question.aiContext}</p>
//             </div>
//           )}
//         </div>
//       )}

//       <div className={styles.voteBarWrap} aria-hidden="true">
//         <div
//           className={styles.voteBarFill}
//           style={{ "--like-pct": `${likePct}%` }}
//         />
//       </div>

//       <div className={styles.actions}>
//         <button
//           className={`${styles.actionBtn} ${styles.like} ${
//             vote === "like" ? styles.likeActive : ""
//           }`}
//           aria-label="Like"
//           aria-pressed={vote === "like"}
//           onClick={handleLike}
//         >
//           <svg
//             viewBox="0 0 24 24"
//             fill={vote === "like" ? "currentColor" : "none"}
//             stroke="currentColor"
//             strokeWidth="2"
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             aria-hidden="true"
//           >
//             <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
//             <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
//           </svg>

//           {formatCount(likes)}
//         </button>

//         <button
//           className={`${styles.actionBtn} ${styles.dislike} ${
//             vote === "dislike" ? styles.dislikeActive : ""
//           }`}
//           aria-label="Dislike"
//           aria-pressed={vote === "dislike"}
//           onClick={handleDislike}
//         >
//           <svg
//             viewBox="0 0 24 24"
//             fill={vote === "dislike" ? "currentColor" : "none"}
//             stroke="currentColor"
//             strokeWidth="2"
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             aria-hidden="true"
//           >
//             <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
//             <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
//           </svg>

//           {formatCount(dislikes)}
//         </button>

//         <div className={styles.divider} aria-hidden="true" />

//         <button
//           className={`${styles.actionBtn} ${styles.comment}`}
//           onClick={() => setShowComments((v) => !v)}
//           aria-expanded={showComments}
//           aria-label="Toggle comments"
//         >
//           <svg
//             viewBox="0 0 24 24"
//             fill="none"
//             stroke="currentColor"
//             strokeWidth="2"
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             aria-hidden="true"
//           >
//             <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
//           </svg>

//           {formatCount(comments.length)} comments

//           <svg
//             className={`${styles.chevron} ${
//               showComments ? styles.chevronOpen : ""
//             }`}
//             viewBox="0 0 24 24"
//             fill="none"
//             stroke="currentColor"
//             strokeWidth="2.5"
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             aria-hidden="true"
//           >
//             <polyline points="6 9 12 15 18 9" />
//           </svg>
//         </button>
//       </div>

//       {showComments && (
//         <CommentSection
//           comments={comments}
//           onAddComment={handleAddComment}
//         />
//       )}
//     </article>
//   );
// }
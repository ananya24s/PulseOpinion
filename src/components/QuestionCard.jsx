import { useState } from 'react';
import CommentSection from './CommentSection';
import styles from './QuestionCard.module.css';

const TAG_STYLES = {
  Politics:   { color: '#534ab7', bg: '#eeedfe' },
  Technology: { color: '#0f6e56', bg: '#e1f5ee' },
  Economy:    { color: '#854f0b', bg: '#faeeda' },
  Society:    { color: '#993556', bg: '#fbeaf0' },
};

function formatCount(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

export default function QuestionCard({ question }) {
  const [showComments, setShowComments] = useState(false);

  const { likes, dislikes } = question;
  const total = likes + dislikes;
  const likePct = total ? Math.round((likes / total) * 100) : 50;

  const tagStyle = TAG_STYLES[question.tag] ?? { color: '#5c5f7a', bg: '#f0f1f8' };

  return (
    <article className={styles.card}>
      {/* Meta row */}
      <div className={styles.meta}>
        <div
          className={styles.avatar}
          style={{ background: question.avatarColor }}
          aria-label={`Avatar for ${question.author}`}
        >
          {question.initials}
        </div>
        <div className={styles.authorInfo}>
          <span className={styles.author}>{question.author}</span>
          <span className={styles.time}>{question.timeAgo}</span>
        </div>
        <span
          className={styles.tag}
          style={{ color: tagStyle.color, background: tagStyle.bg }}
        >
          {question.tag}
        </span>
      </div>

      {/* Question text */}
      <p className={styles.questionText}>{question.text}</p>

      {/* Vote sentiment bar */}
      <div className={styles.voteBarWrap} aria-hidden="true">
        <div
          className={styles.voteBarFill}
          style={{ '--like-pct': `${likePct}%` }}
        />
      </div>

      {/* Action buttons */}
      <div className={styles.actions}>
        <button className={`${styles.actionBtn} ${styles.like}`} aria-label="Like">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
          </svg>
          {formatCount(likes)}
        </button>

        <button className={`${styles.actionBtn} ${styles.dislike}`} aria-label="Dislike">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
            <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {formatCount(question.commentCount)} comments
          <svg
            className={`${styles.chevron} ${showComments ? styles.chevronOpen : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>

      {/* Comments panel */}
      {showComments && (
        <CommentSection comments={question.comments} />
      )}
    </article>
  );
}

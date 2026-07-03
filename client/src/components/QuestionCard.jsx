import { useState } from 'react';
import CommentSection from './CommentSection';
import styles from './QuestionCard.module.css';
const TAG_STYLES = {
  Politics:      { color: '#1E3A8A', bg: '#DBEAFE' },
  Technology:    { color: '#0f6e56', bg: '#e1f5ee' },
  Education:     { color: '#6d28d9', bg: '#ede9fe' },
  Sports:        { color: '#b45309', bg: '#fef3c7' },
  Entertainment: { color: '#be185d', bg: '#fce7f3' },
  Business:      { color: '#854f0b', bg: '#faeeda' },
  General:       { color: '#0e7490', bg: '#CFFAFE' },
  Fashion:       { color: '#db1699', bg: '#fce7f3' },
};

function formatCount(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

export default function QuestionCard({ question, token, currentUser, onDelete }) {
  const [showComments, setShowComments] = useState(false);

  // likes / dislikes counts — initialized from the question prop
  const [likes, setLikes] = useState(question.likes);
  const [dislikes, setDislikes] = useState(question.dislikes);
  const [vote, setVote] = useState(question.userVote ?? null);
  const isOwner = currentUser && Number(question.userId) === Number(currentUser.id);
  const [comments, setComments] = useState(question.comments);
  const total = likes + dislikes;
  const likePct = total ? Math.round((likes / total) * 100) : 50;
  const tagStyle = TAG_STYLES[question.tag] ?? { color: '#0e7490', bg: '#CFFAFE' };

async function handleLike() {
  try {
    const res = await fetch(
      `http://localhost:5000/api/questions/${question.id}/like`,
      { method: 'PATCH',headers: {  Authorization: `Bearer ${token}`,}, }
   );

    if (!res.ok) throw new Error('Failed to like');

    const json = await res.json();
    setLikes(json.data.likes);
    setDislikes(json.data.dislikes);
    setVote((current) => current === 'like' ? null : 'like');
   } catch (err) {
    console.error(err);
   }
  }

  // --- DISLIKE BUTTON LOGIC ---
  // Mirror of like logic, but for dislikes
  async function handleDislike() {
  try {
    const res = await fetch(
      `http://localhost:5000/api/questions/${question.id}/dislike`,
      { method: 'PATCH',headers: {  Authorization: `Bearer ${token}`,}, }
    );

    if (!res.ok) throw new Error('Failed to dislike');

    const json = await res.json();
    setLikes(json.data.likes);
    setDislikes(json.data.dislikes);
    setVote((current) => current === 'dislike' ? null : 'dislike');
   } catch (err) {
    console.error(err);
   }
  }

  function handleAddComment(text) {
    const newComment = {
      id: Date.now(),
      name: 'You',
      initials: 'YU',
      avatarColor: '#06B6D4',
      timeAgo: 'Just now',
      text,
    };
    setComments([newComment, ...comments]);
  }

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
      {isOwner && (
      <button type="button" className={styles.deleteBtn} onClick={() => onDelete(question.id)}
     aria-label="Delete question"
     title="Delete question">
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
      {/* Question text */}
      <p className={styles.questionText}>{question.text}</p>

      {/* Vote bar — updates live as likes/dislikes change */}
      <div className={styles.voteBarWrap} aria-hidden="true">
        <div
          className={styles.voteBarFill}
          style={{ '--like-pct': `${likePct}%` }}
        />
      </div>

      {/* Action buttons */}
      <div className={styles.actions}>
        {/* Like button — gets "active" class when user has liked */}
        <button
          className={`${styles.actionBtn} ${styles.like} ${vote === 'like' ? styles.likeActive : ''}`}
          aria-label="Like"
          aria-pressed={vote === 'like'}
          onClick={handleLike}
        >
          <svg viewBox="0 0 24 24"
            fill={vote === 'like' ? 'currentColor' : 'none'}
            stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
          </svg>
          {formatCount(likes)}
        </button>

        {/* Dislike button — gets "active" class when user has disliked */}
        <button
          className={`${styles.actionBtn} ${styles.dislike} ${vote === 'dislike' ? styles.dislikeActive : ''}`}
          aria-label="Dislike"
          aria-pressed={vote === 'dislike'}
          onClick={handleDislike}
        >
          <svg viewBox="0 0 24 24"
            fill={vote === 'dislike' ? 'currentColor' : 'none'}
            stroke="currentColor" strokeWidth="2"
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
          {formatCount(comments.length)} comments
          <svg
            className={`${styles.chevron} ${showComments ? styles.chevronOpen : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>

      {showComments && (
        <CommentSection
          comments={comments}
          onAddComment={handleAddComment}
        />
      )}
    </article>
  );
}

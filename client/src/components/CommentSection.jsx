import { useState } from 'react'; // useState to track what the user types
import styles from './CommentSection.module.css';
function Comment({ comment }) {
  return (
    <div className={styles.comment}>
      <div
        className={styles.avatar}
        style={{ background: comment.avatarColor }}
        aria-hidden="true"
      >
        {comment.initials}
      </div>
      <div className={styles.body}>
        <div className={styles.header}>
          <span className={styles.name}>{comment.name}</span>
          <span className={styles.time}>{comment.timeAgo}</span>
        </div>
        <p className={styles.text}>{comment.text}</p>
      </div>
    </div>
  );
}
export default function CommentSection({ comments, onAddComment }) {
  const [inputText, setInputText] = useState('');

  function handlePost() {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onAddComment(trimmed);
    setInputText('');
  }
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // prevent newline in input
      handlePost();
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>
        Discussion
        {/* Show a live count of comments */}
        <span className={styles.commentCount}>{comments.length}</span>
      </div>

      {/* If there are no comments yet, show an empty state message */}
      {comments.length === 0 ? (
        <p className={styles.emptyState}>No comments yet. Be the first to share your perspective.</p>
      ) : (
        <div className={styles.list}>
          {comments.map((c) => (
            <Comment key={c.id} comment={c} />
          ))}
        </div>
      )}

      <div className={styles.inputRow}>
        <div className={styles.youAvatar} aria-hidden="true">YU</div>
        <input
          className={styles.input}
          type="text"
          placeholder="Add your perspective…"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {/* Disabled when input is empty */}
        <button
          className={styles.postBtn}
          onClick={handlePost}
          disabled={!inputText.trim()}
        >
          Post
        </button>
      </div>
    </div>
  );
}
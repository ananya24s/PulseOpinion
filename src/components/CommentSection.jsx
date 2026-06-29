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

export default function CommentSection({ comments }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>Discussion</div>

      <div className={styles.list}>
        {comments.map((c) => (
          <Comment key={c.id} comment={c} />
        ))}
      </div>

      <div className={styles.inputRow}>
        <div className={styles.youAvatar} aria-hidden="true">U</div>
        <input
          className={styles.input}
          type="text"
          placeholder="Add your perspective…"
        />
        <button className={styles.postBtn}>Post</button>
      </div>
    </div>
  );
}

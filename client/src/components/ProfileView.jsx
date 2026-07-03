import styles from './ProfileView.module.css';

export default function ProfileView({ user, questions, onBack }) {
  const myQuestions = questions.filter((q) => q.userId === user.id);

  const totalLikes = myQuestions.reduce(
    (sum, q) => sum + Number(q.likes || 0),
    0
  );

  const totalDislikes = myQuestions.reduce(
    (sum, q) => sum + Number(q.dislikes || 0),
    0
  );

  const totalComments = myQuestions.reduce(
    (sum, q) => sum + (q.comments?.length || 0),
    0
  );

  return (
    <section className={styles.profile}>
      <button className={styles.backBtn} onClick={onBack}>
        ← Back to discussions
      </button>

      <div className={styles.profileCard}>
        <div className={styles.avatar}>
          {user.name.charAt(0).toUpperCase()}
        </div>

        <div>
          <h1>{user.name}</h1>
          <p>{user.email}</p>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <strong>{myQuestions.length}</strong>
          <span>Questions</span>
        </div>

        <div className={styles.statCard}>
          <strong>{totalLikes}</strong>
          <span>Likes Received</span>
        </div>

        <div className={styles.statCard}>
          <strong>{totalDislikes}</strong>
          <span>Dislikes Received</span>
        </div>

        <div className={styles.statCard}>
          <strong>{totalComments}</strong>
          <span>Comments Received</span>
        </div>
      </div>

      <div className={styles.infoCard}>
        <h2>Account Information</h2>

        <div className={styles.infoRow}>
          <span>Name</span>
          <strong>{user.name}</strong>
        </div>

        <div className={styles.infoRow}>
          <span>Email</span>
          <strong>{user.email}</strong>
        </div>
      </div>
    </section>
  );
}
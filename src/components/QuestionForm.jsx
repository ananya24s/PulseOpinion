import styles from './QuestionForm.module.css';

export default function QuestionForm() {
  return (
    <div className={styles.card}>
      <label className={styles.label} htmlFor="question-input">
        Ask a question
      </label>
      <textarea
        id="question-input"
        className={styles.textarea}
        placeholder="e.g. Will renewable energy replace fossil fuels by 2040?"
        rows={3}
      />
      <div className={styles.footer}>
        <span className={styles.hint}>
          Be specific. Good questions get better answers.
        </span>
        <button className={styles.submitBtn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
          Ask Question
        </button>
      </div>
    </div>
  );
}

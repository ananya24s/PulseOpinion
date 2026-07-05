import { useState } from 'react';
import styles from './QuestionForm.module.css';
export const CATEGORIES = [
  'General',
  'Politics',
  'Technology',
  'Education',
  'Sports',
  'Entertainment',
  'Business',
];

const MAX_CHARS = 250;

export default function QuestionForm({ onSubmit }) {
  const [text, setText] = useState('');

  const [category, setCategory] = useState('General');

  const [error, setError] = useState('');

  const charCount = text.length;

  const isInvalid = charCount < 10 || charCount > MAX_CHARS;

  function handleSubmit() {
    const trimmed = text.trim();

    if (trimmed.length < 10) {
      setError('Please enter a question (at least 10 characters).');
      return;
    }
    if (trimmed.length > MAX_CHARS) {
      setError(`Question must be under ${MAX_CHARS} characters.`);
      return;
    }

    onSubmit(trimmed, category);

    setText('');
    setCategory('General');
    setError('');
  }

  return (
    <div className={styles.card}>
      <label className={styles.label} htmlFor="question-input">
        Ask a question
      </label>

      <textarea
        id="question-input"
        className={`${styles.textarea} ${error ? styles.textareaError : ''} ${charCount > MAX_CHARS ? styles.textareaError : ''}`}
        placeholder="e.g. Will renewable energy replace fossil fuels by 2040?"
        rows={3}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (error) setError('');
        }}
      />

      {/* Character counter — turns red when over the limit */}
      <div className={styles.charRow}>
        <span className={charCount > MAX_CHARS ? styles.charCountOver : styles.charCount}>
          {charCount} / {MAX_CHARS}
        </span>
      </div>

      {error && <p className={styles.errorMsg}>{error}</p>}

      <div className={styles.footer}>
        {/* Category dropdown — onChange updates the `category` state */}
        <select
          className={styles.categorySelect}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Select category"
        >
          {/* Map over the CATEGORIES array to generate each <option> */}
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* disabled={isInvalid} greys out the button when input is bad */}
        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={isInvalid}
        >
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
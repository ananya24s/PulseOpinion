import { useState } from 'react';
import styles from './QuestionForm.module.css';

// All available categories — single source of truth.
// We export this so App.jsx can also use it for the category dropdown in search.
export const CATEGORIES = [
  'General',
  'Politics',
  'Technology',
  'Education',
  'Sports',
  'Entertainment',
  'Business',
];

// Character limit for questions
const MAX_CHARS = 250;

export default function QuestionForm({ onSubmit }) {
  // Tracks what the user is typing
  const [text, setText] = useState('');

  // Tracks the selected category from the dropdown
  const [category, setCategory] = useState('General');

  // Validation error message
  const [error, setError] = useState('');

  // How many characters the user has typed so far
  const charCount = text.length;

  // True when the text is too short OR exceeds the limit
  // We use this to disable the button
  const isInvalid = charCount < 10 || charCount > MAX_CHARS;

  function handleSubmit() {
    const trimmed = text.trim();

    // Extra safety check (button should already be disabled, but just in case)
    if (trimmed.length < 10) {
      setError('Please enter a question (at least 10 characters).');
      return;
    }
    if (trimmed.length > MAX_CHARS) {
      setError(`Question must be under ${MAX_CHARS} characters.`);
      return;
    }

    // Pass both text AND selected category up to App.jsx
    onSubmit(trimmed, category);

    // Reset form fields
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
//old code v2
// import { useState } from 'react';  // useState lets us track what the user typed
// import styles from './QuestionForm.module.css';

// // onSubmit is a function passed in from App.jsx.
// // When the user clicks "Ask Question", we call it with the typed text.
// export default function QuestionForm({ onSubmit }) {
//   // `text` stores what the user is typing in the textarea.
//   // `setText` is how we update it.
//   const [text, setText] = useState('');

//   // `error` stores a validation message. Empty string = no error.
//   const [error, setError] = useState('');

//   function handleSubmit() {
//     // Trim removes extra spaces from both ends of the string.
//     const trimmed = text.trim();

//     // Validation: don't allow empty or very short questions.
//     if (trimmed.length < 10) {
//       setError('Please enter a question (at least 10 characters).');
//       return; // stop here — don't submit
//     }

//     // All good — call the parent function with the question text.
//     onSubmit(trimmed);

//     // Reset the textarea and clear any error message.
//     setText('');
//     setError('');
//   }

//   return (
//     <div className={styles.card}>
//       <label className={styles.label} htmlFor="question-input">
//         Ask a question
//       </label>

//       {/* value={text} makes this a "controlled" input — React controls its value.
//           onChange fires every time the user types, keeping `text` in sync. */}
//       <textarea
//         id="question-input"
//         className={`${styles.textarea} ${error ? styles.textareaError : ''}`}
//         placeholder="e.g. Will renewable energy replace fossil fuels by 2040?"
//         rows={3}
//         value={text}
//         onChange={(e) => {
//           setText(e.target.value);
//           // Clear error as soon as the user starts typing again
//           if (error) setError('');
//         }}
//       />

//       {/* Only show the error message when there is one */}
//       {error && <p className={styles.errorMsg}>{error}</p>}

//       <div className={styles.footer}>
//         <span className={styles.hint}>
//           Be specific. Good questions get better answers.
//         </span>
//         <button className={styles.submitBtn} onClick={handleSubmit}>
//           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
//             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
//             <line x1="22" y1="2" x2="11" y2="13" />
//             <polygon points="22 2 15 22 11 13 2 9 22 2" />
//           </svg>
//           Ask Question
//         </button>
//       </div>
//     </div>
//   );
// }
// import styles from './QuestionForm.module.css';

// export default function QuestionForm() {
//   return (
//     <div className={styles.card}>
//       <label className={styles.label} htmlFor="question-input">
//         Ask a question
//       </label>
//       <textarea
//         id="question-input"
//         className={styles.textarea}
//         placeholder="e.g. Will renewable energy replace fossil fuels by 2040?"
//         rows={3}
//       />
//       <div className={styles.footer}>
//         <span className={styles.hint}>
//           Be specific. Good questions get better answers.
//         </span>
//         <button className={styles.submitBtn}>
//           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
//             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
//             <line x1="22" y1="2" x2="11" y2="13" />
//             <polygon points="22 2 15 22 11 13 2 9 22 2" />
//           </svg>
//           Ask Question
//         </button>
//       </div>
//     </div>
//   );
// }

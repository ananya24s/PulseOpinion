import { useState } from 'react'; // useState to track what the user types
import styles from './CommentSection.module.css';

// Renders a single comment row
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

// onAddComment is passed in from QuestionCard.
// When the user posts, we call it with the comment text.
export default function CommentSection({ comments, onAddComment }) {
  // Tracks what the user is typing in the comment input
  const [inputText, setInputText] = useState('');

  function handlePost() {
    const trimmed = inputText.trim();

    // Don't post empty comments
    if (!trimmed) return;

    // Tell the parent (QuestionCard) to add this comment
    onAddComment(trimmed);

    // Clear the input after posting
    setInputText('');
  }

  // Allow posting by pressing Enter (without Shift)
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
//old code v2
// import styles from "./CommentSection.module.css";

// export default function CommentSection(props) {
//   return (
//     <div className={styles.wrapper}>
//       <div className={styles.label}>Discussion</div>

//       <div className={styles.list}>
//         {props.comments.map((comment) => (
//           <div key={comment.id} className={styles.comment}>
//             <div
//               className={styles.avatar}
//               style={{ background: comment.avatarColor }}
//             >
//               {comment.initials}
//             </div>

//             <div className={styles.body}>
//                <div className={styles.header}>
//                 <span className={styles.name}>{comment.name}</span>
//                 <span className={styles.time}>{comment.timeAgo}</span>
//               </div> 

//               <p className={styles.text}>{comment.text}</p>
//             </div>
//           </div>
//         ))}
//       </div>

//       <div className={styles.inputRow}>
//         <div className={styles.youAvatar}>UU</div>

//         <input
//           className={styles.input}
//           type="text"
//           placeholder="Add your thoughts..."
//         />

//         <button className={styles.postBtn}>Post</button>
//       </div>
//     </div>
//   );
// }

//A BIT MORE COMPLEX VERSION OF THE SAME COMPONENT, USING A CHILD COMPONENT FOR COMMENTS.

// import styles from './CommentSection.module.css';

// function Comment({ comment }) {
//   return (
//     <div className={styles.comment}>
//       <div
//         className={styles.avatar}
//         style={{ background: comment.avatarColor }}
//         aria-hidden="true"
//       >
//         {comment.initials}
//       </div>
//       <div className={styles.body}>
//         <div className={styles.header}>
//           <span className={styles.name}>{comment.name}</span>
//           <span className={styles.date}>{comment.date}</span> 
//         </div>
//         <p className={styles.text}>{comment.text}</p>
//       </div>
//     </div>
//   );
// }

// export default function CommentSection({ comments }) {
//   return (
//     <div className={styles.wrapper}>
//       <div className={styles.label}>Discussion</div>

//       <div className={styles.list}>
//         {comments.map((c) => (
//           <Comment key={c.id} comment={c} />
//         ))}
//       </div>

//       <div className={styles.inputRow}>
//         <div className={styles.youAvatar} aria-hidden="true">UU</div>
//         <input
//           className={styles.input}
//           type="text"
//           placeholder="Add your perspective…"
//         />
//         <button className={styles.postBtn}>Post</button>
//       </div>
//     </div>
//   );
// }

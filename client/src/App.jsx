// Backend-connected PulseOpinion application

import { useEffect, useMemo, useState } from "react";

import "./styles/global.css";
import styles from "./App.module.css";

import Navbar from "./components/Navbar";
import SignInModal from "./components/SignInModal";
import ProfileView from "./components/ProfileView";
import AdminDashboard from "./components/admin/AdminDashboard";
import HomeDashboard from "./components/HomeDashboard";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function normaliseQuestion(q) {
  return {
    ...q,

    tag: q.category ?? "General",

    initials: q.author
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2),

    avatarColor: stringToColor(q.author),

    timeAgo: formatTimeAgo(q.createdAt),

    comments: (q.comments ?? []).map(normaliseComment),
  };
}

function normaliseComment(comment) {
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

    avatarColor: stringToColor(name),

    timeAgo: formatTimeAgo(comment.createdAt),
  };
}

function stringToColor(str) {
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

  for (let i = 0; i < str.length; i += 1) {
    hash =
      str.charCodeAt(i) +
      ((hash << 5) - hash);
  }

  return palette[Math.abs(hash) % palette.length];
}

function formatTimeAgo(isoString) {
  if (!isoString) return "Just now";

  const seconds = Math.floor(
    (Date.now() - new Date(isoString)) / 1000
  );

  if (seconds < 60) {
    return "Just now";
  }

  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ago`;
  }

  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h ago`;
  }

  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function App() {
  const [questions, setQuestions] = useState([]);

  const [showSignIn, setShowSignIn] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [fetchError, setFetchError] =
    useState(null);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [sortBy, setSortBy] =
    useState("latest");

  const [view, setView] =
    useState("all");

  const [selectedCategory, setSelectedCategory] =
    useState(null);

  const [user, setUser] = useState(() => {
    const saved =
      localStorage.getItem("pulseUser") ||
      sessionStorage.getItem("pulseUser");

    return saved
      ? JSON.parse(saved)
      : null;
  });

  const [token, setToken] = useState(() => {
    return (
      localStorage.getItem("pulseToken") ||
      sessionStorage.getItem("pulseToken")
    );
  });

  useEffect(() => {
    fetchQuestions();
  }, [token]);

  function handleLogout() {
    setUser(null);
    setToken(null);
    setView("all");

    localStorage.removeItem("pulseUser");
    localStorage.removeItem("pulseToken");

    sessionStorage.removeItem("pulseUser");
    sessionStorage.removeItem("pulseToken");
  }

  async function fetchQuestions() {
    setLoading(true);
    setFetchError(null);

    try {
      const res = await fetch(
        `${API_BASE}/questions`,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        }
      );

      if (!res.ok) {
        throw new Error(
          `Server error: ${res.status}`
        );
      }

      const json = await res.json();

      setQuestions(
        json.data.map(normaliseQuestion)
      );
    } catch (err) {
      console.error(
        "Failed to fetch questions:",
        err
      );

      setFetchError(
        "Could not load questions. Is the backend running?"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(
    userData,
    authToken,
    rememberMe
  ) {
    setUser(userData);
    setToken(authToken);

    if (rememberMe) {
      localStorage.setItem(
        "pulseUser",
        JSON.stringify(userData)
      );

      localStorage.setItem(
        "pulseToken",
        authToken
      );

      sessionStorage.removeItem("pulseUser");
      sessionStorage.removeItem("pulseToken");
    } else {
      sessionStorage.setItem(
        "pulseUser",
        JSON.stringify(userData)
      );

      sessionStorage.setItem(
        "pulseToken",
        authToken
      );

      localStorage.removeItem("pulseUser");
      localStorage.removeItem("pulseToken");
    }
  }

  async function handleAddQuestion(
    text,
    category
  ) {
    if (!token) {
      setShowSignIn(true);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/questions`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            text,
            category,
          }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.message ||
            `Server error: ${res.status}`
        );
      }

      setQuestions((previousQuestions) => [
        normaliseQuestion(json.data),
        ...previousQuestions,
      ]);
    } catch (err) {
      alert(
        err.message ||
          "Failed to post question. Please check your connection and try again."
      );
    }
  }

  async function handleDeleteQuestion(
    questionId
  ) {
    const confirmed = window.confirm(
      "Delete this question? This cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/questions/${questionId}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.message ||
            "Failed to delete question."
        );
      }

      setQuestions((previousQuestions) =>
        previousQuestions.filter(
          (question) =>
            question.id !== questionId
        )
      );
    } catch (err) {
      alert(err.message);
    }
  }

  function handleHomeNavigate(destination) {
    if (destination === "home") {
      setView("all");
      setSearchQuery("");
      setSelectedCategory(null);
      setSortBy("latest");
      return;
    }

    if (destination === "trending") {
      setView("all");
      setSearchQuery("");
      setSelectedCategory(null);
      setSortBy("mostLiked");
      return;
    }

    if (destination === "categories") {
      setView("all");
      setSelectedCategory(null);

      requestAnimationFrame(() => {
        document
          .querySelector(
            '[aria-label="Search questions"]'
          )
          ?.focus();
      });
    }
  }

  function handleCategorySelect(categoryId) {
    setView("all");

    setSelectedCategory((currentCategory) =>
      currentCategory === categoryId
        ? null
        : categoryId
    );

    setSearchQuery("");
  }

  const filteredAndSorted = useMemo(() => {
    const query =
      searchQuery.toLowerCase().trim();

    let filtered = questions;

    if (view === "mine" && user) {
      filtered = filtered.filter(
        (question) =>
          question.userId === user.id
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        (question) =>
          question.tag.toLowerCase() ===
          selectedCategory.toLowerCase()
      );
    }

    if (query) {
      filtered = filtered.filter(
        (question) =>
          question.text
            .toLowerCase()
            .includes(query) ||
          question.author
            .toLowerCase()
            .includes(query) ||
          question.tag
            .toLowerCase()
            .includes(query)
      );
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === "mostLiked") {
        return b.likes - a.likes;
      }

      if (sortBy === "mostCommented") {
        return (
          b.comments.length -
          a.comments.length
        );
      }

      return b.id - a.id;
    });
  }, [
    questions,
    searchQuery,
    sortBy,
    view,
    user,
    selectedCategory,
  ]);

  return (
    <div>
      <Navbar
        user={user}
        onSignInClick={() =>
          setShowSignIn(true)
        }
        onLogout={handleLogout}
        onTrendingClick={() => {
          setView("all");
          setSearchQuery("");
          setSelectedCategory(null);
          setSortBy("mostLiked");
        }}
        onCategoriesClick={() => {
          setView("all");
          setSelectedCategory(null);

          requestAnimationFrame(() => {
            document
              .querySelector(
                '[aria-label="Search questions"]'
              )
              ?.focus();
          });
        }}
        onAboutClick={() =>
          setView("about")
        }
        onProfileClick={() =>
          setView("profile")
        }
        onMyQuestionsClick={() => {
          setView("mine");
          setSearchQuery("");
          setSelectedCategory(null);
        }}
        onAdminClick={() =>
          setView("admin")
        }
      />

      <SignInModal
        isOpen={showSignIn}
        onClose={() =>
          setShowSignIn(false)
        }
        onLogin={handleLogin}
      />

      {view === "admin" ? (
        <AdminDashboard
          token={token}
          onBack={() =>
            setView("all")
          }
        />
      ) : view === "profile" ? (
        <main className={styles.container}>
          <ProfileView
            user={user}
            questions={questions}
            onBack={() =>
              setView("all")
            }
          />
        </main>
      ) : view === "about" ? (
        <main className={styles.container}>
          <div
            style={{
              padding: "48px 0",
            }}
          >
            <button
              type="button"
              onClick={() =>
                setView("all")
              }
            >
              ← Back
            </button>

            <h1>About Pulse Opinion</h1>

            <p>
              Pulse Opinion is a community
              discussion platform built around
              questions, viewpoints, and public
              opinion.
            </p>
          </div>
        </main>
      ) : (
        <HomeDashboard
          user={user}
          token={token}
          questions={questions}
          filteredQuestions={
            filteredAndSorted
          }
          loading={loading}
          fetchError={fetchError}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          view={view}
          onAddQuestion={
            handleAddQuestion
          }
          onDeleteQuestion={
            handleDeleteQuestion
          }
          onRetry={fetchQuestions}
          onNavigate={
            handleHomeNavigate
          }
          onCategorySelect={
            handleCategorySelect
          }
        />
      )}
    </div>
  );
}
// //new code with backend logic connected
// import SignInModal from './components/SignInModal';
// import { useState, useEffect, useMemo } from 'react';
// import './styles/global.css';
// import Navbar from './components/Navbar';
// import QuestionForm from './components/QuestionForm';
// import QuestionCard from './components/QuestionCard';
// import styles from './App.module.css';
// import ProfileView from './components/ProfileView'; 
// import AdminDashboard from './components/admin/AdminDashboard';
// const API_BASE = import.meta.env.VITE_API_BASE_URL;
// // const API_BASE = 'http://localhost:5000/api';
// function normaliseQuestion(q) {
//   return {
//     ...q,
//     tag: q.category ?? 'General',

//     initials: q.author
//       .split(' ')
//       .map((w) => w[0])
//       .join('')
//       .toUpperCase()
//       .slice(0, 2),

//     avatarColor: stringToColor(q.author),
//     timeAgo: formatTimeAgo(q.createdAt),

//     comments: (q.comments ?? []).map(normaliseComment),
//   };
// }

// function normaliseComment(comment) {
//   const name = comment.author ?? comment.name ?? 'Unknown';

//   return {
//     ...comment,
//     name,
//     initials: name
//       .split(' ')
//       .map((word) => word[0])
//       .join('')
//       .toUpperCase()
//       .slice(0, 2),
//     avatarColor: stringToColor(name),
//     timeAgo: formatTimeAgo(comment.createdAt),
//   };
// }
// function stringToColor(str) {
//   const palette = [
//     '#6c63ff', '#22c58b', '#e05252', '#d4537e',
//     '#f59e0b', '#8b5cf6', '#10b981', '#06B6D4',
//   ];
//   let hash = 0;
//   for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
//   return palette[Math.abs(hash) % palette.length];
// }

// function formatTimeAgo(isoString) {
//   if (!isoString) return 'Just now';
//   const seconds = Math.floor((Date.now() - new Date(isoString)) / 1000);
//   if (seconds < 60)  return 'Just now';
//   if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
//   if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
//   return `${Math.floor(seconds / 86400)}d ago`;
// }
// export default function App() {
//   const [questions, setQuestions]   = useState([]);
//   const [showSignIn, setShowSignIn] = useState(false);
//   const [loading, setLoading]       = useState(true);
//   const [fetchError, setFetchError] = useState(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [sortBy, setSortBy]           = useState('latest');
//   const [view, setView] = useState('all');
//   const [user, setUser] = useState(() => {
//    const saved =
//     localStorage.getItem('pulseUser') ||
//     sessionStorage.getItem('pulseUser');
//     return saved ? JSON.parse(saved) : null;});
//    const [token, setToken] = useState(() =>
//    localStorage.getItem('pulseToken') ||
//    sessionStorage.getItem('pulseToken'));
//   useEffect(() => {fetchQuestions();}, [token]);
//   function handleLogout() {
//    setUser(null);
//    setToken(null);

//    localStorage.removeItem("pulseUser");
//    localStorage.removeItem("pulseToken");
//    sessionStorage.removeItem("pulseUser");
//    sessionStorage.removeItem("pulseToken");
//    }
//   async function fetchQuestions() {
//     setLoading(true);
//     setFetchError(null);
//     try {
//       const res = await fetch(`${API_BASE}/questions`, {headers: token  ? { Authorization: `Bearer ${token}` }  : {},});
//       if (!res.ok) throw new Error(`Server error: ${res.status}`);

//       const json = await res.json();

//       setQuestions(json.data.map(normaliseQuestion));
//     } catch (err) {
//       setFetchError('Could not load questions. Is the backend running?');
//     } finally {
//       setLoading(false);
//     }
//   }
//   function handleLogin(userData, authToken, rememberMe) {
//    setUser(userData);
//    setToken(authToken);

//    if (rememberMe) {
//     localStorage.setItem('pulseUser', JSON.stringify(userData));
//     localStorage.setItem('pulseToken', authToken);
//    } else {
//     sessionStorage.setItem('pulseUser', JSON.stringify(userData));
//     sessionStorage.setItem('pulseToken', authToken);
//   }
//  } 
//   async function handleAddQuestion(text, category) {
//     try {
//       const res = await fetch(`${API_BASE}/questions`, {
//         method:  'POST',
//         headers: {'Content-Type': 'application/json','Authorization': `Bearer ${token}`,},
//         body:    JSON.stringify({ text, category }),
//       });

//       if (!res.ok) throw new Error(`Server error: ${res.status}`);

//       const json = await res.json();

//       setQuestions((prev) => [normaliseQuestion(json.data), ...prev]);
//     } catch (err) {
//       alert('Failed to post question. Please check your connection and try again.');
//     }
//   }
//   async function handleDeleteQuestion(questionId) {
//    const confirmed = window.confirm(
//     'Delete this question? This cannot be undone.');

//    if (!confirmed) return;

//    try {
//     const res = await fetch(`${API_BASE}/questions/${questionId}`, {
//       method: 'DELETE',
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     const json = await res.json();

//     if (!res.ok) {
//       throw new Error(json.message || 'Failed to delete question.');
//     }

//     setQuestions((prev) =>
//       prev.filter((q) => q.id !== questionId)
//     );
//    } catch (err) {
//     alert(err.message);}
//    }
//   const filteredAndSorted = useMemo(() => {
//     const query = searchQuery.toLowerCase().trim();

//     let filtered = questions;
//      if (view === 'mine' && user) {
//       filtered = filtered.filter(
//       (q) => q.userId === user.id);
//      }
//      if (query) {
//       filtered = filtered.filter(
//      (q) =>
//       q.text.toLowerCase().includes(query) ||
//       q.author.toLowerCase().includes(query) ||
//       q.tag.toLowerCase().includes(query));
//     }
//     return [...filtered].sort((a, b) => {
//       if (sortBy === 'mostLiked')     return b.likes - a.likes;
//       if (sortBy === 'mostCommented') return b.comments.length - a.comments.length;
//       return b.id - a.id; // 'latest'
//     });
//   }, [questions, searchQuery, sortBy,view,user ]);
//   return (
//     <div>
//       <Navbar
//       user={user}
//       onSignInClick={() => setShowSignIn(true)}
//       onLogout={handleLogout}

//       onTrendingClick={() => {
//       setView('all');
//       setSearchQuery('');
//      document
//       .querySelector('[aria-label="Questions feed"]')
//       ?.scrollIntoView({ behavior: 'smooth' });
//      }}

//      onCategoriesClick={() => {
//      setView('all');
//      document
//       .querySelector('[aria-label="Search questions"]')
//       ?.focus();
//      }}

//      onAboutClick={() => setView('about')}
//      onProfileClick={() => setView('profile')}
//      onMyQuestionsClick={() => {
//      setView('mine');
//      setSearchQuery('');
//      }}
//      onAdminClick={() => setView('admin')}/>
//      {/* <button onClick={() => setView('admin')}>
//      Open Admin</button> */}
//     <SignInModal isOpen={showSignIn}onClose={() => setShowSignIn(false)}onLogin={handleLogin}/>
//       <main className={view === 'admin' ? '' : styles.container}>
//       {view === 'admin' ? (
//         <AdminDashboard token={token}
//          onBack={() => setView('all')}/>
//        ) : view === 'profile' ? (
//        <ProfileView
//       user={user}
//       questions={questions}
//       onBack={() => setView('all')}/>
//     ) : (
//     <>
//         {/* Page Header */}
//         <header className={styles.header}>
//           <h1 className={styles.heading}>
//             What's on your <em className={styles.headingAccent}>mind?</em>
//           </h1>
//           <p className={styles.subtitle}>
//             Ask questions, spark debates, and discover what the public really
//             thinks.
//           </p>
//         </header>

//         {/* Ask Question Section */}
//         <QuestionForm onSubmit={handleAddQuestion} />

//         {/* Search + Sort bar */}
//         <div className={styles.controls}>
//           <div className={styles.searchWrap}>
//             <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none"
//               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
//               aria-hidden="true">
//               <circle cx="11" cy="11" r="8"/>
//               <line x1="21" y1="21" x2="16.65" y2="16.65"/>
//             </svg>
//             <input
//               className={styles.searchInput}
//               type="text"
//               placeholder="Search questions, authors, or categories…"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               aria-label="Search questions"
//             />
//             {searchQuery && (
//               <button
//                 className={styles.clearBtn}
//                 onClick={() => setSearchQuery('')}
//                 aria-label="Clear search"
//               >
//                 ×
//               </button>
//             )}
//           </div>

//           <select
//             className={styles.sortSelect}
//             value={sortBy}
//             onChange={(e) => setSortBy(e.target.value)}
//             aria-label="Sort questions"
//           >
//             <option value="latest">Latest</option>
//             <option value="mostLiked">Most Liked</option>
//             <option value="mostCommented">Most Commented</option>
//           </select>
//         </div>
//         {view === 'mine' && (
//         <button
//          className={styles.backToAllBtn}onClick={() => {setView('all');setSearchQuery('');}}> 
//          ← Back to all discussions</button>)}
//         {/* Section label */}
//         <div className={styles.sectionLabel}>
//         <span>
//         {view === 'mine'
//         ? `My Questions (${filteredAndSorted.length})`
//         : searchQuery
//          ? `${filteredAndSorted.length} result${
//           filteredAndSorted.length !== 1 ? 's' : ''
//          } for "${searchQuery}"`
//          : 'Trending Discussions'}
//        </span>
//        </div>
//         {/* 1. Loading spinner */}
//         {loading && (
//           <div className={styles.loadingWrap} aria-label="Loading questions">
//             <span className={styles.spinner} />
//             <p className={styles.loadingText}>Loading discussions…</p>
//           </div>
//         )}

//         {/* 2. Fetch error with retry button */}
//         {!loading && fetchError && (
//           <div className={styles.errorBanner} role="alert">
//             <p>{fetchError}</p>
//             <button className={styles.retryBtn} onClick={fetchQuestions}>
//               Try again
//             </button>
//           </div>
//         )}

//         {/* 3. Normal feed (only shown once loading is done and there's no error) */}
//         {!loading && !fetchError && (
//           <section aria-label="Questions feed">
//             {filteredAndSorted.length === 0 ? (
//               <div className={styles.emptySearch}>
//                 <p>No questions match your search.</p>
//                 <button className={styles.emptySearchClear} onClick={() => setSearchQuery('')}>
//                   Clear search
//                 </button>
//               </div>
//             ) : (
//               filteredAndSorted.map((q) => (
//                 <QuestionCard key={q.id} question={q} token={token} currentUser={user} onDelete={handleDeleteQuestion}/>
//               ))
//             )}
//           </section>
//         )}
//           </>
//          )}
//       </main>
//     </div>
//   );
// }
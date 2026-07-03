//new code with backend logic connected
import SignInModal from './components/SignInModal';
import { useState, useEffect, useMemo } from 'react';
import './styles/global.css';
import Navbar from './components/Navbar';
import QuestionForm from './components/QuestionForm';
import QuestionCard from './components/QuestionCard';
import styles from './App.module.css';
import ProfileView from './components/ProfileView'; 
const API_BASE = 'http://localhost:5000/api';
function normaliseQuestion(q) {
  return {
    ...q,
    tag: q.category ?? 'General',

    initials: q.author
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2),

    avatarColor: stringToColor(q.author),
    timeAgo: formatTimeAgo(q.createdAt),

    comments: (q.comments ?? []).map(normaliseComment),
  };
}
// function normaliseQuestion(q) {
//   return {
//     ...q,                               
//     tag:         q.category ?? 'General',
//     initials:    q.author               
//                    .split(' ')
//                    .map((w) => w[0])
//                    .join('')
//                    .toUpperCase()
//                    .slice(0, 2),
//     avatarColor: stringToColor(q.author), 
//     timeAgo:     formatTimeAgo(q.createdAt),
//   };
// }
function normaliseComment(comment) {
  const name = comment.author ?? comment.name ?? 'Unknown';

  return {
    ...comment,
    name,
    initials: name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2),
    avatarColor: stringToColor(name),
    timeAgo: formatTimeAgo(comment.createdAt),
  };
}
function stringToColor(str) {
  const palette = [
    '#6c63ff', '#22c58b', '#e05252', '#d4537e',
    '#f59e0b', '#8b5cf6', '#10b981', '#06B6D4',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function formatTimeAgo(isoString) {
  if (!isoString) return 'Just now';
  const seconds = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (seconds < 60)  return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
export default function App() {
  
  const [questions, setQuestions]   = useState([]);
  const [showSignIn, setShowSignIn] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy]           = useState('latest');
  const [view, setView] = useState('all');
  const [user, setUser] = useState(() => {
   const saved =
    localStorage.getItem('pulseUser') ||
    sessionStorage.getItem('pulseUser');
    return saved ? JSON.parse(saved) : null;});
   const [token, setToken] = useState(() =>
   localStorage.getItem('pulseToken') ||
   sessionStorage.getItem('pulseToken'));
  useEffect(() => {fetchQuestions();}, [token]);
  function handleLogout() {
   setUser(null);
   setToken(null);

   localStorage.removeItem("pulseUser");
   localStorage.removeItem("pulseToken");
   sessionStorage.removeItem("pulseUser");
   sessionStorage.removeItem("pulseToken");
   }
  async function fetchQuestions() {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`${API_BASE}/questions`, {headers: token  ? { Authorization: `Bearer ${token}` }  : {},});
      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const json = await res.json();

      setQuestions(json.data.map(normaliseQuestion));
    } catch (err) {
      setFetchError('Could not load questions. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }
  function handleLogin(userData, authToken, rememberMe) {
   setUser(userData);
   setToken(authToken);

   if (rememberMe) {
    localStorage.setItem('pulseUser', JSON.stringify(userData));
    localStorage.setItem('pulseToken', authToken);
   } else {
    sessionStorage.setItem('pulseUser', JSON.stringify(userData));
    sessionStorage.setItem('pulseToken', authToken);
  }
}
  async function handleAddQuestion(text, category) {
    try {
      const res = await fetch(`${API_BASE}/questions`, {
        method:  'POST',
        headers: {'Content-Type': 'application/json','Authorization': `Bearer ${token}`,},
        body:    JSON.stringify({ text, category }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const json = await res.json();

      setQuestions((prev) => [normaliseQuestion(json.data), ...prev]);
    } catch (err) {
      alert('Failed to post question. Please check your connection and try again.');
    }
  }
  async function handleDeleteQuestion(questionId) {
   const confirmed = window.confirm(
    'Delete this question? This cannot be undone.');

   if (!confirmed) return;

   try {
    const res = await fetch(`${API_BASE}/questions/${questionId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.message || 'Failed to delete question.');
    }

    setQuestions((prev) =>
      prev.filter((q) => q.id !== questionId)
    );
   } catch (err) {
    alert(err.message);}
   }
  const filteredAndSorted = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    let filtered = questions;
     if (view === 'mine' && user) {
      filtered = filtered.filter(
      (q) => q.userId === user.id);
     }
     if (query) {
      filtered = filtered.filter(
     (q) =>
      q.text.toLowerCase().includes(query) ||
      q.author.toLowerCase().includes(query) ||
      q.tag.toLowerCase().includes(query));
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === 'mostLiked')     return b.likes - a.likes;
      if (sortBy === 'mostCommented') return b.comments.length - a.comments.length;
      return b.id - a.id; // 'latest'
    });
  }, [questions, searchQuery, sortBy,view,user ]);
  return (
    <div>
      <Navbar
      user={user}
      onSignInClick={() => setShowSignIn(true)}
      onLogout={handleLogout}

      onTrendingClick={() => {
      setView('all');
      setSearchQuery('');
     document
      .querySelector('[aria-label="Questions feed"]')
      ?.scrollIntoView({ behavior: 'smooth' });
     }}

     onCategoriesClick={() => {
     setView('all');
     document
      .querySelector('[aria-label="Search questions"]')
      ?.focus();
     }}

     onAboutClick={() => setView('about')}
     onProfileClick={() => setView('profile')}
     onMyQuestionsClick={() => {
     setView('mine');
     setSearchQuery('');
     }}/>
     
    <SignInModal isOpen={showSignIn}onClose={() => setShowSignIn(false)}onLogin={handleLogin}/>
      <main className={styles.container}>
      {view === 'profile' ? (
     <ProfileView
      user={user}
      questions={questions}
      onBack={() => setView('all')}/>
    ) : (
    <>
        {/* Page Header */}
        <header className={styles.header}>
          <h1 className={styles.heading}>
            What's on your <em className={styles.headingAccent}>mind?</em>
          </h1>
          <p className={styles.subtitle}>
            Ask questions, spark debates, and discover what the public really
            thinks.
          </p>
        </header>

        {/* Ask Question Section */}
        <QuestionForm onSubmit={handleAddQuestion} />

        {/* Search + Sort bar */}
        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search questions, authors, or categories…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search questions"
            />
            {searchQuery && (
              <button
                className={styles.clearBtn}
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <select
            className={styles.sortSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort questions"
          >
            <option value="latest">Latest</option>
            <option value="mostLiked">Most Liked</option>
            <option value="mostCommented">Most Commented</option>
          </select>
        </div>
        {view === 'mine' && (
        <button
         className={styles.backToAllBtn}onClick={() => {setView('all');setSearchQuery('');}}> 
         ← Back to all discussions</button>)}
        {/* Section label */}
        <div className={styles.sectionLabel}>
        <span>
        {view === 'mine'
        ? `My Questions (${filteredAndSorted.length})`
        : searchQuery
         ? `${filteredAndSorted.length} result${
          filteredAndSorted.length !== 1 ? 's' : ''
         } for "${searchQuery}"`
         : 'Trending Discussions'}
       </span>
       </div>
        {/* 1. Loading spinner */}
        {loading && (
          <div className={styles.loadingWrap} aria-label="Loading questions">
            <span className={styles.spinner} />
            <p className={styles.loadingText}>Loading discussions…</p>
          </div>
        )}

        {/* 2. Fetch error with retry button */}
        {!loading && fetchError && (
          <div className={styles.errorBanner} role="alert">
            <p>{fetchError}</p>
            <button className={styles.retryBtn} onClick={fetchQuestions}>
              Try again
            </button>
          </div>
        )}

        {/* 3. Normal feed (only shown once loading is done and there's no error) */}
        {!loading && !fetchError && (
          <section aria-label="Questions feed">
            {filteredAndSorted.length === 0 ? (
              <div className={styles.emptySearch}>
                <p>No questions match your search.</p>
                <button className={styles.emptySearchClear} onClick={() => setSearchQuery('')}>
                  Clear search
                </button>
              </div>
            ) : (
              filteredAndSorted.map((q) => (
                <QuestionCard key={q.id} question={q} token={token} currentUser={user} onDelete={handleDeleteQuestion}/>
              ))
            )}
          </section>
        )}
          </>
         )}
      </main>
    </div>
  );
}
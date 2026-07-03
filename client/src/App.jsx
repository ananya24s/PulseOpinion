//new code with backend logic connected
import SignInModal from './components/SignInModal';
import { useState, useEffect, useMemo } from 'react';
import './styles/global.css';
import Navbar from './components/Navbar';
import QuestionForm from './components/QuestionForm';
import QuestionCard from './components/QuestionCard';
import styles from './App.module.css';

const API_BASE = 'http://localhost:5000/api';
function normaliseQuestion(q) {
  return {
    ...q,                               
    tag:         q.category ?? 'General',
    initials:    q.author               
                   .split(' ')
                   .map((w) => w[0])
                   .join('')
                   .toUpperCase()
                   .slice(0, 2),
    avatarColor: stringToColor(q.author), 
    timeAgo:     formatTimeAgo(q.createdAt),
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
function handleLogout() {
  setUser(null);
  setToken(null);

  localStorage.removeItem('pulseUser');
  localStorage.removeItem('pulseToken');
  sessionStorage.removeItem('pulseUser');
  sessionStorage.removeItem('pulseToken');
}
export default function App() {
  
  const [questions, setQuestions]   = useState([]);
  const [showSignIn, setShowSignIn] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy]           = useState('latest');
  const [user, setUser] = useState(() => {const saved = localStorage.getItem('pulseUser');return saved ? JSON.parse(saved) : null;});
  const [token, setToken] = useState(() =>localStorage.getItem('pulseToken'));
  useEffect(() => {fetchQuestions();}, [token]);

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
  const filteredAndSorted = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    const filtered = query
      ? questions.filter(
          (q) =>
            q.text.toLowerCase().includes(query) ||
            q.author.toLowerCase().includes(query) ||
            q.tag.toLowerCase().includes(query)
        )
      : questions;

    return [...filtered].sort((a, b) => {
      if (sortBy === 'mostLiked')     return b.likes - a.likes;
      if (sortBy === 'mostCommented') return b.comments.length - a.comments.length;
      return b.id - a.id; // 'latest'
    });
  }, [questions, searchQuery, sortBy]);
  return (
    <div>
      <Navbar onSignInClick={() => setShowSignIn(true)} user={user} onLogout={handleLogout}/>
        <SignInModal isOpen={showSignIn}onClose={() => setShowSignIn(false)}onLogin={handleLogin}/>
      <main className={styles.container}>
        {/* Page Header */}
        <header className={styles.header}>
          <h1 className={styles.heading}>
            What's on your <em className={styles.headingAccent}>mind?</em>
          </h1>
          <p className={styles.subtitle}>
            Ask questions, spark debates, and discover what the public really
            thinks — no sign-up needed.
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

        {/* Section label */}
        <div className={styles.sectionLabel}>
          <span>
            {searchQuery
              ? `${filteredAndSorted.length} result${filteredAndSorted.length !== 1 ? 's' : ''} for "${searchQuery}"`
              : 'Trending Discussions'}
          </span>
        </div>

        {/* ── Feed area — three possible states ─────────────────────────── */}

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
                <QuestionCard key={q.id} question={q} token={token} />
              ))
            )}
          </section>
        )}
      </main>
    </div>
  );
}


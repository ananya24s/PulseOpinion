import { useEffect, useMemo, useState } from "react";
import AboutPage from "./components/AboutPage";
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
const [theme, setTheme] = useState(() => {
  const savedTheme = localStorage.getItem("pulseTheme");

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches
    ? "dark"
    : "light";
});
  useEffect(() => {
    fetchQuestions();
  }, [token]);
  useEffect(() => {
   document.documentElement.setAttribute(
    "data-theme",
    theme
  );

  localStorage.setItem("pulseTheme", theme);
}, [theme]);

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
  setSearchQuery("");

  setSelectedCategory((currentCategory) =>
    currentCategory === categoryId
      ? null
      : categoryId
  );
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
   const activeNav = selectedCategory
   ? "categories"
   : sortBy === "mostLiked" &&
    view === "all" &&
    !searchQuery
   ? "trending"
   : "home";
  return (
    <div>
      <Navbar
        user={user}
        onSignInClick={() =>
          setShowSignIn(true)
        }
        theme={theme}
         onThemeToggle={() =>
         setTheme((currentTheme) =>
          currentTheme === "light" ? "dark" : "light"
          )
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
       <AboutPage
        onBack={() => setView("all")}
       onExploreDiscussions={() => {
       setView("all");
       setSearchQuery("");
       setSelectedCategory(null);
       setSortBy("latest");
       }}
       />
      ) : (
  <HomeDashboard
  user={user}
  token={token}
  questions={questions}
  filteredQuestions={filteredAndSorted}
  loading={loading}
  fetchError={fetchError}
  searchQuery={searchQuery}
  setSearchQuery={setSearchQuery}
  sortBy={sortBy}
  setSortBy={setSortBy}
  view={view}
  activeNav={activeNav}
  selectedCategory={selectedCategory}
  onAddQuestion={handleAddQuestion}
  onDeleteQuestion={handleDeleteQuestion}
  onRetry={fetchQuestions}
  onNavigate={handleHomeNavigate}
  onCategorySelect={handleCategorySelect}
  onAboutClick={() => {
   setView("about");
   }}
  onExploreAI={() => {
    alert("AI Pulse coming soon.");
  }}
/>
      )}
    </div>
  );
}

import styles from "./HomeDashboard.module.css";
import HomeSidebar from "./HomeSidebar";
import HomeInsights from "./HomeInsights";
import QuestionForm from "./QuestionForm";
import QuestionCard from "./QuestionCard";

export default function HomeDashboard({
  user,
  token,
  questions,
  filteredQuestions,
  loading,
  fetchError,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  view,
  onAddQuestion,
  onDeleteQuestion,
  onRetry,
  onNavigate,
  onCategorySelect,
}) {
  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        {/* LEFT SIDEBAR */}
        <aside className={styles.sidebarColumn}>
          <HomeSidebar
            onNavigate={onNavigate}
            onCategorySelect={onCategorySelect}
          />
        </aside>

        {/* MAIN FEED */}
        <main className={styles.feedColumn}>
          <div className={styles.feedIntro}>
            <h1 className={styles.feedHeading}>
              What's on your <span>mind?</span>
            </h1>

            <p className={styles.feedSubtitle}>
              Ask questions, spark debates, and discover what the public really
              thinks.
            </p>
          </div>

          {/* REAL EXISTING QUESTION FORM */}
          <QuestionForm onSubmit={onAddQuestion} />

          {/* SEARCH */}
          <div className={styles.controls}>
            <div className={styles.searchWrap}>
              <svg
                className={styles.searchIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>

              <input
                className={styles.searchInput}
                type="text"
                placeholder="Search questions, authors, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search questions"
              />

              {searchQuery && (
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* FEED TABS */}
          <div className={styles.feedControls}>
            <div
              className={styles.tabGroup}
              role="tablist"
              aria-label="Sort discussions"
            >
              <button
                type="button"
                role="tab"
                aria-selected={sortBy === "latest"}
                className={`${styles.tab} ${
                  sortBy === "latest" ? styles.tabActive : ""
                }`}
                onClick={() => setSortBy("latest")}
              >
                Latest
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={sortBy === "mostLiked"}
                className={`${styles.tab} ${
                  sortBy === "mostLiked" ? styles.tabActive : ""
                }`}
                onClick={() => setSortBy("mostLiked")}
              >
                Most Liked
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={sortBy === "mostCommented"}
                className={`${styles.tab} ${
                  sortBy === "mostCommented" ? styles.tabActive : ""
                }`}
                onClick={() => setSortBy("mostCommented")}
              >
                Most Debated
              </button>
            </div>

            <span className={styles.resultCount}>
              {filteredQuestions.length} discussion
              {filteredQuestions.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* MY QUESTIONS BACK BUTTON */}
          {view === "mine" && (
            <button
              type="button"
              className={styles.backToAllBtn}
              onClick={() => onNavigate("home")}
            >
              ← Back to all discussions
            </button>
          )}

          {/* CURRENT FEED LABEL */}
          <div className={styles.sectionLabel}>
            <span>
              {view === "mine"
                ? `My Questions (${filteredQuestions.length})`
                : searchQuery
                ? `${filteredQuestions.length} result${
                    filteredQuestions.length !== 1 ? "s" : ""
                  } for "${searchQuery}"`
                : sortBy === "mostLiked"
                ? "Most Liked Discussions"
                : sortBy === "mostCommented"
                ? "Most Debated Discussions"
                : "Latest Discussions"}
            </span>
          </div>

          {/* LOADING */}
          {loading && (
            <div
              className={styles.loadingWrap}
              aria-label="Loading questions"
            >
              <span className={styles.spinner} />
              <p className={styles.loadingText}>
                Loading discussions...
              </p>
            </div>
          )}

          {/* ERROR */}
          {!loading && fetchError && (
            <div className={styles.errorBanner} role="alert">
              <p>{fetchError}</p>

              <button
                type="button"
                className={styles.retryBtn}
                onClick={onRetry}
              >
                Try again
              </button>
            </div>
          )}

          {/* REAL EXISTING QUESTION CARDS */}
          {!loading && !fetchError && (
            <section
              className={styles.feedList}
              aria-label="Questions feed"
            >
              {filteredQuestions.length === 0 ? (
                <div className={styles.emptySearch}>
                  <h3>No discussions found</h3>

                  <p>
                    {searchQuery
                      ? "Try a different search term or clear your current search."
                      : "There are no questions in this view yet."}
                  </p>

                  {searchQuery && (
                    <button
                      type="button"
                      className={styles.emptySearchClear}
                      onClick={() => setSearchQuery("")}
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                filteredQuestions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    token={token}
                    currentUser={user}
                    onDelete={onDeleteQuestion}
                  />
                ))
              )}
            </section>
          )}
        </main>

        {/* RIGHT INSIGHTS */}
        <aside className={styles.insightsColumn}>
          <HomeInsights questions={questions} />
        </aside>
      </div>
    </div>
  );
}
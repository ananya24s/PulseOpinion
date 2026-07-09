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
  activeNav,
  selectedCategory,
  onAddQuestion,
  onDeleteQuestion,
  onRetry,
  onNavigate,
  onCategorySelect,
  onAboutClick,
  onExploreAI,
}) {
  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.sidebarColumn}>
          <HomeSidebar
            questions={questions}
            activeNav={activeNav}
            selectedCategory={selectedCategory}
            onNavigate={onNavigate}
            onCategorySelect={onCategorySelect}
            onAboutClick={onAboutClick}
          />
        </aside>

        <main className={styles.feedColumn}>
          {/* <div className={styles.feedIntro}>
            <h1 className={styles.feedHeading}>
              What&apos;s on your <span>mind?</span>
            </h1>

            <p className={styles.feedSubtitle}>
              Ask questions, spark debates, and discover what
              the public really thinks.
            </p>
          </div> */}

          <div className={styles.feedIntro}>
  <h1 className={styles.feedHeading}>
    Discuss with <span>context.</span>
  </h1>

  <p className={styles.feedSubtitle}>
    Ask questions, attach sources, and explore discussions
    shaped by community perspectives and AI-assisted context.
  </p>
</div>

          <QuestionForm onSubmit={onAddQuestion} />

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
                <line
                  x1="21"
                  y1="21"
                  x2="16.65"
                  y2="16.65"
                />
              </svg>

              <input
                className={styles.searchInput}
                type="text"
                placeholder="Search questions, authors, or categories..."
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
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
                  sortBy === "latest"
                    ? styles.tabActive
                    : ""
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
                  sortBy === "mostLiked"
                    ? styles.tabActive
                    : ""
                }`}
                onClick={() => setSortBy("mostLiked")}
              >
                Most Liked
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={
                  sortBy === "mostCommented"
                }
                className={`${styles.tab} ${
                  sortBy === "mostCommented"
                    ? styles.tabActive
                    : ""
                }`}
                onClick={() =>
                  setSortBy("mostCommented")
                }
              >
                Most Debated
              </button>
            </div>

            <span className={styles.resultCount}>
              {filteredQuestions.length} discussion
              {filteredQuestions.length !== 1 ? "s" : ""}
            </span>
          </div>

          {view === "mine" && (
            <button
              type="button"
              className={styles.backToAllBtn}
              onClick={() => onNavigate("home")}
            >
              ← Back to all discussions
            </button>
          )}

          <div className={styles.sectionLabel}>
            <span>
              {view === "mine"
                ? `My Questions (${filteredQuestions.length})`
                : selectedCategory
                ? `${
                    selectedCategory
                      .charAt(0)
                      .toUpperCase() +
                    selectedCategory.slice(1)
                  } Discussions`
                : searchQuery
                ? `${filteredQuestions.length} result${
                    filteredQuestions.length !== 1
                      ? "s"
                      : ""
                  } for "${searchQuery}"`
                : sortBy === "mostLiked"
                ? "Most Liked Discussions"
                : sortBy === "mostCommented"
                ? "Most Debated Discussions"
                : "Latest Discussions"}
            </span>
          </div>

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

          {!loading && fetchError && (
            <div
              className={styles.errorBanner}
              role="alert"
            >
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
                      : selectedCategory
                      ? `There are no ${selectedCategory} discussions yet.`
                      : "There are no questions in this view yet."}
                  </p>

                  {searchQuery && (
                    <button
                      type="button"
                      className={
                        styles.emptySearchClear
                      }
                      onClick={() =>
                        setSearchQuery("")
                      }
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

        <aside className={styles.insightsColumn}>
          <HomeInsights
            questions={questions}
            onTopicClick={onCategorySelect}
            onExploreAI={onExploreAI}
          />
        </aside>
      </div>
    </div>
  );
}

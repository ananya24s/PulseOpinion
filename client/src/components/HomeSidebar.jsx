import { useState } from "react";
import styles from "./HomeSidebar.module.css";

const PRIMARY_NAV = [
  { id: "home", label: "Home", icon: "home" },
  { id: "trending", label: "Trending", icon: "trending" },
  { id: "categories", label: "Categories", icon: "grid" },
];

const CATEGORIES = [
  { id: "general", label: "General", dot: "#8b93a7" },
  { id: "technology", label: "Technology", dot: "#3f5fb8" },
  { id: "politics", label: "Politics", dot: "#d64550" },
  { id: "education", label: "Education", dot: "#06b6d4" },
  { id: "sports", label: "Sports", dot: "#16a37a" },
  { id: "entertainment", label: "Entertainment", dot: "#a855c9" },
  { id: "business", label: "Business", dot: "#c98a1f" },
];

function NavIcon({ name }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
  };

  switch (name) {
    case "home":
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M4 11.5 12 4l8 7.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "trending":
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M4 16 9.5 10.5 13.5 14.5 20 7"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14.5 7h5.5v5.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "grid":
      return (
        <svg {...common} aria-hidden="true">
          <rect
            x="4"
            y="4"
            width="7"
            height="7"
            rx="1.4"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <rect
            x="13"
            y="4"
            width="7"
            height="7"
            rx="1.4"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <rect
            x="4"
            y="13"
            width="7"
            height="7"
            rx="1.4"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <rect
            x="13"
            y="13"
            width="7"
            height="7"
            rx="1.4"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );

    default:
      return null;
  }
}

export default function HomeSidebar({
  onNavigate,
  onCategorySelect,
  onAboutClick,
}) {
  const [activeNav, setActiveNav] = useState("home");
  const [activeCategory, setActiveCategory] = useState(null);

  function handleNavClick(id) {
    setActiveNav(id);
    onNavigate?.(id);
  }

  function handleCategoryClick(id) {
    const nextCategory = activeCategory === id ? null : id;

    setActiveCategory(nextCategory);
    onCategorySelect?.(nextCategory);
  }

  return (
    <nav className={styles.sidebar} aria-label="Primary navigation">
      <div className={styles.sidebarMain}>
        <ul className={styles.navList}>
          {PRIMARY_NAV.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`${styles.navItem} ${
                  activeNav === item.id ? styles.navItemActive : ""
                }`}
                onClick={() => handleNavClick(item.id)}
                aria-current={
                  activeNav === item.id ? "page" : undefined
                }
              >
                <span className={styles.navIcon}>
                  <NavIcon name={item.icon} />
                </span>

                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className={styles.discoverSection}>
          <p className={styles.sectionLabel}>Discover</p>

          <ul className={styles.categoryList}>
            {CATEGORIES.map((category) => (
              <li key={category.id}>
                <button
                  type="button"
                  className={`${styles.categoryItem} ${
                    activeCategory === category.id
                      ? styles.categoryItemActive
                      : ""
                  }`}
                  onClick={() =>
                    handleCategoryClick(category.id)
                  }
                  aria-pressed={
                    activeCategory === category.id
                  }
                >
                  <span
                    className={styles.categoryDot}
                    style={{
                      backgroundColor: category.dot,
                    }}
                  />

                  <span>{category.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className={styles.sidebarMiniCard}>
      <p className={styles.miniLabel}>Today’s pulse</p>
      <strong>8 discussions</strong>
     <span>Technology is leading the conversation</span>
    </div>
      <div className={styles.sidebarFooter}>
        <button
          type="button"
          className={styles.footerLink}
          onClick={onAboutClick}
        >
          About
        </button>
      </div>
    </nav>
  );
}
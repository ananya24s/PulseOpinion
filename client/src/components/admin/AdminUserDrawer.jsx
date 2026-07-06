import { useEffect } from "react";
import styles from "./AdminUserDrawer.module.css";

const CloseIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export default function AdminUserDrawer({ user, onClose, initials, avatarColor, formatDate, formatNumber }) {
  useEffect(() => {
    if (!user) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [user, onClose]);

  if (!user) return null;

  const stats = [
    { label: "Questions posted", value: user.questions },
    { label: "Comments posted", value: user.comments },
    { label: "Likes cast", value: user.likesCast },
    { label: "Dislikes cast", value: user.dislikesCast },
    { label: "Engagement received", value: user.engagementReceived, emphasize: true },
  ];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <aside
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${user.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close user detail">
          {CloseIcon}
        </button>

        <div className={styles.identity}>
          <div className={styles.avatar} style={{ backgroundColor: avatarColor(user.name) }}>
            {initials(user.name)}
          </div>
          <div>
            <div className={styles.name}>{user.name}</div>
            <div className={styles.email}>{user.email}</div>
            <span className={`${styles.roleBadge} ${user.role === "admin" ? styles.roleBadgeAdmin : ""}`}>
              {user.role === "admin" ? "Admin" : "User"}
            </span>
          </div>
        </div>

        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Joined</span>
          <span className={styles.metaValue}>{formatDate(user.joined)}</span>
        </div>

        <div className={styles.statsGrid}>
          {stats.map((stat) => (
            <div key={stat.label} className={`${styles.statCard} ${stat.emphasize ? styles.statCardEmphasis : ""}`}>
              <div className={styles.statValue}>{formatNumber(stat.value)}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div className={styles.activitySection}>
          <h3 className={styles.activityHeading}>Recent activity</h3>
          {user.recentActivity && user.recentActivity.length > 0 ? (
            <ul className={styles.activityList}>
              {user.recentActivity.map((item, i) => (
                <li key={i} className={styles.activityItem}>
                  <span className={styles.activityText}>{item.text}</span>
                  <span className={styles.activityTime}>{item.time}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.activityEmpty}>No recent activity for this user.</p>
          )}
        </div>
      </aside>
    </div>
  );
}

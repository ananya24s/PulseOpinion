import { useEffect, useMemo, useState } from "react";
import styles from "./AdminDashboard.module.css";
import AdminUserDrawer from "./AdminUserDrawer";

const Icon = {
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  questions: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  comments: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16v12H7l-3 3V4z" />
    </svg>
  ),
  votes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 10v11" />
      <path d="M7 21H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3" />
      <path d="M7 10l4.5-6.5a1.5 1.5 0 0 1 2.7.9V7h4.9a2 2 0 0 1 2 2.3l-1.2 8A2 2 0 0 1 18 19H7" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-2.6-6.4" />
      <path d="M21 3v6h-6" />
    </svg>
  ),
  register: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </svg>
  ),
  trending: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 6l-9.5 9.5-5-5L1 18" />
      <path d="M17 6h6v6" />
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l8 4v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-4z" />
    </svg>
  ),
};

const ACTIVITY_ICON = {
  question: Icon.questions,
  comment: Icon.comments,
  register: Icon.register,
  like: Icon.votes,
  dislike: Icon.votes,
  trending: Icon.trending,
  admin: Icon.admin,
};
function formatNumber(n) {
  return Number(n || 0).toLocaleString("en-US");
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTimeAgo(dateString) {
  if (!dateString) return "";

  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  );

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return formatDate(dateString);
}

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AVATAR_PALETTE = ["#06B6D4", "#6366F1", "#F59E0B", "#10B981", "#EC4899", "#8B5CF6"];

function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

export default function AdminDashboard({ token , onBack }) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [overviewError, setOverviewError] = useState("");
  const [users, setUsers] = useState([]);
  const [usersError, setUsersError] = useState("");
  const [recentActivity, setRecentActivity] = useState([]);
  const [activityError, setActivityError] = useState("");
  const [overview, setOverview] = useState({
    totalUsers: 0,
    totalQuestions: 0,
    totalComments: 0,
    totalVotes: 0,
  });
  const [engagement, setEngagement] = useState({
   likes: 0,
   dislikes: 0,
   comments: 0,
  });

const [engagementError, setEngagementError] = useState("");
  async function fetchOverview() {
    if (!token) return;

    try {
      setOverviewError("");

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/overview`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Failed to load admin overview.");
      }

      setOverview(json.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Admin overview error:", err);
      setOverviewError(err.message);
    }
  }

  async function fetchUsers() {
  if (!token) return;

  try {
    setUsersError("");

    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/admin/users`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.message || "Failed to load admin users.");
    }

    setUsers(json.data);
  } catch (err) {
    console.error("Admin users error:", err);
    setUsersError(err.message);
  }
}
async function fetchEngagement() {
  if (!token) return;

  try {
    setEngagementError("");

    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/admin/engagement`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

     async function fetchActivity() {
     if (!token) return;

     try {
     setActivityError("");

     const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/admin/activity`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
     );

    const json = await res.json();

    if (!res.ok) {
      throw new Error(
        json.message || "Failed to load recent activity."
      );
    }

    setRecentActivity(json.data);
  } catch (err) {
    console.error("Admin activity error:", err);
    setActivityError(err.message);
  }
 }

    const json = await res.json();

    if (!res.ok) {
      throw new Error(
        json.message || "Failed to load admin engagement."
      );
    }

    setEngagement(json.data);
  } catch (err) {
    console.error("Admin engagement error:", err);
    setEngagementError(err.message);
  }
}
async function fetchActivity() {
  if (!token) return;

  try {
    setActivityError("");

    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/admin/activity`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const json = await res.json();

    if (!res.ok) {
      throw new Error(
        json.message || "Failed to load recent activity."
      );
    }

    setRecentActivity(json.data);
  } catch (err) {
    console.error("Admin activity error:", err);
    setActivityError(err.message);
  }
}
  useEffect(() => {
  fetchOverview();
  fetchUsers();
  fetchEngagement();
  fetchActivity();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [token]);

  const overviewMetrics = [
    { key: "users", 
      label: "Total Users", 
      value: overview.totalUsers, 
      context: "Live from database" },
    { key: "questions", label: "Total Questions", value: overview.totalQuestions, context: "Live from database" },
    { key: "comments", label: "Total Comments", value: overview.totalComments, context: "Live from database" },
    { key: "votes", label: "Total Votes", value: overview.totalVotes, context: "Live from database" },
  ];

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchesQuery = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesQuery && matchesRole;
    });
    }, [users, query, roleFilter]);

 const engagementTotal =
  Number(engagement.likes) +
  Number(engagement.dislikes) +
  Number(engagement.comments);

 const engagementRows = [
  {
    key: "likes",
    label: "Likes",
    value: Number(engagement.likes),
    color: "var(--admin-positive)",
  },
  {
    key: "dislikes",
    label: "Dislikes",
    value: Number(engagement.dislikes),
    color: "var(--admin-negative)",
  },
  {
    key: "comments",
    label: "Comments",
    value: Number(engagement.comments),
    color: "var(--admin-accent)",
  },
];

  async function handleRefresh() {
  if (isRefreshing) return;

  setIsRefreshing(true);

  await Promise.all([
    fetchOverview(),
    fetchUsers(),
    fetchEngagement(),
    fetchActivity(),
  ]);

  setLastUpdated(new Date());
  setIsRefreshing(false);
}

  return (
    <div className={styles.dashboard}>
        <header className={styles.header}>
         <div>
          <button
         type="button"
         className={styles.backButton}
          onClick={onBack}>
          ← Back to Pulse Opinion
         </button>

         <h1 className={styles.title}>Admin Dashboard</h1>
          <p className={styles.subtitle}>Monitor platform activity, users, and engagement.</p>
         </div>

         <div className={styles.headerRight}>
          <span className={styles.lastUpdated}>
            Last updated {lastUpdated.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </span>

          <button
            type="button"
            className={styles.refreshButton}
            onClick={handleRefresh}
            aria-label="Refresh dashboard data"
          >
            <span className={isRefreshing ? styles.spinning : undefined}>{Icon.refresh}</span>
            Refresh
          </button>

          <div className={styles.adminBadge}>
            <div className={styles.adminAvatar}>AD</div>
            <div>
              <div className={styles.adminName}>Admin</div>
              <div className={styles.adminRole}>Administrator</div>
            </div>
          </div>
        </div>
      </header>

      {overviewError && (
        <section className={styles.card}>
          <p className={styles.cardSubtitle}>{overviewError}</p>
        </section>
      )}
      {usersError && (
        <section className={styles.card}>
          <p className={styles.cardSubtitle}>{usersError}</p>
        </section>
      )}
      {activityError && (
      <section className={styles.card}>
      <p className={styles.cardSubtitle}>{activityError}</p>
      </section>
     )}
      <section className={styles.metricsGrid} aria-label="Overview metrics">
        {overviewMetrics.map((metric) => (
          <div key={metric.key} className={styles.metricCard}>
            <div className={styles.metricIconWrap}>{Icon[metric.key]}</div>
            <div>
              <div className={styles.metricValue}>{formatNumber(metric.value)}</div>
              <div className={styles.metricLabel}>{metric.label}</div>
              <div className={styles.metricContext}>{metric.context}</div>
            </div>
          </div>
        ))}
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.card} aria-labelledby="engagement-heading">
          <h2 id="engagement-heading" className={styles.cardTitle}>Engagement Overview</h2>
          <p className={styles.cardSubtitle}>Distribution of votes and comments across the platform.</p>

          <div className={styles.engagementList}>
            {engagementRows.map((row) => {
              const pct = Math.round((row.value / engagementTotal) * 100);

              return (
                <div key={row.key} className={styles.engagementRow}>
                  <div className={styles.engagementRowHead}>
                    <span className={styles.engagementLabel}>{row.label}</span>
                    <span className={styles.engagementValue}>{formatNumber(row.value)}</span>
                  </div>

                  <div className={styles.engagementTrack}>
                    <div
                      className={styles.engagementFill}
                      style={{ width: `${pct}%`, backgroundColor: row.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.engagementRate}>
            <span className={styles.engagementRateLabel}>Overall engagement rate</span>
            <span className={styles.engagementRateValue}>
              {(engagementTotal / Math.max(Number(overview.totalQuestions || 1), 1)).toFixed(1)}
              <span className={styles.engagementRateUnit}> per question</span>
            </span>
          </div>
        </section>

        <section className={styles.card} aria-labelledby="activity-heading">
          <h2 id="activity-heading" className={styles.cardTitle}>Recent Activity</h2>
          <p className={styles.cardSubtitle}>Latest events across the platform.</p>

          <ul className={styles.activityList}>
            {recentActivity.map((item) => (
              <li key={item.id} className={styles.activityItem}>
                <span className={`${styles.activityIcon} ${styles[`activityIcon_${item.type}`]}`}>
                  {ACTIVITY_ICON[item.type]}
                </span>

                <span className={styles.activityText}>
                  {item.user && <strong>{item.user}</strong>} {item.text}{" "}
                  {item.target && <span className={styles.activityTarget}>{item.target}</span>}
                </span>

                <span className={styles.activityTime}>{item.time}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className={styles.card} aria-labelledby="users-heading">
        <div className={styles.usersHeader}>
          <div>
            <h2 id="users-heading" className={styles.cardTitle}>Users</h2>
            <p className={styles.cardSubtitle}>{filteredUsers.length} of {users.length} users</p>
          </div>

          <div className={styles.usersControls}>
            <div className={styles.searchField}>
              <span className={styles.searchIcon}>{Icon.search}</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or email"
                aria-label="Search users"
                className={styles.searchInput}
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={styles.roleSelect}
              aria-label="Filter by role"
            >
              <option value="all">All roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
        </div>

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th className={styles.numCol}>Questions</th>
                <th className={styles.numCol}>Comments</th>
                <th className={styles.numCol}>Likes Cast</th>
                <th className={styles.numCol}>Dislikes Cast</th>
                <th className={styles.numCol}>Engagement</th>
                <th>Joined</th>
                <th className={styles.actionCol}></th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className={styles.userCell}>
                      <div className={styles.avatar} style={{ backgroundColor: avatarColor(u.name) }}>
                        {initials(u.name)}
                      </div>

                      <div>
                        <div className={styles.userName}>{u.name}</div>
                        <div className={styles.userEmail}>{u.email}</div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className={`${styles.roleBadge} ${u.role === "admin" ? styles.roleBadgeAdmin : ""}`}>
                      {u.role === "admin" ? "Admin" : "User"}
                    </span>
                  </td>

                  <td className={styles.numCol}>{formatNumber(u.questions)}</td>
                  <td className={styles.numCol}>{formatNumber(u.comments)}</td>
                  <td className={styles.numCol}>{formatNumber(u.likesCast)}</td>
                  <td className={styles.numCol}>{formatNumber(u.dislikesCast)}</td>

                  <td className={styles.numCol}>
                    <span className={styles.engagementPill}>{formatNumber(u.engagementReceived)}</span>
                  </td>

                  <td className={styles.joinedCol}>{formatDate(u.joined)}</td>

                  <td className={styles.actionCol}>
                    <button
                      type="button"
                      className={styles.viewButton}
                      onClick={() => setSelectedUser(u)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={9} className={styles.emptyState}>
                    No users match your search or filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AdminUserDrawer
      user={selectedUser
        ? {
         ...selectedUser,
          recentActivity: recentActivity
          .filter((item) => item.user === selectedUser.name)
          .map((item) => ({
            text: `${item.text}${item.target ? ` ${item.target}` : ""}`,
            time: formatTimeAgo(item.createdAt),
          })),
         }
          : null
         }
         onClose={() => setSelectedUser(null)}
         initials={initials}
         avatarColor={avatarColor}
         formatDate={formatDate}
         formatNumber={formatNumber}
      />
    </div>
  );
}
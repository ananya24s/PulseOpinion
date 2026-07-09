import { useEffect, useRef, useState } from "react";
import styles from "./Navbar.module.css";

function ThemeIcon({ theme }) {
  if (theme === "dark") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M12 3v2M12 19v2M3 12h2M19 12h2M5.64 5.64l1.42 1.42M16.94 16.94l1.42 1.42M18.36 5.64l-1.42 1.42M7.06 16.94l-1.42 1.42"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle
          cx="12"
          cy="12"
          r="4"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20.5 14.2A8.2 8.2 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export default function Navbar({
  onSignInClick,
  user,
  onLogout,
  onTrendingClick,
  onCategoriesClick,
  onAboutClick,
  onProfileClick,
  onAdminClick,
  onMyQuestionsClick,
  onThemeToggle,
  theme,
  onHomeClick,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const userMenuRef = useRef(null);

useEffect(() => {
  if (!showMenu) return;

  function handleClickOutside(event) {
    if (
      userMenuRef.current &&
      !userMenuRef.current.contains(event.target)
    ) {
      setShowMenu(false);
    }
  }

  function handleEscape(event) {
    if (event.key === "Escape") {
      setShowMenu(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);
  window.addEventListener("keydown", handleEscape);

  return () => {
    document.removeEventListener(
      "mousedown",
      handleClickOutside
    );
    window.removeEventListener("keydown", handleEscape);
  };
}, [showMenu]);

  function handleMenuAction(action) {
    setShowMenu(false);
    action?.();
  }

  return (
    <nav className={styles.nav}>
     <button type="button"
      className={styles.logo}
      onClick={onHomeClick}
      aria-label="Go to home">
    <img
      src="/Pulselogo.png"
      alt="Pulse Opinion Logo"
      className={styles.logoImage}
     />

     <span>
      Pulse
     <span className={styles.logoAccent}>
      {" "}Opinion
     </span>
    </span>

      <span className={styles.badge}>BETA</span>
     </button>
      {/* <div className={styles.logo}>
        <img
          src="/Pulselogo.png"
          alt="Pulse Opinion Logo"
          className={styles.logoImage}
        />

        <span>
          Pulse
          <span className={styles.logoAccent}>
            {" "}Opinion
          </span>
        </span>

        <span className={styles.badge}>BETA</span>
      </div> */}

      <div className={styles.links}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={onTrendingClick}
        >
          Trending
        </button>

        <button
          type="button"
          className={styles.navBtn}
          onClick={onCategoriesClick}
        >
          Categories
        </button>

        <button
          type="button"
          className={styles.navBtn}
          onClick={onAboutClick}
        >
          About
        </button>

        <button
          type="button"
          className={styles.themeToggle}
          onClick={onThemeToggle}
          aria-label={
            theme === "dark"
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
          title={
            theme === "dark"
              ? "Light mode"
              : "Dark mode"
          }
        >
          <ThemeIcon theme={theme} />
        </button>

        {user ? (
<div
  className={styles.userMenu}
  ref={userMenuRef}
>
            <button
              type="button"
              className={styles.userProfile}
              onClick={() =>
                setShowMenu((value) => !value)
              }
            >
              <div className={styles.userAvatar}>
                {user.name.charAt(0).toUpperCase()}
              </div>

              <span>{user.name}</span>
              <span>{showMenu ? "⌃" : "⌄"}</span>
            </button>

            {showMenu && (
              <div className={styles.dropdown}>
                <button
                  onClick={() =>
                    handleMenuAction(onProfileClick)
                  }
                >
                  Profile
                </button>

                <button
                  onClick={() =>
                    handleMenuAction(onMyQuestionsClick)
                  }
                >
                  My Questions
                </button>

                {user?.role === "admin" && (
                  <button
                    onClick={() =>
                      handleMenuAction(onAdminClick)
                    }
                  >
                    Admin Dashboard
                  </button>
                )}

                <button
                  onClick={() =>
                    handleMenuAction(onLogout)
                  }
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            className={styles.loginBtn}
            onClick={onSignInClick}
          >
            Sign in
          </button>
        )}
      </div>
    </nav>
  );
}
// import { useState } from "react";
// import styles from "./Navbar.module.css";

// export default function Navbar({
//   onSignInClick,
//   user,
//   onLogout,
//   onTrendingClick,
//   onCategoriesClick,
//   onAboutClick,
//   onProfileClick,
//   onAdminClick,
//   onMyQuestionsClick,
// }) {
//   const [showMenu, setShowMenu] = useState(false);

//   function handleMenuAction(action) {
//     setShowMenu(false);
//     action?.();
//   }

//   return (
//     <nav className={styles.nav}>
//       <div className={styles.logo}>
//         <img
//           src="/Pulselogo.png"
//           alt="Pulse Opinion Logo"
//           className={styles.logoImage}
//         />

//         <span>
//           Pulse<span className={styles.logoAccent}> Opinion</span>
//         </span>

//         <span className={styles.badge}>BETA</span>
//       </div>

//       <div className={styles.links}>
//         <button
//           className={styles.navBtn}
//           onClick={onTrendingClick}
//         >
//           Trending
//         </button>

//         <button
//           className={styles.navBtn}
//           onClick={onCategoriesClick}
//         >
//           Categories
//         </button>

//         <button
//           className={styles.navBtn}
//           onClick={onAboutClick}
//         >
//           About
//         </button>

//         {user ? (
//           <div className={styles.userMenu}>
//             <button
//               className={styles.userProfile}
//               onClick={() => setShowMenu((v) => !v)}
//             >
//               <div className={styles.userAvatar}>
//                 {user.name.charAt(0).toUpperCase()}
//               </div>

//               <span>{user.name}</span>
//               <span>{showMenu ? "⌃" : "⌄"}</span>
//             </button>

//             {showMenu && (
//               <div className={styles.dropdown}>
//                 <button
//                   onClick={() => handleMenuAction(onProfileClick)}
//                 >
//                   Profile
//                 </button>

//                 <button
//                  onClick={() => handleMenuAction(onMyQuestionsClick)}>
//                  My Questions
//                  </button>

//                  {user?.role === "admin" && (
//                  <button
//                  onClick={() => handleMenuAction(onAdminClick)}>
//                  Admin Dashboard
//                  </button>
//                   )}
//                  <button
//                   onClick={() => handleMenuAction(onLogout)}>
//                  Logout
//                  </button>
//               </div>
//             )}
//           </div>
//         ) : (
//           <button
//             className={styles.loginBtn}
//             onClick={onSignInClick}
//           >
//             Sign in
//           </button>
//         )}
//       </div>
//     </nav>
//   );
// }

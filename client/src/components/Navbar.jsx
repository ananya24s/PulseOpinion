import styles from "./Navbar.module.css";
import { useState } from "react";

export default function Navbar({ onSignInClick, user, onLogout }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>
        <img
          src="/Pulselogo.png"
          alt="Pulse Opinion Logo"
          className={styles.logoImage}
        />

        <span>
          Pulse<span className={styles.logoAccent}> Opinion</span>
        </span>

        <span className={styles.badge}>BETA</span>
      </div>

      <div className={styles.links}>
        <a href="#" className={styles.link}>Trending</a>
        <a href="#" className={styles.link}>Categories</a>
        <a href="#" className={styles.link}>About</a>

        {user ? (
          <div className={styles.userMenu}>
            <button
              className={styles.userProfile}
              onClick={() => setShowMenu((v) => !v)}
            >
              <div className={styles.userAvatar}>
                {user.name.charAt(0).toUpperCase()}
              </div>

              <span>{user.name}</span>
              <span>⌄</span>
            </button>

            {showMenu && (
              <div className={styles.dropdown}>
                <button>Profile</button>
                <button>My Questions</button>
                <button onClick={onLogout}>Logout</button>
              </div>
            )}
          </div>
        ) : (
          <button
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
// import styles from "./Navbar.module.css";
// import { useState } from "react";
// export default function Navbar({ onSignInClick, user }) {
//   // export default function Navbar() {
//   const [showMenu, setShowMenu] = useState(false);
//   return (
//     <nav className={styles.nav}>
//       <div className={styles.logo}>
//         <img
//           src="/Pulselogo.png"
//           alt="Pulse Opinion Logo"
//           className={styles.logoImage}
//         />

//         <span>
//           Pulse<span className={styles.logoAccent}>  Opinion</span>
//         </span>

//         <span className={styles.badge}>BETA</span>
//       </div>

//       <div className={styles.links}>
//         <a href="#" className={styles.link}>
//           Trending
//         </a>

//         <a href="#" className={styles.link}>
//           Categories
//         </a>

//         <a href="#" className={styles.link}>
//           About
//         </a>
//        {user ? (
//        <div className={styles.userProfile}>
//        <div className={styles.userAvatar}>{user.name.charAt(0).toUpperCase()}</div>
//        <span>{user.name}</span>
//        </div>
//        ) : (
//       <button className={styles.loginBtn} onClick={onSignInClick}>  Sign in</button>)}
//         {/* <button className={styles.loginBtn}onClick={onSignInClick}>Sign in</button> */}
//       </div>
//     </nav>
//   );
// }

import styles from "./Navbar.module.css";
export default function Navbar({ onSignInClick }) {
// export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>
        <img
          src="/Pulselogo.png"
          alt="Pulse Opinion Logo"
          className={styles.logoImage}
        />

        <span>
          Pulse<span className={styles.logoAccent}>  Opinion</span>
        </span>

        <span className={styles.badge}>BETA</span>
      </div>

      <div className={styles.links}>
        <a href="#" className={styles.link}>
          Trending
        </a>

        <a href="#" className={styles.link}>
          Categories
        </a>

        <a href="#" className={styles.link}>
          About
        </a>

        <button className={styles.loginBtn}
  onClick={onSignInClick}
>
  Sign in
</button>
      </div>
    </nav>
  );
}
//old code
// import styles from './Navbar.module.css';

// export default function Navbar() {
//   return (
//     <nav className={styles.nav}>
//       <div className={styles.logo}>
//         Pulse<span className={styles.logoAccent}>Opinion</span>
//         <span className={styles.badge}>BETA</span>
//       </div>
//       <div className={styles.links}>
//         <a href="#" className={styles.link}>Trending</a>
//         <a href="#" className={styles.link}>Categories</a>
//         <a href="#" className={styles.link}>About</a>
//         <button className={styles.loginBtn}>Sign in</button>
//       </div>
//     </nav>
//   );
// }
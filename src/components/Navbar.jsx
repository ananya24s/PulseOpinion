import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>
        Pulse<span className={styles.logoAccent}>Opinion</span>
        <span className={styles.badge}>BETA</span>
      </div>
      <div className={styles.links}>
        <a href="#" className={styles.link}>Trending</a>
        <a href="#" className={styles.link}>Categories</a>
        <a href="#" className={styles.link}>About</a>
        <button className={styles.loginBtn}>Sign in</button>
      </div>
    </nav>
  );
}

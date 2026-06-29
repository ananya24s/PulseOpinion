import './styles/global.css';
import Navbar from './components/Navbar';
import QuestionForm from './components/QuestionForm';
import QuestionCard from './components/QuestionCard';
import { sampleQuestions } from './data/sampleData';
import styles from './App.module.css';

export default function App() {
  return (
    <div>
      <Navbar />
      <main className={styles.container}>
        {/* Page Header */}
        <header className={styles.header}>
          <h1 className={styles.heading}>
            What's on your <em className={styles.headingAccent}>mind?</em>
          </h1>
          <p className={styles.subtitle}>
            Ask questions, spark debates, and discover what the public really
            thinks — no sign-up needed.
          </p>
        </header>

        {/* Ask Question Section */}
        <QuestionForm />

        {/* Feed */}
        <div className={styles.sectionLabel}>
          <span>Trending Discussions</span>
        </div>

        <section aria-label="Questions feed">
          {sampleQuestions.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </section>
      </main>
    </div>
  );
}
// export default function App() {
//   return <h1>Hello React</h1>;
// }
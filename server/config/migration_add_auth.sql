-- ── 1. users table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100)    NOT NULL,
  email         VARCHAR(255)    NOT NULL,
  password_hash VARCHAR(255)    NOT NULL,  -- store bcrypt hash, never plaintext
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE  INDEX uq_email      (email),     -- login lookup + enforces one account per email
  INDEX         idx_created_at (created_at DESC)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ── 2. Add user_id to questions ───────────────────────────────────────────────
-- NULL means the question was posted before auth existed (or anonymously).
ALTER TABLE questions
  ADD COLUMN user_id INT UNSIGNED NULL DEFAULT NULL
    AFTER author,
  ADD CONSTRAINT fk_questions_user
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE SET NULL   -- if a user is deleted, their questions stay but lose the link
    ON UPDATE CASCADE,
  ADD INDEX idx_questions_user_id (user_id);

-- ── 3. Add user_id to comments ────────────────────────────────────────────────
ALTER TABLE comments
  ADD COLUMN user_id INT UNSIGNED NULL DEFAULT NULL
    AFTER author,
  ADD CONSTRAINT fk_comments_user
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE SET NULL   -- same policy: comments survive user deletion
    ON UPDATE CASCADE,
  ADD INDEX idx_comments_user_id (user_id);
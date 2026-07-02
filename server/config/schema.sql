-- =============================================================================
-- PulseOpinion — MySQL Schema + Seed Data
-- Database: pulse_opinion
-- =============================================================================
-- Run with:
--   mysql -u root -p pulse_opinion < schema.sql
-- =============================================================================
 
-- Safety: drop tables in reverse dependency order before recreating them.
-- This makes the file safe to re-run during development.
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS questions;
SET FOREIGN_KEY_CHECKS = 1;
-- =============================================================================
-- TABLE: questions
-- =============================================================================
CREATE TABLE questions (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  author        VARCHAR(100)    NOT NULL,
  question_text VARCHAR(500)    NOT NULL,
  category      ENUM(
                  'General',
                  'Politics',
                  'Technology',
                  'Education',
                  'Sports',
                  'Entertainment',
                  'Business'
                )               NOT NULL DEFAULT 'General',
  likes         INT UNSIGNED    NOT NULL DEFAULT 0,
  dislikes      INT UNSIGNED    NOT NULL DEFAULT 0,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
  PRIMARY KEY (id),
 
  -- Speed up feed queries that sort by newest first
  INDEX idx_created_at (created_at DESC),
 
  -- Speed up category filtering
  INDEX idx_category  (category),
 
  -- Speed up "most liked" sort
  INDEX idx_likes     (likes DESC)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4       -- full Unicode (handles emoji, Devanagari, etc.)
  COLLATE=utf8mb4_unicode_ci;
 
-- =============================================================================
-- TABLE: comments
-- =============================================================================
CREATE TABLE comments (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  question_id   INT UNSIGNED    NOT NULL,
  author        VARCHAR(100)    NOT NULL,
  comment_text  TEXT            NOT NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
  PRIMARY KEY (id),
 
  -- Foreign key — links every comment to its parent question.
  -- ON DELETE CASCADE means deleting a question automatically deletes
  -- all its comments, keeping the database consistent with no orphan rows.
  CONSTRAINT fk_comments_question
    FOREIGN KEY (question_id)
    REFERENCES questions (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
 
  -- Fetching all comments for a question is the most common query here
  INDEX idx_question_id (question_id),
  INDEX idx_created_at  (created_at DESC)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
 
-- =============================================================================
-- SEED DATA: questions
-- =============================================================================
INSERT INTO questions (author, question_text, category, likes, dislikes, created_at) VALUES
 
(
  'Sneha P.',
  'Will Artificial Intelligence replace software engineers entirely within the next decade?',
  'Technology',
  892,
  654,
  DATE_SUB(NOW(), INTERVAL 5 HOUR)
),
 
(
  'Rahul M.',
  'Will BJP come to power again in the next general elections?',
  'Politics',
  1240,
  387,
  DATE_SUB(NOW(), INTERVAL 2 HOUR)
),
 
(
  'Nisha R.',
  'Should coding be made a compulsory subject from Class 6 onwards in all Indian schools?',
  'Education',
  1560,
  220,
  DATE_SUB(NOW(), INTERVAL 4 DAY)
),
 
(
  'Arjun T.',
  'Should India adopt a Universal Basic Income to address unemployment caused by automation?',
  'Business',
  567,
  210,
  DATE_SUB(NOW(), INTERVAL 1 DAY)
),
 
(
  'Karan B.',
  'Are OTT platforms like Netflix and Prime killing the magic of Bollywood cinema?',
  'Entertainment',
  980,
  340,
  DATE_SUB(NOW(), INTERVAL 5 DAY)
);
 
-- =============================================================================
-- SEED DATA: comments
-- =============================================================================
-- question 1 — AI replacing engineers (id = 1)
INSERT INTO comments (question_id, author, comment_text, created_at) VALUES
 
(
  1,
  'Dev R.',
  'Replace entirely? No. But it will radically change what engineers spend time on — more architecture, less boilerplate.',
  DATE_SUB(NOW(), INTERVAL 4 HOUR)
),
(
  1,
  'Meera K.',
  'We said the same about accountants and paralegals. AI is different — it learns faster than the industry can adapt.',
  DATE_SUB(NOW(), INTERVAL 3 HOUR)
),
(
  1,
  'Priya S.',
  'The real threat is not AI itself but engineers who know how to use AI outcompeting those who do not.',
  DATE_SUB(NOW(), INTERVAL 2 HOUR)
),
 
-- question 2 — BJP elections (id = 2)
(
  2,
  'Ankit V.',
  'Seat prediction is one thing, but voter sentiment in UP and Maharashtra could surprise everyone. Too early to call.',
  DATE_SUB(NOW(), INTERVAL 90 MINUTE)
),
(
  2,
  'Leena D.',
  'The opposition needs a credible coalition fast. Right now they are fighting each other more than the ruling party.',
  DATE_SUB(NOW(), INTERVAL 45 MINUTE)
),
 
-- question 3 — Coding in schools (id = 3)
(
  3,
  'Amit D.',
  'Absolutely. Digital literacy is no longer optional. But we also need trained teachers before we add it to the curriculum.',
  DATE_SUB(NOW(), INTERVAL 3 DAY)
),
(
  3,
  'Sunita M.',
  'Rural schools still struggle with basic infrastructure. Coding can wait — electricity and reliable internet cannot.',
  DATE_SUB(NOW(), INTERVAL 2 DAY)
),
 
-- question 4 — Universal Basic Income (id = 4)
(
  4,
  'Kavya N.',
  'The fiscal math is challenging but not impossible. A small UBI pilot in select districts could prove the concept first.',
  DATE_SUB(NOW(), INTERVAL 20 HOUR)
),
 
-- question 5 — OTT vs Bollywood (id = 5)
(
  5,
  'Prerna J.',
  'OTT gave us better storytelling with no box office pressure. Bollywood needed this disruption.',
  DATE_SUB(NOW(), INTERVAL 4 DAY)
),
(
  5,
  'Vikram S.',
  'The theatrical experience is irreplaceable. The problem is Bollywood stopped taking creative risks, not OTT itself.',
  DATE_SUB(NOW(), INTERVAL 3 DAY)
);
 
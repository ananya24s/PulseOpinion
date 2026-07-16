import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./QuestionForm.module.css";

export const CATEGORIES = [
  "General",
  "Politics",
  "Technology",
  "Education",
  "Sports",
  "Entertainment",
  "Business",
];

const MAX_CHARS = 250;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const DUPLICATE_DEBOUNCE_MS = 650;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const API_BASE =
  import.meta.env.VITE_API_BASE_URL;

function getAuthToken() {
  return (
    localStorage.getItem("pulseToken") ||
    sessionStorage.getItem("pulseToken")
  );
}

function createReviewItems(
  questions,
  duplicateResults = []
) {
  return questions.map((question, index) => {
    const matches =
      duplicateResults[index]?.matches ?? [];

    return {
      id: `${Date.now()}-${index}`,
      text: question,
      selected: matches.length === 0,
      duplicateMatches: matches,
    };
  });
}

export default function QuestionForm({
  onSubmit,
}) {
  const [text, setText] = useState("");
  const [category, setCategory] =
    useState("General");
  const [error, setError] = useState("");
  const [attachment, setAttachment] =
    useState(null);
  const [previewUrl, setPreviewUrl] =
    useState("");
  const [isAnalyzing, setIsAnalyzing] =
    useState(false);
  const [reviewQuestions, setReviewQuestions] =
    useState([]);
  const [importMessage, setImportMessage] =
    useState("");

  const [
    manualDuplicateMatches,
    setManualDuplicateMatches,
  ] = useState([]);

  const [
    isCheckingDuplicates,
    setIsCheckingDuplicates,
  ] = useState(false);

  const [
    allowDuplicatePost,
    setAllowDuplicatePost,
  ] = useState(false);

  const fileInputRef = useRef(null);
  const duplicateRequestRef = useRef(0);

  const charCount = text.length;

  const selectedQuestions = useMemo(
    () =>
      reviewQuestions.filter(
        (question) =>
          question.selected &&
          question.text.trim().length >= 10 &&
          question.text.trim().length <=
            MAX_CHARS
      ),
    [reviewQuestions]
  );

  const duplicateReviewCount = useMemo(
    () =>
      reviewQuestions.filter(
        (question) =>
          question.duplicateMatches?.length > 0
      ).length,
    [reviewQuestions]
  );

  const allSelected =
    reviewQuestions.length > 0 &&
    reviewQuestions.every(
      (question) => question.selected
    );

  const isReviewMode =
    reviewQuestions.length > 0;

  const isInvalid =
    charCount < 10 ||
    charCount > MAX_CHARS ||
    isAnalyzing ||
    isReviewMode;

  useEffect(() => {
    if (
      !attachment ||
      !attachment.type.startsWith("image/")
    ) {
      setPreviewUrl("");
      return;
    }

    const objectUrl =
      URL.createObjectURL(attachment);

    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [attachment]);

  useEffect(() => {
    const trimmed = text.trim();

    setAllowDuplicatePost(false);

    if (
      trimmed.length < 10 ||
      trimmed.length > MAX_CHARS ||
      isReviewMode
    ) {
      setManualDuplicateMatches([]);
      setIsCheckingDuplicates(false);
      return;
    }

    const requestId =
      duplicateRequestRef.current + 1;

    duplicateRequestRef.current = requestId;

    const timer = window.setTimeout(
      async () => {
        setIsCheckingDuplicates(true);

        try {
          const results =
            await checkDuplicates([
              trimmed,
            ]);

          if (
            requestId ===
            duplicateRequestRef.current
          ) {
            setManualDuplicateMatches(
              results[0]?.matches ?? []
            );
          }
        } catch (duplicateError) {
          console.error(
            "Duplicate check failed:",
            duplicateError
          );
        } finally {
          if (
            requestId ===
            duplicateRequestRef.current
          ) {
            setIsCheckingDuplicates(false);
          }
        }
      },
      DUPLICATE_DEBOUNCE_MS
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [text, isReviewMode]);

  async function checkDuplicates(
    questions
  ) {
    const token = getAuthToken();

    const response = await fetch(
      `${API_BASE}/questions/check-duplicates`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },
        body: JSON.stringify({
          questions,
        }),
      }
    );

    const json = await response.json();

    if (!response.ok) {
      throw new Error(
        json.message ||
          "Could not check for similar discussions."
      );
    }

    return json.data;
  }

  async function analyzeFile(file) {
    const token = getAuthToken();

    if (!token) {
      throw new Error(
        "Please sign in before analyzing an attachment."
      );
    }

    const formData = new FormData();
    formData.append("attachment", file);

    const response = await fetch(
      `${API_BASE}/questions/analyze-attachment`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const json = await response.json();

    if (!response.ok) {
      throw new Error(
        json.message ||
          "Could not analyze attachment."
      );
    }

    return json.data;
  }

  async function importQuestions(questions) {
    const token = getAuthToken();

    if (!token) {
      throw new Error(
        "Please sign in before importing questions."
      );
    }

    const response = await fetch(
      `${API_BASE}/questions/import`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          questions,
          category,
        }),
      }
    );

    const json = await response.json();

    if (!response.ok) {
      throw new Error(
        json.message ||
          "Could not import questions."
      );
    }

    return json.data;
  }

  async function handleFileChange(event) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(
        "Upload a JPEG, PNG, WebP, or PDF file."
      );
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(
        "Attachment must be 10 MB or smaller."
      );
      event.target.value = "";
      return;
    }

    setAttachment(file);
    setReviewQuestions([]);
    setError("");
    setImportMessage("");
    setIsAnalyzing(true);

    try {
      const result =
        await analyzeFile(file);

      const detected =
        Array.isArray(result?.questions)
          ? result.questions
              .map((question) =>
                typeof question === "string"
                  ? question.trim()
                  : ""
              )
              .filter(
                (question) =>
                  question.length >= 10 &&
                  question.length <=
                    MAX_CHARS
              )
          : [];

      if (detected.length === 0) {
        throw new Error(
          "No valid questions were detected in this document."
        );
      }

      const duplicateResults =
        await checkDuplicates(detected);

      const reviewItems =
        createReviewItems(
          detected,
          duplicateResults
        );

      const duplicateCount =
        reviewItems.filter(
          (question) =>
            question.duplicateMatches.length > 0
        ).length;

      setReviewQuestions(reviewItems);

      setImportMessage(
        duplicateCount > 0
          ? `${detected.length} questions detected. ${duplicateCount} possible duplicates were deselected.`
          : `${detected.length} questions detected. Review them before importing.`
      );
    } catch (analysisError) {
      setError(
        analysisError.message ||
          "Could not analyze the attachment."
      );
      setAttachment(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setIsAnalyzing(false);
    }
  }

  function updateQuestionText(id, value) {
    setReviewQuestions((current) =>
      current.map((question) =>
        question.id === id
          ? {
              ...question,
              text: value,
              duplicateMatches: [],
            }
          : question
      )
    );
  }

  function toggleQuestion(id) {
    setReviewQuestions((current) =>
      current.map((question) =>
        question.id === id
          ? {
              ...question,
              selected:
                !question.selected,
            }
          : question
      )
    );
  }

  function toggleAllQuestions() {
    const nextSelected = !allSelected;

    setReviewQuestions((current) =>
      current.map((question) => ({
        ...question,
        selected: nextSelected,
      }))
    );
  }

  function deleteQuestionFromReview(id) {
    setReviewQuestions((current) =>
      current.filter(
        (question) =>
          question.id !== id
      )
    );
  }

  function removeAttachment() {
    setAttachment(null);
    setPreviewUrl("");
    setReviewQuestions([]);
    setImportMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleImportQuestions() {
    if (selectedQuestions.length === 0) {
      setError(
        "Select at least one valid question to import."
      );
      return;
    }

    try {
      setError("");
      setIsAnalyzing(true);
      setImportMessage(
        `Importing ${selectedQuestions.length} questions…`
      );

      await importQuestions(
        selectedQuestions.map(
          (question) =>
            question.text.trim()
        )
      );

      setImportMessage(
        `${selectedQuestions.length} questions imported successfully.`
      );

      window.setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (importError) {
      setError(
        importError.message ||
          "Could not import questions."
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSubmit() {
    const trimmed = text.trim();

    if (isAnalyzing) {
      return;
    }

    if (trimmed.length < 10) {
      setError(
        "Please enter a question (at least 10 characters)."
      );
      return;
    }

    if (trimmed.length > MAX_CHARS) {
      setError(
        `Question must be ${MAX_CHARS} characters or fewer.`
      );
      return;
    }

    try {
      setError("");

      if (!allowDuplicatePost) {
        const duplicateResults =
          await checkDuplicates([
            trimmed,
          ]);

        const matches =
          duplicateResults[0]?.matches ??
          [];

        setManualDuplicateMatches(matches);

        if (matches.length > 0) {
          setError(
            "A similar discussion already exists. Review it or choose Post anyway."
          );
          return;
        }
      }

      await onSubmit(
        trimmed,
        category,
        null,
        ""
      );

      setText("");
      setCategory("General");
      setError("");
      setManualDuplicateMatches([]);
      setAllowDuplicatePost(false);
    } catch (submitError) {
      setError(
        submitError.message ||
          "Could not post question."
      );
    }
  }

  return (
    <div className={styles.card}>
      <label
        className={styles.label}
        htmlFor="question-input"
      >
        Ask a question
      </label>

      <textarea
        id="question-input"
        className={`${styles.textarea} ${
          error
            ? styles.textareaError
            : ""
        } ${
          charCount > MAX_CHARS
            ? styles.textareaError
            : ""
        }`}
        placeholder="e.g. Will renewable energy replace fossil fuels by 2040?"
        rows={5}
        value={text}
        onChange={(event) => {
          setText(event.target.value);

          if (error) {
            setError("");
          }
        }}
        disabled={
          isAnalyzing ||
          isReviewMode
        }
      />

      <div className={styles.charRow}>
        <span
          className={
            charCount > MAX_CHARS
              ? styles.charCountOver
              : styles.charCount
          }
        >
          {isCheckingDuplicates
            ? "Checking similar discussions…"
            : `${charCount} / ${MAX_CHARS}`}
        </span>
      </div>

      {manualDuplicateMatches.length > 0 &&
        !isReviewMode && (
          <section
            className={
              styles.duplicateWarning
            }
            aria-label="Similar discussions"
          >
            <div
              className={
                styles.duplicateWarningHeader
              }
            >
              <div>
                <span>
                  Similar discussion found
                </span>
                <p>
                  Joining an existing discussion
                  keeps responses in one place.
                </p>
              </div>

              <strong>
                {
                  manualDuplicateMatches[0]
                    .similarity
                }
                % match
              </strong>
            </div>

            <div
              className={
                styles.duplicateMatchList
              }
            >
              {manualDuplicateMatches.map(
                (match) => (
                  <div
                    key={match.id}
                    className={
                      styles.duplicateMatch
                    }
                  >
                    <p>{match.text}</p>

                    <span>
                      {match.category} ·{" "}
                      {match.commentCount}{" "}
                      comments
                      {match.verificationScore !=
                      null
                        ? ` · ${match.verificationScore}% verified`
                        : ""}
                    </span>
                  </div>
                )
              )}
            </div>

            <button
              type="button"
              className={
                styles.postAnywayBtn
              }
              onClick={() => {
                setAllowDuplicatePost(true);
                setError("");
              }}
            >
              {allowDuplicatePost
                ? "Post anyway enabled"
                : "Post anyway"}
            </button>
          </section>
        )}

      {isAnalyzing && (
        <div
          className={styles.analysisStatus}
        >
          <span
            className={styles.analysisSpinner}
          />
          <span>
            {importMessage ||
              "AI is analyzing your attachment…"}
          </span>
        </div>
      )}

      {importMessage &&
        !isAnalyzing && (
          <div
            className={
              styles.analysisStatus
            }
          >
            <span>{importMessage}</span>
          </div>
        )}

      {isReviewMode && (
        <section
          className={styles.reviewPanel}
          aria-label="Review extracted questions"
        >
          <div
            className={styles.reviewHeader}
          >
            <div>
              <span
                className={
                  styles.reviewEyebrow
                }
              >
                Review before import
              </span>

              <h3>
                {reviewQuestions.length}{" "}
                questions detected
              </h3>

              <p>
                Edit, remove, or deselect
                anything the AI extracted
                incorrectly.
              </p>

              {duplicateReviewCount > 0 && (
                <p
                  className={
                    styles.duplicateReviewSummary
                  }
                >
                  {duplicateReviewCount} possible{" "}
                  {duplicateReviewCount === 1
                    ? "duplicate was"
                    : "duplicates were"}{" "}
                  found and automatically
                  deselected.
                </p>
              )}
            </div>

            <button
              type="button"
              className={
                styles.selectAllBtn
              }
              onClick={toggleAllQuestions}
            >
              {allSelected
                ? "Deselect all"
                : "Select all"}
            </button>
          </div>

          <div
            className={styles.reviewList}
          >
            {reviewQuestions.map(
              (question, index) => {
                const length =
                  question.text.length;

                const invalid =
                  length < 10 ||
                  length > MAX_CHARS;

                const topDuplicate =
                  question
                    .duplicateMatches?.[0];

                return (
                  <div
                    key={question.id}
                    className={`${styles.reviewItem} ${
                      !question.selected
                        ? styles.reviewItemInactive
                        : ""
                    } ${
                      topDuplicate
                        ? styles.reviewItemDuplicate
                        : ""
                    }`}
                  >
                    <label
                      className={
                        styles.reviewCheckbox
                      }
                    >
                      <input
                        type="checkbox"
                        checked={
                          question.selected
                        }
                        onChange={() =>
                          toggleQuestion(
                            question.id
                          )
                        }
                      />

                      <span>
                        {index + 1}
                      </span>
                    </label>

                    <div
                      className={
                        styles.reviewEditor
                      }
                    >
                      <textarea
                        value={question.text}
                        rows={3}
                        maxLength={
                          MAX_CHARS + 50
                        }
                        disabled={
                          !question.selected ||
                          isAnalyzing
                        }
                        className={
                          invalid
                            ? styles.reviewTextareaError
                            : ""
                        }
                        onChange={(event) =>
                          updateQuestionText(
                            question.id,
                            event.target.value
                          )
                        }
                        aria-label={`Question ${
                          index + 1
                        }`}
                      />

                      {topDuplicate && (
                        <div
                          className={
                            styles.reviewDuplicateMatch
                          }
                        >
                          <div>
                            <strong>
                              Possible duplicate ·{" "}
                              {
                                topDuplicate.similarity
                              }
                              %
                            </strong>

                            <p>
                              {
                                topDuplicate.text
                              }
                            </p>

                            <span>
                              {
                                topDuplicate.category
                              }{" "}
                              ·{" "}
                              {
                                topDuplicate.commentCount
                              }{" "}
                              comments
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setReviewQuestions(
                                (current) =>
                                  current.map(
                                    (item) =>
                                      item.id ===
                                      question.id
                                        ? {
                                            ...item,
                                            duplicateMatches:
                                              [],
                                            selected:
                                              true,
                                          }
                                        : item
                                  )
                              )
                            }
                          >
                            Import anyway
                          </button>
                        </div>
                      )}

                      <div
                        className={
                          styles.reviewItemFooter
                        }
                      >
                        <span
                          className={
                            invalid
                              ? styles.reviewCountError
                              : ""
                          }
                        >
                          {length} /{" "}
                          {MAX_CHARS}
                        </span>

                        <button
                          type="button"
                          className={
                            styles.deleteReviewBtn
                          }
                          onClick={() =>
                            deleteQuestionFromReview(
                              question.id
                            )
                          }
                          aria-label={`Delete question ${
                            index + 1
                          }`}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>

          <div
            className={
              styles.reviewActions
            }
          >
            <div>
              <strong>
                {selectedQuestions.length}
              </strong>{" "}
              selected for import
            </div>

            <div
              className={
                styles.reviewActionButtons
              }
            >
              <button
                type="button"
                className={
                  styles.cancelReviewBtn
                }
                onClick={removeAttachment}
                disabled={isAnalyzing}
              >
                Cancel
              </button>

              <button
                type="button"
                className={styles.importBtn}
                onClick={
                  handleImportQuestions
                }
                disabled={
                  isAnalyzing ||
                  selectedQuestions.length === 0
                }
              >
                Import{" "}
                {selectedQuestions.length}{" "}
                Questions
              </button>
            </div>
          </div>
        </section>
      )}

      {attachment && (
        <div
          className={
            styles.attachmentPreview
          }
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Attachment preview"
              className={
                styles.previewImage
              }
            />
          ) : (
            <div
              className={
                styles.pdfPreview
              }
            >
              <span
                className={
                  styles.pdfIcon
                }
              >
                PDF
              </span>

              <div
                className={
                  styles.fileInfo
                }
              >
                <strong>
                  {attachment.name}
                </strong>

                <span>
                  {(
                    attachment.size /
                    1024 /
                    1024
                  ).toFixed(2)}{" "}
                  MB
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            className={
              styles.removeAttachmentBtn
            }
            onClick={removeAttachment}
            disabled={isAnalyzing}
            aria-label="Remove attachment"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <p className={styles.errorMsg}>
          {error}
        </p>
      )}

      <div className={styles.footer}>
        <div
          className={styles.footerLeft}
        >
          <select
            className={
              styles.categorySelect
            }
            value={category}
            disabled={isAnalyzing}
            onChange={(event) =>
              setCategory(
                event.target.value
              )
            }
            aria-label="Select category"
          >
            {CATEGORIES.map((cat) => (
              <option
                key={cat}
                value={cat}
              >
                {cat}
              </option>
            ))}
          </select>

          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            className={styles.fileInput}
            onChange={handleFileChange}
          />

          <button
            type="button"
            className={
              styles.attachBtn
            }
            disabled={isAnalyzing}
            onClick={() =>
              fileInputRef.current?.click()
            }
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>

            {isAnalyzing
              ? "Working..."
              : attachment
              ? "Replace file"
              : "Attach"}
          </button>
        </div>

        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={isInvalid}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line
              x1="22"
              y1="2"
              x2="11"
              y2="13"
            />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>

          {allowDuplicatePost
            ? "Post Anyway"
            : "Ask Question"}
        </button>
      </div>
    </div>
  );
}

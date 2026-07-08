import {
  useEffect,
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

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const API_BASE = "http://localhost:5001/api";

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

  const [aiContext, setAiContext] =
   useState("");

  const fileInputRef = useRef(null);

  const charCount = text.length;

  const isInvalid =
    charCount < 10 ||
    charCount > MAX_CHARS ||
    isAnalyzing;

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

  async function analyzeFile(file) {
    const token = localStorage.getItem(
      "pulseToken"
    );

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

    return json.data.extractedText;
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];

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
    setError("");
    setIsAnalyzing(true);

    try {
      const extractedText =
        await analyzeFile(file);

      setAiContext(extractedText);
    } catch (analysisError) {
      setError(
        analysisError.message ||
          "Could not analyze attachment."
      );
    } finally {
      setIsAnalyzing(false);
    }
  }
  function removeAttachment() {
   setAttachment(null);
   setPreviewUrl("");
   setAiContext("");

   if (fileInputRef.current) {
    fileInputRef.current.value = "";
   }
  }
  // function removeAttachment() {
  //   setAttachment(null);
  //   setPreviewUrl("");

  //   if (fileInputRef.current) {
  //     fileInputRef.current.value = "";
  //   }
  // }

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
      await onSubmit(
        trimmed,
        category,
        attachment,
        aiContext
      );

      setText("");
      setCategory("General");
      setError("");
      removeAttachment();
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
          error ? styles.textareaError : ""
        } ${
          charCount > MAX_CHARS
            ? styles.textareaError
            : ""
        }`}
        placeholder="e.g. Will renewable energy replace fossil fuels by 2040?"
        // placeholder={
        //   isAnalyzing
        //     ? "AI is analyzing your attachment..."
        //     : "e.g. Will renewable energy replace fossil fuels by 2040?"
        // }
        rows={5}
        value={text}
        // disabled={isAnalyzing}
        onChange={(event) => {
          setText(event.target.value);

          if (error) {
            setError("");
          }
        }}
      />

      <div className={styles.charRow}>
        <span
          className={
            charCount > MAX_CHARS
              ? styles.charCountOver
              : styles.charCount
          }
        >
          {charCount} / {MAX_CHARS}
        </span>
      </div>

      {isAnalyzing && (
        <div className={styles.analysisStatus}>
          <span
            className={styles.analysisSpinner}
          />

          <span>
            AI is analyzing your attachment…
          </span>
        </div>
      )}

      {aiContext && !isAnalyzing && (
        <div className={styles.aiContextBox}>
          <div className={styles.aiContextHeader}>
        <div>
         <span className={styles.aiContextTitle}>
           ✨ AI-extracted context
         </span>

         <span className={styles.aiContextHint}>
           Review and edit before posting
         </span>
        </div>

         <span className={styles.aiContextCount}>
          {aiContext.length} characters
         </span>
        </div>

      <textarea
       className={styles.aiContextTextarea}
       value={aiContext}
       rows={7}
       onChange={(event) =>
        setAiContext(event.target.value)
       }
       aria-label="AI extracted context"
       />
       </div>
     )}

      {attachment && (
        <div
          className={styles.attachmentPreview}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Attachment preview"
              className={styles.previewImage}
            />
          ) : (
            <div className={styles.pdfPreview}>
              <span className={styles.pdfIcon}>
                PDF
              </span>

              <div className={styles.fileInfo}>
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
        <div className={styles.footerLeft}>
          <select
            className={styles.categorySelect}
            value={category}
            disabled={isAnalyzing}
            onChange={(event) =>
              setCategory(event.target.value)
            }
            aria-label="Select category"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
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
            className={styles.attachBtn}
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
              ? "Analyzing..."
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

          Ask Question
        </button>
      </div>
    </div>
  );
}
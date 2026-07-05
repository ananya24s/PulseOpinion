import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './SignInModal.module.css';

function FormField({
  id,
  label,
  type,
  value,
  onChange,
  error,
  autoComplete,
  children,
  inputRef,
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>

      <div className={styles.inputWrap}>
        <input
          ref={inputRef}
          id={id}
          className={`${styles.input} ${error ? styles.inputError : ''}`}
          type={type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={!!error}
        />

        {children}
      </div>

      {error && (
        <p
          id={`${id}-error`}
          className={styles.fieldError}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default function SignInModal({
  isOpen,
  onClose,
  triggerRef,
  onLogin,
}) {
  // login | register
  const [mode, setMode] = useState('login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');

  const firstInputRef = useRef(null);
  const panelRef = useRef(null);

  // Focus first field whenever modal opens or mode changes
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 60);

    return () => clearTimeout(timer);
  }, [isOpen, mode]);

  const resetForm = useCallback(() => {
    setMode('login');
    setName('');
    setEmail('');
    setPassword('');
    setRememberMe(false);
    setShowPassword(false);
    setSubmitting(false);

    setNameError('');
    setEmailError('');
    setPasswordError('');
    setFormError('');
  }, []);

  const handleClose = useCallback(() => {
    onClose();

    setTimeout(() => {
      triggerRef?.current?.focus();
    }, 50);
  }, [onClose, triggerRef]);

  // Escape key + focus trap
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }

      if (e.key === 'Tab') {
        const panel = panelRef.current;
        if (!panel) return;

        const focusable = panel.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }

  function validateName(value) {
    if (mode !== 'register') return '';

    if (!value.trim()) {
      return 'Name is required.';
    }

    if (value.trim().length < 2) {
      return 'Name must be at least 2 characters.';
    }

    if (value.trim().length > 100) {
      return 'Name must be 100 characters or fewer.';
    }

    return '';
  }

  function validateEmail(value) {
    if (!value.trim()) {
      return 'Email is required.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      return 'Enter a valid email address.';
    }

    return '';
  }

  function validatePassword(value) {
    if (!value) {
      return 'Password is required.';
    }

    if (value.length < 6) {
      return 'Password must be at least 6 characters.';
    }

    return '';
  }

  const canSubmit =
    email.trim().length > 0 &&
    password.length > 0 &&
    (mode === 'login' || name.trim().length > 0) &&
    !submitting;

  async function loginUser() {
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/auth/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      }
    );

    const json = await res.json();

    if (!res.ok) {
      throw new Error(
        json.message || 'Sign in failed.'
      );
    }

    return json;
  }

  async function registerUser() {
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/auth/register`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      }
    );

    const json = await res.json();

    if (!res.ok) {
      throw new Error(
        json.message || 'Could not create account.'
      );
    }

    return json;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setFormError('');

    const nErr = validateName(name);
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);

    setNameError(nErr);
    setEmailError(eErr);
    setPasswordError(pErr);

    if (nErr || eErr || pErr) {
      return;
    }

    setSubmitting(true);

    try {
      // REGISTER FLOW
      if (mode === 'register') {
        await registerUser();

        // Automatically log in after successful registration
        const loginJson = await loginUser();

        onLogin(
          loginJson.data,
          loginJson.token,
          rememberMe
        );

        handleClose();
        return;
      }

      // LOGIN FLOW
      const loginJson = await loginUser();

      onLogin(
        loginJson.data,
        loginJson.token,
        rememberMe
      );

      handleClose();
    } catch (err) {
      setFormError(
        err.message || 'Something went wrong.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode() {
    setMode((current) =>
      current === 'login' ? 'register' : 'login'
    );

    setName('');
    setPassword('');

    setNameError('');
    setEmailError('');
    setPasswordError('');
    setFormError('');
    setShowPassword(false);
  }

  // Reset after modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  if (!isOpen) return null;

  const isRegister = mode === 'register';

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={styles.panel}
        ref={panelRef}
      >
        {/* Close button */}
        <button
          type="button"
          className={styles.closeBtn}
          onClick={handleClose}
          aria-label={
            isRegister
              ? 'Close create account modal'
              : 'Close sign in modal'
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line
              x1="18"
              y1="6"
              x2="6"
              y2="18"
            />
            <line
              x1="6"
              y1="6"
              x2="18"
              y2="18"
            />
          </svg>
        </button>

        {/* Branding */}
        <div className={styles.brand}>
          <span className={styles.brandName}>
            Pulse
            <span className={styles.brandAccent}>
              Opinion
            </span>
          </span>

          <span className={styles.brandBadge}>
            BETA
          </span>
        </div>

        {/* Heading */}
        <h2
          id="modal-title"
          className={styles.heading}
        >
          {isRegister
            ? 'Create your account'
            : 'Welcome back'}
        </h2>

        <p className={styles.subheading}>
          {isRegister
            ? 'Join the discussion and share your opinion'
            : 'Sign in to join the discussion'}
        </p>

        {/* General server/API error */}
        {formError && (
          <p
            className={styles.fieldError}
            role="alert"
          >
            {formError}
          </p>
        )}

        <form
          className={styles.form}
          onSubmit={handleSubmit}
          noValidate
        >
          {/* Name field - registration only */}
          {isRegister && (
            <FormField
              id="signup-name"
              label="Name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);

                if (nameError) {
                  setNameError('');
                }

                if (formError) {
                  setFormError('');
                }
              }}
              error={nameError}
              autoComplete="name"
              inputRef={firstInputRef}
            />
          )}

          {/* Email field */}
          <FormField
            id={
              isRegister
                ? 'signup-email'
                : 'signin-email'
            }
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);

              if (emailError) {
                setEmailError('');
              }

              if (formError) {
                setFormError('');
              }
            }}
            error={emailError}
            autoComplete="email"
            inputRef={
              isRegister
                ? undefined
                : firstInputRef
            }
          />

          {/* Password */}
          <FormField
            id={
              isRegister
                ? 'signup-password'
                : 'signin-password'
            }
            label="Password"
            type={
              showPassword
                ? 'text'
                : 'password'
            }
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);

              if (passwordError) {
                setPasswordError('');
              }

              if (formError) {
                setFormError('');
              }
            }}
            error={passwordError}
            autoComplete={
              isRegister
                ? 'new-password'
                : 'current-password'
            }
          >
            <button
              type="button"
              className={styles.eyeBtn}
              onClick={() =>
                setShowPassword((v) => !v)
              }
              aria-label={
                showPassword
                  ? 'Hide password'
                  : 'Show password'
              }
            >
              {showPassword ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line
                    x1="1"
                    y1="1"
                    x2="23"
                    y2="23"
                  />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                  />
                </svg>
              )}
            </button>
          </FormField>

          {/* Remember me */}
          <div className={styles.rememberRow}>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={rememberMe}
                onChange={(e) =>
                  setRememberMe(e.target.checked)
                }
              />

              <span>Remember me</span>
            </label>

            {!isRegister && (
              <a
                href="#"
                className={styles.forgotLink}
                onClick={(e) => e.preventDefault()}
              >
                Forgot password?
              </a>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={!canSubmit}
          >
            {submitting
              ? isRegister
                ? 'Creating Account...'
                : 'Signing In...'
              : isRegister
              ? 'Create Account'
              : 'Sign In'}
          </button>

          {/* Divider */}
          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>
              or
            </span>
            <span className={styles.dividerLine} />
          </div>

          {/* Google button - intentionally disabled */}
          <button
            type="button"
            className={styles.googleBtn}
            disabled
            title="Google sign-in coming soon"
          >
            <svg
              viewBox="0 0 24 24"
              className={styles.googleIcon}
              aria-hidden="true"
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 0 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>

            Google sign-in coming soon
          </button>
        </form>

        {/* Mode switch */}
        <p className={styles.footer}>
          {isRegister
            ? 'Already have an account? '
            : "Don't have an account? "}

          <button
            type="button"
            className={styles.createLink}
            onClick={switchMode}
          >
            {isRegister
              ? 'Sign In'
              : 'Create Account'}
          </button>
        </p>
      </div>
    </div>
  );
}
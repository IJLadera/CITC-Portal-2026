import { Spinner } from 'flowbite-react';
import '../../../App.css'
import { SyntheticEvent, useEffect, useState } from 'react';
import { LoginModel } from './model';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { mutateLoggedIn, storeToken } from './slice';
import { useNavigate } from 'react-router-dom';
import { loginAPI, resetPassword } from './api';
import { toast, ToastContainer } from 'react-toastify';
import Cookies from 'js-cookie';
import { persistor } from '../../../store';
import { HiEye, HiEyeOff } from 'react-icons/hi';

const NAVY = '#1A1851';
const GOLD = '#fbb514';
const GOLD_DARK = '#d99a0f';
const WHITE = '#ffffff';

// Replace this path with your actual CITC building image import or public URL
// e.g. import citcBg from '../../../assets/citc-building.jpg';
// then use: backgroundImage: `url(${citcBg})`
const BUILDING_IMAGE_URL = process.env.NODE_ENV === 'development'
  ? process.env.PUBLIC_URL + 'citc-building.jpg'
  : '/static/citc-building.jpg';

const styles: Record<string, React.CSSProperties> = {
  pageWrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundImage: `url(${BUILDING_IMAGE_URL})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    padding: '24px',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    position: 'relative',
    overflow: 'hidden',
  },
  bgOverlay: {
    position: 'absolute',
    inset: 0,
    background: `linear-gradient(
      135deg,
      rgba(26, 24, 81, 0.82) 0%,
      rgba(15, 14, 46, 0.70) 50%,
      rgba(26, 24, 81, 0.78) 100%
    )`,
    pointerEvents: 'none',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: WHITE,
    borderRadius: '4px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(251,181,20,0.2)',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
  },
  goldBar: {
    height: '5px',
    background: `linear-gradient(90deg, ${GOLD_DARK}, ${GOLD}, ${GOLD_DARK})`,
  },
  header: {
    padding: '36px 40px 24px',
    textAlign: 'center',
    backgroundColor: NAVY,
  },
  logoWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  logo: {
    height: '60px',
    width: 'auto',
    objectFit: 'contain',
    filter: 'brightness(1.1)',
  },
  title: {
    margin: '0 0 6px',
    fontSize: '22px',
    fontWeight: 700,
    color: WHITE,
    letterSpacing: '0.02em',
  },
  subtitle: {
    margin: 0,
    fontSize: '13px',
    color: 'rgba(255,255,255,0.55)',
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    letterSpacing: '0.03em',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '0 40px',
    backgroundColor: NAVY,
    paddingBottom: '28px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: 'rgba(251,181,20,0.3)',
  },
  dividerText: {
    fontSize: '10px',
    letterSpacing: '0.18em',
    color: GOLD,
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontWeight: 600,
  },
  form: {
    padding: '32px 40px 28px',
  },
  fieldGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: NAVY,
    textTransform: 'uppercase' as const,
    marginBottom: '8px',
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: '#999',
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none' as const,
  },
  input: {
    width: '100%',
    padding: '11px 14px 11px 42px',
    fontSize: '14px',
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    color: '#1a1a2e',
    backgroundColor: '#f9f9fb',
    border: `1.5px solid #e2e2ec`,
    borderRadius: '3px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box' as const,
  },
  eyeButton: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
    color: NAVY,
  },
  forgotRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '24px',
    marginTop: '-8px',
  },
  forgotLink: {
    background: 'none',
    border: 'none',
    padding: 0,
    fontSize: '12px',
    color: NAVY,
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
    letterSpacing: '0.02em',
  },
  forgotSending: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
    color: '#666',
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  },
  submitBtn: {
    width: '100%',
    padding: '13px 24px',
    backgroundColor: NAVY,
    color: GOLD,
    border: `2px solid ${NAVY}`,
    borderRadius: '3px',
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    cursor: 'pointer',
    transition: 'background-color 0.2s, color 0.2s',
    display: 'block',
  },
  btnContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    margin: 0,
    padding: '14px 40px 20px',
    fontSize: '11px',
    color: '#999',
    textAlign: 'center' as const,
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    letterSpacing: '0.02em',
    borderTop: '1px solid #f0f0f5',
  },
};

function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [forgotLoading, setForgotLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [auth, setAuth] = useState<LoginModel>({
    id_number: '',
    password: ''
  });
  const loggedIn = useAppSelector(state => state.auth.loggedIn);
  const [isDisabled, setIsDisabled] = useState(false);
  const strictEmailRegex: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  useEffect(() => {
    if (loggedIn) navigate('/');
  }, [loggedIn, navigate]);

  const onChangeInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAuth({ ...auth, [event.target.name]: event.target.value });
  };

  const checkLoginAttempts = (email: any) => {
    const attemptsData = JSON.parse(
      Cookies.get(`login_attempts_${auth.id_number}`) || "{}"
    );
    const attempts = attemptsData.attempts || 0;
    const lastAttemptTime = attemptsData.lastAttemptTime || 0;

    if (attempts >= 5 && Date.now() - lastAttemptTime < 5 * 60 * 1000) {
      setIsDisabled(true);
      toast.error("Too many login attempts. Please try again in 5 minutes.", {
        position: "top-center",
        autoClose: 5000,
      });
      return false;
    } else if (Date.now() - lastAttemptTime >= 5 * 60 * 1000) {
      Cookies.set(
        `login_attempts_${email}`,
        JSON.stringify({ attempts: 0, lastAttemptTime: Date.now() }),
        { expires: 1 }
      );
      setIsDisabled(false);
    }
    return true;
  };

  const incrementLoginAttempts = (email: any) => {
    const attemptsData = JSON.parse(
      Cookies.get(`login_attempts_${auth.id_number}`) || "{}"
    );
    const attempts = (attemptsData.attempts || 0) + 1;
    Cookies.set(
      `login_attempts_${auth.id_number}`,
      JSON.stringify({ attempts, lastAttemptTime: Date.now() }),
      { expires: 1 }
    );
  };

  const onSubmitForm = async (event: SyntheticEvent) => {
    event.preventDefault();
    if (!checkLoginAttempts(auth.id_number)) return;
    setIsDisabled(true);
    try {
      const result = await loginAPI(auth);
      if (result.status === 200) {
        const token = result.data.auth_token;
        const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
        persistor.purge().then(() => {
          sessionStorage.setItem('auth_token', token);
          sessionStorage.setItem('expires_at', expiresAt.toString());
          dispatch(storeToken(token));
          dispatch(mutateLoggedIn(true));
          persistor.persist();
          navigate('/');
        });
      } else {
        toast.error('Invalid credentials. Please try again.');
      }
      setIsDisabled(false);
      Cookies.remove(`login_attempts_${auth.id_number}`);
    } catch (error: any) {
      setIsDisabled(false);
      incrementLoginAttempts(auth.id_number);
      toast.error('Login failed. Please try again.');
    }
  };

  const onClickForgotPassword = async () => {
    if (auth.id_number === '') {
      toast.error('Please enter your email address first.');
      return;
    }
    if (strictEmailRegex.test(auth.id_number)) {
      try {
        setForgotLoading(true);
        const response = await resetPassword(auth.id_number);
        if (response?.status === 204) {
          setForgotLoading(false);
          toast.success('A password reset link has been sent to your email address.');
        } else {
          toast.error('Request did not go through.');
        }
      } catch (error: any) {
        const error_message = error?.response.data[0];
        toast.error(`${error_message}`);
      }
    } else {
      toast.error(`${auth.id_number} is not a valid email address.`);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      {/* Dark navy overlay on top of the building photo */}
      <div style={styles.bgOverlay} />

      <div style={styles.card}>
        <div style={styles.goldBar} />

        <div style={styles.header}>
          <div style={styles.logoWrapper}>
            <img
              src={
                process.env.NODE_ENV === 'development'
                  ? process.env.PUBLIC_URL + 'inverted-logo.png'
                  : '/static/inverted-logo.png'
              }
              style={styles.logo}
              alt="logo"
            />
          </div>
          <h1 style={styles.title}>Welcome Back</h1>
          <p style={styles.subtitle}>Sign in to your account to continue</p>
        </div>

        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>CREDENTIALS</span>
          <span style={styles.dividerLine} />
        </div>

        <form onSubmit={onSubmitForm} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="id_number">
              ID Number / Email
            </label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                id="id_number"
                name="id_number"
                type="text"
                placeholder="Enter your ID number or email"
                onChange={onChangeInput}
                style={styles.input}
                autoComplete="username"
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="password">
              Password
            </label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                onChange={onChangeInput}
                style={{ ...styles.input, paddingRight: '44px' }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword
                  ? <HiEyeOff size={18} color={NAVY} />
                  : <HiEye size={18} color={NAVY} />
                }
              </button>
            </div>
          </div>

          <div style={styles.forgotRow}>
            {!forgotLoading ? (
              <button
                type="button"
                style={styles.forgotLink}
                onClick={onClickForgotPassword}
              >
                Forgot Password?
              </button>
            ) : (
              <span style={styles.forgotSending}>
                <Spinner size="sm" />
                <span style={{ marginLeft: '6px' }}>Sending reset link…</span>
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isDisabled}
            style={{
              ...styles.submitBtn,
              opacity: isDisabled ? 0.6 : 1,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            {isDisabled ? (
              <span style={styles.btnContent}>
                <Spinner size="sm" light />
                <span style={{ marginLeft: '8px' }}>Signing in…</span>
              </span>
            ) : (
              <span style={styles.btnContent}>
                Sign In
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: '8px' }}>
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            )}
          </button>
        </form>

        <p style={styles.footer}>
          Authorized personnel only. All access is monitored and logged.
        </p>
      </div>

      <ToastContainer
        position="top-center"
        style={{ fontSize: '15px' }}
        toastStyle={{ borderRadius: '8px', fontFamily: 'inherit' }}
      />
    </div>
  );
}

export default Login;
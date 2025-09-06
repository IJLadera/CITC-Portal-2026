import { Button, FloatingLabel, Spinner } from 'flowbite-react';
import '../../../App.css'
import { SyntheticEvent, useEffect, useState } from 'react';
import { LoginModel } from './model';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { mutateLoggedIn, storeToken } from './slice';
import { useNavigate } from 'react-router-dom';
import {loginAPI, resetPassword } from './api';
import { toast, ToastContainer } from 'react-toastify'; // Importing toast and ToastContainer
import 'react-toastify/dist/ReactToastify.css'; // Import toast styles
import Cookies from 'js-cookie';
import { persistor } from '../../../store';
import { HiEye, HiEyeOff } from 'react-icons/hi';

function Login() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [forgotLoading, setForgotLoading] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [auth, setAuth] = useState<LoginModel>({
    id_number: '',
    password: ''
  })
  const loggedIn = useAppSelector(state => state.auth.loggedIn)
  const [isDisabled, setIsDisabled] = useState(false);
  const strictEmailRegex: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  useEffect(() => {
    if (loggedIn) {
      navigate('/')
    }
  }, [loggedIn, navigate])

  const onChangeInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAuth({
      ...auth,
      [event.target.name]: event.target.value
    })

  }

  const checkLoginAttempts = (email: any) => {
    const attemptsData = JSON.parse(
      Cookies.get(`login_attempts_${auth.id_number}`) || "{}"
    );
    const attempts = attemptsData.attempts || 0;
    const lastAttemptTime = attemptsData.lastAttemptTime || 0;

    // Check if cooldown period has expired
    if (attempts >= 5 && Date.now() - lastAttemptTime < 5 * 60 * 1000) {
      setIsDisabled(true);
      toast.error("Too many login attempts. Please try again in 5 minutes.", {
        position: "top-center",
        autoClose: 5000,
      });
      return false;
    } else if (Date.now() - lastAttemptTime >= 5 * 60 * 1000) {
      // Reset attempts if cooldown period has expired
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

    // Set new attempts and timestamp in cookie
    Cookies.set(
      `login_attempts_${auth.id_number}`,
      JSON.stringify({
        attempts,
        lastAttemptTime: Date.now(),
      }),
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
        const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 1 day expiration

        // Clear any previous persisted data first
        persistor.purge().then(() => {
          // Then set new token and login state
          sessionStorage.setItem('auth_token', token);
          sessionStorage.setItem('expires_at', expiresAt.toString());

          dispatch(storeToken(token));
          dispatch(mutateLoggedIn(true));

          // Force persist the new state
          persistor.persist();

          navigate('/');
        });
      } else {
        toast.error('Invalid email or password. Please try again.');
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
    if (auth.id_number == '') {
      toast.error('Email is not set, please set it.');
    }

    if (strictEmailRegex.test(auth.id_number)) {
      // proceed the reset password here
      try {
        setForgotLoading(true);
        const response = await resetPassword(auth.id_number)
        if (response?.status === 204) {
          setForgotLoading(false);
          toast.success('We have sent you a link to reset your password through your email address.')
        } else {
          toast.error('Request did not go through')
        }
      } catch(error:any) {
        const error_message = error?.response.data[0]
        toast.error(`${error_message}`)
      }
    } else {
      toast.error(`${auth.id_number} is not a valid email address`)
    }
  }


  return (
    <div className="App-header">
      <img src={process.env.NODE_ENV === 'development' ? process.env.PUBLIC_URL + 'inverted-logo.png' : '/static/inverted-logo.png'} className="App-logo" alt="logo" />
      <form className='mt-5' onSubmit={onSubmitForm}>
        <FloatingLabel className='mt-5 text-white' placeholder='ID Number' label='' variant='outlined' name="id_number" type='text' onChange={onChangeInput} />
        <FloatingLabel className='mt-5 text-white' placeholder='Password' label='' variant='outlined' name="password" type='password' onChange={onChangeInput} />
        <Button disabled={isDisabled} className='w-full bg-blue-900 hover:bg-blue-800' type='submit'>Login</Button>
      </form>
      { (!forgotLoading) ? <a href="#" className="text-sm mt-2" onClick={onClickForgotPassword}>Forgot Password?</a> :
        <><Spinner size="sm" aria-label="Loading" /><span className="text-sm">Sending you an email shortly...</span></>
      }
      <ToastContainer style={{ fontSize: "18px" }} />
    </div>
  );
}

export default Login;

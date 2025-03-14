import { Button, FloatingLabel } from 'flowbite-react';
import '../../../App.css'
import { SyntheticEvent, useEffect, useState } from 'react';
import { LoginModel } from './model';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { mutateLoggedIn, storeToken } from './slice';
import { useNavigate } from 'react-router-dom';
import { loginAPI } from './api';
import { toast, ToastContainer } from 'react-toastify'; // Importing toast and ToastContainer
import 'react-toastify/dist/ReactToastify.css'; // Import toast styles
import Cookies from 'js-cookie';
import { persistor } from '../../../store';

function Login() {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const [auth, setAuth] = useState<LoginModel>({
        email: '',
        password: ''
    })
    const loggedIn = useAppSelector(state => state.auth.loggedIn)
    const [isDisabled, setIsDisabled] = useState(false);

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
          Cookies.get(`login_attempts_${auth.email}`) || "{}"
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
          Cookies.get(`login_attempts_${auth.email}`) || "{}"
        );
        const attempts = (attemptsData.attempts || 0) + 1;
    
        // Set new attempts and timestamp in cookie
        Cookies.set(
          `login_attempts_${auth.email}`,
          JSON.stringify({
            attempts,
            lastAttemptTime: Date.now(),
          }),
          { expires: 1 }
        );
      };
    

      const onSubmitForm = async (event: SyntheticEvent) => {
        event.preventDefault();
        if (!checkLoginAttempts(auth.email)) return;
        setIsDisabled(true);
        try {
            const result = await loginAPI(auth);
            if (result.status === 200) {
                const token = result.data.auth_token;
                const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 3 minutes expiration
                
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
            Cookies.remove(`login_attempts_${auth.email}`);
        } catch (error: any) {
            setIsDisabled(false);
            incrementLoginAttempts(auth.email);
            toast.error('Login failed. Please try again.');
        }
    };
    

    return (
        <div className="App-header">
            <img src={process.env.PUBLIC_URL + 'inverted-logo.png'} className="App-logo" alt="logo" />
            <form className='mt-5' onSubmit={onSubmitForm}>
                <FloatingLabel className='mt-5 text-white' placeholder='Email' label='' variant='outlined' name="email" type='email' onChange={onChangeInput} />
                <FloatingLabel className='mt-5 text-white' placeholder='Password' label='' variant='outlined' name="password" type='password' onChange={onChangeInput} />
                <Button disabled={isDisabled} className='w-full bg-blue-900 hover:bg-blue-800' type='submit'>Login</Button>
            </form>
            <ToastContainer style={{fontSize: "18px"}}/>
        </div>
    );
}

export default Login;

import { Button, FloatingLabel } from 'flowbite-react';
import '../../../App.css'
import { SyntheticEvent, useState } from 'react';
import { LoginModel } from './model';
import { useAppDispatch } from '../../../hooks';
import { mutateLoggedIn } from './slice';
import { useNavigate } from 'react-router-dom';


function Login() {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const [auth, setAuth] = useState<LoginModel>({
        email: '',
        password: ''
    })

    const onChangeInput = (event:React.ChangeEvent<HTMLInputElement>) => {
        setAuth({
            ...auth,
            [event.target.name]: event.target.value
        })
    }

    const onSubmitForm = (event:SyntheticEvent) => {
        event.preventDefault();
        dispatch(mutateLoggedIn(true))
        navigate('/')
    }

    return (
        <div className="App-header">
            <img src={ process.env.PUBLIC_URL + 'inverted-logo.png' } className="App-logo" alt="logo" />
            <form className='mt-5' onSubmit={onSubmitForm}>
                <FloatingLabel className='mt-5 text-white' placeholder='Email' label='' variant='outlined' name="email" type='email' onChange={onChangeInput} />
                <FloatingLabel className='mt-5 text-white' placeholder='Password' label='' variant='outlined' name="password" type='password' onChange={onChangeInput} />
                <Button className='w-full bg-blue-900 hover:bg-blue-800' type='submit'>Login</Button>
            </form>
        </div>
    )
}

export default Login;
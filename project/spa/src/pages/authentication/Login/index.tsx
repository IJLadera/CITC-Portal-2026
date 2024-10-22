import { Button, FloatingLabel } from 'flowbite-react';
import '../../../App.css'
import { SyntheticEvent, useState } from 'react';
import { LoginModel } from './model';
import { loginAPI } from './api';

function Login() {

    const [auth, setAuth] = useState<LoginModel>({
        email: '',
        password: ''
    })

    const onSubmitForm = (event:SyntheticEvent) => {
        event.preventDefault();
        //axios here
        loginAPI(auth).then(response => {
            console.log(response.data);
        }).catch(error => {
            console.log(error);
        })
    }

    return (
        <div className="App-header">
            <img src="https://res.cloudinary.com/dbtpalq18/image/upload/v1715755291/USTP_Logo_against_Dark_Background_gb1hnv.png" className="App-logo" alt="logo" />
            <form className='mt-5' onSubmit={onSubmitForm}>
                <FloatingLabel className='mt-5 text-white' placeholder='Email' label='' variant='outlined' type='email' onChange={(event) => setAuth({...auth, email: event.target.value})} />
                <FloatingLabel className='mt-5 text-white' placeholder='Password' label='' variant='outlined' type='password' onChange={(event) => setAuth({...auth, password: event.target.value})} />
                <Button className='w-full bg-blue-900 hover:bg-blue-800' type='submit'>Login</Button>
            </form>
        </div>
    )
}

export default Login;
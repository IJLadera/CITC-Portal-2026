import { FloatingLabel, Button, Spinner } from 'flowbite-react';
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { forgotPasswordType, forgotParamsType } from './models';
import { forgotPassword } from './api';

const ForgotPassword = () => {

  const { uid, token } = useParams<forgotPasswordType>();
  const [loading, setLoading] = useState<boolean>();
  
  const [data, setData] = useState<forgotPasswordType>({
    new_password: '',
    re_password: '',
    uid: '' ,
    token: '',
  })

  useEffect(() => {
    if (uid && token) {
      setData({
        ...data,
        uid: uid,
        token: token
      })
    }
  }, [])
  
  const onChangeTextInput = (event:React.ChangeEvent<HTMLInputElement>) => {

    setData({
      ...data,
      [event.target.name]: event.target.value
    })
  }

  const onSubmit = async (event:React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(false)
    const requestData = {
      ...data,
      uid: uid,
      token: token
    }
    const response = await forgotPassword(data);
    console.log(response)

    try {
      if (response) {
        if (response.status >= 200) {
          setLoading(true)
        }
      }
    } catch (error:any) {
      console.log(error.response.data);
      setLoading(true)
    }

  }

  return (
    <>
      <div className="App-header">
        <p>Please enter your new password.</p>
        <form onSubmit={onSubmit}>
          <FloatingLabel className="text-white mt-5" value={data.new_password} variant="outlined" label="" placeholder="Password" name="new_password" type="password" onChange={onChangeTextInput} />
          <FloatingLabel className="text-white mt-5" value={data.re_password} variant="outlined" label="" placeholder="Confirm Password" name="re_password" type="password" onChange={onChangeTextInput} />
          <Button isProcessing={loading} className="w-full bg-blue-900 hover:bg-blue-900" type="submit">Change Password</Button>
        </form>

      </div>
    </>
  )
}

export default ForgotPassword;

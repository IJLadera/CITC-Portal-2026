import {  
  Button,
  FloatingLabel,
  Modal
} from 'flowbite-react';
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { addStudentToClass } from '../api';

type AddStudentType = {
  email: string;
  first_name: string;
  last_name: string;
  id_number: string;
  password: string;
}

export default function AddStudent() {
  const [modal, setModal] = useState<boolean>(false);
  const { room } = useParams();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [data, setData] = useState<AddStudentType>({
    email: '',
    first_name: '',
    last_name: '',
    id_number: '',
    password: ''
  });
  
  const onClickSave = (event: React.MouseEvent<HTMLButtonElement>) => {
    setIsProcessing(true);
    addStudentToClass(room, {students:[{...data, password: `${data.last_name.toLowerCase()}.${data.id_number}`}]}).then(response => {
      if (response.status === 200) {
        setIsProcessing(false);
        setModal(false);
        setData({
          email: '',
          first_name: '',
          last_name: '',
          id_number: '',
          password: ''
        })
      }
    })
    
  }
  
  return (
    <>
      <Button className="mb-5" onClick={() => setModal(true)}>Add Student</Button>
      <Modal show={modal} onClose={() => setModal(false)}>
        <Modal.Header>
          Add Student
        </Modal.Header>
        <Modal.Body>
          <FloatingLabel label="Email" variant="outlined" onChange={(event:React.ChangeEvent<HTMLInputElement>) => setData({...data, email: event.target.value})} />
          <FloatingLabel label="First Name" variant="outlined" onChange={(event:React.ChangeEvent<HTMLInputElement>) => setData({...data, first_name: event.target.value})} />
          <FloatingLabel label="Last Name" variant="outlined" onChange={(event:React.ChangeEvent<HTMLInputElement>) => setData({...data, last_name: event.target.value})} />
          <FloatingLabel label="ID Number" variant="outlined" onChange={(event:React.ChangeEvent<HTMLInputElement>) => setData({...data, id_number: event.target.value})} />

        </Modal.Body>
        <Modal.Footer>
          <Button isProcessing={isProcessing} disabled={isProcessing} onClick={onClickSave}>
            Add
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )

}

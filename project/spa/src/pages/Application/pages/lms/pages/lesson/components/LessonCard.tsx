import React from 'react';
import { Card, Button, Modal } from 'flowbite-react';
import { useState } from 'react';
import CreateLesson from './CreateLesson'
import { useAppSelector } from '../../../../../../../hooks';

interface LessonCardInt {
  title: string;
  content: string;
  excerpt: string;
  id: any;
  module: number;
  subject: number;
}

const LessonCard:React.FC<LessonCardInt> = ({title, content, excerpt, id, module, subject}) => {
  
  const user = useAppSelector(state => state.auth.user)
  const [show,setShow] = useState<boolean>(false)
  
  return (
    <Card className="max-w-sm">
      <h5 className="text-2xl font-bold tracking-tight">{title}</h5>
      <div className="font-thin" dangerouslySetInnerHTML={{__html: excerpt}}>
      </div>
      <Button onClick={() => setShow(true)}>
        Read more
      </Button>
      <Modal show={show} size="7xl" onClose={() => setShow(false)}>
        <Modal.Header>
          <p>Module</p>
        </Modal.Header>
        <Modal.Body>
          <div className="[all:revert] [&_h1]:font-normal [&_h1]:[font-size:revert] [&_h2]:font-normal [&_h2]:[font-size:revert] [&_h3]:font-normal [&_h3]:[font-size:revert] [&_h4]:font-normal [&_h4]:[font-size:revert] 
             [&_h5]:font-normal [&_h5]:[font-size:revert] 
             [&_h6]:font-normal [&_h6]:[font-size:revert]" dangerouslySetInnerHTML={{__html: content}}>
          </div>
        </Modal.Body>
        <Modal.Footer>
        </Modal.Footer>
      </Modal>
      {
        (user?.is_bayanihan_leader) ? <CreateLesson id={id} isEdit={true} lesson={{
          title: title,
          content: content,
          module: module,
          subject: subject
        }} /> : null
      }
    </Card>
  )
}

export default LessonCard

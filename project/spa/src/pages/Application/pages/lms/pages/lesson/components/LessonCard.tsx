import React from 'react';
import { Card, Button, Modal } from 'flowbite-react';
import { useState } from 'react';
import CreateLesson from './CreateLesson'


interface LessonCardInt {
  title: string;
  content: string;
  excerpt: string;
  id: string;
}

const LessonCard:React.FC<LessonCardInt> = ({title, content, excerpt, id}) => {
  
  const [show,setShow] = useState<boolean>(false)
  
  return (
    <Card className="max-w-sm">
      <h5 className="text-2xl font-bold tracking-tight">{title}</h5>
      <div className="font-normal" dangerouslySetInnerHTML={{__html: excerpt}}>
      </div>
      <Button onClick={() => setShow(true)}>
        Read more
      </Button>
      <Modal show={show} size="7xl" onClose={() => setShow(false)}>
        <Modal.Header>
          <p>Module</p>
        </Modal.Header>
        <Modal.Body>
          <div dangerouslySetInnerHTML={{__html: content}}>
          </div>
        </Modal.Body>
        <Modal.Footer>
        </Modal.Footer>
      </Modal>
      <CreateLesson id={id} isEdit={true} />
    </Card>
  )
}

export default LessonCard

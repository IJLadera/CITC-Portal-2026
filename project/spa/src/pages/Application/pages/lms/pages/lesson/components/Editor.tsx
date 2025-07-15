import { useState } from 'react';
import RichTextEditor from 'reactjs-tiptap-editor';
import { BaseKit } from 'reactjs-tiptap-editor';
import { Blockquote } from 'reactjs-tiptap-editor/blockquote';
import { Bold } from 'reactjs-tiptap-editor/bold';
import { BulletList } from 'reactjs-tiptap-editor/bulletlist';
import { Clear } from 'reactjs-tiptap-editor/clear';
import { FontFamily } from 'reactjs-tiptap-editor/fontfamily';
import { FontSize } from 'reactjs-tiptap-editor/fontsize';
import { Heading } from 'reactjs-tiptap-editor/heading';
import { Highlight } from 'reactjs-tiptap-editor/highlight';
import { Indent } from 'reactjs-tiptap-editor/indent';
import { Link } from 'reactjs-tiptap-editor/link';
import { ListItem } from 'reactjs-tiptap-editor/listitem';
import { MultiColumn } from 'reactjs-tiptap-editor/multicolumn';
import { OrderedList } from 'reactjs-tiptap-editor/orderedlist';
import { Strike } from 'reactjs-tiptap-editor/strike';
import { SubAndSuperScript } from 'reactjs-tiptap-editor/subandsuperscript';
import { Table } from 'reactjs-tiptap-editor/table';
import { TaskList } from 'reactjs-tiptap-editor/tasklist';
import { TextAlign } from 'reactjs-tiptap-editor/textalign';
import { TextBubble } from 'reactjs-tiptap-editor/textbubble';
import { TextUnderline } from 'reactjs-tiptap-editor/textunderline';
import { Emoji } from 'reactjs-tiptap-editor/emoji';
import { TextDirection } from 'reactjs-tiptap-editor/textdirection';
import { Image } from 'reactjs-tiptap-editor/image';

import { uploadFile } from '../api';

import 'react-image-crop/dist/ReactCrop.css';
import 'reactjs-tiptap-editor/style.css';

const extensions = [
  BaseKit.configure({
    placeholder: {
      showOnlyCurrent: true
    },
    characterCount: {
      limit: 50_000,
    },
  }),
  Blockquote,
  Bold,
  BulletList,
  Clear,
  FontFamily,
  FontSize,
  Heading,
  Highlight,
  Indent,
  Link,
  ListItem,
  MultiColumn,
  OrderedList,
  Strike,
  SubAndSuperScript,
  Table,
  TaskList,
  TextAlign,
  TextBubble,
  Emoji,
  TextDirection.configure({
    types: ['heading','paragraph', 'blockquote', 'list_item'],
    directions: ['ltr', 'rtl'],
    defaultDirection: 'ltr'
  }),
  Image.configure({
    upload: (files:File) => {
      return new Promise((resolve) => {
        uploadFile(files).then((response:any) => {
          resolve(response.data?.file)
        }).catch((error:any) => {
          resolve(URL.createObjectURL(files))
        })
      })
    }
  })
]

const DEFAULT = ''

interface editorProps {
  value: string;
  onChangeValue: (value: string) => void;
}


const Editor: React.FC<editorProps> = ({ value, onChangeValue }) => {
  const onChangeContent = (value:any) => {
    onChangeValue(value);
  }

  return (
    <RichTextEditor 
      output='html'
      content={value}
      dark={false}
      onChangeContent={onChangeContent}
      extensions={extensions}
    />
  )

}

export default Editor

import React, { useState, useEffect } from "react";
import {
  Editor,
  EditorState,
  RichUtils,
  convertToRaw,
  convertFromRaw,
} from "draft-js";
import "draft-js/dist/Draft.css";
import { IconButton, Box, useMediaQuery, useTheme } from "@mui/material";
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  StrikethroughS,
  FormatListBulleted,
  FormatListNumbered,
  Code,
  FormatQuote,
  Title,
  Undo,
  Redo,
  Link as LinkIcon,
  Clear,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
} from "@mui/icons-material";

interface DraftEditorProps {
  eventDescription: string;
  setEventDescription: (value: string) => void;
  readOnly?: boolean;
}

const DraftEditor = ({
  eventDescription,
  setEventDescription,
  readOnly = false,
}: DraftEditorProps) => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [alignment, setAlignment] = useState("left");
  const theme = useTheme();

  // Breakpoints for responsive layout
  const isSmallScreen = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(min-width:600px) and (max-width:900px)");
  const isLaptop = useMediaQuery("(min-width:900px) and (max-width:1200px)");
  const isLaptopLarge = useMediaQuery("(min-width:1200px)");

  useEffect(() => {
    if (eventDescription) {
      try {
        const contentState = convertFromRaw(JSON.parse(eventDescription));
        setEditorState(EditorState.createWithContent(contentState));
      } catch (error) {
        console.error("Error loading event description:", error);
      }
    }
  }, []);

  const handleInlineStyle = (style: any) => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, style));
  };

  const handleBlockType = (blockType: any) => {
    setEditorState(RichUtils.toggleBlockType(editorState, blockType));
  };

  // const handleTextAlignment = (alignment) => {
  //     setAlignment(alignment);
  // };

  const handleEditorChange = (newState: any) => {
    setEditorState(newState);
    const contentState = newState.getCurrentContent();
    const rawContent = JSON.stringify(convertToRaw(contentState));
    setEventDescription(rawContent);
  };

  const handleUndo = () => {
    setEditorState(EditorState.undo(editorState));
  };

  const handleRedo = () => {
    setEditorState(EditorState.redo(editorState));
  };

  // const promptForLink = () => {
  //     const url = prompt('Enter a URL');
  //     if (url) {
  //         const contentState = editorState.getCurrentContent();
  //         const contentStateWithEntity = contentState.createEntity('LINK', 'MUTABLE', { url });
  //         const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
  //         const newEditorState = EditorState.set(editorState, { currentContent: contentStateWithEntity });
  //         setEditorState(RichUtils.toggleLink(newEditorState, newEditorState.getSelection(), entityKey));
  //     }
  // };

  // const removeLink = () => {
  //     const selection = editorState.getSelection();
  //     if (!selection.isCollapsed()) {
  //         setEditorState(RichUtils.toggleLink(editorState, selection, null));
  //     }
  // };

  return (
    <Box className="flex flex-col w-full">
      {!readOnly && (
        <Box
          className={`mb-4 flex ${
            isSmallScreen
              ? "flex-wrap space-y-2"
              : isTablet
              ? "flex-wrap space-y-2"
              : isLaptop
              ? "flex-wrap space-y-2"
              : isLaptopLarge
              ? "flex-wrap space-y-2"
              : "flex-wrap space-y-2"
          }`}
        >
          <IconButton onClick={() => handleInlineStyle("BOLD")} title="Bold">
            <FormatBold />
          </IconButton>
          <IconButton
            onClick={() => handleInlineStyle("ITALIC")}
            title="Italic"
          >
            <FormatItalic />
          </IconButton>
          <IconButton
            onClick={() => handleInlineStyle("UNDERLINE")}
            title="Underline"
          >
            <FormatUnderlined />
          </IconButton>
          {/* <IconButton onClick={() => handleInlineStyle('STRIKETHROUGH')} title="Strikethrough">
                        <StrikethroughS />
                    </IconButton> */}
          <IconButton
            onClick={() => handleBlockType("unordered-list-item")}
            title="Bullet List"
          >
            <FormatListBulleted />
          </IconButton>
          <IconButton
            onClick={() => handleBlockType("ordered-list-item")}
            title="Numbered List"
          >
            <FormatListNumbered />
          </IconButton>
          <IconButton
            onClick={() => handleBlockType("code-block")}
            title="Code Block"
          >
            <Code />
          </IconButton>
          {/* <IconButton onClick={() => handleBlockType('blockquote')} title="Block Quote">
                        <FormatQuote />
                    </IconButton> */}
          {/* <IconButton onClick={() => handleBlockType('header-one')} title="H1">
                        <Title fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => handleBlockType('header-two')} title="H2">
                        <Title fontSize="medium" />
                    </IconButton>
                    <IconButton onClick={() => handleBlockType('header-three')} title="H3">
                        <Title fontSize="large" />
                    </IconButton> */}
          <IconButton onClick={handleUndo} title="Undo">
            <Undo />
          </IconButton>
          <IconButton onClick={handleRedo} title="Redo">
            <Redo />
          </IconButton>
          {/* <IconButton onClick={promptForLink} title="Add Link">
                        <LinkIcon />
                    </IconButton> */}
          {/* <IconButton onClick={removeLink} title="Remove Link">
                        <Clear />
                    </IconButton> */}
          {/* <IconButton onClick={() => handleTextAlignment('left')} title="Align Left">
                        <FormatAlignLeft />
                    </IconButton>
                    <IconButton onClick={() => handleTextAlignment('center')} title="Align Center">
                        <FormatAlignCenter />
                    </IconButton>
                    <IconButton onClick={() => handleTextAlignment('right')} title="Align Right">
                        <FormatAlignRight />
                    </IconButton> */}
        </Box>
      )}

      <Box
        className={`border border-gray-300 p-2 rounded-md min-h-[200px] ${
          readOnly ? "cursor-default" : "focus:border-blue-500"
        }`}
        style={{ flex: 1 }}
        onClick={
          !readOnly
            ? () => {
                const editorContent = document.querySelector(".public-DraftEditor-content") as HTMLElement | null;
                if (editorContent) {
                  editorContent.focus();
                }
              }
            : undefined
        }      
      >
        <Editor
          editorState={editorState}
          onChange={readOnly ? () => {} : handleEditorChange}
          readOnly={readOnly}
          placeholder={readOnly ? "" : "Enter Event Description"}
          
          // style={{ textAlign: alignment }} dapat naa ni sa style sa editor
        />
      </Box>
    </Box>
  );
};

export default DraftEditor;

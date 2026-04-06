import { useState, useEffect, useContext, useRef } from "react";
import { AuthContext } from "@/context/AuthContext";
import { HiDotsVertical, HiCheck } from "react-icons/hi";
import {
  Button,
  Textarea,
  Dropdown,
  DropdownItem,
  ToggleSwitch,
} from "flowbite-react";
import { BiCommentDetail } from "react-icons/bi";
import api from "@/api";
import { toast } from "react-toastify";

interface Comment {
  id: number;
  tos: number;
  tos_row: number | null; 
  text: string;
  created_at: string;
  resolved_at?: string | null;
  is_resolved: boolean;
  user: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

interface TOSComponentProps {
  tosId: number | string;
  tosRowId?: number | string | null;
  direction?: "right" | "left" | "top" | "bottom";
}

export default function TOSCommentComponent({
  tosId,
  tosRowId = null,
  direction = "right",
}: TOSComponentProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { user } = useContext(AuthContext)!;

  /** 🧾 Fetch comments */
  const fetchComments = async () => {
    try {
      const res = await api.get(
        `/tos-comments/by_tos_context/?tos_id=${tosId}&target=${tosRowId ? 'row' : 'tos'}`
      );
      const sorted = res.data.sort(
        (a: Comment, b: Comment) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setComments(sorted);
    } catch (err) {
      console.error("Failed to load comments:", err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [tosId, tosRowId]);

  /** 🧠 Close modal when clicking outside */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setModalOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /** 🪄 Auto-grow textarea */
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  /** ✏️ CRUD Handlers */
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const payload: any = {
          tos: tosId,
          text: newComment.trim(),
      };
      
      // Conditionally add tos_row_id to the payload if it's a row comment
      if (tosRowId) { 
          payload.tos_row_id = tosRowId; 
      }

      await api.post("/tos-comments/", payload);
      toast.success("Comment added!");
      setNewComment("");
      fetchComments();
    } catch(err: any) {
      console.error("Failed to add comment:", err);
      toast.error("Failed to add comment");
    }
  };

  const handleResolve = async (id: number) => {
    try {
      const now = new Date(); 

      await api.patch(`/tos-comments/${id}/`, { is_resolved: true, resolved_at: now  });
      toast.success("Comment resolved!");
      fetchComments();
    } catch (err: any) {
      console.error("Error resolving comment", err);
      toast.error("Failed to resolve comment");
    }
  };

  const handleEdit = async (id: number, updatedText: string) => {
    try {
      await api.patch(`/tos-comments/${id}/`, { text: updatedText });
      toast.success("Comment updated!");
      fetchComments();
    } catch (err: any) {
      console.error("Error updating comment", err);
      toast.error("Failed to update comment");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await api.delete(`/tos-comments/${id}/`);
      toast.success("Comment deleted!");
      fetchComments();
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  /** Derived */
  const unresolvedCount = comments.filter((c) => !c.is_resolved).length;
  const filteredComments = showResolved
    ? comments
    : comments.filter((c) => !c.is_resolved);

  /** 🧭 Modal positioning */
  const modalPosition =
    direction === "left"
      ? "right-full mr-3 top-1/2 -translate-y-1/2"
      : direction === "top"
      ? "bottom-full mb-3 left-1/2 -translate-x-1/2"
      : direction === "bottom"
      ? "top-full mt-3 left-1/2 -translate-x-1/2"
      : "left-full ml-3 top-1/2 -translate-y-1/2";

  return (
    <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-[39] font-sans">
      {/* 💬 Comment Button */}
      <button
        ref={buttonRef}
        onClick={() => setModalOpen(!modalOpen)}
        className="relative p-2 rounded-full bg-purple-50 hover:bg-purple-200 transition z-[40]"
        title="View comments"
      >
        <BiCommentDetail size={22} className="text-purple-600" />
        {unresolvedCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow">
            {unresolvedCount}
          </span>
        )}
      </button>

      {/* 🧾 Floating Modal */}
      {modalOpen && (
        <div
          ref={modalRef}
          className={`absolute ${modalPosition} w-[420px] bg-white border border-gray-200 shadow-2xl rounded-2xl p-4 z-[50] animate-fadeIn`}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-gray-800 text-sm">Comments</h2>

            <div className="flex gap-2 items-center">
              <p className="text-sm text-gray-600">Show Resolved</p>
              <div className="scale-75 origin-right">
                <ToggleSwitch
                  checked={showResolved}
                  onChange={setShowResolved}
                />
              </div>
            </div>
          </div>

          {/* Comment list */}
          <div className="max-h-[300px] overflow-y-auto pr-1 space-y-3">
            {filteredComments.length > 0 ? (
              filteredComments.map((comment) => {
                const initials =
                  (comment.user.first_name?.[0] || "") +
                  (comment.user.last_name?.[0] || "");
                const isOwner = user?.id === comment.user.id;
                const dateObj = new Date(comment.created_at);
                const formattedDate =
                  dateObj.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  }) +
                  " - " +
                  dateObj.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                return (
                  <div
                    key={comment.id}
                    className={`p-3 rounded-xl shadow-sm border transition z-[10001] ${
                      comment.is_resolved
                        ? "border-green-300 bg-green-50"
                        : "border-blue-200 bg-white hover:shadow-md"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                            comment.is_resolved ? "bg-green-500" : "bg-blue-600"
                          }`}
                        >
                          {initials}
                        </div>
                        <div className="text-start">
                          <p className="text-sm font-semibold text-gray-800">
                            {comment.user.first_name} {comment.user.last_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formattedDate}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!comment.is_resolved && (
                          <button
                            onClick={() => handleResolve(comment.id)}
                            className="text-green-600 hover:text-green-700 p-1 rounded-full hover:bg-green-100"
                            title="Mark as resolved"
                          >
                            <HiCheck size={18} />
                          </button>
                        )}
                        {isOwner && (
                          <Dropdown
                            inline
                            arrowIcon={false}
                            label={
                              <HiDotsVertical
                                size={22}
                                className="text-gray-600 cursor-pointer hover:bg-gray-100 rounded-full p-1"
                              />
                            }
                          >
                            <DropdownItem
                              onClick={() => {
                                const updated = prompt(
                                  "Edit your comment:",
                                  comment.text
                                );
                                if (updated) handleEdit(comment.id, updated);
                              }}
                            >
                              Edit
                            </DropdownItem>
                            <DropdownItem onClick={() => handleDelete(comment.id)}>
                              Delete
                            </DropdownItem>
                          </Dropdown>
                        )}
                      </div>
                    </div>

                    <p
                      className={`text-sm px-2 py-1 text-start rounded-full  ${
                        comment.is_resolved
                          ? "text-gray-400 italic line-through hover:bg-green-100"
                          : "text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {comment.text}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-gray-400 text-sm py-3">
                No comments yet
              </p>
            )}
          </div>

          {/* Add new comment */}
          <div className="mt-3 border-t pt-3 z-[10001]">
            <Textarea
              ref={textareaRef}
              rows={1}
              value={newComment}
              onChange={handleTextareaChange}
              placeholder="Add a new comment..."
              className="text-sm resize-none overflow-hidden rounded-full"
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button
                onClick={() => setModalOpen(false)}
                className="px-4 py-1 text-sm text-black rounded-full bg-white hover:bg-gray-200 transition"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1 text-sm rounded-full"
              >
                Comment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

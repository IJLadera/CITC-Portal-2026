import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import api from "../api"; // ✅ your axios instance with auth/refresh

interface Memo {
  id: number;
  title: string;
  description: string | null;
  date: string | null;
  color: "green" | "yellow" | "red" | "gray" | null;
  user: {
    firstname: string;
    lastname: string;
    email: string;
  } | null;
  file_name: string | null;
  file_url?: string | null;
}

const ViewMemo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [memo, setMemo] = useState<Memo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemo = async () => {
      try {
        const res = await api.get(`/academics/memos/${id}/`);
        setMemo(res.data);
      } catch (err) {
        console.error("Failed to fetch memo:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMemo();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-600">Loading memo...</p>
      </div>
    );
  }

  if (!memo) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-600">Memo not found.</p>
      </div>
    );
  }

  const formattedDate = memo.date
    ? new Date(memo.date).toLocaleDateString("en-US", {
        month: "long",
        day: "2-digit",
        year: "numeric",
      })
    : "No date";

  const getColor = () => {
    switch (memo.color) {
      case "green":
        return "#22c55e";
      case "yellow":
        return "#eab308";
      case "red":
        return "#dc2626";
      default:
        return "#1f2937";
    }
  };

  return (
    <div
      className="flex-1 p-4 mt-14"
      style={{
        backgroundImage: "url(/assets/Wave.png)",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "top",
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
        backgroundColor: "#EEEEEE",
        minHeight: "100vh",
      }}
    >
      <div className="max-w-5xl ml-24 mt-4 shadow rounded-lg bg-white p-6">
        {/* Title + Metadata */}
        <div className="mb-6">
          <h1
            className="text-2xl font-semibold"
            style={{ color: getColor() }}
          >
            {memo.title}
          </h1>
          <p className="text-sm text-gray-500">{formattedDate}</p>
          {memo.user && (
            <p className="text-sm text-gray-500">
              Uploaded by: {memo.user.firstname} {memo.user.lastname} (
              {memo.user.email})
            </p>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <p className="text-gray-700 whitespace-pre-line break-words">
            {memo.description || "No description provided."}
          </p>
        </div>

        {/* Attachments */}
        {memo.file_name && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Attachments
            </h2>

            {(Array.isArray(memo.file_name) ? memo.file_name : [memo.file_name])
              .filter(Boolean)
              .map((file: string, idx: number) => (
                <a
                  key={idx}
                  href={file} // ✅ FIX: each file contains its own full URL
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-gray-100 p-3 rounded hover:bg-gray-200 transition"
                >
                  <Icon
                    icon="mdi:file-document"
                    className="text-gray-600"
                    width={20}
                    height={20}
                  />

                  {file.split("/").pop()?.split("?")[0]}
                </a>
              ))}
          </div>
        )}

        {/* ✅ Back Button — simply go back to the previous page */}
        <div className="flex justify-end">
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition cursor-pointer"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewMemo;

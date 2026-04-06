import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import api from "../../api";
import TrashIcon from "@heroicons/react/24/outline/TrashIcon";
import PencilSquareIcon from "@heroicons/react/24/outline/PencilSquareIcon";

interface Memo {
  id: number;
  memo_no: string | null;       // e.g., "46"
  series_year: string | null;   // e.g., "2024"
  from_field: string | null;    // FROM:
  to_field: string | null;      // FOR:
  subject: string | null;       // SUBJECT:
  rows: { code: string; text: string }[]; // CODE rows

  title: string;
  description: string | null;
  date: string | null;
  color: "green" | "yellow" | "red" | "gray" | null;
  file_name: string[];
  file_url?: string | null;
  user: any;
  recipients: number[];
  recipients_detail: any[];
  created_at: string;
  updated_at: string;
}


const MemoPage: React.FC = () => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [view, setView] = useState<"table" | "tiles">("table");
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMemo, setEditMemo] = useState<Memo | null>(null);
  const [readMemos, setReadMemos] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchMemos = () => {
    setLoading(true);
    api
      .get("/academics/memos/")
      .then((res) => {
        const sortedMemos = res.data
          .map((memo: any) => ({
            id: memo.id,
            title: memo.title,
            description: memo.description,
            date: memo.date,
            color: memo.color as "green" | "yellow" | "red" | "gray",
            from: memo.user?.email || "Unknown",
            file_name: Array.isArray(memo.file_name)
              ? memo.file_name
              : memo.file_name
              ? [memo.file_name]
              : [],
            file_url: Array.isArray(memo.file_url)
              ? memo.file_url
              : memo.file_url
              ? [memo.file_url]
              : [],
          }))
          // ✅ Sort by priority (Red → Yellow → Green → Gray)
          .sort((a: Memo, b: Memo) => {
            const priorityOrder = { red: 1, yellow: 2, green: 3, gray: 4 };
            return (
              (priorityOrder[a.color || "gray"] ?? 5) -
              (priorityOrder[b.color || "gray"] ?? 5)
            );
          });
        setMemos(sortedMemos);
      })
      .catch((err) => console.error("Fetch memos error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMemos();
    const stored = JSON.parse(localStorage.getItem("readDeanMemos") || "[]");
    setReadMemos(stored);
  }, []);

  const markAsRead = (id: number) => {
    if (!readMemos.includes(id)) {
      const updated = [...readMemos, id];
      setReadMemos(updated);
      localStorage.setItem("readDeanMemos", JSON.stringify(updated));
    }
  };

  const borderColor = (color: string | null) => {
    switch (color) {
      case "green":
        return "#22c55e";
      case "yellow":
        return "#facc15";
      case "red":
        return "#ef4444";
      default:
        return "#d1d5db";
    }
  };

  const createMemo = (formData: FormData) => {
    return api
      .post("/academics/memos/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(() => fetchMemos())
      .finally(() => setShowCreateModal(false));
  };

  const updateMemo = (id: number, formData: FormData) => {
    return api
      .put(`/academics/memos/${id}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(() => fetchMemos())
      .finally(() => setShowEditModal(false));
  };

  const deleteMemo = (id: number) => {
    api
      .delete(`/academics/memos/${id}/`)
      .then(() => fetchMemos())
      .catch((err) => console.error("Delete memo error:", err));
  };

  const filteredMemos = memos.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  ); // try

  return (
    <div className="flex-1 flex flex-col"> 
      <div className="shadow rounded-lg mt-5 mx-auto bg-white p-6 w-[90%]"> 
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            Memorandum
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            <span className="text-red-500 font-semibold">Red</span> = Extremely
            Important,{" "}
            <span className="text-yellow-500 font-semibold">Yellow</span> =
            Important,{" "}
            <span className="text-green-500 font-semibold">Green</span> = Not
            too important,{" "}
            <span className="text-gray-500 font-semibold">Gray</span> =
            Unimportant but must read.
          </p>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search.."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
            <Icon
              icon="mdi:magnify"
              className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setView("table")}
              className={`p-2 rounded-xl transition ${
                view === "table" ? "bg-[#c3dff3]" : "bg-[#d7ecf9]"
              }`}
              title="Table View"
            >
              <Icon icon="mdi:table" width={22} height={22} />
            </button>
            <button
              onClick={() => setView("tiles")}
              className={`p-2 rounded-xl transition ${
                view === "tiles" ? "bg-[#c3dff3]" : "bg-[#d7ecf9]"
              }`}
              title="Tile View"
            >
              <Icon icon="mdi:view-grid" width={22} height={22} />
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-xl hover:scale-105 transition px-6 py-2 text-black font-semibold flex items-center gap-2 bg-[#d7ecf9]"
            >
              <Icon icon="mdi:plus-circle" />
              Create Memo
            </button>
          </div>
        </div>

        {showCreateModal && (
          <MemoModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={createMemo}
          />
        )}
        {showEditModal && editMemo && (
          <MemoModal
            memo={editMemo}
            onClose={() => setShowEditModal(false)}
            onSubmit={(formData) =>
              editMemo.id && updateMemo(editMemo.id, formData)
            }
          />
        )}

        {loading ? (
          <p className="text-center text-gray-500 py-6">Loading memos...</p>
        ) : view === "table" ? (
          <MemoTable
            memos={filteredMemos}
            readMemos={readMemos}
            markAsRead={markAsRead}
            deleteMemo={deleteMemo}
            setEditMemo={setEditMemo}
            setShowEditModal={setShowEditModal}
            borderColor={borderColor}
            navigate={navigate}
          />
        ) : (
          <MemoTiles
            memos={filteredMemos}
            readMemos={readMemos}
            markAsRead={markAsRead}
            borderColor={borderColor}
            navigate={navigate}
          />
        )}
      </div> 
    </div>
  );
};

export default MemoPage;

/* -------------------- MODAL COMPONENT -------------------- */
interface MemoModalProps {
  memo?: Memo;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}

const MemoModal: React.FC<MemoModalProps> = ({ memo, onClose, onSubmit }) => {

  // CITC memo format fields
  const [memoNumber, setMemoNumber] = useState(memo?.memo_no || "");
  const [forField, setForField] = useState(memo?.to_field || "");
  const [fromField, setFromField] = useState(memo?.from_field || "");
  const [subject, setSubject] = useState(memo?.subject || "");

  // dynamic rows: [{ code: "1.0", text: "something" }]
  const [rows, setRows] = useState(
    memo?.rows || [{ code: "", text: "" }]
  );

  const [title, setTitle] = useState(memo?.title || "");
  const [description, setDescription] = useState(memo?.description || "");
  const [color, setColor] = useState(memo?.color || "green");
  const [file, setFile] = useState<File | null>(null);
  const [date] = useState(
    memo?.date || new Date().toISOString().split("T")[0]
  ); // ✅ Auto-set
  const [recipients, setRecipients] = useState<
    { id: number; email: string; roles: string[] }[]
  >([]);
  const [allUsers, setAllUsers] = useState<
    { id: number; email: string; roles: string[] }[]
  >([]);
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description || "");
    formData.append("date", date);
    formData.append("memo_no", memoNumber);
    formData.append("to_field", forField);
    formData.append("from_field", fromField);
    formData.append("subject", subject);
    formData.append("color", color);
    formData.append("rows", JSON.stringify(rows));
    if (file) formData.append("file_url", file);

    recipients.forEach((r) => {
      formData.append("recipients", String(r.id));
    });

    await onSubmit(formData);

    setSubmitting(false);
  };

  useEffect(() => {
    api
      .get("/users/suggestions/")
      .then((res) => setAllUsers(res.data))
      .catch((err) => console.error("Error fetching users:", err));
  }, []);

  const filtered = allUsers.filter((u) =>
    u.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-[90%] max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          {memo ? "Edit Memo" : "Create Memo"}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            placeholder="Enter title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded px-2 py-1"
            required
          />

          <label className="text-sm font-medium">Memorandum No.</label>
          <input
            className="border rounded px-2 py-1 w-full"
            placeholder="Ex. 46, s. of 2024"
            value={memoNumber}
            onChange={(e) => setMemoNumber(e.target.value)}
          />

          <label className="text-sm font-medium mt-2">FOR :</label>
          <input
            className="border rounded px-2 py-1 w-full"
            value={forField}
            onChange={(e) => setForField(e.target.value)}
          />

          <label className="text-sm font-medium mt-2">FROM :</label>
          <input
            className="border rounded px-2 py-1 w-full"
            value={fromField}
            onChange={(e) => setFromField(e.target.value)}
          />

          <label className="text-sm font-medium mt-2">SUBJECT :</label>
          <input
            className="border rounded px-2 py-1 w-full"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <hr className="my-4 border-t-2" />

          <h3 className="font-semibold mb-2">Memo Items</h3>

          {rows.map((row, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                className="border rounded px-2 py-1 w-24"
                placeholder="1.0"
                value={row.code}
                onChange={(e) => {
                  const updated = [...rows];
                  updated[index].code = e.target.value;
                  setRows(updated);
                }}
              />
              <input
                className="border rounded px-2 py-1 flex-1"
                placeholder="Enter memo item text..."
                value={row.text}
                onChange={(e) => {
                  const updated = [...rows];
                  updated[index].text = e.target.value;
                  setRows(updated);
                }}
              />

              <button
                type="button"
                onClick={() => {
                  const updated = rows.filter((_, i) => i !== index);
                  setRows(updated);
                }}
                className="px-3 bg-red-500 text-white rounded"
              >
                ×
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setRows([...rows, { code: "", text: "" }])}
            className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            + Add Row
          </button>

          <label className="text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            placeholder="Enter description"
            value={description || ""}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded px-2 py-1"
            required
          />

          <label className="text-sm font-medium text-gray-700">Date & Time</label>
          <div className="flex items-center justify-between w-full border rounded px-2 py-1 bg-gray-100 cursor-not-allowed">
            <span>{date}</span>
          </div>

          <label className="text-sm font-medium text-gray-700">Priority</label>
          <select
            value={color}
            onChange={(e) =>
              setColor(e.target.value as "green" | "yellow" | "red" | "gray")
            }
            className="w-full border rounded px-2 py-1"
          >
            <option value="red">Red (Extremely Important)</option>
            <option value="yellow">Yellow (Important)</option>
            <option value="green">Green (Not too important)</option>
            <option value="gray">Gray (Unimportant but must read)</option>
          </select>

          <label className="text-sm font-medium text-gray-700">
            Recipients
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            placeholder="Type email..."
            className="w-full border rounded px-2 py-1"
          />

          {showDropdown && (
            <div className="border rounded bg-white shadow mt-1 max-h-40 overflow-y-auto">
              {filtered.length > 0 ? (
                filtered.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => {
                      if (!recipients.some((r) => r.id === user.id)) {
                        setRecipients([...recipients, user]);
                      }
                      setQuery("");
                      setShowDropdown(false);
                    }}
                    className="px-2 py-1 cursor-pointer hover:bg-gray-100"
                  >
                    <span className="font-medium">{user.email}</span>{" "}
                    <span className="text-xs text-gray-500">
                      ({user.roles.join(", ") || "No Role"})
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-2 py-1 text-gray-400">No matches</div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-2">
            {recipients.map((r) => (
              <span
                key={r.id}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
              >
                {r.email}{" "}
                <button
                  type="button"
                  onClick={() =>
                    setRecipients(recipients.filter((x) => x.id !== r.id))
                  }
                  className="text-red-500 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <label className="text-sm font-medium text-gray-700">
            Upload File
          </label>
          <div className="flex items-center gap-2">
            <input
              id="file-upload"
              type="file"
              onChange={(e) =>
                e.target.files && setFile(e.target.files[0])
              }
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add File
            </label>
            {file && (
              <span className="text-sm text-gray-600 truncate max-w-[150px]">
                {file.name}
              </span>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>
            <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center gap-2"
                disabled={submitting}
              >
                {submitting && (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {submitting ? "Saving..." : "Save"}
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* -------------------- TABLE & TILES COMPONENTS -------------------- */
interface MemoTableProps {
  memos: Memo[];
  readMemos: number[];
  markAsRead: (id: number) => void;
  deleteMemo: (id: number) => void;
  setEditMemo: (memo: Memo) => void;
  setShowEditModal: (b: boolean) => void;
  borderColor: (color: string | null) => string;
  navigate: ReturnType<typeof useNavigate>; // <-- add this
}

const MemoTable: React.FC<MemoTableProps> = ({
  memos,
  readMemos,
  markAsRead,
  deleteMemo,
  setEditMemo,
  setShowEditModal,
  borderColor,
  navigate,
}) => (
  <div className="overflow-x-auto">
    <table className="w-full table-fixed border-separate border-spacing-y-2">
      <thead>
        <tr className="bg-[#007BFF] text-white text-sm">
          <th className="px-2 py-2 w-[15%] rounded-l-lg">Title</th>
          <th className="px-2 py-2 w-[45%]">Description</th>
          <th className="px-2 py-2 w-[15%]">Date</th>
          <th className="px-2 py-2 w-[25%]">Files / Action</th>
        </tr>
      </thead>
      <tbody className="text-sm text-gray-700">
        {memos.length > 0 ? (
          memos.map((memo) => (
            <tr key={memo.id}>
              <td colSpan={4} className="p-0">
                <div
                  onClick={() => {
                    markAsRead(memo.id);
                    navigate(`/dean/memos/${memo.id}`);
                  }}
                  className="grid grid-cols-4 items-center rounded shadow-sm cursor-pointer px-2 py-2"
                  style={{
                    border: `2px solid ${borderColor(memo.color)}`,
                    backgroundColor: readMemos.includes(memo.id) ? "#ffffff" : "#e5e7eb",
                  }}
                >
                  <div className="truncate font-medium pr-2">{memo.title}</div>
                  <div className="truncate px-2">{memo.description}</div>
                  <div className="text-sm text-gray-600 pr-2">{memo.date ? new Date(memo.date).toLocaleDateString() : ""}</div>
                  <div className="flex flex-col gap-2 justify-end items-end">
                    <div className="flex gap-2 mt-1">
                     {memo.file_name && (
                        <a
                          href={memo.file_name[0]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-500 gap-2 bg-gray-100 p-3 rounded hover:bg-gray-200 transition"
                          onClick={(e) => e.stopPropagation()} // ✅ prevents row click
                        >
                          <Icon icon="mdi:download" width={18} height={18} />
                          Download
                        </a>
                      )}
                      <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditMemo(memo);
                                setShowEditModal(true);
                              }}
                              className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 flex items-center justify-center"
                        title="Edit"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMemo(memo.id);
                        }}
                        className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 flex items-center justify-center"
                          title="Delete"
                        >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={4} className="text-center py-6 text-gray-500">
              No memos available at the moment.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

interface MemoTilesProps {
  memos: Memo[];
  readMemos: number[];
  markAsRead: (id: number) => void;
  borderColor: (color: string | null) => string;
  navigate: ReturnType<typeof useNavigate>;
}

const MemoTiles: React.FC<MemoTilesProps> = ({
    memos,
    readMemos,
    markAsRead,
    borderColor,
    navigate,
  }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {memos.length > 0 ? (
      memos.map((memo) => (
        <div
          key={memo.id}
          className="p-4 rounded-lg shadow cursor-pointer transition"
          style={{
            border: `2px solid ${borderColor(memo.color)}`,
            backgroundColor: readMemos.includes(memo.id) ? "#ffffff" : "#e5e7eb",
          }}
          onClick={() => {
            markAsRead(memo.id);
            navigate(`/dean/memos/${memo.id}`);
          }}
        >
          <h2 className="text-lg font-semibold mb-2 truncate">{memo.title}</h2>
          <p className="text-gray-600 mb-2 line-clamp-3">{memo.description}</p>
          <div className="text-sm text-gray-500 mb-3">{memo.date ? new Date(memo.date).toLocaleDateString() : ""}</div>
          {memo.file_name && (
            <a
              href={memo.file_name[0]}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-500 gap-2 bg-gray-100 p-3 rounded hover:bg-gray-200 transition"
              onClick={(e) => e.stopPropagation()}
            >
              <Icon icon="mdi:download" width={18} height={18} />
              Download
            </a>
          )}
        </div>
      ))
    ) : (
      <p className="text-center py-6 text-gray-500 col-span-full">No memos available at the moment.</p>
    )}
  </div>
);
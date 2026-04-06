import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import api from "../api";

interface Memo {
  id: number;
  title: string;
  description: string | null;
  date: string | null;
  color: "green" | "yellow" | "red" | "gray" | null;
  from: string;
  file_name: string[];
  file_url?: string | null;
  recipients: number[];
}

const getActiveRole = () =>
  (localStorage.getItem("activeRole") || "GUEST").toUpperCase();

const MemoPage: React.FC = () => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [view, setView] = useState<"table" | "tiles">("table");
  const [search, setSearch] = useState("");
  const [readMemos, setReadMemos] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch memos
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
            recipients: memo.recipients || [],
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
  
  const activeRole = getActiveRole();
  const storageKey = `readMemos_${activeRole}`;

  useEffect(() => {
    fetchMemos();
    const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
    setReadMemos(stored);
  }, []);

  const markAsRead = (id: number) => {
    if (!readMemos.includes(id)) {
      const updated = [...readMemos, id];
      setReadMemos(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));
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

  const filteredMemos = memos.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col"> 
      <div className="shadow mt-5 mx-auto rounded-lg bg-white p-6 w-[90%]">
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
              placeholder="Search..."
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
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-6">Loading memos...</p>
        ) : view === "table" ? (
          <MemoTable
            memos={filteredMemos}
            readMemos={readMemos}
            markAsRead={markAsRead}
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

/* -------------------- TABLE COMPONENT -------------------- */
interface MemoTableProps {
  memos: Memo[];
  readMemos: number[];
  markAsRead: (id: number) => void;
  borderColor: (color: string | null) => string;
  navigate: ReturnType<typeof useNavigate>;
}

const roleBasedLink = (path: string) => {
  const role = getActiveRole(); // always fresh

  switch (role) {
    case "ADMIN":
      return `/admin${path}`;
    case "DEAN":
      return `/dean${path}`;
    case "BAYANIHAN_LEADER":
      return `/bayanihan_leader${path}`;
    case "BAYANIHAN_TEACHER":
      return `/bayanihan_teacher${path}`;
    default:
      return `${path}`;
  }
};

const MemoTable: React.FC<MemoTableProps> = ({
  memos,
  readMemos,
  markAsRead,
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
          <th className="px-2 py-2 w-[25%] rounded-r-lg">Files</th>
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
                    navigate(roleBasedLink(`/memos/${memo.id}`));
                  }}
                  className="grid grid-cols-4 items-center rounded shadow-sm cursor-pointer px-2 py-2"
                  style={{
                    border: `2px solid ${borderColor(memo.color)}`,
                    backgroundColor: readMemos.includes(memo.id)
                      ? "#ffffff"
                      : "#e5e7eb",
                  }}
                >
                  <div className="truncate font-medium pr-2">{memo.title}</div>
                  <div className="truncate px-2">{memo.description}</div>
                  <div className="text-sm text-gray-600 pr-2">
                    {memo.date ? new Date(memo.date).toLocaleDateString() : ""}
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end items-end">
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

/* -------------------- TILES COMPONENT -------------------- */
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
              backgroundColor: readMemos.includes(memo.id)
                ? "#ffffff"
                : "#e5e7eb",
            }}
            onClick={() => {
              markAsRead(memo.id);
              navigate(roleBasedLink(`/memos/${memo.id}`));
            }}
          >
            <h2 className="text-lg font-semibold mb-2 truncate">{memo.title}</h2>
            <p className="text-gray-600 mb-2 line-clamp-3">{memo.description}</p>
          <div className="text-sm text-gray-500 mb-3">
            {memo.date ? new Date(memo.date).toLocaleDateString() : ""}
          </div>
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
        </div>
      ))
    ) : (
      <p className="text-center py-6 text-gray-500 col-span-full">
        No memos available at the moment.
      </p>
    )}
  </div>
);

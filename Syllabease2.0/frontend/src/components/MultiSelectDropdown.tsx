import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Label } from "flowbite-react";
import { motion, AnimatePresence } from "framer-motion";

type User = {
  id: number;
  username: string;
  faculty_id: string;
  first_name: string;
  last_name: string;
};

interface MultiSelectProps {
  label: string;
  selectedIds: number[];
  users: User[];
  onAdd: (id: number) => void;
  onRemove: (id: number) => void;
  excludeIds?: number[];
}

export default function MultiSelectDropdown({
  label,
  selectedIds,
  users,
  onAdd,
  onRemove,
  excludeIds
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [search, setSearch] = useState(""); // ✅ search query

  const displayName = (u: User) =>
    `${u.first_name} ${u.last_name}`.trim() || u.username;

  // Filter users based on selection, exclusion, and search query
  const filteredUsers = users.filter(
    (u) =>
      !selectedIds.includes(u.id) &&
      !(excludeIds?.includes(u.id)) &&
      (displayName(u).toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        (u.faculty_id && u.faculty_id.includes(search)))
  );

  // Compute dropdown position (so it appears above modal)
  useEffect(() => {
    if (open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [open]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        !containerRef.current?.contains(e.target as Node) &&
        !dropdownRef.current?.contains(e.target as Node) // ✅ also check portal dropdown
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <Label>{label}</Label>

      <div
        onClick={() => setOpen((s) => !s)}
        className="mt-1 min-h-[42px] border rounded p-2 flex flex-wrap gap-2 bg-white cursor-pointer hover:border-blue-400 focus:ring-2 focus:ring-blue-400"
      >
        {selectedIds.length > 0 ? (
          selectedIds.map((id) => {
            const user = users.find((u) => u.id === id);
            if (!user) return null;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 border rounded px-2 py-1 text-sm bg-blue-50 border-blue-200"
              >
                {displayName(user)}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(id);
                  }}
                  className="text-red-500 font-bold hover:text-red-700"
                >
                  ×
                </button>
              </span>
            );
          })
        ) : (
          <span className="text-gray-400">
            Click to add {label.toLowerCase()}...
          </span>
        )}
      </div>

      {/* Portalized dropdown */}
      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={dropdownRef} // ✅ attach ref here
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: "absolute",
                  top: dropdownPos.top,
                  left: dropdownPos.left,
                  width: dropdownPos.width,
                  zIndex: 9999,
                }}
                className="bg-white border border-gray-200 rounded shadow-lg max-h-[220px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
              >
                {/* Search input */}
                <div className="p-2 sticky top-0 bg-white z-10 border-b border-gray-200">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>

                {filteredUsers.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No users found
                  </div>
                ) : (
                  filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        onAdd(u.id);
                        setOpen(false); // auto-close
                        setSearch(""); // reset search
                      }}
                      className="block w-full text-left px-3 py-2 hover:bg-blue-50"
                    >
                      {displayName(u)} {u.faculty_id ? `- ID: ${u.faculty_id}` : ""}
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}

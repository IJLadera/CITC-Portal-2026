import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../../api";
import { Button } from "flowbite-react";

interface AuditUser {
  firstname: string;
  lastname: string;
}

interface AuditLog {
  id: number;
  event: string;
  user: AuditUser;
  changes: Record<string, { old: string; new: string }>;
  created_at: string;
}

export default function TOSAudit() {
  const { tosId } = useParams<{ tosId: string }>();
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;  

  useEffect(() => {
    if (!tosId) return;

    api.get(`/tos/${tosId}/audit-logs/`)
    .then((res) => setAudits(res.data))
    .catch((err) => console.error(err));
  }, [tosId]);

  // Pagination logic
  const totalPages = Math.ceil(audits.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentAudits = audits.slice(startIndex, startIndex + pageSize);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="min-h-screen my-14 mx-16">
      <div className="w-full">
        <table className="table-fixed w-full text-xs text-left border border-collapse">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="p-3 border border-white w-24">Action</th>
              <th className="p-3 border border-white w-32">User</th>
              <th className="p-3 border border-white w-1/4">Old Values</th>
              <th className="p-3 border border-white w-1/4">New Values</th>
              <th className="p-3 border border-white w-48">Timestamp</th>
            </tr>
          </thead>
          <tbody className="text-black divide-y divide-gray-200 bg-gray-50">
            {currentAudits.map((audit) => (
              <tr key={audit.id}>
                <td className="px-3 py-2 border border-gray-300">
                  {audit.event}
                </td>
                <td className="px-3 py-2 border border-gray-300">
                  {audit.user.firstname !== "" && audit.user.lastname !== ""
                    ? `${audit.user.firstname} ${audit.user.lastname}`
                    : "System"}
                </td>

                {/* Old Values */}
                <td className="px-3 py-2 border border-gray-300 whitespace-normal break-words">
                  {Object.entries(audit.changes || {}).length > 0 ? (
                    Object.entries(audit.changes).map(([key, value]) => (
                      <div key={key} className="text-red-600">
                        <strong>{key}:</strong> {value.old}
                      </div>
                    ))
                  ) : (
                    <span className="italic text-gray-400">—</span>
                  )}
                </td>

                {/* New Values */}
                <td className="px-3 py-2 border border-gray-300 whitespace-normal break-words">
                  {Object.entries(audit.changes || {}).length > 0 ? (
                    Object.entries(audit.changes).map(([key, value]) => (
                      <div key={key} className="text-green-600">
                        <strong>{key}:</strong> {value.new}
                      </div>
                    ))
                  ) : (
                    <span className="italic text-gray-400">—</span>
                  )}
                </td>

                <td className="px-3 py-2 border border-gray-300 whitespace-normal break-words">
                  {formatDateTime(audit.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-4 space-x-2 text-sm">
          <Button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 disabled:opacity-50 cursor-pointer"
          >
            Previous
          </Button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-3 py-1 disabled:opacity-50 cursor-pointer"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
  
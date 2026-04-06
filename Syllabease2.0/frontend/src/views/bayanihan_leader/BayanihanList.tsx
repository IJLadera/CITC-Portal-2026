import { useEffect, useMemo, useState } from "react";
import { Button, Select, Spinner, TextInput } from "flowbite-react";
import api from "../../api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Types
type Course = {
  id: number;
  course_code: string;
  course_title: string;
  course_semester: string;
};

type User = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
};

type Member = {
  id: number;
  user: User;
  role: "LEADER" | "TEACHER";
};

type BayanihanGroup = {
  id: number;
  school_year: string;
  course: Course;
  bayanihan_members: Member[];
};

export default function BayanihansList() {
  const activeRole = localStorage.getItem("activeRole");
  const role = activeRole?.toUpperCase();
  const [groups, setGroups] = useState<BayanihanGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [selectedSemester, setSelectedSemester] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch groups
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const params: Record<string, any> = {
          role,
          page: currentPage,
          page_size: 5,
        };

        if (selectedYear !== "All") params.school_year = selectedYear;
        if (selectedSemester !== "All") params.semester = selectedSemester;
        if (searchTerm.trim()) params.search = searchTerm.trim();

        const res = await api.get("/bayanihan/groups/", { params });
        if (!mounted) return;

        const data = res.data;
        setGroups(data.groups || []);
        setTotalPages(data.total_pages || 1);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load Bayanihan groups.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [role, currentPage, selectedYear, selectedSemester, searchTerm]);

  const displayName = (u: User) =>
    `${u.first_name} ${u.last_name}`.trim() || u.username;

  // Derive available school years
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(groups.map((g) => g.school_year)));
    return years.sort((a, b) => b.localeCompare(a)); // descending
  }, [groups]);

  return (
    <div className="flex-1 flex flex-col relative">
      <ToastContainer position="top-right" autoClose={5000} theme="colored" />

      <main className="p-4 mt-5 justify-center">
        <div className="w-full shadow rounded-lg bg-white p-6 relative">
          {/* Loading overlay — outside table */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50">
              <Spinner size="xl" />
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-4 gap-4">
            <h1 className="text-xl font-bold">Bayanihan Groups</h1>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* School Year Filter */}
              <Select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-40"
              >
                <option value="All">All Years</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>

              {/* Semester Filter */}
              <Select
                value={selectedSemester}
                onChange={(e) => {
                  setSelectedSemester(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-40"
              >
                <option value="All">All Semesters</option>
                <option value="1st">1st Semester</option>
                <option value="2nd">2nd Semester</option>
                <option value="Summer">Summer</option>
              </Select>

              {/* Search */}
              <TextInput
                type="text"
                placeholder="Search course..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-52"
              />
            </div>
          </div>

          {/* Table */}
          <div className="mt-4 overflow-hidden rounded relative">
            <table className="w-full text-sm border border-gray-300">
              <thead>
                <tr className="bg-[#007BFF] text-white">
                  <th className="p-2">School Year</th>
                  <th className="p-2">Course</th>
                  <th className="p-2">Semester</th>
                  <th className="p-2">Leaders</th>
                  <th className="p-2">Teachers</th>
                </tr>
              </thead>
              <tbody>
                {groups.length > 0 ? (
                  groups.map((g) => (
                    <tr key={g.id} className="border-t">
                      <td className="border border-gray-300 p-2">
                        {g.school_year}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {g.course.course_code} - {g.course.course_title}
                      </td>
                      <td className="border border-gray-300 p-2 capitalize">
                        {g.course.course_semester.toLowerCase()} Semester
                      </td>
                      <td className="border border-gray-300 p-2 align-top">
                        {g.bayanihan_members
                          .filter((m) => m.role === "LEADER")
                          .map((m) => (
                            <div key={m.id} className="leading-tight">
                              {displayName(m.user)}
                            </div>
                          ))}
                      </td>
                      <td className="border border-gray-300 p-2 align-top">
                        {g.bayanihan_members
                          .filter((m) => m.role === "TEACHER")
                          .map((m) => (
                            <div key={m.id} className="leading-tight">
                              {displayName(m.user)}
                            </div>
                          ))}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center text-gray-500 py-4 italic"
                    >
                      No groups found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-center items-center mt-4 gap-4">
              <Button
                className="bg-black"
                size="xs"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span>
                Page {currentPage} of {totalPages || 1}
              </span>
              <Button
                className="bg-black"
                size="xs"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

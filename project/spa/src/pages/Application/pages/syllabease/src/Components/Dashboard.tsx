import { useAppSelector } from "../../../../../../hooks";
import { RootState } from "../../../../../../store";

export default function SyllabeaseDashboard() {
    const user = useAppSelector((state: RootState) => state.auth.user);

    return (
        <div className="p-6 max-w-5xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome to Syllabease
                </h1>
                <p className="text-text-gray-600 text-sm">
                    Hello, {user.first_name} {user.last_name}! Manage your course syllabi here.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Stats Cards */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="text-gray-500 text-xs font-medium mb-2">
                        Total Syllabi
                    </div>
                    <div className="text-2xl font-bold text-gray-900">0</div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="text-gray-500 text-xs font-medium mb-2">
                        Active Courses
                    </div>
                    <div className="text-2xl font-bold text-gray-900">0</div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="text-gray-500 text-xs font-medium mb-2">
                        Last Updated
                    </div>
                    <div className="text-2xl font-bold text-gray-900">—</div>
                </div>
            </div>

            {/* Getting Started Section */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h2 className="text-base font-semibold text-blue-900 mb-2">
                    Getting Started
                </h2>
                <p className="text-blue-800 text-sm mb-3">
                    Welcome to Syllabease 2.0! You can now manage your course syllabi directly from the CITC Portal.
                </p>
                <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
                    <li>View and manage course syllabi</li>
                    <li>Create new syllabi for your courses</li>
                    <li>Share syllabus information with students</li>
                    <li>Track syllabus updates and versions</li>
                </ul>
            </div>
        </div>
    );
}

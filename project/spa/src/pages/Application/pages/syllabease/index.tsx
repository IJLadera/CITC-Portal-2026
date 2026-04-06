import { Navigate } from "react-router-dom";

/**
 * Redirect to the new Syllabease dashboard
 * This file is kept for backwards compatibility
 */
export default function SyllabeaseLegacy() {
    return <Navigate to="/syllabease/dashboard/" replace />;
}

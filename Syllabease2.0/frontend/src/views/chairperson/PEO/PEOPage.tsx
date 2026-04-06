import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../api";
import { Button, Spinner } from "flowbite-react";
import { ToastContainer } from "react-toastify";

type ProgramEducationalObjective = {
  id: number;
  peo_code: string;
  peo_description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  program: number;
};
 
type Program = {
  id: number;
  program_name: string; 
};

export default function PEOPage() {
  const activeRole = localStorage.getItem("activeRole");
  const role = activeRole?.toUpperCase();
  const { poId } = useParams<{ poId: string }>(); 

  const [peos, setPeos] = useState<ProgramEducationalObjective[]>([]);
  const [program, setProgram] = useState<Program | null>(null);
  const [loadingProg, setLoadingProg] = useState(true);
  const [loadingPEOs, setLoadingPEOs] = useState(true);
  const navigate = useNavigate();

  // Fetch department info
  useEffect(() => {
    if (!poId) return;

    setLoadingProg(true);
    api
      .get(`/academics/programs/${poId}/`, {
        params: { role: role },
      })
      .then((res) => setProgram(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoadingProg(false));
  }, [poId]);

  // Fetch PEOs
  useEffect(() => {
    if (!poId) return;

    setLoadingPEOs(true);
    api
      .get("/academics/peos/", {
        params: { program_id: poId },
      })
      .then((res) => setPeos(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoadingPEOs(false));
  }, [poId]);

  return (
    <div className="relative p-4 w-full">
      <div className="relative p-8 max-w-full bg-white rounded shadow my-auto"> 
        <ToastContainer position="top-right" autoClose={3000} theme="colored" /> 
        
        {/* Button at top right */}
        <div className="absolute top-6 right-6">
          <Button
            color="dark"
            onClick={() => navigate(`edit`)}
          >
            + Add PEOs
          </Button>
        </div>

        {/* Title & intro paragraph */}
        <div className="text-center mb-10">
          <h1 className="text-xl font-bold mb-4">
            Program Educational Objectives
          </h1>

          {loadingProg ? (
              <p className="text-base text-gray-600">Loading program...</p>
          ) : program ? (
            <p className="text-base">
              The <strong>{program.program_name}</strong> program has the
              following educational objectives:
            </p>
          ) : (
            <p className="text-base text-red-500">Failed to load department program info.</p>
          )}
        </div>

        {/* PEO list */}
        <div className="relative mt-4 min-h-[160px]">
          {loadingPEOs && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50">
              <Spinner size="lg" color="purple" aria-label="Loading PEOs" />
            </div>
          )}

          {!loadingPEOs && peos.length === 0 && (
            <p className="text-gray-500 text-center">
              No PEOs found for this program. Click{" "}
              <strong>&quot;Add PEOs&quot;</strong> button to add program
              educational objectives.
            </p>
          )}

          {!loadingPEOs && peos.length > 0 && (
            <div className="space-y-4 text-sm">
              {peos.map((peo) => (
                <p key={peo.id} className="pl-6">
                  <strong>{peo.peo_code}:</strong> {peo.peo_description}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

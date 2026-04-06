import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../api";
import { Button, Spinner } from "flowbite-react"; 
import { ToastContainer } from "react-toastify";

type ProgramOutcome = {
  id: number;
  po_letter: string;
  po_description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  program: number;
};

type Program = {
  id: number;
  program_name: string; 
};

export default function ProgramOutcomesPage() {
  const activeRole = localStorage.getItem("activeRole");
  const role = activeRole?.toUpperCase();
  const { poId } = useParams<{ poId: string }>();  

  const [programOutcomes, setProgramOutcomes] = useState<ProgramOutcome[]>([]);
  const [program, setProgram] = useState<Program | null>(null); 
  const [loadingProg, setLoadingProg] = useState(true);
  const [loadingPOs, setLoadingPOs] = useState(false);
  const navigate = useNavigate();

  // Fetch program info
  useEffect(() => {
    if (!poId) return;

    setLoadingProg(true);
    api.get(`/academics/programs/${poId}/`, {
        params: { role: role },
      })
      .then((res) => setProgram(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoadingProg(false));
  }, [poId]);

  // Fetch POs for this program
  useEffect(() => {
    if (!poId) return;

    let mounted = true;
    const loadPOs = async () => {
      try {
        setLoadingPOs(true);
        const res = await api.get("/academics/program-outcomes/", {
          params: { program_id: poId },
        });
        if (!mounted) return;
        setProgramOutcomes(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoadingPOs(false);
      }
    };
    loadPOs();
    return () => {
      mounted = false;
    };
  }, [poId]);

  return (
    <div className="relative p-4 w-full">
      <div className="relative p-8 max-w-full bg-white rounded shadow my-auto">
        <ToastContainer position="top-right" autoClose={3000} theme="colored" /> 

        {/* Button positioned at top right */}
        <div className="absolute top-8 right-8">
          <Button
            className="bg-[#454544]"
            onClick={() =>
              navigate(`edit`)
            }
          >
            + Add Program Outcomes
          </Button>
        </div>

        {/* Title & intro paragraph */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold mb-4">Program Outcomes</h1> 

          {loadingProg ? (
              <p className="text-base text-gray-600">Loading program...</p>
          ) : program ? (
            <p className="text-base">
              Upon completion of the{" "}
              <strong>{program.program_name}</strong> program, graduates are
              able to:
            </p>
          ) : (
            <p className="text-base text-red-500">Failed to load department program info.</p>
          )}
        </div>

        {/* Program Outcomes */}
        <div className="relative mt-4 min-h-[160px]">
          {loadingPOs && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50">
              <Spinner size="lg" color="purple" aria-label="Loading POs" />
            </div>
          )}

          {!loadingPOs && programOutcomes.length === 0 && (
            <p className="text-gray-500 text-center">
              No program outcomes found for this program. Click "Add Program
              Outcomes" button to add program outcomes.
            </p>
          )}

          {!loadingPOs && programOutcomes.length > 0 && (
            <div className="space-y-3 text-sm">
              {programOutcomes.map((po) => (
                <p key={po.id} className="ml-10">
                  <strong>{po.po_letter}:</strong> {po.po_description}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

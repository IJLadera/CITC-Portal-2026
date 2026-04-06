import React, { useEffect, useState } from "react";
import { Button } from "flowbite-react";
import { useParams, useNavigate } from "react-router-dom"; 
import api from "../../../api";
import { toast, ToastContainer } from "react-toastify";

export type ProgramOutcome = {
  id?: number;  
  po_letter: string;
  po_description: string;
};

export default function PoCreate() {
  const { poId } = useParams<{ poId: string }>();
  const navigate = useNavigate();

  const [outcomes, setOutcomes] = useState<ProgramOutcome[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch existing active Program Outcomes
  useEffect(() => {
    if (!poId) return;
    api.get("/academics/program-outcomes/", { params: { program_id: poId } })
      .then((res) => {
        setOutcomes(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [poId]);

  const handleAddRow = () => {
    setOutcomes([...outcomes, { po_letter: "", po_description: "" }]);
  };

  const handleChange = (index: number, field: "po_letter" | "po_description", value: string ) => {
    const newOutcomes = [...outcomes];
    newOutcomes[index][field] = value;
    setOutcomes(newOutcomes);
  };

  const handleDeleteRow = async (index: number) => {
    const po = outcomes[index];
    if (po.id) { 
      try {
        await api.delete(`/academics/program-outcomes/${po.id}/`);
        toast.success("Program outcome deleted successfully!");

      } catch (err: any) {
        toast.error("Failed to delete program outcome.", err);
        return;
      } 
    }
    setOutcomes(outcomes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    for (const po of outcomes) {
      if (po.id) {
        // update existing PO
        try {
          await api.put(`/academics/program-outcomes/${po.id}/`, po); 
        } catch (err: any) {
          toast.error("Failed to update program outcome.", err);
        } 
        
      } else {
        // create new PO
        try {
          await api.post("/academics/program-outcomes/", {
            ...po,
            program: Number(poId),
          }); 
        } catch (err: any) {
          toast.error("Failed to create program outcome.", err);
        } 
      }
    }
 
    toast.success("Program Outcomes saved successfully!"); 
    navigate(-1);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6 mt-12 my-auto mx-auto shadow-lg bg-white rounded-lg w-11/12 max-w-5xl">
      <ToastContainer position="top-right" autoClose={3000} theme="colored" /> 

      <div className="text-center mb-6">
        <img
          className="mx-auto w-96"
          src="/assets/Create Program Outcomes.png"
          alt="Create Program Outcome"
        />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {outcomes.map((outcome, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                placeholder="a"
                type="text"
                value={outcome.po_letter}
                maxLength={1} 
                onChange={(e) => handleChange(index, "po_letter", e.target.value)}
                className="w-12 border-2 border-gray-400 text-center rounded"
                required
              />
              <span className="font-bold">:</span>
              <input
                placeholder="e.g Apply knowledge of computing, science..."
                type="text"
                value={outcome.po_description}
                onChange={(e) => handleChange(index, "po_description", e.target.value)}
                className="flex-1 border-2 border-gray-400 rounded px-2 py-1"
                required
              />
              <Button
                type="button"
                color="red"
                size="sm"
                onClick={() => handleDeleteRow(index)}
                className="ml-2"
              >
                Delete
              </Button>
            </div>
          ))}

          <div className="flex justify-between mt-4">
            <Button type="button" color="blue" onClick={handleAddRow}>
              + Add Row
            </Button>
          </div>

          <div className="flex justify-end mt-6">
            <Button type="submit" color="blue">
              Save Program Outcomes
            </Button>
          </div>
        </div>
      </form>
    </div>

  );
}

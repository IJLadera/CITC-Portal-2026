import React, { useEffect, useState } from "react";
import { Button } from "flowbite-react";
import { useParams, useNavigate } from "react-router-dom"; 
import api from "../../../api";
import { toast, ToastContainer } from "react-toastify";

export type ProgramEducationalObjective = {
  id?: number;  
  peo_code: string;
  peo_description: string;
  is_active?: boolean;
};

export default function PEOCreate() {
  const { poId } = useParams<{ poId: string }>();
  const navigate = useNavigate();

  const [peos, setPeos] = useState<ProgramEducationalObjective[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch existing PEOs
  useEffect(() => {
    if (!poId) return;
    api.get("/academics/peos/", { params: { program_id: poId } })
      .then((res) => {
        setPeos(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [poId]);

  const handleAddRow = () => {
    setPeos([...peos, { peo_code: "", peo_description: "" }]);
  };

  const handleChange = (
    index: number,
    field: "peo_code" | "peo_description",
    value: string
  ) => {
    const newPEOs = [...peos]; 
    newPEOs[index][field] = value;
    setPeos(newPEOs);
  };

  const handleDeleteRow = async (index: number) => {
    const peo = peos[index];
    if (peo.id) {
      try { 
        await api.delete(`/academics/peos/${peo.id}/`);
        toast.success("PEO deleted successfully!");
      } catch (err: any) {
        toast.error("Failed to delete PEO.", err);
        return;
      } 
    }
    setPeos(peos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    for (const peo of peos) {
      if (peo.id) {
        try {
          await api.put(`/academics/peos/${peo.id}/`, peo); 
        } catch (err: any) {
          toast.error("Failed to update PEO.", err);
        } 
      } else {
        try {
          await api.post("/academics/peos/", {
            ...peo,
            program: Number(poId),
          }); 
        } catch (err: any) {
          toast.error("Failed to create PEO.", err);
        } 
      }
    }
 
    toast.success("PEOs saved successfully!"); 
    navigate(-1);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6 mt-12 my-auto mx-auto shadow-lg bg-white rounded-lg w-11/12 max-w-5xl">
      <ToastContainer position="top-right" autoClose={3000} theme="colored" /> 

      <div className="text-center mb-6">
        <img
          className="mx-auto w-126"
          src="/assets/Create Program Educational Objectives.png"
          alt="Create Program Educational Objectives"
        />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {peos.map((peo, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="PEO1"
                value={peo.peo_code}
                onChange={(e) =>
                  handleChange(index, "peo_code", e.target.value)
                }
                className="w-24 border-2 border-gray-400 text-center rounded"
                required
              />
              <span className="font-bold">:</span>
              <input
                placeholder="e.g Graduates will demonstrate leadership in..."
                type="text"
                value={peo.peo_description}
                onChange={(e) =>
                  handleChange(index, "peo_description", e.target.value)
                }
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
              Save PEOs
            </Button>
          </div>
        </div>
      </form>
    </div>

  );
}

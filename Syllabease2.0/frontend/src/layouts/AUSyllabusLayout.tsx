import { Outlet } from "react-router-dom";  
import AUSyllabusHeader from "../components/AUSyllabusHeader";

export default function AUSyllabusLayout() { 

  return (
    <div className="min-h-screen flex flex-col"
      style={{ 
          backgroundImage: "url(/assets/Wave.png)",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "top",
          backgroundAttachment: "fixed",
          backgroundSize: "cover",
      }}
    >
      <AUSyllabusHeader /> 

      {/* Page Content */}
      <main className="flex-1 flex justify-center items-start p-6">
        <Outlet />
      </main>
 
    </div>
  );
}

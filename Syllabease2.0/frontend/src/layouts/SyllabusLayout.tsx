import { Outlet } from "react-router-dom";  
import { SyllabusModeProvider } from "@/context/SyllabusModeContext";
import SyllabusHeader from "../components/SyllabusHeader";
import { ToastContainer } from "react-toastify";

export default function SyllabusLayout() { 

  return ( 
    <SyllabusModeProvider>
      <div className="min-h-screen flex flex-col"
        style={{ 
            backgroundImage: "url(/assets/Wave.png)",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "top",
            backgroundAttachment: "fixed",
            backgroundSize: "cover",
        }}
      >
        <SyllabusHeader /> 

        {/* Page Content */}
        <main className="flex-1 flex justify-center items-start p-6"> 
          <Outlet />
        </main>
  
      </div>
    </SyllabusModeProvider>
  );
}

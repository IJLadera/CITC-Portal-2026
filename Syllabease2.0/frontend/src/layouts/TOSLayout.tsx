import { Outlet } from "react-router-dom";   
import { TOSModeProvider } from "@/context/TOSModeContext";
import TOSHeader from "../components/TOSHeader";

export default function TOSLayout() { 

  return (
    <TOSModeProvider>
      <div className="min-h-screen flex flex-col"
        style={{
            backgroundImage: "url(/assets/Wave.png)",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "top",
            backgroundAttachment: "fixed",
            backgroundSize: "cover",
        }}
      >
        <TOSHeader />
        
        {/* Page Content */}
        <main className="flex-1 flex justify-center items-start p-6">
          <Outlet />
        </main>
      </div>
    </TOSModeProvider>
  );
}

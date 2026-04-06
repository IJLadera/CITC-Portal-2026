import { Outlet } from "react-router-dom";
import MainSidebar from "../components/MainSidebar";
import MainHeader from "../components/MainHeader";

export default function MainLayout() { 

  return (
    <div className="flex">
      <MainHeader />
      <div className="flex-1 ml-[248px] bg-white">
        <MainSidebar /> 

        {/* Page Content */}
        <main className="min-h-screen flex bg-[#ffffff] pt-14"
          style={{
            backgroundImage: "url(/assets/Wave.png)",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "top center",
            backgroundAttachment: "fixed", 
          }}
        >
          <Outlet />
        </main>

      </div>
    </div>
  );
}

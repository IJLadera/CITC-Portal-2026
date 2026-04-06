import { Outlet } from "react-router-dom"; 
import MainHeader from "../components/MainHeader";

export default function HeaderLayout() { 

  return (
    <div className="flex">
      <MainHeader />
      <div className="flex-1 bg-white"> 

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

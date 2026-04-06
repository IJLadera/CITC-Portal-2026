import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import RoutesComponent from "./components/RoutesComponent"; 

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RoutesComponent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

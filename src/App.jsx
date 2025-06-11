import Header from "./components/Header";
import Courses from "./components/Courses";

function App() {
  return (
    <div className="w-screen min-h-screen w-full bg-gray-50">
      <Header />
      {/* Page content goes here */}
      <Courses />
    </div>
  );
}

export default App;

import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Book from "./pages/Book";
import Colleges from "./pages/Colleges";
import Admin from "./pages/Admin";

function NotFound() {
  return (
    <section className="mx-auto max-w-md px-5 py-32 text-center">
      <h1 className="text-3xl font-bold text-white">404</h1>
      <p className="mt-3 text-zinc-400">That page doesn't exist.</p>
      <Link to="/" className="mt-6 inline-block text-indigo-400 hover:text-indigo-300">
        Back to home →
      </Link>
    </section>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/book" element={<Book />} />
          <Route path="/colleges" element={<Colleges />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

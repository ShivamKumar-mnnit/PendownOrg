import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import Book from "./pages/Book";
import Colleges from "./pages/Colleges";
import Admin from "./pages/Admin";
import Compiler from "./pages/Compiler";

function NotFound() {
  return (
    <section className="mx-auto max-w-md px-5 py-32 text-center">
      <h1 className="text-3xl font-bold text-(--color-fg)">404</h1>
      <p className="mt-3 text-(--color-fg-muted)">That page doesn't exist.</p>
      <Link to="/" className="mt-6 inline-block text-(--color-accent) hover:opacity-75 transition-opacity">
        Back to home →
      </Link>
    </section>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/book" element={<Book />} />
          <Route path="/colleges" element={<Colleges />} />
          <Route path="/compiler" element={<Compiler />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

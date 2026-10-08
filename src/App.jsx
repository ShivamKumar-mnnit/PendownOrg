import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";
import { Head, Page } from "./components/ui";
import Home from "./pages/Home";
import Book from "./pages/Book";
import Colleges from "./pages/Colleges";
import Admin from "./pages/Admin";
import Compiler from "./pages/Compiler";
import Mentors from "./pages/Mentors";
import Companies from "./pages/Companies";
import CompanyDetail from "./pages/CompanyDetail";
import Courses from "./pages/Courses";
import Placement from "./pages/Placement";
import PracticeTests from "./pages/PracticeTests";
import TakeTest from "./pages/TakeTest";
import CreateTest from "./pages/CreateTest";
import Problems from "./pages/Problems";
import Problem from "./pages/Problem";
import Dashboard from "./pages/Dashboard";
import Talks from "./pages/Talks";
import Faq from "./pages/Faq";

function NotFound() {
  return (
    <Page narrow={520}>
      <Head title="Page not found">That page doesn't exist.</Head>
      <Link className="btn" to="/">
        Back to home
      </Link>
    </Page>
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
          <Route path="/mentors" element={<Mentors />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/companies/:id" element={<CompanyDetail />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/placement" element={<Placement />} />
          <Route path="/practice" element={<PracticeTests />} />
          <Route path="/take" element={<TakeTest />} />
          <Route path="/tests" element={<CreateTest />} />
          <Route path="/problems" element={<Problems />} />
          <Route path="/problems/:bookId" element={<Problems />} />
          <Route path="/problem/:id" element={<Problem />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/talks" element={<Talks />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

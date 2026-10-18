import { lazy, Suspense } from "react";
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
import CourseDetail from "./pages/CourseDetail";
import EventDetail from "./pages/EventDetail";

// Loaded on demand: only students taking a server-hosted test need it.
const Assessment = lazy(() => import("./pages/Assessment"));
const Account = lazy(() => import("./pages/Account"));
const Premium = lazy(() => import("./pages/Premium"));
const Lesson = lazy(() => import("./pages/Lesson"));
const YearPractice = lazy(() => import("./pages/YearPractice"));
const Workspace = lazy(() => import("./pages/Workspace"));
const Exam = lazy(() => import("./pages/Exam"));
const ExamResult = lazy(() => import("./pages/Exam").then((m) => ({ default: m.Result })));
const Trainer = lazy(() => import("./pages/Trainer"));
const CodeRoom = lazy(() => import("./pages/CodeRoom"));
const InterviewReport = lazy(() => import("./pages/InterviewReport"));
const Login = lazy(() => import("./pages/Login"));
const VerifyEmail = lazy(() => import("./pages/Login").then((m) => ({ default: m.VerifyEmail })));
const ResetPassword = lazy(() => import("./pages/Login").then((m) => ({ default: m.ResetPassword })));

const lazyPage = (el) => <Suspense fallback={<Page narrow={620}><p className="note">Loading…</p></Page>}>{el}</Suspense>;

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
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/courses/:id/learn/:lessonId" element={lazyPage(<Lesson />)} />
          <Route path="/account" element={lazyPage(<Account />)} />
          <Route path="/login" element={lazyPage(<Login />)} />
          <Route path="/verify-email" element={lazyPage(<VerifyEmail />)} />
          <Route path="/reset-password" element={lazyPage(<ResetPassword />)} />
          <Route path="/exam/:testId" element={lazyPage(<Exam />)} />
          <Route path="/t/:slug" element={lazyPage(<Exam />)} />
          <Route path="/results/:attemptId" element={lazyPage(<ExamResult />)} />
          <Route path="/premium" element={lazyPage(<Premium />)} />
          <Route path="/workspace" element={lazyPage(<Workspace />)} />
          <Route path="/placement" element={<Placement />} />
          <Route path="/practice" element={<PracticeTests />} />
          <Route path="/take" element={<TakeTest />} />
          <Route
            path="/assessment/:id"
            element={
              <Suspense fallback={<Page narrow={620}><p className="note">Loading the test…</p></Page>}>
                <Assessment />
              </Suspense>
            }
          />
          <Route path="/tests" element={<CreateTest />} />
          <Route path="/problems" element={<Problems />} />
          <Route path="/problems/:bookId" element={<Problems />} />
          <Route path="/problems/year/:year" element={lazyPage(<YearPractice />)} />
          <Route path="/problem/:id" element={<Problem />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/trainer" element={lazyPage(<Trainer />)} />
          <Route path="/code-room/:id" element={lazyPage(<CodeRoom />)} />
          <Route path="/interview-report/:id" element={lazyPage(<InterviewReport />)} />
          <Route path="/talks" element={<Talks />} />
          <Route path="/talks/:id" element={<EventDetail />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

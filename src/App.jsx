import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";
import { Head, Page } from "./components/ui";
import { usePageSEO } from "./lib/seo";
import Home from "./pages/Home";

// Every page except the home page loads on demand, so the first visit downloads only what the
// home page needs (mobile PageSpeed). Public pages also have pre-built HTML (scripts/prerender.mjs).
const Book = lazy(() => import("./pages/Book"));
const Colleges = lazy(() => import("./pages/Colleges"));
const Admin = lazy(() => import("./pages/Admin"));
const Compiler = lazy(() => import("./pages/Compiler"));
const Mentors = lazy(() => import("./pages/Mentors"));
const Companies = lazy(() => import("./pages/Companies"));
const CompanyDetail = lazy(() => import("./pages/CompanyDetail"));
const Courses = lazy(() => import("./pages/Courses"));
const Placement = lazy(() => import("./pages/Placement"));
const PracticeTests = lazy(() => import("./pages/PracticeTests"));
const TakeTest = lazy(() => import("./pages/TakeTest"));
const CreateTest = lazy(() => import("./pages/CreateTest"));
const Problems = lazy(() => import("./pages/Problems"));
const Problem = lazy(() => import("./pages/Problem"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Talks = lazy(() => import("./pages/Talks"));
const Faq = lazy(() => import("./pages/Faq"));
const About = lazy(() => import("./pages/About"));
const Junior = lazy(() => import("./pages/Junior"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const EventDetail = lazy(() => import("./pages/EventDetail"));

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
const CodevitaHub = lazy(() => import("./pages/codevita/Hub"));
const CodevitaArena = lazy(() => import("./pages/codevita/Arena"));
const CodevitaReport = lazy(() => import("./pages/codevita/Report"));
const CodevitaLesson = lazy(() => import("./pages/codevita/LessonPage"));
const CodevitaMock = lazy(() => import("./pages/codevita/MockPage"));
const VerifyEmail = lazy(() => import("./pages/Login").then((m) => ({ default: m.VerifyEmail })));
const ResetPassword = lazy(() => import("./pages/Login").then((m) => ({ default: m.ResetPassword })));

const lazyPage = (el) => <Suspense fallback={<Page narrow={620}><p className="note">Loading…</p></Page>}>{el}</Suspense>;

function NotFound() {
  // Served with HTTP 200 by the SPA fallback, so tell search engines not to index it.
  usePageSEO({ title: "Page not found", description: "This page doesn't exist on Anobyt.", path: "/404", noindex: true });
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
          <Route path="/book" element={lazyPage(<Book />)} />
          <Route path="/colleges" element={lazyPage(<Colleges />)} />
          <Route path="/compiler" element={lazyPage(<Compiler />)} />
          <Route path="/admin" element={lazyPage(<Admin />)} />
          <Route path="/mentors" element={lazyPage(<Mentors />)} />
          <Route path="/companies" element={lazyPage(<Companies />)} />
          <Route path="/companies/:id" element={lazyPage(<CompanyDetail />)} />
          <Route path="/courses" element={lazyPage(<Courses />)} />
          <Route path="/courses/:id" element={lazyPage(<CourseDetail />)} />
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
          <Route path="/placement" element={lazyPage(<Placement />)} />
          <Route path="/practice" element={lazyPage(<PracticeTests />)} />
          <Route path="/take" element={lazyPage(<TakeTest />)} />
          <Route
            path="/assessment/:id"
            element={
              <Suspense fallback={<Page narrow={620}><p className="note">Loading the test…</p></Page>}>
                <Assessment />
              </Suspense>
            }
          />
          <Route path="/tests" element={lazyPage(<CreateTest />)} />
          <Route path="/problems" element={lazyPage(<Problems />)} />
          <Route path="/problems/:bookId" element={lazyPage(<Problems />)} />
          <Route path="/problems/year/:year" element={lazyPage(<YearPractice />)} />
          <Route path="/problem/:id" element={lazyPage(<Problem />)} />
          <Route path="/dashboard" element={lazyPage(<Dashboard />)} />
          <Route path="/trainer" element={lazyPage(<Trainer />)} />
          <Route path="/code-room/:id" element={lazyPage(<CodeRoom />)} />
          <Route path="/interview-report/:id" element={lazyPage(<InterviewReport />)} />
          <Route path="/talks" element={lazyPage(<Talks />)} />
          <Route path="/talks/:id" element={lazyPage(<EventDetail />)} />
          <Route path="/faq" element={lazyPage(<Faq />)} />
          <Route path="/about" element={lazyPage(<About />)} />
          <Route path="/junior" element={lazyPage(<Junior />)} />
          <Route path="/courses/tcs-codevita" element={lazyPage(<CodevitaHub />)} />
          <Route path="/courses/tcs-codevita/report/:sid" element={lazyPage(<CodevitaReport />)} />
          <Route path="/courses/tcs-codevita/learn/:id" element={lazyPage(<CodevitaLesson />)} />
          <Route path="/courses/tcs-codevita/mock/:id" element={lazyPage(<CodevitaMock />)} />
          <Route path="*" element={<NotFound />} />
        </Route>
        {/* The coding round fills the screen, without the site header and footer. */}
        <Route path="/courses/tcs-codevita/solve/:id" element={<ErrorBoundary>{lazyPage(<CodevitaArena />)}</ErrorBoundary>} />
      </Routes>
    </BrowserRouter>
  );
}

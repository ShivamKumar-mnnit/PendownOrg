import { usePageSEO } from "../lib/seo";
import Hero from "../sections/Hero";
import TrustBar from "../sections/TrustBar";
import WhyAnobyt from "../sections/WhyAnobyt";
import Offerings from "../sections/Offerings";
import SessionStyle from "../sections/SessionStyle";
import SkillCheck from "../sections/SkillCheck";
import CampusActivity from "../sections/CampusActivity";
import Domains from "../sections/Domains";
import TwoTracks from "../sections/TwoTracks";
import SessionStructure from "../sections/SessionStructure";
import HowItWorks from "../sections/HowItWorks";
import MentorProfiles from "../sections/MentorProfiles";
import BeyondInterview from "../sections/BeyondInterview";
import Differentiators from "../sections/Differentiators";
import IndustryReach from "../sections/IndustryReach";
import ForColleges from "../sections/ForColleges";
import ResourcesTeaser from "../sections/ResourcesTeaser";
import Testimonials from "../sections/Testimonials";
import FAQ from "../sections/FAQ";
import CTA from "../sections/CTA";

export default function Home() {
  usePageSEO({
    title: "Anobyt | Mock Interviews & Mentorship for College Students",
    description:
      "Book 1:1 mock interviews and mentorship with industry professionals, matched to your domain (SDE, Data/AI, Product, Consulting) and confirmed over WhatsApp. Starting with NIT Allahabad.",
    path: "/",
  });

  return (
    <>
      <Hero />
      <WhyAnobyt />
      <TrustBar />
      <Offerings />
      <SessionStyle />
      <SkillCheck />
      <CampusActivity />
      <Domains />
      <TwoTracks />
      <SessionStructure />
      <HowItWorks />
      <MentorProfiles />
      <BeyondInterview />
      <Differentiators />
      <IndustryReach />
      <ForColleges />
      <ResourcesTeaser />
      <Testimonials />
      <FAQ />
      <CTA />
    </>
  );
}

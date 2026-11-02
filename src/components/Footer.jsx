import { Link } from "react-router-dom";
import { buildAdminWaLink } from "../lib/whatsapp";

const CONTACT_EMAIL = "anobyt@anobyt.in";
const YEAR = new Date().getFullYear();

// Each domain link opens the booking form with that domain preselected.
const DOMAIN_LINKS = [
  ["Software Development (SDE)", "Software Development (SDE)"],
  ["Data Science and AI/ML", "Data Science & AI/ML"],
  ["Core CS and DSA", "Core CS & DSA"],
  ["Product Management", "Product Management"],
  ["Consulting and case prep", "Consulting & Case Prep"],
];

const COMPANY_LINKS = [
  ["tcs", "TCS"],
  ["infosys", "Infosys"],
  ["google", "Google"],
  ["microsoft", "Microsoft"],
  ["deloitte", "Deloitte"],
  ["salesforce", "Salesforce"],
];

const COMPILER_LINKS = [
  ["python", "Python"],
  ["javascript", "JavaScript"],
  ["java", "Java"],
  ["c", "C"],
  ["cpp", "C++"],
];

const SITE_LINKS = [
  ["/", "Home"],
  ["/about", "About Anobyt"],
  ["/about#contact", "Contact us"],
  ["/book", "Book a session"],
  ["/tests", "Create tests"],
  ["/placement", "Placement guide"],
  ["/talks", "Tech talks"],
  ["/colleges", "For colleges"],
  ["/junior", "Anobyt Junior (schools)"],
  ["/faq", "FAQ"],
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="fgrid">
          <div>
            <Link className="brand" to="/">
              <img src="/anobyt-icon.svg" alt="Anobyt" width="26" height="26" />
              Anobyt
            </Link>
            <p>1:1 mock interviews and mentorship for college students. Real mentors, honest feedback, no clunky dashboards.</p>
            <a
              className="fbox"
              href={buildAdminWaLink("Hi Anobyt! I'd like updates on slots & prep tips.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              <b>Chat with us</b>
              <span>Slot openings and prep tips</span>
            </a>
            <Link className="fbox" to="/about#contact">
              <b>Contact us</b>
              <span>Questions, feedback or partnerships</span>
            </Link>
            <Link className="fbox" to="/junior">
              <b>Anobyt Junior</b>
              <span>Workshops for schools, classes 6 to 12</span>
            </Link>
            <Link className="fbox" to="/compiler">
              <b>Try the online compiler</b>
              <span>Practice code in your browser</span>
            </Link>
          </div>
          <div>
            <h3>Prep by domain</h3>
            {DOMAIN_LINKS.map(([label, domain]) => (
              <Link key={label} to={`/book?domain=${encodeURIComponent(domain)}`}>
                {label}
              </Link>
            ))}
          </div>
          <div>
            <h3>Company-wise prep</h3>
            {COMPANY_LINKS.map(([id, name]) => (
              <Link key={id} to={`/companies/${id}`}>
                {name}
              </Link>
            ))}
          </div>
          <div>
            <h3>Online compilers</h3>
            {COMPILER_LINKS.map(([id, label]) => (
              <Link key={id} to={`/compiler?lang=${id}`}>
                {label}
              </Link>
            ))}
          </div>
          <div>
            <h3>Company</h3>
            {SITE_LINKS.map(([to, label]) => (
              <Link key={label} to={to}>
                {label}
              </Link>
            ))}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </div>
        </div>
        <div className="fbot">
          <span>© {YEAR} Anobyt. All rights reserved.</span>
          <span>Company names are used for interview-prep reference only. Anobyt is not affiliated with them.</span>
          <Link to="/trainer">Trainer login</Link>
          <Link to="/admin">Admin</Link>
        </div>
      </div>
    </footer>
  );
}

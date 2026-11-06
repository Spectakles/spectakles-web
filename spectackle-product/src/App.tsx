import { useEffect, lazy, Suspense } from "react";
import {
  BrowserRouter,
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import { usePlatform } from "./platform/context";
import AnalyticsTracker from "./components/AnalyticsTracker";
import { usePageMeta } from "./marketing/usePageMeta";

const About = lazy(() => import("./pages/About"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Institutions = lazy(() => import("./pages/Institutions"));
const Experience = lazy(() => import("./pages/Experience"));
const Contact = lazy(() => import("./pages/Contact"));
const ProductLayout = lazy(() => import("./platform/ProductLayout"));
const Workspace = lazy(() => import("./pages/Workspace"));
const InstitutionAdmin = lazy(() => import("./pages/InstitutionAdmin"));
const SessionReport = lazy(() => import("./pages/SessionReport"));
const AccountHelp = lazy(() => import("./pages/AccountHelp"));
const JoinInstitution = lazy(() => import("./pages/JoinInstitution"));
const GD = lazy(() => import("./pages/GD"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
function MarketingLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
function GDRoute() {
  const platform = usePlatform();
  if (!platform.ready) return <p role="status">Connecting…</p>;
  if (platform.error)
    return <p role="alert">{platform.error} Reload to try again.</p>;
  if (platform.status?.enabled && !platform.user)
    return <Navigate to="/workspace" replace />;
  return <GD key={platform.user?.uid || "local"} />;
}
function NotFound() {
  usePageMeta(
    "Page not found — Spectakles",
    "Return to the Spectakles public website or explore the group-discussion experience.",
    true,
  );
  return (
    <section className="mkt-wrap mkt-subhero">
      <p className="mkt-kicker">PAGE NOT FOUND</p>
      <h1>
        Let’s get you
        <br />
        <em>back to the room.</em>
      </h1>
      <p className="mkt-lead">
        That page isn’t here. Explore the experience or return to the homepage.
      </p>
      <div className="mkt-actions" style={{ marginTop: 25 }}>
        <Link className="mkt-button" to="/">
          Go to homepage
        </Link>
        <Link className="mkt-text-link" to="/experience">
          Explore the experience →
        </Link>
      </div>
    </section>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AnalyticsTracker />
      <Suspense
        fallback={
          <p role="status" style={{ padding: 24 }}>
            Loading Spectakles…
          </p>
        }
      >
        <Routes>
          <Route element={<MarketingLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/experience" element={<Experience />} />
            <Route path="/institutions" element={<Institutions />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route
              path="/pricing"
              element={<Navigate to="/institutions" replace />}
            />
            <Route path="/impact" element={<Navigate to="/about" replace />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route element={<ProductLayout />}>
            <Route path="/workspace" element={<Workspace />} />
            <Route path="/admin" element={<InstitutionAdmin />} />
            <Route path="/reports/:sessionId" element={<SessionReport />} />
            <Route path="/join" element={<JoinInstitution />} />
            <Route path="/reset-password" element={<AccountHelp />} />
            <Route path="/verify-email" element={<AccountHelp verification />} />
            <Route path="/gd" element={<GDRoute />} />
            <Route path="/gd/dev" element={<GDRoute />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

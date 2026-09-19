import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Impact from "./pages/Impact";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
// import SpectakleIntro from "./components/SpectakleIntro";
import AsciiWavesBackground from "./components/AsciiWavesBackground";
import AnalyticsTracker from "./components/AnalyticsTracker";
// import SpectakleEclipseIntro from "./components/SpectakleEclipseIntro";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// function IntroConditional() {
//   const { pathname } = useLocation();
//   if (pathname === "/") {
//     return <SpectakleEclipseIntro />;
//   }
//   return null;
// }

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AnalyticsTracker />
      <AsciiWavesBackground />
      {/* <SpectakleIntro /> */}
      {/* <IntroConditional /> */}
      
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* <Route path="/impact" element={<Impact />} /> */}
          {/* <Route path="/pricing" element={<Pricing />} /> */}
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          {/* <Route path="/blog" element={<Blog />} /> */}
          {/* <Route path="/blog/:slug" element={<BlogArticle />} /> */}
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

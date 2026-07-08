import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Showcase, UserProfile } from "../types";
function getDefaultHtml(name: string, roll: string, batch: string) {
  return `
<div class="hero">
  <div class="badge">Pulchowk Campus · BCT</div>
  <h1>${name}</h1>
  <p class="sub">${batch ? batch + " Batch" : "Bachelor of Computer Engineering"} ${roll ? "· Roll " + roll : ""}</p>
  <p class="desc">Student at IOE Pulchowk Campus, Department of Electronics and Computer Engineering.</p>
</div>`;
}
function getDefaultCss() {
  return `
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Segoe UI', sans-serif;
  background: #0f0f0f;
  color: #f0f0f0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero { text-align: center; padding: 60px 40px; max-width: 600px; }
.badge {
  display: inline-block;
  background: #1a1a1a;
  border: 1px solid #333;
  color: #888;
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 6px 16px;
  border-radius: 20px;
  margin-bottom: 24px;
}
h1 {
  font-size: 48px;
  font-weight: 700;
  letter-spacing: -1px;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #fff 0%, #888 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.sub { font-size: 14px; color: #666; margin-bottom: 20px; letter-spacing: 0.05em; }
.desc { font-size: 15px; color: #999; line-height: 1.7; }`;
}
export default function ShowcasePage() {
  const uid = window.location.pathname.replace("/showcase/", "");
  const [srcDoc, setSrcDoc] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  useEffect(() => {
    async function load() {
      if (!uid) return;
      try {
        const userSnap = await getDoc(doc(db, "users", uid));
        if (!userSnap.exists()) {
          setNotFound(true);
          return;
        }
        const profile = userSnap.data() as UserProfile;
        const showcaseSnap = await getDoc(doc(db, "showcases", uid));
        let html: string;
        let css: string;
        if (showcaseSnap.exists()) {
          const data = showcaseSnap.data() as Showcase;
          html = data.html || getDefaultHtml(profile.name, profile.rollNumber || "", profile.batchYear || "");
          css = data.css || getDefaultCss();
        } else {
          html = getDefaultHtml(profile.name, profile.rollNumber || "", profile.batchYear || "");
          css = getDefaultCss();
        }
        const anchorFixScript = `
<script>
  document.addEventListener("click", function (e) {
    var link = e.target.closest && e.target.closest('a[href^="#"]');
    if (!link) return;
    var id = link.getAttribute("href").slice(1);
    if (!id) return;
    var target = document.getElementById(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, true);
</script>`;
        setSrcDoc(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${html}${anchorFixScript}</body></html>`);
      } catch (e) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [uid]);
  if (loading) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"sans-serif", color:"#888", fontSize:13 }}>LOADING...</div>;
  if (notFound) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"sans-serif", color:"#888", fontSize:13 }}>USER NOT FOUND</div>;
  return <iframe title="Student Showcase" srcDoc={srcDoc} sandbox="allow-scripts allow-popups" style={{ position:"fixed", inset:0, width:"100%", height:"100%", border:"none" }} />;
}
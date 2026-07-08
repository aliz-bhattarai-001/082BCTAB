import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Showcase } from "../types";

export default function ShowcasePage() {
  const uid = window.location.pathname.replace("/showcase/", "");
  const [srcDoc, setSrcDoc] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      if (!uid) return;
      try {
        const snap = await getDoc(doc(db, "showcases", uid));
        if (!snap.exists()) { setNotFound(true); return; }
        const data = snap.data() as Showcase;
        setSrcDoc(`<!DOCTYPE html><html><head><style>${data.css || ""}</style></head><body>${data.html || ""}</body></html>`);
      } catch (e) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [uid]);

  if (loading) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"sans-serif", color:"#888", fontSize:13 }}>LOADING...</div>;
  if (notFound) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"sans-serif", color:"#888", fontSize:13 }}>SHOWCASE NOT FOUND</div>;

  return <iframe title="Student Showcase" srcDoc={srcDoc} sandbox="allow-scripts" style={{ position:"fixed", inset:0, width:"100%", height:"100%", border:"none" }} />;
}
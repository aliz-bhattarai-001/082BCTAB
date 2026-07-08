import React, { useState, useEffect, useRef } from "react";
import { X, Upload, Check, AlertCircle, Edit, Play, ExternalLink } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Showcase } from "../types";

interface ShowcaseModalProps {
  uid: string;
  studentName: string;
  isOwner: boolean;
  onClose: () => void;
}

export default function ShowcaseModal({ uid, studentName, isOwner, onClose }: ShowcaseModalProps) {
  const [html, setHtml] = useState<string>("");
  const [css, setCss] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [tab, setTab] = useState<"preview" | "edit">("preview");
  const [uploadError, setUploadError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  const fileInputHtmlRef = useRef<HTMLInputElement>(null);
  const fileInputCssRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadShowcase() {
      try {
        setLoading(true);
        const docRef = doc(db, "showcases", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Showcase;
          setHtml(data.html || "");
          setCss(data.css || "");
        } else {
          setHtml(`<!-- Custom Showcase for ${studentName} -->
<div class="card">
  <h1>Welcome to my space</h1>
  <p>Modify this HTML and CSS or upload your files!</p>
  <button id="click-btn">Click me</button>
</div>

<script>
  document.getElementById('click-btn').addEventListener('click', () => {
    alert('Hello from ${studentName}\\'s custom script!');
  });
</script>`);
          setCss(`body {
  font-family: 'Times New Roman', serif;
  background-color: #FFFFFF;
  color: #111111;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
}
.card {
  border: 1px solid #111111;
  padding: 40px;
  background: #F4C430;
  box-shadow: 4px 4px 0px 0px #111111;
  max-width: 400px;
  text-align: center;
}
h1 {
  margin-top: 0;
  font-size: 28px;
}
button {
  background: #111111;
  color: #FFFFFF;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  font-weight: bold;
}
button:hover {
  background: #8A8A8A;
}`);
        }
      } catch (err) {
        console.error("Error loading showcase:", err);
      } finally {
        setLoading(false);
      }
    }
    loadShowcase();
  }, [uid, studentName]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setUploadError("");
      setSuccessMsg("");

      const htmlSize = new Blob([html]).size;
      const cssSize = new Blob([css]).size;
      if (htmlSize > 500 * 1024 || cssSize > 500 * 1024) {
        throw new Error("File sizes must be under 500KB to ensure performance.");
      }

      await setDoc(doc(db, "showcases", uid), {
        uid,
        html,
        css,
        updatedAt: new Date(),
      });
      setSuccessMsg("Showcase saved successfully.");
      setTab("preview");
    } catch (err: any) {
      setUploadError(err.message || "Failed to save showcase.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "html" | "css") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "html" && !file.name.endsWith(".html") && file.type !== "text/html") {
      setUploadError("Please upload a valid .html file.");
      return;
    }
    if (type === "css" && !file.name.endsWith(".css") && file.type !== "text/css") {
      setUploadError("Please upload a valid .css file.");
      return;
    }
    if (file.size > 500 * 1024) {
      setUploadError("File exceeds 500KB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (type === "html") {
        setHtml(text);
      } else {
        setCss(text);
      }
      setSuccessMsg(`${type.toUpperCase()} file loaded! Save to commit changes.`);
    };
    reader.readAsText(file);
  };

  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>${css}</style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;

  return (
    <div className="fixed inset-0 bg-[#111111]/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-[#FFFFFF] w-full max-w-5xl h-[85vh] border border-[#111111] flex flex-col relative animate-fade-in font-serif text-[#111111]">

        {/* Header */}
        <div className="border-b border-[#E5E5E5] bg-[#FFFFFF] p-5 flex items-center justify-between">
          <div>
            <span className="block font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-[#8A8A8A] mb-1">
              STUDENT PRESENTATION BOX
            </span>
            <h2 className="text-2xl font-serif font-bold text-[#111111]">
              {studentName}'s Showcase
            </h2>
            <p className="text-xs italic text-[#8A8A8A] mt-1">
              Rendered inside a secure, sandboxed container.
            </p>
          </div>
          <div className="flex items-center gap-3">
            
              href={`/showcase/${uid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-sans font-bold uppercase tracking-widest border border-[#E5E5E5] hover:border-[#111111] text-[#8A8A8A] hover:text-[#111111] transition-colors rounded-[1px]"
            >
              <ExternalLink className="w-3 h-3" />
              Open Page
            </a>
            <button
              onClick={onClose}
              className="p-2 border border-[#E5E5E5] hover:border-[#111111] bg-white transition-colors"
            >
              <X className="w-5 h-5 text-[#111111]" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-[#E5E5E5] bg-[#FDFDFD] px-5 py-2.5 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setTab("preview")}
              className={`px-4 py-1.5 text-[10px] border font-sans font-bold uppercase tracking-widest transition-all rounded-[1px] ${
                tab === "preview"
                  ? "bg-[#111111] text-[#F4C430] border-[#111111]"
                  : "bg-white text-[#111111] border-[#E5E5E5] hover:border-[#111111]"
              }`}
            >
              <Play className="w-3 h-3 inline-block mr-1.5" />
              Live Preview
            </button>
            {isOwner && (
              <button
                onClick={() => setTab("edit")}
                className={`px-4 py-1.5 text-[10px] border font-sans font-bold uppercase tracking-widest transition-all rounded-[1px] ${
                  tab === "edit"
                    ? "bg-[#111111] text-[#F4C430] border-[#111111]"
                    : "bg-white text-[#111111] border-[#E5E5E5] hover:border-[#111111]"
                }`}
              >
                <Edit className="w-3 h-3 inline-block mr-1.5" />
                Edit / Upload
              </button>
            )}
          </div>

          <div className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#8A8A8A]">
            {isOwner ? "⭐ Owner Mode" : "👁️ Viewer Mode"}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {loading ? (
            <div className="flex-1 flex items-center justify-center font-sans text-xs uppercase tracking-widest text-[#8A8A8A]">
              Loading Showcase...
            </div>
          ) : tab === "preview" ? (
            <div className="flex-1 bg-[#FFFFFF] relative p-1">
              <iframe
                title="Student Showcase"
                srcDoc={srcDoc}
                sandbox="allow-scripts allow-top-navigation allow-same-origin"
                className="w-full h-full border-0 bg-[#FFFFFF]"
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* HTML Editor */}
              <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-[#E5E5E5] overflow-hidden">
                <div className="p-3 bg-[#F9F9F9] border-b border-[#E5E5E5] flex items-center justify-between font-sans">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#8A8A8A]">HTML Source</span>
                  <label className="text-[9px] uppercase tracking-widest font-bold bg-white border border-[#E5E5E5] hover:border-[#111111] px-2.5 py-1 cursor-pointer flex items-center gap-1.5 transition-all rounded-[1px]">
                    <Upload className="w-3 h-3" />
                    Upload File
                    <input
                      type="file"
                      ref={fileInputHtmlRef}
                      onChange={(e) => handleFileUpload(e, "html")}
                      accept=".html"
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  className="flex-1 p-3 font-mono text-xs bg-[#111111] text-[#FFFFFF] outline-none resize-none overflow-y-auto"
                  placeholder="<!-- Write custom HTML here -->"
                />
              </div>

              {/* CSS Editor */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-3 bg-[#F9F9F9] border-b border-[#E5E5E5] flex items-center justify-between font-sans">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#8A8A8A]">CSS Styles</span>
                  <label className="text-[9px] uppercase tracking-widest font-bold bg-white border border-[#E5E5E5] hover:border-[#111111] px-2.5 py-1 cursor-pointer flex items-center gap-1.5 transition-all rounded-[1px]">
                    <Upload className="w-3 h-3" />
                    Upload File
                    <input
                      type="file"
                      ref={fileInputCssRef}
                      onChange={(e) => handleFileUpload(e, "css")}
                      accept=".css"
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  value={css}
                  onChange={(e) => setCss(e.target.value)}
                  className="flex-1 p-3 font-mono text-xs bg-[#111111] text-[#FFFFFF] outline-none resize-none overflow-y-auto"
                  placeholder="/* Write custom CSS here */"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {(uploadError || successMsg || tab === "edit") && (
          <div className="border-t border-[#E5E5E5] p-4 flex flex-wrap items-center justify-between bg-[#FDFDFD] gap-2">
            <div className="flex items-center gap-2">
              {uploadError && (
                <div className="text-red-600 text-xs flex items-center gap-1 font-sans font-bold uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  {uploadError}
                </div>
              )}
              {successMsg && (
                <div className="text-green-700 text-xs flex items-center gap-1 font-sans font-bold uppercase tracking-wider">
                  <Check className="w-4 h-4 text-green-600" />
                  {successMsg}
                </div>
              )}
              {!uploadError && !successMsg && tab === "edit" && (
                <span className="text-xs italic text-[#8A8A8A]">
                  You can edit the markup code directly or upload standard static documents.
                </span>
              )}
            </div>

            {tab === "edit" && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#111111] text-[#F4C430] hover:bg-[#F4C430] hover:text-[#111111] px-6 py-2.5 text-xs font-sans font-bold uppercase tracking-widest disabled:opacity-50 transition-all rounded-[2px]"
              >
                {saving ? "Saving Changes..." : "Save Showcase"}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
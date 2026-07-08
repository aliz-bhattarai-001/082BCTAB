import React, { useState, useEffect } from "react";
import { User, Tag, Github, Linkedin, Globe, MessageSquare, Plus, Trash2, Code, UserX, Settings, Layout, Eye, Save, X, Heading, Type, Columns, List, Minus, Link, Image, FileText, Users, Search, ArrowDownAZ } from "lucide-react";
import { collection, getDocs, doc, setDoc, deleteDoc, query, where, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { UserProfile, UserRole, Project } from "../types";
import ChatModal from "./ChatModal";

interface ProfilesViewProps {
  currentUserUid: string;
  currentUserProfile: UserProfile | null;
  currentUserRole: UserRole;
  onRefreshProfile: () => void;
}
function slugify(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
export default function ProfilesView({
  currentUserUid,
  currentUserProfile,
  currentUserRole,
  onRefreshProfile,
}: ProfilesViewProps) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Record<string, UserRole>>({});
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingUid, setRemovingUid] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"clan" | "my-profile">("clan");

  const [searchQuery, setSearchQuery] = useState("");
  const [sortAlpha, setSortAlpha] = useState(false);

  const [editName, setEditName] = useState("");
  const [editRoll, setEditRoll] = useState("");
  const [editBatch, setEditBatch] = useState("");
  const [editSkills, setEditSkills] = useState("");
  const [editGithub, setEditGithub] = useState("");
  const [editLinkedin, setEditLinkedin] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editPhotoURL, setEditPhotoURL] = useState("");

  const [addingProj, setAddingProj] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newProjTags, setNewProjTags] = useState("");
  const [newProjDate, setNewProjDate] = useState("");
  const [newProjGithub, setNewProjGithub] = useState("");
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);

  const [projectEditorTab, setProjectEditorTab] = useState<"edit" | "preview">("edit");

  const [activeSandbox, setActiveSandbox] = useState<{ uid: string; name: string } | null>(null);
  const [fullscreenWebsite, setFullscreenWebsite] = useState<{ uid: string; name: string } | null>(null);
  const [htmlCode, setHtmlCode] = useState<string>("");
  const [cssCode, setCssCode] = useState<string>("");
  const [isSavingSandbox, setIsSavingSandbox] = useState(false);

  const [chatTarget, setChatTarget] = useState<{ uid: string; name: string } | null>(null);

  const getDefaultHtml = (name: string, roll: string, batch: string) => `
<div class="hero">
  <div class="badge">Pulchowk Campus · BCT</div>
  <h1>${name}</h1>
  <p class="sub">${batch ? batch + " Batch" : "Bachelor of Computer Engineering"} ${roll ? "· Roll " + roll : ""}</p>
  <p class="desc">Student at IOE Pulchowk Campus, Department of Electronics and Computer Engineering.</p>
  <div class="links">
    <a href="#" class="btn">GitHub</a>
    <a href="#" class="btn">LinkedIn</a>
  </div>
</div>`;

  const getDefaultCss = () => `
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
.hero {
  text-align: center;
  padding: 60px 40px;
  max-width: 600px;
}
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
.sub {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
  letter-spacing: 0.05em;
}
.desc {
  font-size: 15px;
  color: #999;
  line-height: 1.7;
  margin-bottom: 36px;
}
.links { display: flex; gap: 12px; justify-content: center; }
.btn {
  padding: 10px 28px;
  border: 1px solid #333;
  color: #ccc;
  text-decoration: none;
  font-size: 13px;
  border-radius: 4px;
  transition: all 0.2s;
}
.btn:hover { background: #1a1a1a; border-color: #555; color: #fff; }`;

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const [usersSnap, rolesSnap, projectsSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "roles")),
        getDocs(query(collection(db, "projects"), where("ownerUid", "==", currentUserUid))),
      ]);

      const usersList: UserProfile[] = [];
      usersSnap.forEach((docSnap) => {
        usersList.push({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
      });
      setProfiles(usersList);

      const rolesMap: Record<string, UserRole> = {};
      rolesSnap.forEach((docSnap) => {
        rolesMap[docSnap.id] = docSnap.data().role as UserRole;
      });
      setRoles(rolesMap);

      const projs: Project[] = [];
      projectsSnap.forEach((docSnap) => {
        projs.push({ id: docSnap.id, ...docSnap.data() } as Project);
      });
      setMyProjects(projs);
    } catch (err) {
      console.error("Error loading profile elements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
    if (currentUserProfile) {
      setEditName(currentUserProfile.name || "");
      setEditRoll(currentUserProfile.rollNumber || "");
      setEditBatch(currentUserProfile.batchYear || "");
      setEditSkills((currentUserProfile.skills || []).join(", "));
      setEditGithub(currentUserProfile.socials?.github || "");
      setEditLinkedin(currentUserProfile.socials?.linkedin || "");
      setEditWebsite(currentUserProfile.socials?.website || "");
      setEditPhotoURL(currentUserProfile.photoURL || "");
    }
  }, [currentUserUid, currentUserProfile]);

  const handleToggleCollaborator = (uid: string) => {
    setSelectedCollaborators((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const injectSyntax = (type: "heading" | "bold" | "list" | "table" | "rule" | "link" | "image") => {
    const textarea = document.getElementById("projectRichEditor") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = newProjDesc.substring(start, end);
    let result = "";
    switch (type) {
      case "heading": result = `## ${selection || "Heading Title"}\n`; break;
      case "bold": result = `**${selection || "Strong Text"}**`; break;
      case "list": result = `\n* ${selection || "Feature Point"}\n* Item 2\n`; break;
      case "table": result = `\n| Phase | System Target |\n| :--- | :--- |\n| 01 | ${selection || "Core Configuration"} |\n`; break;
      case "rule": result = `\n---\n`; break;
      case "link": result = `[${selection || "Resource Text"}](https://github.com/)`; break;
      case "image": result = `![${selection || "Image Label"}](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe)`; break;
    }
    const output = newProjDesc.substring(0, start) + result + newProjDesc.substring(end);
    setNewProjDesc(output);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + result.length, start + result.length);
    }, 50);
  };

  const handleOpenShowcase = async (uid: string, name: string, openAsOwner: boolean, profile?: UserProfile) => {
    try {
      const showcaseDoc = await getDoc(doc(db, "showcases", uid));
      let currentHtml = getDefaultHtml(
        profile?.name || name,
        profile?.rollNumber || "",
        profile?.batchYear || ""
      );
      let currentCss = getDefaultCss();

      if (showcaseDoc.exists()) {
        const data = showcaseDoc.data();
        currentHtml = data.html || currentHtml;
        currentCss = data.css || currentCss;
      }

      setHtmlCode(currentHtml);
      setCssCode(currentCss);

      if (openAsOwner) {
        setActiveSandbox({ uid, name });
      } else {
        setFullscreenWebsite({ uid, name });
      }
    } catch (err) {
      console.error("Error getting showcase source data:", err);
    }
  };

const handleVisitWebsite = (profile: UserProfile) => {
  window.open(`/${slugify(profile.name)}`, "_blank");
};

  const handleSaveShowcase = async () => {
    if (!activeSandbox) return;
    try {
      setIsSavingSandbox(true);
      await setDoc(doc(db, "showcases", activeSandbox.uid), {
        html: htmlCode,
        css: cssCode,
        updatedAt: new Date(),
      }, { merge: true });
      alert("Showcase layout successfully deployed!");
    } catch (err) {
      console.error("Error saving sandbox parameters:", err);
    } finally {
      setIsSavingSandbox(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userRef = doc(db, "users", currentUserUid);
      const skillsArray = editSkills.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
      const updatedProfile = {
        uid: currentUserUid,
        name: editName.trim(),
        email: currentUserProfile?.email || "",
        skills: skillsArray,
        rollNumber: editRoll.trim(),
        batchYear: editBatch.trim(),
        photoURL: editPhotoURL.trim() || `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUserUid}`,
        socials: {
          github: editGithub.trim(),
          linkedin: editLinkedin.trim(),
          website: editWebsite.trim(),
        },
      };
      await setDoc(userRef, updatedProfile, { merge: true });
      onRefreshProfile();
      loadProfiles();
      setViewMode("clan");
    } catch (err) {
      console.error("Error saving profile details:", err);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle.trim() || !newProjDesc.trim()) return;
    try {
      const projId = `proj_${Date.now()}`;
      const tagsArray = newProjTags.split(",").map((t) => t.trim().toLowerCase()).filter((t) => t.length > 0);
      await setDoc(doc(db, "projects", projId), {
        ownerUid: currentUserUid,
        ownerName: currentUserProfile?.name || "Clan Member",
        ownerEmail: currentUserProfile?.email || "",
        title: newProjTitle.trim(),
        description: newProjDesc.trim(),
        tags: tagsArray,
        date: newProjDate || new Date().toISOString().split("T")[0],
        githubLink: newProjGithub.trim(),
        collaborators: selectedCollaborators,
        stars: 0,
        starredBy: [],
        createdAt: new Date(),
      });
      setNewProjTitle(""); setNewProjDesc(""); setNewProjTags(""); setNewProjDate(""); setNewProjGithub(""); setSelectedCollaborators([]);
      setAddingProj(false);
      loadProfiles();
    } catch (err) {
      console.error("Error creating project:", err);
    }
  };

  const handleDeleteProject = async (projId: string) => {
    if (confirm("Are you sure you want to drop this project?")) {
      try {
        await deleteDoc(doc(db, "projects", projId));
        loadProfiles();
      } catch (err) {
        console.error("Error deleting project reference:", err);
      }
    }
  };

  const handleRemoveProfile = async (uid: string, email: string) => {
    if (!confirm(`Eject ${email} from the Portal?`)) return;
    setRemovingUid(uid);
    try {
      await setDoc(doc(db, "bannedEmails", email.toLowerCase()), { bannedBy: currentUserUid, bannedAt: new Date() });
      await deleteDoc(doc(db, "users", uid));
      await deleteDoc(doc(db, "roles", uid));
      loadProfiles();
    } catch (err) {
      console.error("Error executing admin cleanup:", err);
    } finally {
      setRemovingUid(null);
    }
  };

  const getCombinedSrcDoc = () => {
    return `<!DOCTYPE html><html><head><style>${cssCode}</style></head><body>${htmlCode}</body></html>`;
  };

  const displayedProfiles = profiles
    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => (sortAlpha ? a.name.localeCompare(b.name) : 0));

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 font-serif text-[#111111] animate-fade-in">

      {fullscreenWebsite && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col font-sans">
          <div className="bg-neutral-900 text-white px-6 py-3 flex items-center justify-between shadow-lg">
            <p className="text-xs font-mono text-neutral-300">EXPLORING ACTIVE HUB NODE: <span className="text-white font-bold">{fullscreenWebsite.name.toUpperCase()}</span></p>
            <button onClick={() => setFullscreenWebsite(null)} className="bg-neutral-800 hover:bg-neutral-700 text-white p-1.5 rounded flex items-center gap-1 text-xs uppercase font-bold"><X className="w-4 h-4" /> Exit Site</button>
          </div>
          <iframe title="Immersive Website Portal" srcDoc={getCombinedSrcDoc()} sandbox="allow-scripts allow-top-navigation allow-same-origin" className="w-full flex-1 border-none bg-white" />
        </div>
      )}

      {addingProj && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-fade-in">
          <div className="bg-white border border-[#111111] w-full max-w-5xl shadow-2xl relative flex flex-col max-h-[90vh] rounded-[3px] overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between bg-[#111111] text-white px-6 py-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs uppercase font-bold tracking-widest">Enhanced Project Workspace Builder</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex bg-neutral-800 p-0.5 rounded text-xs">
                  <button type="button" onClick={() => setProjectEditorTab("edit")} className={`px-2.5 py-1 rounded-[2px] transition-all font-bold ${projectEditorTab === "edit" ? "bg-white text-neutral-900" : "text-neutral-400 hover:text-white"}`}>Editor</button>
                  <button type="button" onClick={() => setProjectEditorTab("preview")} className={`px-2.5 py-1 rounded-[2px] transition-all font-bold ${projectEditorTab === "preview" ? "bg-white text-neutral-900" : "text-neutral-400 hover:text-white"}`}>Live Preview</button>
                </div>
                <button onClick={() => setAddingProj(false)} className="text-neutral-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <form onSubmit={handleAddProject} className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white">
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Project Title Name</label>
                  <input type="text" required value={newProjTitle} onChange={(e) => setNewProjTitle(e.target.value)} className="w-full p-2.5 border border-[#E5E5E5] focus:border-[#111111] text-xs outline-none bg-[#FBFBFB]" placeholder="e.g., Cryptographic Node Relayer Interface" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">GitHub Code Repository Link</label>
                    <input type="url" value={newProjGithub} onChange={(e) => setNewProjGithub(e.target.value)} className="w-full p-2.5 border border-[#E5E5E5] focus:border-[#111111] text-xs outline-none bg-[#FBFBFB]" placeholder="https://github.com/user/repo" />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Build Timeline Completion Date</label>
                    <input type="date" value={newProjDate} onChange={(e) => setNewProjDate(e.target.value)} className="w-full p-2.5 border border-[#E5E5E5] focus:border-[#111111] text-xs outline-none bg-[#FBFBFB]" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[9px] uppercase font-bold tracking-wider text-[#8A8A8A]">Rich Workspace Configuration (Markdown Syntax Mode)</label>
                    <div className="flex gap-0.5 bg-neutral-100 p-0.5 border border-neutral-200 rounded">
                      <button type="button" onClick={() => injectSyntax("heading")} className="p-1 hover:bg-white text-neutral-700 rounded transition-colors"><Heading className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => injectSyntax("bold")} className="p-1 hover:bg-white text-neutral-700 rounded transition-colors"><Type className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => injectSyntax("list")} className="p-1 hover:bg-white text-neutral-700 rounded transition-colors"><List className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => injectSyntax("table")} className="p-1 hover:bg-white text-neutral-700 rounded transition-colors"><Columns className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => injectSyntax("link")} className="p-1 hover:bg-white text-neutral-700 rounded transition-colors"><Link className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => injectSyntax("image")} className="p-1 hover:bg-white text-neutral-700 rounded transition-colors"><Image className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => injectSyntax("rule")} className="p-1 hover:bg-white text-neutral-700 rounded transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <textarea id="projectRichEditor" required value={newProjDesc} onChange={(e) => setNewProjDesc(e.target.value)} className="w-full p-3 border border-[#E5E5E5] focus:border-[#111111] text-xs h-44 resize-none outline-none bg-[#FBFBFB] font-mono leading-relaxed" placeholder="Write or utilize the toolbar modules above..." />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Tech Stack (Comma separated)</label>
                  <input type="text" value={newProjTags} onChange={(e) => setNewProjTags(e.target.value)} className="w-full p-2.5 border border-[#E5E5E5] focus:border-[#111111] text-xs outline-none bg-[#FBFBFB]" placeholder="react, rust, webgl, tailwind" />
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="border border-neutral-200 rounded p-4 bg-neutral-50/60 flex flex-col h-44">
                  <div className="flex items-center gap-1.5 border-b border-neutral-200 pb-1.5 mb-2 flex-shrink-0">
                    <Users className="w-3.5 h-3.5 text-[#111111]" />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#111111]">Attach Collaborators</span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                    {profiles.filter((p) => p.uid !== currentUserUid).map((member) => {
                      const isChecked = selectedCollaborators.includes(member.uid);
                      return (
                        <label key={member.uid} className={`flex items-center justify-between p-2 rounded border transition-all cursor-pointer ${isChecked ? "bg-white border-[#111111] shadow-sm" : "bg-white/40 border-neutral-200 hover:bg-white"}`}>
                          <div className="flex items-center gap-2">
                            <img src={member.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${member.uid}`} alt="" className="w-5 h-5 border rounded-full object-cover" />
                            <span className="text-xs font-medium text-neutral-800 truncate max-w-[140px]">{member.name}</span>
                          </div>
                          <input type="checkbox" checked={isChecked} onChange={() => handleToggleCollaborator(member.uid)} className="accent-neutral-900 rounded focus:ring-0 w-3.5 h-3.5" />
                        </label>
                      );
                    })}
                    {profiles.filter((p) => p.uid !== currentUserUid).length === 0 && (
                      <p className="text-[11px] font-serif italic text-neutral-400 text-center pt-6">No members available.</p>
                    )}
                  </div>
                </div>
                <div className="border border-neutral-200 bg-white flex-1 flex flex-col rounded p-4 overflow-hidden min-h-[180px]">
                  {projectEditorTab === "edit" ? (
                    <div className="flex-1 flex flex-col justify-center items-center text-center text-neutral-400 p-4">
                      <FileText className="w-7 h-7 text-neutral-300 mb-1.5 stroke-1" />
                      <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Workspace Editor Active</span>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto font-sans text-xs text-neutral-800 space-y-2 prose max-w-none">
                      <h2 className="text-sm font-bold text-neutral-900 font-sans tracking-wide border-b border-neutral-200 pb-1 uppercase">{newProjTitle || "Untitled"}</h2>
                      <div className="text-[9px] text-neutral-500 font-medium">
                        Team: {currentUserProfile?.name || "Me"}
                        {selectedCollaborators.map(uid => `, ${profiles.find(p => p.uid === uid)?.name || ""}`)}
                      </div>
                      <div className="whitespace-pre-wrap font-serif text-[11px] leading-relaxed text-neutral-700 bg-neutral-50/40 p-2 border border-dashed rounded">
                        {newProjDesc || <span className="text-neutral-400 italic">Empty.</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="lg:col-span-3 flex justify-end gap-3 pt-3 border-t border-neutral-100 flex-shrink-0">
                <button type="button" onClick={() => setAddingProj(false)} className="px-5 py-2.5 border border-[#E5E5E5] text-xs font-bold uppercase tracking-widest hover:bg-neutral-50 rounded-[2px]">Discard</button>
                <button type="submit" className="px-8 py-2.5 bg-[#111111] text-white hover:bg-neutral-800 text-xs font-bold uppercase tracking-widest rounded-[2px]">Deploy Workspace Core</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between border-b border-[#111111] pb-4">
        <div>
          <span className="block font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A8A8A] mb-2">PORTAL NETWORKS</span>
          <h2 className="text-3xl font-serif font-bold text-[#111111]">{viewMode === "clan" ? "The Clan" : "My Base Center"}</h2>
          <p className="text-sm italic text-[#8A8A8A]">{viewMode === "clan" ? "Connecting every active node in our circle." : "Refine your profile, projects, and showcase."}</p>
        </div>
        <div className="flex items-center gap-3 font-sans">
          <button onClick={() => { setViewMode("clan"); setActiveSandbox(null); }} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all rounded-[2px] ${viewMode === "clan" && !activeSandbox ? "bg-[#111111] text-white" : "border border-[#E5E5E5] text-[#111111] hover:border-[#111111]"}`}>The Clan</button>
          <button onClick={() => setViewMode("my-profile")} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all rounded-[2px] ${viewMode === "my-profile" ? "bg-[#111111] text-white" : "border border-[#E5E5E5] text-[#111111] hover:border-[#111111]"}`}>My Profile</button>
        </div>
      </div>

      {viewMode === "clan" && (
        <div className="mb-8 flex flex-wrap gap-3 items-center font-sans">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-[#8A8A8A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search nodes by name..."
              className="w-full pl-9 pr-3 py-2 border border-[#E5E5E5] focus:border-[#111111] text-xs outline-none bg-white"
            />
          </div>
          <button
            onClick={() => setSortAlpha((prev) => !prev)}
            className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest border rounded-[2px] flex items-center gap-1.5 transition-all ${sortAlpha ? "bg-[#111111] text-white border-[#111111]" : "border-[#E5E5E5] text-[#111111] hover:border-[#111111]"}`}
          >
            <ArrowDownAZ className="w-3.5 h-3.5" /> {sortAlpha ? "Sorted A–Z" : "Sort A–Z"}
          </button>
        </div>
      )}

      {viewMode === "clan" && (
        <>
          {loading ? (
            <div className="text-center font-sans text-xs uppercase tracking-widest py-12 text-[#8A8A8A]">Assembling network directory...</div>
          ) : profiles.length === 0 ? (
            <div className="text-center font-serif py-12 text-[#8A8A8A] italic border border-dashed border-[#E5E5E5] bg-[#F9F9F9]">No active members found.</div>
          ) : displayedProfiles.length === 0 ? (
            <div className="text-center font-serif py-12 text-[#8A8A8A] italic border border-dashed border-[#E5E5E5] bg-[#F9F9F9]">No nodes match "{searchQuery}".</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedProfiles.map((profile) => {
                const userRole = roles[profile.uid] || "student";
                const isMe = profile.uid === currentUserUid;
                const canRemove = currentUserRole === "admin" && !isMe;
                return (
                  <div key={profile.uid} className="border border-[#E5E5E5] bg-white p-6 hover:border-[#111111] transition-all duration-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-4 mb-4">
                        <img src={profile.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.uid}`} alt={profile.name} className="w-12 h-12 border border-[#E5E5E5] object-cover" />
                        <div>
                          <h3 className="font-sans font-bold text-base text-[#111111] leading-tight uppercase tracking-wide">{profile.name}</h3>
                          {profile.rollNumber && profile.batchYear ? <p className="text-[10px] font-mono text-[#8A8A8A]">{profile.batchYear}BCT{profile.rollNumber}</p> : <p className="text-[9px] font-sans text-[#8A8A8A] uppercase tracking-wider italic">Node Setup Incomplete</p>}
                        </div>
                      </div>
                      <div className="mb-4"><span className="inline-block px-2 py-0.5 text-[8px] font-sans font-bold uppercase tracking-widest border border-[#111111] text-[#111111]">{userRole.toUpperCase()}</span></div>
                      {profile.skills && profile.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mb-6">{profile.skills.map((skill) => <span key={skill} className="px-2 py-0.5 bg-[#F9F9F9] border border-[#E5E5E5] text-[9px] font-sans font-bold uppercase tracking-wider text-[#8A8A8A]">|{skill}</span>)}</div>
                      ) : <p className="text-xs text-[#8A8A8A] italic font-serif mb-6">Unlisted specializations.</p>}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-6 border-t border-[#E5E5E5] pt-4">
                        {profile.socials?.github && <a href={`https://github.com/${profile.socials.github}`} target="_blank" rel="noreferrer" className="text-[#8A8A8A] hover:text-[#111111]"><Github className="w-4 h-4" /></a>}
                        {profile.socials?.linkedin && <a href={`https://linkedin.com/in/${profile.socials.linkedin}`} target="_blank" rel="noreferrer" className="text-[#8A8A8A] hover:text-[#111111]"><Linkedin className="w-4 h-4" /></a>}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleVisitWebsite(profile)}
                          className="bg-white hover:bg-[#F9F9F9] text-[#111111] border border-[#E5E5E5] hover:border-[#111111] py-2 text-[9px] font-sans font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1 rounded-[2px]"
                        >
                          <Globe className="w-3.5 h-3.5" />Visit Website
                        </button>
                        {!isMe ? (
                          <button onClick={() => setChatTarget({ uid: profile.uid, name: profile.name })} className="bg-[#111111] text-white py-2 text-[9px] font-sans font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1 rounded-[2px]"><MessageSquare className="w-3.5 h-3.5" />Chat 1:1</button>
                        ) : (
                          <button onClick={() => setViewMode("my-profile")} className="border border-dashed border-[#111111] text-[#111111] bg-amber-50 hover:bg-amber-100 flex items-center justify-center py-2 text-[9px] font-sans font-bold uppercase tracking-widest transition-all rounded-[2px]">Edit Space</button>
                        )}
                      </div>
                      {canRemove && <button onClick={() => handleRemoveProfile(profile.uid, profile.email)} disabled={removingUid === profile.uid} className="w-full mt-2 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white py-2 text-[9px] font-sans font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1 rounded-[2px]"><UserX className="w-3.5 h-3.5" />Eject Node</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {viewMode === "my-profile" && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 bg-[#F9F9F9] p-8 border border-[#E5E5E5]">
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center border-b border-[#E5E5E5] pb-2 mb-6">
                <h3 className="text-xl font-serif font-bold text-[#111111]">Configure Identity Node</h3>
                <button onClick={() => handleOpenShowcase(currentUserUid, currentUserProfile?.name || "My Space", true, currentUserProfile || undefined)} className="bg-amber-500 text-neutral-900 text-xs font-sans font-bold uppercase tracking-wider px-3 py-1.5 flex items-center gap-1.5 hover:bg-amber-600 transition-all rounded-[2px]"><Code className="w-3.5 h-3.5" /> Customize HTML/CSS Space</button>
              </div>
              <form onSubmit={handleSaveProfile} className="space-y-4 font-sans">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Full Name</label><input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-2 border border-[#E5E5E5] bg-white text-xs outline-none" /></div>
                  <div><label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Profile Image URL</label><input type="text" value={editPhotoURL} onChange={(e) => setEditPhotoURL(e.target.value)} className="w-full p-2 border border-[#E5E5E5] bg-white text-xs outline-none" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Roll Number</label><input type="text" value={editRoll} onChange={(e) => setEditRoll(e.target.value)} className="w-full p-2 border border-[#E5E5E5] bg-white text-xs outline-none" /></div>
                  <div><label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Batch Year</label><input type="text" value={editBatch} onChange={(e) => setEditBatch(e.target.value)} className="w-full p-2 border border-[#E5E5E5] bg-white text-xs outline-none" /></div>
                </div>
                <div><label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Skills (Comma separated)</label><input type="text" value={editSkills} onChange={(e) => setEditSkills(e.target.value)} className="w-full p-2 border border-[#E5E5E5] bg-white text-xs outline-none" /></div>
                <div className="grid grid-cols-3 gap-2">
                  <div><label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">GitHub</label><input type="text" value={editGithub} onChange={(e) => setEditGithub(e.target.value)} className="w-full p-2 border border-[#E5E5E5] bg-white text-xs outline-none" /></div>
                  <div><label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">LinkedIn</label><input type="text" value={editLinkedin} onChange={(e) => setEditLinkedin(e.target.value)} className="w-full p-2 border border-[#E5E5E5] bg-white text-xs outline-none" /></div>
                  <div><label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Website</label><input type="text" value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} className="w-full p-2 border border-[#E5E5E5] bg-white text-xs outline-none" /></div>
                </div>
                <button type="submit" className="w-full bg-[#111111] text-white hover:bg-neutral-800 py-3 text-xs font-sans font-bold uppercase tracking-widest transition-all rounded-[2px]">Commit Changes</button>
              </form>
            </div>
            <div className="flex flex-col border-t lg:border-t-0 lg:border-l border-[#E5E5E5] pt-6 lg:pt-0 lg:pl-8">
              <div className="flex justify-between items-baseline mb-6">
                <h3 className="text-xl font-serif font-bold text-[#111111]">Active Projects</h3>
                <button onClick={() => setAddingProj(true)} className="border border-[#111111] bg-white px-2.5 py-1 text-[10px] font-sans font-bold uppercase tracking-wider hover:bg-neutral-100 transition-all flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add Project</button>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[280px] space-y-2 pr-1 font-sans">
                {myProjects.length === 0 ? (
                  <div className="text-xs text-[#8A8A8A] font-serif italic text-center py-8">No projects yet.</div>
                ) : myProjects.map((proj) => (
                  <div key={proj.id} className="flex items-center justify-between p-3.5 border border-[#E5E5E5] bg-white text-xs animate-fade-in">
                    <div>
                      <div className="font-bold text-[#111111] uppercase tracking-wider">{proj.title}</div>
                      <div className="text-[9px] text-[#8A8A8A] uppercase tracking-wider mt-0.5">{proj.date}</div>
                    </div>
                    <button onClick={() => handleDeleteProject(proj.id)} className="text-red-600 hover:bg-red-50 p-1 rounded transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {chatTarget && currentUserProfile && <ChatModal currentUid={currentUserUid} currentName={currentUserProfile.name} targetUid={chatTarget.uid} targetName={chatTarget.name} onClose={() => setChatTarget(null)} />}
    </div>
  );
}
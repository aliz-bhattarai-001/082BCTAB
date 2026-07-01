import React, { useState, useEffect } from "react";
import { User, Tag, Github, Linkedin, Globe, MessageSquare, ExternalLink, Edit3, Plus, Trash2, Code } from "lucide-react";
import { collection, getDocs, doc, setDoc, deleteDoc, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { UserProfile, UserRole, Project } from "../types";
import ShowcaseModal from "./ShowcaseModal";
import ChatModal from "./ChatModal";

interface ProfilesViewProps {
  currentUserUid: string;
  currentUserProfile: UserProfile | null;
  currentUserRole: UserRole;
  onRefreshProfile: () => void;
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

  // Profile Edit fields
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editRoll, setEditRoll] = useState("");
  const [editBatch, setEditBatch] = useState("");
  const [editSkills, setEditSkills] = useState("");
  const [editGithub, setEditGithub] = useState("");
  const [editLinkedin, setEditLinkedin] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editPhotoURL, setEditPhotoURL] = useState("");

  // Project Adding fields
  const [addingProj, setAddingProj] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newProjTags, setNewProjTags] = useState("");
  const [newProjDate, setNewProjDate] = useState("");

  // Modals
  const [selectedShowcase, setSelectedShowcase] = useState<{ uid: string; name: string } | null>(null);
  const [chatTarget, setChatTarget] = useState<{ uid: string; name: string } | null>(null);

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
      console.error("Error loading profiles:", err);
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userRef = doc(db, "users", currentUserUid);
      const skillsArray = editSkills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

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
      setEditing(false);
      onRefreshProfile();
      loadProfiles();
    } catch (err) {
      console.error("Error saving profile details:", err);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle.trim() || !newProjDesc.trim()) return;

    try {
      const projId = `proj_${Date.now()}`;
      const tagsArray = newProjTags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      const projectRef = doc(db, "projects", projId);
      await setDoc(projectRef, {
        ownerUid: currentUserUid,
        ownerName: currentUserProfile?.name || "BCT Student",
        ownerEmail: currentUserProfile?.email || "",
        title: newProjTitle.trim(),
        description: newProjDesc.trim(),
        tags: tagsArray,
        date: newProjDate || new Date().toISOString().split("T")[0],
        stars: 0,
        starredBy: [],
        createdAt: new Date(),
      });

      setNewProjTitle("");
      setNewProjDesc("");
      setNewProjTags("");
      setNewProjDate("");
      setAddingProj(false);
      loadProfiles();
    } catch (err) {
      console.error("Error creating project:", err);
    }
  };

  const handleDeleteProject = async (projId: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteDoc(doc(db, "projects", projId));
        loadProfiles();
      } catch (err) {
        console.error("Error deleting project:", err);
      }
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "admin": return "Admin";
      case "moderator": return "Moderator";
      case "cr": return "CR";
      case "locus_cr": return "Locus CR";
      default: return "Student";
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "admin": return "border-red-600 text-red-600 bg-red-50";
      case "moderator": return "border-purple-600 text-purple-600 bg-purple-50";
      case "cr": return "border-[#F4C430] text-[#111111] bg-[#F4C430]/10";
      case "locus_cr": return "border-blue-600 text-blue-600 bg-blue-50";
      default: return "border-[#8A8A8A] text-[#8A8A8A] bg-neutral-50";
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 font-serif text-[#111111] animate-fade-in">
      
      {/* Settings Panel Toggle */}
      <div className="mb-10 flex flex-wrap gap-4 items-center justify-between border-b border-[#111111] pb-4">
        <div>
          <span className="block font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A8A8A] mb-2">
            CLASS ROSTER
          </span>
          <h2 className="text-3xl font-serif font-bold text-[#111111]">
            Student Directory
          </h2>
          <p className="text-sm italic text-[#8A8A8A]">
            Browse profile cards, open showcases, and establish 1:1 chat sessions.
          </p>
        </div>
        
        <button
          onClick={() => setEditing(!editing)}
          className="bg-[#111111] text-white hover:bg-[#F4C430] hover:text-[#111111] px-4 py-2.5 text-xs font-sans font-bold uppercase tracking-widest transition-all rounded-[2px]"
        >
          {editing ? "Close Edit Panel" : "Manage Profile & Projects"}
        </button>
      </div>

      {/* Edit Panel */}
      {editing && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12 bg-[#F9F9F9] p-8 border border-[#E5E5E5] animate-fade-in">
          
          {/* Profile Details Edit */}
          <div>
            <span className="block font-sans text-[9px] font-bold uppercase tracking-widest text-[#8A8A8A] mb-2">
              SECTION 01 / IDENTITY
            </span>
            <h3 className="text-xl font-serif font-bold text-[#111111] border-b border-[#E5E5E5] pb-2 mb-6">
              Edit My Profile Cards
            </h3>
            <form onSubmit={handleSaveProfile} className="space-y-4 font-sans">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2 border border-[#E5E5E5] bg-white text-xs outline-none focus:border-[#111111] transition-all uppercase tracking-wider"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Avatar/Photo URL</label>
                  <input
                    type="text"
                    value={editPhotoURL}
                    onChange={(e) => setEditPhotoURL(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full p-2 border border-[#E5E5E5] bg-white text-xs outline-none focus:border-[#111111] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Roll Number (3 digits)</label>
                  <input
                    type="text"
                    placeholder="e.g. 013"
                    value={editRoll}
                    onChange={(e) => setEditRoll(e.target.value)}
                    className="w-full p-2 border border-[#E5E5E5] bg-white text-xs outline-none focus:border-[#111111] transition-all uppercase tracking-wider"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Batch Year (e.g. 082)</label>
                  <input
                    type="text"
                    placeholder="e.g. 082"
                    value={editBatch}
                    onChange={(e) => setEditBatch(e.target.value)}
                    className="w-full p-2 border border-[#E5E5E5] bg-white text-xs outline-none focus:border-[#111111] transition-all uppercase tracking-wider"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Skills (Comma separated)</label>
                <input
                  type="text"
                  placeholder="React, PyTorch, Embedded C, Rust"
                  value={editSkills}
                  onChange={(e) => setEditSkills(e.target.value)}
                  className="w-full p-2 border border-[#E5E5E5] bg-white text-xs outline-none focus:border-[#111111] transition-all"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">GitHub</label>
                  <input
                    type="text"
                    placeholder="Username"
                    value={editGithub}
                    onChange={(e) => setEditGithub(e.target.value)}
                    className="w-full p-2 border border-[#E5E5E5] bg-white text-xs outline-none focus:border-[#111111] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">LinkedIn</label>
                  <input
                    type="text"
                    placeholder="Username"
                    value={editLinkedin}
                    onChange={(e) => setEditLinkedin(e.target.value)}
                    className="w-full p-2 border border-[#E5E5E5] bg-white text-xs outline-none focus:border-[#111111] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Website URL</label>
                  <input
                    type="text"
                    placeholder="https://mysite.com"
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    className="w-full p-2 border border-[#E5E5E5] bg-white text-xs outline-none focus:border-[#111111] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#111111] text-white hover:bg-[#F4C430] hover:text-[#111111] py-3 text-xs font-sans font-bold uppercase tracking-widest transition-all rounded-[2px]"
              >
                Save Profile Cards
              </button>
            </form>
          </div>

          {/* Project Management */}
          <div className="flex flex-col h-full border-t md:border-t-0 md:border-l border-[#E5E5E5] pt-6 md:pt-0 md:pl-8">
            <div className="flex justify-between items-baseline mb-6">
              <div>
                <span className="block font-sans text-[9px] font-bold uppercase tracking-widest text-[#8A8A8A] mb-2">
                  SECTION 02 / WORKS
                </span>
                <h3 className="text-xl font-serif font-bold text-[#111111]">
                  My Submitted Projects
                </h3>
              </div>
              <button
                onClick={() => setAddingProj(!addingProj)}
                className="border border-[#111111] bg-white px-2.5 py-1 text-[10px] font-sans font-bold uppercase tracking-wider hover:bg-[#F4C430] hover:text-[#111111] transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                {addingProj ? "Cancel" : "Add Project"}
              </button>
            </div>

            {addingProj ? (
              <form onSubmit={handleAddProject} className="space-y-3 bg-white p-5 border border-[#E5E5E5] animate-fade-in font-sans">
                <div>
                  <label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Project Title</label>
                  <input
                    type="text"
                    required
                    value={newProjTitle}
                    onChange={(e) => setNewProjTitle(e.target.value)}
                    placeholder="e.g. Smart Pulchowk Traffic"
                    className="w-full p-2 border border-[#E5E5E5] text-xs outline-none focus:border-[#111111] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Description</label>
                  <textarea
                    required
                    value={newProjDesc}
                    onChange={(e) => setNewProjDesc(e.target.value)}
                    placeholder="Detailed explanation of what you built..."
                    className="w-full p-2 border border-[#E5E5E5] text-xs h-20 resize-none outline-none focus:border-[#111111] transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Tags (Comma separated)</label>
                    <input
                      type="text"
                      placeholder="ml, hardware, react"
                      value={newProjTags}
                      onChange={(e) => setNewProjTags(e.target.value)}
                      className="w-full p-2 border border-[#E5E5E5] text-xs outline-none focus:border-[#111111] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Date</label>
                    <input
                      type="date"
                      value={newProjDate}
                      onChange={(e) => setNewProjDate(e.target.value)}
                      className="w-full p-2 border border-[#E5E5E5] text-xs outline-none focus:border-[#111111] transition-all"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#111111] text-white hover:bg-[#F4C430] hover:text-[#111111] py-2.5 text-xs font-sans font-bold uppercase tracking-widest transition-all rounded-[2px]"
                >
                  Post Project Submission
                </button>
              </form>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-[280px] space-y-2 pr-1 font-sans">
                {myProjects.length === 0 ? (
                  <div className="text-xs text-[#8A8A8A] font-serif italic text-center py-8">
                    You haven't listed any projects yet. Click Add Project above to showcase your work!
                  </div>
                ) : (
                  myProjects.map((proj) => (
                    <div
                      key={proj.id}
                      className="flex items-center justify-between p-3.5 border border-[#E5E5E5] bg-white text-xs"
                    >
                      <div>
                        <div className="font-bold text-[#111111] uppercase tracking-wider">{proj.title}</div>
                        <div className="text-[9px] text-[#8A8A8A] uppercase tracking-wider mt-0.5">{proj.date}</div>
                      </div>
                      <button
                        onClick={() => handleDeleteProject(proj.id)}
                        className="text-red-600 hover:text-white hover:bg-red-600 p-1 border border-transparent hover:border-red-600 rounded transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profiles Grid */}
      {loading ? (
        <div className="text-center font-sans text-xs uppercase tracking-widest py-12 text-[#8A8A8A]">
          Loading student registry...
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center font-serif py-12 text-[#8A8A8A] italic border border-dashed border-[#E5E5E5] bg-[#F9F9F9]">
          No registered profiles found in database.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {profiles.map((profile) => {
            const userRole = roles[profile.uid] || "student";
            const isMe = profile.uid === currentUserUid;

            return (
              <div
                key={profile.uid}
                className="border border-[#E5E5E5] bg-white p-6 hover:border-[#111111] transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Photo & Role */}
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={profile.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.uid}`}
                      alt={profile.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.uid}`;
                      }}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 border border-[#E5E5E5] object-cover"
                    />
                    <div>
                      <h3 className="font-sans font-bold text-base text-[#111111] leading-tight uppercase tracking-wide">
                        {profile.name}
                      </h3>
                      {profile.rollNumber && profile.batchYear ? (
                        <p className="text-[10px] font-mono text-[#8A8A8A]">
                          {profile.batchYear}BCT{profile.rollNumber}
                        </p>
                      ) : (
                        <p className="text-[9px] font-sans text-[#8A8A8A] uppercase tracking-wider italic">
                          Profile Incomplete
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div className="mb-4">
                    <span className={`inline-block px-2 py-0.5 text-[8px] font-sans font-bold uppercase tracking-widest ${getRoleColor(userRole)}`}>
                      {getRoleLabel(userRole)}
                    </span>
                  </div>

                  {/* Skills tags */}
                  {profile.skills && profile.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mb-6">
                      {profile.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-2 py-0.5 bg-[#F9F9F9] border border-[#E5E5E5] text-[9px] font-sans font-bold uppercase tracking-wider text-[#8A8A8A]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#8A8A8A] italic font-serif mb-6">
                      No skills listed.
                    </p>
                  )}
                </div>

                {/* Socials & Interaction Buttons */}
                <div>
                  {/* Social Icons */}
                  <div className="flex items-center gap-3.5 mb-6 border-t border-[#E5E5E5] pt-4">
                    {profile.socials?.github && (
                      <a
                        href={`https://github.com/${profile.socials.github}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#8A8A8A] hover:text-[#111111] transition-colors"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    {profile.socials?.linkedin && (
                      <a
                        href={`https://linkedin.com/in/${profile.socials.linkedin}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#8A8A8A] hover:text-[#111111] transition-colors"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    {profile.socials?.website && (
                      <a
                        href={profile.socials.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#8A8A8A] hover:text-[#111111] transition-colors"
                      >
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedShowcase({ uid: profile.uid, name: profile.name })}
                      className="bg-white hover:bg-[#F9F9F9] text-[#111111] border border-[#E5E5E5] hover:border-[#111111] py-2 text-[9px] font-sans font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1 rounded-[2px]"
                    >
                      <Code className="w-3.5 h-3.5 text-[#111111]" />
                      Showcase
                    </button>
                    {!isMe ? (
                      <button
                        onClick={() => setChatTarget({ uid: profile.uid, name: profile.name })}
                        className="bg-[#111111] hover:bg-[#F4C430] hover:text-[#111111] text-white border border-[#111111] py-2 text-[9px] font-sans font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1 rounded-[2px]"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Chat 1:1
                      </button>
                    ) : (
                      <div className="border border-dashed border-[#E5E5E5] text-[#8A8A8A] bg-[#F9F9F9] flex items-center justify-center py-2 text-[9px] font-sans font-bold uppercase tracking-widest">
                        You
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Showcases popup modal */}
      {selectedShowcase && (
        <ShowcaseModal
          uid={selectedShowcase.uid}
          studentName={selectedShowcase.name}
          isOwner={selectedShowcase.uid === currentUserUid}
          onClose={() => setSelectedShowcase(null)}
        />
      )}

      {/* Chat popup modal */}
      {chatTarget && currentUserProfile && (
        <ChatModal
          currentUid={currentUserUid}
          currentName={currentUserProfile.name}
          targetUid={chatTarget.uid}
          targetName={chatTarget.name}
          onClose={() => setChatTarget(null)}
        />
      )}

    </div>
  );
}

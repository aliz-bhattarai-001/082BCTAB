import React, { useEffect, useState } from "react";
import { BookOpen, FolderGit2, Calendar, Tag, User } from "lucide-react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Project } from "../types";

export default function AboutView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        const projectsRef = collection(db, "projects");
        const q = query(projectsRef, orderBy("date", "desc"));
        const snapshot = await getDocs(q);
        const list: Project[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Project);
        });
        setProjects(list);
      } catch (err) {
        console.error("Error loading timeline projects:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 font-serif text-[#111111] animate-fade-in">
      
      {/* Overview Block */}
      <div className="border border-[#E5E5E5] p-10 mb-12 bg-[#FFFFFF]">
        <span className="block font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A8A8A] mb-3">
          INSTITUTIONAL ARCHIVE
        </span>
        <h2 className="text-4xl font-serif font-bold text-[#111111] mb-6 leading-tight">
          Department of Computer Engineering <span className="text-[#F4C430] italic font-normal">(BCT)</span>
        </h2>
        <p className="text-lg leading-relaxed text-[#111111]/90 mb-8 font-serif max-w-4xl">
          Pulchowk Campus, the central engineering hub of Tribhuvan University, hosts the premier Computer Engineering program in Nepal. The BCT department brings together the country's most talented problem solvers, theoreticians, and tech developers.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-[#E5E5E5] pt-8">
          <div>
            <span className="block font-sans text-[9px] font-bold uppercase tracking-widest text-[#8A8A8A] mb-2">
              CURRICULAR CONTEXT
            </span>
            <p className="text-sm font-serif leading-relaxed text-[#111111]/85">
              Evolving from core computing disciplines, our batch works extensively on artificial intelligence, hardware integrations, modern distributed architectures, and scalable web frameworks.
            </p>
          </div>
          <div>
            <span className="block font-sans text-[9px] font-bold uppercase tracking-widest text-[#8A8A8A] mb-2">
              THE PORTAL SYSTEM
            </span>
            <p className="text-sm font-serif leading-relaxed text-[#111111]/85">
              This portal acts as a permanent, live yearbook. Projects are mapped directly to student profiles, allowing ongoing peer discovery, feedback, and collaboration.
            </p>
          </div>
        </div>
      </div>

      {/* Project Timeline Title */}
      <div className="border-b border-[#111111] pb-3 mb-8 flex justify-between items-baseline">
        <h3 className="text-xl font-sans font-extrabold uppercase tracking-widest text-[#111111] flex items-center gap-2">
          Chronological Registry
        </h3>
        <span className="text-[10px] text-[#8A8A8A] font-sans font-bold uppercase tracking-wider">
          {projects.length} Entries Logged
        </span>
      </div>

      {/* Chronology Tree / Timeline View */}
      {loading ? (
        <div className="py-12 text-center font-sans text-xs uppercase tracking-widest text-[#8A8A8A]">
          Loading Project Chronology...
        </div>
      ) : projects.length === 0 ? (
        <div className="py-12 border border-dashed border-[#E5E5E5] text-center font-serif text-[#8A8A8A] italic bg-[#F9F9F9]">
          No projects logged in the directory yet. Be the first to list yours on your Profile!
        </div>
      ) : (
        <div className="relative border-l border-[#111111] pl-8 ml-4 space-y-8">
          {projects.map((project, idx) => (
            <div key={project.id} className="relative group">
              {/* Timeline dot */}
              <div className="absolute -left-[39px] top-1.5 w-4 h-4 bg-[#FFFFFF] border-2 border-[#111111] group-hover:bg-[#F4C430] transition-colors" />
              
              {/* Project Card */}
              <div className="border border-[#E5E5E5] bg-white p-6 hover:border-[#111111] transition-all duration-200">
                <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-3 gap-2">
                  <h4 className="text-xl font-serif font-bold text-[#111111] hover:underline cursor-pointer">
                    {project.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-[#8A8A8A] font-sans font-bold uppercase tracking-wider">
                    <Calendar className="w-3 h-3 text-[#111111]" />
                    <span>{project.date}</span>
                  </div>
                </div>

                <p className="text-sm font-serif text-[#111111]/80 leading-relaxed mb-4 max-w-4xl">
                  {project.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#E5E5E5] pt-4">
                  <div className="flex items-center gap-1.5 text-xs text-[#111111] font-sans font-bold uppercase tracking-wider">
                    <span className="text-[#8A8A8A]">Owner:</span>
                    <span>{project.ownerName}</span>
                  </div>

                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#F9F9F9] text-[9px] font-sans font-bold uppercase tracking-widest text-[#111111] border border-[#E5E5E5]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

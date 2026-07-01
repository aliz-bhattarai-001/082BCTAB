import React, { useEffect, useState } from "react";
import { BookOpen, Award, Users, Calendar, ArrowRight } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

interface HomeViewProps {
  onNavigate: (tab: string) => void;
  isAuthenticated: boolean;
  onOpenAuth: () => void;
}

export default function HomeView({ onNavigate, isAuthenticated, onOpenAuth }: HomeViewProps) {
  const [stats, setStats] = useState({
    students: 0,
    projects: 0,
    events: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const [usersSnap, projectsSnap, eventsSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "projects")),
          getDocs(collection(db, "events")),
        ]);
        setStats({
          students: usersSnap.size,
          projects: projectsSnap.size,
          events: eventsSnap.size,
        });
      } catch (err) {
        console.error("Error fetching homepage stats:", err);
      }
    }
    fetchStats();
  }, []);

  const handleNavigate = (tab: string) => {
    if (isAuthenticated) {
      onNavigate(tab);
    } else {
      onOpenAuth();
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 font-serif text-[#111111] animate-fade-in">
      
      {/* Editorial Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 border-b border-[#E5E5E5] pb-12">
        
        {/* Left Section - Hero Title & Core Description */}
        <div className="lg:col-span-7 flex flex-col justify-between pr-0 lg:border-r lg:border-[#E5E5E5] lg:pr-12">
          <div>
            <span className="block font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A8A8A] mb-4">
              Tribhuvan University • Institute of Engineering
            </span>
            <h1 className="text-[75px] sm:text-[95px] md:text-[110px] leading-[0.85] font-black tracking-tighter mb-8 italic">
              The <br/>Batch <br/><span className="bg-[#F4C430] px-4 not-italic text-[#111111]">082.</span>
            </h1>
            <p className="text-xl sm:text-2xl leading-tight text-[#111111] max-w-lg mb-8 font-serif">
              Department of Computer Engineering, Pulchowk Campus. A collective of computer engineers building next-generation architectures, frameworks, and peer networks.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-t border-[#111111] pt-8 mt-4">
            <div>
              <span className="block font-sans text-[10px] font-bold uppercase tracking-widest text-[#8A8A8A] mb-2">
                Featured Exhibit
              </span>
              <h3 className="text-lg font-bold italic mb-1 uppercase tracking-tight leading-none text-[#111111]">
                Locus Tech Exhibition
              </h3>
              <p className="text-xs text-[#8A8A8A] font-sans">COORDINATED ANNUALLY BY BCT</p>
            </div>
            <div>
              <span className="block font-sans text-[10px] font-bold uppercase tracking-widest text-[#8A8A8A] mb-2">
                Class Directory
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black">{stats.students || 48}</span>
                <span className="text-xs italic text-[#111111]">enrolled members</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Cards and Action Areas */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-8">
          
          {/* Section 1: Features Feed */}
          <div className="space-y-6">
            <div className="flex justify-between items-end border-b border-[#E5E5E5] pb-2">
              <h2 className="text-xs font-sans font-bold uppercase tracking-[0.25em] text-[#111111]">
                Directory Entry Points
              </h2>
              <span className="text-[9px] font-sans font-semibold text-[#8A8A8A] uppercase tracking-wider">
                Authorized Access Only
              </span>
            </div>

            {/* Profile Showcase Feature */}
            <div 
              onClick={() => handleNavigate("profiles")}
              className="group cursor-pointer border border-[#E5E5E5] p-5 bg-[#FFFFFF] hover:border-[#111111] transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-sans text-[10px] font-bold text-white bg-[#111111] px-1.5 py-0.5 uppercase tracking-wider">
                  01
                </span>
                <span className="text-[10px] font-sans font-bold text-[#8A8A8A] group-hover:text-[#F4C430] transition-colors flex items-center gap-1 uppercase tracking-widest">
                  View Directory <ArrowRight className="w-3 h-3" />
                </span>
              </div>
              <h4 className="text-lg font-bold font-serif leading-tight text-[#111111] group-hover:underline">
                Student Profiles & Showcases
              </h4>
              <p className="text-xs text-[#8A8A8A] font-sans mt-1">
                Browse skills, socials, and live personal HTML code-blocks crafted in the student sandbox.
              </p>
            </div>

            {/* Project Feed Showcase Feature */}
            <div 
              onClick={() => handleNavigate("explore")}
              className="group cursor-pointer border border-[#E5E5E5] p-5 bg-[#FFFFFF] hover:border-[#111111] transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-sans text-[10px] font-bold text-white bg-[#111111] px-1.5 py-0.5 uppercase tracking-wider">
                  02
                </span>
                <span className="text-[10px] font-sans font-bold text-[#8A8A8A] group-hover:text-[#F4C430] transition-colors flex items-center gap-1 uppercase tracking-widest">
                  Explore Work <ArrowRight className="w-3 h-3" />
                </span>
              </div>
              <h4 className="text-lg font-bold font-serif leading-tight text-[#111111] group-hover:underline">
                Ranked Project Explorer
              </h4>
              <p className="text-xs text-[#8A8A8A] font-sans mt-1">
                Inspect software, AI, and graphics creations built by your peers, sorted by star metrics.
              </p>
            </div>

            {/* Events Showcase Feature */}
            <div 
              onClick={() => handleNavigate("events")}
              className="group cursor-pointer border border-[#E5E5E5] p-5 bg-[#FFFFFF] hover:border-[#111111] transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-sans text-[10px] font-bold text-white bg-[#111111] px-1.5 py-0.5 uppercase tracking-wider">
                  03
                </span>
                <span className="text-[10px] font-sans font-bold text-[#8A8A8A] group-hover:text-[#F4C430] transition-colors flex items-center gap-1 uppercase tracking-widest">
                  Browse Events <ArrowRight className="w-3 h-3" />
                </span>
              </div>
              <h4 className="text-lg font-bold font-serif leading-tight text-[#111111] group-hover:underline">
                Active Group Milestones
              </h4>
              <p className="text-xs text-[#8A8A8A] font-sans mt-1">
                Schedule study groups, check internal class notices, and log RSVPs for exams or projects.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Vital Statistics Row */}
      <div className="py-10 border-b border-[#E5E5E5] grid grid-cols-3 gap-6 text-center">
        <div>
          <span className="block font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A8A8A] mb-1">
            Registered Members
          </span>
          <div className="text-4xl font-sans font-extrabold text-[#111111]">
            {stats.students || "—"}
          </div>
        </div>
        <div className="border-x border-[#E5E5E5]">
          <span className="block font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A8A8A] mb-1">
            Projects Indexed
          </span>
          <div className="text-4xl font-sans font-extrabold text-[#111111]">
            {stats.projects || "—"}
          </div>
        </div>
        <div>
          <span className="block font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A8A8A] mb-1">
            Logged Events
          </span>
          <div className="text-4xl font-sans font-extrabold text-[#111111]">
            {stats.events || "—"}
          </div>
        </div>
      </div>

      {/* Mission Statement and Quote block */}
      <div className="py-12 flex flex-col md:flex-row items-start justify-between gap-8">
        <div className="max-w-xl">
          <h4 className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-[#111111] mb-3">
            Core Philosophy & Mission
          </h4>
          <p className="text-lg font-serif italic text-[#111111] leading-relaxed">
            "To build a dynamic digital workspace that matches Pulchowk Campus's elite technical curriculum. This space consolidates peer review, collaborative event planning, and private interactions into a timeless interface."
          </p>
        </div>
        <div className="bg-[#F4C430] text-[#111111] p-6 border border-[#111111] self-stretch flex flex-col justify-between md:w-64">
          <span className="font-sans text-[9px] font-bold uppercase tracking-widest block mb-4">
            Secured Node
          </span>
          <div>
            <span className="font-sans text-xs font-black uppercase tracking-wider block">
              PCAMPUS BCT DEPT
            </span>
            <span className="text-[10px] font-sans text-[#111111]/70 block mt-1">
              ESTABLISHED 2026
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}

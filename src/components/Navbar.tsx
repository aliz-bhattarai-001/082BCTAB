import React from "react";
import { LogOut, Shield, Map, Info, User, HelpCircle, Calendar, Sparkles } from "lucide-react";
import { UserProfile, UserRole } from "../types";

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  userProfile: UserProfile | null;
  userRole: UserRole;
  onSignOut: () => void;
}

export default function Navbar({
  currentTab,
  onNavigate,
  userProfile,
  userRole,
  onSignOut,
}: NavbarProps) {
  const showAdmin = ["admin", "moderator"].includes(userRole);

  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case "admin": return "bg-[#F4C430] text-[#111111]";
      case "moderator": return "bg-[#111111] text-white";
      case "cr":
      case "locus_cr": return "bg-[#F4C430] text-[#111111]";
      default: return "bg-[#E5E5E5] text-[#111111]";
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "admin": return "Admin";
      case "moderator": return "Mod";
      case "cr": return "CR";
      case "locus_cr": return "Locus CR";
      default: return "Student";
    }
  };

  return (
    <header className="border-b border-[#E5E5E5] bg-[#FFFFFF] sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand / Logo */}
        <div
          onClick={() => onNavigate("home")}
          className="cursor-pointer flex items-center gap-2 group"
        >
          <span className="text-2xl font-bold tracking-tighter uppercase font-sans text-[#111111]">
            Class Portal <span className="text-[#F4C430]">/</span> 082 BCT
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => onNavigate("home")}
            className={`text-[11px] font-sans font-bold uppercase tracking-widest transition-all hover:underline decoration-[#F4C430] decoration-2 py-1 ${
              currentTab === "home"
                ? "text-[#111111] underline decoration-[#F4C430] decoration-2"
                : "text-[#8A8A8A] hover:text-[#111111]"
            }`}
          >
            Home
          </button>

          <button
            onClick={() => onNavigate("about")}
            className={`text-[11px] font-sans font-bold uppercase tracking-widest transition-all hover:underline decoration-[#F4C430] decoration-2 py-1 ${
              currentTab === "about"
                ? "text-[#111111] underline decoration-[#F4C430] decoration-2"
                : "text-[#8A8A8A] hover:text-[#111111]"
            }`}
          >
            About
          </button>

          <button
            onClick={() => onNavigate("profiles")}
            className={`text-[11px] font-sans font-bold uppercase tracking-widest transition-all hover:underline decoration-[#F4C430] decoration-2 py-1 ${
              currentTab === "profiles"
                ? "text-[#111111] underline decoration-[#F4C430] decoration-2"
                : "text-[#8A8A8A] hover:text-[#111111]"
            }`}
          >
            Profiles
          </button>

          <button
            onClick={() => onNavigate("events")}
            className={`text-[11px] font-sans font-bold uppercase tracking-widest transition-all hover:underline decoration-[#F4C430] decoration-2 py-1 ${
              currentTab === "events"
                ? "text-[#111111] underline decoration-[#F4C430] decoration-2"
                : "text-[#8A8A8A] hover:text-[#111111]"
            }`}
          >
            Events
          </button>

          <button
            onClick={() => onNavigate("explore")}
            className={`text-[11px] font-sans font-bold uppercase tracking-widest transition-all hover:underline decoration-[#F4C430] decoration-2 py-1 ${
              currentTab === "explore"
                ? "text-[#111111] underline decoration-[#F4C430] decoration-2"
                : "text-[#8A8A8A] hover:text-[#111111]"
            }`}
          >
            Explore
          </button>

          {showAdmin && (
            <button
              onClick={() => onNavigate("admin")}
              className={`text-[11px] font-sans font-bold uppercase tracking-widest transition-all hover:underline decoration-red-600 decoration-2 py-1 ${
                currentTab === "admin"
                  ? "text-red-600 underline decoration-red-600 decoration-2"
                  : "text-red-500/80 hover:text-red-600"
              }`}
            >
              Admin
            </button>
          )}
        </nav>

        {/* Profile Card & Log Out */}
        <div className="flex items-center gap-4">
          {userProfile && (
            <div className="text-right hidden sm:block">
              <span className="block font-sans font-bold text-[10px] text-[#8A8A8A] uppercase tracking-wider">
                {userProfile.email}
              </span>
              <span className={`inline-block px-1.5 py-0.5 text-[8px] font-sans font-bold uppercase tracking-wider mt-0.5 ${getRoleBadgeClass(userRole)}`}>
                {getRoleLabel(userRole)}
              </span>
            </div>
          )}

          <button
            onClick={onSignOut}
            className="bg-[#111111] text-white px-4 py-2 text-xs font-sans font-bold uppercase tracking-widest rounded-[2px] hover:bg-[#F4C430] hover:text-[#111111] transition-all flex items-center gap-1.5"
            title="Log out of Class Portal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>

      </div>
    </header>
  );
}

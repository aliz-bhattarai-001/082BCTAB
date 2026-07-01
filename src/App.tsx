import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, sendEmailVerification } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import { UserProfile, UserRole } from "./types";
import { parsePcampusEmail } from "./utils/helpers";

import AuthScreen from "./components/AuthScreen";
import Navbar from "./components/Navbar";
import HomeView from "./components/HomeView";
import AboutView from "./components/AboutView";
import ProfilesView from "./components/ProfilesView";
import EventsView from "./components/EventsView";
import ExploreView from "./components/ExploreView";
import AdminView from "./components/AdminView";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole>("student");
  const [currentTab, setCurrentTab] = useState<string>("home");
  const [loading, setLoading] = useState<boolean>(true);
  
  const [verificationMsg, setVerificationMsg] = useState<string>("");
  const [sendingVerification, setSendingVerification] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    setSendingVerification(true);
    setVerificationMsg("");
    try {
      await sendEmailVerification(auth.currentUser);
      setVerificationMsg("Success! A new email verification link has been sent to your official address.");
    } catch (err: any) {
      console.error("Resend error:", err);
      setVerificationMsg("Failed to resend: " + (err.message || "An unexpected error occurred."));
    } finally {
      setSendingVerification(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!auth.currentUser) return;
    setVerificationMsg("");
    try {
      await auth.currentUser.reload();
      const updatedUser = auth.currentUser;
      setUser(updatedUser);
      setIsVerified(updatedUser.emailVerified);
      if (updatedUser.emailVerified) {
        setVerificationMsg("Success! Your email address has been verified. Welcome to BCT Class Portal!");
      } else {
        setVerificationMsg("We checked, but your email is still not verified. Please verify using the link sent to your inbox.");
      }
    } catch (err: any) {
      console.error("Check error:", err);
      setVerificationMsg("Failed to refresh: " + (err.message || "An unexpected error occurred."));
    }
  };

  const fetchProfileAndRole = async (uid: string, email: string) => {
    try {
      // 1. Fetch Profile
      const profileRef = doc(db, "users", uid);
      const profileSnap = await getDoc(profileRef);
      
      let profileData: UserProfile;
      if (profileSnap.exists()) {
        profileData = profileSnap.data() as UserProfile;
      } else {
        // Fallback profile hydration from parsed email details
        const parsed = parsePcampusEmail(email);
        profileData = {
          uid,
          name: parsed?.name || "BCT Student",
          email: email,
          skills: [],
          socials: {},
          rollNumber: parsed?.rollNumber || "",
          batchYear: parsed?.batchYear || "",
          photoURL: `https://api.dicebear.com/7.x/identicon/svg?seed=${uid}`,
        };
        await setDoc(profileRef, profileData);
      }
      setUserProfile(profileData);

      // 2. Fetch Role
      const roleRef = doc(db, "roles", uid);
      const roleSnap = await getDoc(roleRef);
      
      let role: UserRole = "student";
      if (roleSnap.exists()) {
        role = roleSnap.data().role as UserRole;
      } else {
        // Fallback root admin seeding check
        role = email === "082bct013.apil@pcampus.edu.np" ? "admin" : "student";
        await setDoc(roleRef, {
          uid,
          email,
          role,
          grantedBy: "system",
          grantedAt: new Date(),
        });
      }
      setUserRole(role);
    } catch (err) {
      console.error("Error loading user profile & role:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        setIsVerified(currentUser.emailVerified);
        await fetchProfileAndRole(currentUser.uid, currentUser.email || "");
      } else {
        setUser(null);
        setUserProfile(null);
        setUserRole("student");
        setCurrentTab("home");
        setIsVerified(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut(auth);
    } catch (err) {
      console.error("Error signing out:", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = () => {
    if (user) {
      fetchProfileAndRole(user.uid, user.email || "");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center font-serif">
        <div className="bg-[#111111] text-[#F4C430] p-4 font-mono font-bold text-xl tracking-tighter border border-[#111111] animate-pulse">
          BCT
        </div>
        <div className="text-xs text-[#8A8A8A] uppercase tracking-wider font-bold mt-4 animate-pulse">
          Establishing Connection to Portal...
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        userProfile={userProfile}
        userRole={userRole}
        onSignOut={handleSignOut}
      />

      {user && !isVerified && (
        <div className="bg-[#FAF9F6] border-b border-orange-200 text-[#111111] py-3.5 px-6 font-serif text-xs">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="text-orange-500 font-bold font-sans text-xs shrink-0 mt-0.5">⚠️ ATTN:</span>
              <div>
                <p className="font-bold font-sans uppercase tracking-wider text-[10px] text-orange-600 mb-0.5">
                  Email Address Not Verified
                </p>
                <p className="text-gray-600 leading-normal">
                  Your email <strong className="font-sans font-semibold">{user.email}</strong> is not verified yet. Please check your inbox (and spam folder) for the verification link.
                </p>
                {verificationMsg && (
                  <p className="mt-2 text-xs font-sans uppercase tracking-wide font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 inline-block">
                    {verificationMsg}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 font-sans shrink-0">
              <button
                onClick={handleResendVerification}
                disabled={sendingVerification}
                className="bg-[#111111] text-[#F4C430] hover:bg-[#F4C430] hover:text-[#111111] text-[10px] font-bold uppercase tracking-widest px-4 py-2 transition-all rounded-[1px] disabled:opacity-50 border border-[#111111]"
              >
                {sendingVerification ? "Sending..." : "Resend Link"}
              </button>
              <button
                onClick={handleCheckVerification}
                className="bg-white border border-[#E5E5E5] hover:border-[#111111] text-[#111111] text-[10px] font-bold uppercase tracking-widest px-4 py-2 transition-all rounded-[1px]"
              >
                Check Status
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 pb-16 bg-white">
        {currentTab === "home" && (
          <HomeView
            onNavigate={setCurrentTab}
            isAuthenticated={!!user}
            onOpenAuth={() => {}}
          />
        )}
        
        {currentTab === "about" && (
          <AboutView />
        )}
        
        {currentTab === "profiles" && (
          <ProfilesView
            currentUserUid={user.uid}
            currentUserProfile={userProfile}
            currentUserRole={userRole}
            onRefreshProfile={refreshProfile}
          />
        )}
        
        {currentTab === "events" && (
          <EventsView
            currentUserUid={user.uid}
            currentUserEmail={user.email || ""}
            currentUserRole={userRole}
          />
        )}
        
        {currentTab === "explore" && (
          <ExploreView
            currentUserUid={user.uid}
          />
        )}
        
        {currentTab === "admin" && (
          <AdminView
            currentUserUid={user.uid}
            currentUserRole={userRole}
          />
        )}
      </main>

      {/* Footer bar */}
      <footer className="border-t border-[#E5E5E5] bg-[#FFFFFF] py-6 text-center font-serif text-xs text-[#8A8A8A]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            &copy; 2026 Pulchowk Campus BCT Department. All Rights Reserved.
          </div>
          <div className="flex gap-4">
            <span className="font-bold text-[#111111]">Secured with Firestore Security Rules</span>
            <span>•</span>
            <span>Local Time: {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

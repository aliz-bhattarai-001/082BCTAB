
import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut, sendEmailVerification, type User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Analytics } from "@vercel/analytics/react";

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
// import { Routes, Route, Navigate } from "react-router-dom";
import ChatRoute from "./routes/ChatRoute";

export default function App() {
    // React Router navigation
    const navigate = useNavigate();

    // Authentication and user state
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [userRole, setUserRole] = useState<UserRole>("student");

    // Loading and email verification state
    const [loading, setLoading] = useState(true);
    const [verificationMsg, setVerificationMsg] = useState("");
    const [sendingVerification, setSendingVerification] = useState(false);
    const [checkingVerification, setCheckingVerification] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    // Navigate to a page using its route
    const navigateToTab = (tab: string) => {
        navigate(tab === "home" ? "/" : `/${tab}`);
    };

    // Resend email verification
    const handleResendVerification = async () => {
        if (!auth.currentUser) return;

        setSendingVerification(true);
        setVerificationMsg("");

        try {
            await sendEmailVerification(auth.currentUser);
            setVerificationMsg("Link sent. Check your inbox and spam folder.");
        } catch (err: any) {
            console.error("Resend error:", err);
            setVerificationMsg(
                "Failed to resend: " +
                (err.message || "An unexpected error occurred.")
            );
        } finally {
            setSendingVerification(false);
        }
    };

    // Refresh the user's verification status
    const handleCheckVerification = async () => {
        if (!auth.currentUser) return;

        setVerificationMsg("");
        setCheckingVerification(true);

        try {
            await auth.currentUser.reload();

            const updatedUser = auth.currentUser;

            setUser(updatedUser);
            setIsVerified(updatedUser.emailVerified);

            if (!updatedUser.emailVerified) {
                setVerificationMsg(
                    "Still not verified. Click the link in your inbox first."
                );
            }
        } catch (err: any) {
            console.error("Check error:", err);
            setVerificationMsg(
                "Failed to refresh: " +
                (err.message || "An unexpected error occurred.")
            );
        } finally {
            setCheckingVerification(false);
        }
    };

    // Check verification status when the browser window regains focus
    useEffect(() => {
        if (!user || isVerified) return;

        const onFocus = () => handleCheckVerification();

        window.addEventListener("focus", onFocus);

        return () => {
            window.removeEventListener("focus", onFocus);
        };
    }, [user, isVerified]);

    // Fetch or create the user's profile and role
    const fetchProfileAndRole = async (uid: string, email: string) => {
        try {
            // User profile
            const profileRef = doc(db, "users", uid);
            const profileSnap = await getDoc(profileRef);

            let profileData: UserProfile;

            if (profileSnap.exists()) {
                profileData = profileSnap.data() as UserProfile;
            } else {
                const parsed = parsePcampusEmail(email);

                profileData = {
                    uid,
                    name: parsed?.name || "BCT Student",
                    email,
                    skills: [],
                    socials: {},
                    rollNumber: parsed?.rollNumber || "",
                    batchYear: parsed?.batchYear || "",
                    photoURL: `https://api.dicebear.com/7.x/identicon/svg?seed=${uid}`,
                };

                await setDoc(profileRef, profileData);
            }

            setUserProfile(profileData);

            // User role
            const roleRef = doc(db, "roles", uid);
            const roleSnap = await getDoc(roleRef);

            let role: UserRole = "student";

            if (roleSnap.exists()) {
                role = roleSnap.data().role as UserRole;
            } else {
                role =
                    email === "082bct013.apil@pcampus.edu.np"
                        ? "admin"
                        : "student";

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

    // Listen for Firebase authentication changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);

            if (currentUser) {
                try {
                    await currentUser.reload();
                } catch (err) {
                    console.error("Failed to reload user:", err);
                }

                const freshUser = auth.currentUser;

                setUser(freshUser);
                setIsVerified(freshUser?.emailVerified ?? false);

                if (freshUser?.emailVerified) {
                    await fetchProfileAndRole(
                        freshUser.uid,
                        freshUser.email || ""
                    );
                } else {
                    setUserProfile(null);
                    setUserRole("student");
                }
            } else {
                setUser(null);
                setUserProfile(null);
                setUserRole("student");
                setIsVerified(false);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Sign out
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

    // Refresh profile information
    const refreshProfile = () => {
        if (user) {
            fetchProfileAndRole(user.uid, user.email || "");
        }
    };

    // Loading screen
    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center font-serif">
                <div className="bg-[#111111] text-[#F4C430] p-4 font-mono font-bold text-xl tracking-tighter border border-[#111111] animate-pulse">
                    BCT
                </div>

                <div className="text-xs text-[#8A8A8A] uppercase tracking-wider font-bold mt-4 animate-pulse">
                    Establishing Connection to Portal...
                </div>

                <Analytics />
            </div>
        );
    }

    // Unauthenticated user
    if (!user) {
        return (
            <>
                <AuthScreen onSuccess={() => { }} />
                <Analytics />
            </>
        );
    }

    // Email verification screen
    if (!isVerified) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-serif text-center">
                <p className="text-xs uppercase tracking-widest text-[#8A8A8A] font-sans mb-3">
                    {user.email}
                </p>

                <h1 className="text-2xl font-bold text-[#111111] mb-6">
                    Verify your email
                </h1>

                <button
                    onClick={handleResendVerification}
                    disabled={sendingVerification}
                    className="bg-[#111111] text-[#F4C430] px-6 py-3 text-xs font-sans font-bold uppercase tracking-widest hover:bg-[#F4C430] hover:text-[#111111] transition-all disabled:opacity-50"
                >
                    {sendingVerification ? "Sending..." : "Send verification link"}
                </button>

                {verificationMsg && (
                    <p className="text-[10px] text-[#8A8A8A] font-sans uppercase tracking-widest mt-4 max-w-xs">
                        {verificationMsg}
                    </p>
                )}

                <button
                    onClick={handleCheckVerification}
                    disabled={checkingVerification}
                    className="mt-6 text-[10px] text-[#8A8A8A] font-sans uppercase font-bold tracking-widest hover:text-[#111111] hover:underline disabled:opacity-50"
                >
                    {checkingVerification
                        ? "Checking…"
                        : "I've verified — continue"}
                </button>

                <button
                    onClick={handleSignOut}
                    className="mt-3 text-[10px] text-[#8A8A8A] font-sans uppercase font-bold tracking-widest hover:text-[#111111] hover:underline"
                >
                    Log out
                </button>

                <Analytics />
            </div>
        );
    }

    // Main application
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar
                userProfile={userProfile}
                userRole={userRole}
                onSignOut={handleSignOut}
            />

            <main className="flex-1 pb-16 bg-white">
                <Routes>
                    <Route
                        path="/"
                        element={
                            <HomeView
                                onNavigate={navigateToTab}
                                isAuthenticated={!!user}
                                onOpenAuth={() => { }}
                            />
                        }
                    />

                    <Route path="/about" element={<AboutView />} />

                    <Route
                        path="/profiles"
                        element={
                            <ProfilesView
                                currentUserUid={user.uid}
                                currentUserProfile={userProfile}
                                currentUserRole={userRole}
                                onRefreshProfile={refreshProfile}
                            />
                        }
                    />

                    <Route
                        path="/events"
                        element={
                            <EventsView
                                currentUserUid={user.uid}
                                currentUserEmail={user.email || ""}
                                currentUserRole={userRole}
                            />
                        }
                    />

                    <Route
                        path="/explore"
                        element={<ExploreView currentUserUid={user.uid} />}
                    />

                    <Route
                        path="/chat/:targetUid"
                        element={
                            <ChatRoute
                                currentUid={user.uid}
                                currentName={userProfile?.name || "Student"}
                            />
                        }
                    />

                    {["admin", "moderator"].includes(userRole) && (
                        <Route
                            path="/admin"
                            element={
                                <AdminView
                                    currentUserUid={user.uid}
                                    currentUserRole={userRole}
                                />
                            }
                        />
                    )}

                    <Route
                        path="*"
                        element={<Navigate to="/" replace />}
                    />
                </Routes>
            </main>

            <footer className="border-t border-[#E5E5E5] bg-[#FFFFFF] py-6 text-center font-serif text-xs text-[#8A8A8A]">
                <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        &copy; 2026, Pulchowk Campus BCT AB. All Rights Reserved.
                    </div>

                    <div className="flex gap-4">
                        <span className="font-bold text-[#111111]">
                            Maintained by Apil Bhandari
                        </span>

                        <span>•</span>

                        <span>
                            Local Time: {new Date().toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </footer>

            <Analytics />
        </div>
    );
}

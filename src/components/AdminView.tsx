import React, { useEffect, useState } from "react";
import { ShieldAlert, Trash2, UserPlus, Mail, ShieldCheck, RefreshCw } from "lucide-react";
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { UserProfile, UserRoleRecord, ExceptionEmail, UserRole } from "../types";

interface AdminViewProps {
  currentUserUid: string;
  currentUserRole: UserRole;
}

export default function AdminView({ currentUserUid, currentUserRole }: AdminViewProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Record<string, UserRole>>({});
  const [exceptions, setExceptions] = useState<ExceptionEmail[]>([]);
  const [newExceptionEmail, setNewExceptionEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const [usersSnap, rolesSnap, exceptionsSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "roles")),
        getDocs(collection(db, "exceptionEmails")),
      ]);

      const usersList: UserProfile[] = [];
      usersSnap.forEach((docSnap) => {
        usersList.push({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
      });
      setUsers(usersList);

      const rolesMap: Record<string, UserRole> = {};
      rolesSnap.forEach((docSnap) => {
        rolesMap[docSnap.id] = docSnap.data().role as UserRole;
      });
      setRoles(rolesMap);

      const exceptionsList: ExceptionEmail[] = [];
      exceptionsSnap.forEach((docSnap) => {
        exceptionsList.push({ email: docSnap.id, ...docSnap.data() } as ExceptionEmail);
      });
      setExceptions(exceptionsList);
    } catch (err) {
      console.error("Error loading admin lists:", err);
      setError("Failed to fetch admin dashboard lists. Check security rules permissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddException = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newExceptionEmail.trim().toLowerCase();
    if (!email) return;

    try {
      setError("");
      setSuccess("");
      const exceptionRef = doc(db, "exceptionEmails", email);
      await setDoc(exceptionRef, {
        email,
        addedBy: currentUserUid,
        addedAt: new Date(),
      });
      setNewExceptionEmail("");
      setSuccess(`Successfully added exception email: ${email}`);
      loadData();
    } catch (err) {
      console.error("Error adding exception email:", err);
      setError("Could not write to exceptions list. Must be Admin.");
    }
  };

  const handleRemoveException = async (email: string) => {
    if (confirm(`Are you sure you want to remove exception for ${email}?`)) {
      try {
        setError("");
        setSuccess("");
        await deleteDoc(doc(db, "exceptionEmails", email));
        setSuccess(`Successfully removed exception for: ${email}`);
        loadData();
      } catch (err) {
        console.error("Error removing exception:", err);
        setError("Failed to delete exception email.");
      }
    }
  };

  const handleUpdateRole = async (targetUid: string, targetEmail: string, newRole: UserRole) => {
    try {
      setError("");
      setSuccess("");
      const roleRef = doc(db, "roles", targetUid);
      await setDoc(roleRef, {
        uid: targetUid,
        email: targetEmail,
        role: newRole,
        grantedBy: currentUserUid,
        grantedAt: new Date(),
      }, { merge: true });
      
      setSuccess(`Successfully updated role of user to ${newRole.toUpperCase()}`);
      setRoles(prev => ({ ...prev, [targetUid]: newRole }));
    } catch (err) {
      console.error("Error changing role:", err);
      setError("Permission denied. Only Admins can re-assign user roles.");
    }
  };

  if (currentUserRole !== "admin" && currentUserRole !== "moderator") {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <ShieldAlert className="w-16 h-16 text-red-600 mx-auto mb-4 animate-bounce" />
        <h2 className="text-2xl font-serif font-bold mb-2">Access Restrained</h2>
        <p className="font-serif text-[#8A8A8A] max-w-sm mx-auto">
          This panel is restricted to authorized Admins and Moderators only.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 font-serif text-[#111111] animate-fade-in">
      
      {/* Title */}
      <div className="border-b border-[#111111] pb-4 mb-8 flex justify-between items-end">
        <div>
          <span className="block font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A8A8A] mb-2">
            ADMINISTRATIVE CONSOLE
          </span>
          <h2 className="text-3xl font-serif font-bold text-[#111111]">
            Portal Settings & Controls
          </h2>
          <p className="text-sm italic text-[#8A8A8A] mt-1">
            Authorized: {currentUserRole.toUpperCase()} — Manage registered student roles and official exception email lists.
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-2 border border-[#E5E5E5] hover:border-[#111111] bg-white transition-colors"
          title="Reload lists"
        >
          <RefreshCw className="w-4 h-4 text-[#111111]" />
        </button>
      </div>

      {error && (
        <div className="border border-red-500 bg-red-50 text-red-700 p-4 mb-6 text-xs font-sans font-bold uppercase tracking-wide">
          {error}
        </div>
      )}

      {success && (
        <div className="border border-green-500 bg-green-50 text-green-800 p-4 mb-6 text-xs font-sans font-bold uppercase tracking-wide">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Exception List Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="border border-[#E5E5E5] p-6 bg-white hover:border-[#111111] transition-all">
            <h3 className="text-lg font-serif font-bold text-[#111111] border-b border-[#E5E5E5] pb-2 mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#F4C430]" />
              Exception Emails
            </h3>
            
            {/* Form */}
            {currentUserRole === "admin" && (
              <form onSubmit={handleAddException} className="space-y-3 mb-6 font-sans">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest mb-1 text-[#8A8A8A]">
                    Allow-list New Email
                  </label>
                  <input
                    type="email"
                    required
                    value={newExceptionEmail}
                    onChange={(e) => setNewExceptionEmail(e.target.value)}
                    placeholder="e.g. professor@ioe.edu.np"
                    className="w-full px-3 py-2 border border-[#E5E5E5] text-xs outline-none focus:border-[#111111] transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#111111] text-[#F4C430] hover:bg-[#F4C430] hover:text-[#111111] py-2 text-xs font-sans font-bold uppercase tracking-widest transition-all rounded-[2px]"
                >
                  Authorize Email
                </button>
              </form>
            )}

            {/* List */}
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {exceptions.length === 0 ? (
                <div className="text-xs text-[#8A8A8A] font-serif italic text-center py-4">
                  No email exceptions mapped.
                </div>
              ) : (
                exceptions.map((exc) => (
                  <div
                    key={exc.email}
                    className="flex items-center justify-between p-2.5 border border-[#E5E5E5] text-xs font-sans uppercase tracking-wider"
                  >
                    <span className="truncate max-w-[140px]" title={exc.email}>
                      {exc.email}
                    </span>
                    {currentUserRole === "admin" && (
                      <button
                        onClick={() => handleRemoveException(exc.email)}
                        className="text-red-600 hover:text-white hover:bg-red-600 p-1 border border-transparent hover:border-red-600 rounded transition-all"
                        title="Revoke clearance"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Roles & Users Table */}
        <div className="lg:col-span-2">
          <div className="border border-[#E5E5E5] p-6 bg-white hover:border-[#111111] transition-all">
            <h3 className="text-lg font-serif font-bold text-[#111111] border-b border-[#E5E5E5] pb-2 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#F4C430]" />
              Registered Student Roles
            </h3>

            {loading ? (
              <div className="text-center font-sans text-xs uppercase tracking-widest text-[#8A8A8A] py-8">
                Loading database lists...
              </div>
            ) : users.length === 0 ? (
              <div className="text-center font-serif text-[#8A8A8A] italic py-8">
                No users registered on Firestore yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-serif text-xs">
                  <thead>
                    <tr className="border-b border-[#111111] font-bold">
                      <th className="py-2.5 pr-2 font-sans text-[10px] uppercase tracking-widest text-[#8A8A8A]">Student</th>
                      <th className="py-2.5 pr-2 font-sans text-[10px] uppercase tracking-widest text-[#8A8A8A]">Official Email</th>
                      <th className="py-2.5 text-right font-sans text-[10px] uppercase tracking-widest text-[#8A8A8A]">Role Rank</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5]">
                    {users.map((user) => {
                      const userRole = roles[user.uid] || "student";
                      return (
                        <tr key={user.uid} className="hover:bg-neutral-50">
                          <td className="py-3 pr-2 font-sans font-bold uppercase tracking-wide text-[#111111]">{user.name}</td>
                          <td className="py-3 pr-2 font-mono text-[11px] text-[#8A8A8A]">
                            {user.email}
                          </td>
                          <td className="py-3 text-right">
                            {currentUserRole === "admin" ? (
                              <select
                                value={userRole}
                                onChange={(e) =>
                                  handleUpdateRole(user.uid, user.email, e.target.value as UserRole)
                                }
                                className="border border-[#E5E5E5] focus:border-[#111111] bg-white px-2 py-1 text-[10px] font-sans font-bold uppercase tracking-widest outline-none cursor-pointer hover:bg-[#F4C430]"
                              >
                                <option value="admin">Admin</option>
                                <option value="moderator">Moderator</option>
                                <option value="cr">CR</option>
                                <option value="locus_cr">Locus CR</option>
                                <option value="student">Student</option>
                              </select>
                            ) : (
                              <span className="px-2 py-0.5 border border-[#E5E5E5] bg-neutral-100 font-sans font-bold uppercase text-[9px] tracking-widest text-[#8A8A8A]">
                                {userRole}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

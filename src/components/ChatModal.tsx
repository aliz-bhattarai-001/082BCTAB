import React, { useState, useEffect, useRef } from "react";
import { X, Send, AlertTriangle, ShieldAlert } from "lucide-react";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Message } from "../types";

interface ChatModalProps {
  currentUid: string;
  currentName: string;
  targetUid: string;
  targetName: string;
  onClose: () => void;
}

const PROFANITY_LIST = ["spam", "scam", "abuse", "shshit", "fuck", "asshole", "bitch"];

export default function ChatModal({
  currentUid,
  currentName,
  targetUid,
  targetName,
  onClose,
}: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [reported, setReported] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const chatId = currentUid < targetUid ? `${currentUid}_${targetUid}` : `${targetUid}_${currentUid}`;

  useEffect(() => {
    // Listen to messages in real-time
    const messagesRef = collection(db, "messages", chatId, "thread");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        msgs.push({
          id: docSnap.id,
          senderUid: data.senderUid,
          senderName: data.senderName,
          text: data.text,
          timestamp: data.timestamp,
        });
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    // Scroll to the bottom on new messages
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filterText = (input: string): string => {
    let clean = input;
    PROFANITY_LIST.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      clean = clean.replace(regex, "****");
    });
    return clean;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || blocked) return;

    const filtered = filterText(text);

    try {
      const threadRef = collection(db, "messages", chatId, "thread");
      await addDoc(threadRef, {
        senderUid: currentUid,
        senderName: currentName,
        text: filtered,
        timestamp: new Date(),
      });
      setText("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleReport = async () => {
    if (confirm(`Are you sure you want to report ${targetName} for abusive behavior?`)) {
      try {
        await addDoc(collection(db, "reports"), {
          reporterUid: currentUid,
          reporterName: currentName,
          reportedUid: targetUid,
          reportedName: targetName,
          chatId,
          timestamp: new Date(),
        });
        setReported(true);
      } catch (err) {
        console.error("Error submitting report:", err);
      }
    }
  };

  const handleBlock = () => {
    if (confirm(`Do you want to temporarily mute/block this conversation?`)) {
      setBlocked(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#111111]/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-[#FFFFFF] w-full max-w-lg h-[70vh] border border-[#111111] flex flex-col relative animate-fade-in font-serif text-[#111111]">
        
        {/* Header */}
        <div className="border-b border-[#E5E5E5] p-5 flex items-center justify-between bg-[#FFFFFF]">
          <div>
            <span className="block font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-[#8A8A8A] mb-1">
              STUDENT COMMUNICATOR (1:1)
            </span>
            <h3 className="text-xl font-serif font-bold text-[#111111] flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full inline-block animate-pulse"></span>
              Chat with {targetName}
            </h3>
            <p className="text-xs italic text-[#8A8A8A] mt-0.5">
              Secure private tunnel — Pulchowk Campus BCT
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!blocked && (
              <button
                onClick={handleBlock}
                className="p-2 border border-[#E5E5E5] hover:border-orange-500 hover:bg-orange-50 text-orange-700 transition-colors"
                title="Mute conversation"
              >
                <AlertTriangle className="w-4 h-4" />
              </button>
            )}
            {!reported ? (
              <button
                onClick={handleReport}
                className="p-2 border border-[#E5E5E5] hover:border-red-500 hover:bg-red-50 text-red-700 transition-colors"
                title="Report user"
              >
                <ShieldAlert className="w-4 h-4" />
              </button>
            ) : (
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider bg-red-100 text-red-700 px-2.5 py-1 border border-red-200">
                Reported
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 border border-[#E5E5E5] hover:border-[#111111] bg-white transition-all"
              title="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#FAF9F6]">
          {blocked ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 font-sans">
              <AlertTriangle className="w-8 h-8 text-orange-500 mb-2" />
              <p className="font-bold text-xs uppercase tracking-widest text-[#111111]">
                Conversation Muted
              </p>
              <p className="text-xs text-[#8A8A8A] mt-1 italic font-serif max-w-xs">
                You have blocked/muted messages in this thread. Unblock or close this window.
              </p>
              <button
                onClick={() => setBlocked(false)}
                className="mt-4 text-[10px] uppercase font-bold tracking-widest border border-[#E5E5E5] hover:border-[#111111] px-4 py-1.5 bg-white transition-all rounded-[1px]"
              >
                Unblock Thread
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[#8A8A8A] italic">
              No messages yet. Send a friendly greeting!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderUid === currentUid;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 border ${
                      isMe
                        ? "bg-[#F4C430] text-[#111111] border-[#111111] rounded-[2px]"
                        : "bg-white text-[#111111] border-[#E5E5E5] rounded-[2px]"
                    }`}
                  >
                    <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                      {msg.text}
                    </p>
                  </div>
                  <span className="text-[9px] font-sans uppercase tracking-wider text-[#8A8A8A] mt-1.5 px-1">
                    {msg.senderName} • {msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "sending..."}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messageEndRef} />
        </div>

        {/* Input area */}
        {!blocked && (
          <form onSubmit={handleSend} className="p-4 border-t border-[#E5E5E5] bg-white flex gap-2 font-sans">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a message to your classmate..."
              className="flex-1 px-3 py-2.5 border border-[#E5E5E5] focus:border-[#111111] text-xs outline-none transition-all rounded-[1px]"
            />
            <button
              type="submit"
              className="bg-[#111111] text-[#F4C430] px-5 py-2.5 hover:bg-[#F4C430] hover:text-[#111111] border border-[#111111] transition-all flex items-center justify-center rounded-[2px]"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { Calendar, Plus, Trash2, Tag, Upload, X, MapPin, Eye } from "lucide-react";
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { ClassEvent, UserRole } from "../types";

interface EventsViewProps {
  currentUserUid: string;
  currentUserEmail: string;
  currentUserRole: UserRole;
}

export default function EventsView({
  currentUserUid,
  currentUserEmail,
  currentUserRole,
}: EventsViewProps) {
  const [events, setEvents] = useState<ClassEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [eventTags, setEventTags] = useState("");
  const [photoInput, setPhotoInput] = useState("");

  // Lightbox State
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const canManage = ["admin", "moderator", "cr", "locus_cr"].includes(currentUserRole);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const eventsRef = collection(db, "events");
      const q = query(eventsRef, orderBy("date", "asc"));
      const snapshot = await getDocs(q);
      const list: ClassEvent[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as ClassEvent);
      });
      setEvents(list);
    } catch (err) {
      console.error("Error loading events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleAddPhotoUrl = () => {
    if (photoInput.trim()) {
      setPhotos([...photos, photoInput.trim()]);
      setPhotoInput("");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      alert("Image size must be under 1.5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPhotos([...photos, base64]);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhotoIndex = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !description.trim()) return;

    try {
      const eventId = `event_${Date.now()}`;
      const tagsArray = eventTags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      const eventRef = doc(db, "events", eventId);
      await setDoc(eventRef, {
        title: title.trim(),
        date,
        description: description.trim(),
        photos,
        tags: tagsArray,
        createdBy: currentUserUid,
        createdByEmail: currentUserEmail,
        createdAt: new Date(),
      });

      // Clear Form
      setTitle("");
      setDate("");
      setDescription("");
      setPhotos([]);
      setEventTags("");
      setCreating(false);
      loadEvents();
    } catch (err) {
      console.error("Error creating event:", err);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this event?")) {
      try {
        await deleteDoc(doc(db, "events", id));
        loadEvents();
      } catch (err) {
        console.error("Error deleting event:", err);
      }
    }
  };

  // Divide events into upcoming and past
  const todayStr = new Date().toISOString().split("T")[0];
  const upcomingEvents = events.filter((e) => e.date >= todayStr);
  const pastEvents = events.filter((e) => e.date < todayStr).reverse(); // show most recent past first

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 font-serif text-[#111111] animate-fade-in">
      
      {/* Page Header */}
      <div className="mb-10 flex flex-wrap gap-4 items-center justify-between border-b border-[#111111] pb-4">
        <div>
          <span className="block font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A8A8A] mb-2">
            ACADEMIC CALENDAR & ARCHIVES
          </span>
          <h2 className="text-3xl font-serif font-bold text-[#111111]">
            Class Milestones & Events
          </h2>
          <p className="text-sm italic text-[#8A8A8A]">
            Chronological log of major examinations, presentations, field trips, and workshops.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setCreating(!creating)}
            className="bg-[#111111] text-white hover:bg-[#F4C430] hover:text-[#111111] px-4 py-2.5 text-xs font-sans font-bold uppercase tracking-widest transition-all rounded-[2px]"
          >
            {creating ? "Cancel Event creation" : "Schedule New Event / Milestone"}
          </button>
        )}
      </div>

      {/* Event creation form */}
      {creating && (
        <form
          onSubmit={handleSubmitEvent}
          className="border border-[#E5E5E5] p-8 bg-[#F9F9F9] mb-10 max-w-2xl mx-auto animate-fade-in space-y-4"
        >
          <span className="block font-sans text-[9px] font-bold uppercase tracking-widest text-[#8A8A8A] mb-1">
            SCHEDULER / LOGISTICS
          </span>
          <h3 className="text-xl font-serif font-bold text-[#111111] border-b border-[#E5E5E5] pb-2 mb-4">
            Schedule Event details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
            <div>
              <label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Event Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. BCT Project Exhibition"
                className="w-full p-2 border border-[#E5E5E5] bg-white text-xs outline-none focus:border-[#111111] transition-all"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 border border-[#E5E5E5] bg-white text-xs outline-none focus:border-[#111111] transition-all uppercase"
              />
            </div>
          </div>

          <div className="font-sans">
            <label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Description / Logistics</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide event details, timing, venue or general specifications..."
              className="w-full p-2.5 border border-[#E5E5E5] bg-white text-xs resize-none outline-none focus:border-[#111111] transition-all font-serif text-sm leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
            <div>
              <label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Tags (Comma separated)</label>
              <input
                type="text"
                value={eventTags}
                onChange={(e) => setEventTags(e.target.value)}
                placeholder="exhibition, project, examination"
                className="w-full p-2 border border-[#E5E5E5] bg-white text-xs outline-none focus:border-[#111111] transition-all"
              />
            </div>

            {/* Photo adding section */}
            <div>
              <label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Photos / Gallery Asset</label>
              <div className="flex gap-2 mb-1">
                <input
                  type="text"
                  value={photoInput}
                  onChange={(e) => setPhotoInput(e.target.value)}
                  placeholder="https://image-url.com"
                  className="flex-1 p-2 border border-[#E5E5E5] bg-white text-xs outline-none focus:border-[#111111] transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddPhotoUrl}
                  className="bg-[#111111] text-[#F4C430] hover:bg-[#F4C430] hover:text-[#111111] border border-[#111111] px-3 text-xs font-sans font-bold uppercase tracking-wider transition-all rounded-[1px]"
                >
                  Add URL
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase font-bold tracking-wider text-[#8A8A8A]">Or upload local:</span>
                <label className="text-[9px] uppercase font-bold tracking-widest bg-white border border-[#E5E5E5] hover:border-[#111111] px-2 py-0.5 cursor-pointer flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  Upload Image
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Photo Preview List */}
          {photos.length > 0 && (
            <div className="border border-[#E5E5E5] bg-white p-3 space-y-2">
              <span className="text-[9px] font-sans font-bold uppercase tracking-widest block text-[#8A8A8A]">Gallery Preview ({photos.length})</span>
              <div className="flex flex-wrap gap-2">
                {photos.map((p, idx) => (
                  <div key={idx} className="relative w-14 h-14 border border-[#E5E5E5] bg-neutral-100">
                    <img src={p} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhotoIndex(idx)}
                      className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#111111] text-[#F4C430] hover:bg-[#F4C430] hover:text-[#111111] py-3 text-xs font-sans font-bold uppercase tracking-widest transition-all rounded-[2px]"
          >
            Create Event Listing
          </button>
        </form>
      )}

      {/* Event Lists Grid */}
      {loading ? (
        <div className="text-center font-sans text-xs uppercase tracking-widest text-[#8A8A8A] py-12">
          Loading class events board...
        </div>
      ) : events.length === 0 ? (
        <div className="text-center font-serif py-12 text-[#8A8A8A] italic border border-dashed border-[#E5E5E5] bg-[#F9F9F9]">
          No events or milestones listed yet.
        </div>
      ) : (
        <div className="space-y-12">
          
          {/* Upcoming Section */}
          {upcomingEvents.length > 0 && (
            <div>
              <h3 className="text-xl font-serif font-bold text-[#111111] border-b border-[#111111] pb-2 mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#F4C430]"></span>
                Upcoming Schedules & Milestones
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {upcomingEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="border border-[#E5E5E5] bg-[#FFFFFF] p-6 hover:border-[#111111] transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#8A8A8A] border border-[#E5E5E5] px-2.5 py-1 bg-white flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#F4C430]" />
                          {evt.date}
                        </span>
                        {canManage && (
                          <button
                            onClick={() => handleDeleteEvent(evt.id)}
                            className="text-red-600 hover:text-white hover:bg-red-600 p-1 border border-transparent hover:border-red-600 rounded transition-all"
                            title="Remove event schedule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <h4 className="text-2xl font-serif font-bold text-[#111111] mb-2">{evt.title}</h4>
                      <p className="text-sm font-serif text-neutral-800 leading-relaxed mb-4 whitespace-pre-wrap">
                        {evt.description}
                      </p>

                      {/* Photo Snap Scroll Gallery */}
                      {evt.photos && evt.photos.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 snap-x pr-1 scrollbar-thin">
                          {evt.photos.map((photo, i) => (
                            <div
                              key={i}
                              onClick={() => setLightboxImage(photo)}
                              className="w-48 h-32 flex-shrink-0 border border-[#E5E5E5] hover:border-[#111111] relative snap-start group cursor-pointer overflow-hidden bg-neutral-100"
                            >
                              <img src={photo} alt="" className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-[#111111]/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye className="w-5 h-5 text-white" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {evt.tags && evt.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 border-t border-[#E5E5E5] pt-3">
                        {evt.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#E5E5E5] bg-[#F9F9F9] text-[9px] font-sans font-bold uppercase tracking-wider text-[#8A8A8A]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past/Historic Section */}
          {pastEvents.length > 0 && (
            <div>
              <h3 className="text-xl font-serif font-bold text-[#8A8A8A] border-b border-[#E5E5E5] pb-2 mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#8A8A8A]"></span>
                Past Logs & Gallery
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 opacity-90 hover:opacity-100 transition-opacity">
                {pastEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="border border-[#E5E5E5] bg-[#FFFFFF] p-6 hover:border-[#111111] transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#8A8A8A] border border-[#E5E5E5] px-2.5 py-1 bg-[#F9F9F9] flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#8A8A8A]" />
                          {evt.date}
                        </span>
                        {canManage && (
                          <button
                            onClick={() => handleDeleteEvent(evt.id)}
                            className="text-red-600 hover:text-white hover:bg-red-600 p-1 border border-transparent hover:border-red-600 rounded transition-all"
                            title="Remove event schedule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <h4 className="text-xl font-serif font-bold text-[#111111] mb-2">{evt.title}</h4>
                      <p className="text-sm font-serif text-neutral-600 leading-relaxed mb-4 whitespace-pre-wrap">
                        {evt.description}
                      </p>

                      {/* Photo Snap Scroll Gallery */}
                      {evt.photos && evt.photos.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 snap-x pr-1 scrollbar-thin">
                          {evt.photos.map((photo, i) => (
                            <div
                              key={i}
                              onClick={() => setLightboxImage(photo)}
                              className="w-40 h-24 flex-shrink-0 border border-[#E5E5E5] hover:border-[#111111] relative snap-start group cursor-pointer overflow-hidden bg-neutral-100"
                            >
                              <img src={photo} alt="" className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-[#111111]/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {evt.tags && evt.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 border-t border-[#E5E5E5] pt-3">
                        {evt.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#E5E5E5] bg-[#F9F9F9] text-[9px] font-sans font-bold uppercase tracking-wider text-[#8A8A8A]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 bg-[#111111]/95 z-50 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img
            src={lightboxImage}
            alt="Lightbox view"
            className="max-w-full max-h-[90vh] border border-[#E5E5E5] shadow-2xl animate-fade-in"
          />
        </div>
      )}

    </div>
  );
}

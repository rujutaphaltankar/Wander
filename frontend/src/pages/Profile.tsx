import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Bookmark, X, LogOut, Sparkles, MapPin, CalendarDays,
  Users, Wallet, ArrowRight, Trash2, Globe, Camera, Loader2, Check, Edit2
} from "lucide-react";
import { TopBar } from "../components/TopBar";
import { api } from "../api/client";
import { useAuthStore } from "../store/authStore";

interface TripSummary {
  id: string;
  title: string;
  days: number;
  people: number;
  budgetInr: number;
  createdAt: string;
  city: { name: string; country: string };
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuthStore();
  const [favorites, setFavorites] = useState<Array<{ placeId: string; place: { name: string; type: string } }>>([]);
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"trips" | "saved">("trips");

  // Profile edit states
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || "");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [msg, setMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get("/favorites").then((res) => setFavorites(res.data.favorites)).catch(() => {});
    api.get("/itineraries")
      .then((res) => setTrips(res.data.trips))
      .catch(() => {})
      .finally(() => setTripsLoading(false));
  }, []);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setMsg("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const upRes = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const avatarUrl = upRes.data.url;
      const userRes = await api.patch("/users/me", { avatarUrl });

      updateUser({ avatarUrl });
      setMsg("Profile picture updated!");
      setTimeout(() => setMsg(""), 3000);
    } catch (err: any) {
      setMsg(err.response?.data?.message || "Failed to upload profile picture.");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSaveName() {
    if (!nameInput.trim() || nameInput.trim() === user?.name) {
      setEditingName(false);
      return;
    }
    setUpdatingProfile(true);
    setMsg("");
    try {
      await api.patch("/users/me", { name: nameInput.trim() });
      updateUser({ name: nameInput.trim() });
      setEditingName(false);
      setMsg("Name updated!");
      setTimeout(() => setMsg(""), 3000);
    } catch (err: any) {
      setMsg(err.response?.data?.message || "Failed to update name.");
    } finally {
      setUpdatingProfile(false);
    }
  }

  async function removeFavorite(placeId: string) {
    await api.delete(`/favorites/${placeId}`);
    setFavorites((f) => f.filter((fav) => fav.placeId !== placeId));
  }

  async function deleteTrip(tripId: string) {
    if (!confirm("Delete this trip and its budget?")) return;
    await api.delete(`/itineraries/${tripId}`);
    setTrips((t) => t.filter((tr) => tr.id !== tripId));
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="pb-8">
      <TopBar title="My Profile" sub="Your trips, saved places, and account settings" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        {/* Left: Profile card */}
        <div className="space-y-5">
          <div className="card rounded-3xl p-6 flex flex-col items-center text-center transition-colors relative">
            {/* Avatar with upload button */}
            <div className="relative mb-4 group">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover border-2 border-green shadow-md"
                />
              ) : (
                <div className="rounded-full flex items-center justify-center shrink-0 w-24 h-24 bg-gradient-to-br from-green-soft to-blue-soft text-green text-3xl font-bold font-display shadow-md">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : "TR"}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-green text-ink hover:bg-green-soft shadow-md transition-transform hover:scale-110"
                title="Upload profile picture"
              >
                {uploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {/* Name / Inline Edit */}
            {editingName ? (
              <div className="flex items-center gap-1.5 mb-1 w-full justify-center">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="card text-sm font-bold px-2 py-1 rounded-lg text-center max-w-[180px] bg-white dark:bg-[#122029]"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  disabled={updatingProfile}
                  className="p-1.5 rounded-lg bg-green text-ink hover:bg-green-soft"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => { setEditingName(false); setNameInput(user?.name || ""); }}
                  className="p-1.5 rounded-lg bg-cloud dark:bg-[#22333A] text-muted hover:text-ink"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mb-1">
                <h2 className="text-lg font-bold text-ink dark:text-[#EAF3EF]">{user?.name}</h2>
                <button
                  onClick={() => { setEditingName(true); setNameInput(user?.name || ""); }}
                  className="text-muted hover:text-green p-0.5 rounded transition-colors"
                  title="Edit name"
                >
                  <Edit2 size={13} />
                </button>
              </div>
            )}

            <p className="text-sm text-muted mb-1">{user?.email}</p>

            {msg && (
              <div className={`text-xs mt-2 font-medium ${msg.includes("Failed") ? "text-red-500" : "text-green"}`}>
                {msg}
              </div>
            )}

            <div className="flex items-center gap-4 mt-3 mb-6 text-xs text-muted">
              <div className="flex items-center gap-1">
                <Sparkles size={12} className="text-green" />
                <span>{trips.length} trips</span>
              </div>
              <div className="flex items-center gap-1">
                <Bookmark size={12} className="text-orange" />
                <span>{favorites.length} saved</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="card w-full rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border border-line dark:border-[#22333A]"
            >
              <LogOut size={16} /> Log out
            </button>
          </div>

          {/* Quick links */}
          <div className="card rounded-3xl p-5 space-y-2">
            <h3 className="font-display font-bold text-sm text-ink dark:text-[#EAF3EF] mb-3">Quick Actions</h3>
            {[
              { label: "Plan a new trip", icon: Sparkles, to: "/planner", color: "text-green" },
              { label: "Explore cities", icon: Globe, to: "/explore", color: "text-blue" },
              { label: "Budget tracker", icon: Wallet, to: "/budget", color: "text-orange" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.to}
                  onClick={() => navigate(item.to)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cloud dark:hover:bg-[#1C2C35] transition-colors text-sm text-ink dark:text-[#EAF3EF]"
                >
                  <Icon size={15} className={item.color} />
                  {item.label}
                  <ArrowRight size={13} className="text-muted ml-auto" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Tabs — Trips + Saved */}
        <div className="lg:col-span-2">
          {/* Tab switcher */}
          <div className="flex gap-1 mb-5 bg-cloud dark:bg-[#122029] p-1 rounded-2xl border border-line dark:border-[#22333A]">
            <button
              onClick={() => setActiveTab("trips")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "trips"
                  ? "bg-white dark:bg-[#0B171E] text-green shadow-sm"
                  : "text-muted hover:text-ink dark:hover:text-[#EAF3EF]"
              }`}
            >
              <Sparkles size={14} /> My Trips
              <span className="text-xs font-mono bg-line dark:bg-[#22333A] px-1.5 py-0.5 rounded-full">{trips.length}</span>
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "saved"
                  ? "bg-white dark:bg-[#0B171E] text-green shadow-sm"
                  : "text-muted hover:text-ink dark:hover:text-[#EAF3EF]"
              }`}
            >
              <Bookmark size={14} /> Saved Places
              <span className="text-xs font-mono bg-line dark:bg-[#22333A] px-1.5 py-0.5 rounded-full">{favorites.length}</span>
            </button>
          </div>

          {/* My Trips */}
          {activeTab === "trips" && (
            <div className="space-y-3">
              {tripsLoading && (
                <div className="py-8 text-sm text-muted text-center flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin text-green" /> Loading trips…
                </div>
              )}
              {!tripsLoading && trips.length === 0 && (
                <div className="card rounded-3xl p-10 text-center">
                  <Sparkles size={32} className="text-muted mx-auto mb-3" />
                  <div className="text-sm font-semibold text-ink dark:text-[#EAF3EF] mb-2">No trips yet</div>
                  <div className="text-xs text-muted mb-5">Plan your first AI-powered itinerary to any city in the world.</div>
                  <button onClick={() => navigate("/planner")} className="btn-primary text-sm px-6 py-2.5">
                    Plan My First Trip →
                  </button>
                </div>
              )}
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className="card rounded-2xl p-4 hover:shadow-md transition-all group cursor-pointer"
                  onClick={() => navigate(`/trips/${trip.id}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="rounded-xl p-2.5 bg-green-soft/40 dark:bg-green/10 text-green shrink-0 mt-0.5">
                        <MapPin size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-ink dark:text-[#EAF3EF] group-hover:text-green transition-colors truncate">
                          {trip.city?.name ?? trip.title}
                          {trip.city?.country && <span className="text-muted font-normal ml-1 text-xs">· {trip.city.country}</span>}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted">
                          <span className="flex items-center gap-1"><CalendarDays size={11} /> {trip.days} days</span>
                          <span className="flex items-center gap-1"><Users size={11} /> {trip.people} people</span>
                          <span className="flex items-center gap-1"><Wallet size={11} /> ₹{trip.budgetInr.toLocaleString()}</span>
                        </div>
                        <div className="text-[10px] text-muted mt-1">
                          {new Date(trip.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteTrip(trip.id); }}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-muted hover:text-red-500 transition-colors"
                        title="Delete trip"
                      >
                        <Trash2 size={14} />
                      </button>
                      <ArrowRight size={14} className="text-muted group-hover:text-green transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Saved Places */}
          {activeTab === "saved" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {favorites.length === 0 && (
                <div className="card rounded-3xl p-10 text-center col-span-2">
                  <Bookmark size={32} className="text-muted mx-auto mb-3" />
                  <div className="text-sm font-semibold text-ink dark:text-[#EAF3EF] mb-2">Nothing saved yet</div>
                  <div className="text-xs text-muted mb-5">Tap the heart icon on any place in Explore to save it here.</div>
                  <button onClick={() => navigate("/explore")} className="btn-primary text-sm px-6 py-2.5">
                    Explore Places →
                  </button>
                </div>
              )}
              {favorites.map((f) => (
                <div key={f.placeId} className="card rounded-2xl p-4 flex items-center justify-between gap-3 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="rounded-xl p-2 bg-orange/10 text-orange shrink-0">
                      <Bookmark size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-ink dark:text-[#EAF3EF] truncate">{f.place.name}</div>
                      {f.place.type && (
                        <div className="text-[10px] text-muted capitalize">{f.place.type.toLowerCase()}</div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFavorite(f.placeId)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-muted hover:text-red-500 transition-colors shrink-0"
                    aria-label="Remove saved place"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

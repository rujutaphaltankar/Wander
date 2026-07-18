import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Bookmark, X, LogOut } from "lucide-react";
import { TopBar } from "../components/TopBar";
import { api } from "../api/client";
import { useAuthStore } from "../store/authStore";

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [favorites, setFavorites] = useState<Array<{ placeId: string; place: { name: string } }>>([]);

  useEffect(() => {
    api.get("/favorites").then((res) => setFavorites(res.data.favorites));
  }, []);

  async function removeFavorite(placeId: string) {
    await api.delete(`/favorites/${placeId}`);
    setFavorites((f) => f.filter((fav) => fav.placeId !== placeId));
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="pb-8">
      <TopBar title="Account Settings" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        {/* Left Side: Profile Summary & Account Controls */}
        <div className="space-y-6">
          <div className="card rounded-3xl p-6 flex flex-col items-center text-center transition-colors">
            <div className="rounded-full flex items-center justify-center shrink-0 w-20 h-20 bg-green-soft text-green mb-4">
              <User size={36} />
            </div>
            <h2 className="text-lg font-bold text-ink dark:text-[#EAF3EF]">{user?.name}</h2>
            <p className="text-sm text-muted mb-6">{user?.email}</p>

            <button
              onClick={handleLogout}
              className="card w-full rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border border-line dark:border-[#22333A]"
            >
              <LogOut size={16} /> Log out of account
            </button>
          </div>
        </div>

        {/* Right Side: Saved Places */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-line dark:border-[#22333A] pb-3 mb-2">
            <h3 className="font-display font-bold text-base text-ink dark:text-[#EAF3EF] flex items-center gap-2">
              <Bookmark size={18} className="text-green" /> Saved Attractions & Places
            </h3>
            <span className="text-xs text-muted font-mono bg-cloud dark:bg-[#122029] border border-line dark:border-[#22333A] px-2.5 py-1 rounded-full">
              {favorites.length} saved
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {favorites.length === 0 && (
              <div className="card rounded-2xl p-6 text-sm text-center text-muted col-span-2">
                Nothing saved yet. Tap the heart icon on any restaurant or attraction in the Explore section or Home page dashboard to save favorites.
              </div>
            )}
            {favorites.map((f) => (
              <div key={f.placeId} className="card rounded-2xl p-4 flex items-center justify-between hover:shadow-sm transition-all duration-200">
                <span className="text-sm font-semibold text-ink dark:text-[#EAF3EF]">{f.place.name}</span>
                <button
                  onClick={() => removeFavorite(f.placeId)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-muted hover:text-red-500 transition-colors"
                  aria-label="Remove favorite"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

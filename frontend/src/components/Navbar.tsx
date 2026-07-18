import { NavLink, useNavigate } from "react-router-dom";
import { Home, Compass, Sparkles, Wallet, User, LogOut, Moon, Sun, Navigation } from "lucide-react";
import { useUiStore } from "../store/uiStore";
import { useAuthStore } from "../store/authStore";

const items = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/planner", label: "Planner", icon: Sparkles },
  { to: "/budget", label: "Budget", icon: Wallet },
  { to: "/profile", label: "Profile", icon: User },
];

export function Navbar() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useUiStore();
  const { user, logout } = useAuthStore();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-[#122029]/80 backdrop-blur-md border-b border-line dark:border-[#22333A] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="rounded-xl p-2 bg-green-soft text-green flex items-center justify-center">
              <Navigation size={20} className="rotate-45" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-ink dark:text-[#EAF3EF]">
              Wander
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-cloud dark:hover:bg-[#1C2C35] ${
                      isActive
                        ? "text-green bg-green-soft/50 dark:bg-green/10"
                        : "text-muted"
                    }`
                  }
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Action controls */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-full p-2.5 hover:bg-cloud dark:hover:bg-[#1C2C35] text-ink dark:text-[#EAF3EF] transition-all hover:scale-105 active:scale-95"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {user && (
              <>
                {/* User avatar badge */}
                <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-line dark:border-[#22333A]">
                  <div className="w-8 h-8 rounded-full bg-green-soft text-green flex items-center justify-center text-xs font-semibold uppercase">
                    {user.name ? user.name.slice(0, 2) : "TR"}
                  </div>
                  <span className="text-xs font-medium max-w-[100px] truncate text-ink dark:text-[#EAF3EF]">
                    {user.name}
                  </span>
                </div>

                {/* Log Out button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line dark:border-[#22333A] text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  aria-label="Log out"
                >
                  <LogOut size={13} />
                  <span className="hidden sm:inline">Log out</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Inline Navigation (Visible only on small screens below md) */}
      <div className="md:hidden border-t border-line dark:border-[#22333A] bg-white dark:bg-[#122029]">
        <div className="flex justify-around py-1.5">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                    isActive ? "text-green" : "text-muted"
                  }`
                }
              >
                <Icon size={18} />
                <span className="text-[9px] font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </header>
  );
}

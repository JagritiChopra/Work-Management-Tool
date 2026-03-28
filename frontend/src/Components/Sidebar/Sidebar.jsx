import { memo, useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { APP_THEME } from "../../Theme/appTheme";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", path: "/dashboard" },
  { id: "analytics", label: "Analytics", icon: "monitoring", path: "/analytics" },
  { id: "session", label: "Session", icon: "self_improvement", path: "/session" },
  { id: "calendar", label: "Calendar", icon: "calendar_today", path: "/calendar" },
  { id: "profile", label: "Profile", icon: "account_circle", path: "/profile" },
];

const Icon = memo(function Icon({ name, className = "" }) {
  return (
    <span
      className={`not-italic leading-none flex-shrink-0 ${className}`}
      style={{ fontFamily: "'Material Symbols Outlined'", fontWeight: 300, fontSize: 22 }}
    >
      {name}
    </span>
  );
});

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const activeId = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path))?.id ?? "dashboard";

  const go = useCallback(
    (path) => {
      navigate(path);
      setMobileOpen(false);
    },
    [navigate]
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="hidden max-md:flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-[#bdc9c2] hover:text-white transition-colors flex-shrink-0"
        aria-label="Open menu"
      >
        <Icon name="menu" />
      </button>

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <aside
        className={[
          "flex flex-col flex-shrink-0 z-50 overflow-hidden",
          APP_THEME.classes.glassPanel,
          "shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]",
          "sticky top-4 self-start h-[calc(100vh-2rem)] m-4 mr-0 rounded-3xl",
          "transition-[width,padding] duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
          collapsed ? "w-[72px] px-3 py-7" : "w-[260px] px-4 py-7",
          "max-md:fixed max-md:top-0 max-md:left-0 max-md:bottom-0 max-md:h-screen max-md:m-0 max-md:rounded-none max-md:rounded-r-3xl max-md:w-[260px] max-md:px-4",
          mobileOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full",
          "max-md:transition-transform max-md:duration-[350ms]",
        ].join(" ")}
      >
        <div className={`flex items-center gap-3 mb-8 overflow-hidden ${collapsed ? "justify-center" : ""}`}>
          <div className="w-[38px] h-[38px] rounded-xl flex-shrink-0 bg-[#73d9b5]/15 border border-[#73d9b5]/30 flex items-center justify-center">
            <Icon name="auto_awesome" className="text-[#73d9b5] text-xl" />
          </div>

          {!collapsed && (
            <div className="overflow-hidden flex-1">
              <p
                className="text-white text-[22px] leading-none whitespace-nowrap"
                style={{ fontFamily: APP_THEME.fonts.serif, fontWeight: 200, fontStyle: "italic" }}
              >
                {APP_THEME.copy.brand}
              </p>
              <p
                className="text-[#bdc9c2]/60 text-[8px] uppercase tracking-[0.2em] mt-1 whitespace-nowrap"
                style={{ fontFamily: APP_THEME.fonts.sans }}
              >
                {APP_THEME.copy.atelier}
              </p>
            </div>
          )}

          <button
            onClick={() => setCollapsed((current) => !current)}
            className="w-8 h-8 rounded-[10px] bg-white/[0.06] border border-white/10 flex items-center justify-center text-[#bdc9c2] hover:bg-white/[0.12] hover:text-white transition-all flex-shrink-0 ml-auto max-md:hidden"
            aria-label={collapsed ? "Expand" : "Collapse"}
          >
            <Icon name={collapsed ? "chevron_right" : "chevron_left"} className="text-lg" />
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeId === item.id;

            return (
              <div key={item.id} className="relative group/nav">
                <button
                  onClick={() => go(item.path)}
                  className={[
                    "w-full flex items-center gap-3 px-3.5 py-[11px] rounded-2xl border transition-all duration-200 text-left overflow-hidden whitespace-nowrap",
                    isActive
                      ? "bg-[#8ff6d0]/[0.08] border-[#8ff6d0]/[0.22] text-white shadow-[0_0_16px_rgba(143,246,208,0.08)]"
                      : "bg-transparent border-transparent text-[#bdc9c2] hover:bg-white/[0.06] hover:text-white",
                    collapsed ? "justify-center" : "",
                  ].join(" ")}
                  aria-label={item.label}
                >
                  <Icon name={item.icon} className={isActive ? "text-[#8ff6d0]" : ""} />
                  {!collapsed && (
                    <span className="text-sm font-medium tracking-wide" style={{ fontFamily: APP_THEME.fonts.sans }}>
                      {item.label}
                    </span>
                  )}
                </button>

                {collapsed && (
                  <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 bg-[#353534] text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/10 whitespace-nowrap opacity-0 group-hover/nav:opacity-100 transition-opacity duration-150 z-50 max-md:hidden">
                    {item.label}
                  </span>
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-white/[0.06] pt-5 flex flex-col gap-2" />
      </aside>
    </>
  );
}

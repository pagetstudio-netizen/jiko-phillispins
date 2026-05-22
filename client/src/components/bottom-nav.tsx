import { useLocation } from "wouter";

import iconHome   from "@assets/20260228_010602_1775758828500.png";
import iconRevenu from "@assets/20260228_010536_1775758828691.png";
import iconEquipe from "@assets/20251223_225137_1775758828713.png";
import iconCompte from "@assets/20260228_010619_1775758828669.png";

const whiteFilter = "brightness(0) invert(1)";
const greenFilter = "brightness(0) saturate(100%) invert(42%) sepia(98%) saturate(500%) hue-rotate(80deg) brightness(95%)";

const navItems = [
  { path: "/",            label: "Accueil",    icon: iconHome,   needsWhite: false },
  { path: "/invest",      label: "Produit",    icon: iconRevenu, needsWhite: false },
  { path: "/team",        label: "Equipes",    icon: iconEquipe, needsWhite: true  },
  { path: "/account",     label: "Mon compte", icon: iconCompte, needsWhite: false },
];

export default function BottomNav() {
  const [location, navigate] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ backgroundColor: "#111111", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-around h-16 pb-1">
        {navItems.map((item) => {
          const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center flex-1 h-full"
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <img
                src={item.icon}
                alt={item.label}
                className="w-7 h-7 mb-0.5"
                style={{
                  opacity: isActive ? 1 : 0.55,
                  filter: isActive ? greenFilter : (item.needsWhite ? whiteFilter : undefined),
                }}
              />
              <span
                className="text-[10px] font-semibold"
                style={{ color: isActive ? "#3db51d" : "rgba(255,255,255,0.55)" }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

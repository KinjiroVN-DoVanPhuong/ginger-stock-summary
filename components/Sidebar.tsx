import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart2, Settings, List } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard", icon: BarChart2 },
    { href: "/transactions", label: "Transactions", icon: List },
    { href: "/signal-requests", label: "Signal Requests", icon: Activity },
    { href: "/signals", label: "Trading Signals", icon: Activity },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? "open" : ""}`} onClick={onClose} />
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <Activity size={28} color="var(--primary)" />
          Ginger
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`nav-item ${isActive ? "active" : ""}`}
              >
                <Icon size={20} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}

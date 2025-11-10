import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  Briefcase,
  MapPin,
  BarChart2,
  Settings,
  HelpCircle,
  PenSquare,
  ShieldCheck,
  Layers,
} from "lucide-react";
import clsx from "clsx";

import { useAuth } from "../../contexts/AuthContext";
import { UserRole } from "../../types/auth";

interface SidebarLink {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

const DIVIDER_LINK: SidebarLink = {
  label: "__divider__",
  href: "__divider__",
  icon: LayoutDashboard,
};

const BASE_LINKS: SidebarLink[] = [
  { label: "Home Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Portfolio", href: "/portfolio", icon: Briefcase },
  { label: "Milestone Updates", href: "/portfolio/milestones", icon: MapPin },
  { label: "Transactions", href: "/portfolio/transactions", icon: BarChart2 },
  { label: "Impact Report", href: "/impact", icon: Layers },
  { label: "Settings & Security", href: "/settings", icon: Settings },
  { label: "Help & Support", href: "/help", icon: HelpCircle },
];

const DEVELOPER_LINKS: SidebarLink[] = [
  { label: "My Projects", href: "/developers/projects", icon: Briefcase },
  { label: "Create Project Wizard", href: "/projects/create-enhanced", icon: PenSquare },
  { label: "Verification Hub", href: "/developers/verification", icon: ShieldCheck },
  { label: "Governance Actions", href: "/governance", icon: Layers },
];

interface DashboardSidebarProps {
  className?: string;
}

export const DashboardSidebar = ({ className }: DashboardSidebarProps) => {
  const router = useRouter();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = useMemo(() => {
    if (user?.role === UserRole.DEVELOPER || user?.role === UserRole.ADMIN) {
      return [...BASE_LINKS, DIVIDER_LINK, ...DEVELOPER_LINKS];
    }
    return BASE_LINKS;
  }, [user?.role]);

  const renderLink = (link: SidebarLink, variant: "desktop" | "mobile") => {
    if (link.href === "__divider__") {
      return (
        <div
          key={`${variant}-divider`}
          className={clsx("my-4 h-px bg-emerald-100", variant === "mobile" && "bg-emerald-200")}
          aria-hidden="true"
        />
      );
    }

    const isActive = router.pathname === link.href || router.pathname.startsWith(`${link.href}/`);
    const Icon = link.icon;

    const baseClasses =
      variant === "desktop"
        ? "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition"
        : "group flex items-center gap-3 rounded-lg px-3 py-3 text-base font-semibold";

    return (
      <Link
        key={`${variant}-${link.href}`}
        href={link.href}
        className={clsx(
          baseClasses,
          isActive
            ? "bg-emerald-100 text-emerald-700 shadow-inner shadow-emerald-200"
            : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
        )}
        onClick={() => setMobileOpen(false)}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon className="h-4 w-4 flex-shrink-0 text-emerald-500 group-hover:text-emerald-600" aria-hidden="true" />
        <span>{link.label}</span>
      </Link>
    );
  };

  return (
    <aside className={clsx("lg:w-64 lg:flex-shrink-0", className)}>
      <div className="lg:hidden">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-dashboard-navigation"
        >
          Dashboard menu
          <span aria-hidden="true">{mobileOpen ? "−" : "+"}</span>
        </button>
        {mobileOpen && (
          <nav
            id="mobile-dashboard-navigation"
            className="mt-3 space-y-2 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm"
          >
            {navLinks.map((link) => renderLink(link, "mobile"))}
          </nav>
        )}
      </div>

      <nav
        className="sticky top-24 hidden max-h-[calc(100vh-6rem)] flex-col gap-2 overflow-y-auto rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm lg:flex"
        aria-label="Dashboard navigation"
      >
        <p className="px-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">Navigate</p>
        <div className="mt-2 space-y-1">{navLinks.map((link) => renderLink(link, "desktop"))}</div>
      </nav>
    </aside>
  );
};

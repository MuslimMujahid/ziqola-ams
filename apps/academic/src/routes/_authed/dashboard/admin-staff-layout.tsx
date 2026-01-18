import React from "react";
import { Link } from "@tanstack/react-router";
import {
  BellIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  SearchIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";

import { cn } from "@/lib/utils";

type AdminStaffSubNavItem = {
  label: string;
  to: string;
};

type AdminStaffNavItem = {
  label: string;
  to: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  subItems?: AdminStaffSubNavItem[];
};

type AdminStaffDashboardLayoutProps = {
  navItems: AdminStaffNavItem[];
  children: React.ReactNode;
};

export function AdminStaffDashboardLayout({
  navItems,
  children,
}: AdminStaffDashboardLayoutProps) {
  const [openItems, setOpenItems] = React.useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(navItems.map((item) => [item.label, false] as const)),
  );
  const [collapsed, setCollapsed] = React.useState(false);
  const [openNotifications, setOpenNotifications] = React.useState(false);
  const [openProfile, setOpenProfile] = React.useState(false);
  const notificationMenuRef = React.useRef<HTMLDivElement | null>(null);
  const profileMenuRef = React.useRef<HTMLDivElement | null>(null);

  const expandedWidth = "18.5rem";
  const collapsedWidth = "5rem";

  const toggleItem = (label: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const handleCollapseToggle = () => {
    setCollapsed((prev) => !prev);
  };

  const handleGroupToggle = (item: AdminStaffNavItem) => {
    if (collapsed) {
      setCollapsed(false);
    }

    toggleItem(item.label);
  };

  React.useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        openNotifications &&
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(target)
      ) {
        setOpenNotifications(false);
      }

      if (
        openProfile &&
        profileMenuRef.current &&
        !profileMenuRef.current.contains(target)
      ) {
        setOpenProfile(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenNotifications(false);
        setOpenProfile(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openNotifications, openProfile]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <aside
        className="fixed inset-y-0 left-0 flex flex-col gap-6 overflow-hidden border-r border-border/40 bg-neutral-100/50 px-4 py-6 text-ink transition-all dark:bg-neutral-800/50"
        style={{ width: collapsed ? collapsedWidth : expandedWidth }}
      >
        <div className="flex gap-3 justify-between items-center">
          {!collapsed ? (
            <Link to="/dashboard/admin-staff" className="flex items-center">
              <span className="text-lg font-bold text-primary">Ziqola</span>
            </Link>
          ) : null}
          <Button
            type="button"
            onClick={handleCollapseToggle}
            size="icon"
            variant="ghost"
            className="ml-2 rounded-full bg-surface-2 text-ink-subtle hover:bg-surface-3 hover:text-ink"
            aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
          >
            <ChevronLeftIcon
              className={cn("h-4 w-4", collapsed && "rotate-180")}
              aria-hidden="true"
            />
          </Button>
        </div>

        {!collapsed ? (
          <div className="space-y-1 bg-surface-2 p-3 rounded-xl">
            <h2 className="text-base font-semibold leading-tight text-ink-strong">
              Staf Admin
            </h2>
            <p className="text-xs text-ink-muted">
              Navigasi operasional & pengelolaan akademik
            </p>
          </div>
        ) : null}

        <nav
          className="admin-sidebar-scroll mt-4 flex-1 space-y-2 overflow-y-auto pr-1"
          aria-label="Navigasi dashboard"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const navId = `nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`;
            const hasSubItems = Boolean(item.subItems?.length);
            const isOpen = openItems[item.label] ?? true;

            return (
              <div key={item.label} className="space-y-2">
                {hasSubItems ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleGroupToggle(item)}
                    className="group flex h-auto w-full items-center justify-start gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-surface-2"
                    aria-expanded={isOpen}
                    aria-controls={navId}
                  >
                    <Icon
                      className="h-4 w-4 text-ink-muted"
                      aria-hidden="true"
                    />
                    {!collapsed ? (
                      <>
                        <span className="flex-1 font-normal text-ink">
                          {item.label}
                        </span>
                        <ChevronDownIcon
                          className={cn(
                            "h-4 w-4 text-ink-muted",
                            !isOpen && "-rotate-90",
                          )}
                          aria-hidden="true"
                        />
                        <span className="sr-only">
                          {isOpen
                            ? "Sembunyikan sub menu"
                            : "Tampilkan sub menu"}
                        </span>
                      </>
                    ) : null}
                  </Button>
                ) : (
                  <Link
                    to={item.to}
                    className="group flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-surface-2"
                    activeProps={{
                      className: "bg-primary/10 text-primary",
                    }}
                    inactiveProps={{
                      className: "hover:bg-surface-2",
                    }}
                  >
                    <Icon
                      className="h-4 w-4 text-ink-muted"
                      aria-hidden="true"
                    />
                    {!collapsed ? (
                      <span className="flex-1 font-normal text-ink">
                        {item.label}
                      </span>
                    ) : null}
                  </Link>
                )}

                {hasSubItems && !collapsed ? (
                  <div
                    id={navId}
                    className={cn(
                      "ml-7 space-y-0.5 overflow-hidden border-l border-border pl-3 transition-all",
                      isOpen ? "max-h-44 opacity-100" : "max-h-0 opacity-0",
                    )}
                  >
                    {item.subItems?.map((subItem) => (
                      <Link
                        key={subItem.label}
                        to={subItem.to}
                        className="block rounded-md px-2 py-1.5 text-[13px] text-ink-muted transition"
                        activeProps={{
                          className: "bg-primary/10 text-primary",
                        }}
                        inactiveProps={{
                          className: "hover:bg-surface-2 hover:text-ink",
                        }}
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
      </aside>

      <main
        className="ml-auto flex min-w-0 flex-1 flex-col overflow-y-auto"
        style={{ marginLeft: collapsed ? collapsedWidth : expandedWidth }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="space-y-8 px-8 py-8"
        >
          <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 px-1 sm:px-2">
            <div className="flex w-full items-center gap-3 rounded-xl bg-surface-1 px-4 py-2.5 text-sm text-ink sm:w-auto sm:min-w-[20rem]">
              <SearchIcon
                className="h-4 w-4 text-ink-subtle"
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder="Cari modul, halaman, atau laporan"
                className="h-auto w-full border-0 bg-transparent px-0 py-0 text-sm text-ink-strong shadow-none placeholder:text-ink-muted/70 focus-visible:ring-0"
                aria-label="Cari di dashboard"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="relative" ref={notificationMenuRef}>
                <Button
                  type="button"
                  onClick={() => {
                    setOpenNotifications((prev) => !prev);
                    setOpenProfile(false);
                  }}
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10 rounded-full bg-surface-1 text-ink-subtle hover:bg-surface-2 hover:text-ink"
                  aria-expanded={openNotifications}
                  aria-haspopup="true"
                  aria-controls="admin-notifications-menu"
                  aria-label="Notifikasi"
                >
                  <BellIcon className="h-4 w-4" aria-hidden="true" />
                </Button>
                {openNotifications ? (
                  <div
                    id="admin-notifications-menu"
                    role="menu"
                    className="absolute right-0 z-30 mt-2 w-64 rounded-xl bg-surface-contrast p-3 text-sm text-ink"
                  >
                    <p className="font-semibold text-ink-strong">Notifikasi</p>
                    <div className="mt-2 space-y-2">
                      <div className="rounded-lg bg-info/10 px-3 py-2 text-info">
                        Pembaruan jadwal ujian semester
                      </div>
                      <div className="rounded-lg bg-warning/10 px-3 py-2 text-warning">
                        2 tiket bantuan baru menunggu
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        className="mt-1 w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90"
                      >
                        Lihat semua
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="relative" ref={profileMenuRef}>
                <Button
                  type="button"
                  onClick={() => {
                    setOpenProfile((prev) => !prev);
                    setOpenNotifications(false);
                  }}
                  variant="ghost"
                  className="gap-2 rounded-full bg-surface-1 px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-2"
                  aria-expanded={openProfile}
                  aria-haspopup="true"
                  aria-controls="admin-profile-menu"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    ZA
                  </span>
                  <span className="hidden sm:block">Ziqola Admin</span>
                  <ChevronDownIcon
                    className={cn("h-4 w-4", openProfile && "rotate-180")}
                    aria-hidden="true"
                  />
                  <span className="sr-only">Buka menu profil</span>
                </Button>
                {openProfile ? (
                  <div
                    id="admin-profile-menu"
                    role="menu"
                    className="absolute right-0 z-30 mt-2 w-56 rounded-xl bg-surface-contrast p-3 text-sm text-ink"
                  >
                    <div className="flex items-center gap-3 rounded-lg bg-surface-1 px-3 py-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        ZA
                      </span>
                      <div>
                        <p className="font-semibold text-ink-strong">
                          Ziqola Admin
                        </p>
                        <p className="text-xs text-ink-muted">
                          admin@ziqola.id
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-start rounded-lg px-3 py-2"
                      >
                        Profil
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-start rounded-lg px-3 py-2"
                      >
                        Pengaturan
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-start rounded-lg px-3 py-2 text-error hover:bg-error/10"
                      >
                        Keluar
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {children}
        </motion.div>
      </main>
    </div>
  );
}

export type { AdminStaffNavItem, AdminStaffSubNavItem };

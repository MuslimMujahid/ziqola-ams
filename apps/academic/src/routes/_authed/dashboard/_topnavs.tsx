import React from "react";
import {
  createFileRoute,
  Link,
  Outlet,
  useMatches,
} from "@tanstack/react-router";
import {
  BellIcon,
  BookOpenIcon,
  CalendarIcon,
  ChevronDownIcon,
  ClipboardListIcon,
  FileTextIcon,
  GraduationCapIcon,
  HomeIcon,
  MenuIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { cn } from "@/lib/utils";
import { getRoleLabel } from "@/lib/utils/auth";
import { useLogout } from "@/lib/services/api/auth/use-logout";
import { useAuthStore } from "@/stores/auth.store";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type TopnavSubNavItem =
  | {
      type?: "link";
      label: string;
      to: string;
    }
  | {
      type: "separator";
      label?: string;
    };

type TopnavNavItem = {
  label: string;
  to: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  subItems?: TopnavSubNavItem[];
};

type TopnavId = "student" | "teacher" | "principal";

type TopnavConfig = {
  id: TopnavId;
  title: string;
  description: string;
  homeTo: string;
  navItems: TopnavNavItem[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Navigation Configurations
// ─────────────────────────────────────────────────────────────────────────────

const STUDENT_NAV_ITEMS: TopnavNavItem[] = [
  { label: "Beranda", to: "/dashboard/student", icon: HomeIcon },
  {
    label: "Jadwal",
    to: "/dashboard/student/schedule",
    icon: CalendarIcon,
    subItems: [
      { label: "Jadwal Mingguan", to: "/dashboard/student/schedule" },
      {
        label: "Kalender Akademik",
        to: "/dashboard/student/schedule/calendar",
      },
    ],
  },
  {
    label: "Nilai",
    to: "/dashboard/student/grades",
    icon: FileTextIcon,
    subItems: [
      { label: "Nilai Harian", to: "/dashboard/student/grades/daily" },
      { label: "Nilai Ujian", to: "/dashboard/student/grades/exams" },
      { type: "separator" },
      { label: "Rapor", to: "/dashboard/student/grades/report" },
    ],
  },
  { label: "Kelas", to: "/dashboard/student/classes", icon: BookOpenIcon },
];

const TEACHER_NAV_ITEMS: TopnavNavItem[] = [
  { label: "Beranda", to: "/dashboard/teacher", icon: HomeIcon },
  {
    label: "Jadwal",
    to: "/dashboard/teacher/schedule",
    icon: CalendarIcon,
  },
  {
    label: "Kelas Saya",
    to: "/dashboard/teacher/classes",
    icon: UsersIcon,
    subItems: [
      { label: "Daftar Kelas", to: "/dashboard/teacher/classes" },
      { label: "Kehadiran Siswa", to: "/dashboard/teacher/classes/attendance" },
    ],
  },
  {
    label: "Penilaian",
    to: "/dashboard/teacher/assessments",
    icon: ClipboardListIcon,
    subItems: [
      { label: "Input Nilai", to: "/dashboard/teacher/assessments" },
      {
        label: "Komponen Penilaian",
        to: "/dashboard/teacher/assessments/components",
      },
      { type: "separator" },
      { label: "Rekap Nilai", to: "/dashboard/teacher/assessments/recap" },
    ],
  },
];

const PRINCIPAL_NAV_ITEMS: TopnavNavItem[] = [
  { label: "Beranda", to: "/dashboard/principal", icon: HomeIcon },
  {
    label: "Laporan",
    to: "/dashboard/principal/reports",
    icon: FileTextIcon,
    subItems: [
      { label: "Ringkasan Akademik", to: "/dashboard/principal/reports" },
      { label: "Kehadiran", to: "/dashboard/principal/reports/attendance" },
      { label: "Nilai & Prestasi", to: "/dashboard/principal/reports/grades" },
      { type: "separator" },
      { label: "Laporan Kustom", to: "/dashboard/principal/reports/custom" },
    ],
  },
  {
    label: "Guru",
    to: "/dashboard/principal/teachers",
    icon: GraduationCapIcon,
    subItems: [
      { label: "Daftar Guru", to: "/dashboard/principal/teachers" },
      {
        label: "Jadwal Mengajar",
        to: "/dashboard/principal/teachers/schedules",
      },
      {
        label: "Kinerja Guru",
        to: "/dashboard/principal/teachers/performance",
      },
    ],
  },
  {
    label: "Siswa",
    to: "/dashboard/principal/students",
    icon: UsersIcon,
    subItems: [
      { label: "Daftar Siswa", to: "/dashboard/principal/students" },
      {
        label: "Prestasi Akademik",
        to: "/dashboard/principal/students/achievements",
      },
    ],
  },
  {
    label: "Pengaturan",
    to: "/dashboard/principal/settings",
    icon: SettingsIcon,
  },
];

const TOPNAV_CONFIGS: Record<TopnavId, TopnavConfig> = {
  student: {
    id: "student",
    title: "Siswa",
    description: "Akses jadwal, nilai, dan informasi kelas Anda",
    homeTo: "/dashboard/student",
    navItems: STUDENT_NAV_ITEMS,
  },
  teacher: {
    id: "teacher",
    title: "Guru",
    description: "Kelola jadwal mengajar dan penilaian siswa",
    homeTo: "/dashboard/teacher",
    navItems: TEACHER_NAV_ITEMS,
  },
  principal: {
    id: "principal",
    title: "Kepala Sekolah",
    description: "Pantau dan kelola kegiatan akademik sekolah",
    homeTo: "/dashboard/principal",
    navItems: PRINCIPAL_NAV_ITEMS,
  },
};

const DEFAULT_TOPNAV_ID: TopnavId = "student";

// ─────────────────────────────────────────────────────────────────────────────
// Route Definition
// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authed/dashboard/_topnavs")({
  component: TopnavLayoutRoute,
});

function TopnavLayoutRoute() {
  const matches = useMatches();

  const topnavId = React.useMemo(() => {
    for (const match of [...matches].reverse()) {
      const data = match.staticData as { topnavId?: TopnavId } | undefined;
      if (data?.topnavId) return data.topnavId;
    }
    return DEFAULT_TOPNAV_ID;
  }, [matches]);

  const config = TOPNAV_CONFIGS[topnavId] ?? TOPNAV_CONFIGS[DEFAULT_TOPNAV_ID];

  return <TopnavLayout config={config} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout Component
// ─────────────────────────────────────────────────────────────────────────────

type TopnavLayoutProps = {
  config: TopnavConfig;
};

function TopnavLayout({ config }: TopnavLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [openNotifications, setOpenNotifications] = React.useState(false);
  const [openProfile, setOpenProfile] = React.useState(false);
  const [openNavDropdown, setOpenNavDropdown] = React.useState<string | null>(
    null,
  );
  const [expandedMobileItems, setExpandedMobileItems] = React.useState<
    Record<string, boolean>
  >({});

  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();

  const notificationMenuRef = React.useRef<HTMLDivElement | null>(null);
  const profileMenuRef = React.useRef<HTMLDivElement | null>(null);
  const navDropdownRefs = React.useRef<Record<string, HTMLDivElement | null>>(
    {},
  );

  const userInitials = React.useMemo(() => {
    if (!user?.name) return "U";
    const parts = user.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  }, [user?.name]);

  const userDisplayName = user?.name ?? "Pengguna";
  const userEmail = user?.email ?? "";
  const userRoleLabel = user?.role ? getRoleLabel(user.role) : config.title;

  const toggleMobileItem = (label: string) => {
    setExpandedMobileItems((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  // Close dropdowns on outside click or escape
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

      // Close nav dropdowns when clicking outside
      if (openNavDropdown) {
        const dropdownRef = navDropdownRefs.current[openNavDropdown];
        if (dropdownRef && !dropdownRef.contains(target)) {
          setOpenNavDropdown(null);
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenNotifications(false);
        setOpenProfile(false);
        setMobileMenuOpen(false);
        setOpenNavDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openNotifications, openProfile, openNavDropdown]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-40">
        {/* Primary Bar: Brand, Search, Actions */}
        <div className="relative z-50 bg-neutral-100/80 backdrop-blur-sm dark:bg-neutral-800/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-14 items-center justify-between gap-4">
              {/* Left: Brand */}
              <Link to={config.homeTo} className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">Ziqola</span>
                <span className="hidden text-xs font-medium text-ink-muted sm:inline-block">
                  / {config.title}
                </span>
              </Link>

              {/* Right: Search, Notifications, Profile */}
              <div className="flex items-center gap-2">
                {/* Search (desktop) */}
                <div className="hidden items-center gap-2 rounded-lg bg-surface-1 px-3 py-2 text-sm lg:flex lg:min-w-56">
                  <SearchIcon
                    className="h-4 w-4 text-ink-subtle"
                    aria-hidden="true"
                  />
                  <Input
                    type="search"
                    placeholder="Cari..."
                    className="h-auto w-full border-0 bg-transparent px-0 py-0 text-sm shadow-none placeholder:text-ink-muted/70 focus-visible:ring-0"
                    aria-label="Cari di dashboard"
                  />
                </div>

                {/* Notifications */}
                <div className="relative" ref={notificationMenuRef}>
                  <Button
                    type="button"
                    onClick={() => {
                      setOpenNotifications((prev) => !prev);
                      setOpenProfile(false);
                    }}
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 rounded-full bg-surface-1 text-ink-subtle hover:bg-surface-2 hover:text-ink"
                    aria-expanded={openNotifications}
                    aria-haspopup="true"
                    aria-controls="topnav-notifications-menu"
                    aria-label="Notifikasi"
                  >
                    <BellIcon className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <AnimatePresence>
                    {openNotifications ? (
                      <motion.div
                        id="topnav-notifications-menu"
                        role="menu"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 z-50 mt-2 w-72 rounded-xl bg-surface-contrast p-3 text-sm text-ink"
                      >
                        <p className="font-semibold text-ink-strong">
                          Notifikasi
                        </p>
                        <div className="mt-2 space-y-2">
                          <div className="rounded-lg bg-info/10 px-3 py-2 text-info">
                            Jadwal pelajaran minggu ini telah tersedia
                          </div>
                          <div className="rounded-lg bg-success/10 px-3 py-2 text-success">
                            Nilai ujian tengah semester telah diumumkan
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            className="mt-1 w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90"
                          >
                            Lihat semua
                          </Button>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>

                {/* Profile Dropdown */}
                <div className="relative" ref={profileMenuRef}>
                  <Button
                    type="button"
                    onClick={() => {
                      setOpenProfile((prev) => !prev);
                      setOpenNotifications(false);
                    }}
                    variant="ghost"
                    className="gap-2 rounded-full bg-surface-1 px-2 py-1 text-sm font-medium text-ink hover:bg-surface-2 sm:px-3 sm:py-1.5"
                    aria-expanded={openProfile}
                    aria-haspopup="true"
                    aria-controls="topnav-profile-menu"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {userInitials}
                    </span>
                    <span className="hidden max-w-32 truncate sm:block">
                      {userDisplayName}
                    </span>
                    <ChevronDownIcon
                      className={cn(
                        "h-4 w-4 transition-transform",
                        openProfile && "rotate-180",
                      )}
                      aria-hidden="true"
                    />
                    <span className="sr-only">Buka menu profil</span>
                  </Button>
                  <AnimatePresence>
                    {openProfile ? (
                      <motion.div
                        id="topnav-profile-menu"
                        role="menu"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 z-50 mt-2 w-60 rounded-xl bg-surface-contrast p-3 text-sm text-ink"
                      >
                        <div className="flex items-center gap-3 rounded-lg bg-surface-1 px-3 py-2">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {userInitials}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-ink-strong">
                              {userDisplayName}
                            </p>
                            <p className="truncate text-xs text-ink-muted">
                              {userEmail || userRoleLabel}
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
                            onClick={() => {
                              setOpenProfile(false);
                              logoutMutation.mutate();
                            }}
                            disabled={logoutMutation.isPending}
                            className="w-full justify-start rounded-lg px-3 py-2 text-error hover:bg-error/10"
                          >
                            {logoutMutation.isPending ? "Keluar..." : "Keluar"}
                          </Button>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>

                {/* Mobile Menu Toggle */}
                <Button
                  type="button"
                  onClick={() => setMobileMenuOpen((prev) => !prev)}
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-full bg-surface-1 text-ink-subtle hover:bg-surface-2 hover:text-ink md:hidden"
                  aria-expanded={mobileMenuOpen}
                  aria-controls="topnav-mobile-menu"
                  aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
                >
                  {mobileMenuOpen ? (
                    <XIcon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <MenuIcon className="h-5 w-5" aria-hidden="true" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Bar: Navigation (desktop only) */}
        <div className="relative z-40 hidden border-t border-border/30 bg-neutral-50/80 backdrop-blur-sm dark:bg-neutral-900/80 md:block">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav
              className="flex items-center gap-1 py-2"
              aria-label="Navigasi utama"
            >
              {config.navItems.map((item) => {
                const Icon = item.icon;
                const hasSubItems = Boolean(item.subItems?.length);
                const isDropdownOpen = openNavDropdown === item.label;

                if (hasSubItems) {
                  return (
                    <div
                      key={item.label}
                      className="relative"
                      ref={(el) => {
                        navDropdownRefs.current[item.label] = el;
                      }}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setOpenNavDropdown(
                            isDropdownOpen ? null : item.label,
                          );
                          setOpenNotifications(false);
                          setOpenProfile(false);
                        }}
                        className={cn(
                          "flex h-auto items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-ink-muted transition hover:bg-surface-2 hover:text-ink",
                          isDropdownOpen && "bg-surface-2 text-ink",
                        )}
                        aria-expanded={isDropdownOpen}
                        aria-haspopup="true"
                        aria-controls={`nav-dropdown-${item.label}`}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        <span>{item.label}</span>
                        <ChevronDownIcon
                          className={cn(
                            "h-3 w-3 transition-transform",
                            isDropdownOpen && "rotate-180",
                          )}
                          aria-hidden="true"
                        />
                      </Button>
                      <AnimatePresence>
                        {isDropdownOpen ? (
                          <motion.div
                            id={`nav-dropdown-${item.label}`}
                            role="menu"
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 z-50 mt-1 min-w-48 rounded-xl bg-surface-contrast p-2 text-sm text-ink"
                          >
                            {item.subItems?.map((subItem, index) => {
                              if (subItem.type === "separator") {
                                return (
                                  <div
                                    key={`separator-${index}`}
                                    className="my-1.5 px-2"
                                    role="separator"
                                  >
                                    <div className="h-px w-full bg-border/60" />
                                    {subItem.label ? (
                                      <span className="mt-1.5 block text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
                                        {subItem.label}
                                      </span>
                                    ) : null}
                                  </div>
                                );
                              }

                              return (
                                <Link
                                  key={subItem.label}
                                  to={subItem.to}
                                  onClick={() => setOpenNavDropdown(null)}
                                  className="block rounded-lg px-3 py-2 text-sm text-ink-muted transition hover:bg-surface-1 hover:text-ink"
                                  activeProps={{
                                    className:
                                      "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary",
                                  }}
                                  role="menuitem"
                                >
                                  {subItem.label}
                                </Link>
                              );
                            })}
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-ink-muted transition hover:bg-surface-2 hover:text-ink"
                    activeProps={{
                      className:
                        "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary",
                    }}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {mobileMenuOpen ? (
            <motion.div
              id="topnav-mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border/40 bg-neutral-100/95 backdrop-blur-sm dark:bg-neutral-800/95 md:hidden"
            >
              <nav
                className="mx-auto max-w-7xl space-y-1 px-4 py-4"
                aria-label="Navigasi mobile"
              >
                {/* Mobile Search */}
                <div className="mb-3 flex items-center gap-2 rounded-lg bg-surface-1 px-3 py-2.5">
                  <SearchIcon
                    className="h-4 w-4 text-ink-subtle"
                    aria-hidden="true"
                  />
                  <Input
                    type="search"
                    placeholder="Cari..."
                    className="h-auto w-full border-0 bg-transparent px-0 py-0 text-sm shadow-none placeholder:text-ink-muted/70 focus-visible:ring-0"
                    aria-label="Cari di dashboard"
                  />
                </div>

                {config.navItems.map((item) => {
                  const Icon = item.icon;
                  const hasSubItems = Boolean(item.subItems?.length);
                  const isExpanded = expandedMobileItems[item.label] ?? false;

                  if (hasSubItems) {
                    return (
                      <div key={item.label} className="space-y-1">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => toggleMobileItem(item.label)}
                          className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted transition hover:bg-surface-2 hover:text-ink"
                          aria-expanded={isExpanded}
                        >
                          <span className="flex items-center gap-3">
                            <Icon className="h-5 w-5" aria-hidden="true" />
                            <span>{item.label}</span>
                          </span>
                          <ChevronDownIcon
                            className={cn(
                              "h-4 w-4 transition-transform",
                              isExpanded && "rotate-180",
                            )}
                            aria-hidden="true"
                          />
                        </Button>
                        <AnimatePresence>
                          {isExpanded ? (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.15 }}
                              className="overflow-hidden"
                            >
                              <div className="ml-8 space-y-0.5 border-l border-border/60 pl-3">
                                {item.subItems?.map((subItem, index) => {
                                  if (subItem.type === "separator") {
                                    return (
                                      <div
                                        key={`separator-${index}`}
                                        className="my-2"
                                        role="separator"
                                      >
                                        <div className="h-px w-full bg-border/40" />
                                        {subItem.label ? (
                                          <span className="mt-1.5 block text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
                                            {subItem.label}
                                          </span>
                                        ) : null}
                                      </div>
                                    );
                                  }

                                  return (
                                    <Link
                                      key={subItem.label}
                                      to={subItem.to}
                                      onClick={() => setMobileMenuOpen(false)}
                                      className="block rounded-md px-2 py-2 text-sm text-ink-muted transition hover:bg-surface-2 hover:text-ink"
                                      activeProps={{
                                        className:
                                          "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary",
                                      }}
                                    >
                                      {subItem.label}
                                    </Link>
                                  );
                                })}
                              </div>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted transition hover:bg-surface-2 hover:text-ink"
                      activeProps={{
                        className:
                          "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary",
                      }}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
        >
          {/* Page Content */}
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}

export type { TopnavNavItem, TopnavSubNavItem, TopnavConfig, TopnavId };

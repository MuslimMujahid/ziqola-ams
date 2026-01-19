import React from "react";
import {
  createFileRoute,
  Link,
  Outlet,
  useMatches,
} from "@tanstack/react-router";
import {
  BellIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ClipboardListIcon,
  DatabaseIcon,
  FileTextIcon,
  SearchIcon,
  SettingsIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";

import { cn } from "@/lib/utils";
import { useLogout } from "@/lib/services/api/auth/use-logout";
import {
  useAcademicContext,
  useAcademicPeriods,
  useAcademicYears,
} from "@/lib/services/api/academic";
import { useWorkspaceStore } from "@/stores/workspace.store";

type AdminStaffSubNavItem =
  | {
      type?: "link";
      label: string;
      to: string;
    }
  | {
      type: "separator";
      label?: string;
    };

type AdminStaffNavItem = {
  label: string;
  to: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  subItems?: AdminStaffSubNavItem[];
};

const ADMIN_STAFF_NAV_ITEMS: AdminStaffNavItem[] = [
  {
    label: "Data master",
    to: "/dashboard/admin-staff/classes",
    icon: DatabaseIcon,
    subItems: [
      {
        label: "Tahun ajaran",
        to: "/dashboard/admin-staff/academic-years",
      },
      {
        label: "Periode akademik",
        to: "/dashboard/admin-staff/academic-periods",
      },
      {
        type: "separator",
      },
      {
        label: "Kelas",
        to: "/dashboard/admin-staff/classes",
      },
      {
        label: "Kelompok",
        to: "/dashboard/admin-staff/groups",
      },
      {
        label: "Siswa",
        to: "/dashboard/admin-staff/students",
      },
      {
        label: "Guru",
        to: "/dashboard/admin-staff/teachers",
      },
      {
        label: "Mata pelajaran",
        to: "/dashboard/admin-staff/subjects",
      },
    ],
  },
  {
    label: "Penjadwalan",
    to: "/dashboard/admin-staff/teaching-assignments",
    icon: ClipboardListIcon,
    subItems: [
      {
        label: "Penugasan mengajar",
        to: "/dashboard/admin-staff/teaching-assignments",
      },
      {
        label: "Jadwal pelajaran",
        to: "/dashboard/admin-staff/schedules",
      },
      {
        label: "Sesi pembelajaran",
        to: "/dashboard/admin-staff/sessions",
      },
    ],
  },
  {
    label: "Penilaian & rapor",
    to: "/dashboard/admin-staff/assessments",
    icon: FileTextIcon,
    subItems: [
      {
        label: "Komponen penilaian",
        to: "/dashboard/admin-staff/assessments",
      },
      {
        label: "Input nilai",
        to: "/dashboard/admin-staff/scores",
      },
      {
        label: "Rapor",
        to: "/dashboard/admin-staff/report-cards",
      },
    ],
  },
  {
    label: "Akses Pengguna",
    to: "/dashboard/admin-staff/users",
    icon: UsersIcon,
    subItems: [
      {
        label: "Pengguna",
        to: "/dashboard/admin-staff/users",
      },
      {
        label: "Peran & izin",
        to: "/dashboard/admin-staff/roles",
      },
      {
        label: "Audit perubahan",
        to: "/dashboard/admin-staff/audit-trails",
      },
    ],
  },
  {
    label: "Pengaturan",
    to: "/dashboard/admin-staff/settings",
    icon: SettingsIcon,
  },
];

type SidenavId = "adminStaff";

type SidenavConfig = {
  id: SidenavId;
  title: string;
  description: string;
  homeTo: string;
  navItems: AdminStaffNavItem[];
};

const SIDENAV_CONFIGS: Record<SidenavId, SidenavConfig> = {
  adminStaff: {
    id: "adminStaff",
    title: "Staf Admin",
    description: "Navigasi operasional & pengelolaan akademik",
    homeTo: "/dashboard/admin-staff",
    navItems: ADMIN_STAFF_NAV_ITEMS,
  },
};

const DEFAULT_SIDENAV_ID: SidenavId = "adminStaff";

export const Route = createFileRoute("/_authed/dashboard/_sidenavs")({
  component: SidenavLayoutRoute,
});

function SidenavLayoutRoute() {
  const matches = useMatches();

  const sidenavId = React.useMemo(() => {
    for (const match of [...matches].reverse()) {
      const data = match.staticData as { sidenavId?: SidenavId } | undefined;
      if (data?.sidenavId) return data.sidenavId;
    }
    return DEFAULT_SIDENAV_ID;
  }, [matches]);

  const config =
    SIDENAV_CONFIGS[sidenavId] ?? SIDENAV_CONFIGS[DEFAULT_SIDENAV_ID];

  return <SidenavLayout config={config} />;
}

type SidenavLayoutProps = {
  config: SidenavConfig;
};

export function SidenavLayout({ config }: SidenavLayoutProps) {
  const navItems = React.useMemo(() => config.navItems, [config.navItems]);
  const [openItems, setOpenItems] = React.useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(navItems.map((item) => [item.label, false] as const)),
  );
  const [collapsed, setCollapsed] = React.useState(false);
  const [openNotifications, setOpenNotifications] = React.useState(false);
  const [openProfile, setOpenProfile] = React.useState(false);
  const logoutMutation = useLogout();
  const notificationMenuRef = React.useRef<HTMLDivElement | null>(null);
  const profileMenuRef = React.useRef<HTMLDivElement | null>(null);

  const workspace = useWorkspaceStore();
  const academicContext = useAcademicContext();
  const academicYearsQuery = useAcademicYears({ offset: 0, limit: 50 });
  const academicPeriodsQuery = useAcademicPeriods(
    {
      offset: 0,
      limit: 50,
      academicYearId: workspace.academicYearId ?? undefined,
    },
    { enabled: Boolean(workspace.academicYearId) },
  );

  const hasDefaultWorkspace = React.useRef(false);

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

  React.useEffect(() => {
    if (hasDefaultWorkspace.current) {
      return;
    }

    if (!workspace.academicYearId && academicContext.data?.year?.id) {
      workspace.setAcademicYearId(academicContext.data.year.id);
    }

    if (!workspace.academicPeriodId && academicContext.data?.period?.id) {
      workspace.setAcademicPeriodId(academicContext.data.period.id);
    }

    if (
      workspace.academicYearId ||
      academicContext.data?.year?.id ||
      workspace.academicPeriodId ||
      academicContext.data?.period?.id
    ) {
      hasDefaultWorkspace.current = true;
    }
  }, [
    academicContext.data?.period?.id,
    academicContext.data?.year?.id,
    workspace,
  ]);

  const activeYearLabel = React.useMemo(() => {
    return (
      academicYearsQuery.data?.data.find(
        (year) => year.id === workspace.academicYearId,
      )?.label ?? "Belum dipilih"
    );
  }, [academicYearsQuery.data?.data, workspace.academicYearId]);

  const activePeriodLabel = React.useMemo(() => {
    return (
      academicPeriodsQuery.data?.data.find(
        (period) => period.id === workspace.academicPeriodId,
      )?.name ?? "Belum dipilih"
    );
  }, [academicPeriodsQuery.data?.data, workspace.academicPeriodId]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <aside
        className="fixed inset-y-0 left-0 flex flex-col gap-6 overflow-hidden border-r border-border/40 bg-neutral-100/50 px-4 py-6 text-ink transition-all dark:bg-neutral-800/50"
        style={{ width: collapsed ? collapsedWidth : expandedWidth }}
      >
        <div className="flex gap-3 justify-between items-center">
          {!collapsed ? (
            <Link to={config.homeTo} className="flex items-center">
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
              {config.title}
            </h2>
            <p className="text-xs text-ink-muted">{config.description}</p>
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
                    {item.subItems?.map((subItem, index) => {
                      if (subItem.type === "separator") {
                        return (
                          <div
                            key={`separator-${index}`}
                            className="my-2"
                            role="separator"
                          >
                            <div className="h-px w-full bg-surface-2" />
                            {subItem.label ? (
                              <span className="mt-1 block text-[11px] font-semibold uppercase text-ink-subtle">
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
                      );
                    })}
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
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <section className="relative overflow-hidden rounded-2xl bg-linear-to-r from-primary/15 via-surface-1 to-primary/8 px-5 py-4">
            <div
              className="absolute inset-y-0 left-0 w-1.5 bg-primary"
              aria-hidden="true"
            />
            <div className="flex flex-wrap items-start justify-between gap-4 pl-2">
              <div className="flex flex-1 flex-wrap items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                  <SparklesIcon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="space-y-1 min-w-56">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                    Workspace akademik
                  </p>
                  <p className="text-sm text-ink">
                    Pilih tahun ajaran dan periode untuk mulai mengolah data.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Select
                  value={workspace.academicYearId ?? ""}
                  onValueChange={(value) =>
                    workspace.setAcademicYearId(value || null)
                  }
                >
                  <SelectTrigger className="w-full sm:w-48 bg-surface-contrast/80">
                    <SelectValue placeholder="Tahun ajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    {(academicYearsQuery.data?.data ?? []).map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={workspace.academicPeriodId ?? ""}
                  onValueChange={(value) =>
                    workspace.setAcademicPeriodId(value || null)
                  }
                  disabled={!workspace.academicYearId}
                >
                  <SelectTrigger className="w-full sm:w-48 bg-surface-contrast/80">
                    <SelectValue placeholder="Periode" />
                  </SelectTrigger>
                  <SelectContent>
                    {(academicPeriodsQuery.data?.data ?? []).map((period) => (
                      <SelectItem key={period.id} value={period.id}>
                        {period.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}

export type { AdminStaffNavItem, AdminStaffSubNavItem, SidenavConfig };

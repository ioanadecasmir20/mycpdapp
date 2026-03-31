import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import {
  Trash2,
  LogOut,
  House,
  Plus,
  List,
  SquarePen,
  Download,
  Settings,
  Info,
  Search,
  ArrowUpDown,
  SlidersHorizontal,
  Trophy,
  Share2,
  BookOpen,
  ExternalLink,
  Copy,
  CalendarDays,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import {
  NativePurchases,
  PURCHASE_TYPE,
} from "@capgo/native-purchases";

type CPDRecord = {
  id: string;
  user_id: string;
  activity_title: string;
  cpd_type: string;
  date_completed: string | null;
  hours: number;
  minutes: number;
  provider: string | null;
  learning_method: string | null;
  planned_for_date: string | null;
  expiry_date: string | null;
  renewal_required: boolean;
  sectors: string[] | null;
  description: string | null;
  outcome: string | null;
  evidence_available: boolean;
  certificate_file_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type FormState = {
  activity_title: string;
  cpd_type: string;
  date_completed: string;
  planned_for_date: string;
  expiry_date: string;
  renewal_required: boolean;
  hours: string;
  minutes: string;
  provider: string;
  learning_method: string;
  sectors: string;
  description: string;
  outcome: string;
  evidence_available: boolean;
  status: string;
};

const emptyForm: FormState = {
  activity_title: "",
  cpd_type: "",
  date_completed: "",
  planned_for_date: "",
  expiry_date: "",
  renewal_required: false,
  hours: "1",
  minutes: "0",
  provider: "",
  learning_method: "",
  sectors: "",
  description: "",
  outcome: "",
  evidence_available: false,
  status: "Completed",
};

const cpdTypes = [
  "Course",
  "Webinar",
  "Workshop",
  "Seminar",
  "Reading",
  "Research",
  "Practical Training",
  "Mentoring",
  "Conference",
  "Self-Study",
  "Other",
];

const learningMethods = [
  "Online",
  "In Person",
  "Hybrid",
  "Self-Study",
  "Workplace Learning",
];

const statuses = ["Planned", "In Progress", "Completed"];

const theme = {
  colors: {
    bg: "#f4f7fb",
    bgGradientA: "#eef4ff",
    bgGradientB: "#f8fbff",
    card: "rgba(255,255,255,0.84)",
    cardSolid: "#ffffff",
    text: "#0f172a",
    subtext: "#64748b",
    border: "rgba(148,163,184,0.18)",
    primary: "#2563eb",
    primaryDark: "#1d4ed8",
    primarySoft: "#dbeafe",
    danger: "#dc2626",
    dangerSoft: "#fee2e2",
    success: "#16a34a",
    successSoft: "#dcfce7",
    tabIdle: "#eef2f7",
    shadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
    shadowSoft: "0 10px 24px rgba(15, 23, 42, 0.05)",
  },
  radius: {
    xl: 28,
    lg: 22,
    md: 18,
    sm: 14,
    pill: 999,
  },
  transition: "all 0.22s ease",
};

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100%",
  padding: 16,
  paddingTop: "max(56px, calc(env(safe-area-inset-top) + 12px))",
  paddingBottom: "calc(110px + env(safe-area-inset-bottom))",
  margin: 0,
  color: theme.colors.text,
  background: `linear-gradient(180deg, ${theme.colors.bgGradientA} 0%, ${theme.colors.bgGradientB} 50%, ${theme.colors.bg} 100%)`,
  overflowX: "hidden",
};

const glassCard: CSSProperties = {
  background: theme.colors.card,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.radius.lg,
  boxShadow: theme.colors.shadow,
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
};

const solidCard: CSSProperties = {
  background: theme.colors.cardSolid,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.radius.lg,
  boxShadow: theme.colors.shadowSoft,
};

const sheetHeaderStyle: CSSProperties = {
  padding: "18px 16px 16px",
  borderBottom: `1px solid ${theme.colors.border}`,
  background: "#fff",
  position: "relative",
};

const sheetSectionStyle: CSSProperties = {
  padding: "16px",
  background: "#fff",
  borderBottom: `1px solid ${theme.colors.border}`,
};

const inputStyle: CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  padding: "14px 16px",
  borderRadius: theme.radius.sm,
  border: `1px solid ${theme.colors.border}`,
  outline: "none",
  fontSize: 16,
  background: "#fff",
  color: theme.colors.text,
  transition: theme.transition,
  boxSizing: "border-box",
  display: "block",
  appearance: "none",
};

const primaryButtonStyle: CSSProperties = {
  background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%)`,
  color: "#fff",
  border: "none",
  borderRadius: theme.radius.sm,
  padding: "13px 16px",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 10px 22px rgba(37, 99, 235, 0.28)",
  transition: theme.transition,
};

const secondaryButtonStyle: CSSProperties = {
  background: "#fff",
  color: theme.colors.text,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.radius.sm,
  padding: "13px 16px",
  fontWeight: 700,
  cursor: "pointer",
  transition: theme.transition,
};

const dangerButtonStyle: CSSProperties = {
  background: theme.colors.dangerSoft,
  color: theme.colors.danger,
  border: "none",
  borderRadius: theme.radius.sm,
  padding: "10px 12px",
  fontWeight: 700,
  cursor: "pointer",
  transition: theme.transition,
};

const fieldLabelStyle: CSSProperties = {
  display: "block",
  marginBottom: 8,
  fontSize: 14,
  fontWeight: 700,
  color: theme.colors.text,
};

const fieldWrapStyle: CSSProperties = {
  width: "100%",
  maxWidth: "100%",
};

async function uploadCertificate(file: File, userId: string) {
  const extension = file.name.split(".").pop();
  const filePath = `${userId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${extension}`;

  const { error } = await supabase.storage
    .from("cpd-certificates")
    .upload(filePath, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from("cpd-certificates")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

function formatDateDMYBlank(dateString?: string | null) {
  if (!dateString) return "";

  const d = new Date(dateString);

  if (isNaN(d.getTime())) return String(dateString);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

function downloadCsv(records: CPDRecord[]) {
  const headers = [
    "Activity Title",
    "CPD Type",
    "Date Completed",
    "Planned For",
    "Expiry Date",
    "This activity needs renewal",
    "Hours",
    "Minutes",
    "Provider",
    "Learning Method",
    "Sectors",
    "Outcome",
    "Status",
    "Certificate URL",
  ];

  const rows = records.map((record) => [
    record.activity_title,
    record.cpd_type,
    formatDateDMYBlank(record.date_completed),
    formatDateDMYBlank(record.planned_for_date),
    formatDateDMYBlank(record.expiry_date),
    record.renewal_required ? "Yes" : "No",
    String(record.hours ?? 0),
    String(record.minutes ?? 0),
    record.provider ?? "",
    record.learning_method ?? "",
    Array.isArray(record.sectors) ? record.sectors.join(", ") : "",
    record.outcome ?? "",
    record.status,
    record.certificate_file_url ?? "",
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "cpd-records.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function recordToForm(record: CPDRecord): FormState {
  return {
    activity_title: record.activity_title ?? "",
    cpd_type: record.cpd_type ?? "Course",
    date_completed: record.date_completed ?? "",
    planned_for_date: record.planned_for_date ?? "",
    expiry_date: record.expiry_date ?? "",
    renewal_required: record.renewal_required ?? false,
    hours: String(record.hours ?? 0),
    minutes: String(record.minutes ?? 0),
    provider: record.provider ?? "",
    learning_method: record.learning_method ?? "Online",
    sectors: Array.isArray(record.sectors) ? record.sectors.join(", ") : "",
    description: record.description ?? "",
    outcome: record.outcome ?? "",
    evidence_available: record.evidence_available ?? false,
    status: record.status ?? "Completed",
  };
}

function getStatusChipStyle(status: string): CSSProperties {
  if (status === "Completed") {
    return {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 10px",
      borderRadius: theme.radius.pill,
      background: theme.colors.successSoft,
      color: theme.colors.success,
      fontSize: 12,
      fontWeight: 700,
    };
  }

  if (status === "In Progress") {
    return {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 10px",
      borderRadius: theme.radius.pill,
      background: "#fef3c7",
      color: "#b45309",
      fontSize: 12,
      fontWeight: 700,
    };
  }

  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: theme.radius.pill,
    background: theme.colors.primarySoft,
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: 700,
  };
}

const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.32)",
  zIndex: 4000,
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
};

const modalCardWrapStyle: CSSProperties = {
  width: "100%",
  maxWidth: 720,
  margin: "0 auto",
  padding: "max(56px, calc(env(safe-area-inset-top) + 12px)) 12px calc(120px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
};

const modalCardStyle: CSSProperties = {
  ...glassCard,
  overflow: "hidden",
};

const publicShareBaseUrl = "https://mycpdapp.com/share";
const PREMIUM_PRODUCT_ID = "com.mycpdapp.premium.yearly";

function getRecordMinutes(record: CPDRecord | any) {
  return (Number(record.hours) || 0) * 60 + (Number(record.minutes) || 0);
}

function formatMinutesToHoursMins(totalMinutes: number) {
  const safeMinutes = Math.max(0, Number(totalMinutes) || 0);
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr${hours === 1 ? "" : "s"}`;
  return `${hours} hr${hours === 1 ? "" : "s"} ${minutes} min`;
}

function getRecordRelevantDate(record: CPDRecord | any) {
  return (
    record.date_completed ||
    record.planned_for_date ||
    record.created_at ||
    null
  );
}

function getSharedViewPeriod(records: CPDRecord[] = [], sharedViewData?: any | null) {
  if (!records.length) {
    return {
      from: sharedViewData?.filter_date_from || "",
      to: sharedViewData?.filter_date_to || "",
    };
  }

  const allDates = records
    .map((record) => getRecordRelevantDate(record))
    .filter(Boolean)
    .sort((a, b) => new Date(a as string).getTime() - new Date(b as string).getTime());

  const firstRecordDate = allDates[0] || "";
  const lastRecordDate = allDates[allDates.length - 1] || "";

  return {
    from: sharedViewData?.filter_date_from || firstRecordDate,
    to: sharedViewData?.filter_date_to || lastRecordDate,
  };
}

function buildActiveSharedFilters(view: any, records: CPDRecord[] = []) {
  if (!view) return [];

  const filters: string[] = [];

  if (view.search_query) filters.push(`Search: ${view.search_query}`);
  if (view.filter_status && view.filter_status !== "all") {
    filters.push(`Status: ${view.filter_status}`);
  }
  if (view.filter_type && view.filter_type !== "all") {
    filters.push(`Type: ${view.filter_type}`);
  }
  if (view.filter_evidence && view.filter_evidence !== "all") {
    filters.push(`Evidence: ${view.filter_evidence === "yes" ? "Yes" : "No"}`);
  }
  if (view.filter_learning_method && view.filter_learning_method !== "all") {
    filters.push(`Method: ${view.filter_learning_method}`);
  }
  if (view.filter_certificate && view.filter_certificate !== "all") {
    filters.push(`Certificate: ${view.filter_certificate === "yes" ? "Yes" : "No"}`);
  }
  if (view.filter_provider) filters.push(`Provider: ${view.filter_provider}`);
  if (view.filter_sectors) filters.push(`Sectors: ${view.filter_sectors}`);
  if (view.filter_min_minutes) filters.push(`Min duration: ${formatMinutesToHoursMins(Number(view.filter_min_minutes))}`);
  if (view.filter_max_minutes) filters.push(`Max duration: ${formatMinutesToHoursMins(Number(view.filter_max_minutes))}`);

  const period = getSharedViewPeriod(records, view);
  if (period.from || period.to) {
    filters.push(
      `Period: ${period.from ? formatDateDMYBlank(period.from) : "Any"} - ${period.to ? formatDateDMYBlank(period.to) : "Any"}`
    );
  }

  return filters;
}

function hasValue(value: any) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [forename, setForename] = useState("");
  const [surname, setSurname] = useState("");
  const [mainJobRole, setMainJobRole] = useState("");
  const [secondaryJobRole, setSecondaryJobRole] = useState("");

  const [records, setRecords] = useState<CPDRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [savingRecord, setSavingRecord] = useState(false);
  const [recordMessage, setRecordMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    "dashboard" | "records" | "goals" | "share" | "articles" | "settings"
  >("dashboard");

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "member" | "premium_member">("member");

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterEvidence, setFilterEvidence] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState<CPDRecord | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showSortPopup, setShowSortPopup] = useState(false);
  const [showFilterPopup, setShowFilterPopup] = useState(false);

  const [goals, setGoals] = useState<any[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(false);

  const [goalTitle, setGoalTitle] = useState("");
  const [goalHours, setGoalHours] = useState("");
  const [goalFrom, setGoalFrom] = useState("");
  const [goalTo, setGoalTo] = useState("");
  const [goalSectors, setGoalSectors] = useState("");

  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  const activeGoals = useMemo(() => getActiveGoals(), [goals]);
  const closestGoal = useMemo(() => getClosestGoalDeadline(), [goals]);
  const plannedRecords = useMemo(() => {
    return records
      .filter((record) => record.status === "Planned")
      .sort((a, b) => {
        const aTime = new Date(a.planned_for_date || a.created_at).getTime();
        const bTime = new Date(b.planned_for_date || b.created_at).getTime();
        return aTime - bTime;
      });
  }, [records]);
  const plannedByDate = useMemo(() => {
    const map: Record<string, CPDRecord[]> = {};

    plannedRecords.forEach((record) => {
      if (!record.planned_for_date) return;

      if (!map[record.planned_for_date]) {
        map[record.planned_for_date] = [];
      }

      map[record.planned_for_date].push(record);
    });

    return map;
  }, [plannedRecords]);

  const [renewalCheckDone, setRenewalCheckDone] = useState(false);

  const [importRows, setImportRows] = useState<any[]>([]);
  const [importMessage, setImportMessage] = useState("");
  const [importingRows, setImportingRows] = useState(false);

  const [sharedViews, setSharedViews] = useState<any[]>([]);
  const [sharedViewsLoading, setSharedViewsLoading] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [shareTitle, setShareTitle] = useState("");

  const [publicSharedView, setPublicSharedView] = useState<any | null>(null);
  const [publicSharedRecords, setPublicSharedRecords] = useState<CPDRecord[]>([]);
  const [publicShareLoading, setPublicShareLoading] = useState(false);
  const [publicShareError, setPublicShareError] = useState("");

  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterMinMinutes, setFilterMinMinutes] = useState("");
  const [filterMaxMinutes, setFilterMaxMinutes] = useState("");
  const [filterProvider, setFilterProvider] = useState("");
  const [filterLearningMethod, setFilterLearningMethod] = useState("all");
  const [filterCertificate, setFilterCertificate] = useState("all");
  const [filterSectors, setFilterSectors] = useState("");

  const [showAddPage, setShowAddPage] = useState(false);
  const [addPageTab, setAddPageTab] = useState<"single" | "bulk">("single");

  const [articlePreviewMode, setArticlePreviewMode] = useState(false);
  const [showAddArticlePage, setShowAddArticlePage] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const isAdmin = userRole === "admin";
  const showMemberArticleView = !isAdmin || articlePreviewMode;

  const [articles, setArticles] = useState<any[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);

  const [articleTitle, setArticleTitle] = useState("");
  const [articleSummary, setArticleSummary] = useState("");
  const [articleContent, setArticleContent] = useState("");
  const [articlePublished, setArticlePublished] = useState(true);
  const [articleMessage, setArticleMessage] = useState("");

  const [articleImageFile, setArticleImageFile] = useState<File | null>(null);

  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const calendarCells = useMemo(() => getMonthDays(calendarMonth), [calendarMonth]);
  const selectedDayPlannedRecords = useMemo(() => {
    if (!selectedCalendarDate) return [];
    return plannedByDate[selectedCalendarDate] || [];
  }, [plannedByDate, selectedCalendarDate]);

  const [showDashboardCalendar, setShowDashboardCalendar] = useState(false);
  const defaultArticleImage =
    "https://cdldqmehwdrebusdmpuz.supabase.co/storage/v1/object/public/article-images/default.jpg";

  const [articleSearchQuery, setArticleSearchQuery] = useState("");
  const [articleSortBy, setArticleSortBy] = useState("newest");
  const [showArticleSearch, setShowArticleSearch] = useState(false);
  const [showArticleSort, setShowArticleSort] = useState(false);

  const path = window.location.pathname;
  const isSharedRoute = path.startsWith("/share/");
  const shareToken = isSharedRoute ? path.split("/share/")[1] : null;

  const [sharedViewLoading, setSharedViewLoading] = useState(false);
  const [sharedViewError, setSharedViewError] = useState("");
  const [sharedViewData, setSharedViewData] = useState<any | null>(null);
  const [sharedViewRecords, setSharedViewRecords] = useState<any[]>([]);

  const hasPremiumAccess = userRole === "admin" || userRole === "premium_member";

  const activeGoalCount = goals.filter((g) => !g.completed).length;
  const shareLinkCount = sharedViews.length;

  const canCreateGoal = hasPremiumAccess || activeGoalCount < 1;
  const canCreateRecord = hasPremiumAccess || records.length < 50;
  const canDownloadPdf = hasPremiumAccess;
  const canUseBulkUpload = hasPremiumAccess;
  const canReadArticles = hasPremiumAccess;
  const canCreateShareLink = hasPremiumAccess || shareLinkCount < 1;

  const [showPremiumPopup, setShowPremiumPopup] = useState(false);
  const [premiumReason, setPremiumReason] = useState("");

  const hasUsedFreeGoal = activeGoalCount >= 1;
  const hasUsedFreeShare = shareLinkCount >= 1;

  const premiumBadgeStyle: CSSProperties = {
    marginLeft: 2,
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    background: "#fef3c7",
    color: "#92400e",
    border: "1px solid #fcd34d",
    lineHeight: 1.2,
  };

  const [premiumProduct, setPremiumProduct] = useState<any | null>(null);
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState("");

  const [profileLoaded, setProfileLoaded] = useState(false);

  function requirePremium(reason: string) {
    setPremiumReason(reason);
    setShowPremiumPopup(true);
  }

  async function updateProfileRole(role: "member" | "premium_member") {
    if (!session?.user?.id) return;

    const { data: currentProfile, error: currentProfileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (currentProfileError) {
      console.error("Failed to read current role:", currentProfileError);
      return;
    }

    if (currentProfile?.role === "admin") {
      setUserRole("admin");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", session.user.id);

    if (error) {
      console.error("Failed to update role:", error);
      return;
    }

    setUserRole(role);
  }

  async function loadPremiumProduct() {
    try {
      const { products } = await NativePurchases.getProducts({
        productIdentifiers: [PREMIUM_PRODUCT_ID],
        productType: PURCHASE_TYPE.SUBS,
      });

      setPremiumProduct(products?.[0] ?? null);
    } catch (error) {
      console.error("Failed to load premium product:", error);
      setPremiumProduct(null);
    }
  }

  async function syncPremiumRoleFromStore() {
    if (!session?.user?.id) return;
    if (!profileLoaded) return;
    if (Capacitor.getPlatform() !== "ios") return;

    // Never touch admin accounts
    if (userRole === "admin") return;

    // Only sync/downgrade accounts that are already premium
    // New/free users should keep their DB role unless they buy or restore
    if (userRole !== "premium_member") return;

    try {
      const { purchases } = await NativePurchases.getPurchases({
        productType: PURCHASE_TYPE.SUBS,
      });

      const premiumPurchase = (purchases || []).find((purchase: any) => {
        if (purchase.productIdentifier !== PREMIUM_PRODUCT_ID) return false;
        if (purchase.isActive === false) return false;

        if (purchase.expirationDate) {
          const expiry = new Date(purchase.expirationDate);
          if (expiry <= new Date()) return false;
        }

        return true;
      });

      if (premiumPurchase) {
        await updateProfileRole("premium_member");
      } else {
        await updateProfileRole("member");
      }
    } catch (error) {
      console.error("Failed to sync premium role:", error);
    }
  }

  async function syncPremiumRoleFromStoreAfterPurchase() {
    if (!session?.user?.id) return;
    if (!profileLoaded) return;
    if (Capacitor.getPlatform() !== "ios") return;

    try {
      const { purchases } = await NativePurchases.getPurchases({
        productType: PURCHASE_TYPE.SUBS,
      });

      const premiumPurchase = (purchases || []).find((purchase: any) => {
        if (purchase.productIdentifier !== PREMIUM_PRODUCT_ID) return false;
        if (purchase.isActive === false) return false;

        if (purchase.expirationDate) {
          const expiry = new Date(purchase.expirationDate);
          if (expiry <= new Date()) return false;
        }

        return true;
      });

      if (premiumPurchase) {
        await updateProfileRole("premium_member");
        await fetchProfile(session.user.id);
      }
    } catch (error) {
      console.error("Failed to sync premium role after purchase:", error);
    }
  }

  async function handleUpgradeToPremium() {
    if (!session?.user?.id) return;

    setPurchaseBusy(true);
    setPurchaseMessage("");

    try {
      setShowPremiumPopup(false);

      await NativePurchases.purchaseProduct({
        productIdentifier: PREMIUM_PRODUCT_ID,
        productType: PURCHASE_TYPE.SUBS,
      });

      await new Promise((resolve) => setTimeout(resolve, 1200));

      await syncPremiumRoleFromStoreAfterPurchase();

      const { data: updatedProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (updatedProfile?.role === "premium_member") {
        setPurchaseMessage("Premium activated successfully.");
      } else {
        setPurchaseMessage("Purchase completed, syncing premium access...");
      }
    } catch (error: any) {
      console.error("Purchase failed:", error);
      setPurchaseMessage(error?.message || "Purchase failed.");
    } finally {
      setPurchaseBusy(false);
    }
  }

  async function handleRestorePurchases() {
    if (!session?.user?.id) return;

    setPurchaseBusy(true);
    setPurchaseMessage("");

    try {
      await NativePurchases.restorePurchases();
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await syncPremiumRoleFromStoreAfterPurchase();
      setPurchaseMessage("Purchases restored.");
    } catch (error: any) {
      console.error("Restore failed:", error);
      setPurchaseMessage(error?.message || "Restore failed.");
    } finally {
      setPurchaseBusy(false);
    }
  }

  function renderSharedField(label: string, value: React.ReactNode) {
    if (!hasValue(value)) return null;

    return (
      <div>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontWeight: 600 }}>{value}</div>
      </div>
    );
  }

  async function fetchPublicSharedView(token: string) {
    setSharedViewLoading(true);
    setSharedViewError("");
    setSharedViewData(null);
    setSharedViewRecords([]);

    try {
      const { data: view, error: viewError } = await supabase
        .from("shared_views")
        .select("*")
        .eq("share_token", token)
        .single();

      if (viewError || !view) {
        throw new Error("Shared view not found.");
      }

      let profileData: { forename?: string | null; surname?: string | null } | null = null;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("forename, surname")
        .eq("id", view.user_id)
        .single();

      if (!profileError && profile) {
        profileData = profile;
      }

      let query = supabase
        .from("cpd_records")
        .select("*")
        .eq("user_id", view.user_id);

      if (view.filter_status && view.filter_status !== "all") {
        query = query.eq("status", view.filter_status);
      }

      if (view.filter_type && view.filter_type !== "all") {
        query = query.eq("cpd_type", view.filter_type);
      }

      if (view.filter_evidence && view.filter_evidence !== "all") {
        query =
          view.filter_evidence === "yes"
            ? query.eq("evidence_available", true)
            : query.eq("evidence_available", false);
      }

      if (view.filter_learning_method && view.filter_learning_method !== "all") {
        query = query.eq("learning_method", view.filter_learning_method);
      }

      if (view.filter_certificate && view.filter_certificate !== "all") {
        query =
          view.filter_certificate === "yes"
            ? query.not("certificate_file_url", "is", null)
            : query.is("certificate_file_url", null);
      }

      if (view.filter_date_from) {
        query = query.gte("date_completed", view.filter_date_from);
      }

      if (view.filter_date_to) {
        query = query.lte("date_completed", view.filter_date_to);
      }

      if (view.filter_provider) {
        query = query.ilike("provider", `%${view.filter_provider}%`);
      }

      if (view.sort_by === "oldest") {
        query = query.order("date_completed", { ascending: true, nullsFirst: false });
      } else if (view.sort_by === "hoursHigh") {
        query = query.order("hours", { ascending: false }).order("minutes", { ascending: false });
      } else if (view.sort_by === "hoursLow") {
        query = query.order("hours", { ascending: true }).order("minutes", { ascending: true });
      } else if (view.sort_by === "titleAZ") {
        query = query.order("activity_title", { ascending: true });
      } else if (view.sort_by === "titleZA") {
        query = query.order("activity_title", { ascending: false });
      } else {
        query = query.order("date_completed", { ascending: false, nullsFirst: false });
      }

      const { data: records, error: recordsError } = await query;

      if (recordsError) {
        throw recordsError;
      }

      let filtered = records || [];

      if (view.search_query) {
        const q = String(view.search_query).toLowerCase();
        filtered = filtered.filter((record) =>
          [
            record.activity_title,
            record.cpd_type,
            record.provider,
            record.learning_method,
            record.description,
            record.outcome,
            ...(Array.isArray(record.sectors) ? record.sectors : []),
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(q))
        );
      }

      if (view.filter_min_minutes) {
        const min = Number(view.filter_min_minutes);
        filtered = filtered.filter((record) => getRecordMinutes(record) >= min);
      }

      if (view.filter_max_minutes) {
        const max = Number(view.filter_max_minutes);
        filtered = filtered.filter((record) => getRecordMinutes(record) <= max);
      }

      if (view.filter_sectors) {
        const wanted = String(view.filter_sectors)
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);

        if (wanted.length) {
          filtered = filtered.filter((record) => {
            const recordSectors = Array.isArray(record.sectors)
              ? record.sectors.map((s: string) => s.toLowerCase())
              : [];
            return wanted.some((sector) => recordSectors.includes(sector));
          });
        }
      }

      const totalMinutes = filtered.reduce((sum, record) => sum + getRecordMinutes(record), 0);
      const period = getSharedViewPeriod(filtered, view);
      const activeFilters = buildActiveSharedFilters(view, filtered);

      setSharedViewData({
        ...view,
        forename: profileData?.forename || "",
        surname: profileData?.surname || "",
        totalMinutes,
        totalHoursLabel: formatMinutesToHoursMins(totalMinutes),
        periodFrom: period.from,
        periodTo: period.to,
        activeFilters,
      });

      setSharedViewRecords(filtered);
    } catch (error: any) {
      setSharedViewError(error.message || "Failed to load shared view.");
    } finally {
      setSharedViewLoading(false);
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      setActiveTab("dashboard");
      setShowAddPage(false);
      setShowAddArticlePage(false);
      setSelectedRecord(null);
      setSelectedArticle(null);
    } else {
      setActiveTab("dashboard");
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) return;
    if (!profileLoaded) return;
    if (Capacitor.getPlatform() !== "ios") return;

    loadPremiumProduct();

    if (userRole === "premium_member") {
      syncPremiumRoleFromStore();
    }
  }, [session?.user?.id, profileLoaded, userRole]);

  useEffect(() => {
    const listener = CapacitorApp.addListener("appStateChange", async ({ isActive }) => {
      if (isActive && session?.user?.id && Capacitor.getPlatform() === "ios") {
        await syncPremiumRoleFromStore();
        await fetchProfile(session.user.id);
      }
    });

    return () => {
      listener.then((l) => l.remove());
    };
  }, [session?.user?.id, userRole]);

  useEffect(() => {
    if (isSharedRoute && shareToken) {
      fetchPublicSharedView(shareToken);
    }
  }, [isSharedRoute, shareToken]);

  if (isSharedRoute) {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: 24,
          background: "#f8fafc",
          color: "#0f172a",
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            background: "#fff",
            borderRadius: 20,
            padding: 24,
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          }}
        >
          {sharedViewLoading ? (
            <div>Loading shared view...</div>
          ) : sharedViewError ? (
            <div style={{ color: "#dc2626", fontWeight: 700 }}>
              {sharedViewError}
            </div>
          ) : (
            <>
              <h1 style={{ marginTop: 0, marginBottom: 8 }}>
                {sharedViewData?.title || "Shared CPD View"}
              </h1>

              <p style={{ color: "#64748b", marginTop: 0, marginBottom: 6 }}>
                Live shared CPD record
              </p>

              {!!`${sharedViewData?.forename || ""}${sharedViewData?.surname || ""}`.trim() && (
                <p
                  style={{
                    marginTop: 0,
                    marginBottom: 16,
                    color: "#0f172a",
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                >
                  {sharedViewData?.forename} {sharedViewData?.surname}
                </p>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 12,
                  marginTop: 20,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 14,
                    padding: 14,
                    background: "#f8fafc",
                  }}
                >
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>
                    Records
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>
                    {sharedViewRecords.length}
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 14,
                    padding: 14,
                    background: "#f8fafc",
                  }}
                >
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>
                    Total hours
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>
                    {sharedViewData?.totalHoursLabel || "0 min"}
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 14,
                    padding: 14,
                    background: "#f8fafc",
                  }}
                >
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>
                    Period
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}>
                    {sharedViewData?.periodFrom
                      ? formatDateDMYBlank(sharedViewData.periodFrom)
                      : "—"}{" "}
                    -{" "}
                    {sharedViewData?.periodTo
                      ? formatDateDMYBlank(sharedViewData.periodTo)
                      : "—"}
                  </div>
                </div>
              </div>

              {Array.isArray(sharedViewData?.activeFilters) &&
                sharedViewData.activeFilters.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        marginBottom: 10,
                        color: "#334155",
                      }}
                    >
                      Active filters
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {sharedViewData.activeFilters.map((filterLabel: string, index: number) => (
                        <span
                          key={`${filterLabel}-${index}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "8px 12px",
                            borderRadius: 999,
                            background: "#eff6ff",
                            color: "#1d4ed8",
                            fontSize: 13,
                            fontWeight: 700,
                            border: "1px solid #bfdbfe",
                          }}
                        >
                          {filterLabel}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {sharedViewRecords.length === 0 ? (
                <div
                  style={{
                    marginTop: 20,
                    padding: 16,
                    border: "1px dashed #cbd5e1",
                    borderRadius: 12,
                    color: "#64748b",
                  }}
                >
                  No records available in this shared view.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 16 }}>
                  {sharedViewRecords.map((record) => (
                    <div
                      key={record.id}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 18,
                        padding: 18,
                        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 12,
                          flexWrap: "wrap",
                          marginBottom: 14,
                        }}
                      >
                        <div>
                          <h3 style={{ margin: 0, fontSize: 20, color: "#0f172a" }}>
                            {record.activity_title || "Untitled activity"}
                          </h3>

                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 8,
                              marginTop: 10,
                            }}
                          >
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "6px 10px",
                                borderRadius: 999,
                                background: "#eff6ff",
                                color: "#1d4ed8",
                                fontSize: 12,
                                fontWeight: 700,
                                border: "1px solid #bfdbfe",
                              }}
                            >
                              {record.cpd_type || "Not set"}
                            </span>

                            <span style={getStatusChipStyle(record.status || "Planned")}>
                              {record.status || "Planned"}
                            </span>
                          </div>
                        </div>

                        <div
                          style={{
                            minWidth: 120,
                            textAlign: "right",
                          }}
                        >
                          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>
                            Duration
                          </div>
                          <div style={{ fontWeight: 800, fontSize: 18, color: "#0f172a" }}>
                            {formatMinutesToHoursMins(
                              (Number(record.hours) || 0) * 60 + (Number(record.minutes) || 0)
                            )}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                          gap: 12,
                          marginBottom: 16,
                        }}
                      >

                        {renderSharedField("Date completed", formatDateDMYBlank(record.date_completed))}

                        {renderSharedField("Planned for", formatDateDMYBlank(record.planned_for_date))}

                        {renderSharedField("Expiry date", formatDateDMYBlank(record.expiry_date))}

                        {record.renewal_required &&
                          renderSharedField("Renewal required", "Yes")}

                        {renderSharedField("Provider", record.provider || "—")}

                        {renderSharedField("Learning method", record.learning_method || "—")}

                        {renderSharedField("Sectors", Array.isArray(record.sectors) && record.sectors.length
                          ? record.sectors.join(", ")
                          : "—")}

                        {record.evidence_available &&
                          renderSharedField("Evidence available", "Yes")}

                        {renderSharedField("Created", formatDateDMYBlank(record.created_at))}

                        {renderSharedField("Updated", formatDateDMYBlank(record.updated_at))}

                      </div>

                      <div style={{ display: "grid", gap: 14 }}>
                        {hasValue(record.description) && (
                          <div>
                            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                              Description
                            </div>
                            <div
                              style={{
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                borderRadius: 14,
                                padding: 12,
                                whiteSpace: "pre-wrap",
                                lineHeight: 1.5,
                                color: "#0f172a",
                              }}
                            >
                              {record.description}
                            </div>
                          </div>
                        )}

                        {hasValue(record.description) && (
                          <div>
                            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                              Outcome
                            </div>
                            <div
                              style={{
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                borderRadius: 14,
                                padding: 12,
                                whiteSpace: "pre-wrap",
                                lineHeight: 1.5,
                                color: "#0f172a",
                              }}
                            >
                              {record.outcome || "—"}
                            </div>
                          </div>
                        )}

                        <div>
                          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                            Certificate / file
                          </div>
                          {record.certificate_file_url ? (
                            <a
                              href={record.certificate_file_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                                color: "#2563eb",
                                fontWeight: 700,
                                textDecoration: "none",
                              }}
                            >
                              Open certificate
                            </a>
                          ) : (
                            <div style={{ color: "#0f172a" }}>—</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  const filteredArticles = useMemo(() => {
    let result = [...articles];

    if (articleSearchQuery.trim()) {
      const q = articleSearchQuery.toLowerCase();
      result = result.filter((article) =>
        [article.title, article.summary, article.content]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (articleSortBy === "oldest") {
        return (
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
        );
      }

      if (articleSortBy === "titleAZ") {
        return String(a.title || "").localeCompare(String(b.title || ""));
      }

      if (articleSortBy === "titleZA") {
        return String(b.title || "").localeCompare(String(a.title || ""));
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });

    return result;
  }, [articles, articleSearchQuery, articleSortBy]);

  useEffect(() => {
    if (!selectedCalendarDate && plannedRecords.length > 0) {
      const firstPlanned = plannedRecords.find((record) => record.planned_for_date);
      if (firstPlanned?.planned_for_date) {
        setSelectedCalendarDate(firstPlanned.planned_for_date);
      }
    }
  }, [plannedRecords, selectedCalendarDate]);

  useEffect(() => {
    if (activeTab !== "articles") {
      setSelectedArticle(null);
      setShowAddArticlePage(false);
      setArticlePreviewMode(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!authMessage) return;
    const timer = setTimeout(() => setAuthMessage(""), 5000);
    return () => clearTimeout(timer);
  }, [authMessage]);

  useEffect(() => {
    if (!recordMessage) return;
    const timer = setTimeout(() => setRecordMessage(""), 5000);
    return () => clearTimeout(timer);
  }, [recordMessage]);

  useEffect(() => {
    if (!settingsMessage) return;
    const timer = setTimeout(() => setSettingsMessage(""), 5000);
    return () => clearTimeout(timer);
  }, [settingsMessage]);

  useEffect(() => {
    if (!shareMessage) return;
    const timer = setTimeout(() => setShareMessage(""), 5000);
    return () => clearTimeout(timer);
  }, [shareMessage]);

  useEffect(() => {
    if (!importMessage) return;
    const timer = setTimeout(() => setImportMessage(""), 5000);
    return () => clearTimeout(timer);
  }, [importMessage]);

  useEffect(() => {
    if (!articleMessage) return;
    const timer = setTimeout(() => setArticleMessage(""), 5000);
    return () => clearTimeout(timer);
  }, [articleMessage]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      setRenewalCheckDone(false);
      fetchRecords(session.user.id);
      fetchGoals(session.user.id);
      fetchProfile(session.user.id);
      fetchSharedViews(session.user.id);
    } else {
      setRecords([]);
      setGoals([]);
      setSharedViews([]);
      setForename("");
      setSurname("");
      setMainJobRole("");
      setSecondaryJobRole("");
      setRenewalCheckDone(false);
      setUserRole("member");
      setArticles([]);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchArticles();
    } else {
      setArticles([]);
    }
  }, [session?.user?.id, userRole, articlePreviewMode]);

  useEffect(() => {
    if (!session?.user?.id) return;
    if (renewalCheckDone) return;
    if (recordsLoading) return;

    checkAndCreateRenewalRecords(session.user.id).then(async () => {
      await fetchRecords(session.user.id);
      setRenewalCheckDone(true);
    });
  }, [session?.user?.id, recordsLoading, renewalCheckDone]);

  useEffect(() => {
    if (session?.user?.email) {
      setNewEmail(session.user.email);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    fetchArticles();
  }, [userRole, articlePreviewMode]);

  function parseYMDToLocalDate(value?: string | null) {
    if (!value) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split("-").map(Number);
      return new Date(year, month - 1, day);
    }

    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  function formatCalendarMonth(date: Date) {
    return date.toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });
  }

  function getMonthDays(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startWeekday = (firstDay.getDay() + 6) % 7; // Monday first
    const totalDays = lastDay.getDate();

    const cells: Array<{ date: Date | null; key: string }> = [];

    for (let i = 0; i < startWeekday; i++) {
      cells.push({ date: null, key: `empty-start-${i}` });
    }

    for (let day = 1; day <= totalDays; day++) {
      const cellDate = new Date(year, month, day);
      cells.push({
        date: cellDate,
        key: `day-${toLocalYMD(cellDate)}`,
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push({ date: null, key: `empty-end-${cells.length}` });
    }

    return cells;
  }

  function toLocalYMD(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function resetArticleForm() {
    setEditingArticleId(null);
    setArticleTitle("");
    setArticleSummary("");
    setArticleContent("");
    setArticlePublished(true);
    setArticleImageFile(null);
    setArticleMessage("");
  }

  function startEditArticle(article: any) {
    setEditingArticleId(article.id);
    setArticleTitle(article.title || "");
    setArticleSummary(article.summary || "");
    setArticleContent(article.content || "");
    setArticlePublished(article.is_published ?? true);
    setArticleImageFile(null);
    setArticleMessage("");
    setShowAddArticlePage(true);
  }

  async function handleForgotPassword() {
    setAuthMessage("");

    if (!email) {
      setAuthMessage("Enter your email address first.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });

    if (error) {
      setAuthMessage(error.message || "Failed to send reset email.");
    } else {
      setAuthMessage("Password reset email sent.");
    }
  }

  async function uploadArticleImage(file: File, userId: string) {
    const extension = file.name.split(".").pop();
    const filePath = `${userId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`;

    const { error } = await supabase.storage
      .from("article-images")
      .upload(filePath, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from("article-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function handleSaveArticle(e: FormEvent) {
    e.preventDefault();
    if (!isAdmin || !session?.user?.id) return;

    setArticleMessage("");

    try {
      let imageUrl: string | null = null;

      if (articleImageFile) {
        imageUrl = await uploadArticleImage(articleImageFile, session.user.id);
      }

      const payload = {
        title: articleTitle,
        summary: articleSummary || null,
        content: articleContent || null,
        is_published: articlePublished,
        created_by: session.user.id,
        updated_at: new Date().toISOString(),
        ...(imageUrl ? { image_url: imageUrl } : {}),
      };

      if (editingArticleId) {
        const { error } = await supabase
          .from("articles")
          .update(payload)
          .eq("id", editingArticleId);

        if (error) throw error;

        setArticleMessage("Article updated successfully.");
      } else {
        const { error } = await supabase
          .from("articles")
          .insert([payload]);

        if (error) throw error;

        setArticleMessage("Article added successfully.");
      }

      await fetchArticles();
      resetArticleForm();
      setArticleImageFile(null);
      setShowAddArticlePage(false);
    } catch (error: any) {
      console.error("handleSaveArticle error", error);
      setArticleMessage(error.message || "Failed to save article.");
    }
  }



  async function handleDeleteArticle(id: string) {
    if (!isAdmin) return;

    const ok = window.confirm("Delete this article?");
    if (!ok) return;

    const { error } = await supabase
      .from("articles")
      .delete()
      .eq("id", id);

    if (!error) {
      await fetchArticles();
    }
  }

  const totalMinutes = useMemo(() => {
    return records.reduce(
      (sum, record) => sum + (record.hours || 0) * 60 + (record.minutes || 0),
      0
    );
  }, [records]);

  const totalHoursDisplay = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60
    }m`;

  const filteredRecords = useMemo(() => {
    let result = [...records];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((record) =>
        [
          record.activity_title,
          record.provider,
          record.outcome,
          record.description,
          record.cpd_type,
          record.sectors?.join(", "),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q))
      );
    }

    if (filterStatus !== "all") {
      result = result.filter((record) => record.status === filterStatus);
    }

    if (filterType !== "all") {
      result = result.filter((record) => record.cpd_type === filterType);
    }

    if (filterEvidence !== "all") {
      result = result.filter((record) =>
        filterEvidence === "yes"
          ? record.evidence_available
          : !record.evidence_available
      );
    }

    result = result.filter((record) => {
      const effectiveDate =
        record.status === "Planned"
          ? record.planned_for_date
          : record.date_completed;

      if (filterDateFrom && (!effectiveDate || effectiveDate < filterDateFrom)) {
        return false;
      }

      if (filterDateTo && (!effectiveDate || effectiveDate > filterDateTo)) {
        return false;
      }

      const totalMinutes = (record.hours || 0) * 60 + (record.minutes || 0);

      if (filterMinMinutes && totalMinutes < Number(filterMinMinutes)) {
        return false;
      }

      if (filterMaxMinutes && totalMinutes > Number(filterMaxMinutes)) {
        return false;
      }

      if (
        filterProvider.trim() &&
        !(record.provider || "")
          .toLowerCase()
          .includes(filterProvider.toLowerCase())
      ) {
        return false;
      }

      if (
        filterLearningMethod !== "all" &&
        record.learning_method !== filterLearningMethod
      ) {
        return false;
      }

      if (filterCertificate !== "all") {
        const hasCertificate = !!record.certificate_file_url;
        if (filterCertificate === "yes" && !hasCertificate) return false;
        if (filterCertificate === "no" && hasCertificate) return false;
      }

      if (filterSectors.trim()) {
        const wanted = filterSectors
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);

        const recordSectors = (record.sectors || []).map((s) => s.toLowerCase());

        const hasSectorMatch = wanted.some((sector) =>
          recordSectors.includes(sector)
        );

        if (!hasSectorMatch) return false;
      }

      return true;
    });

    result.sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.date_completed || b.created_at).getTime() -
          new Date(a.date_completed || a.created_at).getTime()
        );
      }

      if (sortBy === "oldest") {
        return (
          new Date(a.date_completed || a.created_at).getTime() -
          new Date(b.date_completed || b.created_at).getTime()
        );
      }

      if (sortBy === "hoursHigh") {
        return b.hours * 60 + b.minutes - (a.hours * 60 + a.minutes);
      }

      if (sortBy === "hoursLow") {
        return a.hours * 60 + a.minutes - (b.hours * 60 + b.minutes);
      }

      if (sortBy === "titleAZ") {
        return a.activity_title.localeCompare(b.activity_title);
      }

      if (sortBy === "titleZA") {
        return b.activity_title.localeCompare(a.activity_title);
      }

      return 0;
    });

    return result;
  }, [
    records,
    searchQuery,
    sortBy,
    filterStatus,
    filterType,
    filterEvidence,
    filterDateFrom,
    filterDateTo,
    filterMinMinutes,
    filterMaxMinutes,
    filterProvider,
    filterLearningMethod,
    filterCertificate,
    filterSectors,
  ]);

  function toggleSelected(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  }

  function formatDateDMYBlank(dateString?: string | null) {
    if (!dateString) return "";
    const d = parseYMDToLocalDate(dateString);
    if (!d) return String(dateString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  async function fetchProfile(userId: string) {
    setProfileLoaded(false);

    const { data, error } = await supabase
      .from("profiles")
      .select("forename, surname, main_job_role, secondary_job_role, role")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setForename(data.forename ?? "");
      setSurname(data.surname ?? "");
      setMainJobRole(data.main_job_role ?? "");
      setSecondaryJobRole(data.secondary_job_role ?? "");
      setUserRole((data.role as "admin" | "member" | "premium_member") || "member");
    }

    setProfileLoaded(true);
  }

  async function fetchArticles() {
    setArticlesLoading(true);

    try {
      let query = supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });

      const shouldShowPublishedOnly = !isAdmin || articlePreviewMode;

      if (shouldShowPublishedOnly) {
        query = query.eq("is_published", true);
      }

      const { data, error } = await query;

      if (error) {
        console.error("fetchArticles error", error);
        setArticles([]);
      } else {
        setArticles(data || []);
      }
    } catch (err) {
      console.error("fetchArticles unexpected error", err);
      setArticles([]);
    } finally {
      setArticlesLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;

    const confirmed = window.confirm(
      `Delete ${selectedIds.length} selected record(s)?`
    );
    if (!confirmed || !session?.user?.id) return;

    const { error } = await supabase
      .from("cpd_records")
      .delete()
      .in("id", selectedIds)
      .eq("user_id", session.user.id);

    if (!error) {
      setSelectedIds([]);
      await fetchRecords(session.user.id);
    }
  }

  function handleStatusChange(value: string) {
    if (value === "Planned") {
      setForm({
        ...form,
        status: value,
        date_completed: "",
      });
      return;
    }

    if (value === "Completed") {
      setForm({
        ...form,
        status: value,
        planned_for_date: "",
      });
      return;
    }

    setForm({
      ...form,
      status: value,
    });
  }

  function downloadPdf(recordsToExport: CPDRecord[]) {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const exportDate = formatDateDMYBlank(new Date().toISOString());

    const fullName =
      [forename, surname].filter(Boolean).join(" ").trim() || "Not provided";

    const mainRole = mainJobRole || "Not provided";
    const secondaryRole = secondaryJobRole || "Not provided";

    const totalMinutes = recordsToExport.reduce(
      (sum, record) => sum + (record.hours || 0) * 60 + (record.minutes || 0),
      0
    );
    const totalHours = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;

    doc.setFontSize(20);
    doc.text("myCPD Log", 14, 16);

    doc.setFontSize(10);
    doc.text(`Export date: ${exportDate}`, 14, 24);
    doc.text(`Name: ${fullName}`, 14, 30);
    doc.text(`Main job role: ${mainRole}`, 14, 36);
    doc.text(`Secondary job role: ${secondaryRole}`, 14, 42);
    doc.text(`Total records: ${recordsToExport.length}`, 14, 48);
    doc.text(`Total CPD time: ${totalHours}`, 14, 54);

    const tableRows = recordsToExport.map((record) => [
      record.activity_title || "",
      record.cpd_type || "",
      formatDateDMYBlank(record.date_completed),
      formatDateDMYBlank(record.expiry_date),
      record.status || "",
      `${record.hours || 0}h ${record.minutes || 0}m`,
      Array.isArray(record.sectors) ? record.sectors.join(", ") : "",
      record.provider || "",
      record.evidence_available ? "Yes" : "No",
      record.description || "",
      record.outcome || "",
      record.certificate_file_url || "",
    ]);

    autoTable(doc, {
      startY: 60,
      head: [[
        "Title",
        "Type",
        "Completed",
        "Expiry",
        "Status",
        "Duration",
        "Sectors",
        "Provider",
        "Evidence",
        "Description",
        "Outcome",
        "Cert Link",
      ]],
      body: tableRows,
      styles: {
        fontSize: 7.5,
        cellPadding: 2.2,
        overflow: "linebreak",
        valign: "top",
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 16 },
        2: { cellWidth: 18 },
        3: { cellWidth: 18 },
        4: { cellWidth: 16 },
        5: { cellWidth: 16 },
        6: { cellWidth: 22 },
        7: { cellWidth: 22 },
        8: { cellWidth: 14 },
        9: { cellWidth: 34 },
        10: { cellWidth: 34 },
        11: { cellWidth: 32 },
      },
      margin: { left: 6, right: 6 },
    });

    doc.save("mycpd-log.pdf");
  }

  function formatDateDMY(dateString?: string | null) {
    if (!dateString) return "No date";
    const d = parseYMDToLocalDate(dateString);
    if (!d) return String(dateString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function openShareLink(token: string) {
    const shareUrl = `${publicShareBaseUrl}/${token}`;
    window.location.href = shareUrl;
  }

  async function handleUpdateProfile(e: FormEvent) {
    e.preventDefault();
    if (!session?.user?.id) return;

    setSettingsMessage("");
    setSettingsLoading(true);

    try {
      const { error } = await supabase.from("profiles").upsert({
        id: session.user.id,
        email: session.user.email,
        forename,
        surname,
        main_job_role: mainJobRole || null,
        secondary_job_role: secondaryJobRole || null,
      });

      if (error) throw error;

      setSettingsMessage("Profile updated successfully.");
    } catch (error: any) {
      setSettingsMessage(error.message || "Failed to update profile.");
    } finally {
      setSettingsLoading(false);
    }
  }

  function clearAllFilters() {
    setSearchQuery("");
    setSortBy("newest");
    setFilterStatus("all");
    setFilterType("all");
    setFilterEvidence("all");

    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterMinMinutes("");
    setFilterMaxMinutes("");
    setFilterProvider("");
    setFilterLearningMethod("all");
    setFilterCertificate("all");
    setFilterSectors("");
  }

  async function createProfile(userId: string, emailAddress: string) {
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      email: emailAddress,
      forename: forename || null,
      surname: surname || null,
      main_job_role: mainJobRole || null,
      secondary_job_role: secondaryJobRole || null,
      role: "member",
    });

    if (error) {
      console.error("Profile creation error:", error);
      throw error;
    }
  }

  async function handleAuthSubmit(e: FormEvent) {
    e.preventDefault();
    setAuthMessage("");

    if (isSignup && password !== confirmPassword) {
      setAuthMessage("Passwords do not match.");
      return;
    }

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        if (data.user) {
          await createProfile(data.user.id, email);
        }

        setAuthMessage(
          "Account created. Check your email if confirmation is enabled."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setAuthMessage(error.message || "Something went wrong.");
    }
    setPassword("");
    setConfirmPassword("");
    setIsSignup(false);
  }

  async function fetchGoals(userId: string) {
    setGoalsLoading(true);

    const { data } = await supabase
      .from("cpd_goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setGoals(data || []);
    setGoalsLoading(false);
  }

  async function handleCreateGoal(e: FormEvent) {
    e.preventDefault();
    if (!session?.user?.id) return;

    const isEditing = !!editingGoalId;

    if (!isEditing && !canCreateGoal) {
      requirePremium(
        "Free members can create 1 active goal at a time. Upgrade to Premium for unlimited goals."
      );
      return;
    }

    const sectorsArray = goalSectors
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      title: goalTitle,
      target_hours: Number(goalHours),
      date_from: goalFrom || new Date().toISOString().slice(0, 10),
      date_to: goalTo,
      sectors: sectorsArray,
      updated_at: new Date().toISOString(),
    };

    if (editingGoalId) {
      await supabase
        .from("cpd_goals")
        .update(payload)
        .eq("id", editingGoalId)
        .eq("user_id", session.user.id);
    } else {
      await supabase.from("cpd_goals").insert({
        user_id: session.user.id,
        ...payload,
      });
    }

    resetGoalForm();
    fetchGoals(session.user.id);
  }

  function getGoalProgress(goal: any) {
    const from = goal.date_from || null;
    const to = goal.date_to || null;

    let total = 0;

    records.forEach((record) => {
      if (record.status !== "Completed") return;
      if (!record.date_completed) return;

      if (from && record.date_completed < from) return;
      if (to && record.date_completed > to) return;

      if (goal.sectors?.length) {
        const recordSectors = Array.isArray(record.sectors) ? record.sectors : [];
        const hasMatch = recordSectors.some((sector) =>
          goal.sectors.includes(sector)
        );

        if (!hasMatch) return;
      }

      total += (record.hours || 0) + (record.minutes || 0) / 60;
    });

    const target = Number(goal.target_hours || 0);

    if (!target || target <= 0) {
      return {
        completedHours: Number(total.toFixed(1)),
        percent: 0,
      };
    }

    const percent = Math.min(100, Math.round((total / target) * 100));

    return {
      completedHours: Number(total.toFixed(1)),
      percent,
    };
  }

  function getActiveGoals() {
    return goals.filter((goal) => {
      if (!goal.date_to) return true;
      return goal.date_to >= new Date().toISOString().slice(0, 10);
    });
  }

  function getClosestGoalDeadline() {
    const activeGoals = getActiveGoals().filter((goal) => goal.date_to);

    if (activeGoals.length === 0) return null;

    const sorted = [...activeGoals].sort((a, b) =>
      (a.date_to || "").localeCompare(b.date_to || "")
    );

    return sorted[0];
  }

  function startEditGoal(goal: any) {
    setEditingGoalId(goal.id);

    setGoalTitle(goal.title || "");
    setGoalHours(String(goal.target_hours || ""));
    setGoalFrom(goal.date_from || "");
    setGoalTo(goal.date_to || "");
    setGoalSectors(goal.sectors?.join(", ") || "");
  }

  function resetGoalForm() {
    setEditingGoalId(null);
    setGoalTitle("");
    setGoalHours("");
    setGoalFrom("");
    setGoalTo("");
    setGoalSectors("");
  }

  async function handleDeleteGoal(id: string) {
    if (!session?.user?.id) return;

    const ok = window.confirm("Delete this goal?");
    if (!ok) return;

    await supabase
      .from("cpd_goals")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    fetchGoals(session.user.id);
  }

  async function handleQuickComplete(record: CPDRecord) {
    if (!session?.user?.id) return;

    const today = new Date().toISOString().slice(0, 10);

    const { error } = await supabase
      .from("cpd_records")
      .update({
        status: "Completed",
        date_completed: record.date_completed || today,
        updated_at: new Date().toISOString(),
      })
      .eq("id", record.id)
      .eq("user_id", session.user.id);

    if (!error) {
      await fetchRecords(session.user.id);
    }
  }

  function daysUntil(dateString: string) {
    const today = new Date();
    const target = new Date(dateString);

    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diffMs = target.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  async function checkAndCreateRenewalRecords(userId: string) {
    const renewableRecords = records.filter((record) => {
      if (!record.renewal_required) return false;
      if (!record.expiry_date) return false;
      if (record.status !== "Completed" && record.status !== "In Progress") return false;

      const days = daysUntil(record.expiry_date);
      return days >= 0 && days <= 30;
    });

    for (const record of renewableRecords) {
      const existingPlannedRenewal = records.some((r) => {
        if (r.user_id !== userId) return false;
        if (r.status !== "Planned") return false;
        if (r.activity_title !== `${record.activity_title} Renewal`) return false;

        const sameProvider = (r.provider || "") === (record.provider || "");
        const sameType = r.cpd_type === record.cpd_type;

        const recordSectors = Array.isArray(record.sectors) ? record.sectors.join(",") : "";
        const plannedSectors = Array.isArray(r.sectors) ? r.sectors.join(",") : "";
        const sameSectors = recordSectors === plannedSectors;

        return sameProvider && sameType && sameSectors;
      });

      if (existingPlannedRenewal) continue;

      const renewalPayload = {
        user_id: userId,
        activity_title: `${record.activity_title} Renewal`,
        cpd_type: record.cpd_type,
        date_completed: null,
        planned_for_date: null,
        expiry_date: null,
        renewal_required: false,
        hours: record.hours,
        minutes: record.minutes,
        provider: record.provider,
        learning_method: record.learning_method,
        sectors: record.sectors,
        description: record.expiry_date
          ? `Renewal reminder for activity expiring on ${record.expiry_date}.${record.description ? ` ${record.description}` : ""}`
          : record.description,
        outcome: record.outcome,
        evidence_available: false,
        certificate_file_url: null,
        status: "Planned",
        updated_at: new Date().toISOString(),
      };

      await supabase.from("cpd_records").insert([renewalPayload]);
    }
  }

  function normaliseImportedDate(value: any) {
    if (!value) return null;

    if (typeof value === "number") {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (!parsed) return null;

      const day = String(parsed.d).padStart(2, "0");
      const month = String(parsed.m).padStart(2, "0");
      const year = parsed.y;

      return `${year}-${month}-${day}`;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return null;

      const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (isoMatch) return trimmed;

      const dmyMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (dmyMatch) {
        const [, day, month, year] = dmyMatch;
        return `${year}-${month}-${day}`;
      }

      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
      }
    }

    return null;
  }

  function normaliseImportedBoolean(value: any) {
    if (typeof value === "boolean") return value;

    const text = String(value || "").trim().toLowerCase();

    return text === "yes" || text === "true" || text === "1";
  }

  async function handleImportFile(file: File) {
    setImportMessage("");

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as any[];

      setImportRows(jsonData);

      if (jsonData.length === 0) {
        setImportMessage("The uploaded spreadsheet is empty.");
      } else {
        setImportMessage(`${jsonData.length} row(s) ready to import.`);
      }
    } catch (error: any) {
      setImportMessage(error.message || "Failed to read spreadsheet.");
    }
  }

  async function handleImportRows() {
    if (!session?.user?.id) return;
    if (importRows.length === 0) {
      setImportMessage("No rows to import.");
      return;
    }

    if (!hasPremiumAccess) {
      const validRowsCount = importRows.filter(
        (row) => String(row["Activity Title"] || "").trim()
      ).length;

      if (records.length + validRowsCount > 50) {
        requirePremium(
          "Free members can store up to 50 CPD records. Upgrade to Premium for unlimited records and bulk upload."
        );
        return;
      }
    }

    if (!canUseBulkUpload) {
      requirePremium("Bulk upload is a Premium feature.");
      return;
    }

    setImportingRows(true);
    setImportMessage("");

    const validationErrors = importRows.flatMap((row, index) =>
      validateImportRow(row, index)
    );

    if (validationErrors.length > 0) {
      setImportMessage(validationErrors.slice(0, 8).join(" "));
      setImportingRows(false);
      return;
    }

    try {
      const payload = importRows
        .map((row) => {
          const sectorsRaw = String(row["Sectors"] || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

          const status = String(row["Status"] || "").trim() || "Completed";

          return {
            user_id: session.user.id,
            activity_title: String(row["Activity Title"] || "").trim(),
            cpd_type: String(row["CPD Type"] || "").trim() || null,
            status,
            date_completed: status === "Completed"
              ? normaliseImportedDate(row["Date Completed"])
              : null,
            planned_for_date: status === "Planned"
              ? normaliseImportedDate(row["Planned For Date"])
              : null,
            expiry_date: normaliseImportedDate(row["Expiry Date"]),
            renewal_required: normaliseImportedBoolean(row["Renewal Required"]),
            hours: Number(row["Hours"] || 0),
            minutes: Number(row["Minutes"] || 0),
            provider: String(row["Provider"] || "").trim() || null,
            learning_method: String(row["Learning Method"] || "").trim() || null,
            sectors: sectorsRaw.length ? sectorsRaw : null,
            description: String(row["Description"] || "").trim() || null,
            outcome: String(row["Outcome"] || "").trim() || null,
            evidence_available: normaliseImportedBoolean(row["Evidence Available"]),
            certificate_file_url: null,
            updated_at: new Date().toISOString(),
          };
        })
        .filter((row) => row.activity_title);

      if (payload.length === 0) {
        setImportMessage("No valid rows found. Make sure Activity Title is filled in.");
        setImportingRows(false);
        return;
      }

      const { error } = await supabase.from("cpd_records").insert(payload);

      if (error) throw error;

      setImportMessage(`${payload.length} row(s) imported successfully.`);
      setImportRows([]);
      await fetchRecords(session.user.id);
    } catch (error: any) {
      setImportMessage(error.message || "Import failed.");
    } finally {
      setImportingRows(false);
    }
  }

  const allowedImportCpdTypes = [
    "Course",
    "Webinar",
    "Workshop",
    "Seminar",
    "Reading",
    "Research",
    "Practical Training",
    "Mentoring",
    "Conference",
    "Self-Study",
    "Other",
  ];

  const allowedImportStatuses = ["Planned", "In Progress", "Completed"];

  const allowedImportLearningMethods = [
    "Online",
    "In Person",
    "Hybrid",
    "Self-Study",
    "Workplace Learning",
  ];

  function validateImportRow(row: any, index: number) {
    const errors: string[] = [];

    const rowNumber = index + 2;

    const activityTitle = String(row["Activity Title"] || "").trim();
    const cpdType = String(row["CPD Type"] || "").trim();
    const status = String(row["Status"] || "").trim();
    const learningMethod = String(row["Learning Method"] || "").trim();

    const dateCompleted = normaliseImportedDate(row["Date Completed"]);
    const plannedForDate = normaliseImportedDate(row["Planned For Date"]);
    const expiryDate = normaliseImportedDate(row["Expiry Date"]);
    const renewalRequired = normaliseImportedBoolean(row["Renewal Required"]);

    const hours = Number(row["Hours"] || 0);
    const minutes = Number(row["Minutes"] || 0);

    if (!activityTitle) {
      errors.push(`Row ${rowNumber}: Activity Title is required.`);
    }

    if (!cpdType) {
      errors.push(`Row ${rowNumber}: CPD Type is required.`);
    } else if (!allowedImportCpdTypes.includes(cpdType)) {
      errors.push(`Row ${rowNumber}: CPD Type must be one of the allowed values.`);
    }

    if (!status) {
      errors.push(`Row ${rowNumber}: Status is required.`);
    } else if (!allowedImportStatuses.includes(status)) {
      errors.push(`Row ${rowNumber}: Status must be Planned, In Progress, or Completed.`);
    }

    if (learningMethod && !allowedImportLearningMethods.includes(learningMethod)) {
      errors.push(`Row ${rowNumber}: Learning Method is not valid.`);
    }

    if (status === "Completed" && !dateCompleted) {
      errors.push(`Row ${rowNumber}: Date Completed is required when Status is Completed.`);
    }

    if (status === "Planned" && !plannedForDate) {
      errors.push(`Row ${rowNumber}: Planned For Date is required when Status is Planned.`);
    }

    if (renewalRequired && !expiryDate) {
      errors.push(`Row ${rowNumber}: Expiry Date is required when Renewal Required is Yes.`);
    }

    if (Number.isNaN(hours) || hours < 0) {
      errors.push(`Row ${rowNumber}: Hours must be 0 or more.`);
    }

    if (Number.isNaN(minutes) || minutes < 0 || minutes > 59) {
      errors.push(`Row ${rowNumber}: Minutes must be between 0 and 59.`);
    }

    return errors;
  }

  async function fetchSharedViews(userId: string) {
    setSharedViewsLoading(true);

    const { data, error } = await supabase
      .from("shared_views")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSharedViews(data);
    }

    setSharedViewsLoading(false);
  }

  function generateShareToken() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  async function handleCreateSharedView() {
    if (!session?.user?.id) return;

    if (!canCreateShareLink) {
      requirePremium(
        "Free members can create 1 live shared view. Upgrade to Premium for unlimited shared views."
      );
      return;
    }

    setShareMessage("");

    try {
      const token = generateShareToken();
      const title =
        shareTitle.trim() ||
        `Shared view ${new Date().toLocaleDateString("en-GB")}`;

      const { error } = await supabase.from("shared_views").insert({
        user_id: session.user.id,
        share_token: token,
        title,
        search_query: searchQuery || "",
        sort_by: sortBy || "newest",
        filter_status: filterStatus || "all",
        filter_type: filterType || "all",
        filter_evidence: filterEvidence || "all",
        filter_date_from: filterDateFrom || "",
        filter_date_to: filterDateTo || "",
        filter_min_minutes: filterMinMinutes ? Number(filterMinMinutes) : null,
        filter_max_minutes: filterMaxMinutes ? Number(filterMaxMinutes) : null,
        filter_provider: filterProvider || "",
        filter_learning_method: filterLearningMethod || "all",
        filter_certificate: filterCertificate || "all",
        filter_sectors: filterSectors || "",
        is_active: true,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      const shareUrl = `${publicShareBaseUrl}/${token}`;
      setShareMessage(`Shared link created: ${shareUrl}`);
      setShareTitle("");
      await fetchSharedViews(session.user.id);
    } catch (error: any) {
      setShareMessage(error.message || "Failed to create shared view.");
    }
  }

  async function copyShareLink(token: string) {
    const shareUrl = `${publicShareBaseUrl}/${token}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage("Share link copied.");
    } catch {
      setShareMessage(shareUrl);
    }
  }

  async function handleDeleteSharedView(id: string) {
    if (!session?.user?.id) return;

    const ok = window.confirm("Delete this shared view?");
    if (!ok) return;

    const { error } = await supabase
      .from("shared_views")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (!error) {
      await fetchSharedViews(session.user.id);
    }
  }

  function getShareTokenFromUrl() {
    const path = window.location.pathname;
    const parts = path.split("/").filter(Boolean);

    if (parts.length === 2 && parts[0] === "share") {
      return parts[1];
    }

    return null;
  }

  function applySharedViewFilters(records: CPDRecord[], sharedView: any) {
    let result = [...records];

    const searchQuery = (sharedView.search_query || "").toLowerCase();
    const sortBy = sharedView.sort_by || "newest";
    const filterStatus = sharedView.filter_status || "all";
    const filterType = sharedView.filter_type || "all";
    const filterEvidence = sharedView.filter_evidence || "all";

    const filterDateFrom = sharedView.filter_date_from || "";
    const filterDateTo = sharedView.filter_date_to || "";
    const filterMinMinutes = sharedView.filter_min_minutes ?? null;
    const filterMaxMinutes = sharedView.filter_max_minutes ?? null;
    const filterProvider = (sharedView.filter_provider || "").toLowerCase();
    const filterLearningMethod = sharedView.filter_learning_method || "all";
    const filterCertificate = sharedView.filter_certificate || "all";
    const filterSectors = sharedView.filter_sectors || "";

    if (searchQuery.trim()) {
      result = result.filter((record) =>
        [
          record.activity_title,
          record.provider,
          record.outcome,
          record.description,
          record.cpd_type,
          record.sectors?.join(", "),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(searchQuery))
      );
    }

    if (filterStatus !== "all") {
      result = result.filter((record) => record.status === filterStatus);
    }

    if (filterType !== "all") {
      result = result.filter((record) => record.cpd_type === filterType);
    }

    if (filterEvidence !== "all") {
      result = result.filter((record) =>
        filterEvidence === "yes"
          ? record.evidence_available
          : !record.evidence_available
      );
    }

    result = result.filter((record) => {
      const effectiveDate =
        record.status === "Planned"
          ? record.planned_for_date
          : record.date_completed;

      if (filterDateFrom && (!effectiveDate || effectiveDate < filterDateFrom)) {
        return false;
      }

      if (filterDateTo && (!effectiveDate || effectiveDate > filterDateTo)) {
        return false;
      }

      const totalMinutes = (record.hours || 0) * 60 + (record.minutes || 0);

      if (filterMinMinutes !== null && totalMinutes < Number(filterMinMinutes)) {
        return false;
      }

      if (filterMaxMinutes !== null && totalMinutes > Number(filterMaxMinutes)) {
        return false;
      }

      if (
        filterProvider.trim() &&
        !(record.provider || "").toLowerCase().includes(filterProvider)
      ) {
        return false;
      }

      if (
        filterLearningMethod !== "all" &&
        record.learning_method !== filterLearningMethod
      ) {
        return false;
      }

      if (filterCertificate !== "all") {
        const hasCertificate = !!record.certificate_file_url;
        if (filterCertificate === "yes" && !hasCertificate) return false;
        if (filterCertificate === "no" && hasCertificate) return false;
      }

      if (filterSectors.trim()) {
        const wanted = filterSectors
          .split(",")
          .map((s: string) => s.trim().toLowerCase())
          .filter(Boolean);

        const recordSectors = (record.sectors || []).map((s) => s.toLowerCase());

        const hasSectorMatch = wanted.some((sector: string) =>
          recordSectors.includes(sector)
        );

        if (!hasSectorMatch) return false;
      }

      return true;
    });

    result.sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.date_completed || b.created_at).getTime() -
          new Date(a.date_completed || a.created_at).getTime()
        );
      }

      if (sortBy === "oldest") {
        return (
          new Date(a.date_completed || a.created_at).getTime() -
          new Date(b.date_completed || b.created_at).getTime()
        );
      }

      if (sortBy === "hoursHigh") {
        return b.hours * 60 + b.minutes - (a.hours * 60 + a.minutes);
      }

      if (sortBy === "hoursLow") {
        return a.hours * 60 + a.minutes - (b.hours * 60 + b.minutes);
      }

      if (sortBy === "titleAZ") {
        return a.activity_title.localeCompare(b.activity_title);
      }

      if (sortBy === "titleZA") {
        return b.activity_title.localeCompare(a.activity_title);
      }

      return 0;
    });

    return result;
  }

  async function loadPublicSharedView(token: string) {
    setPublicShareLoading(true);
    setPublicShareError("");

    try {
      const { data: sharedView, error: sharedViewError } = await supabase
        .from("shared_views")
        .select("*")
        .eq("share_token", token)
        .eq("is_active", true)
        .single();

      if (sharedViewError || !sharedView) {
        throw new Error("Shared view not found.");
      }

      const { data: recordsData, error: recordsError } = await supabase
        .from("cpd_records")
        .select("*")
        .eq("user_id", sharedView.user_id);

      if (recordsError) {
        throw recordsError;
      }

      const filtered = applySharedViewFilters(recordsData as CPDRecord[], sharedView);

      setPublicSharedView(sharedView);
      setPublicSharedRecords(filtered);
    } catch (error: any) {
      setPublicShareError(error.message || "Failed to load shared view.");
    } finally {
      setPublicShareLoading(false);
    }
  }

  useEffect(() => {
    const shareToken = getShareTokenFromUrl();

    if (shareToken) {
      loadPublicSharedView(shareToken);
    }
  }, []);

  async function handleLogout() {
    resetForm();
    resetGoalForm();
    setSelectedRecord(null);
    setSelectedArticle(null);
    setShowAddPage(false);
    setShowAddArticlePage(false);
    setArticlePreviewMode(false);
    setShowPremiumPopup(false);
    setPremiumReason("");
    setPurchaseMessage("");
    setSearchQuery("");
    setArticleSearchQuery("");
    setSortBy("newest");
    setArticleSortBy("newest");
    clearAllFilters();
    setShareTitle("");
    setShareMessage("");
    setSelectedIds([]);
    setEditingId(null);
    setEditingGoalId(null);
    setEditingArticleId(null);
    setActiveTab("dashboard");

    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setIsSignup(false);

    await supabase.auth.signOut();
  }

  async function fetchRecords(userId: string) {
    setRecordsLoading(true);

    const { data, error } = await supabase
      .from("cpd_records")
      .select("*")
      .eq("user_id", userId)
      .order("date_completed", { ascending: false });

    if (!error && data) {
      setRecords(data as CPDRecord[]);
    }

    setRecordsLoading(false);
  }

  function resetForm() {
    setForm(emptyForm);
    setCertificateFile(null);
    setEditingId(null);
    setRecordMessage("");
  }

  function handleEditRecord(record: CPDRecord) {
    setForm(recordToForm(record));
    setEditingId(record.id);
    setCertificateFile(null);
    setRecordMessage("Editing record. Update the fields and save.");
    setShowAddPage(true);
    setAddPageTab("single");
    setSelectedRecord(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleAddOrUpdateRecord(e: FormEvent) {
    e.preventDefault();
    if (!session?.user?.id) return;

    if (!editingId && !canCreateRecord) {
      requirePremium(
        "Free members can store up to 50 CPD records. Upgrade to Premium for unlimited records."
      );
      setSavingRecord(false);
      return;
    }

    setSavingRecord(true);
    setRecordMessage("");

    try {
      if (!form.activity_title.trim()) {
        setRecordMessage("Activity title is required.");
        setSavingRecord(false);
        return;
      }

      if (!form.cpd_type) {
        setRecordMessage("Please select a CPD type.");
        setSavingRecord(false);
        return;
      }

      if (form.status === "Completed" && !form.date_completed) {
        setRecordMessage("Completed date is required for completed activities.");
        setSavingRecord(false);
        return;
      }

      if (form.status === "Planned" && !form.planned_for_date) {
        setRecordMessage("Planned date is required for planned activities.");
        setSavingRecord(false);
        return;
      }

      if (form.renewal_required && !form.expiry_date) {
        setRecordMessage("Expiry date is required when renewal is needed.");
        setSavingRecord(false);
        return;
      }
      let certificateUrl: string | null | undefined = undefined;

      if (certificateFile) {
        certificateUrl = await uploadCertificate(certificateFile, session.user.id);
      }

      const sectorsArray = form.sectors
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const basePayload = {
        activity_title: form.activity_title,
        cpd_type: form.cpd_type,
        date_completed: form.date_completed || null,
        planned_for_date: form.planned_for_date || null,
        expiry_date: form.expiry_date || null,
        renewal_required: form.renewal_required,
        hours: Number(form.hours || 0),
        minutes: Number(form.minutes || 0),
        provider: form.provider || null,
        learning_method: form.learning_method || null,
        sectors: sectorsArray.length ? sectorsArray : null,
        description: form.description || null,
        outcome: form.outcome || null,
        evidence_available: form.evidence_available,
        status: form.status,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const updatePayload: Record<string, any> = { ...basePayload };
        if (certificateUrl) {
          updatePayload.certificate_file_url = certificateUrl;
        }

        const { error } = await supabase
          .from("cpd_records")
          .update(updatePayload)
          .eq("id", editingId)
          .eq("user_id", session.user.id);

        if (error) throw error;

        setRecordMessage("CPD record updated successfully.");
      } else {
        const insertPayload = {
          user_id: session.user.id,
          ...basePayload,
          certificate_file_url: certificateUrl ?? null,
        };

        const { error } = await supabase
          .from("cpd_records")
          .insert([insertPayload]);

        if (error) throw error;

        setRecordMessage("CPD record added successfully.");
      }

      await fetchRecords(session.user.id);
      setForm(emptyForm);
      setCertificateFile(null);
      setEditingId(null);
    } catch (error: any) {
      setRecordMessage(error.message || "Failed to save record.");
    } finally {
      setSavingRecord(false);
    }
  }

  async function handleUpdateEmail(e: FormEvent) {
    e.preventDefault();
    setSettingsMessage("");
    setSettingsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) throw error;

      setSettingsMessage(
        "Email update requested. Check your inbox to confirm the new email address."
      );
    } catch (error: any) {
      setSettingsMessage(error.message || "Failed to update email.");
    } finally {
      setSettingsLoading(false);
    }
  }

  async function handleUpdatePassword(e: FormEvent) {
    e.preventDefault();
    setSettingsMessage("");
    setSettingsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setNewPassword("");
      setSettingsMessage("Password updated successfully.");
    } catch (error: any) {
      setSettingsMessage(error.message || "Failed to update password.");
    } finally {
      setSettingsLoading(false);
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This cannot be undone."
    );

    if (!confirmed || !session?.user?.id) return;

    setSettingsMessage(
      "Account deletion usually needs a secure backend function. For now, you can delete the user's data manually in Supabase, or add a secure delete-account function next."
    );
  }

  if (loading) {
    return (
      <div
        style={{
          ...pageStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            ...glassCard,
            padding: 24,
            textAlign: "center",
            width: "100%",
            maxWidth: "100%",
          }}
        >
          <div style={{ fontSize: 30, marginBottom: 10 }}>⏳</div>
          <strong>Loading myCPD...</strong>
        </div>
      </div>
    );
  }

  const shareTokenFromUrl = getShareTokenFromUrl();

  if (shareTokenFromUrl) {
    return (
      <div style={pageStyle}>
        <div
          style={{
            ...glassCard,
            width: "100%",
            maxWidth: 900,
            margin: "0 auto",
            padding: 20,
          }}
        >

          {publicSharedRecords.length === 0 ? (
            <div
              style={{
                padding: 18,
                borderRadius: theme.radius.md,
                background: "#fff",
                border: `1px dashed ${theme.colors.border}`,
                color: theme.colors.subtext,
              }}
            >
              No matching CPD records found.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              ...
            </div>
          )}
          {publicShareLoading ? (
            <div style={{ color: theme.colors.subtext }}>Loading shared view...</div>
          ) : publicShareError ? (
            <div
              style={{
                padding: 18,
                borderRadius: theme.radius.md,
                background: "#fff",
                border: `1px dashed ${theme.colors.border}`,
                color: theme.colors.danger,
              }}
            >
              {publicShareError}
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <h1 style={{ margin: 0, fontSize: 30 }}>
                  {publicSharedView?.title || "Shared CPD View"}
                </h1>
                <p
                  style={{
                    margin: "6px 0 0",
                    color: theme.colors.subtext,
                    fontSize: 14,
                  }}
                >
                  Live shared CPD records
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 12,
                  marginBottom: 18,
                }}
              >
                <div style={{ ...solidCard, padding: 16 }}>
                  <div style={{ color: theme.colors.subtext, fontSize: 14 }}>
                    Records
                  </div>
                  <strong style={{ display: "block", marginTop: 8, fontSize: 26 }}>
                    {publicSharedRecords.length}
                  </strong>
                </div>

                <div style={{ ...solidCard, padding: 16 }}>
                  <div style={{ color: theme.colors.subtext, fontSize: 14 }}>
                    Sort
                  </div>
                  <strong style={{ display: "block", marginTop: 8, fontSize: 16 }}>
                    {publicSharedView?.sort_by || "newest"}
                  </strong>
                </div>

                <div style={{ ...solidCard, padding: 16 }}>
                  <div style={{ color: theme.colors.subtext, fontSize: 14 }}>
                    Status filter
                  </div>
                  <strong style={{ display: "block", marginTop: 8, fontSize: 16 }}>
                    {publicSharedView?.filter_status || "all"}
                  </strong>
                </div>
              </div>

              {publicSharedRecords.length === 0 ? (
                <div
                  style={{
                    padding: 18,
                    borderRadius: theme.radius.md,
                    background: "#fff",
                    border: `1px dashed ${theme.colors.border}`,
                    color: theme.colors.subtext,
                  }}
                >
                  No matching CPD records found.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {publicSharedRecords.map((record) => (
                    <div
                      key={record.id}
                      style={{
                        background: "#fff",
                        borderBottom: `1px solid ${theme.colors.border}`,
                        borderRadius: 0,
                        boxShadow: "none",
                        padding: 16,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          alignItems: "start",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <strong style={{ display: "block", fontSize: 16 }}>
                            {record.activity_title}
                          </strong>

                          <div
                            style={{
                              marginTop: 6,
                              color: theme.colors.subtext,
                              fontSize: 14,
                            }}
                          >
                            {record.cpd_type} • {formatDateDMY(record.date_completed)} • {record.hours}h {record.minutes}m
                          </div>

                          {record.provider && (
                            <div
                              style={{
                                marginTop: 6,
                                color: theme.colors.subtext,
                                fontSize: 14,
                              }}
                            >
                              Provider: {record.provider}
                            </div>
                          )}

                          {record.sectors?.length ? (
                            <div
                              style={{
                                marginTop: 6,
                                color: theme.colors.subtext,
                                fontSize: 14,
                              }}
                            >
                              Sectors: {record.sectors.join(", ")}
                            </div>
                          ) : null}

                          {record.outcome && (
                            <div
                              style={{
                                marginTop: 8,
                                lineHeight: 1.5,
                                fontSize: 14,
                              }}
                            >
                              {record.outcome}
                            </div>
                          )}
                        </div>

                        <span style={getStatusChipStyle(record.status)}>
                          {record.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div
        style={{
          ...pageStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            ...glassCard,
            width: "100%",
            maxWidth: "100%",
            padding: 28,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 20,
              background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 24,
              boxShadow: "0 14px 26px rgba(37, 99, 235, 0.22)",
              marginBottom: 18,
            }}
          >
            ✓
          </div>

          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>myCPD</h1>
          <p style={{ marginTop: 8, color: theme.colors.subtext, fontSize: 15 }}>
            {isSignup
              ? "Create your account to start tracking CPD."
              : "Sign in to manage your CPD records."}
          </p>

          <form
            onSubmit={handleAuthSubmit}
            style={{ display: "grid", gap: 14, marginTop: 22 }}
          >
            {isSignup && (
              <>
                <input
                  style={inputStyle}
                  placeholder="Forename"
                  value={forename}
                  onChange={(e) => setForename(e.target.value)}
                  required={isSignup}
                />

                <input
                  style={inputStyle}
                  placeholder="Surname"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  required={isSignup}
                />

                <input
                  style={inputStyle}
                  placeholder="Main job role"
                  value={mainJobRole}
                  onChange={(e) => setMainJobRole(e.target.value)}
                />

                <input
                  style={inputStyle}
                  placeholder="Secondary job role"
                  value={secondaryJobRole}
                  onChange={(e) => setSecondaryJobRole(e.target.value)}
                />
              </>
            )}

            <input
              style={inputStyle}
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              style={inputStyle}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {isSignup && (
              <>
                <input
                  style={inputStyle}
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required={isSignup}
                />
              </>)}

            {authMessage && (
              <div
                style={{
                  background: theme.colors.primarySoft,
                  color: theme.colors.primaryDark,
                  padding: "12px 14px",
                  borderRadius: theme.radius.sm,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {authMessage}
              </div>
            )}

            <button type="submit" style={primaryButtonStyle}>
              {isSignup ? "Create account" : "Log in"}
            </button>

            {!isSignup && (
              <button
                type="button"
                onClick={handleForgotPassword}
                style={{
                  ...secondaryButtonStyle,
                  width: "100%",
                  marginTop: 10,
                  display: "block",
                }}
              >
                Forgot password
              </button>
            )}
          </form>

          <button
            onClick={() => setIsSignup((value) => !value)}
            style={{
              ...secondaryButtonStyle,
              width: "100%",
              marginTop: 12,
            }}
          >
            {isSignup
              ? "Already have an account? Log in"
              : "No account yet? Create one"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={{ width: "100%", maxWidth: "100%", margin: 0 }}>
        {showAddPage && (
          <div
            style={{
              ...glassCard,
              padding: 20,
              marginTop: 12,
              animation: "fadeSlide 0.25s ease",
              width: "100%",
              maxWidth: "100%",
              overflow: "hidden",
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => {
                  setShowAddPage(false);
                  setAddPageTab("single");
                  resetForm();
                }}
                style={{
                  ...secondaryButtonStyle,
                  padding: "10px 14px",
                  marginBottom: 12,
                }}
              >
                ← Back
              </button>

              <h2 style={{ margin: 0, fontSize: 24 }}>
                {editingId ? "Edit CPD record" : "Add CPD record"}
              </h2>
              <p style={{ margin: "6px 0 0", color: theme.colors.subtext }}>
                {editingId
                  ? "Update your existing record."
                  : "Add a new learning activity to your CPD log."}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <button
                onClick={() => setAddPageTab("single")}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: theme.radius.md,
                  border: `1px solid ${theme.colors.border}`,
                  background:
                    addPageTab === "single"
                      ? theme.colors.primary
                      : "#fff",
                  color:
                    addPageTab === "single"
                      ? "#fff"
                      : theme.colors.text,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Single entry
              </button>

              <button
                onClick={() => {
                  if (!canUseBulkUpload) {
                    requirePremium("Bulk upload is a Premium feature.");
                    return;
                  }
                  setAddPageTab("bulk");
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: theme.radius.md,
                  border: `1px solid ${theme.colors.border}`,
                  background:
                    addPageTab === "bulk"
                      ? theme.colors.primary
                      : "#fff",
                  color:
                    addPageTab === "bulk"
                      ? "#fff"
                      : theme.colors.text,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Bulk upload
                {!hasPremiumAccess && <span style={premiumBadgeStyle}>Premium</span>}
              </button>
            </div>

            {addPageTab === "single" && (
              <form
                onSubmit={handleAddOrUpdateRecord}
                style={{
                  display: "grid",
                  gap: 16,
                  gridTemplateColumns: "1fr",
                  width: "100%",
                  maxWidth: "100%",
                }}
              >
                <div style={fieldWrapStyle}>
                  <label style={fieldLabelStyle}>Activity title</label>
                  <input
                    style={inputStyle}
                    value={form.activity_title}
                    onChange={(e) =>
                      setForm({ ...form, activity_title: e.target.value })
                    }
                    required
                  />
                </div>

                <div style={fieldWrapStyle}>
                  <label style={fieldLabelStyle}>CPD type</label>
                  <select
                    style={inputStyle}
                    value={form.cpd_type}
                    onChange={(e) => setForm({ ...form, cpd_type: e.target.value })}
                    required
                  >
                    <option value="">Select CPD type</option>
                    {cpdTypes.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={fieldWrapStyle}>
                  <label style={fieldLabelStyle}>Status</label>
                  <select
                    style={inputStyle}
                    value={form.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                  >
                    {statuses.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                {form.status === "Completed" && (
                  <div style={fieldWrapStyle}>
                    <label style={fieldLabelStyle}>Completed date</label>
                    <input
                      style={inputStyle}
                      type="date"
                      value={form.date_completed}
                      onChange={(e) =>
                        setForm({ ...form, date_completed: e.target.value })
                      }
                      required={form.status === "Completed"}
                    />
                  </div>
                )}

                {form.status === "Planned" && (
                  <div style={fieldWrapStyle}>
                    <label style={fieldLabelStyle}>Planned date</label>
                    <input
                      style={inputStyle}
                      type="date"
                      value={form.planned_for_date}
                      onChange={(e) =>
                        setForm({ ...form, planned_for_date: e.target.value })
                      }
                      required={form.status === "Planned"}
                    />
                  </div>
                )}

                {(form.status === "Completed" || form.status === "In Progress" || form.renewal_required) && (
                  <div style={fieldWrapStyle}>
                    <label style={fieldLabelStyle}>Expiry date</label>
                    <input
                      style={inputStyle}
                      type="date"
                      value={form.expiry_date}
                      onChange={(e) =>
                        setForm({ ...form, expiry_date: e.target.value })
                      }
                      required={form.renewal_required}
                    />
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "auto",
                    padding: "4px 0",
                  }}
                >
                  <input
                    type="checkbox"
                    style={{
                      width: 18,
                      height: 18,
                      margin: 0,
                    }}
                    checked={form.renewal_required}
                    onChange={(e) =>
                      setForm({ ...form, renewal_required: e.target.checked })
                    }
                  />

                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: theme.colors.text,
                    }}
                  >
                    This activity needs renewal
                  </span>
                </div>

                <div style={fieldWrapStyle}>
                  <label style={fieldLabelStyle}>Hours</label>
                  <input
                    style={inputStyle}
                    type="number"
                    min="0"
                    value={form.hours}
                    onChange={(e) => setForm({ ...form, hours: e.target.value })}
                  />
                </div>

                <div style={fieldWrapStyle}>
                  <label style={fieldLabelStyle}>Minutes</label>
                  <input
                    style={inputStyle}
                    type="number"
                    min="0"
                    max="59"
                    value={form.minutes}
                    onChange={(e) => setForm({ ...form, minutes: e.target.value })}
                  />
                </div>

                <div style={fieldWrapStyle}>
                  <label style={fieldLabelStyle}>Provider</label>
                  <input
                    style={inputStyle}
                    value={form.provider}
                    onChange={(e) => setForm({ ...form, provider: e.target.value })}
                  />
                </div>

                <div style={fieldWrapStyle}>
                  <label style={fieldLabelStyle}>Learning method</label>
                  <select
                    style={inputStyle}
                    value={form.learning_method}
                    onChange={(e) =>
                      setForm({ ...form, learning_method: e.target.value })
                    }
                  >
                    {learningMethods.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={fieldWrapStyle}>
                  <label style={fieldLabelStyle}>Sectors</label>
                  <input
                    style={inputStyle}
                    value={form.sectors}
                    onChange={(e) => setForm({ ...form, sectors: e.target.value })}
                    placeholder="e.g. Security, Training, IQA"
                  />
                  <p style={{ marginTop: 8, fontSize: 13, color: theme.colors.subtext }}>
                    Enter one or more sectors separated by commas.
                  </p>
                </div>

                <div style={fieldWrapStyle}>
                  <label style={fieldLabelStyle}>Description</label>
                  <textarea
                    style={{ ...inputStyle, minHeight: 110, resize: "vertical" }}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>

                <div style={fieldWrapStyle}>
                  <label style={fieldLabelStyle}>Outcome / learning summary</label>
                  <textarea
                    style={{ ...inputStyle, minHeight: 110, resize: "vertical" }}
                    value={form.outcome}
                    onChange={(e) => setForm({ ...form, outcome: e.target.value })}
                  />
                </div>

                <div style={fieldWrapStyle}>
                  <label style={fieldLabelStyle}>Certificate upload</label>
                  <input
                    style={inputStyle}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      setCertificateFile(e.target.files?.[0] || null)
                    }
                  />
                  {editingId && (
                    <p
                      style={{
                        marginTop: 8,
                        fontSize: 13,
                        color: theme.colors.subtext,
                      }}
                    >
                      Leave this empty to keep the current certificate.
                    </p>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "auto",
                    padding: "4px 0",
                  }}
                >
                  <input
                    type="checkbox"
                    style={{
                      width: 18,
                      height: 18,
                      margin: 0,
                    }}
                    checked={form.evidence_available}
                    onChange={(e) =>
                      setForm({ ...form, evidence_available: e.target.checked })
                    }
                  />

                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: theme.colors.text,
                    }}
                  >
                    Evidence available
                  </span>
                </div>

                {recordMessage && (
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: theme.radius.sm,
                      background: theme.colors.primarySoft,
                      color: theme.colors.primaryDark,
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    {recordMessage}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="submit"
                    disabled={savingRecord}
                    style={primaryButtonStyle}
                  >
                    {savingRecord
                      ? "Saving..."
                      : editingId
                        ? "Update CPD record"
                        : "Save CPD record"}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      style={secondaryButtonStyle}
                    >
                      Cancel edit
                    </button>
                  )}
                </div>
              </form>
            )}

            {addPageTab === "bulk" && (
              <div
                style={{
                  ...glassCard,
                  padding: 20,
                  marginTop: 18,
                }}
              >
                <div style={{ marginBottom: 16 }}>
                  <h2 style={{ margin: 0, fontSize: 22 }}>Bulk upload</h2>
                  <p style={{ margin: "6px 0 0", color: theme.colors.subtext }}>
                    Download the template, fill it in, then upload it to import multiple CPD records.
                  </p>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                  <button
                    onClick={() => {
                      const url =
                        "https://cdldqmehwdrebusdmpuz.supabase.co/storage/v1/object/public/app-files/templates/cpd-template.xlsx";

                      window.open(url, "_blank");
                    }}
                    style={secondaryButtonStyle}
                  >
                    Download Template
                  </button>

                  <label
                    style={{
                      ...secondaryButtonStyle,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    Upload spreadsheet
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImportFile(file);
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleImportRows}
                    disabled={importRows.length === 0 || importingRows}
                    style={{
                      ...primaryButtonStyle,
                      opacity: importRows.length === 0 || importingRows ? 0.6 : 1,
                      cursor:
                        importRows.length === 0 || importingRows ? "not-allowed" : "pointer",
                    }}
                  >
                    {importingRows ? "Importing..." : "Import rows"}
                  </button>
                </div>

                {importMessage && (
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: theme.radius.sm,
                      background: theme.colors.primarySoft,
                      color: theme.colors.primaryDark,
                      fontSize: 14,
                      fontWeight: 700,
                      marginBottom: 12,
                    }}
                  >
                    {importMessage}
                  </div>
                )}

                {importRows.length > 0 && (
                  <div
                    style={{
                      background: "#fff",
                      borderBottom: `1px solid ${theme.colors.border}`,
                      borderRadius: 0,
                      boxShadow: "none",
                      padding: 16,
                    }}
                  >
                    <strong style={{ display: "block", marginBottom: 8 }}>
                      Preview
                    </strong>
                    <div style={{ color: theme.colors.subtext, fontSize: 14 }}>
                      {importRows.length} row(s) loaded and ready to import.
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {!showAddPage && (
          <>
            {activeTab === "dashboard" && (
              <div style={{ marginTop: 12, animation: "fadeSlide 0.25s ease" }}>

                <div style={{ marginBottom: 16 }}>
                  <h2 style={{ margin: 0, fontSize: 24 }}>
                    {forename ? `Welcome, ${forename}` : "Dashboard"}
                  </h2>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: 14,
                  }}
                >
                  <div style={{ ...solidCard, padding: 18 }}>
                    <div style={{ color: theme.colors.subtext, fontSize: 14 }}>
                      Total records
                    </div>
                    <strong
                      style={{ display: "block", marginTop: 8, fontSize: 30 }}
                    >
                      {records.length}
                    </strong>
                  </div>

                  <div style={{ ...solidCard, padding: 18 }}>
                    <div style={{ color: theme.colors.subtext, fontSize: 14 }}>
                      Total CPD time
                    </div>
                    <strong
                      style={{ display: "block", marginTop: 8, fontSize: 30 }}
                    >
                      {totalHoursDisplay}
                    </strong>
                  </div>
                </div>

                <div style={{ ...glassCard, padding: 20, marginTop: 18 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <h2 style={{ margin: 0, fontSize: 22 }}>Goals summary</h2>
                      <p
                        style={{
                          margin: "6px 0 0",
                          color: theme.colors.subtext,
                          fontSize: 14,
                        }}
                      >
                        Track your current CPD targets at a glance.
                      </p>
                    </div>
                  </div>

                  {goalsLoading ? (
                    <div style={{ marginTop: 18, color: theme.colors.subtext }}>
                      Loading goals...
                    </div>
                  ) : goals.length === 0 ? (
                    <div
                      style={{
                        marginTop: 18,
                        padding: 18,
                        borderRadius: theme.radius.md,
                        background: "#fff",
                        border: `1px dashed ${theme.colors.border}`,
                        color: theme.colors.subtext,
                      }}
                    >
                      No goals created yet.
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                          gap: 12,
                          marginTop: 18,
                        }}
                      >
                        <div style={{ ...solidCard, padding: 16 }}>
                          <div style={{ color: theme.colors.subtext, fontSize: 14 }}>
                            Active goals
                          </div>
                          <strong style={{ display: "block", marginTop: 8, fontSize: 28 }}>
                            {activeGoals.length}
                          </strong>
                        </div>

                        <div style={{ ...solidCard, padding: 16 }}>
                          <div style={{ color: theme.colors.subtext, fontSize: 14 }}>
                            Closest deadline
                          </div>
                          <strong
                            style={{
                              display: "block",
                              marginTop: 8,
                              fontSize: 18,
                              wordBreak: "break-word",
                            }}
                          >
                            {closestGoal?.date_to ? formatDateDMY(closestGoal.date_to) : "No deadline"}
                          </strong>
                        </div>
                      </div>

                      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                        {activeGoals.slice(0, 3).map((goal) => {
                          const progress = getGoalProgress(goal);

                          return (
                            <div
                              key={goal.id}
                              style={{
                                background: "#fff",
                                borderBottom: `1px solid ${theme.colors.border}`,
                                borderRadius: 0,
                                boxShadow: "none",
                                padding: 16,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  gap: 12,
                                  alignItems: "start",
                                }}
                              >
                                <div>
                                  <strong style={{ display: "block", fontSize: 16 }}>
                                    {goal.title}
                                  </strong>

                                  <div
                                    style={{
                                      marginTop: 6,
                                      color: theme.colors.subtext,
                                      fontSize: 14,
                                    }}
                                  >
                                    {progress.completedHours}h / {goal.target_hours}h
                                  </div>

                                  {goal.date_to && (
                                    <div
                                      style={{
                                        marginTop: 4,
                                        color: theme.colors.subtext,
                                        fontSize: 13,
                                      }}
                                    >
                                      By {formatDateDMY(goal.date_to)}
                                    </div>
                                  )}
                                </div>

                                <span
                                  style={{
                                    ...getStatusChipStyle(
                                      progress.percent >= 100
                                        ? "Completed"
                                        : progress.percent > 0
                                          ? "In Progress"
                                          : "Planned"
                                    ),
                                  }}
                                >
                                  {progress.percent}%
                                </span>
                              </div>

                              <div
                                style={{
                                  marginTop: 12,
                                  height: 10,
                                  borderRadius: 999,
                                  background: "#e5e7eb",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${progress.percent}%`,
                                    height: "100%",
                                    background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%)`,
                                    borderRadius: 999,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                <div style={{ ...glassCard, padding: 20, marginTop: 18 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <h2 style={{ margin: 0, fontSize: 22 }}>Planned activities</h2>
                      <p
                        style={{
                          margin: "6px 0 0",
                          color: theme.colors.subtext,
                          fontSize: 14,
                          marginBottom: 12,
                        }}
                      >
                        Upcoming and overdue CPD activities to complete.
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >

                    <button
                      type="button"
                      onClick={() => setShowDashboardCalendar((prev) => !prev)}
                      style={{
                        ...secondaryButtonStyle,
                        width: 44,
                        height: 44,
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: showDashboardCalendar ? theme.colors.primarySoft : "#fff",
                      }}
                      title="Open calendar"
                    >
                      <CalendarDays size={20} strokeWidth={2} />
                    </button>
                  </div>

                  {showDashboardCalendar && (
                    <div style={{ marginTop: 18 }}>
                      <div style={{ ...glassCard, padding: 20, marginTop: 18 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 12,
                            flexWrap: "wrap",
                            marginBottom: 16,
                          }}
                        >
                          <div>
                            <h2 style={{ margin: 0, fontSize: 22 }}>Planned activities calendar</h2>
                            <p
                              style={{
                                margin: "6px 0 0",
                                color: theme.colors.subtext,
                                fontSize: 14,
                              }}
                            >
                              See upcoming planned CPD activities by date.
                            </p>
                          </div>

                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              type="button"
                              onClick={() =>
                                setCalendarMonth(
                                  new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
                                )
                              }
                              style={secondaryButtonStyle}
                            >
                              ←
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setCalendarMonth(
                                  new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
                                )
                              }
                              style={secondaryButtonStyle}
                            >
                              →
                            </button>
                          </div>
                        </div>

                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 700,
                            marginBottom: 12,
                          }}
                        >
                          {formatCalendarMonth(calendarMonth)}
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(7, 1fr)",
                            gap: 8,
                            marginBottom: 8,
                          }}
                        >
                          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                            <div
                              key={day}
                              style={{
                                textAlign: "center",
                                fontSize: 12,
                                fontWeight: 700,
                                color: theme.colors.subtext,
                                paddingBottom: 4,
                              }}
                            >
                              {day}
                            </div>
                          ))}
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(7, 1fr)",
                            gap: 8,
                          }}
                        >
                          {calendarCells.map((cell) => {
                            if (!cell.date) {
                              return <div key={cell.key} />;
                            }

                            const ymd = toLocalYMD(cell.date);
                            const hasPlanned = !!plannedByDate[ymd]?.length;
                            const isSelected = selectedCalendarDate === ymd;
                            const isToday = ymd === toLocalYMD(new Date());

                            return (
                              <button
                                key={cell.key}
                                type="button"
                                onClick={() => setSelectedCalendarDate(ymd)}
                                style={{
                                  minHeight: 52,
                                  borderRadius: theme.radius.md,
                                  border: `1px solid ${isSelected
                                    ? theme.colors.primary
                                    : isToday
                                      ? theme.colors.primarySoft
                                      : theme.colors.border
                                    }`,
                                  background: isSelected
                                    ? theme.colors.primarySoft
                                    : "#fff",
                                  cursor: "pointer",
                                  position: "relative",
                                  fontWeight: 700,
                                  color: theme.colors.text,
                                }}
                              >
                                {cell.date.getDate()}

                                {hasPlanned && (
                                  <span
                                    style={{
                                      position: "absolute",
                                      bottom: 6,
                                      left: "50%",
                                      transform: "translateX(-50%)",
                                      width: 8,
                                      height: 8,
                                      borderRadius: 999,
                                      background: theme.colors.primary,
                                    }}
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        <div style={{ marginTop: 18 }}>
                          {selectedCalendarDate ? (
                            selectedDayPlannedRecords.length > 0 ? (
                              <div style={{ display: "grid", gap: 10 }}>
                                <div
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: theme.colors.subtext,
                                  }}
                                >
                                  {formatDateDMY(selectedCalendarDate)}
                                </div>

                                {selectedDayPlannedRecords.map((record) => (
                                  <div
                                    key={record.id}
                                    style={{
                                      background: "#fff",
                                      borderBottom: `1px solid ${theme.colors.border}`,
                                      borderRadius: 0,
                                      boxShadow: "none",
                                      padding: 14,
                                    }}
                                  >
                                    <strong style={{ display: "block", fontSize: 15 }}>
                                      {record.activity_title}
                                    </strong>

                                    <div
                                      style={{
                                        marginTop: 6,
                                        color: theme.colors.subtext,
                                        fontSize: 14,
                                      }}
                                    >
                                      {record.cpd_type} • {record.hours}h {record.minutes}m
                                    </div>

                                    <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                                      <button
                                        type="button"
                                        onClick={() => handleEditRecord(record)}
                                        style={secondaryButtonStyle}
                                      >
                                        Open
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleQuickComplete(record)}
                                        style={primaryButtonStyle}
                                      >
                                        Complete
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div
                                style={{
                                  padding: 14,
                                  borderRadius: theme.radius.md,
                                  background: "#fff",
                                  border: `1px dashed ${theme.colors.border}`,
                                  color: theme.colors.subtext,
                                }}
                              >
                                No planned activities for {formatDateDMY(selectedCalendarDate)}.
                              </div>
                            )
                          ) : (
                            <div
                              style={{
                                padding: 14,
                                borderRadius: theme.radius.md,
                                background: "#fff",
                                border: `1px dashed ${theme.colors.border}`,
                                color: theme.colors.subtext,
                              }}
                            >
                              Select a date to view planned activities.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {plannedRecords.length === 0 ? (
                    <div
                      style={{
                        marginTop: 18,
                        padding: 18,
                        borderRadius: theme.radius.md,
                        background: "#fff",
                        border: `1px dashed ${theme.colors.border}`,
                        color: theme.colors.subtext,
                      }}
                    >
                      No planned activities.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
                      {plannedRecords.slice(0, 5).map((record) => {
                        const isOverdue =
                          record.planned_for_date &&
                          record.planned_for_date < toLocalYMD(new Date());

                        return (
                          <div
                            key={record.id}
                            style={{
                              background: "#fff",
                              borderBottom: `1px solid ${theme.colors.border}`,
                              borderRadius: 0,
                              boxShadow: "none",
                              padding: 16,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 12,
                                alignItems: "start",
                                flexWrap: "wrap",
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 180 }}>
                                <strong style={{ display: "block", fontSize: 16 }}>
                                  {record.activity_title}
                                </strong>

                                <div
                                  style={{
                                    marginTop: 6,
                                    color: theme.colors.subtext,
                                    fontSize: 14,
                                  }}
                                >
                                  {record.cpd_type} • {record.hours}h {record.minutes}m
                                </div>

                                <div
                                  style={{
                                    marginTop: 6,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: isOverdue ? theme.colors.danger : theme.colors.subtext,
                                  }}
                                >
                                  {record.planned_for_date
                                    ? isOverdue
                                      ? `Overdue • ${formatDateDMY(record.planned_for_date)}`
                                      : `Planned for ${formatDateDMY(record.planned_for_date)}`
                                    : "No planned date"}
                                </div>
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  flexWrap: "wrap",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleEditRecord(record)}
                                  style={secondaryButtonStyle}
                                >
                                  Open
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleQuickComplete(record)}
                                  style={primaryButtonStyle}
                                >
                                  Complete
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div style={{ ...glassCard, padding: 20, marginTop: 18 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div>
                      <h2 style={{ margin: 0, fontSize: 22 }}>Recent updates</h2>
                      <p
                        style={{
                          margin: "6px 0 0",
                          color: theme.colors.subtext,
                          fontSize: 14,
                        }}
                      >
                        Your latest CPD activity at a glance.
                      </p>
                    </div>
                  </div>

                  {records.length === 0 ? (
                    <div
                      style={{
                        marginTop: 18,
                        padding: 18,
                        borderRadius: theme.radius.md,
                        background: "#fff",
                        border: `1px dashed ${theme.colors.border}`,
                        color: theme.colors.subtext,
                      }}
                    >
                      No CPD records yet.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
                      {records.slice(0, 5).map((record) => (
                        <div
                          key={record.id}
                          style={{
                            background: "#fff",
                            borderBottom: `1px solid ${theme.colors.border}`,
                            borderRadius: 0,
                            boxShadow: "none",
                            padding: 16,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 12,
                              alignItems: "start",
                            }}
                          >
                            <div>
                              <strong style={{ display: "block", fontSize: 16 }}>
                                {record.activity_title}
                              </strong>
                              <div
                                style={{
                                  marginTop: 6,
                                  color: theme.colors.subtext,
                                  fontSize: 14,
                                }}
                              >
                                {record.cpd_type} •{" "}
                                {record.date_completed ? formatDateDMY(record.date_completed) : "No date"} • {record.hours}h {record.minutes}m
                              </div>
                            </div>
                            <span style={getStatusChipStyle(record.status)}>
                              {record.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "records" && (
              <div
                style={{
                  ...glassCard,
                  padding: 20,
                  marginTop: 12,
                  animation: "fadeSlide 0.25s ease",
                  width: "100%",
                  maxWidth: "100%",
                  overflow: "hidden",
                }}
              >
                <div style={{ marginBottom: 12 }}>
                  <h2 style={{ margin: 0, fontSize: 24 }}>My CPD records</h2>

                  <p
                    style={{
                      margin: "6px 0 0",
                      color: theme.colors.subtext,
                      maxWidth: 500,
                    }}
                  >
                    Review, search, filter, and manage your saved activity.
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 16,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (!canCreateRecord) {
                        requirePremium(
                          "Free members can store up to 50 CPD records. Upgrade to Premium for unlimited records."
                        );
                        return;
                      }
                      setShowAddPage(true);
                      setAddPageTab("single");
                    }}
                    style={{
                      ...primaryButtonStyle,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 14px",
                    }}
                  >
                    <Plus size={18} strokeWidth={2} />
                    Add CPD Record
                    {!hasPremiumAccess && records.length >= 50 && (
                      <span style={premiumBadgeStyle}>Premium</span>
                    )}
                  </button>

                </div>
                <div>

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      marginTop: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ ...fieldWrapStyle, marginTop: 12 }}>
                      <label style={fieldLabelStyle}>Share title</label>
                      <input
                        style={inputStyle}
                        value={shareTitle}
                        onChange={(e) => setShareTitle(e.target.value)}
                        placeholder="Optional title for this shared view"
                      />
                    </div>

                    <button
                      onClick={() => downloadCsv(filteredRecords)}
                      style={{
                        ...secondaryButtonStyle,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        width: "fit-content",
                        padding: "10px 14px",
                      }}
                    >
                      <Download size={18} strokeWidth={2} />
                      CSV
                    </button>

                    <button
                      onClick={() => {
                        if (!canDownloadPdf) {
                          requirePremium("PDF export is a Premium feature.");
                          return;
                        }
                        downloadPdf(filteredRecords);
                      }}
                      style={{
                        ...secondaryButtonStyle,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        width: "fit-content",
                        padding: "10px 14px",
                      }}
                    >
                      <Download size={18} strokeWidth={2} />
                      PDF
                      {!hasPremiumAccess && <span style={premiumBadgeStyle}>Premium</span>}
                    </button>

                    <button
                      onClick={handleCreateSharedView}
                      style={{
                        ...secondaryButtonStyle,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        width: "fit-content",
                        padding: "10px 14px",
                      }}
                    >
                      <Share2 size={18} strokeWidth={2} />
                      Share view
                      {!hasPremiumAccess && hasUsedFreeShare && (
                        <span style={premiumBadgeStyle}>Premium</span>
                      )}
                    </button>

                    <button
                      onClick={handleBulkDelete}
                      disabled={selectedIds.length === 0}
                      style={{
                        ...dangerButtonStyle,
                        opacity: selectedIds.length === 0 ? 0.5 : 1,
                        cursor:
                          selectedIds.length === 0 ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        width: "fit-content",
                        padding: "10px 14px",
                      }}
                    >
                      <Trash2 size={18} strokeWidth={2} />
                      Delete selected
                    </button>
                    {shareMessage && (
                      <div
                        style={{
                          padding: "12px 14px",
                          borderRadius: theme.radius.sm,
                          background: theme.colors.primarySoft,
                          color: theme.colors.primaryDark,
                          fontSize: 14,
                          fontWeight: 700,
                          marginTop: 12,
                        }}
                      >
                        {shareMessage}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    marginBottom: 16,
                  }}
                >
                  <button
                    onClick={() => setShowSearchBar((v) => !v)}
                    style={{
                      ...secondaryButtonStyle,
                      width: 44,
                      height: 44,
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Search size={18} strokeWidth={2} />
                  </button>

                  <button
                    onClick={() => {
                      setShowSortPopup(true);
                      setShowFilterPopup(false);
                    }}
                    style={{
                      ...secondaryButtonStyle,
                      width: 44,
                      height: 44,
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ArrowUpDown size={18} strokeWidth={2} />
                  </button>

                  <button
                    onClick={() => {
                      setShowFilterPopup(true);
                      setShowSortPopup(false);
                    }}
                    style={{
                      ...secondaryButtonStyle,
                      width: 44,
                      height: 44,
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <SlidersHorizontal size={18} strokeWidth={2} />
                  </button>
                </div>

                {showSearchBar && (
                  <div
                    style={{
                      background: "#fff",
                      borderBottom: `1px solid ${theme.colors.border}`,
                      borderRadius: 0,
                      boxShadow: "none",
                      padding: 14,
                      marginBottom: 16,
                    }}
                  >
                    <input
                      style={inputStyle}
                      placeholder="Search title, provider, role, outcome..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                )}

                {recordsLoading ? (
                  <div style={{ color: theme.colors.subtext }}>Loading records...</div>
                ) : filteredRecords.length === 0 ? (
                  <div
                    style={{
                      padding: 18,
                      borderRadius: theme.radius.md,
                      background: "#fff",
                      border: `1px dashed ${theme.colors.border}`,
                      color: theme.colors.subtext,
                    }}
                  >
                    No matching CPD records found.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {filteredRecords.map((record) => (
                      <div
                        key={record.id}
                        style={{
                          background: "#fff",
                          borderBottom: `1px solid ${theme.colors.border}`,
                          borderRadius: 0,
                          boxShadow: "none",
                          padding: 14,
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "28px 1fr 44px",
                            gap: 12,
                            alignItems: "start",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(record.id)}
                            onChange={() => toggleSelected(record.id)}
                            style={{ width: 18, height: 18, marginTop: 4 }}
                          />

                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 12,
                                alignItems: "center",
                                marginBottom: 6,
                              }}
                            >
                              <span style={getStatusChipStyle(record.status)}>
                                {record.status}
                              </span>

                              <span
                                style={{
                                  fontSize: 13,
                                  color: theme.colors.subtext,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {formatDateDMY(record.date_completed)}
                              </span>

                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {record.hours}h {record.minutes}m
                              </span>
                            </div>

                            <div
                              style={{
                                fontSize: 16,
                                fontWeight: 700,
                                lineHeight: 1.35,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                wordBreak: "break-word",
                              }}
                            >
                              {record.activity_title}
                            </div>
                          </div>

                          <button
                            onClick={() => setSelectedRecord(record)}
                            style={{
                              ...secondaryButtonStyle,
                              padding: 10,
                              width: 42,
                              height: 42,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Info size={18} strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "goals" && (
              <div
                style={{
                  ...glassCard,
                  padding: 20,
                  marginTop: 12,
                  animation: "fadeSlide 0.25s ease",
                  width: "100%",
                  maxWidth: "100%",
                  overflow: "hidden",
                }}
              >
                <div style={{ marginBottom: 16 }}>
                  <h2 style={{ margin: 0, fontSize: 24 }}>Goals</h2>
                  <p style={{ margin: "6px 0 0", color: theme.colors.subtext }}>
                    Set and track your CPD targets.
                  </p>
                </div>

                <form
                  onSubmit={handleCreateGoal}
                  style={{
                    background: "#fff",
                    borderBottom: `1px solid ${theme.colors.border}`,
                    borderRadius: 0,
                    boxShadow: "none",
                    padding: 16,
                    display: "grid",
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <div style={fieldWrapStyle}>
                    <label style={fieldLabelStyle}>Goal title</label>
                    <input
                      style={inputStyle}
                      value={goalTitle}
                      onChange={(e) => setGoalTitle(e.target.value)}
                      placeholder="e.g. Annual Security CPD"
                      required
                    />
                  </div>

                  <div style={fieldWrapStyle}>
                    <label style={fieldLabelStyle}>CPD hours target</label>
                    <input
                      style={inputStyle}
                      type="number"
                      min="1"
                      step="0.5"
                      value={goalHours}
                      onChange={(e) => setGoalHours(e.target.value)}
                      placeholder="e.g. 20"
                      required
                    />
                  </div>

                  <div style={fieldWrapStyle}>
                    <label style={fieldLabelStyle}>From</label>
                    <input
                      style={inputStyle}
                      type="date"
                      value={goalFrom}
                      onChange={(e) => setGoalFrom(e.target.value)}
                    />
                  </div>

                  <div style={fieldWrapStyle}>
                    <label style={fieldLabelStyle}>By</label>
                    <input
                      style={inputStyle}
                      type="date"
                      value={goalTo}
                      onChange={(e) => setGoalTo(e.target.value)}
                      required
                    />
                  </div>

                  <div style={fieldWrapStyle}>
                    <label style={fieldLabelStyle}>Sectors</label>
                    <input
                      style={inputStyle}
                      value={goalSectors}
                      onChange={(e) => setGoalSectors(e.target.value)}
                      placeholder="e.g. Security, Training, IQA"
                    />
                    <p style={{ marginTop: 8, fontSize: 13, color: theme.colors.subtext }}>
                      Enter one or more sectors separated by commas.
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      marginTop: 4,
                    }}
                  >
                    <button
                      type="submit"
                      style={{
                        ...primaryButtonStyle,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      {editingGoalId ? "Update goal" : "Create goal"}
                      {!editingGoalId && !hasPremiumAccess && hasUsedFreeGoal && (
                        <span style={premiumBadgeStyle}>Premium</span>
                      )}
                    </button>

                    {editingGoalId && (
                      <button
                        type="button"
                        onClick={resetGoalForm}
                        style={secondaryButtonStyle}
                      >
                        Cancel edit
                      </button>
                    )}
                  </div>
                </form>

                {goalsLoading ? (
                  <div style={{ color: theme.colors.subtext }}>Loading goals...</div>
                ) : goals.length === 0 ? (
                  <div
                    style={{
                      padding: 18,
                      borderRadius: theme.radius.md,
                      background: "#fff",
                      border: `1px dashed ${theme.colors.border}`,
                      color: theme.colors.subtext,
                    }}
                  >
                    No goals yet.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {goals.map((goal) => {
                      const progress = getGoalProgress(goal);

                      return (
                        <div
                          key={goal.id}
                          style={{
                            background: "#fff",
                            borderBottom: `1px solid ${theme.colors.border}`,
                            borderRadius: 0,
                            boxShadow: "none",
                            padding: 16,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                            <div>
                              <strong style={{ display: "block", fontSize: 17 }}>
                                {goal.title}
                              </strong>

                              <div
                                style={{
                                  marginTop: 6,
                                  color: theme.colors.subtext,
                                  fontSize: 14,
                                }}
                              >
                                {goal.date_from ? formatDateDMY(goal.date_from) : "No start date"} → {goal.date_to ? formatDateDMY(goal.date_to) : "No end date"}
                              </div>

                              <div
                                style={{
                                  marginTop: 6,
                                  color: theme.colors.subtext,
                                  fontSize: 14,
                                }}
                              >
                                Target: {goal.target_hours}h • Completed: {progress.completedHours}h
                              </div>

                              {goal.sectors?.length > 0 && (
                                <div
                                  style={{
                                    marginTop: 6,
                                    color: theme.colors.subtext,
                                    fontSize: 14,
                                  }}
                                >
                                  {goal.sectors.join(", ")}
                                </div>
                              )}
                            </div>

                            <div
                              style={{
                                minWidth: 56,
                                textAlign: "right",
                                fontWeight: 700,
                                color: theme.colors.primary,
                              }}
                            >
                              {progress.percent}%
                            </div>
                          </div>

                          <div
                            style={{
                              marginTop: 12,
                              height: 10,
                              borderRadius: 999,
                              background: "#e5e7eb",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${progress.percent}%`,
                                height: "100%",
                                background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%)`,
                                borderRadius: 999,
                              }}
                            />
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              marginTop: 10,
                            }}
                          >
                            <button
                              onClick={() => startEditGoal(goal)}
                              style={secondaryButtonStyle}
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => handleDeleteGoal(goal.id)}
                              style={dangerButtonStyle}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "share" && (
              <div
                style={{
                  ...glassCard,
                  padding: 20,
                  marginTop: 12,
                  animation: "fadeSlide 0.25s ease",
                  width: "100%",
                  maxWidth: "100%",
                  overflow: "hidden",
                }}
              >
                <div style={{ marginBottom: 16 }}>
                  <h2 style={{ margin: 0, fontSize: 24 }}>Shared views</h2>
                  <p style={{ margin: "6px 0 0", color: theme.colors.subtext }}>
                    Manage your live share links.
                  </p>
                </div>

                {shareMessage && (
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: theme.radius.sm,
                      background: theme.colors.primarySoft,
                      color: theme.colors.primaryDark,
                      fontSize: 14,
                      fontWeight: 700,
                      marginBottom: 12,
                    }}
                  >
                    {shareMessage}
                  </div>
                )}

                {sharedViewsLoading ? (
                  <div style={{ color: theme.colors.subtext }}>Loading shared views...</div>
                ) : sharedViews.length === 0 ? (
                  <div
                    style={{
                      padding: 18,
                      borderRadius: theme.radius.md,
                      background: "#fff",
                      border: `1px dashed ${theme.colors.border}`,
                      color: theme.colors.subtext,
                    }}
                  >
                    No shared views yet.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {sharedViews.map((view) => (
                      <div
                        key={view.id}
                        style={{
                          background: "#fff",
                          borderBottom: `1px solid ${theme.colors.border}`,
                          borderRadius: 0,
                          boxShadow: "none",
                          padding: 16,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            flexWrap: "wrap",
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 180 }}>
                            <strong style={{ display: "block", fontSize: 16 }}>
                              {view.title || "Untitled shared view"}
                            </strong>

                            <div
                              style={{
                                marginTop: 6,
                                color: theme.colors.subtext,
                                fontSize: 14,
                              }}
                            >
                              Search: {view.search_query || "None"} • Sort: {view.sort_by || "newest"}
                            </div>

                            <div
                              style={{
                                marginTop: 6,
                                color: theme.colors.subtext,
                                fontSize: 14,
                              }}
                            >
                              Status: {view.filter_status || "all"} • Type: {view.filter_type || "all"} • Evidence: {view.filter_evidence || "all"}
                            </div>

                            <div
                              style={{
                                marginTop: 6,
                                color: theme.colors.subtext,
                                fontSize: 14,
                              }}
                            >
                              Period: {view.filter_date_from ? formatDateDMY(view.filter_date_from) : "Any"} → {view.filter_date_to ? formatDateDMY(view.filter_date_to) : "Any"}
                            </div>

                            <div
                              style={{
                                marginTop: 6,
                                color: theme.colors.subtext,
                                fontSize: 14,
                              }}
                            >
                              Duration: {view.filter_min_minutes ?? "Any"} min → {view.filter_max_minutes ?? "Any"} min
                            </div>

                            <div
                              style={{
                                marginTop: 6,
                                color: theme.colors.subtext,
                                fontSize: 14,
                              }}
                            >
                              Provider: {view.filter_provider || "Any"} • Learning: {view.filter_learning_method || "all"} • Certificate: {view.filter_certificate || "all"}
                            </div>

                            <div
                              style={{
                                marginTop: 6,
                                color: theme.colors.subtext,
                                fontSize: 14,
                              }}
                            >
                              Sectors: {view.filter_sectors || "Any"}
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                              alignItems: "flex-start",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => openShareLink(view.share_token)}
                              title="Open link"
                              style={{
                                ...secondaryButtonStyle,
                                width: 42,
                                height: 42,
                                padding: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <ExternalLink size={18} strokeWidth={2} />
                            </button>

                            <button
                              type="button"
                              onClick={() => copyShareLink(view.share_token)}
                              title="Copy link"
                              style={{
                                ...secondaryButtonStyle,
                                width: 42,
                                height: 42,
                                padding: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Copy size={18} strokeWidth={2} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteSharedView(view.id)}
                              title="Delete link"
                              style={{
                                ...dangerButtonStyle,
                                width: 42,
                                height: 42,
                                padding: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Trash2 size={18} strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "articles" && (
              <div
                style={{
                  ...glassCard,
                  padding: 20,
                  marginTop: 12,
                  animation: "fadeSlide 0.25s ease",
                  width: "100%",
                  maxWidth: "100%",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    marginBottom: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h2 style={{ margin: 0, fontSize: 24 }}>Articles</h2>
                    <p style={{ margin: "6px 0 0", color: theme.colors.subtext }}>
                      Helpful reading about CPD and professional development.
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      marginBottom: 16,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setShowArticleSearch((v) => !v)}
                      style={{
                        ...secondaryButtonStyle,
                        width: 44,
                        height: 44,
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Search size={18} strokeWidth={2} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowArticleSort((v) => !v)}
                      style={{
                        ...secondaryButtonStyle,
                        width: 44,
                        height: 44,
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ArrowUpDown size={18} strokeWidth={2} />
                    </button>
                  </div>

                  {showArticleSearch && (
                    <div
                      style={{
                        background: "#fff",
                        borderBottom: `1px solid ${theme.colors.border}`,
                        borderRadius: 0,
                        boxShadow: "none",
                        padding: 14,
                        marginBottom: 16,
                      }}
                    >
                      <input
                        style={inputStyle}
                        placeholder="Search articles..."
                        value={articleSearchQuery}
                        onChange={(e) => setArticleSearchQuery(e.target.value)}
                      />
                    </div>
                  )}

                  {showArticleSort && (
                    <div
                      style={{
                        background: "#fff",
                        borderBottom: `1px solid ${theme.colors.border}`,
                        borderRadius: 0,
                        boxShadow: "none",
                        padding: 14,
                        marginBottom: 16,
                        display: "grid",
                        gap: 10,
                      }}
                    >
                      {[
                        ["newest", "Newest first"],
                        ["oldest", "Oldest first"],
                        ["titleAZ", "Title A to Z"],
                        ["titleZA", "Title Z to A"],
                      ].map(([value, label]) => {
                        const isActive = articleSortBy === value;

                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              setArticleSortBy(value);
                              setShowArticleSort(false);
                            }}
                            style={{
                              width: "100%",
                              padding: "14px 16px",
                              textAlign: "left",
                              border: `1px solid ${isActive ? theme.colors.primary : theme.colors.border
                                }`,
                              background: isActive ? theme.colors.primarySoft : "#fff",
                              borderRadius: theme.radius.sm,
                              cursor: "pointer",
                              fontWeight: 700,
                              color: isActive ? theme.colors.primaryDark : theme.colors.text,
                            }}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {isAdmin && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => setArticlePreviewMode((prev) => !prev)}
                        style={{
                          ...secondaryButtonStyle,
                          background: articlePreviewMode ? theme.colors.primarySoft : "#fff",
                          color: articlePreviewMode ? theme.colors.primaryDark : theme.colors.text,
                        }}
                      >
                        {articlePreviewMode ? "Exit preview" : "Preview"}
                      </button>

                      {!articlePreviewMode && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddArticlePage(true);
                            setEditingArticleId(null);
                          }}
                          style={{
                            ...primaryButtonStyle,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <Plus size={18} strokeWidth={2} />
                          Add article
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {showAddArticlePage && isAdmin && !articlePreviewMode ? (
                  <div
                    style={{
                      background: "#fff",
                      borderBottom: `1px solid ${theme.colors.border}`,
                      borderRadius: 0,
                      boxShadow: "none",
                      padding: 16,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        resetArticleForm();
                        setShowAddArticlePage(false);
                      }}
                      style={{
                        ...secondaryButtonStyle,
                        padding: "10px 14px",
                        marginBottom: 16,
                      }}
                    >
                      ← Back
                    </button>

                    <form
                      onSubmit={handleSaveArticle}
                      style={{
                        display: "grid",
                        gap: 12,
                      }}
                    >
                      <h3 style={{ margin: 0, fontSize: 22 }}>
                        {editingArticleId ? "Edit article" : "Add article"}
                      </h3>

                      <div style={fieldWrapStyle}>
                        <label style={fieldLabelStyle}>Title</label>
                        <input
                          style={inputStyle}
                          value={articleTitle}
                          onChange={(e) => setArticleTitle(e.target.value)}
                          required
                        />
                      </div>

                      <div style={fieldWrapStyle}>
                        <label style={fieldLabelStyle}>Article image</label>
                        <input
                          style={inputStyle}
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp"
                          onChange={(e) => setArticleImageFile(e.target.files?.[0] || null)}
                        />
                      </div>

                      <div style={fieldWrapStyle}>
                        <label style={fieldLabelStyle}>Summary</label>
                        <textarea
                          style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
                          value={articleSummary}
                          onChange={(e) => setArticleSummary(e.target.value)}
                        />
                      </div>

                      <div style={fieldWrapStyle}>
                        <label style={fieldLabelStyle}>Content</label>
                        <textarea
                          style={{ ...inputStyle, minHeight: 180, resize: "vertical" }}
                          value={articleContent}
                          onChange={(e) => setArticleContent(e.target.value)}
                        />
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "4px 0",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={articlePublished}
                          onChange={(e) => setArticlePublished(e.target.checked)}
                          style={{ width: 18, height: 18, margin: 0 }}
                        />
                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: theme.colors.text,
                          }}
                        >
                          Publish
                        </span>
                      </div>

                      {articleMessage && (
                        <div
                          style={{
                            padding: "12px 14px",
                            borderRadius: theme.radius.sm,
                            background: theme.colors.primarySoft,
                            color: theme.colors.primaryDark,
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        >
                          {articleMessage}
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button type="submit" style={primaryButtonStyle}>
                          {editingArticleId ? "Update article" : "Save article"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            resetArticleForm();
                            setShowAddArticlePage(false);
                          }}
                          style={secondaryButtonStyle}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                ) : selectedArticle ? (
                  <div
                    style={{
                      background: "#fff",
                      borderBottom: `1px solid ${theme.colors.border}`,
                      borderRadius: 0,
                      boxShadow: "none",
                      padding: 16,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedArticle(null)}
                      style={{
                        ...secondaryButtonStyle,
                        padding: "10px 14px",
                        marginBottom: 16,
                      }}
                    >
                      ← Back to articles
                    </button>


                    <img
                      src={selectedArticle.image_url || defaultArticleImage}
                      alt={selectedArticle.title}
                      style={{
                        width: "100%",
                        height: 240,
                        objectFit: "cover",
                        borderRadius: theme.radius.md,
                        marginBottom: 16,
                        display: "block",
                      }}
                    />

                    <h3 style={{ margin: 0, fontSize: 26 }}>
                      {selectedArticle.title}
                    </h3>

                    {selectedArticle.summary && (
                      <p
                        style={{
                          margin: "10px 0 0",
                          color: theme.colors.subtext,
                          fontSize: 15,
                          lineHeight: 1.6,
                        }}
                      >
                        {selectedArticle.summary}
                      </p>
                    )}

                    <div
                      style={{
                        marginTop: 18,
                        lineHeight: 1.8,
                        fontSize: 15,
                        color: theme.colors.text,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {selectedArticle.content || "No article content yet."}
                    </div>
                  </div>
                ) : articlesLoading ? (
                  <div style={{ color: theme.colors.subtext }}>Loading articles...</div>
                ) : showMemberArticleView ? (
                  filteredArticles.length === 0 ? (
                    <div
                      style={{
                        padding: 18,
                        borderRadius: theme.radius.md,
                        background: "#fff",
                        border: `1px dashed ${theme.colors.border}`,
                        color: theme.colors.subtext,
                      }}
                    >
                      No articles available yet.
                    </div>

                  ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                      {filteredArticles.map((article) => (
                        <div
                          key={article.id}
                          style={{
                            background: "#fff",
                            borderBottom: `1px solid ${theme.colors.border}`,
                            borderRadius: 0,
                            boxShadow: "none",
                            padding: 16,
                          }}
                        >
                          <img
                            src={article.image_url || defaultArticleImage}
                            alt={article.title}
                            style={{
                              width: "100%",
                              height: 160,
                              objectFit: "cover",
                              borderRadius: theme.radius.md,
                              marginBottom: 12,
                            }}
                          />

                          <strong style={{ display: "block", fontSize: 16 }}>
                            {article.title}
                          </strong>
                          <div
                            style={{
                              marginTop: 6,
                              color: theme.colors.subtext,
                              fontSize: 14,
                            }}
                          >
                            {article.summary || "No summary yet."}
                          </div>
                          <div style={{ marginTop: 12 }}>
                            <button
                              type="button"
                              onClick={() => {
                                if (!canReadArticles) {
                                  requirePremium("Reading full articles is a Premium feature.");
                                  return;
                                }
                                setSelectedArticle(article);
                              }}
                              style={{
                                ...secondaryButtonStyle,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                              }}
                            >
                              Read More
                              {!hasPremiumAccess && <span style={premiumBadgeStyle}>Premium</span>}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                  )
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {filteredArticles.length === 0 ? (
                      <div
                        style={{
                          padding: 18,
                          borderRadius: theme.radius.md,
                          background: "#fff",
                          border: `1px dashed ${theme.colors.border}`,
                          color: theme.colors.subtext,
                        }}
                      >
                        No articles created yet.
                      </div>
                    ) : (
                      filteredArticles.map((article) => (
                        <div
                          key={article.id}
                          style={{
                            background: "#fff",
                            borderBottom: `1px solid ${theme.colors.border}`,
                            borderRadius: 0,
                            boxShadow: "none",
                            padding: 16,
                          }}
                        >
                          <img
                            src={article.image_url || defaultArticleImage}
                            alt={article.title}
                            style={{
                              width: "100%",
                              height: 160,
                              objectFit: "cover",
                              borderRadius: theme.radius.md,
                              marginBottom: 12,
                            }}
                          />
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 12,
                              flexWrap: "wrap",
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 180 }}>
                              <strong style={{ display: "block", fontSize: 16 }}>
                                {article.title}
                              </strong>

                              <div
                                style={{
                                  marginTop: 6,
                                  color: theme.colors.subtext,
                                  fontSize: 14,
                                }}
                              >
                                {article.summary || "No summary yet."}
                              </div>
                              <div style={{ marginTop: 12 }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedArticle(article)}
                                  style={secondaryButtonStyle}
                                >
                                  Read More
                                </button>
                              </div>
                            </div>

                            <div
                              style={{
                                marginTop: 6,
                                fontSize: 13,
                                fontWeight: 700,
                                color: articlePublished ? theme.colors.success : theme.colors.subtext,
                              }}
                            >
                              {articlePublished ? "Published" : "Draft"}
                            </div>

                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <button
                                type="button"
                                onClick={() => startEditArticle(article)}
                                style={secondaryButtonStyle}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteArticle(article.id)}
                                style={dangerButtonStyle}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "settings" && (
              <div
                style={{
                  ...glassCard,
                  padding: 20,
                  marginTop: 12,
                  animation: "fadeSlide 0.25s ease",
                  width: "100%",
                  maxWidth: "100%",
                  overflow: "hidden",
                }}
              >
                <div style={{ marginBottom: 16 }}>
                  <h2 style={{ margin: 0, fontSize: 24 }}>Settings</h2>
                  <p style={{ margin: "6px 0 0", color: theme.colors.subtext }}>
                    Manage your account and security settings.
                  </p>
                </div>

                <div style={{ display: "grid", gap: 16 }}>
                  <form
                    onSubmit={handleUpdateProfile}
                    style={{
                      background: "#fff",
                      borderBottom: `1px solid ${theme.colors.border}`,
                      borderRadius: 0,
                      boxShadow: "none",
                      padding: 16,
                      display: "grid",
                      gap: 12,
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: 18 }}>Profile details</h3>

                    <div style={fieldWrapStyle}>
                      <label style={fieldLabelStyle}>Forename</label>
                      <input
                        style={inputStyle}
                        value={forename}
                        onChange={(e) => setForename(e.target.value)}
                        required
                      />
                    </div>

                    <div style={fieldWrapStyle}>
                      <label style={fieldLabelStyle}>Surname</label>
                      <input
                        style={inputStyle}
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        required
                      />
                    </div>

                    <div style={fieldWrapStyle}>
                      <label style={fieldLabelStyle}>Main job role</label>
                      <input
                        style={inputStyle}
                        value={mainJobRole}
                        onChange={(e) => setMainJobRole(e.target.value)}
                      />
                    </div>

                    <div style={fieldWrapStyle}>
                      <label style={fieldLabelStyle}>Secondary job role</label>
                      <input
                        style={inputStyle}
                        value={secondaryJobRole}
                        onChange={(e) => setSecondaryJobRole(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      style={secondaryButtonStyle}
                      disabled={settingsLoading}
                    >
                      Save profile
                    </button>
                  </form>
                  <form
                    onSubmit={handleUpdateEmail}
                    style={{
                      background: "#fff",
                      borderBottom: `1px solid ${theme.colors.border}`,
                      borderRadius: 0,
                      boxShadow: "none",
                      padding: 16,
                      display: "grid",
                      gap: 12,
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: 18 }}>Change email</h3>
                    <div style={fieldWrapStyle}>
                      <label style={fieldLabelStyle}>Email address</label>
                      <input
                        style={inputStyle}
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      style={secondaryButtonStyle}
                      disabled={settingsLoading}
                    >
                      Update email
                    </button>
                  </form>

                  <form
                    onSubmit={handleUpdatePassword}
                    style={{
                      background: "#fff",
                      borderBottom: `1px solid ${theme.colors.border}`,
                      borderRadius: 0,
                      boxShadow: "none",
                      padding: 16,
                      display: "grid",
                      gap: 12,
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: 18 }}>Change password</h3>
                    <div style={fieldWrapStyle}>
                      <label style={fieldLabelStyle}>New password</label>
                      <input
                        style={inputStyle}
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      style={secondaryButtonStyle}
                      disabled={settingsLoading}
                    >
                      Update password
                    </button>
                  </form>

                  <div
                    style={{
                      background: "#fff",
                      borderBottom: `1px solid ${theme.colors.border}`,
                      borderRadius: 0,
                      boxShadow: "none",
                      padding: 16,
                      display: "grid",
                      gap: 12,
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: 18 }}>Session</h3>
                    <button
                      onClick={handleLogout}
                      style={{
                        ...secondaryButtonStyle,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <LogOut size={18} strokeWidth={2} />
                      Log out
                    </button>
                  </div>

                  <div
                    style={{
                      background: "#fff",
                      borderBottom: `1px solid ${theme.colors.border}`,
                      borderRadius: 0,
                      boxShadow: "none",
                      padding: 16,
                      display: "grid",
                      gap: 12,
                      border: "1px solid rgba(220,38,38,0.15)",
                    }}
                  >
                    <h3
                      style={{ margin: 0, fontSize: 18, color: theme.colors.danger }}
                    >
                      Danger zone
                    </h3>
                    <button
                      onClick={handleDeleteAccount}
                      style={{
                        ...dangerButtonStyle,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        width: "fit-content",
                      }}
                    >
                      <Trash2 size={18} strokeWidth={2} />
                      Delete account
                    </button>
                  </div>

                  {settingsMessage && (
                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: theme.radius.sm,
                        background: theme.colors.primarySoft,
                        color: theme.colors.primaryDark,
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      {settingsMessage}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>)}
      </div>

      {showSortPopup && (
        <div style={modalOverlayStyle} onClick={() => setShowSortPopup(false)}>
          <div style={modalCardWrapStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalCardStyle}>
              <div style={sheetHeaderStyle}>
                <button
                  onClick={() => setShowSortPopup(false)}
                  style={{
                    position: "absolute",
                    top: 14,
                    right: 14,
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    border: `1px solid ${theme.colors.border}`,
                    background: "#fff",
                    color: theme.colors.text,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: 22,
                    lineHeight: 1,
                    boxShadow: theme.colors.shadowSoft,
                    padding: 0,
                  }}
                >
                  ×
                </button>

                <div style={{ paddingRight: 52 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: theme.colors.subtext,
                      letterSpacing: 0.3,
                      textTransform: "uppercase",
                      marginBottom: 8,
                    }}
                  >
                    Records
                  </div>

                  <h2 style={{ margin: 0, fontSize: 30, lineHeight: 1.2 }}>
                    Sort
                  </h2>

                  <p
                    style={{
                      margin: "8px 0 0",
                      color: theme.colors.subtext,
                    }}
                  >
                    Choose how your records are ordered.
                  </p>
                </div>
              </div>

              {[
                ["newest", "Newest first"],
                ["oldest", "Oldest first"],
                ["hoursHigh", "Hours high to low"],
                ["hoursLow", "Hours low to high"],
                ["titleAZ", "Title A to Z"],
                ["titleZA", "Title Z to A"],
              ].map(([value, label]) => {
                const isActive = sortBy === value;

                return (
                  <button
                    key={value}
                    onClick={() => {
                      setSortBy(value);
                      setShowSortPopup(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "16px",
                      textAlign: "left",
                      border: "none",
                      borderBottom: `1px solid ${theme.colors.border}`,
                      background: isActive ? theme.colors.primarySoft : "#fff",
                      cursor: "pointer",
                      borderRadius: 0,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        color: isActive ? theme.colors.primary : theme.colors.text,
                      }}
                    >
                      {label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showFilterPopup && (
        <div style={modalOverlayStyle} onClick={() => setShowFilterPopup(false)}>
          <div style={modalCardWrapStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalCardStyle}>
              <div style={sheetHeaderStyle}>
                <button
                  onClick={() => setShowFilterPopup(false)}
                  style={{
                    position: "absolute",
                    top: 14,
                    right: 14,
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    border: `1px solid ${theme.colors.border}`,
                    background: "#fff",
                    color: theme.colors.text,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: 22,
                    lineHeight: 1,
                    boxShadow: theme.colors.shadowSoft,
                    padding: 0,
                  }}
                >
                  ×
                </button>

                <div style={{ paddingRight: 52 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: theme.colors.subtext,
                      letterSpacing: 0.3,
                      textTransform: "uppercase",
                      marginBottom: 8,
                    }}
                  >
                    Records
                  </div>

                  <h2 style={{ margin: 0, fontSize: 30, lineHeight: 1.2 }}>
                    Filter
                  </h2>

                  <p
                    style={{
                      margin: "8px 0 0",
                      color: theme.colors.subtext,
                    }}
                  >
                    Narrow down the records you want to see.
                  </p>
                </div>
              </div>

              <div style={sheetSectionStyle}>
                <label style={fieldLabelStyle}>Status</label>
                <select
                  style={inputStyle}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All statuses</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div style={sheetSectionStyle}>
                <label style={fieldLabelStyle}>CPD type</label>
                <select
                  style={inputStyle}
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">All types</option>
                  {cpdTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div style={sheetSectionStyle}>
                <label style={fieldLabelStyle}>Evidence</label>
                <select
                  style={inputStyle}
                  value={filterEvidence}
                  onChange={(e) => setFilterEvidence(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="yes">With evidence</option>
                  <option value="no">Without evidence</option>
                </select>
              </div>

              <div style={sheetSectionStyle}>
                <label style={fieldLabelStyle}>From date</label>
                <input
                  style={inputStyle}
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
              </div>

              <div style={sheetSectionStyle}>
                <label style={fieldLabelStyle}>To date</label>
                <input
                  style={inputStyle}
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                />
              </div>

              <div style={sheetSectionStyle}>
                <label style={fieldLabelStyle}>Min duration (minutes)</label>
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  value={filterMinMinutes}
                  onChange={(e) => setFilterMinMinutes(e.target.value)}
                  placeholder="e.g. 30"
                />
              </div>

              <div style={sheetSectionStyle}>
                <label style={fieldLabelStyle}>Max duration (minutes)</label>
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  value={filterMaxMinutes}
                  onChange={(e) => setFilterMaxMinutes(e.target.value)}
                  placeholder="e.g. 480"
                />
              </div>

              <div style={sheetSectionStyle}>
                <label style={fieldLabelStyle}>Provider</label>
                <input
                  style={inputStyle}
                  value={filterProvider}
                  onChange={(e) => setFilterProvider(e.target.value)}
                  placeholder="Search by provider"
                />
              </div>

              <div style={sheetSectionStyle}>
                <label style={fieldLabelStyle}>Learning method</label>
                <select
                  style={inputStyle}
                  value={filterLearningMethod}
                  onChange={(e) => setFilterLearningMethod(e.target.value)}
                >
                  <option value="all">All learning methods</option>
                  {learningMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              <div style={sheetSectionStyle}>
                <label style={fieldLabelStyle}>Certificate available</label>
                <select
                  style={inputStyle}
                  value={filterCertificate}
                  onChange={(e) => setFilterCertificate(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="yes">With certificate</option>
                  <option value="no">Without certificate</option>
                </select>
              </div>

              <div style={sheetSectionStyle}>
                <label style={fieldLabelStyle}>Sectors</label>
                <input
                  style={inputStyle}
                  value={filterSectors}
                  onChange={(e) => setFilterSectors(e.target.value)}
                  placeholder="e.g. Security, Training"
                />
                <p style={{ marginTop: 8, fontSize: 13, color: theme.colors.subtext }}>
                  Separate multiple sectors with commas.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  padding: "16px",
                  background: "#fff",
                }}
              >
                <button
                  onClick={clearAllFilters}
                  style={{
                    ...dangerButtonStyle,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Trash2 size={16} />
                  Remove all filters
                </button>

                <button
                  onClick={() => setShowFilterPopup(false)}
                  style={secondaryButtonStyle}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedRecord && (
        <div style={modalOverlayStyle} onClick={() => setSelectedRecord(null)}>
          <div style={modalCardWrapStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalCardStyle}>
              <div style={sheetHeaderStyle}>
                <button
                  onClick={() => setSelectedRecord(null)}
                  style={{
                    position: "absolute",
                    top: 14,
                    right: 14,
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    border: `1px solid ${theme.colors.border}`,
                    background: "#fff",
                    color: theme.colors.text,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: 22,
                    lineHeight: 1,
                    boxShadow: theme.colors.shadowSoft,
                    padding: 0,
                  }}
                >
                  ×
                </button>

                <div style={{ paddingRight: 52 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: theme.colors.subtext,
                      letterSpacing: 0.3,
                      textTransform: "uppercase",
                      marginBottom: 8,
                    }}
                  >
                    CPD Record
                  </div>

                  <h2
                    style={{
                      margin: 0,
                      fontSize: 30,
                      lineHeight: 1.2,
                      wordBreak: "break-word",
                    }}
                  >
                    {selectedRecord.activity_title}
                  </h2>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                      marginTop: 12,
                    }}
                  >
                    <span style={getStatusChipStyle(selectedRecord.status)}>
                      {selectedRecord.status}
                    </span>

                    <span
                      style={{
                        fontSize: 14,
                        color: theme.colors.subtext,
                      }}
                    >
                      {formatDateDMY(selectedRecord.date_completed)}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 18,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => handleEditRecord(selectedRecord)}
                    style={{
                      ...secondaryButtonStyle,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <SquarePen size={18} strokeWidth={2} />
                    Edit
                  </button>

                  {selectedRecord.certificate_file_url && (
                    <a
                      href={selectedRecord.certificate_file_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        ...secondaryButtonStyle,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        textDecoration: "none",
                      }}
                    >
                      <Download size={18} strokeWidth={2} />
                      Certificate
                    </a>
                  )}
                </div>
              </div>

              <div style={sheetSectionStyle}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        color: theme.colors.subtext,
                        marginBottom: 4,
                      }}
                    >
                      Type
                    </div>
                    <div style={{ fontWeight: 700 }}>
                      {selectedRecord.cpd_type}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        color: theme.colors.subtext,
                        marginBottom: 4,
                      }}
                    >
                      Duration
                    </div>
                    <div style={{ fontWeight: 700 }}>
                      {selectedRecord.hours}h {selectedRecord.minutes}m
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        color: theme.colors.subtext,
                        marginBottom: 4,
                      }}
                    >
                      Provider
                    </div>
                    <div style={{ fontWeight: 700 }}>
                      {selectedRecord.provider || "Not provided"}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        color: theme.colors.subtext,
                        marginBottom: 4,
                      }}
                    >
                      Learning method
                    </div>
                    <div style={{ fontWeight: 700 }}>
                      {selectedRecord.learning_method || "Not provided"}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 13, color: theme.colors.subtext, marginBottom: 4 }}>
                      Planned for
                    </div>
                    <div style={{ fontWeight: 700 }}>
                      {selectedRecord.planned_for_date ? formatDateDMY(selectedRecord.planned_for_date) : "Not provided"}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 13, color: theme.colors.subtext, marginBottom: 4 }}>
                      Expiry date
                    </div>
                    <div style={{ fontWeight: 700 }}>
                      {selectedRecord.expiry_date ? formatDateDMY(selectedRecord.expiry_date) : "Not provided"}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 13, color: theme.colors.subtext, marginBottom: 4 }}>
                      This activity needs renewal
                    </div>
                    <div style={{ fontWeight: 700 }}>
                      {selectedRecord.renewal_required ? "Yes" : "No"}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 13, color: theme.colors.subtext, marginBottom: 4 }}>
                      Sectors
                    </div>
                    <div style={{ fontWeight: 700 }}>
                      {selectedRecord.sectors?.length ? selectedRecord.sectors.join(", ") : "Not provided"}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        color: theme.colors.subtext,
                        marginBottom: 4,
                      }}
                    >
                      Evidence available
                    </div>
                    <div style={{ fontWeight: 700 }}>
                      {selectedRecord.evidence_available ? "Yes" : "No"}
                    </div>
                  </div>
                </div>
              </div>

              <div style={sheetSectionStyle}>
                <div
                  style={{
                    fontSize: 13,
                    color: theme.colors.subtext,
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: 0.3,
                    fontWeight: 700,
                  }}
                >
                  Description
                </div>
                <div style={{ lineHeight: 1.6 }}>
                  {selectedRecord.description || "Not provided"}
                </div>
              </div>

              <div style={sheetSectionStyle}>
                <div
                  style={{
                    fontSize: 13,
                    color: theme.colors.subtext,
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: 0.3,
                    fontWeight: 700,
                  }}
                >
                  Outcome / Learning Summary
                </div>
                <div style={{ lineHeight: 1.6 }}>
                  {selectedRecord.outcome || "Not provided"}
                </div>
              </div>

              {selectedRecord.certificate_file_url && (
                <div style={sheetSectionStyle}>
                  <div
                    style={{
                      fontSize: 13,
                      color: theme.colors.subtext,
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: 0.3,
                      fontWeight: 700,
                    }}
                  >
                    Certificate
                  </div>

                  <a
                    href={selectedRecord.certificate_file_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: theme.colors.primary,
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    View file
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          position: "fixed",
          bottom: 12,
          left: 12,
          right: 12,
          width: "auto",
          maxWidth: "100%",
          margin: 0,
          background: "rgba(255,255,255,0.94)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: `1px solid ${theme.colors.border}`,
          boxShadow: theme.colors.shadow,
          display: "flex",
          justifyContent: "space-around",
          padding: 10,
          borderRadius: theme.radius.xl,
          zIndex: 1000,
        }}
      >
        {(["dashboard", "records", "goals", "share", "articles", "settings"] as const).map((tab) => {
          const isActive = activeTab === tab;

          const icon =
            tab === "dashboard" ? (
              <House size={20} strokeWidth={2} />
            ) : tab === "records" ? (
              <List size={20} strokeWidth={2} />
            ) : tab === "goals" ? (
              <Trophy size={20} strokeWidth={2} />
            ) : tab === "share" ? (
              <Share2 size={20} strokeWidth={2} />
            ) : tab === "articles" ? (
              <BookOpen size={20} strokeWidth={2} />
            ) : (
              <Settings size={20} strokeWidth={2} />
            );

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                margin: "0 4px",
                background: isActive
                  ? `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%)`
                  : theme.colors.tabIdle,
                color: isActive ? "#fff" : theme.colors.text,
                border: "none",
                borderRadius: theme.radius.md,
                padding: "13px 10px",
                transition: theme.transition,
                boxShadow: isActive
                  ? "0 10px 20px rgba(37, 99, 235, 0.22)"
                  : "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {icon}
            </button>
          );
        })}
      </div>

      {showPremiumPopup && (
        <div style={modalOverlayStyle} onClick={() => setShowPremiumPopup(false)}>
          <div
            style={modalCardWrapStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={modalCardStyle}>
              <div style={sheetHeaderStyle}>
                <h2 style={{ margin: 0 }}>Upgrade required</h2>
                <p style={{ margin: "8px 0 0", color: theme.colors.subtext }}>
                  {premiumReason}
                </p>
              </div>

              <div style={sheetSectionStyle}>
                <div style={{ display: "grid", gap: 8, color: theme.colors.text }}>
                  <div>Premium includes</div>
                  <div>• Unlimited goals</div>
                  <div>• Unlimited CPD records</div>
                  <div>• PDF export</div>
                  <div>• Bulk upload</div>
                  <div>• Unlimited live share links</div>
                  <div>• Articles</div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
                  <button
                    style={primaryButtonStyle}
                    onClick={handleUpgradeToPremium}
                    disabled={purchaseBusy || !premiumProduct}
                  >
                    {purchaseBusy
                      ? "Please wait..."
                      : premiumProduct
                        ? `Upgrade to Premium • ${premiumProduct.priceString}`
                        : "Loading price..."}
                  </button>

                  <button
                    style={secondaryButtonStyle}
                    onClick={handleRestorePurchases}
                    disabled={purchaseBusy}
                  >
                    Restore Purchases
                  </button>

                  <button
                    style={secondaryButtonStyle}
                    onClick={() => setShowPremiumPopup(false)}
                  >
                    Maybe later
                  </button>
                  {purchaseMessage && (
                    <p style={{ marginTop: 12, color: theme.colors.subtext }}>
                      {purchaseMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

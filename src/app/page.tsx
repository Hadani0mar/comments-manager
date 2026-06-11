"use client";

import { useState, useEffect } from "react";
import { marked } from "marked";
import { 
  MessageSquare, 
  RefreshCw, 
  LogOut, 
  Sun, 
  Moon, 
  Search, 
  Filter, 
  Calendar, 
  Copy, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Edit3, 
  Loader2, 
  XCircle,
  FileText,
  User,
  KeyRound,
  ChevronDown
} from "lucide-react";

interface CommentRow {
  id: number;
  POST_ID: string;
  TEXT: string;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedPostId, setSelectedPostId] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>("");

  // Pagination states
  const [visibleCount, setVisibleCount] = useState<number>(5);

  // Day/Light Mode state
  const [isLightMode, setIsLightMode] = useState<boolean>(false);

  // Auth States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [usernameInput, setUsernameInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  
  // Modal states
  const [editingRow, setEditingRow] = useState<CommentRow | null>(null);
  const [editText, setEditText] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  // Toast status states
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Greeting & Stats Toggle States
  const [greeting, setGreeting] = useState<string>("أهلاً بكِ");
  const [showStats, setShowStats] = useState<boolean>(false);

  // Check session cookie on load
  const checkSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        setIsAuthenticated(true);
        fetchComments();
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  // Fetch comments from API proxy
  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/comments");
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      if (!res.ok) {
        throw new Error(`خطأ في جلب البيانات: ${res.status} ${res.statusText}`);
      }
      const result = await res.json();
      const rawData = result.data || [];
      // Sort by createdAt chronologically descending (newest first)
      const sortedData = [...rawData].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setComments(sortedData);
    } catch (e: any) {
      setError(e.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
    // Load theme setting
    const savedTheme = localStorage.getItem("app_theme");
    if (savedTheme === "light") {
      setIsLightMode(true);
    }
    // Set dynamic greeting
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("صباح الخير");
    } else {
      setGreeting("مساء الخير");
    }
    // Register PWA Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service Worker registration failed:", err);
      });
    }
  }, []);

  // Sync theme class with body element
  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add("light");
      localStorage.setItem("app_theme", "light");
    } else {
      document.body.classList.remove("light");
      localStorage.setItem("app_theme", "dark");
    }
  }, [isLightMode]);

  // Reset pagination count on search/filter change
  useEffect(() => {
    setVisibleCount(5);
  }, [searchTerm, selectedPostId, filterDate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) {
      setAuthError("الرجاء إدخال اسم المستخدم وكلمة المرور.");
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "فشل تسجيل الدخول");
      }

      setIsAuthenticated(true);
      fetchComments();
      showToast("مرحباً بك! تم تسجيل الدخول بنجاح.", "success");
    } catch (err: any) {
      setAuthError(err.message || "اسم المستخدم أو كلمة المرور غير صحيحة");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setIsAuthenticated(false);
      setComments([]);
      setUsernameInput("");
      setPasswordInput("");
      showToast("تم تسجيل الخروج بنجاح.", "info");
    } catch {
      showToast("حدث خطأ أثناء تسجيل الخروج", "error");
    }
  };

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleEditClick = (row: CommentRow) => {
    setEditingRow(row);
    setEditText(row.TEXT || "");
  };

  const handleSave = async () => {
    if (!editingRow) return;
    setSaving(true);
    try {
      const res = await fetch("/api/comments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingRow.id,
          text: editText,
        }),
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "فشل تحديث التعليق");
      }

      // Update local state
      setComments((prev) =>
        prev.map((c) => (c.id === editingRow.id ? { ...c, TEXT: editText, updatedAt: new Date().toISOString() } : c))
      );

      showToast("تم حفظ التعديلات بنجاح!", "success");
      setEditingRow(null);
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "حدث خطأ أثناء الحفظ", "error");
    } finally {
      setSaving(false);
    }
  };

  // Extract all unique POST_IDs
  const uniquePostIds = Array.from(new Set(comments.map((c) => c.POST_ID).filter(Boolean)));

  // Filter comments based on search term, selected POST_ID, and selected date
  const filteredComments = comments.filter((c) => {
    const textMatch = c.TEXT?.toLowerCase().includes(searchTerm.toLowerCase());
    const idMatch = c.POST_ID?.toLowerCase().includes(searchTerm.toLowerCase());
    const postFilterMatch = selectedPostId ? c.POST_ID === selectedPostId : true;
    
    // Date matching (YYYY-MM-DD)
    let dateMatch = true;
    if (filterDate && c.createdAt) {
      const commentDate = c.createdAt.substring(0, 10);
      dateMatch = commentDate === filterDate;
    }

    return (textMatch || idMatch) && postFilterMatch && dateMatch;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("تم نسخ POST_ID للحافظة", "info");
  };

  // 1. Initial Session Checking State (Full Screen Loader)
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-[var(--text-secondary)]">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--primary-color)] mb-4" />
        <p className="text-sm font-semibold">جاري التحقق من الجلسة الآمنة...</p>
      </div>
    );
  }

  // 2. Unauthenticated State (Login Card View)
  if (isAuthenticated === false) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4">
        {/* Theme Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--primary-color)]/5 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="glass-panel rounded-3xl w-full max-w-md p-8 shadow-2xl relative z-10 border-[var(--panel-border)]">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF6C37] to-[#FF3B30] flex items-center justify-center shadow-lg shadow-[#FF6C37]/25 mb-4">
              <MessageSquare className="text-white w-7 h-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">تسجيل الدخول الآمن</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">مدير تعليقات صيدلية أبناء الصغير</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {authError && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-xs text-[var(--text-primary)] font-semibold">اسم المستخدم</label>
              <div className="bg-[var(--input-bg)] border border-[var(--panel-border)] focus-within:border-[var(--primary-color)] rounded-xl px-4 py-3 flex items-center gap-3 transition-colors">
                <User className="text-[var(--text-secondary)] w-4 h-4" />
                <input
                  type="text"
                  placeholder="أدخل اسم المستخدم..."
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-[var(--text-primary)] text-sm font-sans"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-[var(--text-primary)] font-semibold">كلمة المرور</label>
              <div className="bg-[var(--input-bg)] border border-[var(--panel-border)] focus-within:border-[var(--primary-color)] rounded-xl px-4 py-3 flex items-center gap-3 transition-colors">
                <KeyRound className="text-[var(--text-secondary)] w-4 h-4" />
                <input
                  type="password"
                  placeholder="أدخل كلمة المرور..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-[var(--text-primary)] text-sm font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 bg-gradient-to-r from-[#FF6C37] to-[#FF3B30] text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2 cursor-pointer"
            >
              {authLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>تسجيل الدخول</>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 3. Authenticated State (Main Dashboard View)
  return (
    <div className="relative min-h-screen pb-12 overflow-hidden transition-colors duration-300">
      {/* Decorative Glow Elements */}
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-[var(--primary-color)]/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between pb-6 mb-8 border-b border-[var(--panel-border)] gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF6C37] to-[#FF3B30] flex items-center justify-center shadow-lg">
              <MessageSquare className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                <span className="bg-gradient-to-r from-[#FF6C37] to-[#FF3B30] bg-clip-text text-transparent">
                  {greeting} يا أزهار
                </span>{" "}
                👋
              </h1>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">لوحة التحكم بصيدلية أبناء الصغير</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setIsLightMode(!isLightMode)}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--panel-bg)] hover:bg-[var(--card-hover-bg)] border border-[var(--panel-border)] text-[var(--text-primary)] transition-all active:scale-90 cursor-pointer"
              title={isLightMode ? "تفعيل الوضع الليلي" : "تفعيل الوضع النهاري"}
            >
              {isLightMode ? (
                <Moon className="w-4 h-4 text-indigo-500" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500 animate-pulse" />
              )}
            </button>

            {/* Stats Toggle Button */}
            <button
              onClick={() => setShowStats(!showStats)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
                showStats 
                  ? "bg-[#FF6C37]/15 border-[#FF6C37]/30 text-[#FF6C37]" 
                  : "bg-[var(--panel-bg)] hover:bg-[var(--card-hover-bg)] border border-[var(--panel-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              title="عرض إحصائيات النظام وحالة الاتصال"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>حالة النظام</span>
            </button>

            <button 
              onClick={fetchComments}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--panel-bg)] hover:bg-[var(--card-hover-bg)] border border-[var(--panel-border)] text-[var(--text-primary)] transition-all text-xs font-semibold active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>تحديث</span>
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 transition-all text-xs font-semibold active:scale-95 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          </div>
        </header>

        {/* Stats Panel (Collapsible) */}
        {showStats && (
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 transition-all duration-300">
            <div className="glass-panel rounded-2xl p-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-[var(--text-secondary)] block mb-1">إجمالي الردود الموثقة</span>
                <span className="text-2xl font-bold text-[var(--text-primary)]">{loading ? "..." : comments.length}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#FF6C37]/10 flex items-center justify-center text-[#FF6C37]">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-[var(--text-secondary)] block mb-1">نتائج البحث المصفاة</span>
                <span className="text-2xl font-bold text-[var(--text-primary)]">{loading ? "..." : filteredComments.length}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Filter className="w-5 h-5" />
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-[var(--text-secondary)] block mb-1">حالة النظام والبيانات</span>
                <span className="text-sm font-semibold text-emerald-500 flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse block"></span> المنظومة تعمل ومتصلة
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </section>
        )}

        {/* Search and Filter Panel (Responsive Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
          {/* Search Input */}
          <div className="glass-panel rounded-2xl p-4 md:col-span-6 flex items-center gap-3">
            <Search className="text-[var(--text-secondary)] w-4 h-4" />
            <input
              type="text"
              placeholder="ابحث برقم المنشور (POST_ID) أو بنص التعليق..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-[var(--text-primary)] text-sm placeholder-[var(--text-secondary)] font-sans"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          <div className="glass-panel rounded-2xl p-4 md:col-span-3 flex items-center gap-3">
            <Filter className="text-[var(--text-secondary)] w-4 h-4" />
            <select
              value={selectedPostId}
              onChange={(e) => setSelectedPostId(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-[var(--text-primary)] text-sm font-sans cursor-pointer focus:ring-0 [&>option]:bg-[#12131C] [&>option]:text-white"
            >
              <option value="" className="text-gray-800 dark:text-white">كل المنشورات</option>
              {uniquePostIds.map((postId) => (
                <option key={postId} value={postId} className="text-gray-800 dark:text-white">
                  {postId.substring(0, 15)}... (منشور)
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="glass-panel rounded-2xl p-4 md:col-span-3 flex items-center gap-3">
            <Calendar className="text-[var(--text-secondary)] w-4 h-4" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-[var(--text-primary)] text-sm font-sans cursor-pointer focus:ring-0 [color-scheme:dark]"
            />
            {filterDate && (
              <button onClick={() => setFilterDate("")} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-panel rounded-2xl p-6 animate-pulse flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-[var(--text-secondary)]/10 rounded w-1/4"></div>
                  <div className="h-4 bg-[var(--text-secondary)]/10 rounded w-12"></div>
                </div>
                <div className="h-16 bg-[var(--text-secondary)]/10 rounded w-full"></div>
                <div className="h-10 bg-[var(--text-secondary)]/10 rounded w-32 self-end"></div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="glass-panel rounded-2xl p-8 text-center border-red-500/20">
            <AlertTriangle className="text-red-500 w-12 h-12 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">فشل جلب البيانات</h3>
            <p className="text-sm text-red-400 max-w-md mx-auto mb-6">{error}</p>
            <button 
              onClick={fetchComments}
              className="px-6 py-2.5 bg-gradient-to-r from-[#FF6C37] to-[#FF3B30] text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all cursor-pointer"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Comments List */}
        {!loading && !error && (
          <>
            {filteredComments.length === 0 ? (
              <div className="glass-panel rounded-2xl p-12 text-center border-dashed border-[var(--panel-border)]">
                <Info className="w-12 h-12 mx-auto text-[var(--text-secondary)]/20 mb-4" />
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">لا توجد نتائج مطابقة</h3>
                <p className="text-sm text-[var(--text-secondary)]">جرب تعديل عبارة البحث أو تحديد تاريخ آخر.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {/* Slice the array to only show N comments according to visibleCount */}
                {filteredComments.slice(0, visibleCount).map((comment) => (
                  <article key={comment.id} className="glass-panel rounded-2xl p-5 glow-card flex flex-col gap-4 border-[var(--panel-border)]">
                    <div className="flex justify-end">
                      <span className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5 bg-[var(--input-bg)] px-3 py-1.5 rounded-xl border border-[var(--panel-border)] font-sans">
                        <Calendar className="w-3.5 h-3.5 text-[var(--primary-color)]" />
                        {new Date(comment.updatedAt || comment.createdAt).toLocaleString("ar-LY")}
                      </span>
                    </div>

                    <div className="text-sm text-[var(--text-primary)] leading-relaxed bg-[var(--input-bg)] p-4 rounded-xl border border-[var(--panel-border)] font-sans">
                      {comment.TEXT ? (
                        <div 
                          className="markdown-content"
                          dangerouslySetInnerHTML={{ __html: marked.parse(comment.TEXT) as string }}
                        />
                      ) : (
                        <span className="text-[var(--text-secondary)]/30 italic">لا يوجد نص رد مضاف حالياً.</span>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => handleEditClick(comment)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF6C37] hover:bg-[#FF3B30] text-white text-xs font-bold transition-all hover:shadow-lg cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تعديل الرد</span>
                      </button>
                    </div>
                  </article>
                ))}

                {/* Show More Pagination Button */}
                {visibleCount < filteredComments.length && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => setVisibleCount((prev) => prev + 5)}
                      className="px-6 py-3 bg-[var(--panel-bg)] hover:bg-[var(--card-hover-bg)] border border-[var(--panel-border)] rounded-2xl text-xs font-bold transition-all active:scale-95 text-[#FF6C37] shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                      <span>عرض المزيد من التعليقات ({filteredComments.length - visibleCount} متبقية)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      {editingRow && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-opacity duration-300">
          <div className="glass-panel rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-[var(--panel-border)] scale-100 transition-transform duration-300">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-[var(--panel-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF6C37]/10 flex items-center justify-center text-[#FF6C37]">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">تعديل الرد التلقائي</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">تحديث النص المحفوظ في قاعدة بيانات n8n</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingRow(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-[var(--text-secondary)] flex items-center justify-center transition-all cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-xs text-[var(--text-secondary)] font-bold">معلومات المنشور المستهدف (POST_ID):</span>
                <div className="p-3 bg-[var(--input-bg)] border border-[var(--panel-border)] rounded-xl font-mono text-xs text-[var(--text-primary)]">
                  {editingRow.POST_ID}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs text-[var(--text-secondary)] font-bold">نص الرد التلقائي المقترن:</span>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="اكتب الرد التلقائي الجديد هنا..."
                  rows={6}
                  className="w-full bg-[var(--input-bg)] border border-[var(--panel-border)] focus:border-[var(--primary-color)] rounded-xl p-4 text-[var(--text-primary)] text-sm outline-none transition-colors resize-none placeholder-[var(--text-secondary)]/20 font-sans"
                ></textarea>
              </div>

              {editText && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-[var(--text-secondary)] font-bold">معاينة التنسيق المباشر (Markdown):</span>
                  <div className="p-4 bg-[var(--input-bg)] border border-[var(--panel-border)] rounded-xl text-sm text-[var(--text-primary)] min-h-[80px] max-h-[150px] overflow-y-auto">
                    <div 
                      className="markdown-content"
                      dangerouslySetInnerHTML={{ __html: marked.parse(editText) as string }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[var(--panel-border)] bg-black/10 flex justify-end gap-3">
              <button
                onClick={() => setEditingRow(null)}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6C37] to-[#FF3B30] text-white text-sm font-bold hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>حفظ التغييرات</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Alert Toast */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 animate-bounce">
          <div className={`glass-panel border-l-4 rounded-xl px-5 py-3.5 flex items-center gap-3 shadow-2xl ${
            toast.type === "success" 
              ? "border-l-emerald-500 text-emerald-500" 
              : toast.type === "error" 
                ? "border-l-red-500 text-red-500" 
                : "border-l-blue-500 text-blue-500"
          }`}>
            {toast.type === "success" && <CheckCircle2 className="w-4 h-4" />}
            {toast.type === "error" && <XCircle className="w-4 h-4" />}
            {toast.type === "info" && <Info className="w-4 h-4" />}
            <span className="text-sm font-semibold text-[var(--text-primary)]">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

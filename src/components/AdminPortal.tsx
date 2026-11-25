import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Download,
  Edit3,
  Eye,
  FileJson,
  Folder,
  FolderPlus,
  Layers,
  Lock,
  LogOut,
  Plus,
  Power,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { auth, googleAuthProvider } from '../lib/firebase';
import {
  AdminDashboardData,
  AdminFolder,
  AdminParticipant,
  AdminParticipantAnswer,
  AdminQuestion,
  AdminQuiz,
  QuestionDifficulty,
  QuizDifficultyFilter,
} from '../types/quiz';

function difficultyLabel(level: string): string {
  if (level === 'easy') return 'سهل';
  if (level === 'medium') return 'متوسط';
  if (level === 'hard') return 'صعب';
  return 'الكل';
}

function difficultyTextColor(level: string): string {
  if (level === 'easy') return 'text-emerald-300';
  if (level === 'hard') return 'text-rose-300';
  if (level === 'medium') return 'text-amber-300';
  return 'text-sky-300';
}

interface AdminPortalProps {
  onClose: () => void;
  onQuizChanged: () => void;
}

type AdminTab = 'folders' | 'questions' | 'participants' | 'json';

interface AuthStatusResponse {
  email: string;
  displayName: string | null;
  isAdminUser: boolean;
  canClaimFirstAdmin: boolean;
  requiresFirstTimePasscodeSetup: boolean;
}

export function AdminPortal({ onClose, onQuizChanged }: AdminPortalProps) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthStatusResponse | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  const [adminNameInput, setAdminNameInput] = useState('');
  const [passcodeInput, setPasscodeInput] = useState('');
  const [gateError, setGateError] = useState<string | null>(null);
  const [verifyingGate, setVerifyingGate] = useState(false);

  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [loadingDash, setLoadingDash] = useState(false);
  const [dashError, setDashError] = useState<string | null>(null);
  const [dashSuccess, setDashSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('folders');

  // Selected Quiz across Questions & JSON tabs
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);

  // Folder Modal State
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<AdminFolder | null>(null);
  const [folderNameDraft, setFolderNameDraft] = useState('');
  const [folderDescDraft, setFolderDescDraft] = useState('');
  const [savingFolder, setSavingFolder] = useState(false);
  const [confirmDeleteFolderId, setConfirmDeleteFolderId] = useState<number | null>(null);

  // Quiz Modal State
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<AdminQuiz | null>(null);
  const [quizTitleDraft, setQuizTitleDraft] = useState('');
  const [quizDescDraft, setQuizDescDraft] = useState('');
  const [quizFolderDraft, setQuizFolderDraft] = useState<string>('');
  const [quizActiveDraft, setQuizActiveDraft] = useState(true);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [confirmDeleteQuizId, setConfirmDeleteQuizId] = useState<number | null>(null);

  // Question Modal & Filter State
  const [questionDifficultyFilter, setQuestionDifficultyFilter] =
    useState<QuizDifficultyFilter>('all');
  const [editingQuestion, setEditingQuestion] = useState<AdminQuestion | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState<'multiple_choice' | 'true_false'>('multiple_choice');
  const [qDifficulty, setQDifficulty] = useState<QuestionDifficulty>('medium');
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState(0);
  const [qImageUrl, setQImageUrl] = useState('');
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [confirmDeleteQId, setConfirmDeleteQId] = useState<number | null>(null);

  // Participants State
  const [searchTerm, setSearchTerm] = useState('');
  const [participantQuizFilter, setParticipantQuizFilter] = useState<string>('all');
  const [selectedParticipantDetails, setSelectedParticipantDetails] = useState<{
    participant: AdminParticipant;
    answers: AdminParticipantAnswer[];
  } | null>(null);
  const [confirmDeletePId, setConfirmDeletePId] = useState<number | null>(null);

  // JSON State
  const [jsonPasteText, setJsonPasteText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [importingJson, setImportingJson] = useState(false);
  const [confirmDangerAction, setConfirmDangerAction] = useState<
    'clear_participants' | 'reset_quiz' | null
  >(null);

  const getAuthHeaders = useCallback(
    async (includeAdminToken = true): Promise<Record<string, string>> => {
      if (!firebaseUser) {
        throw new Error('يجب تسجيل الدخول أولاً.');
      }
      const idToken = await firebaseUser.getIdToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      };
      if (includeAdminToken && adminToken) {
        headers['X-Admin-Token'] = adminToken;
      }
      return headers;
    },
    [firebaseUser, adminToken]
  );

  const checkAuthStatus = useCallback(async (user: User) => {
    setGateError(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/admin/auth-status', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'تعذر التحقق من حساب الإدارة.');
      }
      setAuthStatus(data);
    } catch (err: any) {
      setGateError(err?.message || 'حدث خطأ أثناء التحقق من الحساب.');
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAdminToken(null);
      setDashboard(null);
      if (user) {
        await checkAuthStatus(user);
      } else {
        setAuthStatus(null);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [checkAuthStatus]);

  const loadDashboard = useCallback(async () => {
    if (!firebaseUser || !adminToken) return;
    setLoadingDash(true);
    setDashError(null);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch('/api/admin/dashboard', { headers });
      const data: AdminDashboardData & { error?: string } = await res.json();
      if (!res.ok) {
        if (res.status === 403 && adminToken) {
          setAdminToken(null);
        }
        throw new Error(data.error || 'تعذر تحميل بيانات لوحة التحكم.');
      }
      setDashboard(data);
      setSelectedQuizId((prev) => {
        if (prev && data.quizzes.some((q) => q.id === prev)) return prev;
        return data.quizzes[0]?.id ?? null;
      });
    } catch (err: any) {
      setDashError(err?.message || 'فشل تحميل البيانات.');
    } finally {
      setLoadingDash(false);
    }
  }, [firebaseUser, adminToken, getAuthHeaders]);

  useEffect(() => {
    if (adminToken) {
      loadDashboard();
    }
  }, [adminToken, loadDashboard]);

  const showToast = (msg: string) => {
    setDashSuccess(msg);
    window.setTimeout(() => {
      setDashSuccess((cur) => (cur === msg ? null : cur));
    }, 4000);
  };

  const handleGoogleSignIn = async () => {
    setGateError(null);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain') {
        setGateError(
          'نطاق الموقع الحالي غير مضاف في Firebase Authorized Domains. أضف نطاق Vercel من إعدادات Firebase Authentication.'
        );
      } else {
        setGateError(err?.message || 'تعذر تسجيل الدخول بحساب Google.');
      }
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setAdminToken(null);
    setDashboard(null);
    setAdminNameInput('');
    setPasscodeInput('');
  };

  const handleVerifyGate = async (e: FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setGateError(null);
    setVerifyingGate(true);
    try {
      const headers = await getAuthHeaders(false);
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          adminName: adminNameInput.trim(),
          passcode: passcodeInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل التحقق من بيانات الإدارة.');
      }
      setAdminToken(data.adminToken);
      setPasscodeInput('');
    } catch (err: any) {
      setGateError(err?.message || 'بيانات الدخول غير صحيحة.');
    } finally {
      setVerifyingGate(false);
    }
  };

  // ==========================================
  // Folder CRUD Handlers
  // ==========================================

  const openAddFolderModal = () => {
    setEditingFolder(null);
    setFolderNameDraft('');
    setFolderDescDraft('');
    setShowFolderModal(true);
  };

  const openEditFolderModal = (f: AdminFolder) => {
    setEditingFolder(f);
    setFolderNameDraft(f.name);
    setFolderDescDraft(f.description || '');
    setShowFolderModal(true);
  };

  const handleSaveFolder = async (e: FormEvent) => {
    e.preventDefault();
    setSavingFolder(true);
    setDashError(null);
    try {
      const headers = await getAuthHeaders(true);
      const url = editingFolder
        ? `/api/admin/folders/${editingFolder.id}`
        : '/api/admin/folders';
      const method = editingFolder ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          name: folderNameDraft.trim(),
          description: folderDescDraft.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذر حفظ القسم.');
      setShowFolderModal(false);
      await loadDashboard();
      onQuizChanged();
      showToast(editingFolder ? 'تم تحديث القسم بنجاح.' : 'تم إنشاء القسم بنجاح.');
    } catch (err: any) {
      setDashError(err?.message || 'تعذر حفظ القسم.');
    } finally {
      setSavingFolder(false);
    }
  };

  const handleDeleteFolder = async (id: number) => {
    setDashError(null);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch(`/api/admin/folders/${id}`, {
        method: 'DELETE',
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذر حذف القسم.');
      setConfirmDeleteFolderId(null);
      await loadDashboard();
      onQuizChanged();
      showToast('تم حذف القسم (تم نقل اختباراته إلى قائمة بدون قسم).');
    } catch (err: any) {
      setDashError(err?.message || 'تعذر حذف القسم.');
    }
  };

  // ==========================================
  // Quiz CRUD Handlers
  // ==========================================

  const openAddQuizModal = (defaultFolderId?: number | null) => {
    setEditingQuiz(null);
    setQuizTitleDraft('');
    setQuizDescDraft('');
    setQuizFolderDraft(
      defaultFolderId ? String(defaultFolderId) : dashboard?.folders[0]?.id ? String(dashboard.folders[0].id) : ''
    );
    setQuizActiveDraft(true);
    setShowQuizModal(true);
  };

  const openEditQuizModal = (q: AdminQuiz) => {
    setEditingQuiz(q);
    setQuizTitleDraft(q.title);
    setQuizDescDraft(q.description || '');
    setQuizFolderDraft(q.folderId ? String(q.folderId) : '');
    setQuizActiveDraft(q.isActive);
    setShowQuizModal(true);
  };

  const handleSaveQuiz = async (e: FormEvent) => {
    e.preventDefault();
    setSavingQuiz(true);
    setDashError(null);
    try {
      const headers = await getAuthHeaders(true);
      const url = editingQuiz
        ? `/api/admin/quizzes/${editingQuiz.id}`
        : '/api/admin/quizzes';
      const method = editingQuiz ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          title: quizTitleDraft.trim(),
          description: quizDescDraft.trim() || null,
          folderId: quizFolderDraft ? Number(quizFolderDraft) : null,
          isActive: quizActiveDraft,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذر حفظ الاختبار.');
      setShowQuizModal(false);
      await loadDashboard();
      if (!editingQuiz && data?.id) {
        setSelectedQuizId(data.id);
      }
      onQuizChanged();
      showToast(editingQuiz ? 'تم تحديث الاختبار بنجاح.' : 'تم إنشاء الاختبار الجديد بنجاح.');
    } catch (err: any) {
      setDashError(err?.message || 'تعذر حفظ الاختبار.');
    } finally {
      setSavingQuiz(false);
    }
  };

  const handleToggleSingleQuizActive = async (quiz: AdminQuiz) => {
    setDashError(null);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch(`/api/admin/quizzes/${quiz.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ isActive: !quiz.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذر تغيير حالة الاختبار.');
      await loadDashboard();
      onQuizChanged();
      showToast(data.isActive ? 'تم تفعيل الاختبار.' : 'تم إيقاف الاختبار.');
    } catch (err: any) {
      setDashError(err?.message || 'تعذر تحديث الحالة.');
    }
  };

  const handleDeleteQuiz = async (id: number) => {
    setDashError(null);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch(`/api/admin/quizzes/${id}`, {
        method: 'DELETE',
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذر حذف الاختبار.');
      setConfirmDeleteQuizId(null);
      await loadDashboard();
      onQuizChanged();
      showToast('تم حذف الاختبار وأسئلته.');
    } catch (err: any) {
      setDashError(err?.message || 'تعذر حذف الاختبار.');
    }
  };

  // ==========================================
  // Question CRUD Handlers
  // ==========================================

  const openAddQuestionModal = () => {
    if (!selectedQuizId) {
      setDashError('يرجى إنشاء اختبار أو تحديده أولاً.');
      return;
    }
    setEditingQuestion(null);
    setQText('');
    setQType('multiple_choice');
    setQDifficulty(
      questionDifficultyFilter === 'all' ? 'medium' : questionDifficultyFilter
    );
    setQOptions(['', '', '', '']);
    setQCorrect(0);
    setQImageUrl('');
    setShowQuestionModal(true);
  };

  const openEditQuestionModal = (q: AdminQuestion) => {
    setEditingQuestion(q);
    setQText(q.question);
    setQType(q.questionType === 'true_false' ? 'true_false' : 'multiple_choice');
    setQDifficulty(q.difficulty || 'medium');
    setQOptions([...q.options]);
    setQCorrect(q.correctAnswer);
    setQImageUrl(q.imageUrl || '');
    setShowQuestionModal(true);
  };

  const handleQuestionTypeChange = (nextType: 'multiple_choice' | 'true_false') => {
    setQType(nextType);
    if (nextType === 'true_false') {
      setQOptions(['صحيح', 'خطأ']);
      setQCorrect(0);
    } else if (qOptions.length < 3) {
      setQOptions(['', '', '', '']);
      setQCorrect(0);
    }
  };

  const handleSaveQuestion = async (e: FormEvent) => {
    e.preventDefault();
    setSavingQuestion(true);
    setDashError(null);
    try {
      const headers = await getAuthHeaders(true);
      const payload = {
        quizId: editingQuestion ? editingQuestion.quizId : selectedQuizId,
        question: qText.trim(),
        questionType: qType,
        difficulty: qDifficulty,
        options: qOptions.map((o) => o.trim()),
        correctAnswer: qCorrect,
        imageUrl: qImageUrl.trim() || null,
      };
      const url = editingQuestion
        ? `/api/admin/questions/${editingQuestion.id}`
        : '/api/admin/questions';
      const method = editingQuestion ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'تعذر حفظ السؤال.');
      }

      setShowQuestionModal(false);
      await loadDashboard();
      onQuizChanged();
      showToast(editingQuestion ? 'تم تحديث السؤال بنجاح.' : 'تمت إضافة السؤال بنجاح.');
    } catch (err: any) {
      setDashError(err?.message || 'حدث خطأ أثناء الحفظ.');
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    setDashError(null);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: 'DELETE',
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذر حذف السؤال.');
      setConfirmDeleteQId(null);
      await loadDashboard();
      onQuizChanged();
      showToast('تم حذف السؤال.');
    } catch (err: any) {
      setDashError(err?.message || 'فشل حذف السؤال.');
    }
  };

  const handleMoveQuestion = async (
    quizQuestionsList: AdminQuestion[],
    index: number,
    direction: -1 | 1
  ) => {
    if (!dashboard) return;
    const list = [...quizQuestionsList];
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const [moved] = list.splice(index, 1);
    list.splice(target, 0, moved);
    const orderedIds = list.map((q) => q.id);

    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch('/api/admin/questions/reorder', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) {
        throw new Error('تعذر حفظ ترتيب الأسئلة.');
      }
      await loadDashboard();
      onQuizChanged();
    } catch (err: any) {
      setDashError(err?.message || 'تعذر تحديث الترتيب.');
    }
  };

  // ==========================================
  // Participants Handlers
  // ==========================================

  const handleViewParticipant = async (id: number) => {
    setDashError(null);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch(`/api/admin/participants/${id}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذر تحميل تفاصيل المشارك.');
      setSelectedParticipantDetails(data);
    } catch (err: any) {
      setDashError(err?.message || 'فشل تحميل تفاصيل المشارك.');
    }
  };

  const handleDeleteParticipant = async (id: number) => {
    setDashError(null);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch(`/api/admin/participants/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('تعذر حذف المحاولة.');
      setConfirmDeletePId(null);
      await loadDashboard();
      showToast('تم حذف محاولة المشارك.');
    } catch (err: any) {
      setDashError(err?.message || 'تعذر حذف المحاولة.');
    }
  };

  // ==========================================
  // Global Settings & JSON Import/Export
  // ==========================================

  const handleToggleGlobalActive = async () => {
    if (!dashboard) return;
    setDashError(null);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ isActive: !dashboard.settings.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذر تغيير حالة المنصة.');
      await loadDashboard();
      onQuizChanged();
      showToast(
        data.isActive
          ? 'تم تفعيل جميع الاختبارات.'
          : 'تم إيقاف جميع الاختبارات مؤقتاً.'
      );
    } catch (err: any) {
      setDashError(err?.message || 'فشل تحديث الحالة.');
    }
  };

  const triggerJsonDownload = (filename: string, payload: unknown) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadQuestionsJson = async () => {
    if (!selectedQuizId) {
      setDashError('يرجى تحديد الاختبار أولاً.');
      return;
    }
    setDashError(null);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch(
        `/api/admin/json/export-questions?quizId=${selectedQuizId}`,
        { headers }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذر تنزيل الأسئلة.');
      triggerJsonDownload(`quiz-${selectedQuizId}-questions.json`, data);
      showToast('تم تنزيل ملف الأسئلة للاختبار المحدد بنجاح.');
    } catch (err: any) {
      setDashError(err?.message || 'فشل التنزيل.');
    }
  };

  const handleDownloadSampleTemplateJson = async () => {
    setDashError(null);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch('/api/admin/json/sample-template', { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذر تنزيل القالب.');
      triggerJsonDownload('quizverse-template-easy-medium-hard.json', data);
      showToast('تم تنزيل قالب JSON للمستويات (سهل / متوسط / صعب).');
    } catch (err: any) {
      setDashError(err?.message || 'فشل تنزيل القالب.');
    }
  };

  const handleExportParticipantsJson = async () => {
    setDashError(null);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch('/api/admin/json/export-participants', { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذر تصدير النتائج.');
      triggerJsonDownload('quizverse-participants-results.json', data);
      showToast('تم تصدير نتائج المشاركين بنجاح.');
    } catch (err: any) {
      setDashError(err?.message || 'فشل التصدير.');
    }
  };

  const processAndImportJson = async (rawText: string) => {
    if (!selectedQuizId) {
      setJsonError('يرجى تحديد الاختبار المستهدف للاستيراد أولاً.');
      return;
    }
    setJsonError(null);
    setImportingJson(true);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        throw new Error(
          'ملف JSON غير صالح نحوياً (Syntax Error). تأكد من الأقواس والفواصل.'
        );
      }

      const headers = await getAuthHeaders(true);
      const res = await fetch(
        `/api/admin/json/import-questions?quizId=${selectedQuizId}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(parsed),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل التحقق من بيانات ملف JSON.');
      }

      setJsonPasteText('');
      await loadDashboard();
      onQuizChanged();
      showToast('تم استيراد الأسئلة للاختبار المحدد مع الحفاظ على جميع بيانات المشاركين!');
    } catch (err: any) {
      setJsonError(err?.message || 'فشل استيراد ملف JSON.');
    } finally {
      setImportingJson(false);
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setJsonPasteText(text);
    await processAndImportJson(text);
    e.target.value = '';
  };

  const handleDangerConfirm = async () => {
    if (!confirmDangerAction) return;
    setDashError(null);
    try {
      const headers = await getAuthHeaders(true);
      if (confirmDangerAction === 'clear_participants') {
        const res = await fetch('/api/admin/participants', {
          method: 'DELETE',
          headers,
        });
        if (!res.ok) throw new Error('تعذر حذف محاولات المشاركين.');
        showToast('تم حذف جميع محاولات المشاركين.');
      } else {
        const res = await fetch('/api/admin/reset', {
          method: 'POST',
          headers,
        });
        if (!res.ok) throw new Error('تعذر إعادة ضبط الاختبار.');
        showToast('تمت إعادة ضبط المنصة إلى الوضع الافتراضي.');
      }
      setConfirmDangerAction(null);
      await loadDashboard();
      onQuizChanged();
    } catch (err: any) {
      setDashError(err?.message || 'تعذر تنفيذ الإجراء.');
    }
  };

  // ==========================================
  // Render Gate if not unlocked
  // ==========================================

  if (!adminToken) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-md rounded-3xl border border-slate-300/15 bg-slate-950/85 p-7 shadow-2xl backdrop-blur-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Lock className="h-5 w-5 text-amber-300" />
            <h2 className="text-xl font-bold text-white">بوابة الإدارة السرية</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700/70 text-slate-300 hover:border-slate-500 hover:text-white"
            aria-label="العودة"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {authLoading ? (
          <p className="py-6 text-center text-sm text-slate-400">
            جارٍ التحقق من الجلسة...
          </p>
        ) : !firebaseUser ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-slate-300">
              لأغراض الأمان، يتطلب الدخول إلى لوحة التحكم المصادقة بحساب Google أولاً ثم التحقق من رمز الأدمن وكلمة المرور.
            </p>
            {gateError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{gateError}</span>
              </div>
            )}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="flex min-h-[46px] w-full items-center justify-center gap-2.5 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
            >
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              <span>تسجيل الدخول بحساب Google</span>
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-xs text-slate-300">
              <span className="truncate font-mono" dir="ltr">
                {firebaseUser.email}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex shrink-0 items-center gap-1 text-rose-300 hover:text-rose-200"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>تبديل</span>
              </button>
            </div>

            {authStatus && !authStatus.canClaimFirstAdmin ? (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                هذا الحساب لا يملك صلاحية الإدارة المسجلة. يرجى تسجيل الدخول بحساب المالك المعتمد.
              </div>
            ) : (
              <form onSubmit={handleVerifyGate} className="space-y-4">
                <div>
                  <label
                    htmlFor="admin-code-input"
                    className="mb-1.5 block text-xs font-semibold text-slate-300"
                  >
                    اسم الأدمن
                  </label>
                  <input
                    id="admin-code-input"
                    type="text"
                    value={adminNameInput}
                    onChange={(e) => setAdminNameInput(e.target.value)}
                    placeholder="أدخل رمز الأدمن"
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none focus:border-sky-400"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-passcode-input"
                    className="mb-1.5 block text-xs font-semibold text-slate-300"
                  >
                    {authStatus?.requiresFirstTimePasscodeSetup
                      ? 'تعيين كلمة مرور الإدارة لأول مرة (4 أحرف على الأقل)'
                      : 'كلمة مرور الإدارة'}
                  </label>
                  <input
                    id="admin-passcode-input"
                    type="password"
                    value={passcodeInput}
                    onChange={(e) => setPasscodeInput(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={4}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none focus:border-sky-400"
                    dir="ltr"
                  />
                </div>

                {gateError && (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span>{gateError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={verifyingGate}
                  className="flex min-h-[46px] w-full items-center justify-center rounded-2xl bg-gradient-to-l from-sky-500 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:opacity-95 disabled:opacity-50"
                >
                  {verifyingGate ? 'جارٍ التحقق...' : 'فتح لوحة الإدارة'}
                </button>
              </form>
            )}
          </div>
        )}
      </motion.section>
    );
  }

  // ==========================================
  // Render Full Admin Dashboard
  // ==========================================

  const filteredParticipants = (dashboard?.participants ?? []).filter((p) => {
    const matchesSearch = p.name
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase());
    const matchesQuiz =
      participantQuizFilter === 'all' ||
      String(p.quizId) === participantQuizFilter;
    return matchesSearch && matchesQuiz;
  });

  const completedParticipants = (dashboard?.participants ?? []).filter(
    (p) => p.status === 'completed'
  );
  const averageScore =
    completedParticipants.length > 0
      ? Math.round(
          completedParticipants.reduce((acc, p) => acc + p.score, 0) /
            completedParticipants.length
        )
      : 0;

  const selectedQuizQuestions = (dashboard?.questions ?? []).filter(
    (q) => q.quizId === selectedQuizId
  );

  const selectedQuizObject =
    dashboard?.quizzes.find((q) => q.id === selectedQuizId) ?? null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-6xl space-y-6"
    >
      {/* Top Admin Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-300/15 bg-slate-950/80 px-6 py-4 backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-bold text-white">لوحة تحكم QUIZVERSE</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            إدارة الأقسام والاختبارات · بنك الأسئلة · نتائج المشاركين · نظام JSON
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadDashboard}
            disabled={loadingDash}
            className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingDash ? 'animate-spin' : ''}`} />
            <span className="whitespace-nowrap">تحديث</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-sky-400/60"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">الواجهة الرئيسية</span>
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/20"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">خروج</span>
          </button>
        </div>
      </div>

      {/* Feedback Banners */}
      {dashError && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-500/35 bg-rose-500/10 px-5 py-3 text-sm text-rose-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{dashError}</span>
          </div>
          <button type="button" onClick={() => setDashError(null)} aria-label="إغلاق">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {dashSuccess && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 px-5 py-3 text-sm text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{dashSuccess}</span>
          </div>
          <button type="button" onClick={() => setDashSuccess(null)} aria-label="إغلاق">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI Strip */}
      {dashboard && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-300/12 bg-slate-950/75 p-5 backdrop-blur-xl">
            <div className="text-xs text-slate-400">الأقسام / الاختبارات</div>
            <div className="mt-2 font-mono text-2xl font-bold text-white tabular-nums">
              {dashboard.folders.length} / {dashboard.quizzes.length}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-300/12 bg-slate-950/75 p-5 backdrop-blur-xl">
            <div className="text-xs text-slate-400">إجمالي الأسئلة</div>
            <div className="mt-2 font-mono text-2xl font-bold text-sky-300 tabular-nums">
              {dashboard.questions.length}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-300/12 bg-slate-950/75 p-5 backdrop-blur-xl">
            <div className="text-xs text-slate-400">المشاركون · المتوسط</div>
            <div className="mt-2 font-mono text-2xl font-bold text-amber-300 tabular-nums">
              {dashboard.participants.length} · {averageScore}%
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-300/12 bg-slate-950/75 p-5 backdrop-blur-xl">
            <div>
              <div className="text-xs text-slate-400">المنصة العامة</div>
              <div
                className={`mt-2 text-base font-bold ${
                  dashboard.settings.isActive ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {dashboard.settings.isActive ? 'مفعّلة' : 'متوقفة'}
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleGlobalActive}
              className={`flex h-10 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-bold transition ${
                dashboard.settings.isActive
                  ? 'border-amber-400/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25'
                  : 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25'
              }`}
            >
              <Power className="h-3.5 w-3.5" />
              <span className="whitespace-nowrap">
                {dashboard.settings.isActive ? 'إيقاف' : 'تفعيل'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Segmented Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-300/12 bg-slate-950/75 p-1.5 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setActiveTab('folders')}
          className={`flex min-h-[42px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'folders'
              ? 'bg-sky-500/20 text-sky-200 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span className="whitespace-nowrap">الأقسام والاختبارات</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('questions')}
          className={`flex min-h-[42px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'questions'
              ? 'bg-sky-500/20 text-sky-200 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Edit3 className="h-4 w-4" />
          <span className="whitespace-nowrap">إدارة الأسئلة</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('participants')}
          className={`flex min-h-[42px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'participants'
              ? 'bg-sky-500/20 text-sky-200 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="h-4 w-4" />
          <span className="whitespace-nowrap">المشاركون والنتائج</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('json')}
          className={`flex min-h-[42px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'json'
              ? 'bg-sky-500/20 text-sky-200 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileJson className="h-4 w-4" />
          <span className="whitespace-nowrap">نظام JSON والإعدادات</span>
        </button>
      </div>

      {/* TAB 1: Folders (Sections) & Quizzes */}
      {activeTab === 'folders' && dashboard && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-300/12 bg-slate-950/75 p-6 backdrop-blur-xl">
            <div>
              <h3 className="text-lg font-bold text-white">الأقسام (المجلدات) والاختبارات</h3>
              <p className="text-xs text-slate-400">
                نظّم الاختبارات داخل مجلدات مثل «الشابتر السابع» و«الشابتر الثامن»، وأضف أو احذف أي قسم أو اختبار بحرية.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={openAddFolderModal}
                className="flex min-h-[42px] items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-500/15 px-4 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/25"
              >
                <FolderPlus className="h-4 w-4" />
                <span className="whitespace-nowrap">إضافة قسم (مجلد)</span>
              </button>

              <button
                type="button"
                onClick={() => openAddQuizModal()}
                className="flex min-h-[42px] items-center gap-2 rounded-xl bg-gradient-to-l from-sky-500 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-lg hover:opacity-95"
              >
                <Plus className="h-4 w-4" />
                <span className="whitespace-nowrap">إضافة اختبار جديد</span>
              </button>
            </div>
          </div>

          {/* Folders List */}
          <div className="space-y-5">
            {dashboard.folders.map((folder) => {
              const folderQuizzes = dashboard.quizzes.filter(
                (q) => q.folderId === folder.id
              );
              return (
                <div
                  key={folder.id}
                  className="rounded-3xl border border-slate-300/12 bg-slate-950/75 p-6 backdrop-blur-xl"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/10 text-amber-300">
                        <Folder className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white">{folder.name}</h4>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {folder.description || 'مجلد اختبارات'} ·{' '}
                          <span className="tabular-nums">
                            {folderQuizzes.length} اختبار
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openAddQuizModal(folder.id)}
                        className="flex h-9 items-center gap-1.5 rounded-lg border border-sky-400/35 bg-sky-500/10 px-3 text-xs font-semibold text-sky-200 hover:bg-sky-500/20"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>إضافة اختبار هنا</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditFolderModal(folder)}
                        className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-700 px-3 text-xs font-semibold text-slate-200 hover:border-slate-500"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>تعديل</span>
                      </button>

                      {confirmDeleteFolderId === folder.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDeleteFolder(folder.id)}
                            className="h-9 rounded-lg bg-rose-600 px-3 text-xs font-bold text-white"
                          >
                            تأكيد حذف القسم
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteFolderId(null)}
                            className="h-9 rounded-lg border border-slate-700 px-2.5 text-xs text-slate-300"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteFolderId(folder.id)}
                          className="flex h-9 items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 text-xs font-semibold text-rose-200 hover:bg-rose-500/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>حذف القسم</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quizzes inside this Folder */}
                  {folderQuizzes.length === 0 ? (
                    <p className="pt-4 text-xs text-slate-500">
                      لا توجد اختبارات داخل هذا القسم بعد.
                    </p>
                  ) : (
                    <div className="mt-4 divide-y divide-slate-800/70">
                      {folderQuizzes.map((quiz) => {
                        const qCount = dashboard.questions.filter(
                          (q) => q.quizId === quiz.id
                        ).length;
                        return (
                          <div
                            key={quiz.id}
                            className="flex flex-wrap items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white">
                                  {quiz.title}
                                </span>
                                <span className="text-slate-600">·</span>
                                <span
                                  className={`text-xs font-semibold ${
                                    quiz.isActive ? 'text-emerald-400' : 'text-amber-400'
                                  }`}
                                >
                                  {quiz.isActive ? 'مفعّل' : 'متوقف'}
                                </span>
                                <span className="text-slate-600">·</span>
                                <span className="font-mono text-xs text-slate-400 tabular-nums">
                                  {qCount} سؤال
                                </span>
                              </div>
                              {quiz.description && (
                                <p className="mt-0.5 text-xs text-slate-400">
                                  {quiz.description}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedQuizId(quiz.id);
                                  setActiveTab('questions');
                                }}
                                className="flex h-8 items-center gap-1 rounded-lg bg-sky-500/15 px-3 text-xs font-bold text-sky-200 hover:bg-sky-500/25"
                              >
                                <span>الأسئلة</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleSingleQuizActive(quiz)}
                                className="flex h-8 items-center gap-1 rounded-lg border border-slate-700 px-2.5 text-xs text-slate-300 hover:border-slate-500"
                              >
                                <Power className="h-3.5 w-3.5" />
                                <span>{quiz.isActive ? 'إيقاف' : 'تفعيل'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditQuizModal(quiz)}
                                className="flex h-8 items-center gap-1 rounded-lg border border-slate-700 px-2.5 text-xs text-slate-300 hover:border-sky-400"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                                <span>تعديل</span>
                              </button>
                              {confirmDeleteQuizId === quiz.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteQuiz(quiz.id)}
                                    className="h-8 rounded-lg bg-rose-600 px-2.5 text-xs font-bold text-white"
                                  >
                                    تأكيد
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteQuizId(null)}
                                    className="h-8 rounded-lg border border-slate-700 px-2 text-xs text-slate-300"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteQuizId(quiz.id)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/30 text-rose-300 hover:bg-rose-500/15"
                                  aria-label="حذف الاختبار"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Uncategorized Quizzes */}
            {dashboard.quizzes.some((q) => q.folderId === null) && (
              <div className="rounded-3xl border border-slate-300/12 bg-slate-950/75 p-6 backdrop-blur-xl">
                <h4 className="border-b border-slate-800/80 pb-3 text-base font-bold text-slate-200">
                  اختبارات بدون قسم
                </h4>
                <div className="mt-4 divide-y divide-slate-800/70">
                  {dashboard.quizzes
                    .filter((q) => q.folderId === null)
                    .map((quiz) => {
                      const qCount = dashboard.questions.filter(
                        (q) => q.quizId === quiz.id
                      ).length;
                      return (
                        <div
                          key={quiz.id}
                          className="flex flex-wrap items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">
                                {quiz.title}
                              </span>
                              <span className="text-slate-600">·</span>
                              <span className="font-mono text-xs text-slate-400 tabular-nums">
                                {qCount} سؤال
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedQuizId(quiz.id);
                                setActiveTab('questions');
                              }}
                              className="flex h-8 items-center gap-1 rounded-lg bg-sky-500/15 px-3 text-xs font-bold text-sky-200"
                            >
                              <span>الأسئلة</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditQuizModal(quiz)}
                              className="flex h-8 items-center gap-1 rounded-lg border border-slate-700 px-2.5 text-xs text-slate-300"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>تعديل</span>
                            </button>
                            {confirmDeleteQuizId === quiz.id ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteQuiz(quiz.id)}
                                className="h-8 rounded-lg bg-rose-600 px-2.5 text-xs font-bold text-white"
                              >
                                تأكيد
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteQuizId(quiz.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/30 text-rose-300"
                                aria-label="حذف"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Questions Manager */}
      {activeTab === 'questions' && dashboard && (
        <div className="rounded-3xl border border-slate-300/12 bg-slate-950/75 p-6 backdrop-blur-xl">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">بنك الأسئلة</h3>
              <p className="text-xs text-slate-400">
                اختر الاختبار لإضافة أو تعديل أو ترتيب أسئلته وتحديد المستوى (سهل / متوسط / صعب).
              </p>
            </div>
            <button
              type="button"
              onClick={openAddQuestionModal}
              disabled={!selectedQuizId}
              className="flex min-h-[42px] items-center gap-2 rounded-xl bg-gradient-to-l from-sky-500 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:opacity-95 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              <span className="whitespace-nowrap">إضافة سؤال جديد</span>
            </button>
          </div>

          {/* Quiz Selector + Difficulty Filter */}
          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <label
                htmlFor="admin-quiz-selector"
                className="mb-1.5 block text-xs font-semibold text-slate-300"
              >
                الاختبار المحدد
              </label>
              <select
                id="admin-quiz-selector"
                value={selectedQuizId ?? ''}
                onChange={(e) => setSelectedQuizId(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white outline-none focus:border-sky-400"
              >
                {dashboard.quizzes.map((qz) => {
                  const fName = dashboard.folders.find(
                    (f) => f.id === qz.folderId
                  )?.name;
                  return (
                    <option key={qz.id} value={qz.id}>
                      {fName ? `${fName} — ` : ''}
                      {qz.title}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-semibold text-slate-300">
                تصفية حسب المستوى
              </span>
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 p-1">
                {(['all', 'easy', 'medium', 'hard'] as QuizDifficultyFilter[]).map(
                  (lvl) => {
                    const count =
                      lvl === 'all'
                        ? selectedQuizQuestions.length
                        : selectedQuizQuestions.filter(
                            (q) => (q.difficulty || 'medium') === lvl
                          ).length;
                    const isSelected = questionDifficultyFilter === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setQuestionDifficultyFilter(lvl)}
                        className={`flex min-h-[34px] items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition ${
                          isSelected
                            ? 'bg-sky-500/20 text-sky-200'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>{difficultyLabel(lvl)}</span>
                        <span className="font-mono text-[11px] tabular-nums">
                          ({count})
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>

          {(() => {
            const visibleQuestions =
              questionDifficultyFilter === 'all'
                ? selectedQuizQuestions
                : selectedQuizQuestions.filter(
                    (q) => (q.difficulty || 'medium') === questionDifficultyFilter
                  );

            if (visibleQuestions.length === 0) {
              return (
                <div className="rounded-2xl border border-dashed border-slate-700 py-12 text-center">
                  <p className="text-sm text-slate-400">
                    لا توجد أسئلة في هذا الاختبار أو المستوى حالياً.
                  </p>
                  <button
                    type="button"
                    onClick={openAddQuestionModal}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-500/20 px-4 py-2 text-xs font-bold text-sky-200 hover:bg-sky-500/30"
                  >
                    <Plus className="h-4 w-4" />
                    <span>إضافة سؤال</span>
                  </button>
                </div>
              );
            }

            return (
              <div className="divide-y divide-slate-800/80">
                {visibleQuestions.map((q) => {
                  const globalIdx = selectedQuizQuestions.findIndex(
                    (item) => item.id === q.id
                  );
                  return (
                    <div
                      key={q.id}
                      className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 lg:flex-row lg:items-start lg:justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <span className="font-mono font-bold text-amber-300 tabular-nums">
                            #{String(globalIdx + 1).padStart(2, '0')}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={`font-semibold ${difficultyTextColor(
                              q.difficulty || 'medium'
                            )}`}
                          >
                            {difficultyLabel(q.difficulty || 'medium')}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {q.questionType === 'true_false'
                              ? 'صح / خطأ'
                              : 'اختيار متعدد'}
                          </span>
                          {q.imageUrl && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-sky-300">يحتوي على صورة</span>
                            </>
                          )}
                        </div>
                        <h4 className="text-base font-bold text-white">{q.question}</h4>
                        <div className="grid grid-cols-1 gap-1.5 pt-1 sm:grid-cols-2">
                          {q.options.map((opt, optIdx) => {
                            const isCorrect = optIdx === q.correctAnswer;
                            return (
                              <div
                                key={optIdx}
                                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs ${
                                  isCorrect
                                    ? 'bg-emerald-500/15 font-semibold text-emerald-300'
                                    : 'bg-slate-900/60 text-slate-400'
                                }`}
                              >
                                {isCorrect && (
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                                )}
                                <span>{opt}</span>
                                {isCorrect && (
                                  <span className="mr-auto text-[11px]">(صحيحة)</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {questionDifficultyFilter === 'all' && (
                          <>
                            <button
                              type="button"
                              disabled={globalIdx === 0}
                              onClick={() =>
                                handleMoveQuestion(
                                  selectedQuizQuestions,
                                  globalIdx,
                                  -1
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:border-slate-500 disabled:opacity-30"
                              title="تحريك للأعلى"
                              aria-label="تحريك للأعلى"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              disabled={
                                globalIdx === selectedQuizQuestions.length - 1
                              }
                              onClick={() =>
                                handleMoveQuestion(
                                  selectedQuizQuestions,
                                  globalIdx,
                                  1
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:border-slate-500 disabled:opacity-30"
                              title="تحريك للأسفل"
                              aria-label="تحريك للأسفل"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditQuestionModal(q)}
                          className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-700 px-3 text-xs font-semibold text-slate-200 hover:border-sky-400"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>تعديل</span>
                        </button>

                        {confirmDeleteQId === q.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="h-9 rounded-lg bg-rose-600 px-3 text-xs font-bold text-white hover:bg-rose-500"
                            >
                              تأكيد الحذف
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteQId(null)}
                              className="h-9 rounded-lg border border-slate-700 px-2.5 text-xs text-slate-300"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteQId(q.id)}
                            className="flex h-9 items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 text-xs font-semibold text-rose-200 hover:bg-rose-500/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>حذف</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 3: Participants & Real Scores */}
      {activeTab === 'participants' && dashboard && (
        <div className="rounded-3xl border border-slate-300/12 bg-slate-950/75 p-6 backdrop-blur-xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">سجل المشاركين والنتائج</h3>
              <p className="text-xs text-slate-400">
                الدرجات المحسوبة على الخادم محفوظة هنا وسرية تماماً عن المتحدين.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={participantQuizFilter}
                onChange={(e) => setParticipantQuizFilter(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-xs font-semibold text-white outline-none focus:border-sky-400"
              >
                <option value="all">كل الاختبارات</option>
                {dashboard.quizzes.map((qz) => (
                  <option key={qz.id} value={String(qz.id)}>
                    {qz.title}
                  </option>
                ))}
              </select>

              <div className="relative w-full sm:w-56">
                <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="بحث باسم المشارك..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2.5 pr-10 pl-4 text-sm text-white outline-none focus:border-sky-400"
                />
              </div>
            </div>
          </div>

          {filteredParticipants.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 py-12 text-center text-sm text-slate-400">
              {dashboard.participants.length === 0
                ? 'لم يشارك أي متسابق بعد.'
                : 'لا توجد نتائج مطابقة لبحثك.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-right text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400">
                    <th className="py-3 pl-4 font-semibold">اسم المشارك</th>
                    <th className="px-4 py-3 font-semibold">الاختبار / القسم</th>
                    <th className="px-4 py-3 font-semibold">المستوى</th>
                    <th className="px-4 py-3 font-semibold">المجاب عنها</th>
                    <th className="px-4 py-3 font-semibold">الصحيحة</th>
                    <th className="px-4 py-3 font-semibold">الخاطئة</th>
                    <th className="px-4 py-3 font-semibold">النتيجة</th>
                    <th className="px-4 py-3 font-semibold">تاريخ المشاركة</th>
                    <th className="py-3 pr-4 font-semibold">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {filteredParticipants.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/40">
                      <td className="py-3.5 pl-4 font-bold text-white">{p.name}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-300">
                        <div className="font-semibold text-white">{p.quizTitle}</div>
                        {p.folderName && (
                          <div className="text-[11px] text-slate-400">
                            {p.folderName}
                          </div>
                        )}
                      </td>
                      <td
                        className={`px-4 py-3.5 text-xs font-bold ${difficultyTextColor(
                          p.difficulty || 'all'
                        )}`}
                      >
                        {difficultyLabel(p.difficulty || 'all')}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-300 tabular-nums">
                        {p.answeredCount} / {p.totalQuestions}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-semibold text-emerald-400 tabular-nums">
                        {p.correctCount}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-semibold text-rose-400 tabular-nums">
                        {p.wrongCount}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-amber-300 tabular-nums">
                        {p.score}%
                      </td>
                      <td
                        className="px-4 py-3.5 font-mono text-xs text-slate-400 tabular-nums"
                        dir="ltr"
                      >
                        {new Date(p.startedAt).toLocaleString('en-GB', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewParticipant(p.id)}
                            className="flex h-8 items-center gap-1 rounded-lg border border-slate-700 px-2.5 text-xs font-semibold text-sky-300 hover:border-sky-400"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>التفاصيل</span>
                          </button>

                          {confirmDeletePId === p.id ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteParticipant(p.id)}
                              className="h-8 rounded-lg bg-rose-600 px-2.5 text-xs font-bold text-white"
                            >
                              تأكيد
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeletePId(p.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/30 text-rose-300 hover:bg-rose-500/15"
                              aria-label="حذف"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: JSON System & Global Controls */}
      {activeTab === 'json' && dashboard && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* JSON Import / Export Card */}
          <div className="space-y-5 rounded-3xl border border-slate-300/12 bg-slate-950/75 p-6 backdrop-blur-xl">
            <div>
              <h3 className="text-lg font-bold text-white">
                إدارة الأسئلة والنتائج عبر JSON
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                اختر الاختبار المستهدف لتنزيل أو استيراد أسئلته بصيغة JSON. استيراد أسئلة جديدة يحافظ على جميع نتائج المشاركين الحالية.
              </p>
            </div>

            <div>
              <label
                htmlFor="json-quiz-selector"
                className="mb-1.5 block text-xs font-semibold text-slate-300"
              >
                الاختبار المستهدف للتصدير والاستيراد
              </label>
              <select
                id="json-quiz-selector"
                value={selectedQuizId ?? ''}
                onChange={(e) => setSelectedQuizId(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white outline-none focus:border-sky-400"
              >
                {dashboard.quizzes.map((qz) => (
                  <option key={qz.id} value={qz.id}>
                    {qz.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDownloadQuestionsJson}
                className="flex min-h-[42px] items-center gap-2 rounded-xl border border-sky-400/35 bg-sky-500/15 px-4 py-2 text-xs font-bold text-sky-200 hover:bg-sky-500/25"
              >
                <Download className="h-4 w-4" />
                <span className="whitespace-nowrap">
                  Download JSON ({selectedQuizObject?.title ?? 'الأسئلة'})
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSampleTemplateJson}
                className="flex min-h-[42px] items-center gap-2 rounded-xl border border-amber-400/35 bg-amber-500/15 px-4 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/25"
              >
                <Download className="h-4 w-4" />
                <span className="whitespace-nowrap">
                  تنزيل قالب (سهل / متوسط / صعب)
                </span>
              </button>

              <button
                type="button"
                onClick={handleExportParticipantsJson}
                className="flex min-h-[42px] items-center gap-2 rounded-xl border border-violet-400/35 bg-violet-500/15 px-4 py-2 text-xs font-bold text-violet-200 hover:bg-violet-500/25"
              >
                <Download className="h-4 w-4" />
                <span className="whitespace-nowrap">
                  Export Participants/Results JSON
                </span>
              </button>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 text-xs text-slate-300">
              <p className="font-semibold text-slate-200">
                صيغة حقل المستوى في ملف JSON:
              </p>
              <p className="mt-1 font-mono text-[11px] text-sky-300" dir="ltr">
                &quot;difficulty&quot;: &quot;easy&quot; | &quot;medium&quot; |
                &quot;hard&quot; (أو &quot;سهل&quot; | &quot;متوسط&quot; | &quot;صعب&quot;)
              </p>
            </div>

            <div className="border-t border-slate-800 pt-5">
              <label className="mb-2 block text-xs font-bold text-slate-200">
                Import JSON (رفع ملف أسئلة أو لصقه للاختبار المحدد)
              </label>

              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 px-4 py-4 text-xs font-semibold text-slate-300 transition hover:border-sky-400 hover:text-white">
                <Upload className="h-4 w-4 text-sky-400" />
                <span>اختر ملف JSON من جهازك للاستيراد الفوري</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <textarea
                value={jsonPasteText}
                onChange={(e) => {
                  setJsonPasteText(e.target.value);
                  if (jsonError) setJsonError(null);
                }}
                rows={6}
                dir="ltr"
                placeholder='{"quizTitle": "Chapter 7 Quiz", "questions": [{"id": 1, "difficulty": "easy", "question": "...", "options": ["...", "..."], "correctAnswer": 0}]}'
                className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-900/80 p-3 font-mono text-xs text-slate-200 outline-none focus:border-sky-400"
              />

              {jsonError && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-500/35 bg-rose-500/10 p-3 text-xs text-rose-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  <span>{jsonError}</span>
                </div>
              )}

              <button
                type="button"
                disabled={importingJson || !jsonPasteText.trim()}
                onClick={() => processAndImportJson(jsonPasteText)}
                className="mt-3 flex min-h-[42px] items-center gap-2 rounded-xl bg-gradient-to-l from-sky-500 to-indigo-600 px-5 py-2 text-xs font-bold text-white disabled:opacity-40"
              >
                <Upload className="h-4 w-4" />
                <span>
                  {importingJson ? 'جارٍ التحقق والاستيراد...' : 'استيراد JSON الآن'}
                </span>
              </button>
            </div>
          </div>

          {/* Danger Controls Card */}
          <div className="space-y-6 rounded-3xl border border-slate-300/12 bg-slate-950/75 p-6 backdrop-blur-xl">
            <div>
              <h3 className="text-lg font-bold text-white">إدارة المنصة وإعادة الضبط</h3>
              <p className="mt-1 text-xs text-slate-400">
                يمكنك إيقاف جميع الاختبارات مؤقتاً من الشريط العلوي، أو تنظيف محاولات المشاركين أو إعادة ضبط المنصة.
              </p>
            </div>

            <div className="space-y-4 border-t border-slate-800 pt-5">
              <h4 className="text-sm font-bold text-rose-300">
                إجراءات إعادة الضبط والحذف
              </h4>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDangerAction('clear_participants')}
                  className="flex min-h-[42px] items-center gap-2 rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-200 hover:bg-rose-500/20"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>حذف محاولات المشاركين</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmDangerAction('reset_quiz')}
                  className="flex min-h-[42px] items-center gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/20"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>إعادة ضبط المنصة بالكامل</span>
                </button>
              </div>

              {confirmDangerAction && (
                <div className="rounded-2xl border border-rose-500/40 bg-rose-950/50 p-4 text-xs text-rose-100">
                  <p className="font-semibold">
                    {confirmDangerAction === 'clear_participants'
                      ? 'هل أنت متأكد من حذف جميع سجلات المشاركين وإجاباتهم نهائياً؟'
                      : 'هل أنت متأكد من إعادة ضبط المنصة بالكامل (سيتم حذف الأقسام والاختبارات والمشاركين وإرجاع الإعداد الافتراضي)؟'}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={handleDangerConfirm}
                      className="rounded-lg bg-rose-600 px-4 py-2 font-bold text-white hover:bg-rose-500"
                    >
                      نعم، تنفيذ الإجراء
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDangerAction(null)}
                      className="rounded-lg border border-slate-600 px-4 py-2 font-semibold text-slate-200"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Folder Add/Edit Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingFolder ? 'تعديل القسم (المجلد)' : 'إضافة قسم (مجلد) جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setShowFolderModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveFolder} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  اسم القسم (مثال: الشابتر السابع)
                </label>
                <input
                  type="text"
                  value={folderNameDraft}
                  onChange={(e) => setFolderNameDraft(e.target.value)}
                  required
                  minLength={2}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-sky-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  وصف مختصر (اختياري)
                </label>
                <input
                  type="text"
                  value={folderDescDraft}
                  onChange={(e) => setFolderDescDraft(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-sky-400"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="rounded-xl border border-slate-700 px-5 py-2.5 text-xs font-semibold text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingFolder}
                  className="rounded-xl bg-gradient-to-l from-amber-500 to-orange-500 px-6 py-2.5 text-xs font-bold text-slate-950 disabled:opacity-50"
                >
                  {savingFolder ? 'جارٍ الحفظ...' : 'حفظ القسم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quiz Add/Edit Modal */}
      {showQuizModal && dashboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingQuiz ? 'تعديل الاختبار' : 'إضافة اختبار جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setShowQuizModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveQuiz} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  عنوان الاختبار
                </label>
                <input
                  type="text"
                  value={quizTitleDraft}
                  onChange={(e) => setQuizTitleDraft(e.target.value)}
                  required
                  minLength={2}
                  placeholder="مثال: اختبار الشابتر السابع"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  القسم (المجلد)
                </label>
                <select
                  value={quizFolderDraft}
                  onChange={(e) => setQuizFolderDraft(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-sky-400"
                >
                  <option value="">بدون قسم</option>
                  {dashboard.folders.map((f) => (
                    <option key={f.id} value={String(f.id)}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  وصف مختصر (اختياري)
                </label>
                <input
                  type="text"
                  value={quizDescDraft}
                  onChange={(e) => setQuizDescDraft(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-sky-400"
                />
              </div>

              <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-200">
                <input
                  type="checkbox"
                  checked={quizActiveDraft}
                  onChange={(e) => setQuizActiveDraft(e.target.checked)}
                  className="h-4 w-4 accent-sky-500"
                />
                <span>الاختبار مفعّل للمشاركين</span>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuizModal(false)}
                  className="rounded-xl border border-slate-700 px-5 py-2.5 text-xs font-semibold text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingQuiz}
                  className="rounded-xl bg-gradient-to-l from-sky-500 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  {savingQuiz ? 'جارٍ الحفظ...' : 'حفظ الاختبار'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Add/Edit Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setShowQuestionModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                    نوع السؤال
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuestionTypeChange('multiple_choice')}
                      className={`rounded-xl px-3.5 py-2 text-xs font-bold ${
                        qType === 'multiple_choice'
                          ? 'border border-sky-400/50 bg-sky-500/25 text-sky-200'
                          : 'border border-slate-700 text-slate-400'
                      }`}
                    >
                      اختيار متعدد
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuestionTypeChange('true_false')}
                      className={`rounded-xl px-3.5 py-2 text-xs font-bold ${
                        qType === 'true_false'
                          ? 'border border-sky-400/50 bg-sky-500/25 text-sky-200'
                          : 'border border-slate-700 text-slate-400'
                      }`}
                    >
                      صح أو خطأ
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                    مستوى الصعوبة
                  </label>
                  <div className="flex gap-2">
                    {(['easy', 'medium', 'hard'] as QuestionDifficulty[]).map(
                      (lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setQDifficulty(lvl)}
                          className={`rounded-xl px-3.5 py-2 text-xs font-bold ${
                            qDifficulty === lvl
                              ? 'border border-amber-400/50 bg-amber-500/25 text-amber-200'
                              : 'border border-slate-700 text-slate-400'
                          }`}
                        >
                          {difficultyLabel(lvl)}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  نص السؤال
                </label>
                <textarea
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  rows={3}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  رابط صورة اختياري (https://)
                </label>
                <input
                  type="url"
                  value={qImageUrl}
                  onChange={(e) => setQImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  dir="ltr"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    الخيارات (حدد الإجابة الصحيحة)
                  </label>
                  {qType === 'multiple_choice' && qOptions.length < 8 && (
                    <button
                      type="button"
                      onClick={() => setQOptions([...qOptions, ''])}
                      className="text-xs font-semibold text-sky-300 hover:underline"
                    >
                      + إضافة خيار
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {qOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="correct-option"
                        checked={qCorrect === idx}
                        onChange={() => setQCorrect(idx)}
                        className="h-4 w-4 accent-emerald-500"
                        aria-label={`تحديد الخيار ${idx + 1} كإجابة صحيحة`}
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const next = [...qOptions];
                          next[idx] = e.target.value;
                          setQOptions(next);
                        }}
                        required
                        placeholder={`الخيار ${idx + 1}`}
                        className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm text-white outline-none focus:border-sky-400"
                      />
                      {qType === 'multiple_choice' && qOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = qOptions.filter((_, i) => i !== idx);
                            setQOptions(next);
                            if (qCorrect >= next.length) setQCorrect(0);
                          }}
                          className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/10"
                          aria-label="حذف الخيار"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="rounded-xl border border-slate-700 px-5 py-2.5 text-xs font-semibold text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingQuestion}
                  className="rounded-xl bg-gradient-to-l from-sky-500 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  {savingQuestion ? 'جارٍ الحفظ...' : 'حفظ السؤال'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Participant Details Modal */}
      {selectedParticipantDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  تفاصيل إجابات: {selectedParticipantDetails.participant.name}
                </h3>
                <p className="mt-1 font-mono text-xs text-slate-400 tabular-nums">
                  {selectedParticipantDetails.participant.quizTitle} · النتيجة:{' '}
                  {selectedParticipantDetails.participant.score}% · الصحيحة:{' '}
                  {selectedParticipantDetails.participant.correctCount} من{' '}
                  {selectedParticipantDetails.participant.totalQuestions}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedParticipantDetails(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedParticipantDetails.answers.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                لم يقم المشارك بالإجابة عن أي سؤال بعد.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedParticipantDetails.answers.map((ans, idx) => (
                  <div
                    key={ans.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono text-slate-400 tabular-nums">
                        سؤال #{idx + 1}
                      </span>
                      <span
                        className={`font-bold ${
                          ans.isCorrect ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {ans.isCorrect ? 'إجابة صحيحة' : 'إجابة خاطئة'}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-bold text-white">
                      {ans.questionText}
                    </p>
                    <div className="mt-2.5 space-y-1 text-xs">
                      <p className="text-slate-300">
                        إجابة المشارك:{' '}
                        <span
                          className={
                            ans.isCorrect
                              ? 'font-semibold text-emerald-300'
                              : 'font-semibold text-rose-300'
                          }
                        >
                          {ans.optionsSnapshot[ans.selectedOption] ?? 'غير معروف'}
                        </span>
                      </p>
                      {!ans.isCorrect && (
                        <p className="text-slate-300">
                          الإجابة الصحيحة:{' '}
                          <span className="font-semibold text-emerald-300">
                            {ans.optionsSnapshot[ans.correctOption] ?? 'غير معروف'}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.section>
  );
}

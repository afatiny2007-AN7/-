import 'dotenv/config';
import express from 'express';
import { pool } from './db/index.ts';
import {
  clearAllParticipantsRecords,
  createFolderRecord,
  createQuestionRecord,
  createQuizRecord,
  deleteFolderRecord,
  deleteParticipantRecord,
  deleteQuestionRecord,
  deleteQuizRecord,
  type DifficultyFilter,
  type DifficultyLevel,
  ensureQuizInitialized,
  exportAllParticipantsJsonPayload,
  exportQuestionsJsonPayload,
  getAdminDashboardData,
  getParticipantWithDetails,
  getPublicQuizCatalog,
  getSampleDifficultyTemplateJson,
  importQuestionsFromJsonPayload,
  normalizeDifficulty,
  reorderQuestionRecords,
  resetQuizToDefaultsRecord,
  sanitizeImageUrl,
  startQuizSession,
  submitQuizAnswer,
  updateFolderRecord,
  updateQuestionRecord,
  updateQuizRecord,
  updateQuizSettingsRecord,
} from './db/queries.ts';
import {
  type AuthRequest,
  getAdminGateStatus,
  requireAdmin,
  requireAuth,
  verifyAndUnlockAdmin,
} from './middleware/auth.ts';

export const app = express();

app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));

// ==========================================
// Health Check API
// ==========================================

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    await ensureQuizInitialized();
    res.json({ status: 'ok', database: 'connected' });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error?.message || 'Database connection failed',
    });
  }
});

// ==========================================
// Public Quiz API (Never exposes answers/scores)
// ==========================================

app.get('/api/quiz/status', async (_req, res) => {
  try {
    const catalog = await getPublicQuizCatalog();
    res.json(catalog);
  } catch (error: any) {
    res
      .status(500)
      .json({ error: error?.message || 'تعذر تحميل قائمة الاختبارات.' });
  }
});

app.post('/api/quiz/start', async (req, res) => {
  try {
    const rawName = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (rawName.length < 2 || rawName.length > 60) {
      return res.status(400).json({
        error: 'يرجى إدخال اسم صحيح (من حرفين إلى 60 حرفاً).',
      });
    }

    const quizId =
      req.body?.quizId !== undefined && req.body?.quizId !== null
        ? Number(req.body.quizId)
        : null;
    if (quizId !== null && !Number.isInteger(quizId)) {
      return res.status(400).json({ error: 'معرف الاختبار غير صالح.' });
    }

    const rawDifficulty =
      typeof req.body?.difficulty === 'string'
        ? req.body.difficulty.trim().toLowerCase()
        : 'all';
    const allowedFilters: DifficultyFilter[] = ['all', 'easy', 'medium', 'hard'];
    const difficultyFilter: DifficultyFilter = allowedFilters.includes(
      rawDifficulty as DifficultyFilter
    )
      ? (rawDifficulty as DifficultyFilter)
      : 'all';

    const result = await startQuizSession(rawName, quizId, difficultyFilter);
    if ('error' in result) {
      if (result.error === 'QUIZ_NOT_FOUND') {
        return res.status(404).json({ error: 'الاختبار المحدد غير موجود.' });
      }
      if (result.error === 'QUIZ_INACTIVE') {
        return res
          .status(403)
          .json({ error: 'هذا الاختبار متوقف حالياً من قِبل الإدارة.' });
      }
      if (result.error === 'NO_QUESTIONS') {
        return res
          .status(404)
          .json({ error: 'لا توجد أسئلة متاحة لهذا الاختبار والمستوى حالياً.' });
      }
    }

    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'تعذر بدء التحدي.' });
  }
});

app.post('/api/quiz/answer', async (req, res) => {
  try {
    const sessionToken =
      typeof req.body?.sessionToken === 'string' ? req.body.sessionToken.trim() : '';
    const questionId = Number(req.body?.questionId);
    const selectedOption = Number(req.body?.selectedOption);

    if (
      !sessionToken ||
      !Number.isInteger(questionId) ||
      !Number.isInteger(selectedOption)
    ) {
      return res.status(400).json({ error: 'بيانات الإجابة غير صالحة.' });
    }

    const result = await submitQuizAnswer(sessionToken, questionId, selectedOption);
    if ('error' in result) {
      if (result.error === 'INVALID_SESSION') {
        return res.status(404).json({ error: 'جلسة الاختبار غير موجودة.' });
      }
      if (result.error === 'ALREADY_COMPLETED') {
        return res.status(400).json({ error: 'تم إكمال هذا الاختبار مسبقاً.' });
      }
      if (result.error === 'QUESTION_MISMATCH') {
        return res.status(409).json({ error: 'ترتيب السؤال غير متطابق.' });
      }
      if (result.error === 'INVALID_OPTION') {
        return res.status(400).json({ error: 'الخيار المحدد غير صالح.' });
      }
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'تعذر حفظ الإجابة.' });
  }
});

// ==========================================
// Admin Authentication & Gate API
// ==========================================

app.get('/api/admin/auth-status', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user || !req.dbUser) {
      return res.status(401).json({ error: 'غير مصرح.' });
    }
    const status = await getAdminGateStatus(req.user.uid, req.dbUser.role);
    res.json({
      email: req.dbUser.email,
      displayName: req.dbUser.displayName,
      ...status,
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'تعذر التحقق من حالة الإدارة.' });
  }
});

app.post('/api/admin/verify', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user || !req.dbUser) {
      return res.status(401).json({ error: 'غير مصرح.' });
    }
    const adminName =
      typeof req.body?.adminName === 'string' ? req.body.adminName : '';
    const passcode =
      typeof req.body?.passcode === 'string' ? req.body.passcode : '';

    const outcome = await verifyAndUnlockAdmin({
      uid: req.user.uid,
      currentRole: req.dbUser.role,
      adminName,
      passcode,
    });

    if (!outcome.ok) {
      return res.status(outcome.status).json({ error: outcome.error });
    }

    res.json({ adminToken: outcome.adminToken });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'تعذر التحقق من صلاحية الإدارة.' });
  }
});

// ==========================================
// Protected Admin Dashboard API
// ==========================================

function validateQuestionInput(body: any):
  | {
      valid: true;
      data: {
        question: string;
        questionType: 'multiple_choice' | 'true_false';
        difficulty: DifficultyLevel;
        options: string[];
        correctAnswer: number;
        imageUrl: string | null;
      };
    }
  | { valid: false; error: string } {
  const question = typeof body?.question === 'string' ? body.question.trim() : '';
  if (question.length < 3 || question.length > 600) {
    return { valid: false, error: 'نص السؤال يجب أن يكون بين 3 و 600 حرف.' };
  }

  const questionType =
    body?.questionType === 'true_false' ? 'true_false' : 'multiple_choice';

  const difficulty = normalizeDifficulty(body?.difficulty);
  if (!difficulty) {
    return {
      valid: false,
      error: 'مستوى الصعوبة غير صالح. القيم المسموحة: easy / medium / hard.',
    };
  }

  if (!Array.isArray(body?.options) || body.options.length < 2 || body.options.length > 8) {
    return { valid: false, error: 'يجب توفير ما بين خيارين إلى 8 خيارات.' };
  }

  const options = body.options.map((opt: unknown) =>
    typeof opt === 'string' ? opt.trim() : ''
  );
  if (options.some((opt: string) => opt.length === 0 || opt.length > 300)) {
    return { valid: false, error: 'جميع الخيارات يجب أن تكون نصوصاً غير فارغة.' };
  }

  const correctAnswer = Number(body?.correctAnswer);
  if (
    !Number.isInteger(correctAnswer) ||
    correctAnswer < 0 ||
    correctAnswer >= options.length
  ) {
    return { valid: false, error: 'مؤشر الإجابة الصحيحة غير صالح.' };
  }

  const rawImageUrl = typeof body?.imageUrl === 'string' ? body.imageUrl.trim() : '';
  const safeImageUrl = rawImageUrl ? sanitizeImageUrl(rawImageUrl) : null;
  if (rawImageUrl && !safeImageUrl) {
    return {
      valid: false,
      error: 'رابط الصورة غير صالح. استخدم رابطاً يبدأ بـ https:// أو http://.',
    };
  }

  return {
    valid: true,
    data: {
      question,
      questionType,
      difficulty,
      options,
      correctAnswer,
      imageUrl: safeImageUrl,
    },
  };
}

app.get('/api/admin/dashboard', requireAdmin, async (_req, res) => {
  try {
    const data = await getAdminDashboardData();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'تعذر تحميل لوحة الإدارة.' });
  }
});

// Folders CRUD
app.post('/api/admin/folders', requireAdmin, async (req, res) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const description =
      typeof req.body?.description === 'string' ? req.body.description.trim() : null;
    if (name.length < 2 || name.length > 100) {
      return res
        .status(400)
        .json({ error: 'اسم القسم يجب أن يكون بين حرفين و 100 حرف.' });
    }
    const created = await createFolderRecord({ name, description });
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'تعذر إنشاء القسم.' });
  }
});

app.put('/api/admin/folders/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'معرف القسم غير صالح.' });
    }
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const description =
      typeof req.body?.description === 'string' ? req.body.description.trim() : null;
    if (name.length < 2 || name.length > 100) {
      return res
        .status(400)
        .json({ error: 'اسم القسم يجب أن يكون بين حرفين و 100 حرف.' });
    }
    const updated = await updateFolderRecord(id, { name, description });
    if (!updated) return res.status(404).json({ error: 'القسم غير موجود.' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'تعذر تحديث القسم.' });
  }
});

app.delete('/api/admin/folders/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'معرف القسم غير صالح.' });
    }
    const deleted = await deleteFolderRecord(id);
    if (!deleted) return res.status(404).json({ error: 'القسم غير موجود.' });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'تعذر حذف القسم.' });
  }
});

// Quizzes CRUD
app.post('/api/admin/quizzes', requireAdmin, async (req, res) => {
  try {
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    if (title.length < 2 || title.length > 120) {
      return res
        .status(400)
        .json({ error: 'عنوان الاختبار يجب أن يكون بين حرفين و 120 حرفاً.' });
    }
    const folderId =
      req.body?.folderId !== undefined &&
      req.body?.folderId !== null &&
      req.body?.folderId !== ''
        ? Number(req.body.folderId)
        : null;
    if (folderId !== null && !Number.isInteger(folderId)) {
      return res.status(400).json({ error: 'معرف القسم غير صالح.' });
    }
    const description =
      typeof req.body?.description === 'string' ? req.body.description.trim() : null;
    const isActive =
      typeof req.body?.isActive === 'boolean' ? req.body.isActive : true;

    const created = await createQuizRecord({
      folderId,
      title,
      description,
      isActive,
    });
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'تعذر إنشاء الاختبار.' });
  }
});

app.put('/api/admin/quizzes/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'معرف الاختبار غير صالح.' });
    }
    const title =
      typeof req.body?.title === 'string' ? req.body.title.trim() : undefined;
    if (title !== undefined && (title.length < 2 || title.length > 120)) {
      return res
        .status(400)
        .json({ error: 'عنوان الاختبار يجب أن يكون بين حرفين و 120 حرفاً.' });
    }
    let folderId: number | null | undefined = undefined;
    if (req.body?.folderId !== undefined) {
      folderId =
        req.body.folderId === null || req.body.folderId === ''
          ? null
          : Number(req.body.folderId);
      if (folderId !== null && !Number.isInteger(folderId)) {
        return res.status(400).json({ error: 'معرف القسم غير صالح.' });
      }
    }
    const description =
      req.body?.description !== undefined
        ? typeof req.body.description === 'string'
          ? req.body.description.trim()
          : null
        : undefined;
    const isActive =
      typeof req.body?.isActive === 'boolean' ? req.body.isActive : undefined;

    const updated = await updateQuizRecord(id, {
      folderId,
      title,
      description,
      isActive,
    });
    if (!updated) return res.status(404).json({ error: 'الاختبار غير موجود.' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'تعذر تحديث الاختبار.' });
  }
});

app.delete('/api/admin/quizzes/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'معرف الاختبار غير صالح.' });
    }
    const deleted = await deleteQuizRecord(id);
    if (!deleted) return res.status(404).json({ error: 'الاختبار غير موجود.' });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'تعذر حذف الاختبار.' });
  }
});

// Questions CRUD
app.post('/api/admin/questions', requireAdmin, async (req, res) => {
  try {
    const quizId = Number(req.body?.quizId);
    if (!Number.isInteger(quizId)) {
      return res.status(400).json({ error: 'يرجى تحديد الاختبار أولاً.' });
    }
    const parsed = validateQuestionInput(req.body);
    if (!parsed.valid) {
      return res.status(400).json({ error: parsed.error });
    }
    const created = await createQuestionRecord({ quizId, ...parsed.data });
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'تعذر إضافة السؤال.' });
  }
});

app.put('/api/admin/questions/reorder', requireAdmin, async (req, res) => {
  try {
    const orderedIds = req.body?.orderedIds;
    if (
      !Array.isArray(orderedIds) ||
      orderedIds.some((id) => !Number.isInteger(Number(id)))
    ) {
      return res.status(400).json({ error: 'قائمة ترتيب الأسئلة غير صالحة.' });
    }
    const updated = await reorderQuestionRecords(orderedIds.map(Number));
    res.json({ questions: updated });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'تعذر إعادة ترتيب الأسئلة.' });
  }
});

app.put('/api/admin/questions/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'معرف السؤال غير صالح.' });
    }
    const parsed = validateQuestionInput(req.body);
    if (!parsed.valid) {
      return res.status(400).json({ error: parsed.error });
    }
    const updated = await updateQuestionRecord(id, parsed.data);
    if (!updated) {
      return res.status(404).json({ error: 'السؤال غير موجود.' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'تعذر تحديث السؤال.' });
  }
});

app.delete('/api/admin/questions/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'معرف السؤال غير صالح.' });
    }
    const deleted = await deleteQuestionRecord(id);
    if (!deleted) {
      return res.status(404).json({ error: 'السؤال غير موجود.' });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'تعذر حذف السؤال.' });
  }
});

app.put('/api/admin/settings', requireAdmin, async (req, res) => {
  try {
    const quizTitle =
      typeof req.body?.quizTitle === 'string' ? req.body.quizTitle.trim() : undefined;
    const isActive =
      typeof req.body?.isActive === 'boolean' ? req.body.isActive : undefined;

    if (quizTitle !== undefined && (quizTitle.length < 2 || quizTitle.length > 120)) {
      return res
        .status(400)
        .json({ error: 'عنوان الاختبار يجب أن يكون بين 2 و 120 حرفاً.' });
    }

    const updated = await updateQuizSettingsRecord({ quizTitle, isActive });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'تعذر تحديث الإعدادات.' });
  }
});

app.get('/api/admin/json/export-questions', requireAdmin, async (req, res) => {
  try {
    const quizId = req.query.quizId ? Number(req.query.quizId) : undefined;
    if (quizId !== undefined && !Number.isInteger(quizId)) {
      return res.status(400).json({ error: 'معرف الاختبار غير صالح.' });
    }
    const payload = await exportQuestionsJsonPayload(quizId);
    res.json(payload);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'تعذر تصدير ملف الأسئلة.' });
  }
});

app.get('/api/admin/json/sample-template', requireAdmin, async (_req, res) => {
  try {
    res.json(getSampleDifficultyTemplateJson());
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'تعذر إنشاء القالب.' });
  }
});

app.post('/api/admin/json/import-questions', requireAdmin, async (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'صيغة ملف JSON غير صالحة.' });
    }

    const quizId = Number(req.query.quizId ?? body.targetQuizId);
    if (!Number.isInteger(quizId)) {
      return res.status(400).json({ error: 'يرجى تحديد الاختبار المستهدف للاستيراد.' });
    }

    const quizTitle =
      typeof body.quizTitle === 'string' && body.quizTitle.trim().length >= 2
        ? body.quizTitle.trim()
        : '';
    if (!quizTitle) {
      return res.status(400).json({
        error: 'حقل "quizTitle" مطلوب ويجب أن يكون نصاً لا يقل عن حرفين.',
      });
    }

    if (!Array.isArray(body.questions) || body.questions.length === 0) {
      return res.status(400).json({
        error: 'حقل "questions" يجب أن يكون مصفوفة تحتوي على سؤال واحد على الأقل.',
      });
    }

    const validatedQuestions: Array<{
      id?: number;
      question: string;
      questionType?: 'multiple_choice' | 'true_false';
      difficulty: DifficultyLevel;
      options: string[];
      correctAnswer: number;
      imageUrl?: string | null;
    }> = [];

    for (let i = 0; i < body.questions.length; i++) {
      const q = body.questions[i];
      const idxLabel = `السؤال رقم ${i + 1}`;
      if (!q || typeof q !== 'object') {
        return res.status(400).json({ error: `${idxLabel}: بنية السؤال غير صالحة.` });
      }
      if (typeof q.question !== 'string' || q.question.trim().length < 2) {
        return res.status(400).json({
          error: `${idxLabel}: حقل "question" مطلوب ويجب أن يحتوي على نص صالح.`,
        });
      }
      const difficulty = normalizeDifficulty(q.difficulty);
      if (!difficulty) {
        return res.status(400).json({
          error: `${idxLabel}: حقل "difficulty" غير صالح. القيم المسموحة: easy / medium / hard (أو سهل / متوسط / صعب).`,
        });
      }
      if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 8) {
        return res.status(400).json({
          error: `${idxLabel}: حقل "options" يجب أن يحتوي على خيارين إلى 8 خيارات.`,
        });
      }
      const cleanOptions = q.options.map((opt: unknown) =>
        typeof opt === 'string' ? opt.trim() : ''
      );
      if (cleanOptions.some((opt: string) => opt.length === 0)) {
        return res.status(400).json({
          error: `${idxLabel}: جميع الخيارات داخل "options" يجب أن تكون نصوصاً غير فارغة.`,
        });
      }
      if (
        !Number.isInteger(q.correctAnswer) ||
        q.correctAnswer < 0 ||
        q.correctAnswer >= cleanOptions.length
      ) {
        return res.status(400).json({
          error: `${idxLabel}: حقل "correctAnswer" يجب أن يكون رقماً صحيحاً بين 0 و ${cleanOptions.length - 1}.`,
        });
      }
      const safeImg =
        typeof q.imageUrl === 'string' && q.imageUrl.trim()
          ? sanitizeImageUrl(q.imageUrl)
          : null;
      if (typeof q.imageUrl === 'string' && q.imageUrl.trim() && !safeImg) {
        return res.status(400).json({
          error: `${idxLabel}: رابط "imageUrl" غير صالح (يُسمح فقط بـ http/https).`,
        });
      }

      validatedQuestions.push({
        id: typeof q.id === 'number' ? q.id : i + 1,
        question: q.question.trim(),
        questionType: q.questionType === 'true_false' ? 'true_false' : 'multiple_choice',
        difficulty,
        options: cleanOptions,
        correctAnswer: q.correctAnswer,
        imageUrl: safeImg,
      });
    }

    const result = await importQuestionsFromJsonPayload(
      quizId,
      quizTitle,
      validatedQuestions
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'تعذر استيراد ملف JSON.' });
  }
});

app.get('/api/admin/json/export-participants', requireAdmin, async (_req, res) => {
  try {
    const payload = await exportAllParticipantsJsonPayload();
    res.json(payload);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'تعذر تصدير نتائج المشاركين.' });
  }
});

app.get('/api/admin/participants/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'معرف المشارك غير صالح.' });
    }
    const details = await getParticipantWithDetails(id);
    if (!details) {
      return res.status(404).json({ error: 'المشارك غير موجود.' });
    }
    res.json(details);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'تعذر جلب تفاصيل المشارك.' });
  }
});

app.delete('/api/admin/participants/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'معرف المشارك غير صالح.' });
    }
    const deleted = await deleteParticipantRecord(id);
    if (!deleted) {
      return res.status(404).json({ error: 'المشارك غير موجود.' });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'تعذر حذف محاولة المشارك.' });
  }
});

app.delete('/api/admin/participants', requireAdmin, async (_req, res) => {
  try {
    await clearAllParticipantsRecords();
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'تعذر حذف محاولات المشاركين.' });
  }
});

app.post('/api/admin/reset', requireAdmin, async (_req, res) => {
  try {
    await resetQuizToDefaultsRecord();
    const data = await getAdminDashboardData();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'تعذر إعادة ضبط الاختبار.' });
  }
});

export default app;

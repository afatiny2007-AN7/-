import crypto from 'crypto';
import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import { db, pool } from './index.ts';
import { INITIAL_FOLDER_CATALOG } from './seed-data.ts';
import {
  folders,
  participantAnswers,
  participants,
  questions,
  quizSettings,
  quizzes,
  users,
} from './schema.ts';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type DifficultyFilter = 'all' | DifficultyLevel;

export interface SeedQuestion {
  externalId: number;
  question: string;
  questionType: 'multiple_choice' | 'true_false';
  difficulty: DifficultyLevel;
  options: string[];
  correctAnswer: number;
  imageUrl?: string | null;
}

export const DEFAULT_QUIZ_TITLE = 'QUIZVERSE Challenge';
export const DEFAULT_FOLDER_NAME = 'القسم العام';

export const DEFAULT_SEED_QUESTIONS: SeedQuestion[] = [
  {
    externalId: 1,
    difficulty: 'easy',
    question:
      'ما هي الوحدة المسؤولة عن تنفيذ العمليات الحسابية والمنطقية داخل الحاسوب (CPU)؟',
    questionType: 'multiple_choice',
    options: [
      'وحدة المعالجة المركزية (Central Processing Unit)',
      'وحدة التخزين المؤقت (Cache Memory)',
      'اللوحة الأم (Motherboard)',
      'مزود الطاقة (Power Supply)',
    ],
    correctAnswer: 0,
  },
  {
    externalId: 2,
    difficulty: 'easy',
    question: 'أيٌّ من هذه اللغات تُعدّ اللغة الأساسية لهيكلة صفحات الويب؟',
    questionType: 'multiple_choice',
    options: ['HTML', 'SQL', 'Assembly', 'Bash'],
    correctAnswer: 0,
  },
  {
    externalId: 3,
    difficulty: 'easy',
    question: 'ما الكوكب المعروف بلقب «الكوكب الأحمر» في مجموعتنا الشمسية؟',
    questionType: 'multiple_choice',
    options: ['الزهرة', 'المريخ', 'المشتري', 'زحل'],
    correctAnswer: 1,
  },
  {
    externalId: 4,
    difficulty: 'easy',
    question:
      'تعتمد الذاكرة العشوائية (RAM) على الاحتفاظ بالبيانات حتى بعد إطفاء الجهاز بالكامل.',
    questionType: 'true_false',
    options: ['صحيح', 'خطأ'],
    correctAnswer: 1,
  },
  {
    externalId: 5,
    difficulty: 'medium',
    question: 'في بروتوكول HTTP، أي رمز حالة يشير إلى أن الطلب تم بنجاح تام؟',
    questionType: 'multiple_choice',
    options: ['404', '500', '200', '302'],
    correctAnswer: 2,
  },
  {
    externalId: 6,
    difficulty: 'medium',
    question: 'كم يبلغ عدد البتّات (Bits) في البايت الواحد (1 Byte)؟',
    questionType: 'multiple_choice',
    options: ['4 بت', '8 بت', '16 بت', '32 بت'],
    correctAnswer: 1,
  },
  {
    externalId: 7,
    difficulty: 'medium',
    question:
      'ما التقنية التي تتيح تشغيل واجهات المستخدم التفاعلية بسرعة عالية داخل المتصفح باستخدام شجرة DOM افتراضية؟',
    questionType: 'multiple_choice',
    options: ['React', 'PostgreSQL', 'NGINX', 'Docker'],
    correctAnswer: 0,
  },
  {
    externalId: 8,
    difficulty: 'medium',
    question: 'أي عنصر كيميائي يرمز له بالرمز (Au) في الجدول الدوري؟',
    questionType: 'multiple_choice',
    options: ['الفضة', 'الألمنيوم', 'الذهب', 'النحاس'],
    correctAnswer: 2,
  },
  {
    externalId: 9,
    difficulty: 'hard',
    question:
      'ما التعقيد الزمني (Time Complexity) للبحث الثنائي (Binary Search) في مصفوفة مرتبة؟',
    questionType: 'multiple_choice',
    options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
    correctAnswer: 1,
  },
  {
    externalId: 10,
    difficulty: 'hard',
    question:
      'في قواعد البيانات العلائقية، ما الخاصية التي تضمن تنفيذ المعاملة بالكامل أو التراجع عنها بالكامل؟',
    questionType: 'multiple_choice',
    options: [
      'Atomicity (الذرية)',
      'Sharding (التجزئة)',
      'Indexing (الفهرسة)',
      'Replication (النسخ المتماثل)',
    ],
    correctAnswer: 0,
  },
  {
    externalId: 11,
    difficulty: 'hard',
    question:
      'أيٌّ من هذه البروتوكولات يعمل في طبقة النقل (Transport Layer) ويضمن وصول الحزم بالترتيب دون فقدان؟',
    questionType: 'multiple_choice',
    options: ['UDP', 'TCP', 'ICMP', 'ARP'],
    correctAnswer: 1,
  },
  {
    externalId: 12,
    difficulty: 'hard',
    question:
      'ما اسم الخوارزمية المستخدمة لإيجاد أقصر مسار في رسم بياني بأوزان غير سالبة؟',
    questionType: 'multiple_choice',
    options: ['Kruskal', 'Dijkstra', 'Bubble Sort', 'DFS'],
    correctAnswer: 1,
  },
];

export function normalizeDifficulty(value: unknown): DifficultyLevel | null {
  if (value === undefined || value === null || value === '') return 'medium';
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'easy' || normalized === 'سهل') return 'easy';
  if (normalized === 'medium' || normalized === 'متوسط') return 'medium';
  if (normalized === 'hard' || normalized === 'صعب') return 'hard';
  return null;
}

export function sanitizeImageUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/src/assets/')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string | null
) {
  try {
    const configuredAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const isEnvAdmin =
      Boolean(configuredAdminEmail) && email.toLowerCase() === configuredAdminEmail;

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.uid, uid))
      .limit(1);

    if (existing.length > 0) {
      const targetRole = isEnvAdmin ? 'admin' : existing[0].role;
      const updated = await db
        .update(users)
        .set({
          email,
          displayName: displayName ?? existing[0].displayName,
          role: targetRole,
        })
        .where(eq(users.uid, uid))
        .returning();
      return updated[0];
    }

    const inserted = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName ?? null,
        role: isEnvAdmin ? 'admin' : 'user',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName ?? null,
        },
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('تعذر مزامنة بيانات المستخدم.', { cause: error });
  }
}

export async function hasAnyAdminUser(): Promise<boolean> {
  try {
    const admins = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(1);
    return admins.length > 0;
  } catch (error) {
    console.error('Database query failed in hasAnyAdminUser:', error);
    throw new Error('تعذر التحقق من صلاحيات الإدارة.', { cause: error });
  }
}

export async function promoteUserToAdmin(uid: string) {
  try {
    const updated = await db
      .update(users)
      .set({ role: 'admin' })
      .where(eq(users.uid, uid))
      .returning();
    return updated[0];
  } catch (error) {
    console.error('Database query failed in promoteUserToAdmin:', error);
    throw new Error('تعذر ترقية صلاحية الإدارة.', { cause: error });
  }
}

async function ensureSchemaTablesExist() {
  const check = await pool.query<{ tbl: string | null }>(
    "SELECT to_regclass('public.quiz_settings') AS tbl"
  );
  if (check.rows[0]?.tbl) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      uid TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      display_name TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS quiz_settings (
      id SERIAL PRIMARY KEY,
      quiz_title TEXT NOT NULL DEFAULT 'QUIZVERSE Challenge',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      admin_passcode_hash TEXT,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS folders (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id SERIAL PRIMARY KEY,
      folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
      external_id INTEGER,
      question TEXT NOT NULL,
      question_type TEXT NOT NULL DEFAULT 'multiple_choice',
      difficulty TEXT NOT NULL DEFAULT 'medium',
      options JSONB NOT NULL,
      correct_answer INTEGER NOT NULL,
      image_url TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS participants (
      id SERIAL PRIMARY KEY,
      quiz_id INTEGER REFERENCES quizzes(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      quiz_title TEXT NOT NULL,
      folder_name TEXT,
      difficulty TEXT NOT NULL DEFAULT 'all',
      total_questions INTEGER NOT NULL,
      answered_count INTEGER NOT NULL DEFAULT 0,
      correct_count INTEGER NOT NULL DEFAULT 0,
      wrong_count INTEGER NOT NULL DEFAULT 0,
      score INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'in_progress',
      session_token TEXT NOT NULL UNIQUE,
      started_at TIMESTAMP NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS participant_answers (
      id SERIAL PRIMARY KEY,
      participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
      question_id INTEGER REFERENCES questions(id) ON DELETE SET NULL,
      question_text TEXT NOT NULL,
      options_snapshot JSONB NOT NULL,
      selected_option INTEGER NOT NULL,
      correct_option INTEGER NOT NULL,
      is_correct BOOLEAN NOT NULL,
      answered_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}

async function seedInitialFolderCatalog() {
  for (let fIdx = 0; fIdx < INITIAL_FOLDER_CATALOG.length; fIdx++) {
    const folderDef = INITIAL_FOLDER_CATALOG[fIdx];
    const [createdFolder] = await db
      .insert(folders)
      .values({
        name: folderDef.name,
        description: folderDef.description,
        sortOrder: fIdx + 1,
      })
      .returning();

    for (let qzIdx = 0; qzIdx < folderDef.quizzes.length; qzIdx++) {
      const quizDef = folderDef.quizzes[qzIdx];
      const [createdQuiz] = await db
        .insert(quizzes)
        .values({
          folderId: createdFolder.id,
          title: quizDef.title,
          description: quizDef.description,
          isActive: quizDef.isActive,
          sortOrder: qzIdx + 1,
        })
        .returning();

      if (quizDef.questions.length > 0) {
        await db.insert(questions).values(
          quizDef.questions.map((q, idx) => ({
            quizId: createdQuiz.id,
            externalId: q.externalId,
            question: q.question,
            questionType: q.questionType,
            difficulty: q.difficulty,
            options: q.options,
            correctAnswer: q.correctAnswer,
            imageUrl: q.imageUrl ?? null,
            sortOrder: idx + 1,
          }))
        );
      }
    }
  }
}

let initQuizPromise: Promise<void> | null = null;

export async function ensureQuizInitialized() {
  if (!initQuizPromise) {
    initQuizPromise = (async () => {
      try {
        await ensureSchemaTablesExist();

        let existingSettings = await db.select().from(quizSettings).limit(1);
        if (existingSettings.length === 0) {
          existingSettings = await db
            .insert(quizSettings)
            .values({
              quizTitle: DEFAULT_QUIZ_TITLE,
              isActive: true,
            })
            .returning();
        }

        let existingQuizzes = await db
          .select()
          .from(quizzes)
          .orderBy(asc(quizzes.sortOrder), asc(quizzes.id))
          .limit(1);

        if (existingQuizzes.length === 0) {
          await seedInitialFolderCatalog();
          existingQuizzes = await db
            .select()
            .from(quizzes)
            .orderBy(asc(quizzes.sortOrder), asc(quizzes.id))
            .limit(1);
        }

        if (existingQuizzes.length > 0) {
          const primaryQuizId = existingQuizzes[0].id;
          await db
            .update(questions)
            .set({ quizId: primaryQuizId })
            .where(isNull(questions.quizId));

          await db
            .update(participants)
            .set({ quizId: primaryQuizId })
            .where(isNull(participants.quizId));
        }
      } catch (error) {
        initQuizPromise = null;
        console.error('Database query failed in ensureQuizInitialized:', error);
        throw new Error('تعذر تهيئة بيانات الاختبار.', { cause: error });
      }
    })();
  }
  return initQuizPromise;
}

export async function getQuizSettingsRow() {
  try {
    await ensureQuizInitialized();
    const rows = await db.select().from(quizSettings).limit(1);
    return rows[0];
  } catch (error) {
    console.error('Database query failed in getQuizSettingsRow:', error);
    throw new Error('تعذر جلب إعدادات الاختبار.', { cause: error });
  }
}

export async function saveAdminPasscodeHash(hash: string) {
  try {
    const settings = await getQuizSettingsRow();
    const updated = await db
      .update(quizSettings)
      .set({ adminPasscodeHash: hash, updatedAt: new Date() })
      .where(eq(quizSettings.id, settings.id))
      .returning();
    return updated[0];
  } catch (error) {
    console.error('Database query failed in saveAdminPasscodeHash:', error);
    throw new Error('تعذر حفظ كلمة مرور الإدارة.', { cause: error });
  }
}

export async function getPublicQuizCatalog() {
  try {
    const settings = await getQuizSettingsRow();
    const allFolders = await db
      .select()
      .from(folders)
      .orderBy(asc(folders.sortOrder), asc(folders.id));

    const allQuizzes = await db
      .select()
      .from(quizzes)
      .orderBy(asc(quizzes.sortOrder), asc(quizzes.id));

    const allQuestions = await db
      .select({
        id: questions.id,
        quizId: questions.quizId,
        difficulty: questions.difficulty,
      })
      .from(questions);

    const folderMap = new Map(allFolders.map((f) => [f.id, f.name]));

    const quizSummaries = allQuizzes.map((quiz) => {
      const qList = allQuestions.filter((q) => q.quizId === quiz.id);
      return {
        id: quiz.id,
        folderId: quiz.folderId,
        folderName: quiz.folderId ? folderMap.get(quiz.folderId) ?? null : null,
        title: quiz.title,
        description: quiz.description,
        isActive: settings.isActive && quiz.isActive,
        totalQuestions: qList.length,
        countsByDifficulty: {
          all: qList.length,
          easy: qList.filter((q) => q.difficulty === 'easy').length,
          medium: qList.filter((q) => q.difficulty === 'medium').length,
          hard: qList.filter((q) => q.difficulty === 'hard').length,
        },
      };
    });

    const folderPayloads = allFolders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      description: folder.description,
      quizzes: quizSummaries.filter((q) => q.folderId === folder.id),
    }));

    const uncategorizedQuizzes = quizSummaries.filter((q) => q.folderId === null);

    return {
      globalActive: settings.isActive,
      folders: folderPayloads,
      uncategorizedQuizzes,
      allQuizzes: quizSummaries,
    };
  } catch (error) {
    console.error('Database query failed in getPublicQuizCatalog:', error);
    throw new Error('تعذر جلب قائمة الأقسام والاختبارات.', { cause: error });
  }
}

export async function startQuizSession(
  participantName: string,
  quizId: number | null,
  difficultyFilter: DifficultyFilter = 'all'
) {
  try {
    const settings = await getQuizSettingsRow();
    if (!settings.isActive) {
      return { error: 'QUIZ_INACTIVE' as const };
    }

    let targetQuiz;
    if (quizId) {
      const rows = await db
        .select()
        .from(quizzes)
        .where(eq(quizzes.id, quizId))
        .limit(1);
      targetQuiz = rows[0];
    } else {
      const rows = await db
        .select()
        .from(quizzes)
        .orderBy(asc(quizzes.sortOrder), asc(quizzes.id))
        .limit(1);
      targetQuiz = rows[0];
    }

    if (!targetQuiz) {
      return { error: 'QUIZ_NOT_FOUND' as const };
    }

    if (!targetQuiz.isActive) {
      return { error: 'QUIZ_INACTIVE' as const };
    }

    let folderName: string | null = null;
    if (targetQuiz.folderId) {
      const fRows = await db
        .select({ name: folders.name })
        .from(folders)
        .where(eq(folders.id, targetQuiz.folderId))
        .limit(1);
      folderName = fRows[0]?.name ?? null;
    }

    const whereClause =
      difficultyFilter === 'all'
        ? eq(questions.quizId, targetQuiz.id)
        : and(
            eq(questions.quizId, targetQuiz.id),
            eq(questions.difficulty, difficultyFilter)
          );

    const orderedQuestions = await db
      .select({
        id: questions.id,
        question: questions.question,
        questionType: questions.questionType,
        difficulty: questions.difficulty,
        options: questions.options,
        imageUrl: questions.imageUrl,
        sortOrder: questions.sortOrder,
      })
      .from(questions)
      .where(whereClause)
      .orderBy(asc(questions.sortOrder), asc(questions.id));

    if (orderedQuestions.length === 0) {
      return { error: 'NO_QUESTIONS' as const };
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');

    const [createdParticipant] = await db
      .insert(participants)
      .values({
        quizId: targetQuiz.id,
        name: participantName,
        quizTitle: targetQuiz.title,
        folderName,
        difficulty: difficultyFilter,
        totalQuestions: orderedQuestions.length,
        answeredCount: 0,
        correctCount: 0,
        wrongCount: 0,
        score: 0,
        status: 'in_progress',
        sessionToken,
      })
      .returning({
        id: participants.id,
        quizId: participants.quizId,
        name: participants.name,
        difficulty: participants.difficulty,
        quizTitle: participants.quizTitle,
        folderName: participants.folderName,
        totalQuestions: participants.totalQuestions,
        sessionToken: participants.sessionToken,
      });

    const firstQuestion = orderedQuestions[0];

    return {
      participantId: createdParticipant.id,
      quizId: targetQuiz.id,
      name: createdParticipant.name,
      difficulty: createdParticipant.difficulty as DifficultyFilter,
      sessionToken: createdParticipant.sessionToken,
      quizTitle: createdParticipant.quizTitle,
      folderName: createdParticipant.folderName,
      totalQuestions: createdParticipant.totalQuestions,
      currentIndex: 0,
      question: {
        id: firstQuestion.id,
        question: firstQuestion.question,
        questionType: firstQuestion.questionType,
        difficulty: (firstQuestion.difficulty as DifficultyLevel) || 'medium',
        options: firstQuestion.options,
        imageUrl: sanitizeImageUrl(firstQuestion.imageUrl),
      },
    };
  } catch (error) {
    console.error('Database query failed in startQuizSession:', error);
    throw new Error('تعذر بدء جلسة الاختبار.', { cause: error });
  }
}

export async function submitQuizAnswer(
  sessionToken: string,
  questionId: number,
  selectedOption: number
) {
  try {
    const participantRows = await db
      .select()
      .from(participants)
      .where(eq(participants.sessionToken, sessionToken))
      .limit(1);

    if (participantRows.length === 0) {
      return { error: 'INVALID_SESSION' as const };
    }

    const participant = participantRows[0];
    if (participant.status === 'completed') {
      return { error: 'ALREADY_COMPLETED' as const };
    }

    const quizFilter = participant.quizId
      ? eq(questions.quizId, participant.quizId)
      : undefined;

    const diffFilter =
      participant.difficulty && participant.difficulty !== 'all'
        ? eq(questions.difficulty, participant.difficulty)
        : undefined;

    const combinedWhere =
      quizFilter && diffFilter
        ? and(quizFilter, diffFilter)
        : quizFilter ?? diffFilter;

    const orderedQuestions = combinedWhere
      ? await db
          .select()
          .from(questions)
          .where(combinedWhere)
          .orderBy(asc(questions.sortOrder), asc(questions.id))
      : await db
          .select()
          .from(questions)
          .orderBy(asc(questions.sortOrder), asc(questions.id));

    const currentIndex = participant.answeredCount;
    if (currentIndex >= orderedQuestions.length) {
      return { error: 'ALREADY_COMPLETED' as const };
    }

    const expectedQuestion = orderedQuestions[currentIndex];
    if (expectedQuestion.id !== questionId) {
      return { error: 'QUESTION_MISMATCH' as const };
    }

    if (
      !Number.isInteger(selectedOption) ||
      selectedOption < 0 ||
      selectedOption >= expectedQuestion.options.length
    ) {
      return { error: 'INVALID_OPTION' as const };
    }

    const isCorrect = selectedOption === expectedQuestion.correctAnswer;
    const nextAnsweredCount = participant.answeredCount + 1;
    const nextCorrectCount = participant.correctCount + (isCorrect ? 1 : 0);
    const nextWrongCount = participant.wrongCount + (isCorrect ? 0 : 1);
    const totalCount = orderedQuestions.length;
    const nextScore = Math.round((nextCorrectCount / totalCount) * 100);
    const isCompleted = nextAnsweredCount >= totalCount;

    await db.insert(participantAnswers).values({
      participantId: participant.id,
      questionId: expectedQuestion.id,
      questionText: expectedQuestion.question,
      optionsSnapshot: expectedQuestion.options,
      selectedOption,
      correctOption: expectedQuestion.correctAnswer,
      isCorrect,
    });

    await db
      .update(participants)
      .set({
        answeredCount: nextAnsweredCount,
        correctCount: nextCorrectCount,
        wrongCount: nextWrongCount,
        score: nextScore,
        totalQuestions: totalCount,
        status: isCompleted ? 'completed' : 'in_progress',
        completedAt: isCompleted ? new Date() : null,
      })
      .where(eq(participants.id, participant.id));

    if (isCompleted) {
      return {
        completed: true as const,
        participantName: participant.name,
      };
    }

    const nextQuestion = orderedQuestions[nextAnsweredCount];
    return {
      completed: false as const,
      currentIndex: nextAnsweredCount,
      totalQuestions: totalCount,
      question: {
        id: nextQuestion.id,
        question: nextQuestion.question,
        questionType: nextQuestion.questionType,
        difficulty: (nextQuestion.difficulty as DifficultyLevel) || 'medium',
        options: nextQuestion.options,
        imageUrl: sanitizeImageUrl(nextQuestion.imageUrl),
      },
    };
  } catch (error) {
    console.error('Database query failed in submitQuizAnswer:', error);
    throw new Error('تعذر حفظ الإجابة.', { cause: error });
  }
}

export async function getAdminDashboardData() {
  try {
    const settings = await getQuizSettingsRow();
    const allFolders = await db
      .select()
      .from(folders)
      .orderBy(asc(folders.sortOrder), asc(folders.id));
    const allQuizzes = await db
      .select()
      .from(quizzes)
      .orderBy(asc(quizzes.sortOrder), asc(quizzes.id));
    const allQuestions = await db
      .select()
      .from(questions)
      .orderBy(asc(questions.sortOrder), asc(questions.id));
    const allParticipants = await db
      .select({
        id: participants.id,
        quizId: participants.quizId,
        name: participants.name,
        quizTitle: participants.quizTitle,
        folderName: participants.folderName,
        difficulty: participants.difficulty,
        totalQuestions: participants.totalQuestions,
        answeredCount: participants.answeredCount,
        correctCount: participants.correctCount,
        wrongCount: participants.wrongCount,
        score: participants.score,
        status: participants.status,
        startedAt: participants.startedAt,
        completedAt: participants.completedAt,
      })
      .from(participants)
      .orderBy(desc(participants.startedAt));

    return {
      settings: {
        quizTitle: settings.quizTitle,
        isActive: settings.isActive,
        updatedAt: settings.updatedAt,
      },
      folders: allFolders,
      quizzes: allQuizzes,
      questions: allQuestions,
      participants: allParticipants,
    };
  } catch (error) {
    console.error('Database query failed in getAdminDashboardData:', error);
    throw new Error('تعذر تحميل بيانات لوحة الإدارة.', { cause: error });
  }
}

// ==========================================
// Folders CRUD
// ==========================================

export async function createFolderRecord(input: {
  name: string;
  description?: string | null;
}) {
  try {
    const existing = await db
      .select({ sortOrder: folders.sortOrder })
      .from(folders);
    const maxSort = existing.reduce((max, item) => Math.max(max, item.sortOrder), 0);
    const [created] = await db
      .insert(folders)
      .values({
        name: input.name.trim(),
        description: input.description?.trim() || null,
        sortOrder: maxSort + 1,
      })
      .returning();
    return created;
  } catch (error) {
    console.error('Database query failed in createFolderRecord:', error);
    throw new Error('تعذر إنشاء القسم.', { cause: error });
  }
}

export async function updateFolderRecord(
  id: number,
  input: { name: string; description?: string | null }
) {
  try {
    const [updated] = await db
      .update(folders)
      .set({
        name: input.name.trim(),
        description: input.description?.trim() || null,
      })
      .where(eq(folders.id, id))
      .returning();
    return updated ?? null;
  } catch (error) {
    console.error('Database query failed in updateFolderRecord:', error);
    throw new Error('تعذر تحديث القسم.', { cause: error });
  }
}

export async function deleteFolderRecord(id: number) {
  try {
    const deleted = await db
      .delete(folders)
      .where(eq(folders.id, id))
      .returning({ id: folders.id });
    return deleted.length > 0;
  } catch (error) {
    console.error('Database query failed in deleteFolderRecord:', error);
    throw new Error('تعذر حذف القسم.', { cause: error });
  }
}

// ==========================================
// Quizzes CRUD
// ==========================================

export async function createQuizRecord(input: {
  folderId: number | null;
  title: string;
  description?: string | null;
  isActive?: boolean;
}) {
  try {
    const existing = await db
      .select({ sortOrder: quizzes.sortOrder })
      .from(quizzes);
    const maxSort = existing.reduce((max, item) => Math.max(max, item.sortOrder), 0);
    const [created] = await db
      .insert(quizzes)
      .values({
        folderId: input.folderId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        isActive: input.isActive ?? true,
        sortOrder: maxSort + 1,
      })
      .returning();
    return created;
  } catch (error) {
    console.error('Database query failed in createQuizRecord:', error);
    throw new Error('تعذر إنشاء الاختبار.', { cause: error });
  }
}

export async function updateQuizRecord(
  id: number,
  input: {
    folderId?: number | null;
    title?: string;
    description?: string | null;
    isActive?: boolean;
  }
) {
  try {
    const rows = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, id))
      .limit(1);
    if (rows.length === 0) return null;
    const current = rows[0];

    const [updated] = await db
      .update(quizzes)
      .set({
        folderId: input.folderId !== undefined ? input.folderId : current.folderId,
        title: input.title !== undefined ? input.title.trim() : current.title,
        description:
          input.description !== undefined
            ? input.description?.trim() || null
            : current.description,
        isActive: input.isActive !== undefined ? input.isActive : current.isActive,
      })
      .where(eq(quizzes.id, id))
      .returning();
    return updated ?? null;
  } catch (error) {
    console.error('Database query failed in updateQuizRecord:', error);
    throw new Error('تعذر تحديث الاختبار.', { cause: error });
  }
}

export async function deleteQuizRecord(id: number) {
  try {
    const deleted = await db
      .delete(quizzes)
      .where(eq(quizzes.id, id))
      .returning({ id: quizzes.id });
    return deleted.length > 0;
  } catch (error) {
    console.error('Database query failed in deleteQuizRecord:', error);
    throw new Error('تعذر حذف الاختبار.', { cause: error });
  }
}

// ==========================================
// Questions CRUD
// ==========================================

export async function createQuestionRecord(input: {
  quizId: number;
  question: string;
  questionType: 'multiple_choice' | 'true_false';
  difficulty: DifficultyLevel;
  options: string[];
  correctAnswer: number;
  imageUrl?: string | null;
}) {
  try {
    const existing = await db
      .select({ sortOrder: questions.sortOrder, externalId: questions.externalId })
      .from(questions)
      .where(eq(questions.quizId, input.quizId));
    const maxSort = existing.reduce((max, item) => Math.max(max, item.sortOrder), 0);
    const maxExt = existing.reduce(
      (max, item) => Math.max(max, item.externalId ?? 0),
      0
    );

    const [created] = await db
      .insert(questions)
      .values({
        quizId: input.quizId,
        externalId: maxExt + 1,
        question: input.question.trim(),
        questionType: input.questionType,
        difficulty: input.difficulty,
        options: input.options.map((o) => o.trim()),
        correctAnswer: input.correctAnswer,
        imageUrl: sanitizeImageUrl(input.imageUrl),
        sortOrder: maxSort + 1,
      })
      .returning();

    return created;
  } catch (error) {
    console.error('Database query failed in createQuestionRecord:', error);
    throw new Error('تعذر إضافة السؤال.', { cause: error });
  }
}

export async function updateQuestionRecord(
  id: number,
  input: {
    question: string;
    questionType: 'multiple_choice' | 'true_false';
    difficulty: DifficultyLevel;
    options: string[];
    correctAnswer: number;
    imageUrl?: string | null;
  }
) {
  try {
    const [updated] = await db
      .update(questions)
      .set({
        question: input.question.trim(),
        questionType: input.questionType,
        difficulty: input.difficulty,
        options: input.options.map((o) => o.trim()),
        correctAnswer: input.correctAnswer,
        imageUrl: sanitizeImageUrl(input.imageUrl),
      })
      .where(eq(questions.id, id))
      .returning();

    return updated ?? null;
  } catch (error) {
    console.error('Database query failed in updateQuestionRecord:', error);
    throw new Error('تعذر تحديث السؤال.', { cause: error });
  }
}

export async function deleteQuestionRecord(id: number) {
  try {
    const deleted = await db
      .delete(questions)
      .where(eq(questions.id, id))
      .returning({ id: questions.id });
    return deleted.length > 0;
  } catch (error) {
    console.error('Database query failed in deleteQuestionRecord:', error);
    throw new Error('تعذر حذف السؤال.', { cause: error });
  }
}

export async function reorderQuestionRecords(orderedIds: number[]) {
  try {
    for (let index = 0; index < orderedIds.length; index++) {
      await db
        .update(questions)
        .set({ sortOrder: index + 1 })
        .where(eq(questions.id, orderedIds[index]));
    }
    return await db
      .select()
      .from(questions)
      .orderBy(asc(questions.sortOrder), asc(questions.id));
  } catch (error) {
    console.error('Database query failed in reorderQuestionRecords:', error);
    throw new Error('تعذر إعادة ترتيب الأسئلة.', { cause: error });
  }
}

export async function updateQuizSettingsRecord(input: {
  quizTitle?: string;
  isActive?: boolean;
}) {
  try {
    const settings = await getQuizSettingsRow();
    const [updated] = await db
      .update(quizSettings)
      .set({
        quizTitle:
          input.quizTitle !== undefined ? input.quizTitle.trim() : settings.quizTitle,
        isActive: input.isActive !== undefined ? input.isActive : settings.isActive,
        updatedAt: new Date(),
      })
      .where(eq(quizSettings.id, settings.id))
      .returning({
        id: quizSettings.id,
        quizTitle: quizSettings.quizTitle,
        isActive: quizSettings.isActive,
        updatedAt: quizSettings.updatedAt,
      });
    return updated;
  } catch (error) {
    console.error('Database query failed in updateQuizSettingsRecord:', error);
    throw new Error('تعذر تحديث إعدادات الاختبار.', { cause: error });
  }
}

export async function importQuestionsFromJsonPayload(
  quizId: number,
  quizTitle: string,
  importedQuestions: Array<{
    id?: number;
    question: string;
    questionType?: 'multiple_choice' | 'true_false';
    difficulty?: DifficultyLevel;
    options: string[];
    correctAnswer: number;
    imageUrl?: string | null;
  }>
) {
  try {
    await db
      .update(quizzes)
      .set({ title: quizTitle.trim() })
      .where(eq(quizzes.id, quizId));

    // Replace only questions of the target quiz; preserve participants & other quizzes intact
    await db.delete(questions).where(eq(questions.quizId, quizId));

    const inserted = await db
      .insert(questions)
      .values(
        importedQuestions.map((q, index) => ({
          quizId,
          externalId: typeof q.id === 'number' ? q.id : index + 1,
          question: q.question.trim(),
          questionType:
            q.questionType === 'true_false' || q.options.length === 2
              ? 'true_false'
              : 'multiple_choice',
          difficulty: q.difficulty ?? 'medium',
          options: q.options.map((opt) => opt.trim()),
          correctAnswer: q.correctAnswer,
          imageUrl: sanitizeImageUrl(q.imageUrl),
          sortOrder: index + 1,
        }))
      )
      .returning();

    return { quizId, quizTitle: quizTitle.trim(), questions: inserted };
  } catch (error) {
    console.error('Database query failed in importQuestionsFromJsonPayload:', error);
    throw new Error('تعذر استيراد الأسئلة.', { cause: error });
  }
}

export async function exportQuestionsJsonPayload(quizId?: number) {
  try {
    await ensureQuizInitialized();
    let targetQuiz;
    if (quizId) {
      const rows = await db
        .select()
        .from(quizzes)
        .where(eq(quizzes.id, quizId))
        .limit(1);
      targetQuiz = rows[0];
    } else {
      const rows = await db
        .select()
        .from(quizzes)
        .orderBy(asc(quizzes.sortOrder), asc(quizzes.id))
        .limit(1);
      targetQuiz = rows[0];
    }

    if (!targetQuiz) {
      throw new Error('الاختبار المحدد غير موجود.');
    }

    const quizQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.quizId, targetQuiz.id))
      .orderBy(asc(questions.sortOrder), asc(questions.id));

    return {
      quizTitle: targetQuiz.title,
      questions: quizQuestions.map((q, index) => ({
        id: q.externalId ?? index + 1,
        difficulty: (q.difficulty as DifficultyLevel) || 'medium',
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        ...(q.questionType !== 'multiple_choice'
          ? { questionType: q.questionType }
          : {}),
        ...(q.imageUrl ? { imageUrl: q.imageUrl } : {}),
      })),
    };
  } catch (error) {
    console.error('Database query failed in exportQuestionsJsonPayload:', error);
    throw new Error('تعذر تصدير الأسئلة.', { cause: error });
  }
}

export function getSampleDifficultyTemplateJson() {
  return {
    quizTitle: DEFAULT_QUIZ_TITLE,
    questions: DEFAULT_SEED_QUESTIONS.map((q) => ({
      id: q.externalId,
      difficulty: q.difficulty,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      ...(q.questionType !== 'multiple_choice'
        ? { questionType: q.questionType }
        : {}),
    })),
  };
}

export async function getParticipantWithDetails(participantId: number) {
  try {
    const rows = await db
      .select({
        id: participants.id,
        quizId: participants.quizId,
        name: participants.name,
        quizTitle: participants.quizTitle,
        folderName: participants.folderName,
        difficulty: participants.difficulty,
        totalQuestions: participants.totalQuestions,
        answeredCount: participants.answeredCount,
        correctCount: participants.correctCount,
        wrongCount: participants.wrongCount,
        score: participants.score,
        status: participants.status,
        startedAt: participants.startedAt,
        completedAt: participants.completedAt,
      })
      .from(participants)
      .where(eq(participants.id, participantId))
      .limit(1);

    if (rows.length === 0) return null;

    const answers = await db
      .select()
      .from(participantAnswers)
      .where(eq(participantAnswers.participantId, participantId))
      .orderBy(asc(participantAnswers.id));

    return {
      participant: rows[0],
      answers,
    };
  } catch (error) {
    console.error('Database query failed in getParticipantWithDetails:', error);
    throw new Error('تعذر جلب تفاصيل المشارك.', { cause: error });
  }
}

export async function exportAllParticipantsJsonPayload() {
  try {
    const allParticipants = await db
      .select({
        id: participants.id,
        quizId: participants.quizId,
        name: participants.name,
        quizTitle: participants.quizTitle,
        folderName: participants.folderName,
        difficulty: participants.difficulty,
        totalQuestions: participants.totalQuestions,
        answeredCount: participants.answeredCount,
        correctCount: participants.correctCount,
        wrongCount: participants.wrongCount,
        score: participants.score,
        status: participants.status,
        startedAt: participants.startedAt,
        completedAt: participants.completedAt,
      })
      .from(participants)
      .orderBy(desc(participants.startedAt));

    const allAnswers = await db
      .select()
      .from(participantAnswers)
      .orderBy(asc(participantAnswers.id));

    const answersByParticipant = new Map<number, typeof allAnswers>();
    for (const ans of allAnswers) {
      const list = answersByParticipant.get(ans.participantId) ?? [];
      list.push(ans);
      answersByParticipant.set(ans.participantId, list);
    }

    return {
      exportedAt: new Date().toISOString(),
      totalParticipants: allParticipants.length,
      participants: allParticipants.map((p) => ({
        ...p,
        answers: (answersByParticipant.get(p.id) ?? []).map((a) => ({
          question: a.questionText,
          options: a.optionsSnapshot,
          selectedOptionIndex: a.selectedOption,
          selectedOptionText: a.optionsSnapshot[a.selectedOption] ?? '',
          correctOptionIndex: a.correctOption,
          correctOptionText: a.optionsSnapshot[a.correctOption] ?? '',
          isCorrect: a.isCorrect,
          answeredAt: a.answeredAt,
        })),
      })),
    };
  } catch (error) {
    console.error('Database query failed in exportAllParticipantsJsonPayload:', error);
    throw new Error('تعذر تصدير نتائج المشاركين.', { cause: error });
  }
}

export async function deleteParticipantRecord(participantId: number) {
  try {
    const deleted = await db
      .delete(participants)
      .where(eq(participants.id, participantId))
      .returning({ id: participants.id });
    return deleted.length > 0;
  } catch (error) {
    console.error('Database query failed in deleteParticipantRecord:', error);
    throw new Error('تعذر حذف محاولة المشارك.', { cause: error });
  }
}

export async function clearAllParticipantsRecords() {
  try {
    await db.delete(participants);
  } catch (error) {
    console.error('Database query failed in clearAllParticipantsRecords:', error);
    throw new Error('تعذر حذف محاولات المشاركين.', { cause: error });
  }
}

export async function resetQuizToDefaultsRecord() {
  try {
    const settings = await getQuizSettingsRow();
    await db.delete(participants);
    await db.delete(questions);
    await db.delete(quizzes);
    await db.delete(folders);

    await db
      .update(quizSettings)
      .set({
        quizTitle: DEFAULT_QUIZ_TITLE,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(quizSettings.id, settings.id));

    await seedInitialFolderCatalog();
  } catch (error) {
    console.error('Database query failed in resetQuizToDefaultsRecord:', error);
    throw new Error('تعذر إعادة ضبط الاختبار.', { cause: error });
  }
}

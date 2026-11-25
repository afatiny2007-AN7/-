import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const quizSettings = pgTable('quiz_settings', {
  id: serial('id').primaryKey(),
  quizTitle: text('quiz_title').notNull().default('QUIZVERSE Challenge'),
  isActive: boolean('is_active').notNull().default(true),
  adminPasscodeHash: text('admin_passcode_hash'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const folders = pgTable('folders', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const quizzes = pgTable('quizzes', {
  id: serial('id').primaryKey(),
  folderId: integer('folder_id').references(() => folders.id, {
    onDelete: 'set null',
  }),
  title: text('title').notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  quizId: integer('quiz_id').references(() => quizzes.id, {
    onDelete: 'cascade',
  }),
  externalId: integer('external_id'),
  question: text('question').notNull(),
  questionType: text('question_type').notNull().default('multiple_choice'),
  difficulty: text('difficulty').notNull().default('medium'),
  options: jsonb('options').$type<string[]>().notNull(),
  correctAnswer: integer('correct_answer').notNull(),
  imageUrl: text('image_url'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const participants = pgTable('participants', {
  id: serial('id').primaryKey(),
  quizId: integer('quiz_id').references(() => quizzes.id, {
    onDelete: 'set null',
  }),
  name: text('name').notNull(),
  quizTitle: text('quiz_title').notNull(),
  folderName: text('folder_name'),
  difficulty: text('difficulty').notNull().default('all'),
  totalQuestions: integer('total_questions').notNull(),
  answeredCount: integer('answered_count').notNull().default(0),
  correctCount: integer('correct_count').notNull().default(0),
  wrongCount: integer('wrong_count').notNull().default(0),
  score: integer('score').notNull().default(0),
  status: text('status').notNull().default('in_progress'),
  sessionToken: text('session_token').notNull().unique(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const participantAnswers = pgTable('participant_answers', {
  id: serial('id').primaryKey(),
  participantId: integer('participant_id')
    .references(() => participants.id, { onDelete: 'cascade' })
    .notNull(),
  questionId: integer('question_id').references(() => questions.id, {
    onDelete: 'set null',
  }),
  questionText: text('question_text').notNull(),
  optionsSnapshot: jsonb('options_snapshot').$type<string[]>().notNull(),
  selectedOption: integer('selected_option').notNull(),
  correctOption: integer('correct_option').notNull(),
  isCorrect: boolean('is_correct').notNull(),
  answeredAt: timestamp('answered_at').defaultNow().notNull(),
});

export const foldersRelations = relations(folders, ({ many }) => ({
  quizzes: many(quizzes),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  folder: one(folders, {
    fields: [quizzes.folderId],
    references: [folders.id],
  }),
  questions: many(questions),
  participants: many(participants),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [questions.quizId],
    references: [quizzes.id],
  }),
}));

export const participantsRelations = relations(participants, ({ one, many }) => ({
  quiz: one(quizzes, {
    fields: [participants.quizId],
    references: [quizzes.id],
  }),
  answers: many(participantAnswers),
}));

export const participantAnswersRelations = relations(
  participantAnswers,
  ({ one }) => ({
    participant: one(participants, {
      fields: [participantAnswers.participantId],
      references: [participants.id],
    }),
    question: one(questions, {
      fields: [participantAnswers.questionId],
      references: [questions.id],
    }),
  })
);

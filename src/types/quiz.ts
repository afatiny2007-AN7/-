export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuizDifficultyFilter = 'all' | QuestionDifficulty;

export interface DifficultyCounts {
  all: number;
  easy: number;
  medium: number;
  hard: number;
}

export interface PublicQuizSummary {
  id: number;
  folderId: number | null;
  folderName: string | null;
  title: string;
  description: string | null;
  isActive: boolean;
  totalQuestions: number;
  countsByDifficulty: DifficultyCounts;
}

export interface PublicFolderSummary {
  id: number;
  name: string;
  description: string | null;
  quizzes: PublicQuizSummary[];
}

export interface PublicQuizCatalog {
  globalActive: boolean;
  folders: PublicFolderSummary[];
  uncategorizedQuizzes: PublicQuizSummary[];
  allQuizzes: PublicQuizSummary[];
}

export interface QuizQuestionPublic {
  id: number;
  question: string;
  questionType: 'multiple_choice' | 'true_false' | string;
  difficulty: QuestionDifficulty;
  options: string[];
  imageUrl?: string | null;
}

export interface QuizSessionStartResponse {
  participantId: number;
  quizId: number;
  name: string;
  difficulty: QuizDifficultyFilter;
  sessionToken: string;
  quizTitle: string;
  folderName: string | null;
  totalQuestions: number;
  currentIndex: number;
  question: QuizQuestionPublic;
}

export type QuizAnswerResponse =
  | {
      completed: false;
      currentIndex: number;
      totalQuestions: number;
      question: QuizQuestionPublic;
    }
  | {
      completed: true;
      participantName: string;
    };

export interface AdminFolder {
  id: number;
  name: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface AdminQuiz {
  id: number;
  folderId: number | null;
  title: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface AdminQuestion {
  id: number;
  quizId: number | null;
  externalId: number | null;
  question: string;
  questionType: 'multiple_choice' | 'true_false';
  difficulty: QuestionDifficulty;
  options: string[];
  correctAnswer: number;
  imageUrl: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface AdminParticipant {
  id: number;
  quizId: number | null;
  name: string;
  quizTitle: string;
  folderName: string | null;
  difficulty: QuizDifficultyFilter;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  wrongCount: number;
  score: number;
  status: 'in_progress' | 'completed' | string;
  startedAt: string;
  completedAt: string | null;
}

export interface AdminParticipantAnswer {
  id: number;
  participantId: number;
  questionId: number | null;
  questionText: string;
  optionsSnapshot: string[];
  selectedOption: number;
  correctOption: number;
  isCorrect: boolean;
  answeredAt: string;
}

export interface AdminDashboardData {
  settings: {
    quizTitle: string;
    isActive: boolean;
    updatedAt: string;
  };
  folders: AdminFolder[];
  quizzes: AdminQuiz[];
  questions: AdminQuestion[];
  participants: AdminParticipant[];
}

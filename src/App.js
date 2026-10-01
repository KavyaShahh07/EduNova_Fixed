import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LearningProvider } from './context/LearningContext';
import { LearnerProvider } from './context/LearnerContext';
import { AIProvider } from './context/AIContext';
import { NotificationProvider } from './context/NotificationContext';

import { MainLayout } from './components/layout/MainLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

import { LandingPage } from './pages/Landing/LandingPage';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { ParentLoginPage } from './pages/Auth/ParentLoginPage';
import { ParentRegisterPage } from './pages/Auth/ParentRegisterPage';
import { ForgotPasswordPage } from './pages/Auth/ForgotPasswordPage';
import { VerifyOtpPage } from './pages/Auth/VerifyOtpPage';
import { OnboardingPage } from './pages/Onboarding/OnboardingPage';
import { StudentDashboardPage } from './pages/Dashboard/StudentDashboardPage';
import { NotesPage } from './pages/Notes/NotesPage';
import { MySubjectsPage } from './pages/subjects/MySubjectsPage';
import { SubjectDetailsPage } from './pages/subjects/SubjectDetailsPage';
import { CoursesPage } from './pages/Courses/CoursesPage';
import { CourseDetailsPage } from './pages/Courses/CourseDetailsPage';
import { LessonPage } from './pages/Courses/LessonPage';
import { AIAssistantPage } from './pages/AI/AIAssistantPage';
import { LearningPathPage } from './pages/AI/LearningPathPage';
import { StudyPlannerPage } from './pages/AI/StudyPlannerPage';
import { CommunityPage } from './pages/Community/CommunityPage';
import { AchievementsPage } from './pages/Gamification/AchievementsPage';
import { ProfilePage } from './pages/Profile/ProfilePage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { ParentDashboardPage } from './pages/Dashboard/ParentDashboardPage';
import { ParentChildPerformancePage } from './pages/Parent/ParentChildPerformancePage';
import { ParentChildProfilePage } from './pages/Parent/ParentChildProfilePage';
import { InstructorDashboardPage } from './pages/Instructor/InstructorDashboardPage';
import { MyTasksPage } from './pages/Tasks/MyTasksPage';
import { ServerUnavailableBanner } from './components/common/ServerUnavailableBanner';
import { EduNovaLoadingScreen } from './components/common/EduNovaLoadingScreen';

// Phase 9: Route-Level Code Splitting for Heavy Graphic & Visualization Modules
const ImmersiveLabPage = React.lazy(() => import('./pages/Immersive/ImmersiveLabPage').then(m => ({ default: m.ImmersiveLabPage })));
const XRStudioPage = React.lazy(() => import('./pages/Immersive/XRStudioPage').then(m => ({ default: m.XRStudioPage })));
const KnowledgeConstellationPage = React.lazy(() => import('./pages/Constellation/KnowledgeConstellationPage').then(m => ({ default: m.KnowledgeConstellationPage })));
const SkillDnaPage = React.lazy(() => import('./pages/SkillDNA/SkillDnaPage').then(m => ({ default: m.SkillDnaPage })));
const SkillExchangePage = React.lazy(() => import('./pages/Marketplace/SkillExchangePage').then(m => ({ default: m.SkillExchangePage })));
const SkillSwapMatchPage = React.lazy(() => import('./pages/Marketplace/SkillSwapMatchPage').then(m => ({ default: m.SkillSwapMatchPage })));
const ProgressAnalyticsPage = React.lazy(() => import('./pages/Analytics/ProgressAnalyticsPage').then(m => ({ default: m.ProgressAnalyticsPage })));
const GameCenterPage = React.lazy(() => import('./pages/Games/GameCenterPage').then(m => ({ default: m.GameCenterPage })));
const QuizzesPage = React.lazy(() => import('./pages/Quizzes/QuizzesPage').then(m => ({ default: m.QuizzesPage })));
const AdminDashboardPage = React.lazy(() => import('./pages/Admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const ChallengesPage = React.lazy(() => import('./pages/Gamification/ChallengesPage').then(m => ({ default: m.ChallengesPage })));

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LearnerProvider>
          <LearningProvider>
            <AIProvider>
              <NotificationProvider>
                <BrowserRouter>
                  <ServerUnavailableBanner />
                  <React.Suspense fallback={<EduNovaLoadingScreen message="Loading EduNova module..." />}>
                    <Routes>
                    {/* Public Shell */}
                    <Route element={<MainLayout />}>
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/explore" element={<CoursesPage />} />
                      <Route path="/marketplace" element={<SkillExchangePage />} />
                      <Route path="/skill-exchange" element={<SkillExchangePage />} />
                      <Route path="/about" element={<LandingPage />} />

                      {/* Authenticated Protected Shell */}
                      <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
                      <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboardPage /></ProtectedRoute>} />
                      <Route path="/dashboard/school" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboardPage track="school" /></ProtectedRoute>} />
                      <Route path="/dashboard/college" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboardPage track="college" /></ProtectedRoute>} />
                      <Route path="/dashboard/skills" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboardPage track="skills" /></ProtectedRoute>} />
                      <Route path="/dashboard/exam" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboardPage track="exam" /></ProtectedRoute>} />
                      <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
                      <Route path="/notes/:noteId" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
                      <Route path="/dashboard/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
                      <Route path="/my-subjects" element={<ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'ADMIN']}><MySubjectsPage /></ProtectedRoute>} />
                      <Route path="/subjects/:subjectId" element={<ProtectedRoute><SubjectDetailsPage /></ProtectedRoute>} />
                      <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistantPage /></ProtectedRoute>} />
                      <Route path="/learning-path" element={<ProtectedRoute allowedRoles={['STUDENT']}><LearningPathPage /></ProtectedRoute>} />
                      <Route path="/study-planner" element={<ProtectedRoute><StudyPlannerPage /></ProtectedRoute>} />
                      <Route path="/tasks" element={<ProtectedRoute><MyTasksPage /></ProtectedRoute>} />
                      <Route path="/my-tasks" element={<ProtectedRoute><MyTasksPage /></ProtectedRoute>} />
                      <Route path="/quizzes" element={<ProtectedRoute><QuizzesPage /></ProtectedRoute>} />
                      <Route path="/quizzes/:quizId" element={<ProtectedRoute><QuizzesPage /></ProtectedRoute>} />
                      <Route path="/games" element={<ProtectedRoute><GameCenterPage /></ProtectedRoute>} />
                      <Route path="/game-center" element={<ProtectedRoute><GameCenterPage /></ProtectedRoute>} />
                      <Route path="/immersive-lab" element={<ProtectedRoute><ImmersiveLabPage /></ProtectedRoute>} />
                      <Route path="/labs" element={<ProtectedRoute><ImmersiveLabPage /></ProtectedRoute>} />
                      <Route path="/xr-studio" element={<ProtectedRoute><XRStudioPage /></ProtectedRoute>} />
                      <Route path="/ar-vr" element={<ProtectedRoute><XRStudioPage /></ProtectedRoute>} />
                      <Route path="/ar-vr-studio" element={<ProtectedRoute><XRStudioPage /></ProtectedRoute>} />
                      <Route path="/immersive-studio" element={<ProtectedRoute><XRStudioPage /></ProtectedRoute>} />
                      <Route path="/constellation" element={<ProtectedRoute><KnowledgeConstellationPage /></ProtectedRoute>} />
                      <Route path="/skill-dna" element={<ProtectedRoute><SkillDnaPage /></ProtectedRoute>} />
                      <Route path="/skill-marketplace" element={<ProtectedRoute><SkillExchangePage /></ProtectedRoute>} />
                      <Route path="/skill-exchange" element={<ProtectedRoute><SkillExchangePage /></ProtectedRoute>} />
                      <Route path="/messages" element={<ProtectedRoute><SkillExchangePage initialTab="messages" /></ProtectedRoute>} />
                      <Route path="/messages/:conversationId" element={<ProtectedRoute><SkillExchangePage initialTab="messages" /></ProtectedRoute>} />
                      <Route path="/exchanges/:exchangeId/chat" element={<ProtectedRoute><SkillExchangePage initialTab="messages" /></ProtectedRoute>} />
                      <Route path="/skill-swap-match" element={<ProtectedRoute><SkillSwapMatchPage /></ProtectedRoute>} />
                      <Route path="/courses" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
                      <Route path="/courses/:id" element={<ProtectedRoute><CourseDetailsPage /></ProtectedRoute>} />
                      <Route path="/courses/:id/lesson" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />
                      <Route path="/analytics" element={<ProtectedRoute allowedRoles={['STUDENT']}><ProgressAnalyticsPage /></ProtectedRoute>} />
                      <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
                      <Route path="/community/:channelId" element={<ProtectedRoute><SkillExchangePage initialTab="messages" /></ProtectedRoute>} />
                      <Route path="/achievements" element={<ProtectedRoute><AchievementsPage /></ProtectedRoute>} />
                      <Route path="/challenges" element={<ProtectedRoute><ChallengesPage /></ProtectedRoute>} />
                      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

                      {/* Parent Protected Routes */}
                      <Route path="/parent-dashboard" element={<Navigate to="/parent/dashboard" replace />} />
                      <Route path="/parent/dashboard" element={<ProtectedRoute allowedRoles={['PARENT']}><ParentDashboardPage /></ProtectedRoute>} />
                      <Route path="/parent/performance" element={<ProtectedRoute allowedRoles={['PARENT']}><ParentChildPerformancePage /></ProtectedRoute>} />
                      <Route path="/parent/child-profile" element={<ProtectedRoute allowedRoles={['PARENT']}><ParentChildProfilePage /></ProtectedRoute>} />
                      <Route path="/parent/settings" element={<ProtectedRoute allowedRoles={['PARENT']}><SettingsPage /></ProtectedRoute>} />

                      {/* Instructor Protected Routes */}
                      <Route path="/instructor/dashboard" element={<ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorDashboardPage /></ProtectedRoute>} />
                      <Route path="/instructor/courses" element={<ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorDashboardPage /></ProtectedRoute>} />
                      <Route path="/instructor/students" element={<ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorDashboardPage /></ProtectedRoute>} />
                      <Route path="/instructor/assessments" element={<ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorDashboardPage /></ProtectedRoute>} />
                      <Route path="/instructor/materials" element={<ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorDashboardPage /></ProtectedRoute>} />

                      {/* Admin Protected Routes */}
                      <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboardPage /></ProtectedRoute>} />
                    </Route>

                    {/* Auth Shell */}
                    <Route element={<AuthLayout />}>
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/parent-login" element={<ParentLoginPage />} />
                      <Route path="/parent-register" element={<ParentRegisterPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="/verify-otp" element={<VerifyOtpPage />} />
                      <Route path="/verify-email" element={<VerifyOtpPage />} />
                    </Route>

                    {/* Catch-all redirect */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </React.Suspense>
              </BrowserRouter>
              </NotificationProvider>
            </AIProvider>
          </LearningProvider>
        </LearnerProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

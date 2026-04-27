import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 页面组件
import HomePage from './pages/HomePage';
import TaskPage from './pages/TaskPage';
import StudentPage from './pages/StudentPage';
import StudentProgress from './pages/StudentProgress';
import TeacherDashboard from './pages/TeacherDashboard';
import LoginPage from './pages/LoginPage';

// 组件
import Navbar from './components/Navbar';
import ThemeToggle from './components/ThemeToggle';

// 创建 query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分钟
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-cyber-dark">
          <Navbar />
          <ThemeToggle />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/task/:taskId" element={<TaskPage />} />
            <Route path="/student" element={<StudentPage />} />
            <Route path="/student/progress" element={<StudentProgress />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

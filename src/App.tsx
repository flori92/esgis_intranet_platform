import React from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import Quiz from './components/Quiz';
import AdminDashboard from './components/AdminDashboard';
import { QuizProvider } from './context/QuizContext';

function App() {
  const { appState } = useAuth();

  // If not authenticated, show login
  if (!appState.isAuthenticated) {
    return <Login />;
  }

  // If authenticated and admin, show admin dashboard wrapped in QuizProvider
  if (appState.isAdmin) {
    return (
      <QuizProvider>
        <AdminDashboard />
      </QuizProvider>
    );
  }

  // If authenticated and not admin, show quiz
  return (
    <QuizProvider>
      <Quiz />
    </QuizProvider>
  );
}

export default App;
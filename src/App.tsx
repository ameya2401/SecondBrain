import React from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { isDarkMode } = useTheme();

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDarkMode ? 'bg-black' : 'bg-white'
      }`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
          isDarkMode ? 'border-white' : 'border-black'
        }`}></div>
      </div>
    );
  }

  return user ? <Dashboard /> : <Auth />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="App">
          <AppContentWithToaster />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

const AppContentWithToaster: React.FC = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <>
      <AppContent />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: isDarkMode ? '#000' : '#fff',
            color: isDarkMode ? '#fff' : '#000',
            border: isDarkMode ? '1px solid #374151' : '1px solid #d1d5db',
            borderRadius: '0px',
            fontFamily: 'Roboto, sans-serif',
            fontWeight: '300',
          },
        }}
      />
    </>
  );
};

export default App;
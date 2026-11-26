import React, { useState } from 'react';
import { ActivePage } from './types';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { DnaAnalyzerPage } from './pages/DnaAnalyzerPage';
import { RnaAnalyzerPage } from './pages/RnaAnalyzerPage';
import { PlaceholderModule } from './pages/PlaceholderModule';

export const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<ActivePage>('landing');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const { currentUser } = useAuth();

  const handleNavigate = (page: ActivePage) => {
    const protectedPages: ActivePage[] = ['workspace', 'profile'];
    if (protectedPages.includes(page) && !currentUser) {
      setCurrentPage('login');
      return;
    }

    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderActivePage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;
      case 'login':
        return <LoginPage onNavigate={handleNavigate} />;
      case 'register':
        return <RegisterPage onNavigate={handleNavigate} />;
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'profile':
        return currentUser ? (
          <ProfilePage onNavigate={handleNavigate} />
        ) : (
          <LoginPage onNavigate={handleNavigate} />
        );
      case 'dna':
        return <DnaAnalyzerPage onNavigate={handleNavigate} />;
      case 'rna':
        return <RnaAnalyzerPage onNavigate={handleNavigate} />;
      default:
        return <PlaceholderModule pageId={currentPage} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      <div style={{ display: 'flex', flex: 1 }}>
        {currentPage !== 'landing' && (
          <Sidebar
            currentPage={currentPage}
            onNavigate={handleNavigate}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}

        <main
          style={{
            flex: 1,
            width: '100%',
            transition: 'margin-left var(--transition-smooth)',
            marginLeft:
              currentPage !== 'landing' && window.innerWidth >= 1024
                ? 'var(--sidebar-width)'
                : 0
          }}
        >
          {renderActivePage()}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

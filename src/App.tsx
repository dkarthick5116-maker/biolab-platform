import React, { useState } from 'react';
import { ActivePage } from './types';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { PlaceholderModule } from './pages/PlaceholderModule';

export const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<ActivePage>('landing');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const handleNavigate = (page: ActivePage) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderActivePage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
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
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
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
            marginLeft: currentPage !== 'landing' && window.innerWidth >= 1024 ? 'var(--sidebar-width)' : 0
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
      <AppContent />
    </ThemeProvider>
  );
};

export default App;

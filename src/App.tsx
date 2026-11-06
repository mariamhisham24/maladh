import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { SoundProvider } from './context/SoundContext';
import { AmbientSoundPill } from './components/common/AmbientSoundPill';
import { PWAInstallBanner } from './components/common/PWAInstallBanner';
import { Header } from './components/layout/Header';
import { BottomNav, type TabKey } from './components/layout/BottomNav';
import { Sidebar } from './components/layout/Sidebar';
import { HomeView } from './components/screens/HomeView';
import { NavigatorView } from './components/screens/NavigatorView';
import { AdhkarView } from './components/screens/AdhkarView';
import { TasbeehView } from './components/screens/TasbeehView';
import { QuranView } from './components/screens/QuranView';
import { SunnahView } from './components/screens/SunnahView';
import { StudioView } from './components/screens/StudioView';
import { SettingsView } from './components/screens/SettingsView';
import { MoreView } from './components/screens/MoreView';

export function AppContent() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [tasbeehConfig, setTasbeehConfig] = useState<{ dhikr?: string; target?: number }>({});
  const [studioInitialContent, setStudioInitialContent] = useState<{ text?: string; source?: string } | undefined>(undefined);

  const handleNavigateToTasbeeh = (dhikrText: string, targetCount: number) => {
    setTasbeehConfig({ dhikr: dhikrText, target: targetCount });
    setActiveTab('tasbeeh');
  };

  const handleOpenInStudio = (text: string, source: string) => {
    setStudioInitialContent({ text, source });
    setActiveTab('studio');
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView onNavigate={setActiveTab} onOpenInStudio={handleOpenInStudio} />;
      case 'navigator':
        return (
          <NavigatorView 
            onNavigateToTasbeeh={handleNavigateToTasbeeh} 
            onBack={() => setActiveTab('home')}
            onOpenInStudio={handleOpenInStudio}
          />
        );
      case 'adhkar':
        return (
          <AdhkarView 
            onBack={() => setActiveTab('home')} 
            onOpenInStudio={handleOpenInStudio}
          />
        );
      case 'tasbeeh':
        return (
          <TasbeehView 
            initialDhikr={tasbeehConfig.dhikr} 
            initialTarget={tasbeehConfig.target} 
          />
        );
      case 'quran':
        return (
          <QuranView 
            onBack={() => setActiveTab('home')} 
            onOpenInStudio={handleOpenInStudio}
          />
        );
      case 'sunnah':
        return (
          <SunnahView 
            onBack={() => setActiveTab('more')} 
            onOpenInStudio={handleOpenInStudio}
          />
        );
      case 'studio':
        return (
          <StudioView 
            onBack={() => setActiveTab('more')} 
            initialContent={studioInitialContent}
          />
        );
      case 'settings':
        return <SettingsView onBack={() => setActiveTab('more')} />;
      case 'more':
        return <MoreView onNavigate={setActiveTab} />;
      default:
        return <HomeView onNavigate={setActiveTab} onOpenInStudio={handleOpenInStudio} />;
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text flex">
      {/* Desktop & Tablet Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenSettings={() => setActiveTab('settings')} />
        
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-5 md:py-8">
          {renderActiveScreen()}
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SoundProvider>
        <AppContent />
        <AmbientSoundPill />
        <PWAInstallBanner />
      </SoundProvider>
    </ThemeProvider>
  );
}

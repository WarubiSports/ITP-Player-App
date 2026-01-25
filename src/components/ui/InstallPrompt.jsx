import { useState, useEffect } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';
import './InstallPrompt.css';

// Detect iOS
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

// Detect if running as installed PWA
const isStandalone = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
};

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (isStandalone()) return;

    // Check if user dismissed recently (24 hours)
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) return;
    }

    // For Android/Chrome - listen for install prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // For iOS - show custom prompt after a short delay
    if (isIOS()) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS()) {
      setShowIOSInstructions(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    setShowPrompt(false);
    setShowIOSInstructions(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="install-prompt-overlay">
      <div className="install-prompt">
        <button className="install-prompt-close" onClick={handleDismiss}>
          <X size={20} />
        </button>

        {showIOSInstructions ? (
          <>
            <div className="install-prompt-icon">
              <Share size={32} />
            </div>
            <h3>Install ITP App</h3>
            <p className="install-prompt-steps">
              <span className="step">
                <span className="step-number">1</span>
                Tap the <Share size={16} className="inline-icon" /> <strong>Share</strong> button below
              </span>
              <span className="step">
                <span className="step-number">2</span>
                Scroll and tap <Plus size={16} className="inline-icon" /> <strong>Add to Home Screen</strong>
              </span>
              <span className="step">
                <span className="step-number">3</span>
                Tap <strong>Add</strong> to confirm
              </span>
            </p>
            <button className="install-prompt-btn secondary" onClick={handleDismiss}>
              Got it
            </button>
          </>
        ) : (
          <>
            <div className="install-prompt-icon">
              <img src="/icon-192.png" alt="ITP App" className="app-icon" />
            </div>
            <h3>Install ITP App</h3>
            <p>Add to your home screen for quick access and the best experience</p>
            <div className="install-prompt-buttons">
              <button className="install-prompt-btn primary" onClick={handleInstall}>
                <Download size={18} />
                Install
              </button>
              <button className="install-prompt-btn secondary" onClick={handleDismiss}>
                Maybe Later
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

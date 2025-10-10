/**
 * Governance Context Switcher
 * 
 * WO-156: Navigate between general and Realms DAO governance
 * 
 * Features:
 * - Clear visual distinction
 * - Context preservation
 * - Smooth transitions
 * - Current context indication
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

type GovernanceContext = 'general' | 'realms';

export default function GovernanceContextSwitcher() {
  const router = useRouter();
  const [activeContext, setActiveContext] = useState<GovernanceContext>('general');

  // WO-156: Detect current context from URL
  useEffect(() => {
    if (router.pathname.includes('/realms')) {
      setActiveContext('realms');
    } else {
      setActiveContext('general');
    }
  }, [router.pathname]);

  // WO-156: Context switching with state preservation
  const switchContext = (newContext: GovernanceContext) => {
    // Save scroll position
    const scrollPosition = window.scrollY;
    sessionStorage.setItem('governance_scroll', scrollPosition.toString());

    setActiveContext(newContext);

    // Navigate to appropriate view
    if (newContext === 'realms') {
      router.push('/governance/realms');
    } else {
      router.push('/governance/proposals');
    }

    // Restore scroll after navigation
    setTimeout(() => {
      const savedScroll = sessionStorage.getItem('governance_scroll');
      if (savedScroll) {
        window.scrollTo(0, parseInt(savedScroll));
      }
    }, 100);
  };

  return (
    <div className="flex items-center gap-2 bg-white border rounded-lg p-1">
      {/* WO-156: General Governance Tab */}
      <button
        onClick={() => switchContext('general')}
        className={`px-4 py-2 rounded flex items-center gap-2 transition ${
          activeContext === 'general'
            ? 'bg-blue-500 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <span>📋</span>
        <span className="font-medium">General Governance</span>
      </button>

      {/* WO-156: Realms DAO Tab */}
      <button
        onClick={() => switchContext('realms')}
        className={`px-4 py-2 rounded flex items-center gap-2 transition ${
          activeContext === 'realms'
            ? 'bg-purple-500 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <span>🏛️</span>
        <span className="font-medium">Realms DAO</span>
      </button>
    </div>
  );
}




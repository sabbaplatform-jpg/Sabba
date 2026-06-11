import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';

const FlagsContext = createContext({});

// Flags default to TRUE — toggling off in admin disables the feature
const FLAG_DEFAULTS = {
  messaging:         true,
  sabba_points:      true,
  adventure_quiz:    true,
  card_payments:     true,
  vendor_onboarding: true,
  csv_import:        true,
  analytics:         true,
};

export function FlagsProvider({ children }) {
  const { user } = useAuth();
  const [flags, setFlags] = useState(FLAG_DEFAULTS);

  useEffect(() => {
    if (!user) return;
    // Fetch flags scoped to this user's company + global overrides
    api.get('/admin/feature-flags').then(({ data }) => {
      const resolved = { ...FLAG_DEFAULTS };
      // Apply global flags first, then company-specific (company overrides global)
      const sorted = [...(data || [])].sort((a, b) =>
        (a.company_id ? 1 : 0) - (b.company_id ? 1 : 0)
      );
      for (const flag of sorted) {
        // Apply if global or matches user's company
        if (!flag.company_id || flag.company_id === user.company_id) {
          resolved[flag.name] = flag.enabled;
        }
      }
      setFlags(resolved);
    }).catch(() => {}); // fail silently — defaults keep features on
  }, [user]);

  return (
    <FlagsContext.Provider value={flags}>
      {children}
    </FlagsContext.Provider>
  );
}

export function useFlags() {
  return useContext(FlagsContext);
}

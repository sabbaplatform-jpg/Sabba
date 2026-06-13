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
    // Only superadmin can call /admin/feature-flags
    // All other roles use defaults (flags stay on unless superadmin disables)
    if (user.role !== 'superadmin') return;
    api.get('/admin/feature-flags').then(({ data }) => {
      const resolved = { ...FLAG_DEFAULTS };
      const sorted = [...(data || [])].sort((a, b) =>
        (a.company_id ? 1 : 0) - (b.company_id ? 1 : 0)
      );
      for (const flag of sorted) {
        if (!flag.company_id || flag.company_id === user.company_id) {
          resolved[flag.name] = flag.enabled;
        }
      }
      setFlags(resolved);
    }).catch(() => {});
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

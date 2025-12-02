import { useAuth } from './use-auth';

export function useRole() {
  const { user } = useAuth();
  
  return {
    isStudent: user?.role === 'student',
    isOrganizer: user?.role === 'organizer',
    role: user?.role || null,
  };
}


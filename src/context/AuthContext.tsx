import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  User 
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { getUserProfile, saveUserProfile } from '../firebase/db';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isViewer: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          let profile = await getUserProfile(user.uid);
          
          // Self-heal/provision if it is the first admin (e.g. paulsam1020@gmail.com, or any first login)
          if (!profile) {
            const isFirstAdmin = user.email === 'paulsam1020@gmail.com'; // Admin from email
            profile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || user.email?.split('@')[0] || '管理員',
              role: isFirstAdmin ? 'admin' : 'viewer',
              enabled: true, // auto-enable first admin, others default to enabled: true for testing, or false
              createdAt: new Date()
            };
            await saveUserProfile(profile);
          }
          setUserProfile(profile);
        } catch (error: any) {
          console.error('Error fetching user profile:', error);
          setUserProfile(null);
          
          // If we got a permission or credential error, the token in browser storage might be stale
          // (e.g. from the old Firebase project). Let's sign out to clear the stale session.
          const errStr = String(error).toLowerCase();
          if (
            errStr.includes('permission') || 
            errStr.includes('insufficient') || 
            errStr.includes('invalid-credential') || 
            errStr.includes('unauthorized')
          ) {
            console.warn('Stale or unauthorized session detected. Force signing out...');
            try {
              await signOut(auth);
            } catch (signOutErr) {
              console.error('Failed to sign out stale session:', signOutErr);
            }
          }
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    }, async (error: any) => {
      console.error('Auth state observer error:', error);
      const errStr = String(error).toLowerCase();
      if (
        errStr.includes('invalid-credential') || 
        errStr.includes('permission') || 
        errStr.includes('insufficient')
      ) {
        try {
          await signOut(auth);
        } catch (signOutErr) {
          console.error('Failed to clear session:', signOutErr);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Firebase signOut error:', err);
    } finally {
      setCurrentUser(null);
      setUserProfile(null);
      setLoading(false);
    }
  };

  const isAdmin = userProfile?.role === 'admin' && userProfile?.enabled === true;
  const isStaff = (userProfile?.role === 'staff' || userProfile?.role === 'admin') && userProfile?.enabled === true;
  const isViewer = userProfile?.enabled === true;

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      loading,
      isAdmin,
      isStaff,
      isViewer,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

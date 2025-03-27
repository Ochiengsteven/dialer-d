import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { isAuthenticated } = useAuth();
  
  // Redirect based on authentication status
  return <Redirect href={isAuthenticated ? "/(tabs)" : "/auth/login"} />;
}

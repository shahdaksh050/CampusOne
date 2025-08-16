import { getFirebaseAuth } from '../firebaseConfig';
import { getIdToken as getToken } from 'firebase/auth';

export async function getIdToken() {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) return null;
  return getToken(user, true);
}

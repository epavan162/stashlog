import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/authStore';

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),
    onSuccess: (res) => {
      setAuth(res.data.user, res.data.access_token);
      if (!res.data.user.is_password_set) {
        navigate('/set-password');
      } else {
        navigate('/dashboard');
      }
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: ({ name, email, password }: { name: string; email: string; password: string }) =>
      authService.register(name, email, password),
  });
}

export function useGoogleLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (idToken: string) => authService.googleLogin(idToken),
    onSuccess: (res) => {
      setAuth(res.data.user, res.data.access_token);
      if (!res.data.user.is_password_set) {
        navigate('/set-password');
      } else {
        navigate('/dashboard');
      }
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      clearAuth();
      navigate('/login');
    },
  });
}

export function useSetPassword() {
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (password: string) => authService.setPassword(password),
    onSuccess: () => {
      if (user) {
        setUser({ ...user, is_password_set: true });
      }
      navigate('/dashboard');
    },
  });
}

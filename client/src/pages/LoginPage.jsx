import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthCard, { AuthFooterLink } from '../components/auth/AuthCard.jsx';
import Input from '../components/auth/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Spinner from '../components/auth/Spinner.jsx';
import useAuthStore from '../store/useAuthStore.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, setError } = useAuthStore();

  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    if (!form.email.trim()) {
      setFieldErrors({ email: 'Email is required' });
      return;
    }
    if (!form.password) {
      setFieldErrors({ password: 'Password is required' });
      return;
    }

    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (err) {
      const serverErrors = err.data?.errors;
      if (Array.isArray(serverErrors)) {
        setFieldErrors({ form: serverErrors.join('. ') });
      }
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your CollabCPP workspace"
      footer={
        <AuthFooterLink
          text="Don't have an account?"
          linkText="Create one"
          to="/signup"
        />
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {(error || fieldErrors.form) && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm text-red-400">
            {fieldErrors.form || error}
          </div>
        )}

        <Input
          id="email"
          name="email"
          type="email"
          label="Email"
          placeholder="you@company.com"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          error={fieldErrors.email}
        />

        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          error={fieldErrors.password}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner size="sm" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>
    </AuthCard>
  );
}

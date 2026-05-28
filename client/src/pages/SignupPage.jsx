import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthCard, { AuthFooterLink } from '../components/auth/AuthCard.jsx';
import Input from '../components/auth/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Spinner from '../components/auth/Spinner.jsx';
import useAuthStore from '../store/useAuthStore.js';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, isLoading, error, setError } = useAuthStore();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const errors = {};
    if (!form.username.trim()) errors.username = 'Username is required';
    else if (form.username.length < 3) errors.username = 'At least 3 characters';
    if (!form.email.trim()) errors.email = 'Email is required';
    if (!form.password) errors.password = 'Password is required';
    else if (form.password.length < 8) errors.password = 'At least 8 characters';
    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      await signup({
        username: form.username,
        email: form.email,
        password: form.password,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const serverErrors = err.data?.errors;
      if (Array.isArray(serverErrors)) {
        setFieldErrors({ form: serverErrors.join('. ') });
      }
    }
  };

  return (
    <AuthCard
      title="Create account"
      subtitle="Start collaborating on C++ interviews"
      footer={
        <AuthFooterLink
          text="Already have an account?"
          linkText="Sign in"
          to="/login"
        />
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {(error || fieldErrors.form) && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm text-red-400">
            {fieldErrors.form || error}
          </div>
        )}

        <Input
          id="username"
          name="username"
          label="Username"
          placeholder="dev_interviewer"
          autoComplete="username"
          value={form.username}
          onChange={handleChange}
          error={fieldErrors.username}
        />

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
          placeholder="Min. 8 characters"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          error={fieldErrors.password}
        />

        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirm password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={fieldErrors.confirmPassword}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner size="sm" />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </Button>
      </form>
    </AuthCard>
  );
}

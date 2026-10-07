import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { validateEmail } from '../utils/validators';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!validateEmail(formData.email)) newErrors.email = 'Please enter a valid email address';
    if (!formData.password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-enter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back</h1>
        <p className="text-sm text-gray-500 mt-1.5">Sign in to your account to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            icon={Mail}
            placeholder="you@company.com"
            autoComplete="email"
          />
        </div>

        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            icon={Lock}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
          <div className="flex justify-end mt-2">
            <a href="#" className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors duration-200">
              Forgot password?
            </a>
          </div>
        </div>

        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <Button type="submit" variant="primary" size="lg" className="w-full" loading={isLoading}>
            Sign in
          </Button>
        </div>
      </form>

      {/* Divider */}
      <div className="relative my-6 opacity-0 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-gray-50 lg:bg-white text-gray-400">or</span>
        </div>
      </div>

      <p className="text-center text-sm text-gray-500 opacity-0 animate-fade-in" style={{ animationDelay: '250ms' }}>
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700 transition-colors duration-200">
          Create one
        </Link>
      </p>
    </div>
  );
}

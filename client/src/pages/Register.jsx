import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { validateEmail, validatePassword, validateName } from '../utils/validators';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
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
    const nameResult = validateName(formData.name);
    if (nameResult && !nameResult.valid) newErrors.name = nameResult.message;
    if (!validateEmail(formData.email)) newErrors.email = 'Please enter a valid email address';
    const passResult = validatePassword(formData.password);
    if (passResult && !passResult.valid) newErrors.password = passResult.message;
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords don\'t match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);
      await register(formData.name, formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-enter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create your account</h1>
        <p className="text-sm text-gray-500 mt-1.5">Get started with TaskFlow — it's free</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          <Input
            label="Full name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            icon={User}
            placeholder="Jane Smith"
            autoComplete="name"
          />
        </div>

        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <Input
            label="Work email"
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

        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            icon={Lock}
            placeholder="Min. 6 characters"
            hint="Must be at least 6 characters"
            autoComplete="new-password"
          />
        </div>

        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <Input
            label="Confirm password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            icon={Lock}
            placeholder="Re-enter your password"
            autoComplete="new-password"
          />
        </div>

        <div className="pt-1 opacity-0 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
          <Button type="submit" variant="primary" size="lg" className="w-full" loading={isLoading}>
            Create account
          </Button>
        </div>
      </form>

      <p className="mt-5 text-center text-xs text-gray-400 opacity-0 animate-fade-in" style={{ animationDelay: '300ms' }}>
        By signing up, you agree to our{' '}
        <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors duration-200 underline">Terms</a>
        {' '}and{' '}
        <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors duration-200 underline">Privacy Policy</a>
      </p>

      {/* Divider */}
      <div className="relative my-6 opacity-0 animate-fade-in" style={{ animationDelay: '350ms' }}>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-gray-50 lg:bg-white text-gray-400">or</span>
        </div>
      </div>

      <p className="text-center text-sm text-gray-500 opacity-0 animate-fade-in" style={{ animationDelay: '400ms' }}>
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700 transition-colors duration-200">
          Sign in
        </Link>
      </p>
    </div>
  );
}

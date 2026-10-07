import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { CheckSquare } from 'lucide-react';

const AuthLayout = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-gray-950 relative overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary-600/15 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-primary-400/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-violet-500/8 rounded-full blur-3xl animate-pulse-soft" />

        {/* Dot grid pattern */}
        <div className="absolute inset-0 bg-dot-pattern bg-dot-sm opacity-10" />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-500 rounded-xl flex items-center justify-center shadow-[0_4px_16px_rgba(79,70,229,0.3)]">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">TaskFlow</span>
          </div>

          {/* Hero text */}
          <div className="max-w-md">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight opacity-0 animate-slide-up" style={{ animationDelay: '150ms' }}>
              Organize your work,{' '}
              <span className="gradient-text-hero">amplify results.</span>
            </h1>
            <p className="text-gray-400 mt-5 text-lg leading-relaxed opacity-0 animate-slide-up" style={{ animationDelay: '250ms' }}>
              The modern task management platform trusted by teams worldwide to plan, track, and deliver projects on time.
            </p>

            {/* Social proof */}
            <div className="mt-10 flex items-center gap-8 opacity-0 animate-slide-up" style={{ animationDelay: '350ms' }}>
              {[
                { value: '10K+', label: 'Active users' },
                { value: '50K+', label: 'Tasks completed' },
                { value: '99.9%', label: 'Uptime' },
              ].map(({ value, label }, i) => (
                <React.Fragment key={label}>
                  {i > 0 && <div className="w-px h-10 bg-gray-800" />}
                  <div>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-sm text-gray-500">{label}</p>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-sm text-gray-600 opacity-0 animate-fade-in" style={{ animationDelay: '500ms' }}>&copy; 2024 TaskFlow. All rights reserved.</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[420px] animate-fade-in" style={{ animationDelay: '100ms' }}>
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-500 rounded-xl flex items-center justify-center shadow-[0_2px_8px_rgba(79,70,229,0.25)]">
              <CheckSquare className="w-[18px] h-[18px] text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">TaskFlow</span>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

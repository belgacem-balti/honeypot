import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, BarChart3, Shield, Zap, Github, Twitter, CheckSquare, ArrowUpRight, Star } from 'lucide-react';
import Button from '../components/ui/Button';

const features = [
  {
    icon: Layers,
    title: 'Smart Organization',
    description: 'Organize tasks by status and priority. Drag, filter, and sort to find what matters.',
    color: 'bg-primary-50 text-primary-600',
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description: 'Track your team\'s velocity with live dashboards, charts, and progress reports.',
    color: 'bg-success-50 text-success-600',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'SOC 2 compliant with end-to-end encryption, SSO, and role-based access control.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Sub-100ms response times. Built on a modern stack designed for speed.',
    color: 'bg-warning-50 text-warning-600',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-200/60">
        <div className="page-container h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-4 h-4 text-white" />
            </div>
            <span className="text-[15px] font-bold text-gray-900 tracking-tight">TaskFlow</span>
          </div>

          <div className="hidden sm:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#testimonials" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Testimonials</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-primary-100/60 via-primary-50/20 to-transparent" />
          <div className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="page-container text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 border border-primary-100 px-4 py-1.5 text-sm font-medium text-primary-700 mb-8 animate-fade-in">
            <Star className="w-3.5 h-3.5 fill-current" />
            Trusted by 10,000+ teams
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-950 mb-6 leading-[1.08] text-balance animate-slide-up">
            The modern way to<br />
            <span className="gradient-text">manage your work</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '100ms' }}>
            TaskFlow helps teams plan, track, and ship projects faster with beautiful task boards, real-time analytics, and seamless collaboration.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <Link to="/register">
              <Button variant="primary" size="lg" iconRight={ArrowRight}>
                Start for free
              </Button>
            </Link>
            <a href="#features">
              <Button variant="secondary" size="lg">
                See how it works
              </Button>
            </a>
          </div>

          {/* Mockup preview */}
          <div className="mt-16 md:mt-20 max-w-5xl mx-auto animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="rounded-2xl border border-gray-200 shadow-elevated bg-gray-950 p-1.5 sm:p-2">
              <div className="rounded-xl bg-gray-100 overflow-hidden">
                {/* Faux browser chrome */}
                <div className="bg-gray-200/80 px-4 py-2.5 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-400/60" />
                  </div>
                  <div className="flex-1 mx-8">
                    <div className="bg-white rounded-md px-3 py-1 text-xs text-gray-400 max-w-xs mx-auto text-center">
                      app.taskflow.io/dashboard
                    </div>
                  </div>
                </div>
                {/* Content placeholder */}
                <div className="h-64 sm:h-80 md:h-[420px] bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
                  <div className="text-center px-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-2xl flex items-center justify-center">
                      <CheckSquare className="w-8 h-8 text-primary-600" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Dashboard Preview</p>
                    <p className="text-gray-300 text-xs mt-1">Real-time task analytics & team metrics</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LOGOS / SOCIAL PROOF ─── */}
      <section className="py-12 border-y border-gray-100 bg-gray-50/50">
        <div className="page-container">
          <p className="text-center text-xs font-medium text-gray-400 uppercase tracking-widest mb-8">
            Trusted by teams at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {['Acme Corp', 'Globex', 'Initech', 'Hooli', 'Piedmont'].map((name) => (
              <span key={name} className="text-lg font-semibold text-gray-300 tracking-tight">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-20 md:py-28">
        <div className="page-container">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-primary-600 mb-2">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-950 tracking-tight">
              Everything you need to ship faster
            </h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto">
              Built for modern teams who want to move fast without breaking things.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="group card-hover p-6 flex flex-col"
              >
                <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center mb-4 transition-transform group-hover:scale-105`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-[15px] font-semibold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="page-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { value: '10K+', label: 'Active users', sub: 'across 40+ countries' },
              { value: '50K+', label: 'Tasks completed', sub: 'this month alone' },
              { value: '99.9%', label: 'Uptime SLA', sub: 'industry-leading reliability' },
            ].map(({ value, label, sub }) => (
              <div key={label}>
                <p className="text-4xl md:text-5xl font-extrabold text-gray-950 tracking-tight">{value}</p>
                <p className="text-sm font-medium text-gray-700 mt-2">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 md:py-28">
        <div className="page-container">
          <div className="relative bg-gray-950 rounded-3xl overflow-hidden px-8 py-16 md:px-16 md:py-20 text-center">
            {/* Gradient blobs */}
            <div className="absolute top-0 left-0 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary-400/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4 text-balance">
                Ready to transform how your team works?
              </h2>
              <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                Join thousands of teams that use TaskFlow to plan, build, and ship products faster.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/register">
                  <Button variant="primary" size="lg" iconRight={ArrowRight}>
                    Get started — it's free
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-gray-600 mt-4">No credit card required · Free forever for small teams</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-gray-950 text-gray-400 border-t border-gray-900">
        <div className="page-container py-12">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
                  <CheckSquare className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-bold text-white">TaskFlow</span>
              </div>
              <p className="text-sm text-gray-500 max-w-xs">
                The modern task management platform for teams who ship.
              </p>
            </div>

            {/* Links */}
            <div className="flex gap-16">
              <div>
                <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">Product</p>
                <div className="space-y-2">
                  <a href="#features" className="block text-sm hover:text-white transition-colors">Features</a>
                  <a href="#pricing" className="block text-sm hover:text-white transition-colors">Pricing</a>
                  <a href="#" className="block text-sm hover:text-white transition-colors">Changelog</a>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">Company</p>
                <div className="space-y-2">
                  <a href="#" className="block text-sm hover:text-white transition-colors">About</a>
                  <a href="#" className="block text-sm hover:text-white transition-colors">Blog</a>
                  <a href="#" className="block text-sm hover:text-white transition-colors">Careers</a>
                </div>
              </div>
            </div>

            {/* Social */}
            <div className="flex items-center gap-3">
              <a href="#" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-800/60 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-600">
            <span>© 2024 TaskFlow Inc. All rights reserved.</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-gray-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-400 transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

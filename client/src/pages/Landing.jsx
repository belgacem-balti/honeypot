import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, BarChart3, Shield, Zap, Github, Twitter, CheckSquare, Star, Sparkles, TrendingUp, Users, Clock, Check, ChevronDown, MessageSquare, Slack, Globe, Lock } from 'lucide-react';
import Button from '../components/ui/Button';

const features = [
  {
    icon: Layers,
    title: 'Smart Organization',
    description: 'Organize tasks by status and priority. Drag, filter, and sort to find what matters most.',
    gradient: 'from-indigo-500 to-blue-500',
    bg: 'bg-indigo-50',
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description: 'Track your team\'s velocity with live dashboards, charts, and progress reports.',
    gradient: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'SOC 2 compliant with end-to-end encryption, SSO, and role-based access control.',
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Sub-100ms response times. Built on a modern stack designed for speed at scale.',
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
  },
];

const stats = [
  { value: '10K+', label: 'Active users', icon: Users },
  { value: '50K+', label: 'Tasks completed', icon: TrendingUp },
  { value: '99.9%', label: 'Uptime SLA', icon: Clock },
];

function useInView(ref, options = {}) {
  const [isInView, setIsInView] = React.useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.disconnect();
      }
    }, { threshold: 0.1, ...options });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return isInView;
}

function AnimatedSection({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : 'translateY(24px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white font-sans overflow-hidden">
      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-200/40">
        <div className="page-container h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-500 rounded-lg flex items-center justify-center shadow-[0_2px_8px_rgba(79,70,229,0.3)]">
              <CheckSquare className="w-4 h-4 text-white" />
            </div>
            <span className="text-[15px] font-bold text-gray-900 tracking-tight">TaskFlow</span>
          </div>

          <div className="hidden sm:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200">Features</a>
            <a href="#stats" className="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200">About</a>
            <a href="#pricing" className="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm">
                Get Started
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 -z-10">
          {/* Radial gradient */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[700px] bg-gradient-radial from-primary-100/50 via-primary-50/20 to-transparent" />
          {/* Floating orbs */}
          <div className="absolute top-32 left-[15%] w-72 h-72 bg-primary-200/20 rounded-full blur-3xl animate-float" />
          <div className="absolute top-48 right-[10%] w-64 h-64 bg-blue-200/15 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute bottom-20 left-[30%] w-48 h-48 bg-violet-200/15 rounded-full blur-3xl animate-float" />
          {/* Dot grid */}
          <div className="absolute inset-0 bg-dot-pattern bg-dot-md opacity-40" />
        </div>

        <div className="page-container text-center relative">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-50/80 border border-primary-100 px-4 py-1.5 text-sm font-medium text-primary-700 mb-8 animate-fade-in backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Trusted by 10,000+ teams worldwide</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-extrabold tracking-tight text-gray-950 mb-6 leading-[1.08] text-balance opacity-0 animate-slide-up" style={{ animationDelay: '100ms' }}>
            The modern way to<br />
            <span className="gradient-text-hero">manage your work</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed opacity-0 animate-slide-up" style={{ animationDelay: '200ms' }}>
            TaskFlow helps teams plan, track, and ship projects faster with beautiful task boards, real-time analytics, and seamless collaboration.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 opacity-0 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <Link to="/register">
              <Button variant="primary" size="lg">
                Start for free
                <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="secondary" size="lg">
                See how it works
              </Button>
            </a>
          </div>

          {/* ─── DASHBOARD MOCKUP ─── */}
          <div className="mt-16 md:mt-24 max-w-5xl mx-auto opacity-0 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
            <div className="relative">
              {/* Glow effect behind mockup */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/10 via-blue-500/10 to-primary-500/10 rounded-3xl blur-2xl" />

              <div className="relative rounded-2xl border border-gray-200/60 shadow-float bg-gray-950 p-1.5 sm:p-2 overflow-hidden">
                <div className="rounded-xl bg-gray-100 overflow-hidden">
                  {/* Faux browser chrome */}
                  <div className="bg-gray-200/80 px-4 py-2.5 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                    </div>
                    <div className="flex-1 mx-8">
                      <div className="bg-white rounded-md px-3 py-1 text-xs text-gray-400 max-w-xs mx-auto text-center flex items-center justify-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-400/40 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        </div>
                        app.taskflow.io/dashboard
                      </div>
                    </div>
                  </div>

                  {/* Dashboard content mockup */}
                  <div className="h-64 sm:h-80 md:h-[420px] bg-gradient-to-br from-gray-50 to-gray-100/80 p-4 sm:p-6">
                    {/* Top bar */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-primary-100 rounded-lg" />
                        <div className="h-3 w-24 bg-gray-200 rounded-full" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 bg-gray-200 rounded-lg" />
                        <div className="h-7 w-20 bg-primary-500 rounded-lg" />
                      </div>
                    </div>
                    {/* Stats row */}
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      {[
                        { color: 'bg-blue-400', w: 'w-10' },
                        { color: 'bg-emerald-400', w: 'w-14' },
                        { color: 'bg-amber-400', w: 'w-8' },
                        { color: 'bg-violet-400', w: 'w-12' },
                      ].map((s, i) => (
                        <div key={i} className="bg-white rounded-xl p-3 shadow-xs border border-gray-100">
                          <div className={`h-2 ${s.w} ${s.color} rounded-full mb-2 opacity-60`} />
                          <div className="h-5 w-8 bg-gray-800 rounded" />
                          <div className="h-2 w-16 bg-gray-100 rounded-full mt-1.5" />
                        </div>
                      ))}
                    </div>
                    {/* Chart area */}
                    <div className="hidden sm:grid grid-cols-3 gap-3 flex-1">
                      <div className="col-span-2 bg-white rounded-xl p-4 shadow-xs border border-gray-100">
                        <div className="h-2.5 w-20 bg-gray-200 rounded-full mb-4" />
                        <div className="flex items-end gap-2 h-24">
                          {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((h, i) => (
                            <div key={i} className="flex-1 bg-gradient-to-t from-primary-500 to-primary-300 rounded-sm opacity-70" style={{ height: `${h}%` }} />
                          ))}
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-4 shadow-xs border border-gray-100">
                        <div className="h-2.5 w-16 bg-gray-200 rounded-full mb-4" />
                        <div className="flex items-center justify-center h-24">
                          <div className="w-20 h-20 rounded-full border-[6px] border-primary-400 border-r-emerald-400 border-b-amber-400 opacity-60" />
                        </div>
                      </div>
                    </div>
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
            {['Acme Corp', 'Globex', 'Initech', 'Hooli', 'Piedmont'].map((name, i) => (
              <span key={name} className="text-lg font-semibold text-gray-300 tracking-tight transition-colors duration-300 hover:text-gray-400 cursor-default select-none">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-20 md:py-32">
        <div className="page-container">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 border border-primary-100 px-3 py-1 text-xs font-semibold text-primary-600 mb-4 uppercase tracking-wider">
              Features
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-950 tracking-tight">
              Everything you need to ship faster
            </h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto text-lg">
              Built for modern teams who want to move fast without breaking things.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map(({ icon: Icon, title, description, gradient, bg }, index) => (
              <AnimatedSection key={title} delay={index * 100}>
                <div className="group card-hover p-6 flex flex-col h-full">
                  <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}>
                    <Icon className={`w-5 h-5 bg-gradient-to-r ${gradient} bg-clip-text`} style={{ color: gradient.includes('indigo') ? '#6366f1' : gradient.includes('emerald') ? '#10b981' : gradient.includes('blue') ? '#3b82f6' : '#f59e0b' }} />
                  </div>
                  <h3 className="text-[15px] font-semibold text-gray-900 mb-1.5">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section id="stats" className="py-20 bg-gray-950 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-600/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary-400/5 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-dot-pattern bg-dot-sm opacity-10" />
        </div>

        <div className="page-container relative">
          <AnimatedSection className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">
              Trusted by thousands
            </h2>
            <p className="text-gray-400 text-lg max-w-md mx-auto">
              Numbers that speak for themselves.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {stats.map(({ value, label, icon: StatIcon }, i) => (
              <AnimatedSection key={label} delay={i * 150}>
                <div className="text-center p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.1]">
                  <div className="w-10 h-10 mx-auto mb-4 rounded-xl bg-primary-500/10 flex items-center justify-center">
                    <StatIcon className="w-5 h-5 text-primary-400" />
                  </div>
                  <p className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">{value}</p>
                  <p className="text-sm text-gray-400 mt-2 font-medium">{label}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-20 md:py-28 bg-gray-50/50">
        <div className="page-container">
          <AnimatedSection className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 border border-primary-100 px-3 py-1 text-xs font-semibold text-primary-600 mb-4 uppercase tracking-wider">
              Testimonials
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-950 tracking-tight">Loved by teams everywhere</h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto text-lg">See what our users have to say about TaskFlow.</p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: 'Jessica M.', role: 'Engineering Lead at Stripe', quote: 'TaskFlow replaced three tools for us. The dashboard alone saved our team 5 hours a week on status meetings.', stars: 5 },
              { name: 'David L.', role: 'Product Manager at Vercel', quote: 'The cleanest task management UI I\'ve ever used. My team adopted it in a day — no training needed.', stars: 5 },
              { name: 'Aisha K.', role: 'CTO at Buildspace', quote: 'We switched from Jira and never looked back. TaskFlow is fast, beautiful, and actually enjoyable to use.', stars: 5 },
            ].map((t, i) => (
              <AnimatedSection key={i} delay={i * 100}>
                <div className="card p-6 h-full flex flex-col">
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-amber-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed flex-1">"{t.quote}"</p>
                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-600">{t.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.role}</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="page-container">
          <AnimatedSection className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 border border-primary-100 px-3 py-1 text-xs font-semibold text-primary-600 mb-4 uppercase tracking-wider">
              Pricing
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-950 tracking-tight">Simple, transparent pricing</h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto text-lg">Start free, upgrade when you need to.</p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                name: 'Free', price: '$0', period: '/month', description: 'Perfect for individuals', popular: false,
                features: ['Up to 50 tasks', '1 team member', 'Basic dashboard', 'Email support', '1 GB storage'],
              },
              {
                name: 'Pro', price: '$12', period: '/user/mo', description: 'Best for growing teams', popular: true,
                features: ['Unlimited tasks', 'Up to 20 members', 'Advanced analytics', 'Priority support', '50 GB storage', 'Custom fields', 'API access'],
              },
              {
                name: 'Enterprise', price: '$39', period: '/user/mo', description: 'For large organizations', popular: false,
                features: ['Everything in Pro', 'Unlimited members', 'SSO & SAML', 'Audit logs', 'Dedicated support', 'Custom SLA', 'On-premise option'],
              },
            ].map((plan, i) => (
              <AnimatedSection key={plan.name} delay={i * 100}>
                <div className={`relative rounded-2xl p-6 flex flex-col h-full ${plan.popular ? 'bg-gray-950 text-white ring-2 ring-primary-500 shadow-glow' : 'card'}`}>
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                      Most Popular
                    </span>
                  )}
                  <div className="mb-6">
                    <h3 className={`text-lg font-semibold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                    <p className={`text-sm mt-1 ${plan.popular ? 'text-gray-400' : 'text-gray-500'}`}>{plan.description}</p>
                  </div>
                  <div className="mb-6">
                    <span className={`text-4xl font-extrabold tracking-tight ${plan.popular ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
                    <span className={`text-sm ${plan.popular ? 'text-gray-400' : 'text-gray-500'}`}>{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <Check className={`w-4 h-4 flex-shrink-0 ${plan.popular ? 'text-primary-400' : 'text-primary-600'}`} />
                        <span className={plan.popular ? 'text-gray-300' : 'text-gray-600'}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" className={`block text-center py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                    plan.popular
                      ? 'bg-primary-600 text-white hover:bg-primary-500 shadow-[0_0_16px_rgba(79,70,229,0.3)]'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                    Get started
                  </Link>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INTEGRATIONS ─── */}
      <section className="py-20 border-t border-gray-100 bg-gray-50/30">
        <div className="page-container">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-950 tracking-tight mb-3">Integrates with your stack</h2>
            <p className="text-gray-500 max-w-md mx-auto">Connect TaskFlow with the tools your team already uses.</p>
          </AnimatedSection>
          <div className="flex flex-wrap items-center justify-center gap-4 max-w-3xl mx-auto">
            {[
              { name: 'Slack', icon: MessageSquare }, { name: 'GitHub', icon: Github }, { name: 'Jira', icon: Globe },
              { name: 'Notion', icon: Layers }, { name: 'Figma', icon: Sparkles }, { name: 'Linear', icon: BarChart3 },
              { name: 'Vercel', icon: Zap }, { name: 'Auth0', icon: Lock },
            ].map(({ name, icon: Icon }, i) => (
              <AnimatedSection key={name} delay={i * 50}>
                <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white border border-gray-200/80 shadow-xs hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 cursor-default">
                  <Icon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{name}</span>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 md:py-28">
        <div className="page-container max-w-3xl">
          <AnimatedSection className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-950 tracking-tight">Frequently asked questions</h2>
          </AnimatedSection>
          <AnimatedSection>
            <div className="space-y-3">
              {[
                { q: 'Is TaskFlow really free?', a: 'Yes! Our free plan includes up to 50 tasks and is free forever. No credit card required to sign up.' },
                { q: 'Can I import from other tools?', a: 'Absolutely. We support CSV import and direct integrations with Jira, Trello, Asana, and Linear.' },
                { q: 'Is my data secure?', a: 'We use end-to-end encryption, SOC 2 compliance, and enterprise-grade security. Your data is always safe with us.' },
                { q: 'Do you offer a self-hosted option?', a: 'Yes, our Enterprise plan includes on-premise deployment with Docker. Contact our sales team for details.' },
                { q: 'What happens if I exceed my plan limits?', a: 'We\'ll notify you and give you time to upgrade. We never delete your data or lock you out without warning.' },
              ].map((faq, i) => (
                <details key={i} className="group card overflow-hidden">
                  <summary className="flex items-center justify-between cursor-pointer p-5 text-sm font-semibold text-gray-900 hover:bg-gray-50/70 transition-colors">
                    {faq.q}
                    <ChevronDown className="w-4 h-4 text-gray-400 transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <div className="px-5 pb-5 text-sm text-gray-500 leading-relaxed -mt-1">{faq.a}</div>
                </details>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 md:py-28">
        <div className="page-container">
          <AnimatedSection>
            <div className="relative bg-gray-950 rounded-3xl overflow-hidden px-8 py-16 md:px-16 md:py-20 text-center">
              {/* Animated gradient blobs */}
              <div className="absolute top-0 left-0 w-96 h-96 bg-primary-600/15 rounded-full blur-3xl animate-float" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl animate-float-delayed" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-500/8 rounded-full blur-3xl" />
              {/* Dot grid */}
              <div className="absolute inset-0 bg-dot-pattern bg-dot-sm opacity-10" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-sm font-medium text-primary-300 mb-6">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  Free for teams up to 5
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4 text-balance">
                  Ready to transform how<br className="hidden md:block" /> your team works?
                </h2>
                <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
                  Join thousands of teams that use TaskFlow to plan, build, and ship products faster.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link to="/register">
                    <Button variant="primary" size="lg">
                      Get started — it's free
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </Link>
                </div>
                <p className="text-xs text-gray-600 mt-5">No credit card required · Free forever for small teams</p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-gray-950 text-gray-400 border-t border-gray-900">
        <div className="page-container py-12">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 bg-gradient-to-br from-primary-600 to-primary-500 rounded-lg flex items-center justify-center">
                  <CheckSquare className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-bold text-white">TaskFlow</span>
              </div>
              <p className="text-sm text-gray-500 max-w-xs">
                The modern task management platform for teams who ship.
              </p>
            </div>

            <div className="flex gap-16">
              <div>
                <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">Product</p>
                <div className="space-y-2.5">
                  <a href="#features" className="block text-sm hover:text-white transition-colors duration-200">Features</a>
                  <a href="#pricing" className="block text-sm hover:text-white transition-colors duration-200">Pricing</a>
                  <a href="#" className="block text-sm hover:text-white transition-colors duration-200">Changelog</a>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">Company</p>
                <div className="space-y-2.5">
                  <a href="#" className="block text-sm hover:text-white transition-colors duration-200">About</a>
                  <a href="#" className="block text-sm hover:text-white transition-colors duration-200">Blog</a>
                  <a href="#" className="block text-sm hover:text-white transition-colors duration-200">Careers</a>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a href="#" className="p-2.5 rounded-xl hover:bg-white/5 transition-all duration-200 hover:text-white">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="p-2.5 rounded-xl hover:bg-white/5 transition-all duration-200 hover:text-white">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-800/60 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-600">
            <span>&copy; 2024 TaskFlow Inc. All rights reserved.</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-gray-400 transition-colors duration-200">Privacy</a>
              <a href="#" className="hover:text-gray-400 transition-colors duration-200">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

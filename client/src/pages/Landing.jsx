import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, BarChart3, Shield, Zap, Github, Twitter } from 'lucide-react';
import Button from '../components/ui/Button';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="text-xl font-bold text-primary-600">TaskFlow</div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-gray-600 hover:text-gray-900 hidden sm:block">Features</a>
            <a href="#about" className="text-gray-600 hover:text-gray-900 hidden sm:block">About</a>
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/register">
              <Button variant="primary">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-24 md:pt-40 md:pb-32 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary-50 via-gray-50 to-gray-50 -z-10"></div>
        <div className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700 mb-8">
          ✨ Modern Task Management
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
          Organize your work, <br />
          achieve more
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          TaskFlow helps you manage tasks, track progress, and stay productive with an intuitive and lightning-fast interface.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register">
            <Button variant="primary" size="lg" icon={ArrowRight}>Get Started Free</Button>
          </Link>
          <a href="#features">
            <Button variant="secondary" size="lg">Learn More</Button>
          </a>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 rounded-xl bg-gray-50 hover:bg-white hover:shadow-md transition-all duration-200">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                <Layers size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Smart Organization</h3>
              <p className="text-gray-600">Organize tasks by status and priority with ease.</p>
            </div>
            <div className="p-6 rounded-xl bg-gray-50 hover:bg-white hover:shadow-md transition-all duration-200">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Real-time Tracking</h3>
              <p className="text-gray-600">Track progress with visual dashboards and charts.</p>
            </div>
            <div className="p-6 rounded-xl bg-gray-50 hover:bg-white hover:shadow-md transition-all duration-200">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <Shield size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-gray-600">Enterprise-grade security to keep your data safe.</p>
            </div>
            <div className="p-6 rounded-xl bg-gray-50 hover:bg-white hover:shadow-md transition-all duration-200">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                <Zap size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-gray-600">Built for speed and efficiency in every interaction.</p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 bg-gray-50 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-primary-600 mb-2">10K+</div>
            <div className="text-gray-600 font-medium">Active Users</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary-600 mb-2">50K+</div>
            <div className="text-gray-600 font-medium">Tasks Completed</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary-600 mb-2">99.9%</div>
            <div className="text-gray-600 font-medium">Uptime</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto bg-primary-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to boost your productivity?</h2>
          <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of teams and individuals who use TaskFlow to manage their work and achieve their goals.
          </p>
          <Link to="/register">
            <Button variant="secondary" size="lg" className="bg-white text-primary-600 hover:bg-gray-50 border-none">
              Start Free
            </Button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xl font-bold text-white">TaskFlow</div>
          <div className="flex gap-6">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
            <a href="#about" className="hover:text-white transition">About</a>
            <a href="#contact" className="hover:text-white transition">Contact</a>
          </div>
          <div className="flex items-center gap-4">
            <Github size={20} className="hover:text-white cursor-pointer transition" />
            <Twitter size={20} className="hover:text-white cursor-pointer transition" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-gray-800 text-center text-sm">
          © 2024 TaskFlow. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

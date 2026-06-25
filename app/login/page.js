// src/app/login/page.js

'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  GraduationCap, 
  AlertCircle, 
  Loader2,
  Shield,
  UserCheck,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState({
    email: false,
    password: false
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result.error) {
        setError(result.error);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFocus = (field) => {
    setIsFocused(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => {
    setIsFocused(prev => ({ ...prev, [field]: false }));
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/50 via-transparent to-transparent" />
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-4 mb-12">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                <GraduationCap className="w-12 h-12" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">EduERP</h1>
                <p className="text-primary-200 text-sm font-light tracking-wide">Educational Institute Management</p>
              </div>
            </div>

            <h2 className="text-4xl font-bold leading-tight mb-6">
              Empowering Education
              <span className="block text-primary-200">Through Technology</span>
            </h2>

            <p className="text-lg text-primary-100 mb-12 max-w-md leading-relaxed">
              Complete ERP solution for managing students, faculty, academics, and administration seamlessly.
            </p>

            <div className="space-y-4">
              {[
                { icon: Shield, text: 'Role-based access control' },
                { icon: UserCheck, text: 'Comprehensive user management' },
                { icon: Sparkles, text: 'Real-time dashboards & reports' },
                { icon: CheckCircle2, text: 'Secure & scalable architecture' },
              ].map(({ icon: Icon, text }, index) => (
                <motion.div
                  key={text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors flex items-center justify-center backdrop-blur-sm">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-primary-100 group-hover:text-white transition-colors">
                    {text}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <motion.div
          className="absolute -bottom-20 -right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute -top-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        />
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="p-2.5 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-lg">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">EduERP</h1>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back</h2>
              <p className="text-gray-500 mt-2 text-sm">Sign in to your account to continue</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl flex items-start gap-3"
              >
                <div className="p-1 bg-red-100 rounded-full">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                </div>
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700" htmlFor="email">
                  Email Address
                </label>
                <div className={`relative group transition-all duration-200 ${
                  isFocused.email ? 'scale-[1.01]' : ''
                }`}>
                  <div className={`absolute inset-0 rounded-2xl transition-all duration-200 ${
                    isFocused.email ? 'bg-primary-100/20 blur-sm' : ''
                  }`} />
                  <div className="relative">
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                      isFocused.email ? 'text-primary-600' : 'text-gray-400'
                    }`}>
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => handleFocus('email')}
                      onBlur={() => handleBlur('email')}
                      className={`w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border-2 rounded-2xl transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none ${
                        isFocused.email 
                          ? 'border-primary-500 bg-white shadow-lg shadow-primary-500/10' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="you@institution.edu"
                      required
                      disabled={isLoading}
                    />
                    {email && !error && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-1">
                  <div className={`h-0.5 bg-primary-500 transition-all duration-300 ${
                    isFocused.email ? 'w-full' : 'w-0'
                  }`} />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700" htmlFor="password">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className={`relative group transition-all duration-200 ${
                  isFocused.password ? 'scale-[1.01]' : ''
                }`}>
                  <div className={`absolute inset-0 rounded-2xl transition-all duration-200 ${
                    isFocused.password ? 'bg-primary-100/20 blur-sm' : ''
                  }`} />
                  <div className="relative">
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                      isFocused.password ? 'text-primary-600' : 'text-gray-400'
                    }`}>
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => handleFocus('password')}
                      onBlur={() => handleBlur('password')}
                      className={`w-full pl-12 pr-12 py-3.5 bg-gray-50/50 border-2 rounded-2xl transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none ${
                        isFocused.password 
                          ? 'border-primary-500 bg-white shadow-lg shadow-primary-500/10' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="Enter your password"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="h-1">
                  <div className={`h-0.5 bg-primary-500 transition-all duration-300 ${
                    isFocused.password ? 'w-full' : 'w-0'
                  }`} />
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="relative w-full overflow-hidden group"
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl transition-transform duration-200 group-hover:scale-[1.02]" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                <div className="relative py-3.5 px-4 flex items-center justify-center gap-2 text-white font-medium">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <motion.span
                        initial={{ x: 0 }}
                        animate={{ x: [0, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        →
                      </motion.span>
                    </>
                  )}
                </div>
              </motion.button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 bg-primary-100 rounded-full">
                    <GraduationCap className="w-3 h-3 text-primary-600" />
                  </div>
                  <p className="text-xs font-medium text-gray-700">Demo Credentials</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/80 rounded-lg p-2 border border-gray-200">
                    <span className="text-gray-500">Email</span>
                    <p className="font-mono text-primary-600 truncate">sysadmin@edu.com</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-2 border border-gray-200">
                    <span className="text-gray-500">Password</span>
                    <p className="font-mono text-primary-600">Admin@123</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            © 2024 EduERP. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
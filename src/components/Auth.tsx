import React, { useState } from 'react';
import { signIn, signUp } from '../lib/supabase';
import { LogIn, UserPlus, Mail, Lock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { isDarkMode } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success('Successfully signed in!');
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
        toast.success('Successfully signed up! Please check your email for verification.');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
      isDarkMode ? 'bg-black' : 'bg-white'
    }`} style={{ fontFamily: "'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div className={`border rounded-lg p-4 w-full max-w-md transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-[#191919] border-[#2e2e2e]' 
          : 'bg-white border-[#e9e9e9]'
      }`}>
        <div className="text-center mb-6">
          <div className={`w-12 h-12 border rounded-lg flex items-center justify-center mx-auto mb-4 transition-colors duration-300 ${
            isDarkMode ? 'border-[#2e2e2e] bg-[#2e2e2e]' : 'border-[#e9e9e9] bg-[#f1f1ef]'
          }`}>
            <LogIn className={`h-5 w-5 transition-colors duration-300 ${
              isDarkMode ? 'text-[#e9e9e9]' : 'text-[#37352f]'
            }`} />
          </div>
          <h1 className={`text-xl font-medium mb-1 transition-colors duration-300 ${
            isDarkMode ? 'text-[#e9e9e9]' : 'text-[#37352f]'
          }`}>Memorai</h1>
          <p className={`text-xs font-normal transition-colors duration-300 ${
            isDarkMode ? 'text-[#787774]' : 'text-[#787774]'
          }`}>A personal archive for curated web content</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
              isDarkMode ? 'text-[#c9c9c9]' : 'text-[#787774]'
            }`}>
              Email
            </label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 transition-colors duration-300 ${
                isDarkMode ? 'text-[#787774]' : 'text-[#787774]'
              }`} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full pl-10 pr-3 py-1.5 border rounded-lg font-normal text-sm transition-all duration-300 focus:outline-none ${
                  isDarkMode 
                    ? 'bg-[#191919] border-[#2e2e2e] text-[#e9e9e9] placeholder-[#787774] focus:border-[#3e3e3e]' 
                    : 'bg-white border-[#e9e9e9] text-[#37352f] placeholder-[#9b9a97] focus:border-[#c9c9c9]'
                }`}
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
              isDarkMode ? 'text-[#c9c9c9]' : 'text-[#787774]'
            }`}>
              Password
            </label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 transition-colors duration-300 ${
                isDarkMode ? 'text-[#787774]' : 'text-[#787774]'
              }`} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full pl-10 pr-3 py-1.5 border rounded-lg font-normal text-sm transition-all duration-300 focus:outline-none ${
                  isDarkMode 
                    ? 'bg-[#191919] border-[#2e2e2e] text-[#e9e9e9] placeholder-[#787774] focus:border-[#3e3e3e]' 
                    : 'bg-white border-[#e9e9e9] text-[#37352f] placeholder-[#9b9a97] focus:border-[#c9c9c9]'
                }`}
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-1.5 px-2 border rounded-lg font-normal text-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              isDarkMode 
                ? 'bg-[#2e2e2e] text-[#e9e9e9] border-[#2e2e2e] hover:bg-[#3e3e3e]' 
                : 'bg-[#f1f1ef] text-[#37352f] border-[#e9e9e9] hover:bg-[#e9e9e9]'
            }`}
          >
            {loading ? (
              <div className={`animate-spin rounded-full h-3.5 w-3.5 border-2 border-t-transparent ${
                isDarkMode ? 'border-[#e9e9e9]' : 'border-[#37352f]'
              }`}></div>
            ) : (
              <>
                {isLogin ? <LogIn className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                {isLogin ? 'Sign In' : 'Sign Up'}
              </>
            )}
          </button>
        </form>

        <div className={`mt-6 pt-4 border-t text-center transition-colors duration-300 ${
          isDarkMode ? 'border-[#2e2e2e]' : 'border-[#e9e9e9]'
        }`}>
          <p className={`text-sm font-normal transition-colors duration-300 ${
            isDarkMode ? 'text-[#787774]' : 'text-[#787774]'
          }`}>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
          </p>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className={`font-normal text-sm transition-all duration-150 mt-1 underline ${
              isDarkMode ? 'text-[#e9e9e9] hover:text-[#c9c9c9]' : 'text-[#37352f] hover:text-[#787774]'
            }`}
          >
            {isLogin ? 'Sign up here' : 'Sign in here'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
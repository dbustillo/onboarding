import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <img 
              src="/Untitled design (34).png" 
              alt="Inspire Logistics Logo" 
              className="w-16 h-16 rounded-full shadow-lg"
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-cyan-400 bg-clip-text text-transparent mb-2">
            Inspire E-Commerce Solutions
          </h1>
          <p className="text-gray-600">Client Onboarding Portal</p>
        </div>

        {/* Auth Form */}
        {isLogin ? (
          <LoginForm onToggleMode={() => setIsLogin(false)} />
        ) : (
          <SignUpForm onToggleMode={() => setIsLogin(true)} />
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 Inspire E-Commerce Solutions Inc.</p>
          <p>Professional Fulfillment & Warehousing Solutions</p>
        </div>
      </div>
    </div>
  );
};
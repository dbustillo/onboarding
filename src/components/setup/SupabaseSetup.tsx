import React, { useState } from 'react';
import { Database, Key, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

export const SupabaseSetup: React.FC = () => {
  const [step, setStep] = useState(1);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');

  const hasSupabaseConfig = import.meta.env.VITE_SUPABASE_URL && 
                           import.meta.env.VITE_SUPABASE_ANON_KEY &&
                           import.meta.env.VITE_SUPABASE_URL !== 'your_supabase_project_url_here';

  if (hasSupabaseConfig) {
    return null; // Don't show setup if already configured
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-cyan-100 p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-gradient-to-r from-blue-900 to-cyan-400 rounded-xl shadow-lg">
              <Database className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-cyan-400 bg-clip-text text-transparent mb-2">
            Supabase Setup Required
          </h1>
          <p className="text-gray-600">Configure your Supabase database to get started</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
          <div className="flex items-start">
            <AlertCircle className="text-yellow-600 mr-3 mt-1 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold text-yellow-800 mb-2">Setup Instructions</h3>
              <div className="text-yellow-700 text-sm space-y-2">
                <p><strong>Step 1:</strong> Create a new Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer\" className="text-blue-600 hover:underline">supabase.com</a></p>
                <p><strong>Step 2:</strong> Go to Settings → API in your Supabase dashboard</p>
                <p><strong>Step 3:</strong> Copy your Project URL and anon public key</p>
                <p><strong>Step 4:</strong> Update the <code>.env.local</code> file with your credentials</p>
                <p><strong>Step 5:</strong> Run the database migration (see instructions below)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-800 mb-4 flex items-center">
              <Key className="mr-2" size={20} />
              Environment Variables Setup
            </h3>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <div className="text-gray-400"># Update .env.local file:</div>
              <div className="mt-2">
                <div>VITE_SUPABASE_URL=https://your-project.supabase.co</div>
                <div>VITE_SUPABASE_ANON_KEY=your_anon_key_here</div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <h3 className="font-semibold text-green-800 mb-4 flex items-center">
              <Database className="mr-2" size={20} />
              Database Migration
            </h3>
            <p className="text-green-700 text-sm mb-4">
              After setting up your environment variables, run this command to create the database schema:
            </p>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
              <div>npx supabase db push</div>
            </div>
            <p className="text-green-700 text-xs mt-2">
              Or manually run the SQL migration file in your Supabase SQL editor
            </p>
          </div>

          <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-6">
            <h3 className="font-semibold text-cyan-800 mb-4">Quick Links</h3>
            <div className="space-y-2">
              <a 
                href="https://supabase.com/dashboard" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-cyan-600 hover:text-cyan-800 transition-colors"
              >
                <ExternalLink className="mr-2" size={16} />
                Supabase Dashboard
              </a>
              <a 
                href="https://supabase.com/docs/guides/getting-started" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-cyan-600 hover:text-cyan-800 transition-colors"
              >
                <ExternalLink className="mr-2" size={16} />
                Supabase Documentation
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-900 to-cyan-400 text-white px-8 py-3 rounded-xl font-bold hover:from-blue-800 hover:to-cyan-300 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Refresh After Setup
          </button>
        </div>
      </div>
    </div>
  );
};
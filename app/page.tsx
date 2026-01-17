'use client';

import { useState } from 'react';
import { Database, Terminal, Boxes, GithubIcon } from 'lucide-react';

import DemoApp from '@/components/demo/DemoApp';
import REPLTerminal from '@/components/repl/REPLTerminal';

type Tab = 'demo' | 'repl';

const Home = () => {
  const [activeTab, setActiveTab] = useState<Tab>('demo');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Database className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Mini RDBMS</h1>
                <p className="text-sm text-gray-600">
                  TypeScript Relational Database with SQL Support
                </p>
              </div>
            </div>

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <GithubIcon className="w-5 h-5" />
              <span className="hidden sm:inline">View on GitHub</span>
            </a>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('demo')}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === 'demo'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <Boxes className="w-5 h-5" />
              Demo Application
            </button>

            <button
              onClick={() => setActiveTab('repl')}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === 'repl'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <Terminal className="w-5 h-5" />
              SQL REPL
            </button>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'demo' && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Demo Application
              </h2>
              <p className="text-gray-600">
                A customer order management system demonstrating CRUD operations
                and JOIN queries.
              </p>
            </div>
            <DemoApp />
          </div>
        )}

        {activeTab === 'repl' && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                SQL REPL Terminal
              </h2>
              <p className="text-gray-600">
                Execute SQL queries interactively. Try CREATE TABLE, INSERT,
                SELECT, UPDATE, DELETE, and more.
              </p>
            </div>
            <REPLTerminal />
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Features
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Full SQL support (DDL & DML)</li>
                <li>✓ INNER, LEFT, RIGHT JOINs</li>
                <li>✓ WHERE clauses with AND/OR</li>
                <li>✓ Primary keys & constraints</li>
                <li>✓ Auto-increment support</li>
                <li>✓ O(1) indexed lookups</li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Data Types
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• INTEGER</li>
                <li>• TEXT</li>
                <li>• BOOLEAN</li>
                <li>• REAL (floating point)</li>
                <li>• DATE</li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Tech Stack
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Next.js (App Router)</li>
                <li>• TypeScript (Strict Mode)</li>
                <li>• Tailwind CSS</li>
                <li>• Persistent storage</li>
                <li>• 100% type-safe</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
            <p>Built with ❤️ using TypeScript • {new Date().getFullYear()}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

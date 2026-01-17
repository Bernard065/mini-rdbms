'use client';

import { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useExecuteSQLMutation, api } from '@/app/services/api';
import { ResultFormatter } from '@/lib';
import { Button, Textarea, Card } from '@/components/ui';
import { Play, Trash2, Clock } from 'lucide-react';
import type { QueryHistoryItem } from '@/lib/types/repl';

const REPLTerminal = () => {
  const dispatch = useDispatch();
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const [executeSQL] = useExecuteSQLMutation();
  const executeQuery = async (): Promise<void> => {
    if (!query.trim()) return;
    setIsExecuting(true);
    try {
      const result = await executeSQL({ sql: query.trim() }).unwrap();
      const formatted = ResultFormatter.format(result);
      const mutating = [
        'INSERT',
        'UPDATE',
        'DELETE',
        'CREATE_TABLE',
        'DROP_TABLE',
      ].includes(result.type);
      if (result.success && mutating) {
        // Invalidate RTK Query cache for both tables
        dispatch(api.util.invalidateTags(['Customer', 'Order']));
      }
      setHistory((prev) => [
        ...prev,
        {
          query: query.trim(),
          result: formatted,
          timestamp: new Date(),
          executionTime: result.executionTime,
        },
      ]);
      setQuery('');
    } catch (error) {
      setHistory((prev) => [
        ...prev,
        {
          query: query.trim(),
          result: `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      executeQuery();
    }
  };

  const clearHistory = (): void => {
    setHistory([]);
  };

  const loadExample = (example: string): void => {
    setQuery(example);
  };

  const examples = [
    'CREATE TABLE customers (id INTEGER PRIMARY KEY AUTO_INCREMENT, name TEXT NOT NULL, email TEXT UNIQUE)',
    "INSERT INTO customers (name, email) VALUES ('Alice', 'alice@example.com')",
    'SELECT * FROM customers',
    "SELECT * FROM customers WHERE name LIKE 'A%'",
    'CREATE TABLE orders (id INTEGER PRIMARY KEY AUTO_INCREMENT, customerId INTEGER, product TEXT, amount REAL)',
    "INSERT INTO orders (customerId, product, amount) VALUES (1, 'Cake', 20.00)",
    'SELECT * FROM orders',
    'SHOW TABLES',
  ];

  return (
    <div className="space-y-4">
      <Card title="SQL Query Editor">
        <div className="space-y-4">
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your SQL query here... (Ctrl+Enter to execute)"
            rows={6}
            className="font-mono text-sm"
          />

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={executeQuery}
              disabled={isExecuting || !query.trim()}
              size="md"
            >
              <Play className="w-4 h-4 mr-2" />
              Execute Query
            </Button>

            <Button
              onClick={() => setQuery('')}
              variant="secondary"
              size="md"
              disabled={!query}
            >
              Clear
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Example Queries">
        <div className="space-y-2">
          <p className="text-sm text-gray-600 mb-3">
            Click any example to load it into the editor:
          </p>
          <div className="space-y-2">
            {examples.map((example, idx) => (
              <button
                key={idx}
                onClick={() => loadExample(example)}
                className="w-full text-left px-3 py-2 text-sm font-mono bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Query History">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {history.length} {history.length === 1 ? 'query' : 'queries'}{' '}
              executed
            </p>
            <Button
              onClick={clearHistory}
              variant="ghost"
              size="sm"
              disabled={history.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear History
            </Button>
          </div>

          <div
            ref={terminalRef}
            className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto"
          >
            {history.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No queries executed yet. Try running a query above!
              </div>
            ) : (
              <div className="space-y-6">
                {history.map((item, idx) => (
                  <div
                    key={idx}
                    className="border-b border-gray-700 pb-4 last:border-0"
                  >
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                      <Clock className="w-3 h-3" />
                      <span>{item.timestamp.toLocaleTimeString()}</span>
                      {item.executionTime !== undefined && (
                        <span>
                          •{' '}
                          {item.executionTime < 1
                            ? `${(item.executionTime * 1000).toFixed(2)} μs`
                            : `${item.executionTime.toFixed(2)} ms`}
                        </span>
                      )}
                    </div>

                    <div className="text-blue-400 mb-2">
                      <span className="text-gray-500">mysql&gt;</span>{' '}
                      {item.query}
                    </div>

                    <pre className="text-green-400 whitespace-pre-wrap break-words">
                      {item.result}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default REPLTerminal;

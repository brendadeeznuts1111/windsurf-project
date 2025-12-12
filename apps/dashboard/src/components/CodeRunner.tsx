import React, { useState } from 'react';
import './code-runner.css';

interface CodeRunnerProps {
  code: string;
  title?: string;
  language?: string;
  timeout?: number;
}

interface ExecutionResult {
  output: string;
  error: string;
  exitCode: number;
  executionTime: number;
  timeout: number;
}

export const CodeRunner: React.FC<CodeRunnerProps> = ({
  code,
  title = 'Interactive Example',
  language = 'typescript',
  timeout = 5000
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executeCode = async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          timeout
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute code');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="code-runner">
      <div className="code-runner-header">
        <h4>{title}</h4>
        <button
          className="run-button"
          onClick={executeCode}
          disabled={isRunning}
        >
          {isRunning ? '⏳ Running...' : '🚀 Run Code'}
        </button>
      </div>

      <div className="code-block">
        <pre><code className={`language-${language}`}>{code}</code></pre>
      </div>

      {error && (
        <div className="execution-error">
          <h5>❌ Error</h5>
          <pre className="error-output">{error}</pre>
        </div>
      )}

      {result && (
        <div className="execution-result">
          <div className="result-header">
            <h5>✅ Output</h5>
            <span className="execution-time">
              {result.executionTime}ms
            </span>
          </div>

          {result.output && (
            <div className="output-section">
              <h6>stdout:</h6>
              <pre className="output">{result.output}</pre>
            </div>
          )}

          {result.error && (
            <div className="error-section">
              <h6>stderr:</h6>
              <pre className="error-output">{result.error}</pre>
            </div>
          )}

          <div className="execution-info">
            Exit code: {result.exitCode} | Timeout: {result.timeout}ms
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeRunner;
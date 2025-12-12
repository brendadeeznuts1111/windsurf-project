// Terminal execution functionality for documentation site
class CodeRunner {
    constructor() {
        this.isRunning = false;
        this.currentProcess = null;
    }

    async runCode(code, fileName) {
        if (this.isRunning) {
            throw new Error('Another process is already running');
        }

        this.isRunning = true;

        try {
            // For demo purposes, we'll simulate execution
            // In a real implementation, this would use WebContainers or a backend service
            const result = await this.simulateExecution(code, fileName);
            return result;
        } finally {
            this.isRunning = false;
        }
    }

    async simulateExecution(code, fileName) {
        const lines = [];

        // Simulate compilation/analysis
        lines.push({ type: 'command', content: `$ bun run ${fileName}` });
        lines.push({ type: 'output', content: 'Compiling TypeScript...' });

        await this.delay(500);

        // Check for common Bun APIs and simulate their execution
        if (code.includes('Bun.serve')) {
            lines.push({ type: 'success', content: '✓ HTTP server started on http://localhost:3000' });
            lines.push({ type: 'output', content: 'Routes:' });
            lines.push({ type: 'output', content: '  GET  /' });
            lines.push({ type: 'output', content: '  GET  /api/*' });
        }

        if (code.includes('Bun.file')) {
            lines.push({ type: 'success', content: '✓ File operations completed' });
            lines.push({ type: 'output', content: 'File I/O operations: read, write, stat' });
        }

        if (code.includes('Bun.spawn')) {
            lines.push({ type: 'success', content: '✓ Process spawned successfully' });
            lines.push({ type: 'output', content: 'Child process executed without errors' });
        }

        if (code.includes('bun:test')) {
            lines.push({ type: 'success', content: '✓ All tests passed' });
            lines.push({ type: 'output', content: 'Test results: 5 passed, 0 failed' });
        }

        // Simulate some output based on code content
        if (code.includes('console.log')) {
            const logMatches = code.match(/console\.log\(['"]([^'"]*)['"]\)/g);
            if (logMatches) {
                logMatches.forEach(match => {
                    const message = match.match(/console\.log\(['"]([^'"]*)['"]\)/)[1];
                    lines.push({ type: 'output', content: message });
                });
            }
        }

        // Simulate execution time
        await this.delay(1000);

        lines.push({ type: 'success', content: '✓ Execution completed successfully' });
        lines.push({ type: 'output', content: `Process exited with code 0` });

        return lines;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

class TerminalUI {
    constructor(containerId, outputId) {
        this.container = document.getElementById(containerId);
        this.output = document.getElementById(outputId);
        this.codeRunner = new CodeRunner();
        this.isVisible = false;
    }

    show() {
        this.container.style.display = 'block';
        this.isVisible = true;
        this.output.scrollTop = this.output.scrollHeight;
    }

    hide() {
        this.container.style.display = 'none';
        this.isVisible = false;
    }

    clear() {
        this.output.innerHTML = '<div class="terminal-placeholder">Click "Run This Example" to execute the code...</div>';
    }

    addLine(line) {
        // Remove placeholder if it exists
        const placeholder = this.output.querySelector('.terminal-placeholder');
        if (placeholder) {
            placeholder.remove();
        }

        const lineElement = document.createElement('div');
        lineElement.className = `terminal-line ${line.type}`;
        lineElement.textContent = line.content;
        this.output.appendChild(lineElement);

        // Auto-scroll to bottom
        this.output.scrollTop = this.output.scrollHeight;
    }

    async runCode(code, fileName) {
        this.show();
        this.clear();

        try {
            const lines = await this.codeRunner.runCode(code, fileName);
            lines.forEach(line => this.addLine(line));
        } catch (error) {
            this.addLine({ type: 'error', content: `Error: ${error.message}` });
        }
    }
}

// Global terminal instance
let terminalUI = null;

// Initialize terminal functionality
document.addEventListener('DOMContentLoaded', function() {
    const runBtn = document.getElementById('run-example-btn');
    const closeBtn = document.getElementById('close-terminal-btn');

    if (runBtn) {
        terminalUI = new TerminalUI('terminal-container', 'terminal-output');

        runBtn.addEventListener('click', async function() {
            if (terminalUI.codeRunner.isRunning) {
                return; // Prevent multiple executions
            }

            const originalText = runBtn.innerHTML;
            runBtn.innerHTML = '⏳ Running...';
            runBtn.disabled = true;

            try {
                // Extract code from the page
                const codeElement = document.querySelector('.code-container pre code');
                if (!codeElement) {
                    throw new Error('Code not found on page');
                }

                const code = codeElement.textContent;
                const fileName = window.location.pathname.split('/').pop().replace('.html', '.ts');

                await terminalUI.runCode(code, fileName);
            } catch (error) {
                console.error('Execution failed:', error);
                terminalUI.addLine({ type: 'error', content: `Failed to execute: ${error.message}` });
                terminalUI.show();
            } finally {
                runBtn.innerHTML = originalText;
                runBtn.disabled = false;
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            if (terminalUI) {
                terminalUI.hide();
            }
        });
    }
});
/**
 * Interactive Documentation Features
 * - Copy code blocks
 * - Theme toggle
 * - Interactive API demos
 * - Markdown rendering
 */

class InteractiveDocs {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.setupThemeToggle();
        this.setupCopyButtons();
        this.setupInteractiveDemos();
        this.setupMarkdownRendering();
        this.setupKeyboardShortcuts();
        this.applyTheme();
    }

    setupThemeToggle() {
        const toggle = document.getElementById('theme-toggle');
        const icon = document.getElementById('theme-icon');

        if (toggle && icon) {
            toggle.addEventListener('click', () => {
                this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
                this.applyTheme();
                localStorage.setItem('theme', this.currentTheme);
            });
        }
    }

    applyTheme() {
        const body = document.body;
        const icon = document.getElementById('theme-icon');

        if (this.currentTheme === 'dark') {
            body.setAttribute('data-theme', 'dark');
            if (icon) icon.textContent = '☀️';
        } else {
            body.removeAttribute('data-theme');
            if (icon) icon.textContent = '🌙';
        }
    }

    setupCopyButtons() {
        // Add copy buttons to all code blocks
        const codeBlocks = document.querySelectorAll('pre code');
        codeBlocks.forEach((codeBlock, index) => {
            const pre = codeBlock.parentElement;
            if (!pre) return;

            // Create copy button
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-button';
            copyButton.innerHTML = '📋 Copy';
            copyButton.setAttribute('aria-label', 'Copy code to clipboard');

            // Create button container
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'code-header';
            buttonContainer.appendChild(copyButton);

            // Insert before pre element
            pre.parentElement?.insertBefore(buttonContainer, pre);

            // Add copy functionality
            copyButton.addEventListener('click', async () => {
                const code = codeBlock.textContent || '';
                try {
                    await navigator.clipboard.writeText(code);
                    copyButton.innerHTML = '✅ Copied!';
                    copyButton.classList.add('success');

                    setTimeout(() => {
                        copyButton.innerHTML = '📋 Copy';
                        copyButton.classList.remove('success');
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy:', err);
                    copyButton.innerHTML = '❌ Failed';
                    copyButton.classList.add('error');

                    setTimeout(() => {
                        copyButton.innerHTML = '📋 Copy';
                        copyButton.classList.remove('error');
                    }, 2000);
                }
            });
        });
    }

    setupInteractiveDemos() {
        // Setup endpoint try buttons
        const tryButtons = document.querySelectorAll('.try-endpoint');
        tryButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const endpoint = (e.target as HTMLElement).dataset.endpoint;
                this.runEndpointDemo(endpoint);
            });
        });

        // Setup filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const filter = (e.target as HTMLElement).dataset.filter;
                this.applyFilter(filter);
            });
        });
    }

    async runEndpointDemo(endpoint) {
        const terminal = document.getElementById('terminal-output');
        if (!terminal) return;

        const demos = {
            'serve': async () => {
                return `Bun.serve({
  port: 3000,
  fetch: (req) => new Response("Hello from Bun!")
});
// Server running on http://localhost:3000`;
            },
            'file': async () => {
                return `const file = Bun.file('data.json');
const data = await file.json();
console.log('File loaded:', data);`;
            },
            'strip-ansi': async () => {
                return `const colored = "\\u001b[31mRed\\u001b[0m \\u001b[32mGreen\\u001b[0m";
const plain = Bun.stripANSI(colored);
console.log(plain); // "Red Green"`;
            },
            'stream-text': async () => {
                return `const response = await fetch('https://api.example.com/data');
const text = await response.body.text();
console.log('Response:', text);`;
            },
            'concurrent-test': async () => {
                return `describe.concurrent('API Tests', () => {
  test('endpoint 1', async () => {
    const res = await fetch('/api/1');
    expect(res.ok).toBe(true);
  });
  test('endpoint 2', async () => {
    const res = await fetch('/api/2');
    expect(res.ok).toBe(true);
  });
});`;
            },
            'snapshot': async () => {
                return `test('generates snapshot', () => {
  const data = { users: [{ id: 1, name: 'Alice' }] };
  expect(data).toMatchSnapshot();
});`;
            }
        };

        if (demos[endpoint]) {
            const result = await demos[endpoint]();
            this.updateTerminal(result);
        }
    }

    updateTerminal(output) {
        const currentCommand = document.getElementById('current-command');
        const currentOutput = document.getElementById('current-output');

        if (currentCommand) currentCommand.textContent = `Running ${output.split('\n')[0].slice(0, 30)}...`;
        if (currentOutput) currentOutput.textContent = output;
    }

    applyFilter(filter) {
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`)?.classList.add('active');

        // Filter examples (would need to be implemented based on actual example structure)
        console.log(`Applying filter: ${filter}`);
    }

    setupMarkdownRendering() {
        // Find markdown content and render it
        const markdownElements = document.querySelectorAll('.markdown-content');
        markdownElements.forEach(element => {
            const markdown = element.textContent || '';
            element.innerHTML = marked.parse(markdown);
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K: Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('search-input');
                searchInput?.focus();
            }

            // Escape: Clear search
            if (e.key === 'Escape') {
                const searchInput = document.getElementById('search-input');
                const clearButton = document.getElementById('clear-search');
                if (searchInput) searchInput.value = '';
                if (clearButton) clearButton.click();
            }

            // Ctrl/Cmd + /: Toggle theme
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                document.getElementById('theme-toggle')?.click();
            }
        });
    }

    // Utility method to create toast notifications
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new InteractiveDocs();
});

// Export for use in other scripts
window.InteractiveDocs = InteractiveDocs;
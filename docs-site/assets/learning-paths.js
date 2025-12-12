// Learning paths progress tracking functionality
class LearningPathTracker {
    constructor() {
        this.storageKey = 'bun-docs-learning-progress';
        this.progress = this.loadProgress();
    }

    loadProgress() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            return {};
        }
    }

    saveProgress() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
        } catch (e) {
            console.warn('Failed to save learning progress');
        }
    }

    markExampleComplete(pathId, exampleId) {
        if (!this.progress[pathId]) {
            this.progress[pathId] = { completed: [], total: 0 };
        }

        if (!this.progress[pathId].completed.includes(exampleId)) {
            this.progress[pathId].completed.push(exampleId);
        }

        this.saveProgress();
        this.updateUI();
    }

    isExampleComplete(pathId, exampleId) {
        return this.progress[pathId]?.completed?.includes(exampleId) || false;
    }

    getPathProgress(pathId) {
        const pathData = this.progress[pathId];
        if (!pathData) return { completed: 0, total: 0, percentage: 0 };

        const completed = pathData.completed.length;
        const total = pathData.total || completed; // Fallback if total not set
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { completed, total, percentage };
    }

    setPathTotal(pathId, total) {
        if (!this.progress[pathId]) {
            this.progress[pathId] = { completed: [], total: 0 };
        }
        this.progress[pathId].total = total;
        this.saveProgress();
    }

    updateUI() {
        // Update progress bars on learning path pages
        document.querySelectorAll('.progress-bar').forEach(bar => {
            const pathId = bar.dataset.pathId;
            if (pathId) {
                const progress = this.getPathProgress(pathId);
                bar.style.width = `${progress.percentage}%`;
                bar.textContent = `${progress.percentage}%`;

                // Update progress text
                const progressText = bar.closest('.learning-path-card')?.querySelector('.progress-text');
                if (progressText) {
                    progressText.textContent = `${progress.completed}/${progress.total} completed`;
                }
            }
        });

        // Update example completion status
        document.querySelectorAll('.path-example').forEach(example => {
            const exampleId = example.dataset.exampleId;
            const pathId = example.dataset.pathId;

            if (exampleId && pathId && this.isExampleComplete(pathId, exampleId)) {
                example.classList.add('completed');
                const checkbox = example.querySelector('.completion-checkbox');
                if (checkbox) checkbox.checked = true;
            }
        });
    }

    resetPath(pathId) {
        if (this.progress[pathId]) {
            this.progress[pathId].completed = [];
            this.saveProgress();
            this.updateUI();
        }
    }
}

// Enhanced learning path navigation
class LearningPathNavigator {
    constructor(tracker) {
        this.tracker = tracker;
        this.currentPath = null;
        this.currentExampleIndex = -1;
    }

    initialize() {
        // Detect current learning path from URL or page content
        const pathMatch = window.location.pathname.match(/path-(\d+)/);
        if (pathMatch) {
            this.currentPath = `path-${pathMatch[1]}`;
            this.initializePathPage();
        }

        // Add event listeners for example completion
        this.bindCompletionEvents();
    }

    initializePathPage() {
        const examples = document.querySelectorAll('.path-example');
        const exampleIds = Array.from(examples).map(ex => ex.dataset.exampleId);

        this.tracker.setPathTotal(this.currentPath, exampleIds.length);

        // Add navigation buttons
        this.addNavigationButtons(examples);
        this.addProgressIndicator();
    }

    addNavigationButtons(examples) {
        examples.forEach((example, index) => {
            const exampleId = example.dataset.exampleId;

            // Add completion checkbox
            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'completion-container';
            checkboxContainer.innerHTML = `
                <label class="completion-checkbox-label">
                    <input type="checkbox" class="completion-checkbox" data-example-id="${exampleId}">
                    <span class="checkmark"></span>
                    Mark as complete
                </label>
            `;

            example.appendChild(checkboxContainer);

            // Add navigation buttons
            const navContainer = document.createElement('div');
            navContainer.className = 'example-navigation';

            if (index > 0) {
                navContainer.innerHTML += `<button class="nav-btn prev-btn" data-target="${index - 1}">← Previous</button>`;
            }

            if (index < examples.length - 1) {
                navContainer.innerHTML += `<button class="nav-btn next-btn" data-target="${index + 1}">Next →</button>`;
            }

            example.appendChild(navContainer);
        });
    }

    addProgressIndicator() {
        const pathCard = document.querySelector('.learning-path-content');
        if (!pathCard) return;

        const progressContainer = document.createElement('div');
        progressContainer.className = 'path-progress-container';
        progressContainer.innerHTML = `
            <div class="path-progress-header">
                <h3>Your Progress</h3>
                <button class="reset-progress-btn">Reset Progress</button>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar" data-path-id="${this.currentPath}">
                    <span class="progress-text">0/0 completed</span>
                </div>
            </div>
        `;

        const pathOverview = pathCard.querySelector('.path-overview');
        if (pathOverview) {
            pathOverview.appendChild(progressContainer);
        }
    }

    bindCompletionEvents() {
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('completion-checkbox')) {
                const exampleId = e.target.dataset.exampleId;
                const isChecked = e.target.checked;

                if (isChecked) {
                    this.tracker.markExampleComplete(this.currentPath, exampleId);
                } else {
                    // Remove from completed (uncheck functionality)
                    if (this.tracker.progress[this.currentPath]) {
                        const index = this.tracker.progress[this.currentPath].completed.indexOf(exampleId);
                        if (index > -1) {
                            this.tracker.progress[this.currentPath].completed.splice(index, 1);
                            this.tracker.saveProgress();
                            this.tracker.updateUI();
                        }
                    }
                }
            }
        });

        // Navigation button events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-btn')) {
                e.preventDefault();
                const targetIndex = parseInt(e.target.dataset.target);
                this.navigateToExample(targetIndex);
            }

            if (e.target.classList.contains('reset-progress-btn')) {
                if (confirm('Are you sure you want to reset your progress for this learning path?')) {
                    this.tracker.resetPath(this.currentPath);
                }
            }
        });
    }

    navigateToExample(index) {
        const examples = document.querySelectorAll('.path-example');
        if (examples[index]) {
            examples[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
            examples[index].classList.add('highlighted');

            setTimeout(() => {
                examples[index].classList.remove('highlighted');
            }, 2000);
        }
    }
}

// Global instances
const learningTracker = new LearningPathTracker();
const pathNavigator = new LearningPathNavigator(learningTracker);

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    learningTracker.updateUI();
    pathNavigator.initialize();
});
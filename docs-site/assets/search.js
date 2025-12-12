
// Search functionality for the documentation site
class DocSearch {
    constructor() {
        this.searchIndex = null;
        this.currentResults = [];
    }

    async initialize() {
        // Load search index if available
        try {
            const response = await fetch('search-index.json');
            this.searchIndex = await response.json();
        } catch (error) {
            console.warn('Search index not available:', error);
        }
    }

    search(query, filters = {}) {
        if (!this.searchIndex) return [];

        const results = [];
        const searchTerm = query.toLowerCase().trim();

        for (const example of this.searchIndex.examples) {
            let matches = false;

            // Text search
            if (searchTerm) {
                matches = example.title.toLowerCase().includes(searchTerm) ||
                         example.description.toLowerCase().includes(searchTerm) ||
                         example.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
                         example.category.toLowerCase().includes(searchTerm);
            } else {
                matches = true; // Show all if no search term
            }

            // Apply filters
            if (matches && filters.difficulty && example.difficulty !== filters.difficulty) {
                matches = false;
            }

            if (matches && filters.category && example.category !== filters.category) {
                matches = false;
            }

            if (matches && filters.tags && filters.tags.length > 0) {
                const hasMatchingTag = filters.tags.some(filterTag =>
                    example.tags.some(exampleTag =>
                        exampleTag.toLowerCase().includes(filterTag.toLowerCase())
                    )
                );
                if (!hasMatchingTag) matches = false;
            }

            if (matches) {
                results.push(example);
            }
        }

        this.currentResults = results;
        return results;
    }

    highlightText(text, query) {
        if (!query) return text;

        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
}

// Global search instance
const docSearch = new DocSearch();

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    docSearch.initialize().then(() => {
        console.log('Documentation search initialized');
    });
});

// =============================================================================
// HEADING TEMPLATES - ODDS PROTOCOL - 2025-11-18
// =============================================================================
// AUTHOR: Odds Protocol Team
// VERSION: 1.0.0
// LAST_UPDATED: 2025-11-18T15:56:00Z
// DESCRIPTION: Type-safe heading templates for vault document types
// =============================================================================

// =============================================================================
// IMPORTS - 2025-11-18
// =============================================================================

import { VaultDocumentType, typeHeadingMap } from '../types/tick-processor-types.js';

// =============================================================================
// TYPE-SAFE TEMPLATE MAPPING - 2025-11-18
// =============================================================================

/**
 * Type-safe heading templates for each vault document type
 * Fully validated against VaultDocumentType enum
 */
export const headingTemplates: Record<VaultDocumentType, string[]> = {
    'note': [
        '# {title}',
        '## Overview',
        '## Details',
        '## Related',
        '## References'
    ],

    'api-doc': [
        '# {title}',
        '## Overview',
        '## Authentication',
        '## Endpoints',
        '## Errors',
        '## Examples'
    ],

    'project-plan': [
        '# {title}',
        '## Overview',
        '## Objectives',
        '## Timeline',
        '## Resources',
        '## Risks',
        '## Milestones'
    ],

    'meeting-notes': [
        '# {title}',
        '## Date & Time',
        '## Attendees',
        '## Agenda',
        '## Discussion',
        '## Action Items',
        '## Next Steps'
    ],

    'research-notes': [
        '# {title}',
        '## Abstract',
        '## Background',
        '## Methodology',
        '## Findings',
        '## Analysis',
        '## Conclusions',
        '## References'
    ],

    'documentation': [
        '# {title}',
        '## Overview',
        '## Installation',
        '## Usage',
        '## Configuration',
        '## Troubleshooting',
        '## FAQ'
    ],

    'specification': [
        '# {title}',
        '## Overview',
        '## Requirements',
        '## Technical Details',
        '## Implementation',
        '## Testing',
        '## Dependencies'
    ],

    'tutorial': [
        '# {title}',
        '## Prerequisites',
        '## Getting Started',
        '## Step-by-Step Guide',
        '## Examples',
        '## Common Issues',
        '## Next Steps'
    ],

    'template': [
        '# {title}',
        '## Purpose',
        '## Usage',
        '## Variables',
        '## Examples',
        '## Customization'
    ],

    'daily-note': [
        '# Daily Note - {date}',
        '## 📅 Today\'s Focus',
        '## ✅ Completed Tasks',
        '## 🎯 Current Priorities',
        '## 📝 Notes & Ideas',
        '## 🔄 Tomorrow\'s Plan',
        '## 📊 Reflection'
    ],

    'weekly-review': [
        '# Weekly Review - {week}',
        '## 📈 Weekly Metrics',
        '## ✅ Accomplishments',
        '## 🚧 Challenges',
        '## 📚 Learning & Growth',
        '## 🎯 Next Week Goals',
        '## 🔄 Process Improvements'
    ],

    'project-status': [
        '# {title} - Status Update',
        '## 📊 Current Status',
        '## ✅ Completed This Period',
        '## 🚧 In Progress',
        '## 🚫 Blocked Items',
        '## 📅 Upcoming Milestones',
        '## 📋 Action Items'
    ]
} as const;

// =============================================================================
// TEMPLATE VALIDATION - 2025-11-18
// =============================================================================

/**
 * Validates that all VaultDocumentType keys have corresponding templates
 * This ensures type safety at runtime
 */
export function validateHeadingTemplates(): boolean {
    const documentTypes = Object.keys(typeHeadingMap) as VaultDocumentType[];
    const templateTypes = Object.keys(headingTemplates) as VaultDocumentType[];

    const missingTypes = documentTypes.filter(type => !templateTypes.includes(type));

    if (missingTypes.length > 0) {
        console.error('Missing heading templates for document types:', missingTypes);
        return false;
    }

    return true;
}

/**
 * Gets heading template for a specific document type
 * Returns empty array if type not found (should never happen with proper typing)
 */
export function getHeadingTemplate(documentType: VaultDocumentType): string[] {
    return headingTemplates[documentType] || [];
}

/**
 * Formats heading template with provided variables
 * Replaces {title}, {date}, {week} etc. with actual values
 */
export function formatHeadingTemplate(
    documentType: VaultDocumentType,
    variables: Record<string, string> = {}
): string[] {
    const template = getHeadingTemplate(documentType);

    return template.map(heading => {
        let formatted = heading;

        // Replace common variables
        Object.entries(variables).forEach(([key, value]) => {
            formatted = formatted.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        });

        // Add default date if not provided
        if (!variables.date && formatted.includes('{date}')) {
            const today = new Date().toISOString().split('T')[0];
            formatted = formatted.replace('{date}', today);
        }

        // Add default week if not provided
        if (!variables.week && formatted.includes('{week}')) {
            const weekNumber = Math.ceil((new Date().getDate() - 1) / 7) + 1;
            const year = new Date().getFullYear();
            formatted = formatted.replace('{week}', `${year}-W${weekNumber.toString().padStart(2, '0')}`);
        }

        return formatted;
    });
}

// =============================================================================
// TEMPLATE UTILITIES - 2025-11-18
// =============================================================================

/**
 * Gets all available document types that have heading templates
 */
export function getAvailableDocumentTypes(): VaultDocumentType[] {
    return Object.keys(headingTemplates) as VaultDocumentType[];
}

/**
 * Checks if a document type has a heading template
 */
export function hasHeadingTemplate(documentType: VaultDocumentType): boolean {
    return documentType in headingTemplates;
}

/**
 * Gets template complexity score (number of headings)
 */
export function getTemplateComplexity(documentType: VaultDocumentType): number {
    return headingTemplates[documentType]?.length || 0;
}

// =============================================================================
// RUNTIME VALIDATION - 2025-11-18
// =============================================================================

// Validate templates on import
if (!validateHeadingTemplates()) {
    throw new Error('Heading templates validation failed. Missing templates for some document types.');
}

// =============================================================================
// EXPORTS - 2025-11-18
// =============================================================================

export { VaultDocumentType } from '../types/tick-processor-types.js';
export { typeHeadingMap } from '../types/tick-processor-types.js';

/**
 * Tasks Plugin Configuration Schema
 * Type-safe configuration for enhanced task management
 * 
 * @fileoverview TypeScript interfaces and validation for Tasks plugin
 * @author Odds Protocol Team
 * @version 1.0.0
 * @since 2025-11-18
 */

export interface TasksPluginConfig {
    /** Query presets for common task filtering patterns */
    presets: Record<string, string>;

    /** Global query applied to all task blocks */
    globalQuery: string;

    /** Global filter applied to all tasks */
    globalFilter: string;

    /** Whether to remove global filter from individual queries */
    removeGlobalFilter: boolean;

    /** Task format style: emoji, dataview, or custom */
    taskFormat: 'tasksPluginEmoji' | 'dataview' | 'custom';

    /** Auto-set created date when tasks are created */
    setCreatedDate: boolean;

    /** Auto-set done date when tasks are completed */
    setDoneDate: boolean;

    /** Auto-set cancelled date when tasks are cancelled */
    setCancelledDate: boolean;

    /** Enable auto-suggest in editor */
    autoSuggestInEditor: boolean;

    /** Minimum match length for auto-suggest */
    autoSuggestMinMatch: number;

    /** Maximum items to show in auto-suggest */
    autoSuggestMaxItems: number;

    /** Provide access keys for keyboard navigation */
    provideAccessKeys: boolean;

    /** Use filename as scheduled date */
    useFilenameAsScheduledDate: boolean;

    /** Date format for filename-as-scheduled-date */
    filenameAsScheduledDateFormat: string;

    /** Folders to use for filename-as-date functionality */
    filenameAsDateFolders: string[];

    /** Place recurrence rule on next line */
    recurrenceOnNextLine: boolean;

    /** Remove scheduled date when setting recurrence */
    removeScheduledDateOnRecurrence: boolean;

    /** Status configuration for core and custom statuses */
    statusSettings: {
        coreStatuses: CoreStatus[];
        customStatuses: CustomStatus[];
    };

    /** Feature flags and experimental settings */
    features: {
        INTERNAL_TESTING_ENABLED_BY_DEFAULT: boolean;
    };

    /** General plugin settings */
    generalSettings: Record<string, any>;

    /** UI state for expanded/collapsed headings */
    headingOpened: Record<string, boolean>;

    /** Debug and development settings */
    debugSettings: {
        ignoreSortInstructions: boolean;
        showTaskHiddenData: boolean;
        recordTimings: boolean;
    };

    /** Logging configuration for different components */
    loggingOptions: {
        minLevels: Record<string, 'debug' | 'info' | 'warn' | 'error'>;
    };
}

export interface CoreStatus {
    /** Status symbol for core tasks */
    symbol: ' ' | 'x';

    /** Display name for the status */
    name: 'Todo' | 'Done';

    /** Symbol to transition to when toggled */
    nextStatusSymbol: 'x' | ' ';

    /** Whether this status is available as a command */
    availableAsCommand: boolean;

    /** Type classification for the status */
    type: 'TODO' | 'DONE';
}

export interface CustomStatus {
    /** Status symbol for custom tasks */
    symbol: '/' | '-' | '>' | '?' | '!' | '*' | 'i' | 'b' | 'p' | 'c' | 'd' | 'm' | 'l' | 'u' | 'S' | 'P' | 'C' | 'B' | 'D' | 'M' | 'L' | 'U' | 'I' | 'R' | 'k' | '}' | 'd' | 'f';

    /** Display name for the custom status */
    name: string;

    /** Symbol to transition to when toggled */
    nextStatusSymbol: string;

    /** Whether this status is available as a command */
    availableAsCommand: boolean;

    /** Type classification for the custom status */
    type: 'IN_PROGRESS' | 'CANCELLED' | 'DONE' | 'TODO' | 'NON_TASK';
}

/**
 * Task Analytics Interface
 */
export interface TaskAnalytics {
    /** Unique task identifier */
    taskId: string;

    /** Task creation timestamp */
    createdAt: Date;

    /** Task completion timestamp (if completed) */
    completedAt?: Date;

    /** Current task status */
    status: TaskStatus;

    /** Task priority level */
    priority: TaskPriority;

    /** Associated project */
    project: string;

    /** List of task dependencies */
    dependencies: string[];

    /** Estimated completion time in hours */
    estimatedHours: number;

    /** Actual completion time in hours */
    actualHours?: number;

    /** Task complexity score (1-10) */
    complexity: number;

    /** Number of blocked tasks */
    blockedCount: number;

    /** Performance metrics */
    metrics: TaskMetrics;
}

export interface TaskMetrics {
    /** Time from creation to first action */
    timeToStart: number;

    /** Time from start to completion */
    timeToComplete: number;

    /** Number of status changes */
    statusChanges: number;

    /** Number of dependency updates */
    dependencyUpdates: number;

    /** Blocking duration (how long this task blocked others) */
    blockingDuration: number;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' | 'BLOCKED' | 'QUESTION';
export type TaskPriority = 'high' | 'medium' | 'low' | 'none';

/**
 * Performance Insights Interface
 */
export interface PerformanceInsight {
    /** Type of insight */
    type: 'bottleneck' | 'velocity' | 'quality' | 'resource' | 'dependency';

    /** Severity level */
    severity: 'high' | 'medium' | 'low';

    /** Human-readable description */
    description: string;

    /** Recommended action */
    recommendation: string;

    /** Related tasks or entities */
    affectedTasks: string[];

    /** Potential impact score */
    impactScore: number;
}

/**
 * Project Dashboard Interface
 */
export interface ProjectDashboard {
    /** Project identifier */
    project: string;

    /** Dashboard generation timestamp */
    generatedAt: Date;

    /** Project statistics */
    statistics: ProjectStatistics;

    /** Active tasks breakdown */
    activeTasks: TaskBreakdown;

    /** Performance metrics */
    performance: PerformanceMetrics;

    /** Recent insights */
    insights: PerformanceInsight[];
}

export interface ProjectStatistics {
    /** Total number of tasks */
    totalTasks: number;

    /** Number of completed tasks */
    completedTasks: number;

    /** Number of in-progress tasks */
    inProgressTasks: number;

    /** Number of todo tasks */
    todoTasks: number;

    /** Overall completion rate percentage */
    completionRate: number;

    /** Tasks completed this week */
    completedThisWeek: number;

    /** Tasks completed this month */
    completedThisMonth: number;
}

export interface TaskBreakdown {
    /** High priority tasks */
    highPriority: number;

    /** Medium priority tasks */
    mediumPriority: number;

    /** Low priority tasks */
    lowPriority: number;

    /** Tasks without priority */
    noPriority: number;

    /** Blocked tasks */
    blocked: number;

    /** Overdue tasks */
    overdue: number;

    /** Stale tasks (no activity for 7+ days) */
    stale: number;
}

export interface PerformanceMetrics {
    /** Tasks completed per week */
    velocity: number;

    /** Average time to complete tasks */
    averageCompletionTime: number;

    /** On-time delivery percentage */
    onTimeDeliveryRate: number;

    /** Task completion trend */
    completionTrend: 'increasing' | 'stable' | 'decreasing';

    /** Quality score based on rework and issues */
    qualityScore: number;
}

/**
 * CLI Command Interface
 */
export interface TaskCommand {
    /** Command type */
    type: 'create' | 'validate' | 'report' | 'list' | 'update' | 'delete';

    /** Command options */
    options: TaskCommandOptions;

    /** Execution result */
    result?: TaskCommandResult;
}

export interface TaskCommandOptions {
    /** Task description */
    description?: string;

    /** Project identifier */
    project?: string;

    /** Task priority */
    priority?: TaskPriority;

    /** Due date */
    due?: string;

    /** Scheduled date */
    scheduled?: string;

    /** Recurrence rule */
    recurrence?: string;

    /** Report period */
    period?: 'week' | 'month' | 'quarter';

    /** Output format */
    format?: 'json' | 'markdown' | 'table';
}

export interface TaskCommandResult {
    /** Success status */
    success: boolean;

    /** Result message */
    message: string;

    /** Affected tasks */
    affectedTasks: string[];

    /** Execution time in milliseconds */
    executionTime: number;

    /** Additional data */
    data?: any;
}

/**
 * Validation Results
 */
export interface ValidationResult {
    /** Overall validation status */
    isValid: boolean;

    /** Number of errors found */
    errorCount: number;

    /** Number of warnings found */
    warningCount: number;

    /** List of validation errors */
    errors: ValidationError[];

    /** List of validation warnings */
    warnings: ValidationWarning[];

    /** Validation timestamp */
    validatedAt: Date;
}

export interface ValidationError {
    /** Error type */
    type: 'dependency_cycle' | 'invalid_date' | 'missing_field' | 'invalid_status';

    /** Affected task */
    taskId: string;

    /** Error message */
    message: string;

    /** Severity level */
    severity: 'error';
}

export interface ValidationWarning {
    /** Warning type */
    type: 'stale_task' | 'overdue_task' | 'orphaned_task' | 'complex_task';

    /** Affected task */
    taskId: string;

    /** Warning message */
    message: string;

    /** Severity level */
    severity: 'warning';
}

/**
 * Default configuration with type safety
 */
export const tasksConfig: TasksPluginConfig = {
    presets: {
        this_file: "path includes {{query.file.path}}",
        this_folder: "folder includes {{query.file.folder}}",
        this_folder_only: "filter by function task.file.folder === query.file.folder",
        this_root: "root includes {{query.file.root}}",
        hide_date_fields: "# Hide any values for all date fields\nhide due date\nhide scheduled date\nhide start date\nhide created date\nhide done date\nhide cancelled date",
        hide_non_date_fields: "# Hide all the non-date fields, but not tags\nhide id\nhide depends on\nhide recurrence rule\nhide on completion\nhide priority",
        hide_query_elements: "# Hide postpone, edit and backinks\nhide postpone button\nhide edit button\nhide backlinks",
        hide_everything: "# Hide everything except description and any tags\npreset hide_date_fields\npreset hide_non_date_fields\npreset hide_query_elements"
    },
    globalQuery: "",
    globalFilter: "",
    removeGlobalFilter: false,
    taskFormat: "tasksPluginEmoji",
    setCreatedDate: false,
    setDoneDate: true,
    setCancelledDate: true,
    autoSuggestInEditor: true,
    autoSuggestMinMatch: 0,
    autoSuggestMaxItems: 20,
    provideAccessKeys: true,
    useFilenameAsScheduledDate: false,
    filenameAsScheduledDateFormat: "",
    filenameAsDateFolders: [],
    recurrenceOnNextLine: false,
    removeScheduledDateOnRecurrence: false,
    statusSettings: {
        coreStatuses: [
            {
                symbol: " ",
                name: "Todo",
                nextStatusSymbol: "x",
                availableAsCommand: true,
                type: "TODO"
            },
            {
                symbol: "x",
                name: "Done",
                nextStatusSymbol: " ",
                availableAsCommand: true,
                type: "DONE"
            }
        ],
        customStatuses: [
            {
                symbol: "/",
                name: "In Progress",
                nextStatusSymbol: "x",
                availableAsCommand: true,
                type: "IN_PROGRESS"
            },
            {
                symbol: "-",
                name: "Cancelled",
                nextStatusSymbol: " ",
                availableAsCommand: true,
                type: "CANCELLED"
            },
            {
                symbol: ">",
                name: "Blocked",
                nextStatusSymbol: " ",
                availableAsCommand: true,
                type: "TODO"
            },
            {
                symbol: "?",
                name: "Question",
                nextStatusSymbol: " ",
                availableAsCommand: true,
                type: "TODO"
            }
        ]
    },
    features: {
        INTERNAL_TESTING_ENABLED_BY_DEFAULT: true
    },
    generalSettings: {},
    headingOpened: {
        "Core Statuses": true,
        "Custom Statuses": true
    },
    debugSettings: {
        ignoreSortInstructions: false,
        showTaskHiddenData: false,
        recordTimings: false
    },
    loggingOptions: {
        minLevels: {
            "": "info",
            "tasks": "info",
            "tasks.Cache": "info",
            "tasks.Events": "info",
            "tasks.File": "info",
            "tasks.Query": "info",
            "tasks.Task": "info"
        }
    }
};

/**
 * Configuration validator
 */
export function validateTasksConfig(config: Partial<TasksPluginConfig>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate core settings
    if (config.autoSuggestMinMatch !== undefined && config.autoSuggestMinMatch < 0) {
        errors.push({
            type: 'invalid_field',
            taskId: 'config',
            message: 'autoSuggestMinMatch must be non-negative',
            severity: 'error'
        });
    }

    if (config.autoSuggestMaxItems !== undefined && config.autoSuggestMaxItems <= 0) {
        errors.push({
            type: 'invalid_field',
            taskId: 'config',
            message: 'autoSuggestMaxItems must be positive',
            severity: 'error'
        });
    }

    // Validate status settings
    if (config.statusSettings?.coreStatuses) {
        const todoStatus = config.statusSettings.coreStatuses.find(s => s.type === 'TODO');
        const doneStatus = config.statusSettings.coreStatuses.find(s => s.type === 'DONE');

        if (!todoStatus) {
            errors.push({
                type: 'missing_field',
                taskId: 'config',
                message: 'Core TODO status is required',
                severity: 'error'
            });
        }

        if (!doneStatus) {
            errors.push({
                type: 'missing_field',
                taskId: 'config',
                message: 'Core DONE status is required',
                severity: 'error'
            });
        }
    }

    return {
        isValid: errors.length === 0,
        errorCount: errors.length,
        warningCount: warnings.length,
        errors,
        warnings,
        validatedAt: new Date()
    };
}

/**
 * Type guards for runtime validation
 */
export function isCoreStatus(status: any): status is CoreStatus {
    return status &&
        typeof status.symbol === 'string' &&
        [' ', 'x'].includes(status.symbol) &&
        typeof status.name === 'string' &&
        ['Todo', 'Done'].includes(status.name) &&
        typeof status.nextStatusSymbol === 'string' &&
        typeof status.availableAsCommand === 'boolean' &&
        ['TODO', 'DONE'].includes(status.type);
}

export function isCustomStatus(status: any): status is CustomStatus {
    return status &&
        typeof status.symbol === 'string' &&
        typeof status.name === 'string' &&
        typeof status.nextStatusSymbol === 'string' &&
        typeof status.availableAsCommand === 'boolean' &&
        ['IN_PROGRESS', 'CANCELLED', 'DONE', 'TODO', 'NON_TASK'].includes(status.type);
}

export function isTasksPluginConfig(config: any): config is TasksPluginConfig {
    return config &&
        typeof config.presets === 'object' &&
        typeof config.globalQuery === 'string' &&
        typeof config.globalFilter === 'string' &&
        typeof config.removeGlobalFilter === 'boolean' &&
        ['tasksPluginEmoji', 'dataview', 'custom'].includes(config.taskFormat) &&
        typeof config.setCreatedDate === 'boolean' &&
        typeof config.setDoneDate === 'boolean' &&
        typeof config.setCancelledDate === 'boolean' &&
        typeof config.autoSuggestInEditor === 'boolean' &&
        typeof config.autoSuggestMinMatch === 'number' &&
        typeof config.autoSuggestMaxItems === 'number' &&
        typeof config.provideAccessKeys === 'boolean' &&
        typeof config.useFilenameAsScheduledDate === 'boolean' &&
        Array.isArray(config.filenameAsDateFolders) &&
        typeof config.recurrenceOnNextLine === 'boolean' &&
        typeof config.removeScheduledDateOnRecurrence === 'boolean' &&
        config.statusSettings &&
        Array.isArray(config.statusSettings.coreStatuses) &&
        Array.isArray(config.statusSettings.customStatuses);
}

// =============================================================================
// VAULT CONFIGURATION TYPES - ODDS PROTOCOL - 2025-11-19
// =============================================================================
// AUTHOR: Odds Protocol Team
// VERSION: 1.0.0
// LAST_UPDATED: 2025-11-19T02:16:00Z
// DESCRIPTION: Configuration type definitions extracted from monolithic file
// =============================================================================

// =============================================================================
// [CONFIGURATION_TYPES] - 2025-11-19
// =============================================================================

export interface VaultConfig {
    name: string;
    version: string;
    paths: VaultPaths;
    plugins: PluginConfigs;
    standards: VaultStandards;
    automation: AutomationConfig;
}

export interface VaultPaths {
    root: string;
    templates: string;
    scripts: string;
    archive: string;
    logs: string;
    temp: string;
}

export interface PluginConfigs {
    tasks: TasksPluginConfig;
    export: ExportPluginConfig;
    templater: TemplaterPluginConfig;
    linter: LinterPluginConfig;
    dataview: DataviewPluginConfig;
    homepage: HomepagePluginConfig;
}

export interface TasksPluginConfig {
    globalQuery: string;
    globalFilter: string;
    taskFormat: 'tasksPluginEmoji' | 'markdown';
    customStatuses: TaskStatus[];
    autoSuggest: AutoSuggestConfig;
    dateSettings: DateSettings;
}

export interface TaskStatus {
    symbol: string;
    name: string;
    nextStatusSymbol: string;
    availableAsCommand: boolean;
    type: 'TODO' | 'DONE' | 'IN_PROGRESS' | 'CANCELLED' | 'NON_TASK';
}

export interface AutoSuggestConfig {
    enabled: boolean;
    maxSuggestions: number;
    minQueryLength: number;
    filterSuggestions: boolean;
}

export interface DateSettings {
    dateFormat: string;
    timeFormat: string;
    timezone: string;
    weekStartDay: number;
}

export interface ExportPluginConfig {
    enabled: boolean;
    formats: ExportFormat[];
    defaultFormat: string;
    outputPath: string;
}

export interface ExportFormat {
    name: string;
    extension: string;
    mimeType: string;
    template?: string;
}

export interface TemplaterPluginConfig {
    enabled: boolean;
    templateFolder: string;
    commandTimeout: number;
    triggerOnFileCreation: boolean;
    autoJumpToCursor: boolean;
}

export interface LinterPluginConfig {
    enabled: boolean;
    rules: LinterRule[];
    lintOnSave: boolean;
    displayErrorsInEditor: boolean;
}

export interface LinterRule {
    name: string;
    description: string;
    enabled: boolean;
    options: Record<string, unknown>;
}

export interface DataviewPluginConfig {
    enabled: boolean;
    queryTimeout: number;
    inlineQueryPrefix: string;
    inlineJsQueryPrefix: string;
    enableInlineDataview: boolean;
}

export interface HomepagePluginConfig {
    enabled: boolean;
    homepagePath: string;
    openOnStartup: boolean;
    showRecentFiles: boolean;
}

// =============================================================================
// [STANDARDS_TYPES] - 2025-11-19
// =============================================================================

export interface VaultStandards {
    naming: NamingStandards;
    structure: StructureStandards;
    content: ContentStandards;
    metadata: MetadataStandards;
}

export interface NamingStandards {
    fileNaming: 'kebab-case' | 'snake_case' | 'camelCase' | 'PascalCase';
    folderNaming: 'kebab-case' | 'snake_case' | 'camelCase' | 'PascalCase';
    maxLength: number;
    forbiddenChars: string[];
}

export interface StructureStandards {
    maxDepth: number;
    requiredFolders: string[];
    folderStructure: FolderStructureRule[];
}

export interface FolderStructureRule {
    pattern: string;
    description: string;
    required: boolean;
}

export interface ContentStandards {
    maxLineLength: number;
    requireHeadings: boolean;
    headingStyle: 'atx' | 'setext';
    listStyle: 'dash' | 'asterisk' | 'plus';
}

export interface MetadataStandards {
    requireFrontmatter: boolean;
    requiredFields: string[];
    optionalFields: string[];
    dateFormat: string;
}

// =============================================================================
// [AUTOMATION_CONFIG_TYPES] - 2025-11-19
// =============================================================================

export interface AutomationConfig {
    enabled: boolean;
    watchMode: boolean;
    autoOrganize: boolean;
    autoValidate: boolean;
    autoBackup: boolean;
    schedules: AutomationSchedule[];
}

export interface AutomationSchedule {
    name: string;
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    enabled: boolean;
    lastRun: Date;
    nextRun: Date;
    actions: string[];
}

// =============================================================================
// [TEMPLATE_CONFIGURATION_TYPES] - 2025-11-19
// =============================================================================

export interface TemplateConfiguration {
    templates: TemplateDefinition[];
    variables: TemplateVariable[];
    rules: TemplateRule[];
}

export interface TemplateDefinition {
    name: string;
    path: string;
    description: string;
    category: string;
    variables: string[];
    requiredVariables: string[];
}

export interface TemplateVariable {
    name: string;
    type: 'string' | 'number' | 'date' | 'boolean' | 'select';
    description: string;
    defaultValue?: unknown;
    options?: string[];
    required: boolean;
}

export interface TemplateRule {
    name: string;
    condition: string;
    action: string;
    priority: number;
}

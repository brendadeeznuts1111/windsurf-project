/**
 * Advanced Template Functions for Templater
 * Dynamic content generation and vault integration
 */

const tp = require('./template-utils.js');

// Meeting template generator
function generateMeetingNotes(attendees = [], agenda = []) {
    const currentDate = tp.getCurrentDate();
    const currentDateTime = tp.getCurrentDateTime();
    const currentTime = tp.getCurrentTime();

    return {
        date: currentDate,
        datetime: currentDateTime,
        time: currentTime,
        attendees: attendees.length > 0 ? attendees : ['[List attendees]'],
        agenda: agenda.length > 0 ? agenda : ['[Agenda item 1]', '[Agenda item 2]'],
        actionItems: [],
        decisions: [],
        nextMeeting: null
    };
}

// Project tracking generator
function generateProjectTracker(projectName, startDate = null) {
    const projectId = tp.generateProjectId(projectName);
    const start = startDate || tp.getCurrentDate();

    return {
        id: projectId,
        name: projectName,
        startDate: start,
        status: 'planning',
        milestones: [],
        dependencies: [],
        risks: [],
        deliverables: []
    };
}

// API documentation generator
function generateAPIDocumentation(apiName, version = '1.0.0') {
    return {
        name: apiName,
        version: version,
        baseUrl: '[API Base URL]',
        endpoints: [],
        authentication: {
            type: 'Bearer Token',
            description: 'API authentication method'
        },
        examples: [],
        errorCodes: []
    };
}

// Research notes generator
function generateResearchNotes(topic, researchQuestion = '') {
    return {
        topic: topic,
        researchQuestion: researchQuestion || `[Research question for ${topic}]`,
        methodology: [],
        findings: [],
        sources: [],
        conclusions: [],
        nextSteps: []
    };
}

// Dashboard metrics generator
function generateDashboardMetrics(period = 'monthly') {
    return {
        period: period,
        generated: tp.getCurrentDate(),
        metrics: {
            performance: [],
            usage: [],
            quality: [],
            growth: []
        },
        insights: [],
        recommendations: []
    };
}

// Code snippet generator
function generateCodeSnippet(language, description = '') {
    return {
        language: language,
        description: description || `[Description of ${language} code snippet]`,
        code: '',
        examples: [],
        dependencies: [],
        notes: []
    };
}

// Export functions
module.exports = {
    generateMeetingNotes,
    generateProjectTracker,
    generateAPIDocumentation,
    generateResearchNotes,
    generateDashboardMetrics,
    generateCodeSnippet,
    ...tp
};

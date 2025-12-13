---
name: Feature Request
description: Suggest a new feature or enhancement
title: "[FEATURE] "
labels: ["enhancement", "triage"]
assignees: []
body:
  - type: markdown
    attributes:
      value: |
        ## ✨ Feature Request

        Thanks for suggesting a new feature! Your ideas help make Bun better for everyone.

  - type: textarea
    id: summary
    attributes:
      label: Summary
      description: A brief summary of the feature you'd like to see
      placeholder: "A short description of what you want..."
    validations:
      required: true

  - type: textarea
    id: problem
    attributes:
      label: Problem/Use Case
      description: What problem does this feature solve? What's your use case?
      placeholder: "Describe the problem this feature would solve..."
    validations:
      required: true

  - type: textarea
    id: solution
    attributes:
      label: Proposed Solution
      description: How would you like this feature to work?
      placeholder: "Describe how you envision this feature working..."
    validations:
      required: true

  - type: textarea
    id: alternatives
    attributes:
      label: Alternative Solutions
      description: Have you considered any alternative approaches?
      placeholder: "List any alternative solutions you've considered..."

  - type: dropdown
    id: priority
    attributes:
      label: Priority
      description: How important is this feature to you?
      options:
        - Nice to have
        - Would be helpful
        - Important for my use case
        - Critical for my project
    validations:
      required: true

  - type: dropdown
    id: complexity
    attributes:
      label: Estimated Complexity
      description: How complex do you think this feature would be to implement?
      options:
        - Simple (small change, low risk)
        - Medium (moderate changes, some risk)
        - Complex (major changes, high risk)
        - Very Complex (architectural changes, very high risk)

  - type: checkboxes
    id: related-areas
    attributes:
      label: Related Areas
      description: Which areas of Bun would this feature affect?
      options:
        - label: Runtime/API
        - label: Build System
        - label: Package Manager
        - label: Testing Framework
        - label: CLI Tools
        - label: Documentation
        - label: Performance
        - label: Security

  - type: textarea
    id: additional-context
    attributes:
      label: Additional Context
      description: Any additional context, examples, or references
      placeholder: "Add any additional context..."

  - type: checkboxes
    id: checklist
    attributes:
      label: Checklist
      description: Please confirm the following
      options:
        - label: I have searched for similar feature requests
          required: true
        - label: This feature would benefit other users
          required: true
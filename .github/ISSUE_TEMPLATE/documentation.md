---
name: Documentation Issue
description: Report documentation problems or suggest improvements
title: "[DOCS] "
labels: ["documentation", "triage"]
assignees: []
body:
  - type: markdown
    attributes:
      value: |
        ## 📚 Documentation Issue

        Help us improve our documentation! Report issues or suggest enhancements.

  - type: dropdown
    id: issue-type
    attributes:
      label: Type of Documentation Issue
      options:
        - Incorrect information
        - Missing information
        - Outdated information
        - Unclear explanation
        - Code examples not working
        - Broken links
        - Formatting issues
        - Translation issues
        - Other
    validations:
      required: true

  - type: input
    id: page-url
    attributes:
      label: Page URL
      description: URL of the documentation page with the issue
      placeholder: "https://docs.bun.sh/..."

  - type: textarea
    id: description
    attributes:
      label: Description
      description: Describe the documentation issue
      placeholder: "What's wrong with the documentation?"
    validations:
      required: true

  - type: textarea
    id: suggested-fix
    attributes:
      label: Suggested Fix
      description: How should this be fixed?
      placeholder: "How would you improve this documentation?"

  - type: dropdown
    id: severity
    attributes:
      label: Severity
      options:
        - Critical - Documentation is misleading or dangerous
        - High - Major documentation gaps
        - Medium - Confusing or incomplete information
        - Low - Minor improvements needed

  - type: checkboxes
    id: related-areas
    attributes:
      label: Related Areas
      description: Which documentation areas does this affect?
      options:
        - label: Runtime API documentation
        - label: Build system docs
        - label: Package manager guide
        - label: Testing framework docs
        - label: CLI tools documentation
        - label: Examples and tutorials
        - label: Migration guides
        - label: Troubleshooting guides

  - type: textarea
    id: additional-context
    attributes:
      label: Additional Context
      description: Any additional context or screenshots
      placeholder: "Add any additional context..."
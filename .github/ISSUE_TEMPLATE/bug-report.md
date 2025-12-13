---
name: Bug Report
description: Report a bug or unexpected behavior
title: "[BUG] "
labels: ["bug", "triage"]
assignees: []
body:
  - type: markdown
    attributes:
      value: |
        ## 🐛 Bug Report

        Thanks for taking the time to report a bug! Please fill out the information below to help us investigate.

  - type: textarea
    id: description
    attributes:
      label: Description
      description: A clear and concise description of what the bug is.
      placeholder: "Describe the bug..."
    validations:
      required: true

  - type: textarea
    id: reproduction
    attributes:
      label: Reproduction Steps
      description: Steps to reproduce the behavior
      placeholder: |
        1. Go to '...'
        2. Click on '....'
        3. Scroll down to '....'
        4. See error
      render: markdown
    validations:
      required: true

  - type: textarea
    id: expected-behavior
    attributes:
      label: Expected Behavior
      description: What you expected to happen
      placeholder: "What should happen..."
    validations:
      required: true

  - type: textarea
    id: actual-behavior
    attributes:
      label: Actual Behavior
      description: What actually happened
      placeholder: "What actually happened..."
    validations:
      required: true

  - type: dropdown
    id: severity
    attributes:
      label: Severity
      description: How severe is this bug?
      options:
        - Critical - System unusable
        - High - Major functionality broken
        - Medium - Feature partially broken
        - Low - Minor inconvenience
    validations:
      required: true

  - type: input
    id: bun-version
    attributes:
      label: Bun Version
      description: What version of Bun are you using?
      placeholder: "1.3.4"
    validations:
      required: true

  - type: input
    id: os
    attributes:
      label: Operating System
      description: What operating system are you using?
      placeholder: "macOS 14.0, Ubuntu 22.04, Windows 11"
    validations:
      required: true

  - type: textarea
    id: additional-context
    attributes:
      label: Additional Context
      description: Add any other context about the problem here (screenshots, logs, etc.)
      placeholder: "Add any other context..."

  - type: checkboxes
    id: checklist
    attributes:
      label: Checklist
      description: Please confirm the following
      options:
        - label: I have searched for similar issues and couldn't find any
          required: true
        - label: I have tested with the latest version of Bun
          required: true
        - label: I have included a minimal reproduction case
          required: true
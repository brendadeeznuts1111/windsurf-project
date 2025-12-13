---
name: Question
description: Ask a question about Bun or this project
title: "[QUESTION] "
labels: ["question", "triage"]
assignees: []
body:
  - type: markdown
    attributes:
      value: |
        ## ❓ Question

        Have a question about Bun or this project? We're here to help!

        **Note:** For general questions, you might also want to check:
        - [Bun Documentation](https://docs.bun.sh)
        - [GitHub Discussions](https://github.com/odds-protocol/windsurf/discussions)
        - [Discord Community](https://discord.gg/odds-protocol)

  - type: textarea
    id: question
    attributes:
      label: Your Question
      description: What would you like to know?
      placeholder: "What's your question?"
    validations:
      required: true

  - type: dropdown
    id: category
    attributes:
      label: Category
      description: What area does your question relate to?
      options:
        - General Bun usage
        - Runtime/API questions
        - Build system
        - Package management
        - Testing framework
        - CLI tools
        - Performance
        - Security
        - Documentation
        - Contributing to Bun
        - Other
    validations:
      required: true

  - type: textarea
    id: context
    attributes:
      label: Context
      description: Provide any relevant context or background information
      placeholder: "Any additional context that might help answer your question..."

  - type: textarea
    id: what-tried
    attributes:
      label: What Have You Tried?
      description: What have you already tried or researched?
      placeholder: "What steps have you taken to solve this?"

  - type: input
    id: bun-version
    attributes:
      label: Bun Version
      description: What version of Bun are you using? (if applicable)
      placeholder: "1.3.4"

  - type: input
    id: environment
    attributes:
      label: Environment
      description: Your operating system and other relevant environment details
      placeholder: "macOS 14.0, Node.js 20, etc."

  - type: checkboxes
    id: checklist
    attributes:
      label: Checklist
      options:
        - label: I have searched existing issues and discussions
          required: true
        - label: I have checked the Bun documentation
          required: true
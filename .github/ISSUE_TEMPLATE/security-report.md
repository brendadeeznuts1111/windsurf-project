---
name: Security Report
description: Report a security vulnerability
title: "[SECURITY] "
labels: ["security", "triage"]
assignees: []
body:
  - type: markdown
    attributes:
      value: |
        ## 🔒 Security Report

        **IMPORTANT:** This form is for reporting security vulnerabilities only.
        For general security questions, please use [GitHub Discussions](https://github.com/brendadeeznuts1111/windsurf-project/discussions).

        We take security seriously and will respond promptly to legitimate reports.

  - type: textarea
    id: summary
    attributes:
      label: Vulnerability Summary
      description: A brief summary of the security vulnerability
      placeholder: "Brief description of the vulnerability..."
    validations:
      required: true

  - type: dropdown
    id: severity
    attributes:
      label: Severity
      options:
        - Critical - Remote code execution, data breach
        - High - Privilege escalation, sensitive data exposure
        - Medium - DoS, information disclosure
        - Low - Minor security issues
    validations:
      required: true

  - type: textarea
    id: description
    attributes:
      label: Detailed Description
      description: Provide detailed information about the vulnerability
      placeholder: "Detailed description of the vulnerability, including affected components..."
    validations:
      required: true

  - type: textarea
    id: reproduction
    attributes:
      label: Reproduction Steps
      description: Steps to reproduce the vulnerability (be careful not to expose sensitive information)
      placeholder: "Steps to reproduce..."
    validations:
      required: true

  - type: textarea
    id: impact
    attributes:
      label: Potential Impact
      description: What could an attacker achieve by exploiting this vulnerability?
      placeholder: "Describe the potential impact..."

  - type: textarea
    id: mitigation
    attributes:
      label: Suggested Mitigation
      description: How could this vulnerability be fixed?
      placeholder: "Suggested fixes or workarounds..."

  - type: input
    id: affected-versions
    attributes:
      label: Affected Versions
      description: Which versions of Bun are affected?
      placeholder: "e.g., 1.3.0 - 1.3.4"

  - type: checkboxes
    id: disclosure
    attributes:
      label: Disclosure Preferences
      options:
        - label: I would like to be credited for this report
        - label: I would prefer to remain anonymous
        - label: I have already reported this to other parties

  - type: input
    id: contact
    attributes:
      label: Contact Information
      description: How can we contact you for follow-up? (optional)
      placeholder: "Email, GitHub username, etc."

  - type: markdown
    attributes:
      value: |
        ## Security Policy

        - We will acknowledge receipt within 48 hours
        - We will provide regular updates on our progress
        - We will credit you (unless you prefer anonymity)
        - We ask that you don't publicly disclose the vulnerability until we've had time to fix it
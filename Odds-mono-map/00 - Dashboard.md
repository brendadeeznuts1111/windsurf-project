---
type: dashboard
title: "Odds Protocol Vault Dashboard"
section: "00 - Dashboard"
category: "system"
priority: "high"
status: "active"
tags: ["dashboard", "overview", "metrics", "monitoring"]
created: "2025-11-19T00:40:00Z"
updated: "2025-11-19T00:40:00Z"
author: "vault-system"
---

# 🎯 Odds Protocol Vault Dashboard

> **System Overview & Real-time Monitoring**

## 📊 Vault Health Status

```dataview
TABLE 
  rows.file.link as "File",
  rows.status as "Status",
  rows.priority as "Priority",
  rows.updated as "Last Updated"
FROM "00 - Dashboard" OR "02 - Architecture" OR "03 - Development"
WHERE status = "active"
SORT priority DESC, updated DESC
LIMIT 10
```

## 🔍 System Metrics

### Content Statistics
- **Total Files**: `= this.file.lists.length` 
- **Active Projects**: `= length(filter(this.file.lists, (l) => contains(l.text, "🎯")))`
- **Documentation Pages**: `= length(filter(this.file.lists, (l) => contains(l.text, "📚")))`
- **Code Snippets**: `= length(filter(this.file.lists, (l) => contains(l.text, "💻")))`

### Recent Activity
```dataview
LIST
rows.file.link
FROM ""
SORT file.mtime DESC
LIMIT 5
```

## 🚨 Active Alerts

```dataview
TABLE
  severity as "Severity",
  message as "Message",
  timestamp as "Time"
FROM "08 - Logs"
WHERE contains(file.name, "alert") OR contains(file.name, "error")
SORT timestamp DESC
LIMIT 5
```

## 📈 Performance Metrics

### System Performance
- **Vault Load Time**: `< 2s`
- **Search Performance**: `< 500ms`
- **Plugin Health**: `All Active`
- **Storage Usage**: `Optimized`

### Recent Logs
```dataview
LIST
  file.link + " (" + file.mtime + ")"
FROM "08 - Logs"
WHERE file.mtime >= date(today) - dur(1 days)
SORT file.mtime DESC
```

## 🎯 Quick Actions

### Daily Tasks
- [ ] Review daily notes
- [ ] Check system alerts
- [ ] Update project status
- [ ] Validate vault standards

### System Management
- [ ] Run vault validation
- [ ] Check automation status
- [ ] Review error logs
- [ ] Update templates

## 🔗 Quick Navigation

### Core Sections
- [[02 - Architecture]] - System design & data models
- [[03 - Development]] - Code & testing
- [[04 - Documentation]] - Guides & technical docs
- [[06 - Templates]] - Template library

### Tools & Utilities
- [[08 - Logs]] - System logs & monitoring
- [[10 - Benchmarking]] - Performance metrics
- [[11 - Workshop]] - Development workspace

---

*Last updated: `= dateformat(date(now()), "yyyy-MM-dd HH:mm:ss")`*
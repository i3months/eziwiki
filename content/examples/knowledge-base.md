---
title: Knowledge Base Example
description: Build a team knowledge base with eziwiki
---

# Knowledge Base Example

![eziwiki](/images/eziwiki.png)

Use eziwiki to create a comprehensive team knowledge base.

## Use Cases

- **Internal Documentation** - Company processes and policies
- **Onboarding** - New employee resources
- **Troubleshooting** - Common issues and solutions
- **Best Practices** - Team standards and guidelines
- **FAQs** - Frequently asked questions

## Example Structure

```typescript
navigation: [
  {
    name: '🏠 Welcome',
    path: 'intro',
  },
  {
    name: '🎯 Getting Started',
    color: '#dbeafe',
    children: [
      { name: 'New Employee Onboarding', path: 'onboarding/new-employee' },
      { name: 'Team Structure', path: 'onboarding/team-structure' },
      { name: 'Tools & Access', path: 'onboarding/tools-access' },
      { name: 'First Week Checklist', path: 'onboarding/first-week' },
    ],
  },
  {
    name: '📋 Processes',
    color: '#fef3c7',
    children: [
      { name: 'Code Review', path: 'processes/code-review' },
      { name: 'Deployment', path: 'processes/deployment' },
      { name: 'Bug Reporting', path: 'processes/bug-reporting' },
      { name: 'Feature Requests', path: 'processes/feature-requests' },
    ],
  },
  {
    name: '💻 Development',
    color: '#e9d5ff',
    children: [
      { name: 'Setup Guide', path: 'development/setup' },
      { name: 'Coding Standards', path: 'development/coding-standards' },
      { name: 'Git Workflow', path: 'development/git-workflow' },
      { name: 'Testing', path: 'development/testing' },
    ],
  },
  {
    name: '🔧 Troubleshooting',
    color: '#fecaca',
    children: [
      { name: 'Common Issues', path: 'troubleshooting/common-issues' },
      { name: 'Database Problems', path: 'troubleshooting/database' },
      { name: 'Build Errors', path: 'troubleshooting/build-errors' },
      { name: 'Production Issues', path: 'troubleshooting/production' },
    ],
  },
  {
    name: '❓ FAQ',
    color: '#d1fae5',
    children: [
      { name: 'General', path: 'faq/general' },
      { name: 'Technical', path: 'faq/technical' },
      { name: 'HR & Benefits', path: 'faq/hr-benefits' },
    ],
  },
];
```

## Example Pages

### Onboarding Page

```markdown
---
title: New Employee Onboarding
description: Welcome to the team! Here's everything you need to get started.
---

# New Employee Onboarding

Welcome to the team! 🎉

## First Day

### Morning

- [ ] Meet with your manager
- [ ] Get your laptop and equipment
- [ ] Set up your workspace
- [ ] Complete HR paperwork

### Afternoon

- [ ] IT setup and account creation
- [ ] Team introduction meeting
- [ ] Office tour
- [ ] Review this knowledge base

## First Week

### Access & Tools

Get access to:

- [ ] GitHub organization
- [ ] Slack workspace
- [ ] Email account
- [ ] Project management tool
- [ ] Design tools (Figma)
- [ ] Cloud services (AWS)

See [Tools & Access](/onboarding/tools-access) for detailed setup instructions.

### Learning

- [ ] Read [Coding Standards](/development/coding-standards)
- [ ] Review [Git Workflow](/development/git-workflow)
- [ ] Understand [Code Review Process](/processes/code-review)
- [ ] Learn [Deployment Process](/processes/deployment)

### First Tasks

Your manager will assign you some starter tasks:

1. Set up local development environment
2. Fix a small bug
3. Add a small feature
4. Submit your first pull request

## Resources

- [Team Structure](/onboarding/team-structure)
- [Development Setup](/development/setup)
- [FAQ](/faq/general)

## Questions?

Don't hesitate to ask! We're here to help.

- **Slack**: #new-employees
- **Email**: hr@company.com
- **Manager**: Your manager's contact
```

### Process Documentation

```markdown
---
title: Code Review Process
description: How we review code at our company
---

# Code Review Process

All code changes must be reviewed before merging to main.

## Creating a Pull Request

### 1. Create a Branch

\`\`\`bash
git checkout -b feature/your-feature-name
\`\`\`

### 2. Make Your Changes

Write clean, tested code following our [Coding Standards](/development/coding-standards).

### 3. Commit Your Changes

\`\`\`bash
git add .
git commit -m "feat: add user authentication"
\`\`\`

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `test:` - Adding tests

### 4. Push and Create PR

\`\`\`bash
git push origin feature/your-feature-name
\`\`\`

Create a pull request on GitHub with:

- **Title**: Clear, descriptive title
- **Description**: What changed and why
- **Screenshots**: For UI changes
- **Testing**: How to test the changes

## PR Template

\`\`\`markdown

## What Changed

Brief description of the changes.

## Why

Explanation of why this change is needed.

## How to Test

1. Step 1
2. Step 2
3. Expected result

## Screenshots

(If applicable)

## Checklist

- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console errors
- [ ] Follows coding standards
      \`\`\`

## Review Process

### For Authors

- Respond to feedback promptly
- Make requested changes
- Re-request review after changes
- Don't merge your own PRs

### For Reviewers

- Review within 24 hours
- Be constructive and kind
- Test the changes locally
- Approve when satisfied

## Review Checklist

- [ ] Code follows our standards
- [ ] Tests are included
- [ ] No obvious bugs
- [ ] Performance is acceptable
- [ ] Security considerations addressed
- [ ] Documentation updated

## Approval Requirements

- **Small changes**: 1 approval
- **Medium changes**: 2 approvals
- **Large changes**: 2+ approvals + architect review

## After Approval

1. Squash and merge
2. Delete the branch
3. Deploy to staging
4. Test in staging
5. Deploy to production

## Related

- [Git Workflow](/development/git-workflow)
- [Deployment Process](/processes/deployment)
- [Coding Standards](/development/coding-standards)
```

### Troubleshooting Guide

```markdown
---
title: Common Issues
description: Solutions to frequently encountered problems
---

# Common Issues

Quick solutions to common problems.

## Development Environment

### Port Already in Use

**Problem**: `Error: Port 3000 is already in use`

**Solution**:

\`\`\`bash

# Find process using port 3000

lsof -i :3000

# Kill the process

kill -9 <PID>

# Or use a different port

PORT=3001 npm run dev
\`\`\`

### Module Not Found

**Problem**: `Error: Cannot find module 'xyz'`

**Solution**:

\`\`\`bash

# Clear cache and reinstall

rm -rf node_modules package-lock.json
npm install
\`\`\`

### Git Merge Conflicts

**Problem**: Merge conflicts when pulling

**Solution**:

\`\`\`bash

# Stash your changes

git stash

# Pull latest changes

git pull origin main

# Apply your changes

git stash pop

# Resolve conflicts manually

# Then commit

git add .
git commit -m "Resolve merge conflicts"
\`\`\`

## Database

### Connection Refused

**Problem**: `Error: Connection refused to database`

**Solution**:

1. Check if database is running:
   \`\`\`bash

   # PostgreSQL

   pg_isready

   # MySQL

   mysqladmin ping
   \`\`\`

2. Check connection string in `.env`
3. Verify database credentials
4. Check firewall settings

### Migration Failed

**Problem**: Database migration fails

**Solution**:

\`\`\`bash

# Rollback last migration

npm run migrate:rollback

# Fix the migration file

# Run again

npm run migrate
\`\`\`

## Build & Deployment

### Build Fails

**Problem**: `npm run build` fails

**Solution**:

1. Check for TypeScript errors:
   \`\`\`bash
   npm run type-check
   \`\`\`

2. Check for linting errors:
   \`\`\`bash
   npm run lint
   \`\`\`

3. Clear build cache:
   \`\`\`bash
   rm -rf .next out
   npm run build
   \`\`\`

### Deployment Fails

**Problem**: Deployment to production fails

**Solution**:

1. Check deployment logs
2. Verify environment variables
3. Test build locally:
   \`\`\`bash
   npm run build
   npm run start
   \`\`\`
4. Contact DevOps team if issue persists

## Still Stuck?

- **Slack**: #engineering-help
- **Email**: engineering@company.com
- **Escalate**: Contact your team lead
```

## Benefits for Knowledge Bases

### Centralized Information

All team knowledge in one place.

### Easy to Update

Anyone can contribute and update docs.

### Version Control

Track changes and see who updated what.

### Searchable

Find information quickly.

### Always Available

Static site means no downtime.

## Next Steps

- [Create Your First Wiki](/getting-started/first-wiki)
- [Configure Navigation](/configuration/navigation)
- [Deploy Your Knowledge Base](/deployment/static-export)

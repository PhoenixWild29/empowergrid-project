# 🤝 Contributing to EmpowerGRID

Thank you for your interest in contributing to EmpowerGRID! We welcome contributions from the community.

---

## 📋 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Testing Guidelines](#testing-guidelines)
8. [Documentation](#documentation)
9. [Community](#community)

---

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in all interactions.

### Our Standards

**Expected Behavior**:
- ✅ Be respectful and inclusive
- ✅ Welcome newcomers warmly
- ✅ Provide constructive feedback
- ✅ Focus on what's best for the community
- ✅ Show empathy towards others

**Unacceptable Behavior**:
- ❌ Harassment or discrimination
- ❌ Trolling or insulting comments
- ❌ Personal or political attacks
- ❌ Publishing others' private information
- ❌ Unprofessional conduct

### Enforcement

Violations may result in temporary or permanent ban from the project. Report issues to: conduct@empowergrid.com

---

## 🚀 Getting Started

### 1. Fork the Repository

Click the "Fork" button on GitHub to create your own copy of the repository.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/empowergrid-project.git
cd empowergrid-project
```

### 3. Add Upstream Remote

```bash
git remote add upstream https://github.com/PhoenixWild29/empowergrid-project.git
```

### 4. Install Dependencies

```bash
cd app
npm install
```

### 5. Set Up Environment

```bash
cp .env.example .env
# Edit .env with your development settings
```

### 6. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 🔄 Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
# For features
git checkout -b feature/your-feature-name

# For bug fixes
git checkout -b fix/issue-number-description

# For documentation
git checkout -b docs/what-you-are-documenting
```

**Branch Naming Convention**:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or fixes
- `chore/` - Maintenance tasks

### 2. Keep Your Fork Updated

```bash
# Fetch upstream changes
git fetch upstream

# Merge upstream changes
git merge upstream/master

# Or rebase
git rebase upstream/master
```

### 3. Make Your Changes

- Write clean, readable code
- Follow the coding standards (see below)
- Add tests for new features
- Update documentation as needed
- Ensure TypeScript types are correct

### 4. Test Your Changes

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Run tests
npm run test

# Build
npm run build
```

### 5. Commit Your Changes

Follow our [Commit Guidelines](#commit-guidelines).

### 6. Push to Your Fork

```bash
git push origin your-branch-name
```

### 7. Create a Pull Request

Go to GitHub and create a pull request from your fork to the main repository.

---

## 💻 Coding Standards

### TypeScript

**Use TypeScript for all new code**:
```typescript
// ✅ Good: Explicit types
interface User {
  id: string;
  email: string;
  name: string;
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ Bad: Using 'any'
function getUser(id: any): any {
  // ...
}
```

### File Organization

```
feature/
├── components/
│   └── FeatureComponent.tsx       # React component
├── services/
│   └── featureService.ts          # Business logic
├── api/
│   └── feature.ts                 # API endpoint
└── types/
    └── feature.ts                 # TypeScript types
```

### Naming Conventions

- **Components**: PascalCase (`UserDashboard.tsx`)
- **Functions**: camelCase (`getUserData()`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINT`)
- **Types/Interfaces**: PascalCase (`UserProfile`)
- **Files**: kebab-case or PascalCase for components

### Code Style

**Use Prettier and ESLint**:
```bash
# Format code
npm run format

# Lint
npm run lint

# Auto-fix
npm run lint:fix
```

**Best Practices**:
- ✅ Use functional components (React)
- ✅ Use hooks instead of classes
- ✅ Keep components small and focused
- ✅ Extract reusable logic into hooks
- ✅ Use Zod for validation
- ✅ Handle errors gracefully
- ✅ Add comments for complex logic

### API Endpoints

```typescript
// Standard API route structure
import type { NextApiRequest, NextApiResponse } from 'next';
import * as z from 'zod';

const Schema = z.object({
  // Define schema
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1. Validate input
  // 2. Authenticate user
  // 3. Authorize action
  // 4. Process request
  // 5. Return response
  
  try {
    if (req.method === 'POST') {
      // Handle POST
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## 📝 Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
# Feature
git commit -m "feat(escrow): add multi-signature validation"

# Bug fix
git commit -m "fix(api): resolve rate limiting issue in oracle endpoint"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Refactor
git commit -m "refactor(services): extract common validation logic"
```

### Commit Message Rules

- ✅ Use present tense ("add feature" not "added feature")
- ✅ Use imperative mood ("move cursor to..." not "moves cursor to...")
- ✅ Limit first line to 72 characters
- ✅ Reference issues and PRs where appropriate
- ✅ Provide context in the body for complex changes

---

## 🔍 Pull Request Process

### Before Submitting

- [ ] Code follows the style guidelines
- [ ] TypeScript types are correct
- [ ] All tests pass (`npm run test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No linting errors (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation updated (if needed)
- [ ] Self-review completed

### PR Title Format

```
<type>: <description>

Examples:
feat: Add automated milestone verification
fix: Resolve database connection pooling issue
docs: Update deployment guide with new scripts
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests you ran

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Screenshots (if applicable)
Add screenshots here

## Related Issues
Fixes #(issue number)
```

### Review Process

1. **Automated Checks**: CI/CD runs tests and builds
2. **Code Review**: At least 1 reviewer approval required
3. **Testing**: Verify changes work as expected
4. **Merge**: Squash and merge into master

---

## 🧪 Testing Guidelines

### Writing Tests

**Unit Tests**:
```typescript
// __tests__/services/myService.test.ts
import { myFunction } from '../lib/services/myService';

describe('myFunction', () => {
  it('should return expected result', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
  
  it('should handle errors gracefully', () => {
    expect(() => myFunction(null)).toThrow();
  });
});
```

**API Tests**:
```typescript
// __tests__/api/myEndpoint.test.ts
import handler from '../pages/api/myEndpoint';

describe('/api/myEndpoint', () => {
  it('should return 200 on valid request', async () => {
    const req = { method: 'GET', query: {} };
    const res = { status: jest.fn(), json: jest.fn() };
    
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
```

### Test Coverage

- Aim for >70% code coverage
- All critical paths must be tested
- All API endpoints should have tests
- All services should have unit tests

---

## 📖 Documentation

### Code Comments

```typescript
/**
 * Brief description of the function
 * 
 * @param userId - The user's unique identifier
 * @param options - Optional configuration
 * @returns User object or null if not found
 * @throws {Error} If database connection fails
 */
async function getUser(userId: string, options?: GetUserOptions): Promise<User | null> {
  // Implementation
}
```

### Component Documentation

```typescript
/**
 * UserProfile Component
 * 
 * Displays user profile information with edit capabilities
 * 
 * @component
 * @example
 * <UserProfile userId="123" onUpdate={handleUpdate} />
 */
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

export default function UserProfile({ userId, onUpdate }: UserProfileProps) {
  // Implementation
}
```

### API Documentation

Document all API endpoints in the code:

```typescript
/**
 * GET /api/users/[userId]
 * 
 * Retrieves user details by ID
 * 
 * @param userId - User ID from URL parameter
 * @returns 200 - User object
 * @returns 404 - User not found
 * @returns 500 - Server error
 */
```

---

## 🎨 Design Guidelines

### UI/UX Principles

- **Consistency**: Use existing components and patterns
- **Accessibility**: Follow WCAG 2.1 AA standards
- **Responsiveness**: Mobile-first design
- **Performance**: Optimize for speed
- **Simplicity**: Keep interfaces intuitive

### Component Design

```typescript
// ✅ Good: Small, focused component
function UserAvatar({ user }: { user: User }) {
  return <img src={user.avatar} alt={user.name} />;
}

// ❌ Bad: Too many responsibilities
function UserSection({ user, onEdit, onDelete, onMessage, ... }) {
  // Too complex!
}
```

---

## 🔒 Security

### Reporting Security Issues

**DO NOT** create public GitHub issues for security vulnerabilities.

Instead, email: **security@empowergrid.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Security Best Practices

- ✅ Never commit secrets or API keys
- ✅ Validate all user input
- ✅ Use parameterized queries (Prisma handles this)
- ✅ Implement rate limiting
- ✅ Use HTTPS in production
- ✅ Keep dependencies updated

---

## 🏷️ Issue Labels

We use the following labels:

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `priority: high` - High priority
- `priority: medium` - Medium priority
- `priority: low` - Low priority
- `wontfix` - This will not be worked on

---

## 🎯 Development Areas

### Good First Issues

New contributors should look for issues labeled `good first issue`:
- Documentation improvements
- UI/UX enhancements
- Test coverage improvements
- Code cleanup

### Areas Needing Help

- **Testing**: Writing unit and integration tests
- **Documentation**: Improving guides and API docs
- **Accessibility**: WCAG compliance improvements
- **Performance**: Optimization opportunities
- **Mobile**: React Native app development
- **Internationalization**: Multi-language support

---

## 🔧 Setting Up Development Environment

### Required Tools

```bash
# Node.js and npm
node --version  # Should be 18+
npm --version   # Should be 9+

# PostgreSQL
psql --version  # Should be 14+

# Solana CLI
solana --version  # Should be 1.16+

# Anchor
anchor --version  # Should be 0.28+
```

### IDE Setup

**VS Code** (Recommended):
- Install ESLint extension
- Install Prettier extension
- Install TypeScript extension
- Install Prisma extension

**Settings**:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### Database Setup

```bash
# Create development database
createdb empowergrid_dev

# Set DATABASE_URL in .env
DATABASE_URL="postgresql://localhost:5432/empowergrid_dev"

# Run migrations
npx prisma migrate dev
```

---

## 🧪 Testing Guidelines

### Running Tests

```bash
# All tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Specific file
npm run test -- MyComponent.test.tsx
```

### Writing Tests

**Test Structure**:
```typescript
describe('Component/Function Name', () => {
  // Setup
  beforeEach(() => {
    // Common setup
  });
  
  // Happy path
  it('should work correctly with valid input', () => {
    // Test
  });
  
  // Edge cases
  it('should handle empty input gracefully', () => {
    // Test
  });
  
  // Error cases
  it('should throw error for invalid input', () => {
    // Test
  });
  
  // Cleanup
  afterEach(() => {
    // Cleanup
  });
});
```

### Test Coverage Requirements

- **New Features**: Minimum 80% coverage
- **Bug Fixes**: Test for regression
- **Refactors**: Maintain or improve coverage

---

## 📚 Documentation Guidelines

### Code Documentation

- Document all public APIs
- Use JSDoc comments
- Explain complex algorithms
- Add examples where helpful

### User Documentation

- Keep it simple and clear
- Include screenshots/GIFs
- Provide step-by-step instructions
- Update table of contents

### API Documentation

- Document all endpoints
- Include request/response examples
- List possible error codes
- Specify authentication requirements

---

## 🔄 Pull Request Guidelines

### Before Submitting

1. **Update your branch**:
```bash
git fetch upstream
git rebase upstream/master
```

2. **Run all checks**:
```bash
npm run type-check
npm run lint
npm run test
npm run build
```

3. **Review your changes**:
```bash
git diff master...your-branch
```

### PR Size

- Keep PRs focused and reasonably sized
- Large PRs are harder to review
- Consider breaking into smaller PRs
- Aim for <500 lines changed

### PR Description

- Clearly describe what changes you made
- Explain why the changes are necessary
- Link to related issues
- Add screenshots for UI changes
- List any breaking changes

### Code Review

- Be open to feedback
- Respond to comments promptly
- Make requested changes
- Ask questions if unclear
- Thank reviewers

---

## 🏗️ Architecture Guidelines

### Component Structure

```typescript
// 1. Imports
import React, { useState, useEffect } from 'react';
import { MyService } from '../services/myService';

// 2. Types
interface MyComponentProps {
  // Props
}

// 3. Component
export default function MyComponent({ prop1, prop2 }: MyComponentProps) {
  // 4. State
  const [state, setState] = useState();
  
  // 5. Effects
  useEffect(() => {
    // Side effects
  }, []);
  
  // 6. Handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // 7. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Service Structure

```typescript
// Service class or singleton
class MyService {
  private config: Config;
  
  constructor(config: Config) {
    this.config = config;
  }
  
  async performAction(): Promise<Result> {
    // Implementation
  }
}

export const myService = new MyService(defaultConfig);
```

---

## 🐛 Bug Report Template

When reporting bugs via GitHub Issues:

```markdown
**Bug Description**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 120]
- Version: [e.g. 1.0.0]

**Additional Context**
Any other relevant information.
```

---

## ✨ Feature Request Template

```markdown
**Feature Description**
Clear description of the feature.

**Problem It Solves**
What problem does this solve?

**Proposed Solution**
How should it work?

**Alternatives Considered**
Other solutions you've considered.

**Additional Context**
Mockups, examples, references.
```

---

## 📊 Code Review Checklist

### For Reviewers

- [ ] Code follows style guidelines
- [ ] Changes are well-documented
- [ ] Tests are included and passing
- [ ] No unnecessary dependencies added
- [ ] Performance impact considered
- [ ] Security implications reviewed
- [ ] Breaking changes noted
- [ ] Documentation updated

### For Authors

Before requesting review:
- [ ] Self-reviewed the code
- [ ] Tested locally
- [ ] Updated documentation
- [ ] Added/updated tests
- [ ] Rebased on latest master
- [ ] Descriptive PR title and description

---

## 🌟 Recognition

### Contributors

All contributors will be recognized in:
- GitHub contributors page
- Release notes
- Project documentation

### Hall of Fame

Outstanding contributors may be featured in:
- Project README
- Social media shoutouts
- Community spotlights

---

## 📞 Getting Help

### Communication Channels

- **GitHub Discussions**: For questions and ideas
- **GitHub Issues**: For bugs and features
- **Discord**: _Coming Soon_
- **Email**: dev@empowergrid.com

### Resources

- [Documentation](app/)
- [Architecture Guide](app/SYSTEM_ARCHITECTURE.md)
- [Deployment Guide](app/DEPLOYMENT_GUIDE.md)
- [API Reference](app/pages/api/)

---

## 🎓 Learning Resources

### For Newcomers

- [Next.js Tutorial](https://nextjs.org/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Prisma Getting Started](https://www.prisma.io/docs/getting-started)
- [Solana Cookbook](https://solanacookbook.com/)
- [Anchor Book](https://book.anchor-lang.com/)

### Project-Specific

- [System Architecture](app/SYSTEM_ARCHITECTURE.md)
- [Phase Documentation](app/)
- [Test Reports](app/)

---

## ✅ Contribution Checklist

Before submitting your contribution:

- [ ] Created a feature branch
- [ ] Made focused, logical commits
- [ ] Followed commit message guidelines
- [ ] Written/updated tests
- [ ] Updated documentation
- [ ] Ran type-check, lint, and tests
- [ ] Tested in development environment
- [ ] Rebased on latest master
- [ ] Created descriptive PR
- [ ] Requested review

---

## 🙏 Thank You!

Thank you for contributing to EmpowerGRID! Together, we're building the future of renewable energy funding.

Every contribution, no matter how small, makes a difference. 💚

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Questions?** Contact us at dev@empowergrid.com or open a GitHub Discussion.

**Happy Contributing!** 🎉

---

_Last Updated: October 10, 2025_


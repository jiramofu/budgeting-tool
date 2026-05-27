# Contributing to Budgeting Tool

Thank you for your interest in contributing to the Budgeting Tool project! This document provides guidelines and instructions for contributing.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a feature branch** from `main`
4. **Make your changes** with clear commits
5. **Push to your fork** and submit a Pull Request

## Development Setup

### Prerequisites

- Node.js 18+ LTS
- PostgreSQL 13+
- Git

### Local Development

```bash
# Clone and setup
git clone https://github.com/your-fork/budgeting-tool.git
cd budgeting-tool

# Install dependencies
npm install --workspaces

# Create environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start database
psql -U postgres -c "CREATE DATABASE budgeting_tool;"

# Run development servers in separate terminals
cd backend && npm run dev
cd frontend && npm run dev
```

## Code Style

### TypeScript

- Use strict TypeScript mode
- Prefer interfaces over types for public APIs
- Use explicit return types on functions
- Avoid `any` type - use `unknown` instead

```typescript
// Good
interface User {
  id: number;
  email: string;
  createdAt: Date;
}

function getUser(id: number): Promise<User | null> {
  // ...
}

// Avoid
type user = { id: any; email: string };
function getUser(id: any) {
  // ...
}
```

### Formatting

The project uses Prettier for code formatting.

```bash
# Format code
npm run format

# Format specific file
npx prettier --write src/file.ts

# Check formatting
npm run format:check
```

### Linting

Code must pass ESLint checks.

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Commit Messages

Follow conventional commits format:

```
type(scope): subject

body

footer
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

Examples:
```
feat(auth): add two-factor authentication
fix(budget): fix calculation overflow for large amounts
docs(api): update endpoint documentation
refactor(api): simplify transaction categorization
```

## Testing

### Unit Tests

Test individual functions and components in isolation.

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm test -- --watch
```

### Integration Tests

Test API endpoints and workflows.

```bash
# Run integration tests
npm run test:integration
```

### E2E Tests

Test complete user workflows.

```bash
# Run E2E tests
npm run test:e2e
```

### Test Coverage

Minimum coverage requirements:
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

## Pull Request Process

1. **Update documentation** if you change functionality
2. **Add/update tests** for any new code
3. **Run tests locally** before pushing
4. **Reference any related issues** in the PR description
5. **Keep commits clean** and meaningful
6. **Update CHANGELOG** if applicable

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #issue_number

## Testing
Describe testing approach:
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Manual testing performed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No new warnings generated
```

## Project Structure

```
budgeting-tool/
├── backend/           # Express API
├── frontend/          # React web app
├── mobile/            # React Native app
├── docs/              # Documentation
└── scripts/           # Utility scripts
```

## Backend Development

### Creating New Features

1. **Database**: Add migrations if needed
2. **Models**: Define TypeScript interfaces
3. **Routes**: Create API endpoints
4. **Services**: Implement business logic
5. **Tests**: Write unit and integration tests

### API Conventions

- Use RESTful endpoints
- Return consistent response format
- Include proper error handling
- Document all endpoints

```typescript
// Example endpoint
router.post('/budgets', authenticate, async (req, res) => {
  try {
    const budget = await BudgetService.create(req.user.id, req.body);
    res.status(201).json(budget);
  } catch (error) {
    next(error);
  }
});
```

## Frontend Development

### Component Structure

```typescript
// Components should be in separate files
// with prop interfaces and default exports

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}

export function Button({ children, variant = 'primary', onClick }: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
}
```

### Hooks and State

- Use React hooks for state management
- Keep components focused and single-responsibility
- Extract complex logic into custom hooks
- Use Context for global state

### Styling

- Use Tailwind CSS for styling
- Keep responsive design in mind
- Test on mobile devices
- Follow design system guidelines

## Mobile Development

### React Native Guidelines

- Test on both iOS and Android
- Use platform-specific components when needed
- Follow RN best practices
- Keep performance in mind
- Test network conditions

### Navigation

- Use React Navigation for routing
- Keep screen hierarchy clear
- Handle deep linking properly
- Test navigation flows

## Performance Considerations

### Backend

- Use database indexes for frequently queried fields
- Implement query pagination
- Cache expensive operations
- Monitor query performance

### Frontend

- Code split and lazy load routes
- Optimize images
- Minimize bundle size
- Use React.memo for expensive components

### Mobile

- Cache API responses
- Lazy load screens
- Minimize bundle size
- Test on low-end devices

## Security Guidelines

- Never commit secrets or API keys
- Validate user input on frontend and backend
- Use parameterized SQL queries
- Implement proper authentication/authorization
- Keep dependencies updated
- Follow OWASP top 10 guidelines

## Documentation

### Code Comments

- Explain the WHY, not the WHAT
- Keep comments up-to-date
- Remove commented-out code

### API Documentation

- Document all endpoints
- Include request/response examples
- Document error codes
- Keep OpenAPI/Swagger specs updated

### README

- Clear setup instructions
- Architecture overview
- Common development tasks
- Troubleshooting guide

## Release Process

1. **Version Bump**: Update version in package.json
2. **Changelog**: Document changes in CHANGELOG.md
3. **Tag Release**: Create git tag
4. **Build**: Run production build
5. **Deploy**: Follow deployment guide
6. **Test**: Smoke test on production

## Code Review

### What we look for

- ✅ Code quality and style
- ✅ Test coverage
- ✅ Performance implications
- ✅ Security concerns
- ✅ Documentation completeness
- ✅ Backward compatibility

### Review Checklist

- [ ] Tests pass
- [ ] Code follows style guide
- [ ] No performance issues
- [ ] No security issues
- [ ] Documentation updated
- [ ] No breaking changes (or clearly noted)

## Questions?

- Open an issue for bugs
- Start a discussion for questions
- Check existing documentation first
- Ask in project discussions

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT).

---

**Thank you for contributing!**

# Kiro Agent Hooks

This directory contains agent hooks that automate various development workflow tasks.

## Available Hooks

### 1. Task Completion Auto-Commit Hook

**Purpose**: Automatically commit and push code changes when tasks are marked as completed.

**Files**:
- `auto-commit.cjs` - Main JavaScript implementation
- `auto-commit-on-task-completion.json` - JSON configuration for Kiro

**Usage**:

#### Manual Execution
```bash
# Using npm script
npm run commit-task

# Using Node.js directly
node .kiro/hooks/auto-commit.cjs
```

#### Automatic Execution
The hook can be configured to trigger automatically when:
- A task status is changed to "completed" in tasks.md
- Code changes are detected
- All tests are passing

**Features**:
- ✅ Runs tests before committing to ensure code quality
- ✅ Generates descriptive commit messages with task information
- ✅ Stages relevant files automatically
- ✅ Pushes changes to remote repository
- ✅ Provides clear feedback and error handling
- ✅ Supports both manual and automatic execution

**Workflow**:
1. Detects completed tasks in `.kiro/specs/**/tasks.md`
2. Runs `npm test -- --run` to ensure code quality
3. Stages all relevant changes
4. Creates commit with format: `Task #X.Y: Task Description`
5. Pushes changes to the remote repository

**Configuration**:
The hook can be customized by modifying the configuration file:
- `auto-commit-on-task-completion.json` - Main JSON configuration

**Error Handling**:
- Aborts if tests fail
- Warns if push fails but commit succeeds
- Provides clear error messages
- Logs all operations for debugging

## Installation

The hooks are already set up in this project. To use them:

1. Ensure you have Node.js installed
2. Run `npm install` to install dependencies
3. Make shell scripts executable: `chmod +x .kiro/hooks/*.sh`

## Creating New Hooks

To create a new hook:

1. Create your hook file in this directory
2. Add documentation to this README
3. Add any necessary npm scripts to package.json
4. Test your hook thoroughly
5. Update the main project documentation

## Best Practices

- Always run tests before committing
- Use descriptive commit messages
- Handle errors gracefully
- Provide clear user feedback
- Document your hooks thoroughly
- Test hooks in different scenarios
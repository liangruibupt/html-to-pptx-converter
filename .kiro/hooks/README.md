# Agent Hooks for HTML to PPTX Converter

This directory contains agent hooks that automate various tasks in the development workflow.

## Available Hooks

### Task Completion Commit
- **Trigger**: When a task is marked as completed
- **Action**: Automatically commits code changes with a descriptive message
- **Format**: `Task #X: Brief description of what was done`

### Task Start Check
- **Trigger**: When a task is marked as in progress
- **Action**: Checks for uncommitted changes before starting a new task
- **Purpose**: Ensures clean state before beginning new work

### Manual Code Commit
- **Trigger**: Manual (user-initiated)
- **Action**: Helps commit code changes with proper formatting
- **Usage**: Use this when you want to make intermediate commits during task implementation

## How to Use

1. **Automatic Hooks**: These will trigger automatically when tasks are marked as completed or in progress.

2. **Manual Hook**: To use the manual commit hook:
   - Open the Command Palette (Cmd+Shift+P / Ctrl+Shift+P)
   - Search for "Kiro: Run Agent Hook"
   - Select "Manual Code Commit"
   - Follow the agent's instructions

## Commit Message Format

All commits should follow this format:
```
Task #X: Brief description of what was done
```

Where:
- `X` is the task number (e.g., 2.3 for "Implement HTML content input component")
- The description should be concise but descriptive

## Example

```
Task #2.3: Implement HTML content input component with validation
```
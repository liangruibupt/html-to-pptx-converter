# Development Workflow

## Git Workflow

### Commit Rules
- Each completed task must be committed to GitHub
- Commit messages should be descriptive and reference the task number
- Format: `Task #X: Brief description of what was done`
- Example: `Task #2: Implement HTML file upload component`

### Commit Frequency
- Commit after completing each task from the tasks.md file
- For larger tasks, consider making intermediate commits at logical points
- Always push changes to GitHub after committing

### Branch Strategy
- Main branch should always be in a working state
- Consider feature branches for complex tasks
- Merge back to main when the feature is complete and tested

## Code Quality Standards
- All code must pass linting before commit
- Unit tests should be written for new functionality
- TypeScript types must be properly defined
- Follow the project's code style and organization

## Task Completion Checklist
1. Implement the task according to requirements
2. Write/update tests as needed
3. Ensure code passes linting and type checking
4. Run tests to verify functionality
5. Commit changes with a descriptive message
6. Push changes to GitHub
7. Mark the task as completed in tasks.md
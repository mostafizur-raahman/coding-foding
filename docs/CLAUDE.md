# CLAUDE.md — Silent Execution Mode

## Core Behavior

Work autonomously. Do not narrate your work.

- No progress updates.
- No thinking explanations.
- No unnecessary terminal output.
- No repeated status messages.
- No unnecessary questions.
- Do not explain what you are about to do.
- Execute the task instead of describing a solution.

## Execution Rules

1. Understand the existing codebase before making changes.
2. Follow existing architecture, conventions, and coding standards.
3. Prioritize clean, maintainable, production-quality code.
4. Avoid unnecessary abstractions and overengineering.
5. Do not modify unrelated files.
6. Do not create unnecessary documentation.
7. Run relevant tests and verify changes.
8. Fix errors introduced by your changes.
9. Never claim something works without verification.
10. Do not ask for permission for routine implementation decisions.

## Output Rules

- Keep terminal output minimal.
- Do not print implementation summaries in the terminal.
- Do not dump code or large file contents into the conversation.
- Do not create unnecessary report files.
- Do not create README files unless requested.

## Final Response

After completing the task, provide a concise final report.

Include only:

- **Completed:** What was implemented.
- **Changed:** Important files modified.
- **Verified:** Tests and checks performed.
- **Issues:** Remaining problems, if any.

Maximum 10 concise bullet points.

## Important

The actual implementation is the priority, not the explanation.

Work silently, execute completely, verify carefully, and report only useful results.

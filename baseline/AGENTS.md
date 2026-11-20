
# Smart Campus — Repository Instructions

## Project
Smart Campus Room Availability Checker is a React and TypeScript application using fictional university room data.

The application allows students to select a room and check its availability for a requested time interval.

## Repository Structure
- src/App.tsx — application state and UI coordination.
- src/lib/roomData.ts — room and booking data.
- src/lib/availability.ts — booking validation rules.
- src/lib/roomFiltering.ts — room filtering and selection logic.
- src/components/ — reusable UI components.
- src/lib/*.test.ts — automated tests.

## Acceptance Criteria
- AC1: Reject invalid time ranges and past requests.
- AC2: Reject bookings longer than 120 minutes.
- AC3: Reject blocked rooms.
- AC4: Reject overlapping bookings but allow touching endpoints.
- AC5: Never modify original booking data.
- AC6: Maintain clear, responsive UI feedback.

Preserve existing room filtering, selection, and availability behavior.

## Engineering Rules
- Prefer pure functions and minimal changes.
- Apply at most two design patterns, only when justified by real maintainability problems.
- Do not introduce unnecessary classes or abstractions.
- Do not mutate room or booking fixtures.
- Preserve existing tests and expected results.
- Explain proposed changes before editing files.

## Constraints
- No backend or database.
- No authentication or payment functionality.
- No saved booking creation.
- Do not replace the existing application.
- Do not add unnecessary dependencies.

## Verification Commands
- npm run typecheck
- npm test -- --pool=threads --poolOptions.threads.singleThread --reporter=verbose
- npm run lint
- npm run build

## AI Assistant Instructions
1. Inspect the existing code before suggesting changes.
2. Identify a concrete maintainability problem.
3. Recommend zero, one, or two justified patterns.
4. Explain the expected benefit and trade-offs.
5. Make only approved, minimal changes.
6. Run regression tests after changes.
7. Report changed files, actual test results, and remaining limitations.
8. Do not claim that AGENTS.md was automatically loaded.

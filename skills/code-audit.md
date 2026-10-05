---
name: code-audit
description: Audit and simplify any code written by AI (apps, components, scripts, APIs, automations, configs) in any language. Use after building or changing code, or when the user says "audit", "review", "optimise", "simplify", "clean up" or "verify". Finds unnecessary code, bugs, security and performance issues, fixes them without changing behaviour, verifies with the project's own checks, and reports in a few lines.
---

# Code Audit

Goal: the smallest, safest, clearest code that does exactly the same job. If logic fits in 5 lines, it must not take 15.

## Modes
- **Fix (default):** audit, apply fixes, verify, report.
- **Report only:** if the user says "review only" or "don't change", list findings and change nothing.

## Scope
Audit only the files just written or named by the user. Never touch other files. Read only what is needed.

## Process
1. **Detect** the language, framework and the project's own checks (`package.json` scripts, `pyproject.toml`, `Makefile`, CI config). Match existing conventions.
2. **Baseline:** note lines, function count, max nesting depth and dependency count for the audited files.
3. **Audit** against every parameter below.
4. **Classify** each finding: **Must-fix** (bug, security, data loss), **Should-fix** (waste, complexity, duplication), **Skip** (risky, subjective, or changes behaviour).
5. **Apply** Must-fix and Should-fix. Keep behaviour and public API identical.
6. **Verify** by running the project's type check, lint and tests (only those that exist, once). If none exist, say so. Fix anything you broke.
7. **Report** using the format at the bottom.

## Audit parameters

### 1. Correctness (gate, always first)
- Behaviour after the audit must equal behaviour before. Public API, inputs and outputs unchanged.
- Fix clear bugs: off-by-one, wrong conditions, unhandled promises, race conditions, mutated shared state.

### 2. Necessity and size
- Delete dead code, unused imports, variables, parameters, props, types, files and commented-out code.
- No speculative features, config options or abstractions "for later".
- No wrapper, helper or class that is used once and adds nothing.
- Comments only for a non-obvious *why*, never to restate the code.

### 3. Simplicity
- Replace long `if/else` chains with a lookup table, early returns or guard clauses.
- Reduce nesting depth (aim for 3 or fewer levels).
- Split functions doing several jobs; merge ones that only forward a call.
- Prefer declarative built-ins (`map`, `filter`, comprehensions) over manual loops with temporary variables.

### 4. Reuse over reinvention
- Use the language's standard library, the framework's features and dependencies already installed before writing custom code.
- Replace hand-written utilities (deep clone, debounce, date maths, parsing, retries) with a built-in or an existing dependency.

### 5. Duplication
- Merge repeated blocks, repeated literals and copy-pasted logic into one place, only when it makes the code shorter and clearer.

### 6. State and side effects
- Derive values instead of storing them; avoid duplicated or out-of-sync state.
- Keep side effects (I/O, timers, listeners, network) isolated, cleaned up and avoidable when a pure function works.
- Avoid globals and hidden mutable state.

### 7. Performance
- Remove unnecessary work: repeated computation, N+1 queries or requests, I/O inside loops, re-renders, unneeded copies of large data.
- Check algorithmic complexity on collections (nested loops over the same data, repeated `includes` or `find` that should be a Set or Map).
- Do not micro-optimise or add caching without a clear reason.

### 8. Security
- No hardcoded secrets, keys or tokens; use environment variables.
- Validate and sanitise external input; avoid injection (SQL, shell, HTML, path traversal).
- No unsafe `eval`, `dangerouslySetInnerHTML`, `shell=True` or disabled TLS or CORS checks without a stated reason.
- Check auth and permission paths are not bypassed.
- Report anything serious, even if outside the simplify goal.

### 9. Robustness
- Handle null or empty input, failed requests, timeouts and bad data at the boundaries (user input, network, files), not everywhere.
- No empty `catch` blocks or swallowed errors; errors should be handled or surfaced with a useful message.
- No defensive code for situations that cannot happen.

### 10. Types and naming
- Remove `any`/untyped escape hatches where inference or a simple type works.
- Names say what a thing is or does; no misleading or one-letter names outside tiny scopes.

### 11. Dependencies
- Flag unused packages and packages that replace only a few lines of code.
- Do not add a new dependency during an audit.

### 12. Consistency
- Follow the project's existing style, folder structure and patterns. Do not introduce a new pattern to be "better".

### 13. Readability (limits the others)
- Fewer lines is a means, not the goal. Do not write clever one-liners or dense code that is harder to read than the original.

### 14. UI projects only (apply when the code renders an interface)
- **CSS before JS** for hover, focus, pressed, disabled and dark mode.
- **Accessibility kept intact:** semantic tags, keyboard support, focus styles, ARIA, alt text, colour contrast.
- **Reduced motion** respected; animate `transform` and `opacity`.
- Avoid unnecessary re-renders, effects and wrapper elements.
- Reusable components keep their props API, defaults and `className` override.

## Never do
- Remove or weaken accessibility, security checks, input validation or error handling to save lines.
- Change behaviour, public API, data formats or file names without being asked.
- Refactor unrelated code, upgrade versions, or reformat whole files.
- Report success without running the project's checks (or stating that none exist).
- Produce long explanations. The report stays short.

## Report format (max 5 lines)
```
<file>: <lines before> -> <after> | functions <a> -> <b> | max nesting <a> -> <b> | deps removed: <n>
Fixed: <1-3 biggest changes>
Security/bugs: <found and fixed, or "none">
Verified: <commands run and result, or "no checks configured">
Skipped: <anything risky left alone, or "none">
```

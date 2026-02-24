# Snap Framework Component Gap Analysis

## Executive Summary

The researcher correctly identified that **spinner** (the "loader" component) is MISSING from Snap's PromptToolkit interface. While the component adapter exists in the codebase, it is NOT exposed through the standard `context.prompts` API that consumers use.

## Available vs Missing Components

### ✅ Available in PromptToolkit (via context.prompts)
- **text** - Single-line text input
- **confirm** - Yes/no confirmation
- **select** - Single selection from list
- **multiselect** - Multiple selections from list
- **group** - Run multiple prompts in sequence
- **custom** - Custom prompt runner for advanced use cases

### ❌ Missing from PromptToolkit (from @clack/prompts)
1. **spinner** - Loading indicator (CRITICAL for async operations)
2. **password** - Secure password input
3. **log** - Structured logging (info/warn/error/success)
4. **intro** - Consistent welcome messages
5. **outro** - Consistent closing messages

## Component Status Details

### Spinner Component
- **Status**: Adapter exists but NOT in PromptToolkit
- **Location**: `src/tui/component-adapters/spinner.ts`
- **API**: `createSpinner({ message })` returns `{ start, stop, message }`
- **Tested**: ✅ 6 passing tests
- **Available via**: Direct import only
- **NOT available via**: `context.prompts.spinner`

### Password Component
- **Status**: Adapter exists but NOT in PromptToolkit
- **Location**: `src/tui/component-adapters/password.ts`
- **API**: `runPasswordPrompt({ message, required, validate, mask })`
- **Tested**: ⚠️ Tests verify existence but not full functionality
- **Available via**: Direct import only
- **NOT available via**: `context.prompts.password`

### Log/Intro/Outro Components
- **Status**: NOT implemented in Snap
- **Available in**: @clack/prompts
- **Recommendation**: Implement these for complete feature parity

## Test Coverage

### Current Test Status: 57 tests passing
- Unit tests: state-machine, action-result
- DX helpers: SnapArgs (24 tests)
- Documentation examples: 5 tests
- TUI components: spinner (6 tests)
- Component gap analysis: 15 tests
- Integration tests: tui-flow, runtime-dispatch
- E2E tests: CLI smoke test

### Component Gap Tests (NEW)
✅ 15 tests specifically documenting what's missing:
- Tests confirm spinner/password exist but aren't in PromptToolkit
- Tests confirm log/intro/outro don't exist at all
- Tests document all available components

## Recommendations

### Immediate Actions
1. **Add spinner to PromptToolkit** - Most critical missing component
2. **Add password to PromptToolkit** - Important for secure workflows
3. **Document current workaround** - Show consumers how to use spinner directly

### Future Enhancements
1. **Implement log component** - Structured logging for better UX
2. **Implement intro/outro components** - Consistent app messaging
3. **Feature parity with @clack/prompts** - Complete component coverage

### Workaround for Consumers
Until spinner is added to PromptToolkit, use direct import:

```typescript
import { createSpinner } from '@levu/snap/tui/component-adapters/spinner';

const spinner = createSpinner({ message: 'Loading...' });
spinner.start();
// ... do async work ...
spinner.stop('Complete!');
```

## Conclusion

The "loader component gap" is CONFIRMED:
- ✅ Spinner adapter exists and is tested
- ❌ Spinner is NOT in PromptToolkit interface
- ❌ Consumers cannot use `context.prompts.spinner`
- ⚠️ Requires direct import as workaround

**Priority**: HIGH - Add spinner to PromptToolkit for better developer experience

All existing functionality works correctly. This is a feature gap, not a bug.

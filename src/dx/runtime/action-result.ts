import type { ActionResultEnvelope } from '../../core/contracts/action-contract.js';
import { ExitCode } from '../../core/errors/framework-errors.js';
import type { RuntimeContext } from '../../runtime/runtime-context.js';
import { isPromptCancelledError } from '../../tui/component-adapters/cancel.js';

export const toSuccessResult = <T>(
  context: RuntimeContext,
  data: T,
  exitCode = ExitCode.SUCCESS
): ActionResultEnvelope<T> => ({
  ok: true,
  mode: context.mode,
  exitCode,
  data
});

export const toErrorResult = <T = unknown>(
  context: RuntimeContext,
  error: unknown,
  fallbackMessage: string,
  exitCode = ExitCode.VALIDATION_ERROR
): ActionResultEnvelope<T> => {
  if (isPromptCancelledError(error)) {
    return {
      ok: false,
      mode: context.mode,
      exitCode: ExitCode.INTERRUPTED,
      errorMessage: undefined
    };
  }

  return {
    ok: false,
    mode: context.mode,
    exitCode,
    errorMessage: error instanceof Error ? error.message : fallbackMessage
  };
};

export interface RunActionSafelyInput<T> {
  context: RuntimeContext;
  execute: () => Promise<T>;
  fallbackErrorMessage: string;
  onSuccess?: (result: T) => T;
}

export const runActionSafely = async <T>(input: RunActionSafelyInput<T>): Promise<ActionResultEnvelope<T>> => {
  try {
    const result = await input.execute();
    input.context.flow.exit();
    const finalResult = input.onSuccess ? input.onSuccess(result) : result;
    return toSuccessResult(input.context, finalResult);
  } catch (error) {
    return toErrorResult<T>(input.context, error, input.fallbackErrorMessage);
  }
};

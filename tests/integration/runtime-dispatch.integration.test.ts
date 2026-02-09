import { describe, expect, it } from 'vitest';
import { createRegistry } from '../../src/index.js';
import sampleContentModule from '../../src/modules/sample-content/module.js';
import sampleSystemModule from '../../src/modules/sample-system/module.js';
import { dispatchAction } from '../../src/runtime/dispatch.js';

describe('integration dispatch runtime', () => {
  it('dispatches commandline action with required args', async () => {
    const registry = createRegistry([sampleContentModule, sampleSystemModule]);

    const result = await dispatchAction({
      registry,
      moduleId: 'content',
      actionId: 'slugify',
      args: { text: 'Hello Integration Test' },
      isTTY: true
    });

    expect(result.ok).toBe(true);
    expect(result.mode).toBe('commandline');
    expect(result.data).toBe('hello-integration-test');
  });
});

import { describe, expect, it } from 'vitest';
import { StateMachine } from '../../src/runtime/state-machine.js';

describe('state-machine', () => {
  it('supports next/back/jump/exit transitions', () => {
    const machine = new StateMachine('wf', [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
      { id: 'c', label: 'C' }
    ]);

    expect(machine.currentNode().id).toBe('a');
    machine.transition({ type: 'next' });
    expect(machine.currentNode().id).toBe('b');
    machine.transition({ type: 'jump', targetNodeId: 'c' });
    expect(machine.currentNode().id).toBe('c');
    machine.transition({ type: 'back' });
    expect(machine.currentNode().id).toBe('b');
    machine.transition({ type: 'exit' });
    expect(machine.snapshot().exited).toBe(true);
  });
});

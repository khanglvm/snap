import { describe, expect, it } from 'vitest';
import { createSpinner } from '../src/tui/component-adapters/spinner.js';

describe('Spinner component', () => {
  it('creates a spinner instance', () => {
    const spinner = createSpinner({ message: 'Loading...' });
    expect(spinner).toBeDefined();
    expect(typeof spinner.start).toBe('function');
    expect(typeof spinner.stop).toBe('function');
    expect(typeof spinner.message).toBe('function');
  });

  it('creates spinner without options', () => {
    const spinner = createSpinner();
    expect(spinner).toBeDefined();
  });

  it('allows updating spinner message', () => {
    const spinner = createSpinner({ message: 'Initial message' });
    // This test verifies the API exists - actual functionality
    // depends on terminal interactivity
    expect(() => spinner.message('Updated message')).not.toThrow();
  });

  it('allows starting and stopping spinner', () => {
    const spinner = createSpinner({ message: 'Loading...' });
    // This test verifies the API exists - actual functionality
    // depends on terminal interactivity
    expect(() => spinner.start()).not.toThrow();
    expect(() => spinner.stop('Done!')).not.toThrow();
  });

  it('allows starting with custom message', () => {
    const spinner = createSpinner();
    expect(() => spinner.start('Custom start message')).not.toThrow();
  });

  it('allows stopping without message', () => {
    const spinner = createSpinner();
    expect(() => spinner.stop()).not.toThrow();
  });
});

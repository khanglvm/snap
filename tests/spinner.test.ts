import { describe, expect, it } from 'vitest';
import { createSpinner } from '../src/tui/component-adapters/spinner.js';

describe('Spinner component', () => {
  it('creates a spinner instance', () => {
    const spinner = createSpinner({ message: 'Loading...' });
    expect(spinner).toBeDefined();
    expect(typeof spinner.start).toBe('function');
    expect(typeof spinner.stop).toBe('function');
    expect(typeof spinner.message).toBe('function');
    expect(typeof spinner.cancel).toBe('function');
    expect(typeof spinner.error).toBe('function');
    expect(typeof spinner.clear).toBe('function');
  });

  it('creates spinner without options', () => {
    const spinner = createSpinner();
    expect(spinner).toBeDefined();
  });

  it('has isCancelled property', () => {
    const spinner = createSpinner();
    expect(typeof spinner.isCancelled).toBe('boolean');
    expect(spinner.isCancelled).toBe(false);
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

  it('allows cancelling spinner', () => {
    const spinner = createSpinner();
    expect(() => spinner.cancel('Operation cancelled')).not.toThrow();
    expect(() => spinner.cancel()).not.toThrow();
  });

  it('allows showing error on spinner', () => {
    const spinner = createSpinner();
    expect(() => spinner.error('Something went wrong')).not.toThrow();
    expect(() => spinner.error()).not.toThrow();
  });

  it('allows clearing spinner output', () => {
    const spinner = createSpinner();
    expect(() => spinner.clear()).not.toThrow();
  });

  it('supports custom spinner options', () => {
    const spinner = createSpinner({
      message: 'Loading...',
      indicator: 'dots',
      cancelMessage: 'Operation cancelled by user',
      errorMessage: 'An error occurred',
      frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴'],
      delay: 80,
    });
    expect(spinner).toBeDefined();
  });

  it('supports custom frame styling', () => {
    const spinner = createSpinner({
      message: 'Loading...',
      styleFrame: (frame) => `[${frame}]`,
    });
    expect(spinner).toBeDefined();
  });
});

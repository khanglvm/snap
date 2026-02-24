import type {
  TuiComponentContract,
  TuiCustomComponentContract,
  TuiOptionContract,
  TuiStepContract
} from '../../core/contracts/tui-contract.js';

export const defineTuiOptions = <TOption extends TuiOptionContract>(options: readonly TOption[]): TOption[] => {
  if (options.length === 0) {
    throw new Error('TUI select options cannot be empty.');
  }
  return [...options];
};

export const defineTuiComponent = <TComponent extends TuiComponentContract>(component: TComponent): TComponent => {
  if (!component.componentId.trim()) {
    throw new Error('TUI componentId cannot be empty.');
  }
  if (!component.label.trim()) {
    throw new Error(`TUI component label cannot be empty: ${component.componentId}`);
  }
  if (component.type === 'select' || component.type === 'multiselect') {
    if (!component.options || component.options.length === 0) {
      throw new Error(`TUI component options required for ${component.componentId}.`);
    }
  }
  if (component.type === 'custom' && !component.renderer.trim()) {
    throw new Error(`Custom TUI component renderer is required: ${component.componentId}.`);
  }

  return component;
};

export const defineCustomTuiComponent = <
  TConfig extends Record<string, unknown> = Record<string, unknown>
>(component: Omit<TuiCustomComponentContract<TConfig>, 'type'>): TuiCustomComponentContract<TConfig> =>
  defineTuiComponent({
    ...component,
    type: 'custom'
  });

export const defineTuiStep = <TStep extends TuiStepContract>(step: TStep): TStep => {
  if (!step.stepId.trim()) {
    throw new Error('TUI stepId cannot be empty.');
  }
  if (!step.title.trim()) {
    throw new Error(`TUI step title cannot be empty: ${step.stepId}`);
  }
  if (step.components) {
    step.components.forEach((component) => defineTuiComponent(component));
  }
  return step;
};

export const isCustomTuiComponent = (component: TuiComponentContract): component is TuiCustomComponentContract =>
  component.type === 'custom';

export type TuiComponentType = 'text' | 'confirm' | 'select' | 'multiselect' | 'group' | 'custom';

export interface TuiOptionContract {
  value: string;
  label: string;
  description?: string;
}

export interface TuiStandardComponentContract {
  componentId: string;
  type: Exclude<TuiComponentType, 'custom'>;
  label: string;
  arg?: string;
  required?: boolean;
  placeholder?: string;
  options?: TuiOptionContract[];
  defaultValue?: string | boolean | string[];
}

export interface TuiCustomComponentContract<
  TConfig extends Record<string, unknown> = Record<string, unknown>
> {
  componentId: string;
  type: 'custom';
  label: string;
  arg?: string;
  required?: boolean;
  renderer: string;
  config?: TConfig;
  defaultValue?: string | boolean | string[];
}

export type TuiComponentContract = TuiStandardComponentContract | TuiCustomComponentContract;

export type TuiTransitionType = 'next' | 'back' | 'jump' | 'exit';

export interface TuiStepTransitionContract {
  on: TuiTransitionType;
  targetStepId?: string;
}

export interface TuiStepContract {
  stepId: string;
  title: string;
  description?: string;
  components?: TuiComponentContract[];
  transitions?: TuiStepTransitionContract[];
}

export interface TuiFlowContract {
  entryStepId?: string;
  steps: TuiStepContract[];
}

export interface TuiContract {
  steps?: string[];
  flow?: TuiFlowContract;
}

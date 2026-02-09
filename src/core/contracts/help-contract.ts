export interface HelpArgumentSpec {
  name: string;
  required: boolean;
  description: string;
  example?: string;
}

export interface HelpUseCaseSpec {
  name: string;
  description: string;
  command: string;
}

export interface HelpContract {
  summary: string;
  args: HelpArgumentSpec[];
  examples: string[];
  useCases: HelpUseCaseSpec[];
  keybindings: string[];
}

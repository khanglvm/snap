export interface HelpSection {
  title: 'MODULE' | 'ACTIONS' | 'SUMMARY' | 'ARGS' | 'EXAMPLES' | 'USE-CASES' | 'KEYBINDINGS';
  lines: string[];
}

export interface ActionHelpView {
  moduleId: string;
  actionId?: string;
  sections: HelpSection[];
}

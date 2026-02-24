import type { ActionHelpView, HelpSection } from './help-model.js';

const renderLine = (line: string): string =>
  line
    .split('\n')
    .map((part, index) => (index === 0 ? `- ${part}` : `  ${part}`))
    .join('\n');

const renderSection = (section: HelpSection): string => {
  const header = `## ${section.title}`;
  const lines = section.lines.length > 0 ? section.lines.map(renderLine).join('\n') : '- (none)';
  return `${header}\n${lines}`;
};

export const renderHelp = (views: ActionHelpView[]): string =>
  views
    .map((view) => {
      const head = [
        '# HELP',
        `MODULE: ${view.moduleId}`,
        `ACTION: ${view.actionId ?? '*'}`
      ].join('\n');
      const body = view.sections.map(renderSection).join('\n\n');
      return `${head}\n\n${body}`;
    })
    .join('\n\n---\n\n');

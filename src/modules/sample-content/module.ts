import type { ModuleContract } from '../../core/contracts/module-contract.js';
import { ExitCode } from '../../core/errors/framework-errors.js';

const toSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const sampleContentModule: ModuleContract = {
  moduleId: 'content',
  description: 'Content-processing sample actions for framework adoption.',
  actions: [
    {
      actionId: 'slugify',
      description: 'Convert text into URL-safe slug.',
      tui: { steps: ['collect-text', 'preview-slug'] },
      commandline: { requiredArgs: ['text'] },
      help: {
        summary: 'Convert input text into deterministic lowercase slug.',
        args: [{ name: 'text', required: true, description: 'Source text to transform.', example: '--text="Hello World"' }],
        examples: ['hub content slugify --text="Hello World"'],
        useCases: [{ name: 'blog url', description: 'Generate post slug', command: 'hub content slugify --text="my post"' }],
        keybindings: ['Enter confirm', 'Esc cancel']
      },
      run: async (context) => {
        const text = typeof context.args.text === 'string' && context.args.text.length > 0
          ? context.args.text
          : 'interactive text';
        return {
          ok: true,
          mode: context.mode,
          exitCode: ExitCode.SUCCESS,
          data: toSlug(text)
        };
      }
    },
    {
      actionId: 'word-count',
      description: 'Count words from input text.',
      tui: { steps: ['collect-text', 'show-count'] },
      commandline: { requiredArgs: ['text'] },
      help: {
        summary: 'Count whitespace-separated words in deterministic way.',
        args: [{ name: 'text', required: true, description: 'Input text for counting.', example: '--text="one two"' }],
        examples: ['hub content word-count --text="one two three"'],
        useCases: [{ name: 'draft checks', description: 'Validate article length quickly', command: 'hub content word-count --text="draft body"' }],
        keybindings: ['Enter confirm', 'Esc cancel']
      },
      run: async (context) => {
        const text = typeof context.args.text === 'string' ? context.args.text.trim() : '';
        const words = text.length === 0 ? 0 : text.split(/\s+/).length;
        return {
          ok: true,
          mode: context.mode,
          exitCode: ExitCode.SUCCESS,
          data: String(words)
        };
      }
    }
  ]
};

export default sampleContentModule;

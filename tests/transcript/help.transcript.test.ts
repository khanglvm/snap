import { describe, expect, it } from 'vitest';
import { renderHelp } from '../../src/help/help-renderer.js';
import { resolveHelpHierarchy } from '../../src/help/hierarchy-resolver.js';
import sampleContentModule from '../../src/modules/sample-content/module.js';

describe('transcript help output', () => {
  it('renders deterministic action help transcript', () => {
    const views = resolveHelpHierarchy([sampleContentModule], 'content', 'slugify');
    const output = renderHelp(views);

    expect(output).toContain('# HELP');
    expect(output).toContain('MODULE: content');
    expect(output).toContain('ACTION: slugify');
    expect(output).toContain('## SUMMARY');
    expect(output).toContain('## ARGS');
    expect(output).toContain('## EXAMPLES');
    expect(output).toContain('## USE-CASES');
    expect(output).toContain('## KEYBINDINGS');
  });
});

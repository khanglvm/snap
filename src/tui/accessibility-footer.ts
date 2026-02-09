export interface AccessibilityFooterInput {
  moduleId: string;
  actionId: string;
  nodeId: string;
  keybindings: string[];
}

export const renderAccessibilityFooter = (input: AccessibilityFooterInput): string => {
  const keys = input.keybindings.join(' | ');
  return `[ctx module=${input.moduleId} action=${input.actionId} node=${input.nodeId}] [keys ${keys}]`;
};

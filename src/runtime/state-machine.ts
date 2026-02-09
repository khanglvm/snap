export type StateTransitionType = 'next' | 'back' | 'jump' | 'exit';

export interface WorkflowNode {
  id: string;
  label: string;
}

export interface WorkflowCheckpoint {
  workflowId: string;
  nodeId: string;
  cursor: number;
  timestamp: string;
}

export interface StateTransition {
  type: StateTransitionType;
  targetNodeId?: string;
}

export interface StateMachineSnapshot {
  workflowId: string;
  nodes: WorkflowNode[];
  cursor: number;
  exited: boolean;
}

export class StateMachine {
  private cursor = 0;
  private exited = false;

  constructor(
    private readonly workflowId: string,
    private readonly nodes: WorkflowNode[],
    initialNodeId?: string
  ) {
    if (initialNodeId) {
      const index = nodes.findIndex((node) => node.id === initialNodeId);
      if (index >= 0) this.cursor = index;
    }
  }

  transition(transition: StateTransition): StateMachineSnapshot {
    if (this.exited) return this.snapshot();

    if (transition.type === 'next') this.cursor = Math.min(this.cursor + 1, this.nodes.length - 1);
    if (transition.type === 'back') this.cursor = Math.max(this.cursor - 1, 0);
    if (transition.type === 'jump' && transition.targetNodeId) {
      const index = this.nodes.findIndex((node) => node.id === transition.targetNodeId);
      if (index >= 0) this.cursor = index;
    }
    if (transition.type === 'exit') this.exited = true;

    return this.snapshot();
  }

  currentNode(): WorkflowNode {
    return this.nodes[this.cursor];
  }

  checkpoint(): WorkflowCheckpoint {
    return {
      workflowId: this.workflowId,
      nodeId: this.currentNode().id,
      cursor: this.cursor,
      timestamp: new Date().toISOString()
    };
  }

  snapshot(): StateMachineSnapshot {
    return {
      workflowId: this.workflowId,
      nodes: this.nodes,
      cursor: this.cursor,
      exited: this.exited
    };
  }
}

# Artifact Examples

This document provides canonical example payloads for each fixed core artifact kind in `DeepScientist Core` v1.

These examples are intentionally concrete.
They should help implementation stay:

- consistent
- readable
- easy to test
- easy to render in UI and connectors

They are examples, not a promise that every optional field is always required.

## 1. Shared assumptions

All examples assume:

- `quest_id = q-20260308-001`
- `quest_root = /home/air/DeepScientist/quests/q-20260308-001`
- artifact files live under:
  - `/home/air/DeepScientist/quests/q-20260308-001/artifacts/`

All artifact records should include the common envelope:

- `kind`
- `schema_version`
- `artifact_id`
- `quest_id`
- `created_at`
- `updated_at`
- `source`
- `status`

## 2. `baseline`

```json
{
  "kind": "baseline",
  "schema_version": 1,
  "artifact_id": "baseline-001",
  "quest_id": "q-20260308-001",
  "created_at": "2026-03-08T18:00:00Z",
  "updated_at": "2026-03-08T18:00:00Z",
  "source": {
    "kind": "agent",
    "role": "reproducer",
    "run_id": "run-baseline-001"
  },
  "status": "accepted",
  "baseline_id": "baseline-001",
  "baseline_variant_id": "resnet50-main",
  "baseline_kind": "reproduced",
  "baseline_root_id": "baseline-codebase-001",
  "baseline_root_path": "/home/air/DeepScientist/quests/q-20260308-001/baselines/local/baseline-001",
  "baseline_commit": "abc1234",
  "baseline_metrics_path": "/home/air/DeepScientist/quests/q-20260308-001/baselines/local/baseline-001/baselines/resnet50/metrics.json",
  "baseline_results_index_path": "/home/air/DeepScientist/quests/q-20260308-001/baselines/local/baseline-001/baselines/resnet50/exports/_index.jsonl",
  "task": "image-classification",
  "dataset": "CIFAR-10",
  "primary_metric": {
    "name": "accuracy",
    "value": 0.943,
    "direction": "higher"
  },
  "metric_objectives": [
    {
      "key": "accuracy",
      "direction": "higher",
      "importance": 1.0
    }
  ],
  "metrics_summary": {
    "accuracy": 0.943,
    "loss": 0.190
  },
  "summary": "Stable reproduced baseline accepted for idea comparison.",
  "paths": {
    "paper": "/home/air/DeepScientist/quests/q-20260308-001/literature/baseline-paper.md",
    "status": "/home/air/DeepScientist/quests/q-20260308-001/status.md"
  }
}
```

## 3. `idea`

```json
{
  "kind": "idea",
  "schema_version": 1,
  "artifact_id": "idea-003",
  "quest_id": "q-20260308-001",
  "created_at": "2026-03-08T19:10:00Z",
  "updated_at": "2026-03-08T19:10:00Z",
  "source": {
    "kind": "agent",
    "role": "planner",
    "run_id": "run-idea-003"
  },
  "status": "accepted",
  "idea_id": "idea-003",
  "title": "Add uncertainty-aware augmentation gating",
  "hypothesis": "Conditioning augmentation strength on uncertainty will improve accuracy without destabilizing training.",
  "baseline_refs": [
    {
      "baseline_id": "baseline-001",
      "baseline_variant_id": "resnet50-main"
    }
  ],
  "expected_upside": "Improved robustness with small compute overhead.",
  "risk_level": "medium",
  "branch_intent": "idea/q-20260308-001-idea-003",
  "summary": "Preferred idea after comparing three candidates against the current baseline.",
  "evidence_paths": [
    "/home/air/DeepScientist/quests/q-20260308-001/ideas/idea-003/summary.md",
    "/home/air/DeepScientist/quests/q-20260308-001/memory/ideas/idea-003.md"
  ]
}
```

## 4. `decision`

```json
{
  "kind": "decision",
  "schema_version": 1,
  "artifact_id": "decision-011",
  "quest_id": "q-20260308-001",
  "created_at": "2026-03-08T20:00:00Z",
  "updated_at": "2026-03-08T20:00:00Z",
  "source": {
    "kind": "agent",
    "role": "pi",
    "run_id": "run-pi-011"
  },
  "status": "pending_user",
  "interaction_phase": "request",
  "decision_id": "decision-011",
  "verdict": "good",
  "action": "launch_experiment",
  "reason": "The current idea shows a plausible gain path and the baseline is stable enough to justify a main run.",
  "next_direction": "Start one main experiment on the current idea branch.",
  "requires_user_approval": true,
  "related_idea_id": "idea-003",
  "related_run_ids": [],
  "suggested_branch_name": "run/run-007",
  "evidence_paths": [
    "/home/air/DeepScientist/quests/q-20260308-001/ideas/idea-003/summary.md",
    "/home/air/DeepScientist/quests/q-20260308-001/status.md"
  ],
  "metrics_focus": [
    "accuracy",
    "robust_accuracy"
  ]
}
```

## 5. `progress`

```json
{
  "kind": "progress",
  "schema_version": 1,
  "artifact_id": "progress-021",
  "quest_id": "q-20260308-001",
  "created_at": "2026-03-08T21:00:00Z",
  "updated_at": "2026-03-08T21:00:00Z",
  "source": {
    "kind": "agent",
    "role": "experimentalist",
    "run_id": "run-007"
  },
  "status": "active",
  "run_id": "run-007",
  "run_kind": "main",
  "anchor": "experiment",
  "phase": "training",
  "progress": {
    "step": 3,
    "step_total": 10,
    "percent": 30
  },
  "heartbeat_at": "2026-03-08T21:00:00Z",
  "message": "Epoch 3 completed; validation accuracy is trending above baseline.",
  "attachments": [
    "/home/air/DeepScientist/quests/q-20260308-001/experiments/main/run-007/train.log"
  ]
}
```

## 6. `milestone`

```json
{
  "kind": "milestone",
  "schema_version": 1,
  "artifact_id": "milestone-021",
  "quest_id": "q-20260308-001",
  "created_at": "2026-03-08T22:00:00Z",
  "updated_at": "2026-03-08T22:00:00Z",
  "source": {
    "kind": "agent",
    "role": "experimentalist",
    "run_id": "run-007"
  },
  "status": "completed",
  "milestone_id": "milestone-021",
  "anchor": "experiment",
  "title": "Main experiment run-007 completed",
  "result": "success",
  "run_id": "run-007",
  "primary_metric": {
    "key": "accuracy",
    "value": 0.954
  },
  "delta_vs_baseline": {
    "accuracy": 0.011
  },
  "suggested_next_action": "launch_analysis_campaign",
  "reason": "The main result beat the baseline and now needs robustness and ablation checks.",
  "attachments": [
    "/home/air/DeepScientist/quests/q-20260308-001/experiments/main/run-007/summary.md",
    "/home/air/DeepScientist/quests/q-20260308-001/experiments/main/run-007/metrics.json"
  ]
}
```

## 7. `run`

### 7.1 Main run example

```json
{
  "kind": "run",
  "schema_version": 1,
  "artifact_id": "run-007",
  "quest_id": "q-20260308-001",
  "created_at": "2026-03-08T22:00:00Z",
  "updated_at": "2026-03-08T22:00:00Z",
  "source": {
    "kind": "agent",
    "role": "experimentalist",
    "run_id": "run-007"
  },
  "status": "success",
  "run_id": "run-007",
  "run_kind": "main",
  "anchor": "experiment",
  "method_id": "idea-003-method-v1",
  "method_label": "Uncertainty-aware augmentation gating",
  "branch": "run/run-007",
  "worktree_root": "/home/air/DeepScientist/quests/q-20260308-001/.ds/worktrees/run-007",
  "baseline_ref": {
    "baseline_id": "baseline-001",
    "baseline_variant_id": "resnet50-main"
  },
  "metrics": {
    "accuracy": 0.954,
    "loss": 0.171
  },
  "metric_deltas": {
    "accuracy": 0.011,
    "loss": -0.019
  },
  "claim_verdict": "support",
  "go_decision": "go",
  "summary": "Main run improved accuracy over the accepted baseline.",
  "paths": {
    "metrics_json": "/home/air/DeepScientist/quests/q-20260308-001/experiments/main/run-007/metrics.json",
    "summary_md": "/home/air/DeepScientist/quests/q-20260308-001/experiments/main/run-007/summary.md",
    "report_md": "/home/air/DeepScientist/quests/q-20260308-001/experiments/main/run-007/report.md"
  }
}
```

### 7.2 Analysis run example

```json
{
  "kind": "run",
  "schema_version": 1,
  "artifact_id": "analysis-003",
  "quest_id": "q-20260308-001",
  "created_at": "2026-03-09T00:00:00Z",
  "updated_at": "2026-03-09T00:00:00Z",
  "source": {
    "kind": "agent",
    "role": "analyst",
    "run_id": "analysis-003"
  },
  "status": "success",
  "run_id": "analysis-003",
  "run_kind": "analysis",
  "analysis_campaign_id": "campaign-002",
  "anchor": "analysis_campaign",
  "analysis_type": "ablation",
  "parent_run_id": "run-007",
  "branch": "run/analysis-003",
  "worktree_root": "/home/air/DeepScientist/quests/q-20260308-001/.ds/worktrees/analysis-003",
  "metrics": {
    "accuracy": 0.949
  },
  "metric_deltas": {
    "accuracy_vs_main": -0.005
  },
  "summary": "Removing uncertainty gating reduces the gain, supporting the mechanism hypothesis.",
  "paths": {
    "metrics_json": "/home/air/DeepScientist/quests/q-20260308-001/experiments/analysis/campaign-002/analysis-003/metrics.json",
    "summary_md": "/home/air/DeepScientist/quests/q-20260308-001/experiments/analysis/campaign-002/analysis-003/summary.md"
  }
}
```

## 8. `report`

```json
{
  "kind": "report",
  "schema_version": 1,
  "artifact_id": "report-021",
  "quest_id": "q-20260308-001",
  "created_at": "2026-03-09T01:00:00Z",
  "updated_at": "2026-03-09T01:00:00Z",
  "source": {
    "kind": "agent",
    "role": "analyst",
    "run_id": "campaign-002"
  },
  "status": "completed",
  "report_id": "report-021",
  "report_type": "analysis_campaign_summary",
  "analysis_campaign_id": "campaign-002",
  "completed_items": [
    "ablation",
    "robustness",
    "error analysis"
  ],
  "summary": "The gain persists under two robustness checks and is partially explained by the augmentation gating path.",
  "main_numbers": {
    "main_accuracy": 0.954,
    "best_analysis_accuracy": 0.952
  },
  "suggested_next_action": "write",
  "reason": "The evidence is strong enough to draft the paper and only minor follow-up checks remain optional.",
  "paths": {
    "summary_md": "/home/air/DeepScientist/quests/q-20260308-001/experiments/analysis/campaign-002/summary.md",
    "paper_outline": "/home/air/DeepScientist/quests/q-20260308-001/paper/outline.md"
  }
}
```

## 9. `approval`

```json
{
  "kind": "approval",
  "schema_version": 1,
  "artifact_id": "approval-004",
  "quest_id": "q-20260308-001",
  "created_at": "2026-03-09T01:10:00Z",
  "updated_at": "2026-03-09T01:10:00Z",
  "source": {
    "kind": "user",
    "conversation_id": "qq:group:123",
    "user_id": "user-abc"
  },
  "status": "accepted",
  "interaction_phase": "result",
  "approval_id": "approval-004",
  "decision_id": "decision-011",
  "approved": true,
  "reason": "User approved the recommended main experiment after reading the milestone summary.",
  "raw_text": "/approve decision-011",
  "resulting_action": "launch_experiment",
  "attachments": [
    "/home/air/DeepScientist/quests/q-20260308-001/status.md"
  ]
}
```

## 10. `graph`

```json
{
  "kind": "graph",
  "schema_version": 1,
  "artifact_id": "graph-005",
  "quest_id": "q-20260308-001",
  "created_at": "2026-03-09T02:00:00Z",
  "updated_at": "2026-03-09T02:00:00Z",
  "source": {
    "kind": "daemon"
  },
  "status": "generated",
  "graph_id": "graph-005",
  "graph_type": "git_history",
  "branch_summary": [
    "main",
    "quest/q-20260308-001",
    "run/run-007",
    "run/analysis-003"
  ],
  "head_commit": "7fca901",
  "commit_count": 19,
  "paths": {
    "svg": "/home/air/DeepScientist/quests/q-20260308-001/artifacts/graphs/git-graph.svg",
    "png": "/home/air/DeepScientist/quests/q-20260308-001/artifacts/graphs/git-graph.png",
    "json": "/home/air/DeepScientist/quests/q-20260308-001/artifacts/graphs/git-graph.json"
  },
  "summary": "Quest graph exported after analysis campaign completion."
}
```

## 11. Guidance for implementation

When implementing:

- keep top-level artifact kinds fixed
- use `run_kind: analysis` instead of inventing a top-level `analysis` artifact
- treat `decision_request` and `approval_result` as transport-facing interaction labels, not as extra top-level durable kinds
- prefer small additions to these shapes over new parallel artifact families

## 12. References

- `docs/MEMORY_AND_MCP.md`
- `docs/WORKFLOW_AND_SKILLS.md`
- `docs/REGISTRIES.md`
- `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/services/quest/schemas.py`
- `/home/air/DeepScientist_latest/DS_2027/cli/backend/tests/test_mcp_lab_baseline_payload.py`

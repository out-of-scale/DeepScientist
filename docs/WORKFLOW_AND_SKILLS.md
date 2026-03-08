# Workflow and Skills

This document defines the default research graph and the skill strategy for `DeepScientist Core`.

## 1. Why the Old Long Chain Should Change

The longer fixed chain:

1. `intake`
2. `literature`
3. `reproduction`
4. `idea_generation`
5. `go_no_go_decision`
6. `main_experiment`
7. `analysis_experiment`
8. `paper_draft`
9. `review_finalize`

is too rigid for real research.

Problems:

- `intake` and `literature` are often optional or already provided by the user
- `go_no_go_decision` is not a single stage; it is a repeated cross-cutting behavior
- `analysis_experiment` is not one step, but a campaign of many runs
- writing often sends the quest backward to more evidence collection
- baseline reuse should allow skipping full reproduction

## 2. Canonical Flow Anchors

The system should use these anchors instead:

- `scout`
- `baseline`
- `idea`
- `experiment`
- `analysis_campaign`
- `write`
- `finalize`

`decision` is not an anchor.
It is a cross-cutting capability that can happen anywhere.

When a stage-significant result is accepted, the agent should normally follow it with an `artifact` write that returns a compact guidance payload for the next step.

## 3. What Each Anchor Means

## 3.1 `scout`

Purpose:

- optional early framing
- collect key papers
- identify datasets, metrics, and reusable baselines

Can be skipped when:

- the user already specified the target paper / baseline / evaluation contract

Typical outputs:

- `brief.md`
- initial `plan.md`
- quest memory cards for core references

## 3.2 `baseline`

Purpose:

- establish the baseline that the quest will compare against

Modes:

- attach existing published baseline
- import reusable baseline package
- reproduce new baseline
- repair a broken baseline

Typical outputs:

- `baselines/local/<baseline_id>/` or `baselines/imported/<baseline_id>/`
- evaluation contract
- baseline artifact record

This is the anchor that replaces the earlier overly narrow `reproduction` step.

## 3.3 `idea`

Purpose:

- generate, compare, and prune candidate ideas relative to the current baseline

Typical outputs:

- `ideas/idea-001/`
- idea memory cards
- decision artifacts choosing which idea to pursue

## 3.4 `experiment`

Purpose:

- execute one or more main experiments for the selected idea

Typical outputs:

- `experiments/main/<run_id>/`
- run artifacts
- milestone reports

The system may loop through this anchor many times.

For every completed main-experiment run, the quest must record the tested new-method result in a structured artifact, including:

- method identity
- baseline or baseline variant reference
- measured metrics
- metric deltas vs baseline
- verdict and continuation recommendation

## 3.5 `analysis_campaign`

Purpose:

- run the post-main-experiment evidence campaign

This is intentionally plural by design.
One campaign may contain:

- ablations
- error analysis
- robustness checks
- alternative environments
- failure analysis
- partial reproductions of related work

Typical scale:

- `5-10` analysis runs per campaign is normal

Typical outputs:

- `experiments/analysis/campaign-001/analysis-001/`
- `experiments/analysis/campaign-001/analysis-002/`
- aggregated report artifacts

## 3.6 `write`

Purpose:

- write a report, paper draft, or research note using current evidence

Outputs:

- `paper/outline.md`
- `paper/draft.md`
- figures / tables / supplementary notes

Writing may reveal missing evidence and send the quest back to:

- `experiment`
- `analysis_campaign`
- or `scout`

## 3.7 `finalize`

Purpose:

- produce a final claim set
- record limitations
- produce the quest summary
- export Git graph
- optionally push to GitHub

Outputs:

- final `SUMMARY.md`
- final report artifact
- Git graph files

## 4. Cross-Cutting `decision`

`decision` is a repeated capability, not a single stage.

It should handle:

- whether to keep the current idea
- whether to branch a new idea
- whether to launch another experiment
- whether to start or extend an analysis campaign
- whether to attach or publish a baseline
- whether to reset back to scouting
- whether to stop, archive, or finalize

Decisions should be recorded as artifacts and may trigger branch or worktree creation.

Every decision must include a reason.

At minimum, a decision record should capture:

- `decision_id`
- `verdict`
- `action`
- `reason`
- `evidence_paths`
- `next_direction`

Recommended `verdict` values, inspired by the old PI flow:

- `good`
- `bad`
- `neutral`
- `blocked`

Typical meaning:

- `good`
  - current line is promising enough to continue or promote
- `bad`
  - current line should stop or be deprioritized
- `neutral`
  - evidence is mixed; do a cheaper validation or another analysis pass
- `blocked`
  - a required dependency is missing, so user input or environment repair is needed

Recommended `action` values:

- `continue`
  - keep the current line and proceed within the current branch
- `branch`
  - create or extend an idea or run branch, usually with a worktree
- `launch_experiment`
  - start another main experiment
- `launch_analysis_campaign`
  - start or extend an analysis campaign with one or more analysis runs
- `attach_baseline`
  - reuse a published baseline package or variant
- `publish_baseline`
  - publish the current baseline into the global registry
- `reset_to_scout`
  - go back to reframing, literature, or baseline search
- `revise_plan`
  - change `plan.md` without immediately launching a run
- `pause_and_wait`
  - stop and wait for user approval or environment repair
- `archive`
  - preserve the current line without continuing it
- `finalize`
  - conclude the quest or current branch as complete

These values should stay fixed in v1 so that:

- connectors can phrase decision cards consistently
- the UI can render decision badges and quick actions
- artifact validation can remain simple

## 5. Default Graph

The default graph should be understood like this:

```text
start
  -> scout (optional)
  -> baseline
  -> idea
  -> experiment
  -> analysis_campaign
  -> write
  -> finalize
```

But legal backwards edges are normal:

- `baseline -> scout`
- `idea -> baseline`
- `experiment -> idea`
- `analysis_campaign -> experiment`
- `write -> analysis_campaign`
- `write -> experiment`
- `write -> idea`

This keeps the workflow real rather than theatrical.

## 6. Minimal Completion Signals

The daemon should validate lightly, not aggressively.

Suggested minimal completion signals:

- `baseline` completed when there is an accepted baseline artifact and metric contract
- `idea` completed when there is at least one accepted idea artifact
- `experiment` completed when there is at least one main run record
- `analysis_campaign` completed when there is a campaign report
- `write` completed when the draft contains at least abstract, method, results, and limitations
- `finalize` completed when the final report and Git graph exist

The agent still decides the flow.
The daemon only needs enough checks to keep recovery sane.

## 7. First-Party Skills

Users should not manually assemble skills, but the system must ship them.

Recommended first-party skill pack:

- `ds-integrity`
- `ds-scout`
- `ds-baseline-reuse`
- `ds-baseline-reproduce`
- `ds-idea-generation`
- `ds-decision-review`
- `ds-experiment-main`
- `ds-analysis-planning`
- `ds-analysis-run`
- `ds-writing`
- `ds-finalize`

These skills should be:

- versioned in the repo
- stored in runner-native source formats
- synced into runner-visible skill directories
- explicitly referenced in the system prompt
- loaded through a small registry-backed skill loader, even for built-in skills

The canonical registry and sync rules are defined in `docs/REGISTRIES.md`.

## 8. Skill Packaging Rules

Recommended skill shape:

```text
skills/
  ds-baseline-reuse/
    SKILL.md
    agents/
      openai.yaml
      claude.md
    references/
    scripts/
    assets/
  ds-experiment-main/
    SKILL.md
    agents/
      openai.yaml
      claude.md
    references/
    scripts/
    assets/
```

Recommended role of each file:

- `SKILL.md`
  - canonical Codex/OpenAI skill file
  - must follow the Codex-style `SKILL.md` pattern with YAML frontmatter
- `agents/openai.yaml`
  - optional OpenAI UI metadata
  - should follow the local Codex `agents/openai.yaml` pattern exactly when present
- `agents/claude.md`
  - optional Claude Code subagent file
  - should follow Claude Code's Markdown + YAML frontmatter format exactly when present
- `references/`
  - load-on-demand supporting references
- `scripts/`
  - deterministic helper scripts
- `assets/`
  - icons, templates, and other bundled files

Each `SKILL.md` should define:

- YAML frontmatter with at least:
  - `name`
  - `description`
- purpose
- when to use it
- when not to use it
- trigger conditions
- required inputs
- expected file outputs
- reporting obligations
- decision obligations
- branch or worktree expectations
- resumption procedure
- at least one concrete example

Recommended `SKILL.md` section rhythm:

1. goal
2. use when
3. do not use when
4. required context
5. expected durable outputs
6. memory obligations
7. artifact obligations
8. branch/worktree policy
9. resumption rules
10. examples

Skill resolution should use a registry or bundle loader, not hard-coded per-skill branching.
Skills should stay sophisticated in documentation, not in core runtime code.

## 8.1 Cross-runner compatibility rule

There is no single source file format that is literally identical between Codex/OpenAI skills and Claude Code subagents.

So the correct DeepScientist rule is:

- the source bundle should be Codex/OpenAI-native:
  - `skills/<skill_id>/SKILL.md`
- optional OpenAI UI metadata should live in:
  - `skills/<skill_id>/agents/openai.yaml`
- Claude Code should receive an exact Claude-native projection in:
  - `.claude/agents/<subagent-name>.md`

Recommended behavior:

- if `agents/claude.md` exists, sync it directly
- otherwise, generate a Claude-compatible subagent Markdown file from:
  - `SKILL.md` frontmatter
  - selected tool restrictions
  - the skill body

This keeps:

- Codex/OpenAI compatibility exact
- Claude Code compatibility exact
- DeepScientist source authoring simple

## 9. Team Mode Compatibility

The first version should run well with a single agent.

But the workflow and skills should map cleanly to future roles:

- `planner`
- `reproducer`
- `experimentalist`
- `analyst`
- `writer`

Artifact handoff, not hidden memory, is the right collaboration primitive.

## 9.1 Reserved team execution contract

The first code slice should still be single-agent-first.

But the interfaces should already assume that a quest may later run:

- one lead agent
- several worker agents
- one worker per role or per analysis branch

Recommended rules:

- all agents share quest memory and global memory through the same `memory` tool
- workers do not share hidden in-memory state
- workers should receive their own:
  - `worker_id`
  - `agent_role`
  - `run_id`
  - `worktree_root`
- risky or parallel work should happen in:
  - `<quest_root>/.ds/worktrees/<run_id>/`
  - or a dedicated branch rooted in the quest repo
- worker completion should produce:
  - handoff artifact
  - result artifact
  - optional memory cards
- the lead agent remains responsible for accepted branch promotion and quest-level planning

This keeps future multi-agent work parallelizable without changing the core storage or prompt model.

The reserved lead / worker / worktree lifecycle is specified in:

- `docs/TEAM_LIFECYCLE.md`

## 10. References to Reuse

The following existing material should shape the skill design:

- agent role prompts:
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/pi.md`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/reproducer.md`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/analysis-experimenter.md`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/writer.md`
- old DS skill structure:
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/capabilities/skills/_manifest.md`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/capabilities/skills/lab_experiment_planning/SKILL.md`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/capabilities/skills/lab_ml_paper_writing/SKILL.md`
- local Codex/OpenAI skill structure:
  - `/home/air/.codex/skills/.system/skill-creator/SKILL.md`
  - `/home/air/.codex/skills/.system/skill-creator/references/openai_yaml.md`
  - `/home/air/.codex/skills/.system/skill-creator/agents/openai.yaml`
- Claude Code subagent reference:
  - `https://docs.anthropic.com/en/docs/claude-code/sub-agents`
- registry-first extension references:
  - `/ssdwork/deepscientist/_references/nanoclaw/src/channels/registry.ts`
  - `/ssdwork/deepscientist/_references/openclaw/src/context-engine/registry.ts`

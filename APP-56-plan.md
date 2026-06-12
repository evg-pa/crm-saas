# Plan: Fix comment-driven wake routing for unowned issues

**Issue:** [APP-56](/APP/issues/APP-56)  
**Author:** CTO (248187f8)  
**Revision:** 1  
**Date:** 2026-05-27

---

## 1. Forensics Summary

### 1.1 The exact stop point

The affected tree is [APP-52](/APP/issues/APP-52) → [APP-54](/APP/issues/APP-54) → [APP-56](/APP/issues/APP-56).

**APP-52** was assigned to the **CEO** (agent `22881266`). The **CTO** (agent `248187f8`) had previously been mentioned/delegated into the work and left several comments in the thread, making them the "last agent speaker":

| Time (UTC) | Author | Comment |
|---|---|---|
| 08:01:52 | CTO | "Done — CRM project cloned, validated, CI fixed, README corrected" |
| 08:09:16 | Board (local-board) | "What is the path to the local repository with the latest commit?" |
| 08:09:40 | CTO | Answers repo path question |
| 08:09:56 | CTO | "Re-closing — board question answered" |
| **08:12:48.370** | **Board (local-board)** | **"Commit the fixed changes"** |

At 08:12:48.370Z, the board posted "Commit the fixed changes" — a comment that **does not @-mention any agent**. The wake router applied the **last-speaker heuristic**: because the CTO was the most recent agent commenter, the system woke the CTO (not the assignee, the CEO).

**Run `d50c5627`** started at 08:12:48.723Z:
- Wake reason: `issue_commented` (not `issue_comment_mentioned` — no explicit @-mention was detected)
- Scoped wake payload pointed at APP-52
- The CTO's instructions (Step 4 scoped-wake fast path) direct: skip inbox, go straight to checkout on APP-52
- Checkout fails: **409 Conflict** — APP-52 is assigned to CEO
- The CTO's instructions say: "stop, pick a different task" — but in a scoped wake there is no other task
- **Result:** run goes silent. Last output at 08:12:51.466Z. No further output for ~1h.
- Watchdog detects silence → CEO creates [APP-54](/APP/issues/APP-54)

### 1.2 Root cause

**Two interacting gaps:**

1. **Wake router (server):** The comment-wake router uses a "last speaker" heuristic that wakes the most recent agent commenter regardless of issue ownership. For board comments without explicit @-mentions, this can target a non-owner agent. The existing `issue_comment_mentioned` path already handles non-owner wakes correctly — but the router does not use it when no @-mention is detected.

2. **Agent instructions (client):** The `issue_commented` handler in the agent's heartbeat procedure unconditionally directs the agent to checkout the commented issue. There is no guard for "is this issue assigned to me?" before attempting checkout. When the issue is owned by another agent, the 409 Conflict has no recovery path in a scoped wake context.

### 1.3 Why `issue_comment_mentioned` already works

The heartbeat procedure already defines correct behavior for non-owner wakes under the `issue_comment_mentioned` reason:

> "read the comment thread first even if you're not the assignee. Self-assign (via checkout) only if the comment explicitly directs you to take the task. Otherwise respond in comments if useful and continue with your own assigned work; do not self-assign."

The fix is to route unowned comment wakes through this existing path rather than the `issue_commented` path that assumes ownership.

---

## 2. Classification of non-progressing issues

| Issue | Status | Classification |
|---|---|---|
| APP-52 | `done` | Already resolved. No action needed. |
| APP-54 | `done` | CEO investigation. Already resolved. |
| APP-56 | `in_progress` | Agent-actionable. This plan addresses it. |

No stalled leaves remain in the affected tree.

---

## 3. Recent related work survey

Reviewed the available API evidence and agent instructions:

- The `issue_comment_mentioned` path already exists in the heartbeat procedure as a first-class wake reason with correct non-owner handling — this is the key asset to build on.
- The `PAPERCLIP_WAKE_PAYLOAD_JSON` mechanism (inline wake payload) was recently introduced to optimize comment-driven wakes — this existing infrastructure supports adding `fallbackFetchNeeded` or ownership signals.
- The `PAPERCLIP_WAKE_COMMENT_ID` / `PAPERCLIP_WAKE_REASON` env-var contract is already comprehensive — adding/changing a wake reason value is a small delta, not a new mechanism.

**Limitation:** The `doc/execution-semantics.md` source document was not available locally (Paperclip source code not checked out in this workspace). This plan relies on the agent instructions and API-observable behavior as the source of truth. A Phase 1 action item is to validate this plan against `doc/execution-semantics.md` when the source repo is available.

---

## 4. Proposed product rule (contract)

> **Comment-driven wake ownership rule:** A comment-driven wake MUST prefer the issue's assignee as the wake target. An agent who is NOT the assignee MUST only be woken through the `issue_comment_mentioned` path (explicit @-mention), never through the `issue_commented` path (which implies checkout authority). The `issue_commented` path MUST include a guard: if the woken agent discovers the issue is assigned to another agent, the agent MUST acknowledge and fall back to their own work rather than attempting checkout.

This contract preserves all three invariants:

| Invariant | How it's preserved |
|---|---|
| **Productive work continues** | Non-owner agents fall back to their own assigned work after acknowledging the mention, rather than getting stuck on a 409. |
| **Only real blockers stop work** | A non-owned comment becomes a notification (informational), not a pseudo-blocked state with no action path. |
| **No infinite loops** | The wake is a single notification; the agent does not retry checkout, does not create recovery issues, and does not re-enter the wake path. |

---

## 5. Implementation phases

### Phase 0 — Immediate hygiene (no changes needed)

The affected tree (APP-52, APP-54) is already resolved (`done`). No cleanup action required.

### Phase 1 — Server: Fix the wake router

**Owner:** Engineer (server-side)

The wake router must distinguish between:
- `issue_commented` — the agent IS the assignee, checkout is expected
- `issue_comment_mentioned` — the agent is NOT the assignee but was mentioned or matched by heuristic; respond without checkout

**Specific change:** When the candidate wake target is not the issue's assignee AND the triggering comment does not contain an explicit @-mention of that agent, route the wake as `issue_comment_mentioned` instead of `issue_commented`.

**Edge cases to handle:**
- Board comment with no @-mention, no assignee → fall back to last speaker as `issue_comment_mentioned`
- Board comment with @-mention of non-assignee → already works as `issue_comment_mentioned`
- Board comment with @-mention of assignee → route as `issue_commented` (assignee was explicitly addressed)
- Board comment on unassigned issue → `issue_comment_mentioned` for the most active/recent agent speaker

### Phase 2 — Agent instructions: Add ownership guard

**Owner:** Agent instructions update

Add a guard clause to the `issue_commented` handler in the heartbeat procedure:

```markdown
Before checkout, verify you are the issue's assignee. If the issue is assigned to 
another agent, fall back to the `issue_comment_mentioned` behavior: read the 
comment, respond if useful, and continue with your own assigned work.
```

This is a defense-in-depth measure — even if the server's routing rule is correct, the agent instructions should never assume ownership.

### Phase 3 — QA validation

**Owner:** QA

Test scenarios:
1. Board comments on CEO-owned issue where CTO was last speaker → CTO should NOT be woken as `issue_commented`; CEO should be woken, or CTO should be woken as `issue_comment_mentioned`
2. Board comments on unassigned issue → appropriate agent notified as `issue_comment_mentioned`
3. Board comments with explicit @-mention of non-assignee → non-assignee woken as `issue_comment_mentioned` (existing behavior, regression test)

### Phase 4 — Security review

**Owner:** Security

- Verify that an agent cannot use this path to hijack checkout on another agent's issue
- Verify that the wake-routing change does not create an information disclosure vector (e.g., an unowned agent shouldn't learn private issue details beyond what the comment thread exposes)
- Review the `issue_comment_mentioned` vs `issue_commented` permission boundaries

---

## 6. Assignees and dependencies

| Phase | Task | Specialty | Blocked by |
|---|---|---|---|
| Phase 1 | Fix wake router (server) | Engineer | None |
| Phase 2 | Update agent instructions | Agent config | Phase 1 (contract must be stable) |
| Phase 3 | QA validation | QA | Phase 1, Phase 2 |
| Phase 4 | Security review | Security | Phase 1 |
| — | CTO review & merge | CTO | Phase 3, Phase 4 |

---

## 7. Rollback plan

- The wake router change is a routing decision, not a data mutation. Reverting the change restores the previous heuristic immediately.
- The agent instructions change is a text-only update to the `AGENTS.md` template. Reverting restores the previous handler behavior.
- No database migration is required.
- The existing `issue_comment_mentioned` path is already tested in production and carries no new risk.

---

## 8. Verification checklist (pre-approval)

- [x] The exact stop point is identified with comment IDs, run ID, and timestamps
- [x] Every non-progressing issue is classified
- [x] The proposed rule is stated as a contract, not a patch
- [x] All three invariants are explicitly preserved
- [x] No code change has landed
- [x] Phase 0 addresses the live tree (no action needed — already resolved)
- [x] Implementation phases name specialty-appropriate assignees and dependencies
- [x] Rollback is possible without data migration

**Pending:**
- [ ] Validate against `doc/execution-semantics.md` (Phase 1 action item)
- [ ] Board approval via `request_confirmation`

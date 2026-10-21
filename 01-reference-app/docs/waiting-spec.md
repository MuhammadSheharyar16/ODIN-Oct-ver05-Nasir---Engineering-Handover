# ODIN is working · waiting experience (spec for the AI team)

Source of truth: `src/odin/waiting.ts`. Demo flag: `?latency=<seconds>` (add `&progressive` for progressive loading).

## Tone
ODIN speaks to His Excellency: courteous, calm and brief. It never blames the question and never sounds abrupt: “I’m sorry, I don’t have that information yet”, not “I can’t answer that”. Thanks him for waiting rather than reporting a problem.

## Thinking state
- The mic bar shows the heard question in quotes, then **Thinking…**.
- ODIN's globe keeps its thinking motion. Nothing else changes until the answer is ready.

## Spoken check-ins (seconds after the question)
| At | ODIN says | Mic-bar line |
|---|---|---|
| 10 s | One moment, please. I’m gathering the latest figures. | Gathering the latest figures… |
| 15 s | Thank you for your patience. I’m confirming the figures. | Confirming the figures… |
| 20 s | This one needs a little more time. Almost there. | Almost there… |
| 30 s | Thank you for waiting. The data is taking a little longer than usual. | A little longer than usual… |
| 45 s | I’m still working on it, and I’ll have it for you shortly. | Still working on it… |
| 60 s | My apologies, this is taking longer than it should. Allow me to try once more. | Trying once more… |

- Under 10 s: no check-in. ODIN just answers.
- At 60 s ODIN retries once. In the demo the retry answers 3 s later. In production, a second failure says: “I’m sorry, I couldn’t retrieve that just now. I’ll be ready as soon as you’d like to ask again.”
- A new question cancels any pending check-in.
- Check-ins are short (under 2 s of speech) and never repeat in one wait.

## Progressive loading (`&progressive`)
- The answer screen appears at once: layout, titles and cards.
- The summary reads “Bringing in the figures”. Every number shows three soft dots until its value arrives. Numbers arrive in turn (the hero first, then each card), then count up.
- ODIN starts speaking once the numbers are in. Check-ins still apply while the numbers load.

## For the 30 Oct demo
- Anupam picks the target time with `?latency=` (e.g. `?latency=6`, `?latency=12&progressive`).
- Recommended: answers under 8 s use the thinking state. Longer answers use progressive loading, so the CEO sees the screen while the numbers arrive.

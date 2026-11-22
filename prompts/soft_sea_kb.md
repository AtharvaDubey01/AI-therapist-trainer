# SOFT SEA FRAMEWORK — KNOWLEDGE BASE (v2, Simplified)

This file is the single source of truth for coaching quality in the TherapyAI Practice Simulator.
It is read by two different AI systems:

- **[HINT]** = used by the Live Hint Supervisor (mid-chat, real-time, needs quick lookups)
- **[EVAL]** = used by the Evaluation Supervisor (end of session, needs full detail, grades against every rule)
- **[BOTH]** = relevant to both systems

Every rule below is written in plain, direct language (no pseudocode, no math notation) so it works reliably with both small local models and larger API models.

---

## 1. GLOBAL RULES (apply at all times, in every stage)

### RULE 1 — Never Clean Up the Client's Words **[BOTH]**
The coach must repeat the client's own words, phrases, and metaphors back to them — exactly as said. The coach should NOT rewrite the client's messy language into clean, clinical, or "proper" language.

- ✅ Client says: "It's like a fog in my brain." → Coach says: "Tell me more about this fog in your brain."
- ❌ Coach says: "So you're experiencing mental confusion." (This is a violation — it replaces the client's own word "fog" with a clinical term.)

### RULE 2 — No Advice Giving **[BOTH]**
The coach must NOT act like an expert. The coach must NOT:
- Give life advice or psychological advice
- Suggest what the client's goals should be
- Interpret what a symbol, dream, or metaphor "means"

Instead, when the client asks for help understanding their own feelings, the coach should ask a guiding question that helps the client figure it out themselves.

- ✅ Client: "What do you think this dream means?" → Coach: "What do you think it means to you?"
- ❌ Coach: "That dream probably means you're afraid of failure."

**Exception — Logistical Help Only:** If the client has a broad practical task (e.g., "I need to research home loans") and directly asks for help breaking it down, the coach IS allowed to suggest 2-3 small concrete first steps for that specific task. This is the only case where suggesting something is allowed. The coach still may not invent new life goals or give emotional/psychological advice.

- ✅ Client: "I want to research home loans but don't know where to start." → Coach: "Some starting points could be: (1) checking your credit score, (2) comparing 2 banks' interest rates, (3) listing documents you'll need." — This is allowed because it's logistical, not emotional/psychological advice.

### RULE 3 — Keep Empathy Short (1 Sentence Max) **[BOTH]**
When the client shares something painful, the coach may acknowledge the feeling in **one sentence only**, then must move the conversation forward. The coach should not dwell on the emotion for multiple sentences or multiple turns.

- ✅ "That sounds really hard." → (then continues to next question)
- ❌ "That sounds really hard. I can only imagine how difficult that must be for you, and it makes complete sense that you'd feel this way given everything you've been through." (Too long — violates the 1-sentence cap.)

---

## 2. STAGE 1: MAPPING THE CURRENT SITUATION ("S-Mapping") **[BOTH]**

**Goal of this stage:** Get a clear, specific picture of the client's current problem. Do not fix it yet — just map it.

**Rules for this stage:**
- Ask only **one question at a time**. Never ask two questions in the same message.
- If the client asks the coach a question or goes off-topic, the coach should answer briefly and warmly, then guide the conversation back to the checklist below.
- If the client asks the coach to "just summarize this for me," the coach should NOT do it for them. Instead say something like: "I can guide you, but it helps most if you try summarizing this yourself first — take a moment and give it a try, it doesn't need to be perfect."

**Checklist of questions to move through, in order:**
1. "What would you like to work with?"
2. "Is there anything else you'd like to tell me about this challenge?"
3. "Anything else about you that you think is important for me to know?"
4. Coach shows a short summary of what the client shared in steps 1–3, and asks: "Can you read this and let me know if it's complete, or if you'd like to add/change anything?"
5. "Now that we have all these details, could you summarize this in your own words in 3-4 lines?"
6. "Does this summary capture what you've shared with me so far?"
7. "Could you rephrase your summary using this format: I feel ___ About ___ When ___"
8. "Does this fully capture the current challenge?"
   - If the answer is "No," the coach should say: "Feel free to add more sentences using the same format: I feel ___ About ___ When ___"

**Special Check — The "When" part must be something you can physically see, hear, or experience (not a judgment or internal thought):**

This check applies to steps 7 and 8 above.

- ✅ VALID "When" examples (physical/observable): "When I see his name on my phone," "When I hear my alarm at 6 AM," "When I walk into the office."
- ❌ INVALID "When" examples (internal judgment, not observable): "When I feel like I'm not good enough," "When I think people are judging me," "When I feel useless."

If the client gives an invalid "When," the coach should NOT accept it. Instead, the coach should say: "Let's explore exactly when this feeling starts. What are you actually looking at, hearing, or doing right at that moment?" and wait for a more concrete answer before moving on.

---

## 3. STAGE 2: DESIGNING THE DESIRED OUTCOME ("O-Engineering") **[BOTH]**

**Goal of this stage:** Shift the client from talking about the problem to describing what they actually want instead.

**Required output format (the client's final outcome statement must match this):**
> "I wish [Desired Change/Goal]."

**Rules:**
- The final outcome statement must be **2 to 4 lines long** — no more, no less.
- Strip out any extra explanations, justifications, coping strategies, or backstory. The final version should be a clean "I wish ___" statement only — nothing else attached to it.

- ✅ "I wish I could speak up in meetings without feeling my heart race."
- ❌ "I wish I could speak up in meetings, because ever since I was a kid I've been told I talk too much, and my old boss used to make fun of me, so now I get scared." (Too long, includes backstory — needs to be trimmed down to the core wish.)

---

## 4. STAGE 3: FUTURE VISION ("F-Scripting") **[BOTH]**

**Goal of this stage:** Help the client vividly picture what life looks like after achieving their outcome, using concrete, sensory details (not vague feelings).

### The "Miracle Question" (ask this exact question first, word for word):
> "Imagine you go to sleep tonight, and while you're sleeping, a miracle happens. The outcome you described is now completely fulfilled. When you open your eyes tomorrow morning, what is the very first concrete sign that tells you this miracle has happened?"

**Important:** If the client already gave concrete sensory details earlier in the conversation, do NOT ask redundant questions that ask for the same kind of detail again.

### Checklist of questions (ask one at a time, wait for a response before moving to the next):
1. "Imagine your life after achieving this outcome — how would your life be?"
2. "Can you tell me 10-15 changes you'd notice once you've achieved this outcome?"
3. "Would someone else notice these changes? Who? What would they say once they notice?"
4. "What would you see or hear? How would you know?"
5. "Once you've achieved this, how would you feel? Where in your body would you feel that emotion, and what sensations would you notice?"
6. "When you notice these changes, what would you say to yourself?" → After they answer, summarize their tangible signs and ask: "Is there anything else you'd notice, or does this cover it?"

### Life Domains Sweep (go through each one, one at a time, wait for a response each time):
1. **Health:** "What difference would you notice in your health? (e.g., sleeping 7 hours uninterrupted, or a 30-minute morning walk.)"
2. **Finance:** "What difference would you notice in your finances? (e.g., hitting a savings goal, or setting up an automatic investment.)"
3. **Career:** "What difference would you notice in your career? (e.g., logging off at 6 PM, or launching a new project.)"
4. **Personal Growth:** "What difference would you notice in your personal growth? (e.g., reading for 20 minutes a day, or learning a new skill.)"
5. **Relationships:** "What difference would you notice in your relationships — romantic, family, or social? (e.g., a phone-free dinner with your partner, or a weekly call with a friend.)"

### Checking the Details Are Concrete Enough:
Every future-vision detail needs to include:
- **At least 3 concrete actions** — real things a third person could observe (not internal feelings).
- Internal skills/strategies the client would use, and
- The specific emotion involved.

If the client uses vague or abstract words (e.g., "confidence," "peace," "success") instead of something concrete, the coach should ask: "[Vague word] about what specifically? What would you actually see yourself doing, or what would you be saying to yourself, in that exact moment?" Keep asking until the client gives something concrete and sensory.

- ✅ Concrete: "I'd feel calm — my shoulders would relax and I'd take a slow breath before speaking."
- ❌ Too vague: "I'd feel confident." (Needs a follow-up to make this concrete.)

---

## 5. STAGE 4: MAPPING ACTIONABLE TASKS ("T-Mapping") **[BOTH]**

**Goal of this stage:** Turn the future vision into a concrete, ordered action plan.

**Rules:**
- Ask one question at a time. Never list multiple brainstorming questions together.

### Step-by-step task extraction:
1. "Now that we have a clear vision of your future, what steps do you need to take to get there?"
2. "What else? Is there anything else that would help?"
3. If the client seems stuck: "Do you know someone who has done this before? How did they do it, or how could you find out?"
4. Once steps are gathered, show them as a numbered list and ask: "Here's a suggested order for these steps — does this look right, or would you like to reorder anything?"
5. "Looking at this list, which of these tasks are you not currently doing, or feel stuck on? Just reply with the task numbers."

### Micro-Action Rule:
Every task on the final list must be something the client could do **immediately, in one step**, without needing to plan multiple sub-steps first. If a task still requires more planning or multiple steps, it needs to be broken down further before it counts as "ready."

### Two-Pass Check for Stuck Tasks:

**Pass 1 — Check for Internal Resistance First:**
"To get some quick wins, let's first check — do any of these tasks feel blocked by a thought, emotion, or hesitation? If so, which ones?"
→ Any task blocked by a feeling/thought goes to the **Mental State Resolution Loop** (Section 5a below).

**Pass 2 — Then Check for Logistics:**
For tasks NOT blocked by emotion, figure out which of these 4 reasons is blocking it, in this order:
1. **Lack of Clarity** — the client doesn't have enough information yet → build a small subtask to get that information.
2. **Lack of Skill** — the client doesn't know how to do this yet → build a subtask to learn the skill.
3. **Lack of Resources** — there's an external/logistical thing missing (time, money, tool, access) → build a subtask to get that resource.
4. **Mental State** — none of the above apply, so it's actually an emotional block → send to Section 5a below.

Any new subtasks created this way get added to the task list, and the whole check runs again on the updated list.

### 5a. Mental State Resolution Loop (for emotionally-blocked tasks)
Ask these one at a time, waiting for a response each time:
1. "What specific emotion is stopping you here?"
2. "When you feel that emotion, what thought goes through your mind?"
3. "What would be a more helpful feeling you'd want instead?"
4. "What's an alternative thought you could use instead of the old one?"
5. "What will be your exact trigger to remind you of this new thought? (e.g., an alarm at 11 AM, or arriving home.)"
6. Coach summarizes: "Let's lock this in. Your new guiding statement is: When [trigger], then I realize [new thought]."
7. "Does this feel powerful enough to help you take action, or does it need adjusting?"
   - If the client wants changes, go back to step 4 and adjust, repeat until they confirm it feels right.
8. "When will you practice this statement daily? I recommend setting a reminder — like an alarm, or your phone/PC screensaver."
   → Once they answer: "When you practice this, please also listen to the recording titled 'When-Then Installation.'"
9. Once this loop is done, return to Pass 2 and continue planning any remaining logistical tasks.

---

## 6. STAGE 5: CLOSING THE SESSION ("SEA Closure") **[BOTH]**

**Rules:** Go through this step-by-step. Never combine multiple steps into one message. Wait for a response after each step.

### Step 1 — Ledger
Show a clean bulleted list of all finalized tasks, subtasks, and "When-Then" statements from earlier.

### Step 2 — Scheduling & Certainty Check (repeat this loop for EACH task on the ledger, one at a time)
- **A.** "For the task [task name], when exactly do you plan to do this? I recommend picking a specific day and time, and setting an alarm right now to lock it in." → wait for response.
- **B.** "On a scale of 1-10, how certain are you that you'll do this at that time?" → wait for response.
- **C.** If the certainty score is 7 or below, run this diagnostic:
  - "What's the specific reason you feel unsure about completing this at that time?" → wait for response.
  - If the reason is about **time availability** → "Let's pick a different time or day when you know you'll definitely be free. What works better?"
  - If the reason is **lack of clarity, resources, or skill** → break the task down into smaller subtasks (same as Section 5).
  - If the reason is **an emotional/mental block** → run the Mental State Resolution Loop (Section 5a).
  - If the client says they want to try it anyway despite the low score → "Okay, let's keep it as is. If it doesn't happen, we'll revisit it next week." — this task can move forward even with a low score.
- Only move to the next task on the ledger once the current one is either locked at 8+ certainty, or the client has chosen to try anyway.

### Step 3 — Cognitive Summary
"Now that everything is mapped, scheduled, and locked in — can you summarize your biggest takeaways from today's session in 3-4 lines?"

### Step 4 — Final Document & Wrap-Up
Say: "Congratulations on mapping out your path!" Then generate a final summary document with these exact columns: **Current Situation | Desired Outcome | Future Vision | Tasks with Scheduled Time | Trigger | When-Then Statement**

---

## 7. WHEN-THEN STATEMENT RULES (used throughout, especially Sections 5a and 6) **[BOTH]**

**Required format:**
> "When [specific external, physical, observable trigger], then [believable new thought that breaks the emotional block] + [tiny physical action]."

**Rules for the trigger:**
- The trigger must be something **external and physical** — a place, object, time, or sensory cue.
- The trigger must NOT be an internal feeling or a mental judgment.

- ✅ Valid triggers: "When I sit down at my desk," "When my alarm goes off at 7 AM," "When I open my laptop."
- ❌ Invalid triggers: "When I feel anxious," "When I think I'm going to fail," "When I feel overwhelmed."

If the client gives an internal-feeling trigger, the coach should say: "Your mind is using an internal feeling as a trigger, but this needs a physical anchor to work. Where are you standing, what's in your hand, or what specific thing happens right before that feeling shows up?" and wait for a more concrete answer.

**Rules for the new thought:**
- It must be realistic and believable — not overly positive or fake-sounding.
- It must connect directly to a small physical action the client can take right away.

---

## QUICK REFERENCE TABLE (for the Hint system to scan fast)

| Stage | One-Line Purpose | Key Trap to Watch For |
|---|---|---|
| S-Mapping | Map the current problem clearly | Coach accepts vague/internal "When" triggers |
| O-Engineering | Turn problem into a clean "I wish" statement | Outcome statement too long / includes backstory |
| F-Scripting | Build vivid, concrete future vision | Client uses vague words (confidence, peace) without follow-up |
| T-Mapping | Build a concrete action plan | Tasks aren't broken down to single, immediate steps |
| SEA Closure | Lock in schedule + certainty per task | Coach rushes certainty check instead of doing it per-task |
| When-Then (Section 7) | Build an automatic trigger-thought-action link | Trigger is an internal feeling, not physical/observable |

---

## NOTES FOR MODEL BEHAVIOR (both Hint and Eval systems)

- Always check the "Global Rules" (Section 1) first, regardless of which stage the conversation is in — these apply everywhere.
- For the **Hint system**: only look at the current stage's rules plus Global Rules. Do not reference future stages the coach hasn't reached yet.
- For the **Eval system**: check the entire transcript against every rule in every section, one rule at a time, and give a Pass/Fail/Partial + a quoted example for each.

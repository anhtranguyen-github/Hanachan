# Best Solution Proposal: "Gọn - Chất" Architecture

This proposal outlines a focused architectural roadmap that avoids over-engineering while delivering high technical quality for an excellent student project.

## 1. Priority 1: The "Stable" Core (Engine Layer)

We will focus on "Cleaning" the parts that are mathematically or logically stable.

### 1.1 Pure SRS Algorithm
Extract the SRS logic from UI components into a pure, testable function.
- **Action**: Implement `src/modules/learning/domain/SRSAlgorithm.ts`.
- **Method**: Use a standard algorithm (SM-2 or FSRS) designed as a pure function.

### 1.2 KU & Learning State Repository
Formalize the "Backplane" that connects everything.
- **Action**: Create `src/modules/ckb/domain/interfaces/IKURepository.ts` and `src/modules/learning/domain/interfaces/ILearningRepository.ts`.
- **Reasoning**: This allows YouTube, Chatbot, and Flashcards to share a common data interface.

## 2. Priority 2: Future-Proof AI (AI Adapter)

Keep the volatile AI logic flexible but abstracted.
- **Action**: Implement `ILinguisticAnalyzer` port in `src/modules/analysis/domain/`.
- **Reasoning**: This handles prompts and tokenization behind a stable interface, making it easy to swap LLM providers without breaking the UI.

## 3. Priority 3: Sentence-to-KU Flow (Sentence Mining)

Implement the "Entry Point" of the system.
- **Action**: Refactor the YouTube and Chat components to trigger the `analysis` use case, which maps result to `ckb` entries.
- **Feature**: "Add to Study Bag" - linking a specific context (sentence) to a general knowledge unit (KU).

## 4. What to AVOID (Anti-Over-Engineering)

- **❌ Complex Domain Entities**: Keep Linguistic KU models simple (Plain TS Interfaces). No complex inheritance for now.
- **❌ Full Clean Architecture Layers for UI**: Don't force every simple button through a `UseCase` class. Use `Hooks` for volatile UI state.
- **❌ Heavy DDD for Chat**: Chatbot flow should remain "Service-based" and flexible to UX changes.

## 5. Architectural Verdict

By cleaning the **Knowledge Backplane** (KU/SRS) and keeping the **Interaction Shell** (AI/UI) flexible, the project demonstrates both **Engineering Rigor** and **Pragmatic Design**.

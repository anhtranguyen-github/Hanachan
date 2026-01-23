# Hanachan V2 - Demo Interface Guide

This project contains a comprehensive suite of static demo pages that represent the full functional design of the application. These pages are located under the `/demo-v2` route.

## 🚀 How to Run the Demo Server

1. **Install Dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Start the Development Server**:
   ```bash
   npm run dev
   ```

3. **Open the Demo URL**:
   Once the server is running, open your browser and navigate to:
   [http://localhost:3000/demo-v2](http://localhost:3000/demo-v2)

---

## 🔗 Full Demo Route Map

### 1. Core Pages
- **Landing Page**: [http://localhost:3000/demo-v2](http://localhost:3000/demo-v2)
- **User Dashboard**: [http://localhost:3000/demo-v2/dashboard](http://localhost:3000/demo-v2/dashboard)

### 2. Learning Journey (Lesson Flow)
- **Start Learning Entry**: [/demo-v2/learn](http://localhost:3000/demo-v2/learn)
- **Active Lesson Item**: [/demo-v2/learn/lesson-batch](http://localhost:3000/demo-v2/learn/lesson-batch)
- **Lesson Checkpoint (Quiz)**: [/demo-v2/learn/lesson-batch/next](http://localhost:3000/demo-v2/learn/lesson-batch/next)
- **Lesson Incorrect Feedback**: [/demo-v2/learn/lesson-batch/incorrect](http://localhost:3000/demo-v2/learn/lesson-batch/incorrect)
- **Session Complete**: [/demo-v2/learn/lesson-batch/complete](http://localhost:3000/demo-v2/learn/lesson-batch/complete)
- **Quit Confirmation**: [/demo-v2/learn/quit](http://localhost:3000/demo-v2/learn/quit)

### 3. Spaced Repetition (Review Flow)
- **Review Dashboard**: [/demo-v2/review](http://localhost:3000/demo-v2/review)
- **Standard Review Item**: [/demo-v2/review/item](http://localhost:3000/demo-v2/review/item)
- **Grammar Cloze Review**: [/demo-v2/review/cloze](http://localhost:3000/demo-v2/review/cloze)
- **Correct Feedback**: [/demo-v2/review/item/correct](http://localhost:3000/demo-v2/review/item/correct)
- **Incorrect Feedback (with Re-answer)**: [/demo-v2/review/item/incorrect](http://localhost:3000/demo-v2/review/item/incorrect)
- **Review Summary**: [/demo-v2/review/complete](http://localhost:3000/demo-v2/review/complete)

### 4. Knowledge Library (Content Browsing)
- **Library Home**: [/demo-v2/content](http://localhost:3000/demo-v2/content)
- **Grammar Library**: [/demo-v2/content/grammar](http://localhost:3000/demo-v2/content/grammar)
- **Vocabulary Library**: [/demo-v2/content/vocab](http://localhost:3000/demo-v2/content/vocab)
- **Kanji Library**: [/demo-v2/content/kanji](http://localhost:3000/demo-v2/content/kanji)
- **Radical Library**: [/demo-v2/content/radical](http://localhost:3000/demo-v2/content/radical)

**Detail Pages (Examples):**
- [Grammar Details (~は ~ です)](http://localhost:3000/demo-v2/content/grammar/1)
- [Kanji Details (日)](http://localhost:3000/demo-v2/content/kanji/1)
- [Vocab Details (食べる)](http://localhost:3000/demo-v2/content/vocab/1)

### 5. Learning Analytics (Progress)
- **Progress Overview**: [/demo-v2/progress](http://localhost:3000/demo-v2/progress)
- **Level Progress**: [/demo-v2/progress/level](http://localhost:3000/demo-v2/progress/level)
- **Retention Stats & Charts**: [/demo-v2/progress/review](http://localhost:3000/demo-v2/progress/review)

### 6. AI Learning Assistant (Chat)
- **Scientific AI Chat**: [/demo-v2/chat](http://localhost:3000/demo-v2/chat)
- **Contextual Learning CTA**: [/demo-v2/chat/cta](http://localhost:3000/demo-v2/chat/cta)
- **Inline Learning Modal**: [/demo-v2/chat/cta/modal](http://localhost:3000/demo-v2/chat/cta/modal)

---

## 🎨 UI Characteristics
- **Bolder Borders**: Adjusted to `border-2 border-gray-300` for high visibility.
- **Production-Ready**: No mock/demo indicators.
- **Use Case Satisfied**: Covers all graduation project scenarios (Explanation, Composition, Retrying strategy, etc.).


stroke_order_svg (Kanji) và pitch_accent (Vocab) 
# FSRS State Transition Scenarios - Hanachan v2

## Quy tắc cơ bản

### Formulas

| Rating | Stability | Reps | Lapses | Stage |
|--------|-----------|------|--------|-------|
| `good` | `S = S × 1.5 × (D/3.0)` | `reps++` | Không đổi | Xem ngưỡng |
| `again` | `S = max(0.1, S × 0.4)` | `reps = max(1, reps - 2)` | `lapses++` | `learning` |

### Early Foundation (Overrides)
Khi `reps` còn nhỏ, stability được cố định:
- `reps = 2`: S = 0.166 days (~4 giờ)
- `reps = 3`: S = 0.333 days (~8 giờ)
- `reps = 4`: S = 1.0 days
- `reps = 5`: S = 3.0 days

### Stage Thresholds
- `S >= 120 days` → `burned` 
- `S >= 3 days` → `review`
- `S < 3 days` → `learning`

---

## Kịch bản 1: Học Thuận Lợi (All Good)

**Vocabulary: 日本語 (nihongo) - facet: meaning**

| Review # | Rating | Reps (trước→sau) | Stability (days) | Next Review | Stage |
|----------|--------|------------------|------------------|-------------|-------|
| 0 (new) | - | 0 | 0 | - | new |
| 1 (first learn) | `good` | 0→1 | 0.1 | +2.4h | learning |
| 2 | `good` | 1→2 | **0.166** (fixed) | +4h | learning |
| 3 | `good` | 2→3 | **0.333** (fixed) | +8h | learning |
| 4 | `good` | 3→4 | **1.0** (fixed) | +1 day | learning |
| 5 | `good` | 4→5 | **3.0** (fixed) | +3 days | **review** ✅ |
| 6 | `good` | 5→6 | 3.0 × 1.5 = **4.5** | +4.5 days | review |
| 7 | `good` | 6→7 | 4.5 × 1.5 = **6.75** | +1 week | review |
| 8 | `good` | 7→8 | 6.75 × 1.5 ≈ **10.1** | +10 days | review |
| 9 | `good` | 8→9 | 10.1 × 1.5 ≈ **15.2** | +2 weeks | review |
| 10 | `good` | 9→10 | 15.2 × 1.5 ≈ **22.8** | +3 weeks | review |
| 11 | `good` | 10→11 | 22.8 × 1.5 ≈ **34.2** | +1 month | review |
| 12 | `good` | 11→12 | 34.2 × 1.5 ≈ **51.3** | +~2 months | review |
| 13 | `good` | 12→13 | 51.3 × 1.5 ≈ **76.9** | +~2.5 months | review |
| 14 | `good` | 13→14 | 76.9 × 1.5 ≈ **115.4** | +~4 months | review |
| 15 | `good` | 14→15 | 115.4 × 1.5 ≈ **173** | +~6 months | **burned** 🔥 |

**Kết luận:** Từ `new` đến `burned` cần ~15 lần review đúng liên tiếp, mất khoảng **~1 năm**.

---

## Kịch bản 2: Fail Sớm Trong Learning Phase

**Kanji: 日 (hi/sun) - facet: reading**

| Review # | Rating | Reps | Stability | Next Review | Stage | Note |
|----------|--------|------|-----------|-------------|-------|------|
| 1 | `good` | 0→1 | 0.1 | +2.4h | learning | |
| 2 | `good` | 1→2 | 0.166 | +4h | learning | |
| 3 | **`again`** ❌ | 2→**1** | 0.166 × 0.4 = **0.066** | +1.6h | learning | Lapses: 1 |
| 4 | `good` | 1→2 | 0.166 (fixed) | +4h | learning | Back on track |
| 5 | `good` | 2→3 | 0.333 (fixed) | +8h | learning | |
| 6 | `good` | 3→4 | 1.0 (fixed) | +1 day | learning | |
| 7 | `good` | 4→5 | 3.0 (fixed) | +3 days | review | |

**Kết luận:** Fail ở giai đoạn learning chỉ làm lùi lại ~1-2 bước, khôi phục nhanh.

---

## Kịch bản 3: Fail Khi Đã Ở Review Stage (Critical!)

**Vocabulary: 食べる (taberu) - facet: meaning**

| Review # | Rating | Reps | Stability | Interval | Stage | Note |
|----------|--------|------|-----------|----------|-------|------|
| ... | `good` | 9 | 15.0 | +2 weeks | review | Đang review tốt |
| 10 | **`again`** ❌ | 9→**7** | 15.0 × 0.4 = **6.0** | +6 days | **learning** | Lapses: 1, Big reset! |
| 11 | `good` | 7→8 | 6.0 × 1.5 = 9.0 | +9 days | review | Recovering |
| 12 | `good` | 8→9 | 9.0 × 1.5 = 13.5 | +2 weeks | review | Almost back |
| 13 | `good` | 9→10 | 13.5 × 1.5 ≈ 20.2 | +3 weeks | review | Exceeded previous |

**Kết luận:** Fail khi stability cao (>3 days) gây hậu quả lớn:
- Stability giảm 60% (S × 0.4)
- Reps giảm 2
- **Stage về `learning`** dù stability vẫn > 3 days (code hiện tại force về learning)

---

## Kịch bản 4: Fail Liên Tiếp (Worst Case)

**Grammar: ～ても - facet: cloze**

| Review # | Rating | Reps | Stability | Interval | Stage | Lapses |
|----------|--------|------|-----------|----------|-------|--------|
| Start | - | 5 | 3.0 | - | review | 0 |
| 1 | **`again`** ❌ | 5→3 | 3.0 × 0.4 = **1.2** | +1.2 days | learning | 1 |
| 2 | **`again`** ❌ | 3→1 | max(0.1, 1.2 × 0.4) = **0.48** | +11.5h | learning | 2 |
| 3 | **`again`** ❌ | 1→**1** | max(0.1, 0.48 × 0.4) = **0.19** | +4.5h | learning | 3 |
| 4 | **`again`** ❌ | 1→1 | max(0.1, 0.19 × 0.4) = **0.1** (min) | +2.4h | learning | 4 |
| 5 | **`again`** ❌ | 1→1 | **0.1** (floor) | +2.4h | learning | 5 |

**Kết luận:** 
- Stability có sàn là **0.1 days** (~2.4 giờ)
- Reps có sàn là **1**
- Sau nhiều lần fail, item sẽ xuất hiện lại mỗi **~2.5 giờ** cho đến khi đúng

---

## Kịch bản 5: Independence Law (Vocabulary có 2 Facets)

**Vocabulary: 食べる (taberu)**

### Meaning Facet
| Review | Rating | Stability | Stage |
|--------|--------|-----------|-------|
| 1 | `good` | 0.1 → 0.166 | learning |
| 2 | `good` | 0.333 | learning |
| 3 | `good` | 1.0 | learning |
| 4 | `good` | **3.0** | review ✅ |

### Reading Facet (Same timeline, but failed once)
| Review | Rating | Stability | Stage |
|--------|--------|-----------|-------|
| 1 | `good` | 0.1 → 0.166 | learning |
| 2 | **`again`** ❌ | 0.066 | learning |
| 3 | `good` | 0.166 | learning |
| 4 | `good` | 0.333 | learning |

**Kết quả:**
- `meaning`: Stability = 3.0, Stage = `review` ✅
- `reading`: Stability = 0.333, Stage = `learning` ⏳

**→ Hai facets hoàn toàn độc lập! Fail reading không ảnh hưởng meaning.**

---

## Visual: State Machine

```
                    ┌──────────────────────────────────────┐
                    │                                      │
                    ▼                                      │
┌─────────┐   good   ┌───────────┐   S >= 3    ┌────────┐ │  S >= 120   ┌────────┐
│   NEW   │ ───────► │  LEARNING │ ──────────► │ REVIEW │ ─          ─► │ BURNED │
└─────────┘          └───────────┘              └────────┘               └────────┘
                           ▲                        │
                           │         again          │
                           │   (S×0.4, reps-2)      │
                           └────────────────────────┘
```

---

## Summary Table

| Scenario | Từ | Đến | Số reviews | Thời gian ~|
|----------|-----|-----|-----------|-----------|
| New → Review | `new` | `review` | 5 | ~2-3 ngày |
| Review → Burned | `review` | `burned` | ~10 | ~1 năm |
| Fail ở Learning | `learning` | `learning` | +1-2 | +4-8 giờ |
| Fail ở Review | `review` | `learning` | +3-4 | +1-2 tuần |
| Leech (5+ fails) | `learning` | `learning` | ∞ | Mỗi 2.4h |


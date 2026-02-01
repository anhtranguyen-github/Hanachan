# FSRS State Transition Scenarios - Hanachan v2

## Quy tắc cơ bản

### Formulas (FIF Updated)
*Cập nhật: 01/02/2026 - Sử dụng FIF Architecture*

| Rating | Stability Formula (New) | Reps | Lapses | Stage |
|--------|-------------------------|------|--------|-------|
| `good` | `S = S × 1.5 × (3/D)` | `reps++` | Không đổi | Xem ngưỡng |
| `again` | `S = S × exp(-0.3 × Intensity)` | `reps` resets (smartly) | `lapses++` | `learning` |

> *Trong đó: `Intensity = log2(wrongCount + 1)` (cường độ sai logarit)*


### Early Foundation (Overrides)
Khi `reps` còn nhỏ, stability được cố định:
- `reps = 1`: S = 0.166 days (~4 giờ)
- `reps = 2`: S = 0.333 days (~8 giờ)
- `reps = 3`: S = 1.0 days
- `reps = 4`: S = 3.0 days

### Stage Thresholds
- `S >= 120 days` → `burned` 
- `S >= 3 days` → `review`
- `S < 3 days` → `learning`

---

## Kịch bản 1: Học Thuận Lợi (All Good)
*(Giữ nguyên, không đổi)*

---

## Kịch bản 4: Fail Liên Tiếp (Drill Mode - FIF)

**Grammar: ～ても - facet: cloze**
Người dùng gặp khó khăn và sai liên tục 3 lần trước khi nhớ ra.

**Diễn biến Session:**
1.  Hỏi lần 1 -> SAI (Wrong=1). Hệ thống **không** trừ điểm. Requeue.
2.  Hỏi lần 2 -> SAI (Wrong=2). Hệ thống **không** trừ điểm. Requeue.
3.  Hỏi lần 3 -> SAI (Wrong=3). Hệ thống **không** trừ điểm. Requeue.
4.  Hỏi lần 4 -> ĐÚNG. **Chốt sổ (Commit)**.

**Tính toán FIF:**
- `WrongCount` = 3
- `Intensity` = `log2(3 + 1)` = `log2(4)` = **2.0**.
- `Original S` = 3.0 days.
- `Decay` = `exp(-0.3 × 2.0)` = `exp(-0.6)` ≈ **0.55**.
- `New S` = `3.0 × 0.55` = **1.65 days**.

| Trạng thái | Wrong Count | Stability | Next Review | Stage |
|------------|-------------|-----------|-------------|-------|
| Start | 0 | 3.0 | - | Review |
| **Commit (Sau 3 lần sai)** | **3** | **1.65** | +1.65 days | Learning |

**So sánh với Model cũ (First Attempt)**:
- Model cũ: Chỉ tính lần sai đầu tiên (Wrong=1) -> `Intensity` = 1 -> `S` = 3.0 * 0.74 = 2.22 days.
- Model cũ bỏ qua 2 lần sai sau -> Đánh giá chưa đủ nghiêm khắc với người "quên nhiều".
- **FIF**: Phạt nặng hơn (1.65 vs 2.22) nhưng không "phá hủy" thẻ (không về 0.1).

**Kết luận:** FIF phạt công bằng hơn: Sai nhiều phạt nhiều hơn, sai ít phạt ít, nhưng không bao giờ phạt theo cấp số nhân (Ease Hell).

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
| 2 | **`again`** ❌ | **0.1** (Min) | learning |
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
                           │     (FIF Decay)        │
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


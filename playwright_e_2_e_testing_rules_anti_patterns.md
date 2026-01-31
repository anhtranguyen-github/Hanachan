# Bộ quy tắc viết E2E Test với Playwright (rút ra từ các lỗi thực tế)

Tài liệu này tổng hợp **các quy tắc bắt buộc, điều cần tránh và ví dụ đúng/sai** khi viết E2E test với Playwright, đặc biệt cho các hệ thống có **flow phức tạp, backend async, SRS, discovery, onboarding**.

---

## 1. Nguyên tắc cốt lõi (Core Principles)

### 1.1 E2E test phải xác nhận *state*, không phải *celebration UI*

- UI như toast, text chúc mừng, animation **không phải state**
- State phải là:
  - URL
  - Component ổn định (testId)
  - Backend state (API / DB)

Sai:
```
expect(page.getByText('Excellent Work!')).toBeVisible();
```

Đúng:
```
expect(page).toHaveURL(/learn/);
expect(page.getByTestId('learning-session')).toBeVisible();
```

---

### 1.2 E2E không được giả định flow luôn chạy đủ các bước

- Discovery, Review, SRS Init đều có thể:
  - bị skip
  - short-circuit
  - không có dữ liệu

Test phải **chứng minh** mỗi bước đã xảy ra.

Sai:
```
// giả định discovery luôn chạy
await expect(page.getByTestId('review-complete')).toBeVisible();
```

Đúng:
```
await expect(page).toHaveURL(/discovery/);
await completeDiscovery();
await expect(page).not.toHaveURL(/discovery/);
```

---

## 2. Quy tắc về selector

### 2.1 Chỉ dùng getByTestId cho assertion quan trọng

- getByText chỉ dùng cho:
  - copy test
  - content test

Sai:
```
getByText('Excellent Work!')
```

Đúng:
```
getByTestId('review-complete-header')
```

---

### 2.2 Một testId = một business meaning

- Không dùng testId chung chung kiểu `container`, `wrapper`
- TestId phải thể hiện **trạng thái nghiệp vụ**

Ví dụ tốt:
- `discovery-session`
- `review-item`
- `review-complete-header`
- `empty-review-state`

---

## 3. Quy tắc về thời gian và chờ đợi (Waiting)

### 3.1 Cấm dùng waitForTimeout để chờ state

Sai (anti-pattern nghiêm trọng):
```
await page.waitForTimeout(1000);
```

Lý do:
- Không quan sát state
- Không fail đúng chỗ
- Gây deadlock

Đúng:
```
await expect(page.getByTestId('review-session')).toBeVisible();
```

---

### 3.2 Cấm loop + waitForTimeout

Sai:
```
while (!isLearning) {
  await page.waitForTimeout(500);
}
```

Đây là nguyên nhân trực tiếp gây test timeout 30s.

Đúng:
```
await expect.poll(async () => {
  return await getUserPhase();
}, { timeout: 10000 }).toBe('Learning');
```

---

### 3.3 Mọi wait đều phải có timeout hữu hạn

- Không chờ vô hạn
- Không chờ theo cảm giác

Đúng:
```
await page.waitForResponse(res =>
  res.url().includes('/srs/init') && res.ok(),
  { timeout: 10000 }
);
```

---

## 4. Quy tắc về backend async

### 4.1 Backend là source of truth, không phải UI

Nếu state phụ thuộc vào:
- DB
- job async
- queue

Thì test phải đồng bộ với backend.

Sai:
```
// chờ UI đổi
await expect(page.getByTestId('learning')).toBeVisible();
```

Đúng:
```
await page.waitForResponse(res =>
  res.url().includes('/user/state') && res.ok()
);
```

---

### 4.2 Không attach waitForResponse sau khi action đã xảy ra

Sai:
```
await page.click('button');
await page.waitForResponse('/srs/init');
```

Đúng:
```
const srsInit = page.waitForResponse('/srs/init');
await page.click('button');
await srsInit;
```

---

## 5. Quy tắc về user và dữ liệu test

### 5.1 Mỗi E2E test phải dùng user độc lập

- Không reuse user
- Không reuse auth session

Sai:
```
loginAs('test@test.com');
```

Đúng:
```
const email = `e2e_${Date.now()}@test.com`;
await loginAs(email);
```

---

### 5.2 Không giả định "new user" nếu không reset state

Nếu test cần new user, phải:
- seed user mới
- hoặc reset DB

Đúng:
```
await resetUserProgress(userId);
```

---

## 6. Quy tắc về flow orchestration

### 6.1 Test phải assert từng phase của state machine

Ví dụ state machine:
- New
- Discovery
- Learning
- Reviewing

Đúng:
```
await expectNewState();
await completeDiscovery();
await expectLearningState();
```

---

### 6.2 Chấp nhận nhánh hợp lệ trong business logic

Ví dụ:
- review có thể rỗng

Đúng:
```
await expect(
  page.getByTestId('review-complete-header')
    .or(page.getByTestId('empty-review-state'))
).toBeVisible();
```

---

## 7. Quy tắc về failure quality

### 7.1 Test phải fail sớm và rõ ràng

Sai:
- timeout 30s
- không biết fail ở đâu

Đúng:
```
expect(count).toBeGreaterThan(0); // fail ngay nếu discovery rỗng
```

---

### 7.2 Mỗi assertion phải trả lời câu hỏi nghiệp vụ

Tự hỏi:
- Assertion này chứng minh điều gì?
- Nếu fail, dev có biết sửa ở đâu không?

Nếu không trả lời được → assertion sai.

---

## 8. Tổng kết ngắn gọn

- E2E test = kiểm chứng nghiệp vụ, không phải UI animation
- Không loop + waitForTimeout
- Không giả định flow
- Backend là nguồn sự thật
- Mỗi test = một user
- Assert theo state machine

Nếu vi phạm các quy tắc trên, test **sẽ flaky hoặc deadlock**, không phải do Playwright mà do thiết kế test.


---
name: vn-orchestrator
description: Điều phối hội đồng vn-opc — đọc Brain, router phân loại, chạy debate workflow, 5 chặng pause/duyệt, sinh tài liệu. Dùng khi CEO gõ /vn-run hoặc yêu cầu họp bàn DN.
---

# Skill: vn-orchestrator

Skill này hướng dẫn Claude điều phối toàn bộ quy trình họp hội đồng vn-opc từ đầu đến cuối.
Thực hiện tuần tự theo 8 bước dưới đây. Mọi output đều bằng tiếng Việt, có TL;DR, định nghĩa thuật ngữ lần đầu xuất hiện.

---

## Bước 1 — Xác định vault

- Vault mặc định: `G:\My Drive\LS_OPC`
- MCP server: `obsidian-lsopc`
- Các tool dùng: `vault_read`, `vault_write`, `vault_list`
- Cho phép override: nếu người dùng chỉ định vault khác (qua tham số hoặc lời nhắn), dùng vault đó thay mặc định.

---

## Bước 2 — Đọc Brain

Đọc 5 file sau qua `vault_read`:

```
00-Brain/strategy.md
00-Brain/products.md
00-Brain/state.md
00-Brain/budget.md
00-Brain/headcount.md
```

Gộp nội dung 5 file thành một biến `brainContext` duy nhất để truyền vào workflow.
Nếu 1-2 file không tồn tại: ghi chú thiếu nhưng tiếp tục với dữ liệu còn lại.
Nếu thiếu ≥3 file hoặc thiếu file then chốt (strategy.md / state.md): chuyển sang Bước 4 (PAUSE 1).

---

## Bước 3 — Router phân loại brief

Đọc nội dung brief, tự quyết định danh sách `departments` (mã `dept-XX-<tên>`) dựa trên:

1. Nội dung brief khớp với lĩnh vực nào (tài chính, marketing, vận hành, pháp lý, v.v.)
2. Alias và phạm vi của từng phòng trong `knowledge/departments/*/department.yaml`

Phân loại quy mô:

| Loại | Số phòng | Khi nào dùng |
|------|----------|--------------|
| SIMPLE | 1–2 | Brief hẹp, 1 lĩnh vực rõ |
| COMPLEX | 3–6 | Brief liên phòng, cần phối hợp |
| STRATEGIC | 7–12 | Brief cấp chiến lược, ảnh hưởng toàn công ty |

**Không cố định số phòng.** Chọn đúng phòng liên quan, không triệu tập phòng không liên quan chỉ để đủ số.

**Active departments từ .vncoderc:** Trước khi fan-out, đọc `<vault>/.vncoderc`:
- Nếu có `active_departments` → router CHỈ chọn phòng trong danh sách đó (gồm 12 phòng nền + phòng pack ngành đã kích hoạt qua `/vn-onboard`).
- Nếu KHÔNG có `.vncoderc` hoặc thiếu key `active_departments` → mặc định dùng 12 phòng nền (01–12).
- Router vẫn tự quyết SỐ phòng theo độ phức tạp brief (SIMPLE/COMPLEX/STRATEGIC), nhưng chỉ chọn trong `active_departments` — không gọi phòng ngoài danh sách đó dù brief có liên quan.

---

## Bước 4 — PAUSE 1: Làm rõ (nếu cần)

**Điều kiện kích hoạt:** Brain thiếu thông tin then chốt để các phòng cho ý kiến chính xác (ví dụ: không có ngân sách, không có state hiện tại).

Nếu kích hoạt:
- Dùng `AskUserQuestion` hỏi CEO, mỗi câu kèm 2–4 phương án gợi ý
- Ghi câu trả lời vào `02-Tasks/<slug>/03-clarification.md` qua `vault_write`
- Bổ sung thông tin vào `brainContext` trước khi chạy workflow

Nếu Brain đủ: **bỏ qua bước này**, chuyển thẳng sang Bước 5.

Slug task: `YYYY-MM-DD-hhmm-<kebab-mô-tả-brief>` — lấy ngày giờ từ context hiện tại, không bịa ngày.

---

## Bước 5 — Chạy debate workflow

Gọi Workflow tool với:

```
script: workflows/debate.js
args: {
  brief:        <nội dung brief gốc>,
  brainContext: <brainContext đã gộp ở Bước 2>,
  departments:  <danh sách dept-XX-... đã chọn ở Bước 3>
}
```

Skill này được user chủ động gọi (`/vn-run`) nên đủ điều kiện opt-in để Workflow tool chạy.

Chờ workflow hoàn thành và nhận kết quả `{ views, debate, report }`.

---

## Bước 6 — PAUSE 2: CEO duyệt Decision Report

1. Ghi `report` vào `02-Tasks/<slug>/07-decision-report.md` qua `vault_write`
2. Trình CEO:
   - TL;DR 3 câu từ report
   - Hỏi: Duyệt báo cáo / Yêu cầu sửa (dùng `AskUserQuestion`, kèm phương án: Duyệt / Sửa phần X / Họp lại)
3. Nếu CEO yêu cầu sửa: chỉnh `report` theo feedback, ghi đè file, hỏi lại
4. Nếu CEO duyệt: chuyển sang Bước 7

---

## Bước 7 — PAUSE 3: CEO duyệt Execution Plan

1. Soạn `08-execution-plan.md` với cấu trúc:
   - Danh sách đầu việc có đánh số
   - Mỗi đầu việc: **[Hành động]** | Người/phòng phụ trách | KPI đo lường | Deadline
2. Ghi vào `02-Tasks/<slug>/08-execution-plan.md` qua `vault_write`
3. Dùng `AskUserQuestion` trình CEO duyệt (phương án: Duyệt / Sửa / Bổ sung KPI)
4. Điều chỉnh nếu cần, ghi đè file sau khi được duyệt

---

## Bước 8 — Render tài liệu (nếu task yêu cầu)

Nếu task cần xuất file .docx / .xlsx:

1. Gọi skill `office-docs` để render
2. Lưu output vào `03-Outputs/<slug>/`
3. Template ưu tiên theo thứ tự (BYOT 3 tầng):
   - Tầng 1: `vault/00-Templates-Custom/<dept>/<loại-tài-liệu>`
   - Tầng 2: `<plugin>/knowledge/templates-vn/<dept>/<loại-tài-liệu>`
   - Tầng 3: Default template tích hợp sẵn
4. Chọn template dựa vào: phòng chịu trách nhiệm + loại tài liệu (proposal, report, plan, v.v.)

---

## Quy ước chung

- **Slug task:** `YYYY-MM-DD-hhmm-<kebab-mô-tả>` — luôn dùng ngày giờ thực từ context
- **Ngôn ngữ:** Mọi output tiếng Việt. Giữ thuật ngữ tiếng Anh (KPI, OKR, ROAS...) nhưng định nghĩa lần đầu
- **CEO-friendly:** Mỗi output bắt đầu bằng TL;DR ≤3 câu trước khi đi vào chi tiết
- **Truy xuất được:** Mọi khuyến nghị phải ghi rõ phòng đề xuất, có thể trace về `views` JSON

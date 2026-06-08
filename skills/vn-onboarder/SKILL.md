---
name: vn-onboarder
description: Onboard DN vào vn-opc theo ngành — kích hoạt pack có sẵn hoặc sinh pack/agent/template mới (CEO duyệt). Dùng khi CEO gõ /vn-onboard hoặc thiết lập DN mới.
---

# Skill: vn-onboarder

Skill này hướng dẫn Claude thiết lập hệ thống vn-opc cho một doanh nghiệp mới theo ngành nghề cụ thể.
Thực hiện tuần tự 7 bước dưới đây. Mọi output bằng tiếng Việt, rõ ràng để CEO không cần đọc tài liệu kỹ thuật.

---

## Bước 1 — Nhận đầu vào

Thu thập thông tin từ tham số lệnh `/vn-onboard`:

- **Mô tả DN**: tên công ty, lĩnh vực kinh doanh chính, quy mô (nếu có)
- **Ngành**: từ khóa ngành rõ ràng (ví dụ: "nhà hàng", "spa", "logistics", "phần mềm B2B")
- **Vault**: đường dẫn đến vault Obsidian — mặc định `G:\My Drive\LS_OPC`, MCP server `obsidian-lsopc`

Nếu thiếu mô tả DN hoặc ngành, dùng `AskUserQuestion` hỏi CEO trước khi tiếp tục.

---

## Bước 2 — Detect & match pack có sẵn

Đọc file `target_industries` trong mọi pack hiện có:

```
knowledge/packs/*/pack.yaml
```

Với mỗi pack.yaml, so sánh keyword trong `target_industries` với ngành DN vừa nhận.

**Kết quả:**
- **KHỚP** (keyword ngành trùng hoặc gần đúng với ít nhất 1 entry trong `target_industries`): ghi nhận `pack_code` khớp → chuyển thẳng sang **Bước 6**.
- **KHÔNG KHỚP** (không tìm thấy pack phù hợp): chuyển sang **Bước 3**.

---

## Bước 3 — Đề xuất cấu trúc phòng ban (ngành lạ)

Gọi agent `pack-architect` ở **Chế Độ A** với:
- Mô tả DN + ngành từ Bước 1

Nhận về JSON:
```json
{
  "base_departments_applicable": [...],
  "new_departments": [...],
  "notes": "..."
}
```

---

## Bước 4 — PAUSE: CEO duyệt danh sách phòng

Trình CEO kết quả từ Bước 3 bằng `AskUserQuestion`:

**Hiển thị:**
1. Danh sách phòng nền áp dụng (từ `base_departments_applicable`) — tên + mã
2. Danh sách phòng mới đề xuất — mỗi phòng hiển thị: mã | tên | lý do | luật liên quan
3. Ghi chú tổng thể từ `notes`

**Câu hỏi CEO:**
> Xác nhận cấu trúc phòng ban này cho [tên DN]?

Phương án:
- **Duyệt toàn bộ** — tiến hành sinh tài liệu
- **Sửa danh sách** — CEO chỉ định phòng cần bỏ hoặc thêm, sau đó hỏi lại
- **Bỏ qua phòng mới, chỉ dùng 12 nền** — chuyển thẳng sang Bước 6 với 12 phòng nền

Chờ CEO xác nhận trước khi tiếp tục. Không tự ý tiến hành mà không có phê duyệt.

---

## Bước 5 — Sinh tài liệu (ngành lạ, sau khi CEO duyệt)

Gọi agent `pack-architect` ở **Chế Độ B** với danh sách phòng CEO đã duyệt + code ngành.

Ghi các file trả về vào đúng đường dẫn:

| Loại file | Đường dẫn |
|-----------|-----------|
| Persona agent mỗi phòng mới | `agents/<dept-code>-<slug>.md` |
| Pack YAML | `knowledge/packs/<code-ngành>/pack.yaml` |
| Template tài liệu | `knowledge/packs/<code-ngành>/templates/<dept>/<tên>.md` |

Sau khi ghi xong, ghi nhận `pack_code` = code ngành vừa tạo → tiếp tục Bước 6.

---

## Bước 6 — Kích hoạt cấu hình DN

Ghi (hoặc cập nhật nếu đã tồn tại) file `<vault>/.vncoderc` theo YAML:

```yaml
# Cấu hình vn-opc cho doanh nghiệp
# Tự động sinh bởi /vn-onboard — chỉnh sửa thủ công nếu cần
company_name: "<tên DN>"
industry: "<ngành>"
onboarded_at: "<YYYY-MM-DD>"

active_packs:
  - <pack_code>   # bỏ trống nếu chỉ dùng 12 phòng nền

active_departments:
  # 12 phòng nền luôn có mặt
  - 01-ceo
  - 02-hr
  - 03-finance
  - 04-legal
  - 05-operations
  - 06-sales
  - 07-marketing
  - 08-customer
  - 09-product
  - 10-tech
  - 11-data
  - 12-strategy
  # Phòng từ pack ngành (nếu có)
  # - 13-<slug>
  # - 14-<slug>
```

Điền đúng danh sách phòng theo kết quả Bước 4 (12 nền + phòng pack đã duyệt).

Nếu `.vncoderc` đã tồn tại: đọc trước, merge `active_departments` và `active_packs` — không xóa cấu hình cũ.

---

## Bước 7 — Báo cáo kết quả

Trình CEO tóm tắt:

1. **Pack kích hoạt**: tên pack + code (hoặc "12 phòng nền mặc định" nếu không có pack)
2. **Phòng ban active**: liệt kê tất cả phòng trong `active_departments` (mã + tên tiếng Việt)
3. **File đã tạo** (nếu sinh pack mới): liệt kê đường dẫn file
4. **Bước tiếp theo**: nhắc CEO gõ `/vn-run <brief>` để bắt đầu phiên họp hội đồng

---

## Ràng buộc

- **KHÔNG** sửa nội dung 12 phòng ban nền (mã 01–12) — chỉ được thêm phòng mới từ pack.
- Mã phòng mới luôn ≥ 13, không trùng với mã đã tồn tại trong `knowledge/departments/`.
- Mọi tài liệu sinh ra là MẪU — không phải tư vấn pháp lý chính thức.
- Không tiến hành Bước 5 khi chưa có xác nhận CEO ở Bước 4.
- Vault và MCP server dùng đúng theo Bước 1, không hardcode đường dẫn khác.

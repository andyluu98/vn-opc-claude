# vn-opc-claude

> **AI Operating System cho Công ty Việt Nam — chạy bằng Claude Code subscription, KHÔNG cần API key.**
> CEO chat 1 câu → **12 phòng ban AI họp bàn debate** → ra quyết định → sinh tài liệu `.docx/.xlsx` tuân thủ luật VN.

Đây là bản **port Claude-native** của [vn-one-person-company](https://github.com/andyluu98/vn-one-person-company) (bản gốc dùng Python + LangGraph + API key). Bản này đóng gói thành **Claude Code plugin**: dùng model Claude qua gói subscription (Opus/Sonnet), nghiên cứu bằng WebSearch tích hợp, lưu trữ qua Obsidian — **không tốn API key DeepSeek/Anthropic/Tavily**.

---

## ✨ Dành cho ai

Solo founder / DN nhỏ Việt Nam muốn có "ban điều hành ảo" 12 phòng ban (Pháp chế, Tài chính, Marketing, Vận hành...) để:
- Ra quyết định **dựa trên debate đa chiều** thay vì 1 góc nhìn.
- Sinh tài liệu **tuân thủ luật VN** (Luật DN 2020, BLLĐ 2019, TT 200/2014, NĐ 13/2023...).
- Mọi quyết định + tài liệu lưu **một nơi duy nhất** (Obsidian vault).
- **Không trả phí API** — chỉ cần gói Claude Code đang dùng.

---

## 🏗 Kiến trúc

```
/vn-run "<brief>"   (gõ trong Claude Code, trỏ tới vault của DN)
      ↓
[skill vn-orchestrator] đọc Brain (00-Brain) → Router phân loại task
      ↓
PAUSE 1 — Hỏi làm rõ (nếu Brain thiếu thông tin)
      ↓
[workflow debate.js] fan-out các phòng ban CHẠY SONG SONG
   → mỗi phòng nêu quan điểm → Pro/Con → 3 góc nhìn → kiểm chứng chéo
   → synthesizer tổng hợp
      ↓
07-decision-report.md  → PAUSE 2 — CEO duyệt
      ↓
08-execution-plan.md   → PAUSE 3 — CEO duyệt
      ↓
[skill office-docs] render .docx/.xlsx → 03-Outputs/
```

**Router tự quyết số phòng** tham gia theo độ phức tạp: SIMPLE (1-2), COMPLEX (3-6), STRATEGIC (7-12).

---

## 📦 Thành phần plugin

| Thư mục | Nội dung |
|---|---|
| `agents/` | 13 agent: 12 phòng ban (`dept-01-governance` … `dept-12-growth`) + `synthesizer`. Mỗi agent đọc persona chi tiết từ `knowledge/`. |
| `workflows/debate.js` | Engine debate: fan-out song song → Pro/Con → tổng hợp. |
| `skills/vn-orchestrator/` | Điều phối 5 chặng, router, đọc/ghi vault, nối office-docs. |
| `commands/` | `/vn-run`, `/vn-status`, `/vn-meeting`. |
| `knowledge/` | **192 template tiếng Việt** + **33 persona phòng ban** + 3 industry pack (F&B, Retail, Tech/SaaS) — vendored từ vn-one-person-company. |

**Model theo phòng:** Opus cho Pháp chế / Chiến lược / Tài chính / Synthesizer; Sonnet cho 9 phòng còn lại.

---

## 🔧 Yêu cầu

- **Claude Code** (CLI hoặc Desktop có tab Code) + gói subscription.
- **MCP Obsidian Local REST API** (khuyến nghị) — để đọc/ghi vault. Có thể đọc/ghi file trực tiếp nếu không dùng Obsidian.
- Skill `office-docs` (hoặc tương đương) để render `.docx/.xlsx` — tùy chọn.

> Không cần API key DeepSeek / Anthropic / Tavily.

---

## 🚀 Cài đặt

### Cách A — Qua plugin marketplace (Claude Code CLI hỗ trợ `/plugin`)
```
/plugin marketplace add https://github.com/andyluu98/vn-opc-claude
/plugin install vn-opc-claude
```
Restart Claude Code.

### Cách B — Thủ công (môi trường không có lệnh `/plugin`)
1. Clone repo về máy:
   ```bash
   git clone https://github.com/andyluu98/vn-opc-claude.git
   ```
2. Copy vào thư mục marketplace local của Claude:
   `~/.claude/plugins/marketplaces/<tên-marketplace>/vn-opc-claude`
3. Thêm entry vào `marketplace.json` + `installed_plugins.json` của marketplace đó.
4. **Quan trọng:** các agent đọc `knowledge/` bằng đường dẫn. Nếu CWD khi chạy khác thư mục plugin, sửa các tham chiếu `knowledge/...` trong `agents/*.md` + `skills/vn-orchestrator/SKILL.md` thành **đường dẫn tuyệt đối** tới `knowledge/` đã cài.
5. Restart Claude Code.

---

## 📂 Chuẩn bị Vault cho 1 DN

Tạo vault (thư mục) cho DN với cấu trúc:
```
<vault>/
├── 00-Brain/          strategy.md · products.md · state.md · budget.md · headcount.md
├── 00-Templates-Custom/   (template riêng của DN — ưu tiên cao nhất, BYOT)
├── 02-Tasks/          (mỗi task 1 thư mục: brief, clarification, decision-report, execution-plan)
└── 03-Outputs/        (.docx/.xlsx sinh ra)
```
Điền `00-Brain/` bằng thông tin DN (chiến lược, sản phẩm, trạng thái, ngân sách, nhân sự). Đây là "bộ não" các phòng ban đọc trước khi debate.

**Template ưu tiên (BYOT 3 tầng):** `vault/00-Templates-Custom/` > `knowledge/templates-vn/<phòng>/` > mặc định.

---

## 💬 Sử dụng

| Lệnh | Tác dụng |
|---|---|
| `/vn-onboard "<mô tả DN + ngành>"` | Thiết lập DN theo ngành: kích hoạt pack có sẵn, hoặc **sinh phòng ban + pack + template mới** (CEO duyệt) cho ngành lạ. |
| `/vn-status` | In trạng thái vault: vision, ICP, state, task gần đây. (Chạy nhanh, kiểm tra plugin sống.) |
| `/vn-run "<brief>"` | Chạy đầy đủ: đọc Brain → debate → quyết định → tài liệu. Có 3 điểm dừng CEO duyệt. |
| `/vn-meeting <task_folder>` | Chạy lại debate cho 1 task đã có. |

**Ví dụ:**
```
/vn-run Đánh giá hiệu quả marketing tháng 6 và đề xuất điều chỉnh tháng 7
/vn-run Soạn kế hoạch tuyển 1 trợ lý 8 triệu/tháng tại Q1, đúng luật lao động
/vn-run Có nên mở chi nhánh 1.2 tỷ Q3 không? Phân tích ROI + rủi ro
```

Lần đầu chạy tới bước debate, nếu Claude hỏi xác nhận dùng **Workflow** → đồng ý.

### Onboard theo ngành (`/vn-onboard`)

```
/vn-onboard "spa trị liệu cao cấp ở Q1 HCM"
```
- Ngành **có pack sẵn** (F&B / Retail / Tech-SaaS) → kích hoạt ngay: thêm phòng ban + role + luật ngành.
- Ngành **lạ** → agent `pack-architect` đề xuất phòng ban mới (vd 13-spa, 14-trị-liệu) + luật liên quan → **CEO duyệt** → sinh agent + `pack.yaml` + template → lưu vào `knowledge/packs/` (tái dùng cho DN khác) → kích hoạt cho vault qua `.vncoderc`.

Sau onboard, `/vn-run` sẽ debate với **12 phòng nền + phòng ngành** vừa thêm.

---

## 🔄 Quan hệ với bản Python (vn-one-person-company)

Hai hệ **bổ trợ nhau, dùng chung vault**:

| | vn-opc-claude (plugin) | vn-one-person-company (Python) |
|---|---|---|
| Model | Claude subscription (Opus/Sonnet) | DeepSeek / Anthropic API |
| Chi phí | Trong gói, không token thêm | Tốn token (rẻ) |
| Cách chạy | Tương tác trong Claude Code | Headless: cron / server / batch |
| Hợp cho | Chất lượng cao, hàng ngày | Tự động hóa, chạy nhiều DN |

Cùng quy ước vault + template → output 2 hệ đọc lẫn nhau, không phân nhánh dữ liệu.

---

## 📜 Nguồn gốc & giấy phép

- Template + persona phòng ban vendored từ [vn-one-person-company](https://github.com/andyluu98/vn-one-person-company).
- 192 template tuân thủ luật DN Việt Nam — đều là **MẪU**, cần luật sư/kế toán rà trước khi dùng chính thức.

---

**Tác giả:** [andyluu98](https://github.com/andyluu98)

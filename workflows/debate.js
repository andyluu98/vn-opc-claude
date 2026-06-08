export const meta = {
  name: 'vn-debate',
  description: 'Hội đồng phòng ban vn-opc debate 1 brief → decision report',
  phases: [{ title: 'Perspectives' }, { title: 'Debate' }, { title: 'Synthesize' }],
}

// args: { brief: string, brainContext: string, departments: string[] (vd ["dept-03-finance"]) }
const DEPTS = (args && args.departments) || []

const PERSPECTIVE_SCHEMA = {
  type: 'object',
  properties: {
    department:     { type: 'string' },
    role_used:      { type: 'string' },
    assessment:     { type: 'string' },
    recommendation: { type: 'string' },
    concerns:       { type: 'string' },
    citations:      { type: 'array', items: { type: 'string' } },
  },
  required: ['department', 'assessment', 'recommendation'],
}

// ── Phase 1: Thu thập quan điểm từng phòng song song ─────────────────────────
phase('Perspectives')

const views = (
  await parallel(
    DEPTS.map(d => () =>
      agent(
        `Brief:\n${args.brief}\n\nBrain context:\n${args.brainContext}\n\nNêu góc nhìn của phòng.`,
        { agentType: d, label: d, phase: 'Perspectives', schema: PERSPECTIVE_SCHEMA }
      )
    )
  )
).filter(Boolean)

// ── Phase 2: Tranh luận Pro/Con giữa các quan điểm ───────────────────────────
phase('Debate')

const debate = await agent(
  `Quan điểm các phòng:\n${JSON.stringify(views, null, 2)}\n\n` +
  `Tranh luận Pro/Con + 3 góc nhìn (Tăng trưởng / Thận trọng / Cân bằng). ` +
  `Đánh dấu claim thiếu căn cứ.`,
  { label: 'pro-con', phase: 'Debate' }
)

// ── Phase 3: Tổng hợp thành DECISION REPORT ───────────────────────────────────
phase('Synthesize')

const report = await agent(
  `Tổng hợp thành DECISION REPORT tiếng Việt theo cấu trúc synthesizer.\n\n` +
  `Quan điểm phòng:\n${JSON.stringify(views, null, 2)}\n\nTranh luận:\n${debate}`,
  { agentType: 'synthesizer', label: 'synthesizer', phase: 'Synthesize' }
)

return { views, debate, report }

/**
 * Cakra Solver — the seeded world-problem catalog.
 *
 * ~30 major, well-established world problems so the solver has a meaningful
 * backlog from day one (UN-SDG-style coverage, not a news feed — the
 * World-Solver routine adds *current* discoveries via public/solver/feed.json).
 * severity = harm caused (1–5) · tractability = how realistically a plan can
 * move it (1–5). The auto-queue prioritises severity × tractability.
 */

export interface CatalogProblem {
  catalogId: string
  title: string
  blurb: string
  category: string
  severity: number
  tractability: number
}

export const CATEGORIES = [
  'Climate & Environment',
  'Health & Disease',
  'Poverty & Inequality',
  'Education',
  'Food & Water',
  'Energy',
  'Governance & Rights',
  'Information & Media',
  'Technology Risk',
  'Resilience & Safety',
] as const

export const WORLD_CATALOG: CatalogProblem[] = [
  // ── Climate & Environment ──────────────────────────────────────────────────
  { catalogId: 'climate-mitigation', title: 'Greenhouse gas emissions', category: 'Climate & Environment', severity: 5, tractability: 3, blurb: 'Energy, industry, transport and land use still emit ~50+ Gt CO₂e a year, locking in warming beyond 1.5–2°C.' },
  { catalogId: 'climate-adaptation', title: 'Climate adaptation gap', category: 'Climate & Environment', severity: 4, tractability: 3, blurb: 'Communities most exposed to heat, floods and sea-level rise have the least funding and infrastructure to adapt.' },
  { catalogId: 'biodiversity-loss', title: 'Biodiversity collapse', category: 'Climate & Environment', severity: 5, tractability: 2, blurb: 'Habitat loss, overexploitation and climate change are driving extinction rates far above background levels.' },
  { catalogId: 'ocean-plastic', title: 'Plastic & ocean pollution', category: 'Climate & Environment', severity: 3, tractability: 3, blurb: 'Millions of tonnes of plastic enter the ocean yearly; waste systems in fast-growing regions can’t keep up.' },
  { catalogId: 'air-pollution', title: 'Air pollution', category: 'Climate & Environment', severity: 4, tractability: 4, blurb: 'Fine-particle pollution from fuels and fires contributes to ~7 million premature deaths every year.' },
  { catalogId: 'deforestation', title: 'Deforestation', category: 'Climate & Environment', severity: 4, tractability: 3, blurb: 'Tropical forests keep falling to agriculture and logging, releasing carbon and destroying ecosystems.' },

  // ── Health & Disease ───────────────────────────────────────────────────────
  { catalogId: 'pandemic-preparedness', title: 'Pandemic preparedness', category: 'Health & Disease', severity: 5, tractability: 3, blurb: 'Surveillance, vaccine platforms and health systems remain underfunded relative to the risk of the next pandemic.' },
  { catalogId: 'malaria-tb-hiv', title: 'Malaria, TB & HIV burden', category: 'Health & Disease', severity: 4, tractability: 4, blurb: 'Three treatable/preventable diseases still kill millions a year, concentrated in low-income countries.' },
  { catalogId: 'antimicrobial-resistance', title: 'Antimicrobial resistance', category: 'Health & Disease', severity: 4, tractability: 2, blurb: 'Overuse of antibiotics in medicine and farming is eroding humanity’s ability to treat common infections.' },
  { catalogId: 'maternal-child-health', title: 'Maternal & child mortality', category: 'Health & Disease', severity: 4, tractability: 4, blurb: 'Most maternal and under-5 deaths are preventable with known, cheap interventions that don’t reach everyone.' },
  { catalogId: 'mental-health', title: 'Mental health crisis', category: 'Health & Disease', severity: 4, tractability: 3, blurb: 'Depression and anxiety are leading causes of disability worldwide; most people get no effective care.' },
  { catalogId: 'road-safety', title: 'Road traffic deaths', category: 'Health & Disease', severity: 3, tractability: 4, blurb: '~1.2 million people die on roads each year; proven fixes (design, enforcement, vehicle standards) are unevenly applied.' },

  // ── Poverty & Inequality ───────────────────────────────────────────────────
  { catalogId: 'extreme-poverty', title: 'Extreme poverty', category: 'Poverty & Inequality', severity: 5, tractability: 3, blurb: 'Hundreds of millions live under ~$2.15/day, with progress stalled by conflict, debt and climate shocks.' },
  { catalogId: 'housing-affordability', title: 'Housing affordability', category: 'Poverty & Inequality', severity: 3, tractability: 3, blurb: 'Supply constraints and speculation push housing beyond reach in cities worldwide, driving homelessness.' },
  { catalogId: 'gender-inequality', title: 'Gender inequality', category: 'Poverty & Inequality', severity: 4, tractability: 3, blurb: 'Gaps in pay, safety, legal rights and unpaid care work hold back half the population in much of the world.' },
  { catalogId: 'youth-unemployment', title: 'Youth unemployment', category: 'Poverty & Inequality', severity: 3, tractability: 3, blurb: 'Hundreds of millions of young people are out of work or in informal jobs with no path to stability.' },

  // ── Education ──────────────────────────────────────────────────────────────
  { catalogId: 'learning-poverty', title: 'Learning poverty', category: 'Education', severity: 4, tractability: 4, blurb: 'A majority of 10-year-olds in low/middle-income countries cannot read a simple story, despite attending school.' },
  { catalogId: 'education-access', title: 'Out-of-school children', category: 'Education', severity: 4, tractability: 4, blurb: 'Roughly a quarter-billion children and youth are out of school — poverty, conflict and gender norms drive it.' },
  { catalogId: 'teacher-shortage', title: 'Global teacher shortage', category: 'Education', severity: 3, tractability: 3, blurb: 'Tens of millions more trained teachers are needed; low pay and status keep the pipeline empty.' },

  // ── Food & Water ───────────────────────────────────────────────────────────
  { catalogId: 'food-insecurity', title: 'Hunger & food insecurity', category: 'Food & Water', severity: 5, tractability: 3, blurb: 'Conflict, climate shocks and price spikes leave hundreds of millions acutely food-insecure each year.' },
  { catalogId: 'clean-water', title: 'Clean water access', category: 'Food & Water', severity: 4, tractability: 4, blurb: '~2 billion people lack safely managed drinking water; contaminated water still kills via diarrheal disease.' },
  { catalogId: 'sanitation', title: 'Sanitation gap', category: 'Food & Water', severity: 4, tractability: 4, blurb: 'Billions lack safe sanitation, spreading disease and keeping girls out of school in many regions.' },
  { catalogId: 'food-waste', title: 'Food loss & waste', category: 'Food & Water', severity: 3, tractability: 3, blurb: 'Around a third of food produced is lost or wasted while people go hungry — a solvable logistics problem.' },

  // ── Energy ─────────────────────────────────────────────────────────────────
  { catalogId: 'energy-access', title: 'Energy poverty', category: 'Energy', severity: 4, tractability: 4, blurb: 'Hundreds of millions still lack electricity, and billions cook with polluting fuels that damage health.' },
  { catalogId: 'grid-transition', title: 'Clean-energy grid transition', category: 'Energy', severity: 4, tractability: 3, blurb: 'Grids, storage and permitting lag far behind the renewable build-out needed to decarbonise electricity.' },

  // ── Governance & Rights ────────────────────────────────────────────────────
  { catalogId: 'corruption', title: 'Corruption', category: 'Governance & Rights', severity: 4, tractability: 2, blurb: 'Corruption drains trillions from public budgets and corrodes trust, hitting the poorest hardest.' },
  { catalogId: 'conflict-displacement', title: 'Conflict & forced displacement', category: 'Governance & Rights', severity: 5, tractability: 2, blurb: 'Wars and persecution have displaced over 100 million people — the highest number ever recorded.' },

  // ── Information & Media ────────────────────────────────────────────────────
  { catalogId: 'misinformation', title: 'Misinformation at scale', category: 'Information & Media', severity: 4, tractability: 2, blurb: 'Engagement-optimised platforms spread false and polarising content faster than corrections can follow.' },
  { catalogId: 'digital-divide', title: 'Digital divide', category: 'Information & Media', severity: 3, tractability: 4, blurb: 'A third of humanity is still offline, cut off from services, markets and learning the rest take for granted.' },

  // ── Technology Risk ────────────────────────────────────────────────────────
  { catalogId: 'ai-safety', title: 'AI safety & governance', category: 'Technology Risk', severity: 4, tractability: 3, blurb: 'Capabilities are outpacing evaluation, safety practice and governance for increasingly autonomous AI systems.' },
  { catalogId: 'cybersecurity', title: 'Cybercrime & infrastructure security', category: 'Technology Risk', severity: 4, tractability: 3, blurb: 'Ransomware and attacks on hospitals, utilities and small businesses cause trillions in damage a year.' },

  // ── Resilience & Safety ────────────────────────────────────────────────────
  { catalogId: 'disaster-resilience', title: 'Disaster resilience', category: 'Resilience & Safety', severity: 4, tractability: 4, blurb: 'Early-warning systems and resilient construction save lives cheaply, yet much of the world lacks both.' },
]

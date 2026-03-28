export const STATUS_ORDER = ['To Do', 'In Progress', 'Review', 'Complete'];
export const FALLBACK_STATUSES = STATUS_ORDER;

export const statusAccent = {
  'To Do': 'text-[#d7e4de] bg-white/5 border-white/10',
  'In Progress': 'text-[#8ff6d0] bg-[#8ff6d0]/10 border-[#8ff6d0]/20',
  Review: 'text-[#ffdb3c] bg-[#ffdb3c]/10 border-[#ffdb3c]/20',
  Complete: 'text-[#9dc4ff] bg-[#9dc4ff]/10 border-[#9dc4ff]/20',
};

export const statusGlow = {
  'To Do': 'from-white/10 to-white/[0.02]',
  'In Progress': 'from-[#8ff6d0]/16 to-white/[0.02]',
  Review: 'from-[#ffdb3c]/14 to-white/[0.02]',
  Complete: 'from-[#9dc4ff]/14 to-white/[0.02]',
};

export const statusTheme = {
  'To Do': {
    label: 'text-[#d7e4de]',
    pill: 'text-[#d7e4de] bg-white/5 border-white/10',
    fill: 'bg-white/60',
    glow: 'from-white/12 to-white/[0.02]',
  },
  'In Progress': {
    label: 'text-[#8ff6d0]',
    pill: 'text-[#8ff6d0] bg-[#8ff6d0]/10 border-[#8ff6d0]/20',
    fill: 'bg-[#8ff6d0]',
    glow: 'from-[#8ff6d0]/18 to-white/[0.02]',
  },
  Review: {
    label: 'text-[#ffdb3c]',
    pill: 'text-[#ffdb3c] bg-[#ffdb3c]/10 border-[#ffdb3c]/20',
    fill: 'bg-[#ffdb3c]',
    glow: 'from-[#ffdb3c]/18 to-white/[0.02]',
  },
  Complete: {
    label: 'text-[#9dc4ff]',
    pill: 'text-[#9dc4ff] bg-[#9dc4ff]/10 border-[#9dc4ff]/20',
    fill: 'bg-[#9dc4ff]',
    glow: 'from-[#9dc4ff]/18 to-white/[0.02]',
  },
};

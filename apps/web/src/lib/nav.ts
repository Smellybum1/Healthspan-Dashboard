export const NAV_ITEMS = [
  { to: '/', label: 'Today' },
  { to: '/discover', label: 'Discover' },
  { to: '/research', label: 'Research' },
  { to: '/trials', label: 'Trials' },
  { to: '/interventions', label: 'Interventions' },
  { to: '/peptides', label: 'Peptides' },
  { to: '/creators', label: 'Creators' },
  { to: '/safety', label: 'Safety & Regulation' },
  { to: '/sources', label: 'Source Health' },
  { to: '/watchlists', label: 'Watchlists' },
  { to: '/methodology', label: 'Methodology' },
  { to: '/settings', label: 'Settings' },
] as const;

export function formatWhen(iso: string | null | undefined) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function itemPath(type: string, id: string) {
  switch (type) {
    case 'paper':
      return `/research/${id}`;
    case 'trial':
      return `/trials/${id}`;
    case 'intervention':
      return `/interventions/${id}`;
    case 'peptide':
      return `/peptides/${id}`;
    case 'creator':
      return `/creators/${id}`;
    case 'regulatory_event':
      return `/safety?focus=${id}`;
    case 'claim':
      return `/creators`;
    default:
      return '/discover';
  }
}

/** Reader-facing groups for the guide collection, keyed by the `pattern` frontmatter field. */
export const GUIDE_GROUPS = [
  {
    id: 'vs',
    label: 'Comparisons',
    eyebrow: 'Comparison',
    intro: 'Where BluePainter sits next to the tools you may already use.'
  },
  {
    id: 'how-to-sync',
    label: 'Sync how-tos',
    eyebrow: 'How-to',
    intro: 'Component-by-component walkthroughs of the id contract that keeps canvas and TSX in step.'
  },
  {
    id: 'receipts-rule',
    label: "Designer's Receipts",
    eyebrow: "Designer's Receipts",
    intro: 'What each policy check looks at, and how its one-click fix writes back to code.'
  },
  {
    id: 'checklist',
    label: 'Checklists',
    eyebrow: 'Checklist',
    intro: 'Short, practical checklists pairing one policy rule with one kind of team.'
  },
  {
    id: 'best-for-niche',
    label: 'By team',
    eyebrow: 'By team',
    intro: 'How different kinds of product teams evaluate Figma-to-React handoff.'
  }
] as const;

const OTHER = { id: 'guide', label: 'More guides', eyebrow: 'Guide', intro: '' } as const;

export function guideGroup(pattern?: string) {
  return GUIDE_GROUPS.find((g) => g.id === pattern) ?? OTHER;
}

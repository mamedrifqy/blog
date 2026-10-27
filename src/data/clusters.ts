// Blog clusters. Every article carries a `cluster` id in its frontmatter
// (default: "thesis"). To add a new cluster, add an entry here and set
// `cluster: "<id>"` on its posts.
export interface Cluster {
  id: string;
  number: string;
  label: string;
  title: string;
  subtitle: string;
  blurb: string;
  /** Whether the cluster has a mind map (see src/data/thesis-mindmap.json). */
  mindmap?: boolean;
  /** Optional sub-headings: posts are placed by the first number of their `chapter` field. */
  groups?: { label: string; sub: string; majors: number[] }[];
}

export const clusters: Cluster[] = [
  {
    id: 'thesis',
    number: '01',
    label: 'Master’s thesis',
    title: 'ENSO, Climate Variability and Peatland Fire Hotspots in Bengkalis Regency, Riau Province, 2015–2024',
    subtitle: 'A spatiotemporal, statistical and machine-learning assessment for fire early warning',
    blurb:
      'Every post here comes from one thesis in the Master of Disaster Management programme at Universitas Riau: ' +
      'ten years of satellite hotspots across 11 sub-districts, read against ENSO, drought, peat, canals and land cover.',
    mindmap: true,
    groups: [
      { label: 'Framing the question', sub: 'Chapters 1–3 · background, design and the regional picture', majors: [1, 2, 3] },
      { label: 'What the data show', sub: 'Chapter 4 · results, section by section', majors: [4] },
      { label: 'What it means', sub: 'Chapters 5–6 · discussion, conclusions and recommendations', majors: [5, 6] },
    ],
  },
];

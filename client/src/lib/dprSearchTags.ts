type DprSearchSource = {
  projectId?: {
    projectName?: string;
    industrySector?: string;
    subSector?: string;
    location?: string;
    projectType?: string;
  } | null;
  schemeCode?: string | null;
  searchTags?: string[];
  status?: string;
  content?: any;
  eligibleSchemes?: { selectedSchemes?: string[] };
};

function pushPart(bag: Set<string>, value: unknown) {
  if (value == null) return;
  const text = String(value).trim();
  if (!text || text === '—' || /^unknown$/i.test(text)) return;
  text
    .split(/[,;/|]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 1 && part.length < 48)
    .forEach((part) => bag.add(part));
}

/** Keywords/tags a DPR card can be found by. */
export function collectDprSearchTags(dpr: DprSearchSource): string[] {
  const bag = new Set<string>();
  (dpr.searchTags || []).forEach((tag) => pushPart(bag, tag));

  const project = dpr.projectId || {};
  const english = dpr.content?.english || {};
  const cluster = english.clusterData || {};
  const step1 = cluster.step1 || {};
  const scheme =
    dpr.schemeCode ||
    english.matchedSchemeCode ||
    english.metadata?.matchedSchemeCode ||
    cluster.matchedSchemeCode ||
    null;

  if (project.projectType === 'individual' || english.metadata?.isIndividualDPR || english.isIndividualDPR) {
    pushPart(bag, 'Individual');
  } else if (project.projectType === 'cluster') {
    pushPart(bag, 'Cluster');
  }

  pushPart(bag, project.industrySector);
  pushPart(bag, project.subSector);
  pushPart(bag, project.location);
  pushPart(bag, step1.district);
  pushPart(bag, step1.natureOfBusiness);
  pushPart(bag, step1.majorProducts);
  pushPart(bag, scheme);
  (dpr.eligibleSchemes?.selectedSchemes || []).forEach((code) => pushPart(bag, code));

  return Array.from(bag);
}

export function dprSearchHaystack(dpr: DprSearchSource): string {
  const project = dpr.projectId || {};
  return [
    project.projectName,
    project.industrySector,
    project.subSector,
    project.location,
    project.projectType,
    dpr.schemeCode,
    dpr.status,
    ...collectDprSearchTags(dpr),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function dprSchemeCode(dpr: DprSearchSource): string {
  const english = dpr.content?.english || {};
  const cluster = english.clusterData || {};
  return String(
    dpr.schemeCode ||
      english.matchedSchemeCode ||
      english.metadata?.matchedSchemeCode ||
      cluster.matchedSchemeCode ||
      ''
  );
}


/** Map individual DPR store data onto the cluster payload the existing APIs/preview expect. */
export function toClusterPayload(data: any) {
  const step1 = data.step1 || {};
  const extras = data.schemeExtras || {};
  const step15 = data.step15 || {};
  const years = step15.yearProjections || [];

  return {
    ...data,
    isIndividualDPR: true,
    matchedSchemeCode: data.matchedSchemeCode || null,
    step1: {
      ...step1,
      clusterName: step1.clusterName || step1.unitName || 'Individual unit',
      enterpriseCount: step1.enterpriseCount || { micro: 1, small: 0, medium: 0 },
    },
    step11: {
      ...(data.step11 || {}),
      spvName: data.step11?.spvName || data.step11?.applicantName || step1.clusterName,
    },
    step15: {
      ...step15,
      profitAndLossProjections: years.length
        ? years.map((row: any) => ({
            year: row.year,
            revenue: row.sales,
            expenses: (row.rm || 0) + (row.wages || 0) + (row.power || 0),
            profit: row.netProfit,
          }))
        : step15.profitAndLossProjections,
    },
    schemeExtras: extras,
    metadata: {
      isIndividualDPR: true,
      matchedSchemeCode: data.matchedSchemeCode || null,
    },
  };
}

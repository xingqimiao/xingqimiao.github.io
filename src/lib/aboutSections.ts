export function splitAboutHtml(contentHtml: string, kiramyaoHtml?: string) {
  if (kiramyaoHtml) {
    return {
      organizationHtml: contentHtml,
      kiraMyaoHtml: kiramyaoHtml,
    };
  }
  const parts = (contentHtml || "").split(/<hr\s*\/?>/i);
  const organizationHtml = parts[0]?.trim() || contentHtml || "";
  const kiraMyaoHtml = parts.slice(1).join("<hr>").trim();

  return {
    organizationHtml,
    kiraMyaoHtml: kiraMyaoHtml || organizationHtml,
  };
}

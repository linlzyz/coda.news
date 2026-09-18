// Who operates coda.news. Shown in the footer, About page, legal pages and structured data.
export const SITE = {
  name: "coda.news",
  url: "https://coda.news",
  operator: "Pino Australia",
  city: "Melbourne, Australia",
  cityZh: "澳大利亚墨尔本",
  abn: "",               // fill in to show "ABN ..." in the footer and legal pages
  email: "hello@coda.news",
};
export const operatorLine = (zh = false) =>
  zh ? `由 ${SITE.operator} 运营 · ${SITE.cityZh}${SITE.abn ? ` · ABN ${SITE.abn}` : ""}`
     : `Operated by ${SITE.operator} · ${SITE.city}${SITE.abn ? ` · ABN ${SITE.abn}` : ""}`;

export const orgLd = {
  "@type": "NewsMediaOrganization", name: SITE.name, url: SITE.url, logo: { "@type": "ImageObject", url: `${SITE.url}/og.png` },
  email: SITE.email, parentOrganization: { "@type": "Organization", name: SITE.operator, address: { "@type": "PostalAddress", addressLocality: "Melbourne", addressRegion: "VIC", addressCountry: "AU" } },
  publishingPrinciples: `${SITE.url}/about#standards`, correctionsPolicy: `${SITE.url}/about#corrections`,
  ethicsPolicy: `${SITE.url}/about#standards`, ownershipFundingInfo: `${SITE.url}/about#who`, diversityPolicy: `${SITE.url}/sources`,
  contactPoint: { "@type": "ContactPoint", contactType: "editorial", email: SITE.email },
};

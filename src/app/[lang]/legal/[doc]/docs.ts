// Plain-language legal pages. Review with a qualified adviser before relying on them.
import { SITE } from "@/lib/site";
const CONTACT = SITE.email;
const OPERATOR = `${SITE.operator}${SITE.abn ? ` (ABN ${SITE.abn})` : ""}`;
const UPDATED = "18 September 2026";

export const DOCS: Record<string, { title: string; updated: string; sections: [string, string][] }> = {
  terms: {
    title: "Terms of Use", updated: UPDATED,
    sections: [
      ["About these terms", `coda.news ("Coda", "we", "us") is an online service operated by ${OPERATOR} in Melbourne, Australia, that summarises news and shows how media in different countries report the same events. By using coda.news you agree to these terms. If you do not agree, please do not use the site.`],
      ["What Coda provides", `Coda publishes short summaries, extracted facts, timelines and comparisons of coverage. These are generated automatically, largely by artificial intelligence, from publicly available news sources and official releases. We link to every original source.\n\nWe do not republish full articles. Headlines and short excerpts are shown only to identify and link to the original publisher.`],
      ["AI-generated content and accuracy", `Summaries, translations, perspective comparisons and analysis are produced automatically and may contain errors, omissions or out-of-date information. They describe how sources report an event; they are not statements of fact by Coda. Always check the original sources before relying on any information.\n\nIf you find an error, please tell us at ${CONTACT} and we will review it.`],
      ["Not financial or professional advice", `Nothing on coda.news is financial, investment, legal, tax or other professional advice. Market data is provided for general information only, may be delayed and may be inaccurate. Do not make decisions based solely on content from this site.`],
      ["Third-party content and links", `Coda links to websites operated by others. We do not control and are not responsible for their content, availability or practices. Trademarks, logos and names of companies and publications belong to their owners and are used only to identify them; their use does not imply endorsement.\n\nPhotographs are either official press images released by the organisation concerned or stock photographs licensed through Pexels, credited to their photographers.`],
      ["Intellectual property", `The coda.news name, logo, design and original compilation are ours. You may share links to Coda pages and quote short parts with attribution to coda.news. You may not scrape, copy or redistribute the site or its database in bulk, or use it to train or build a competing service, without our written permission.`],
      ["Acceptable use", `Do not misuse the site: no attempts to disrupt or overload it, access non-public areas, or use it for unlawful purposes.`],
      ["Copyright complaints", `If you believe content on Coda infringes your rights, email ${CONTACT} with the page link, the work concerned and your contact details. We will review and, where appropriate, remove it promptly.`],
      ["Liability", `To the extent permitted by law, the site is provided "as is" without warranties, and we are not liable for any loss arising from your use of it or reliance on its content. Nothing in these terms excludes rights you have under the Australian Consumer Law that cannot be excluded.`],
      ["Changes", `We may update the service and these terms. The date above shows the latest version. Continued use after changes means you accept them.`],
      ["Governing law and contact", `These terms are governed by the laws of Victoria, Australia. Questions: ${CONTACT}.`],
    ],
  },
  privacy: {
    title: "Privacy Policy", updated: UPDATED,
    sections: [
      ["Our approach", `We collect as little personal information as possible. This policy explains what we collect, why, and your choices. We handle personal information in line with the Australian Privacy Principles under the Privacy Act 1988 (Cth).`],
      ["What we collect", `Newsletter: if you subscribe to the Daily Coda, we store your email address, your language preference and the date you subscribed.\n\nPreferences: if you choose a language, it is stored in a cookie in your browser (see our Cookie Policy).\n\nTechnical data: our hosting providers automatically process standard technical information such as IP address, browser type and pages requested, to deliver and secure the site. We do not use this to identify you.\n\nVisitor statistics: we use Vercel Web Analytics to count page views and see which pages are read. It uses no cookies, does not store IP addresses and does not identify individual readers.\n\nWe do not use advertising trackers, sell personal information, or build profiles about readers.`],
      ["How we use it", `To send the newsletter you asked for, to operate, secure and improve the site, and to respond to messages you send us.`],
      ["Who processes it", `We use trusted service providers to run Coda: Vercel (website hosting), Supabase (database), and, when newsletters are sent, an email delivery provider. These providers may store data outside Australia, including in Singapore and the United States. We take reasonable steps to ensure they protect it.`],
      ["Your choices", `You can unsubscribe at any time using the link in any email, or by writing to us. You can ask to access or correct the information we hold about you, or ask us to delete it, by emailing ${CONTACT}.`],
      ["Security and retention", `We use reasonable technical measures to protect information. We keep newsletter details until you unsubscribe, then delete them. Technical logs are kept only for a short period by our providers.`],
      ["Complaints", `If you have a concern about how we handle your information, contact us first at ${CONTACT}. If you are not satisfied, you can contact the Office of the Australian Information Commissioner (oaic.gov.au).`],
      ["Changes", `We may update this policy. The date above shows the latest version.`],
    ],
  },
  cookies: {
    title: "Cookie Policy", updated: UPDATED,
    sections: [
      ["What cookies are", `Cookies are small text files stored by your browser. They let a website remember information between visits.`],
      ["Cookies we use", `lang: remembers whether you chose English or Chinese. It is set only when you use the language switch and lasts one year. It contains no personal information.\n\nThat is the only cookie coda.news sets. Our visitor statistics (Vercel Web Analytics) work without cookies. We do not use advertising or tracking cookies.`],
      ["Third parties", `Images are loaded from the image servers of their publishers (for example Pexels or a company's newsroom). Those servers receive standard technical information such as your IP address when your browser loads an image. Our hosting provider may use strictly necessary cookies to protect the site from abuse.`],
      ["Managing cookies", `You can block or delete cookies in your browser settings. If you block the language cookie, the site will simply show in English.`],
      ["Contact", `Questions: ${CONTACT}.`],
    ],
  },
};

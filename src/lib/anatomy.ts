// Coda Anatomy / Coda 剖面: long-form profiles that cut open one company, industry or turning point.
// Every figure carries a source number [[n]] that the page renders as a link to the source list.
// Rules: facts from the listed sources only; no investment advice; no personal wealth or family gossip.

export type L = { en: string; zh: string };
export type Figure = "cap" | "chiplet" | "revenue" | "vsintel" | "deals" | "timeline" | "countries" | "pricetags" | "pricetags2" | "split" | "royalty" | "model";
/** A freely licensed photo from Wikimedia Commons, hotlinked at a set width, always credited. */
/** `own`: an illustration made by coda.news (file is only a key for /public/anatomy-img), credited as such and never linked to Commons */
export type Photo = { file: string; credit: string; license: string; caption: L; alt: L; fit?: "cover" | "contain"; pos?: string; own?: boolean; ownCredit?: L };
/** Commons photos are copied once into /public/anatomy-img as WebP (scripts/anatomy-images.mts), so they load from our own CDN, not from Wikimedia in the US. */
export const photoKey = (file: string) => { let h = 5381; for (const c of file) h = ((h * 33) ^ c.codePointAt(0)!) >>> 0; return h.toString(36); };
export const PHOTO_WIDTHS = [800, 1600] as const;
export const photoUrl = (file: string, width = 1600) => `/anatomy-img/${photoKey(file)}-${width <= 900 ? 800 : 1600}.webp`;
export const photoSrcSet = (file: string) => PHOTO_WIDTHS.map((w) => `${photoUrl(file, w)} ${w}w`).join(", ");
/** the original on Commons, for the downloader */
export const commonsUrl = (file: string, width: number) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
export const photoPage = (file: string) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, "_"))}`;
export type Section = { id: string; h: L; paras: L[]; figure?: Figure | Figure[]; photo?: Photo };
export type Source = { n: number; name: string; title: string; url: string };
export type TimelineItem = { date: L; text: L; src: number[] };
export type CountryCard = { code: string; count: number; outlets: string; focus: L; headlines: { t: string; url: string; outlet: string }[] };
export type Point = { x: number; label: string; v: number };

export type Profile = {
  slug: string; no: number; companyId: number; companySlug: string;
  title: L; dek: L; social: L; published: string; updated: string; cover: Photo;
  /** what people search for: used in the <title> and meta description; the page itself shows `title` */
  seoTitle: L; seoDesc: L; keywords: string[];
  /** Instagram cover line: a stronger hook than the page title, never the same words; "\n" marks line ends on the slide */
  igHook: L;
  lede: L[]; sections: Section[]; timeline: TimelineItem[]; countries: CountryCard[]; sources: Source[];
  /** unit "n": a plain count, shown with `suffix`; `line` replaces the "from → to" money line on index cards, promos and the Story */
  stats: { label: L; from: number; to: number; fromLabel: L; toLabel: L; unit: "bn" | "pct" | "n"; suffix?: L; line?: L; src: number[] }[];
  /** a person issue: JSON-LD about a Person; `newsName` heads the live "Latest on" list (e.g. the company the person is tied to) */
  about?: "person"; newsName?: string;
  /** who the piece is about: the "Latest on …" heading, JSON-LD, and which live events count as being about it */
  name: string; legalName: string; newsMatch: { src: string; flags: string };
  /** sources listed even when no [[n]] marker points at them (chart data) */
  alwaysCite?: number[];
  /** the method note at the foot of the page */
  method: L;
  // figure data; each is only needed by the figures a profile uses
  cap?: Point[]; capMarks?: { x: number; label: L }[]; intel?: Point[]; revenue?: { year: number; v: number; dc?: number }[];
  deals?: { name: string; gw: number; date: L; src: number[] }[];
  /** horizontal bars of what the company was worth at set moments ($ billion) */
  priceTags?: PriceTags; priceTags2?: PriceTags;
  /** stacked yearly bars: part a + part b = total; rows without a split show the total only */
  split?: { title: L; note: L; a: L; b: L; rows: { label: string; total: number; a?: number; b?: number }[] };
  /** ranges in percent, e.g. royalty rates */
  royalty?: { title: L; note: L; col?: L; rows: { label: L; lo: number; hi: number; sub: L; approx?: boolean }[] };
  ig: IgSlides;
};

/** grey bars ("deal") and orange bars ("market"); `legend` renames the two, e.g. earlier deals vs this one */
export type PriceTags = { title: L; note: L; legend?: [L, L]; unit?: "n"; log?: boolean; rows: { label: L; v: number; kind: "deal" | "market" }[] };

/** Text for Instagram slides 2 to 5 and the Story; slide 1 is built from title, igHook and cover. */
export type IgSlides = {
  /** optional full-bleed poster cover for slide 1 instead of the photo card; "\n" breaks lines */
  poster?: { title: L; sub: L; line: L };
  /** optional plain-language slide ("start here"), shown after the cover: ?s=explain */
  explain?: { kicker: L; rows: { q: L; a: L }[] };
  numbers: { kicker: L; rows: { big: L; label: L; sub: L }[]; source: L };
  decisions: { h: L; tag: string; t: L }[];
  /** slide 3 heading; default "THREE DECISIONS" */
  decisionsKicker?: L;
  /** slide 4: "logcap" draws cap on a log scale with labelled marks [x, value, label, dx, dy, right-aligned]; "tags" draws priceTags as bars */
  chart: { kind: "logcap"; kicker: L; sub: L; foot: L; marks: [number, number, L, number, number, boolean][] } | { kind: "tags"; kicker: L; sub: L; foot: L };
  countries: { kicker: L; title: L; rows: { flags: string[]; name: L; t: L }[]; foot: L };
};

const AMD: Profile = {
  slug: "amd", no: 1, companyId: 18, companySlug: "amd",
  title: { en: "AMD, Rebuilt", zh: "AMD：重做一家公司" },
  dek: {
    en: "From Zen and TSMC to AI: the three changes of course that took AMD from about $2 billion to $1 trillion in twelve years.",
    zh: "从 Zen、台积电到 AI，AMD 用十二年完成的三次关键换轨。",
  },
  social: { en: "Three decisions that rebuilt AMD", zh: "三个决定，如何重做 AMD" },
  igHook: { en: "Three decisions took AMD from $2 billion to $1 trillion", zh: "三个决定，让 AMD 从 20 亿走到 1 万亿" },
  seoTitle: { en: "How AMD Went From Near Bankruptcy to $1 Trillion Under Lisa Su", zh: "AMD 如何从濒临破产到市值 1 万亿美元：苏姿丰的十二年" },
  seoDesc: {
    en: "AMD was worth about $2 billion in 2014 and passed $1 trillion in September 2026. The Zen chip design, TSMC and chiplets, data centres, Xilinx and AI deals with OpenAI and Meta, with every number sourced, and how media in four countries reported it.",
    zh: "2014 年市值约 20 亿美元，2026 年 9 月突破 1 万亿美元。Zen 架构、台积电代工与小芯片（chiplet）、数据中心、收购 Xilinx、OpenAI 与 Meta 的 AI 大单，每个数字附来源，以及四国媒体怎么报道。",
  },
  keywords: ["AMD", "Lisa Su", "苏姿丰", "AMD turnaround", "AMD 市值", "Zen", "chiplet", "TSMC", "台积电", "EPYC", "Xilinx", "MI450", "AMD vs Intel"],
  published: "2026-09-24", updated: "2026-09-24",
  cover: { file: "Zen2 Matisse Ryzen 7nm Core Die shot.jpg", credit: "Fritzchens Fritz", license: "CC0",
    caption: { en: "A Zen 2 compute die, the 7-nanometre chiplet made by TSMC, photographed under a microscope.", zh: "显微镜下的 Zen 2 计算芯片，也就是台积电 7 纳米工艺生产的小芯片。" },
    alt: { en: "Colourful microscope photo of an AMD Zen 2 chip die", zh: "AMD Zen 2 芯片裸片的彩色显微照片" } },
  lede: [
    {
      en: "On 21 September 2026, AMD's market value passed $1 trillion for the first time during trading [[20]][[21]]. At the end of 2014, weeks after Lisa Su became chief executive, it was worth about $2 billion [[7]]. The rise was not one lucky product. It was a set of decisions that depended on each other: a new chip design, a new way of making chips, and a new place to sell them.",
      zh: "2026 年 9 月 21 日，AMD 市值盘中首次突破 1 万亿美元 [[20]][[21]]。2014 年底，也就是苏姿丰出任 CEO 几周后，它的市值只有约 20 亿美元 [[7]]。这不是靠一款爆品翻身，而是一组互相依赖的决定：新的芯片设计，新的造芯方式，新的市场。",
    },
  ],
  sections: [
    {
      id: "bottom", h: { en: "The bottom", zh: "谷底" }, figure: "cap",
      photo: { file: "AMD CEO Lisa Su 20150603.jpg", credit: "Gene Wang", license: "CC BY 2.0", pos: "center 22%",
        caption: { en: "Lisa Su holding an AMD chip in June 2015, eight months into the job.", zh: "2015 年 6 月，上任约八个月的苏姿丰手持 AMD 芯片亮相。" }, alt: { en: "Lisa Su on stage holding a chip", zh: "苏姿丰在台上手持芯片" } },
      paras: [
        {
          en: "In 2006 AMD bought the graphics company ATI for about $5.4 billion, a price later widely judged too high, and its 2007 \"Barcelona\" server chip shipped with a bug [[6]]. In 2009 it moved its factories into a separate company, GlobalFoundries, and became a designer that still depended on its former plants [[5]].",
          zh: "2006 年，AMD 以约 54 亿美元收购显卡公司 ATI，这个价格后来普遍被认为过高；2007 年的 Barcelona 服务器芯片又出了设计缺陷 [[6]]。2009 年，AMD 把工厂拆分成独立的 GlobalFoundries，自己只做设计，但仍依赖原来的工厂 [[5]]。",
        },
        {
          en: "By 2014 the company lost $403 million on revenue of $5.51 billion [[1]], carried about $2.5 billion of debt, and bankruptcy was openly discussed [[3]]. On 8 October 2014 chief executive Rory Read stepped down and Lisa Su, an engineer, took over [[2]]. In 2016 the share price fell below $2 [[4]].",
          zh: "到 2014 年，公司营收 55.1 亿美元，净亏损 4.03 亿美元 [[1]]，负债约 25 亿美元，市场公开讨论破产的可能 [[3]]。2014 年 10 月 8 日，CEO Rory Read 卸任，工程师出身的苏姿丰接任 [[2]]。2016 年，股价一度跌破 2 美元 [[4]]。",
        },
      ],
    },
    {
      id: "zen", h: { en: "Decision one: a new design, not a patch", zh: "决定一：重新设计，而不是修补" },
      photo: { file: "AMD Ryzen 7 1800X.jpg", credit: "Brian Wong", license: "CC BY-SA 2.0",
        caption: { en: "A Ryzen 7 1800X, one of the first Zen desktop chips from 2017, in its socket.", zh: "Ryzen 7 1800X，2017 年第一批 Zen 台式机芯片之一，装在主板插槽上。" }, alt: { en: "AMD Ryzen processor in a motherboard socket", zh: "装在主板上的 AMD Ryzen 处理器" } },
      paras: [
        {
          en: "Instead of improving the processors it had, AMD put its limited money into a new design called Zen. The first Ryzen desktop chips went on sale on 2 March 2017, followed by EPYC server chips the same year [[2]]. For the first time in years, AMD's best chips competed with Intel's at the top of the market. Investors moved early: year-end market value rose from $2.3 billion in 2015 to $10.5 billion in 2016 [[7]].",
          zh: "AMD 没有继续修补旧处理器，而是把有限的钱集中投入一套全新设计 Zen。2017 年 3 月 2 日，第一批 Ryzen 台式机芯片上市，同年推出 EPYC 服务器芯片 [[2]]。多年来第一次，AMD 最好的芯片能和 Intel 的高端产品正面竞争。投资者提前反应：年底市值从 2015 年的 23 亿美元升到 2016 年的 105 亿美元 [[7]]。",
        },
      ],
    },
    {
      id: "tsmc", h: { en: "Decision two: let TSMC build it, in pieces", zh: "决定二：交给台积电，拆成小块来造" }, figure: "chiplet",
      photo: { file: "AMD@7nm(12nmIO)@Zen2@Matisse@Ryzen 5 3600@100-000000031 BF 1923SUT 9HM6935R90062 DSCx2@Infrared.jpg", credit: "Fritzchens Fritz", license: "CC0", fit: "contain",
        caption: { en: "Infrared photo through the lid of a Ryzen 5 3600: two separate chips in one package, a larger input/output die (12 nm) and a smaller compute die (7 nm).", zh: "透过 Ryzen 5 3600 外壳拍的红外照片：同一个封装里有两块独立芯片，较大的是 12 纳米的输入输出芯片，较小的是 7 纳米的计算芯片。" },
        alt: { en: "Infrared image showing two dies inside a Ryzen processor", zh: "红外照片中 Ryzen 处理器内部的两块芯片" } },
      paras: [
        {
          en: "In 2018 GlobalFoundries stopped developing its 7-nanometre process, and AMD moved its leading chips to TSMC [[2]]. At the same time it changed how the chips are built. Zen 2, launched in 2019, puts several small compute dies next to a separate input/output die in one package, the \"chiplet\" approach, and scales up to 64 cores in a server chip [[10]].",
          zh: "2018 年，GlobalFoundries 停止开发 7 纳米工艺，AMD 把最先进的芯片转交台积电生产 [[2]]。同时，它也改变了芯片的构造方式。2019 年的 Zen 2 把几块小的计算芯片和一块独立的输入输出芯片封装在一起，也就是 chiplet（小芯片）设计，服务器版本最多可达 64 核 [[10]]。",
        },
        {
          en: "Small dies are cheaper to make well: one defect ruins a small piece rather than a whole large chip, and the same piece can be combined into anything from a desktop part to a server part. AMD's year-end market value reached $53.7 billion in 2019 [[7]].",
          zh: "小芯片更容易造好：一个缺陷只报废一小块，而不是整块大芯片；同一种小芯片还能组合成从台式机到服务器的不同产品。2019 年底，AMD 市值达到 537 亿美元 [[7]]。",
        },
      ],
    },
    {
      id: "datacenter", h: { en: "Decision three: go where the servers are", zh: "决定三：去服务器所在的地方" }, figure: "revenue",
      photo: { file: "Amd epyc 7302 top side IMGP3332 smial wp.jpg", credit: "Smial", license: "FAL", fit: "contain",
        caption: { en: "An EPYC 7302P server processor. The lid reads \"Diffused in USA, Diffused in Taiwan\".", zh: "EPYC 7302P 服务器处理器，外壳上印着\"Diffused in USA, Diffused in Taiwan\"。" }, alt: { en: "AMD EPYC server processor", zh: "AMD EPYC 服务器处理器" } },
      paras: [
        {
          en: "PCs were a shrinking market; data centres were growing. EPYC gave AMD a way back into servers, where each chip sells for much more. In 2025 AMD's revenue was $34.6 billion, more than six times 2014, and the data centre segment alone brought in $16.6 billion, about 48% of the total [[9]][[19]].",
          zh: "PC 市场在萎缩，数据中心在增长。EPYC 让 AMD 重新进入服务器市场，那里每颗芯片的售价高得多。2025 年 AMD 营收 346 亿美元，是 2014 年的六倍多，其中数据中心业务单独贡献 166 亿美元，约占 48% [[9]][[19]]。",
        },
      ],
    },
    {
      id: "xilinx", h: { en: "Scale: Xilinx, and passing Intel", zh: "扩张：收购 Xilinx，市值超过 Intel" }, figure: "vsintel",
      photo: { file: "Xilinx Headquarters Sign - San Jose - California.jpg", credit: "Will Buckner", license: "CC BY 2.0",
        caption: { en: "Xilinx headquarters in San Jose, California, before the brand was folded into AMD.", zh: "Xilinx 位于加州圣何塞的总部，摄于品牌并入 AMD 之前。" }, alt: { en: "Xilinx headquarters sign", zh: "Xilinx 总部标牌" } },
      paras: [
        {
          en: "In October 2020 AMD agreed to buy the programmable-chip maker Xilinx in an all-stock deal worth about $35 billion at the time. When it closed on 14 February 2022 the deal was valued at about $49 billion, because AMD's own shares had risen, making it the largest chip acquisition to that date [[11]][[12]]. The next day AMD's market value, $197.75 billion, passed Intel's, $197.24 billion, for the first time [[13]].",
          zh: "2020 年 10 月，AMD 宣布以全股票方式收购可编程芯片公司 Xilinx，当时作价约 350 亿美元。2022 年 2 月 14 日完成时，由于 AMD 自身股价上涨，交易价值升至约 490 亿美元，成为当时最大的芯片并购 [[11]][[12]]。第二天，AMD 市值 1,977.5 亿美元，首次超过 Intel 的 1,972.4 亿美元 [[13]]。",
        },
        {
          en: "The lead was thin and did not last the year: at the end of 2022 Intel was slightly ahead again. Since the end of 2023 AMD has been larger at every year-end [[7]][[8]]. In 2024 it also agreed to buy server-rack maker ZT Systems for $4.9 billion [[2]].",
          zh: "这次领先差距很小，也没有维持到年底：2022 年末 Intel 又略微反超。从 2023 年底开始，AMD 每年年末市值都高于 Intel [[7]][[8]]。2024 年，AMD 又同意以 49 亿美元收购服务器机架公司 ZT Systems [[2]]。",
        },
      ],
    },
    {
      id: "ai", h: { en: "The AI turn: becoming the second source", zh: "AI 转向：成为第二供应商" }, figure: "deals",
      photo: { file: "AMD CEO Lisa Su speaking at ORNL 2019-05-07-2.jpg", credit: "Genevieve Martin, OLCF at ORNL", license: "CC BY 2.0", pos: "center 30%",
        caption: { en: "May 2019: Lisa Su at Oak Ridge National Laboratory, announcing that Cray and AMD would build the Frontier supercomputer.", zh: "2019 年 5 月，苏姿丰在美国橡树岭国家实验室宣布，Cray 与 AMD 将合作建造 Frontier 超级计算机。" }, alt: { en: "Lisa Su speaking at a podium at Oak Ridge National Laboratory", zh: "苏姿丰在橡树岭国家实验室的讲台上发言" } },
      paras: [
        {
          en: "AMD launched its Instinct MI300X AI accelerator on 6 December 2023 [[14]]. The larger shift came with multi-year capacity deals. On 6 October 2025 OpenAI agreed to deploy up to 6 gigawatts of AMD GPUs, starting with 1 gigawatt of MI450 chips in the second half of 2026, and AMD gave OpenAI warrants for up to 160 million shares tied to deployment milestones [[15]][[16]]. Oracle ordered 50,000 MI450 chips, Meta agreed to up to 6 gigawatts in February 2026, and Anthropic up to 2 gigawatts in July 2026 [[17]].",
          zh: "2023 年 12 月 6 日，AMD 发布 Instinct MI300X AI 加速器 [[14]]。更大的转变来自多年期的算力合约。2025 年 10 月 6 日，OpenAI 同意部署最多 6 吉瓦的 AMD GPU，首批 1 吉瓦 MI450 于 2026 年下半年开始；AMD 向 OpenAI 发行最多 1.6 亿股认股权证，按部署进度解锁 [[15]][[16]]。之后 Oracle 订购 5 万颗 MI450，Meta 在 2026 年 2 月签下最多 6 吉瓦，Anthropic 在 2026 年 7 月签下最多 2 吉瓦 [[17]]。",
        },
        {
          en: "Big buyers want a second supplier beside Nvidia [[22]]. In the second quarter of 2026 AMD reported record revenue of $11.5 billion, with data centre revenue more than doubling from a year earlier [[18]]. On 21 September its shares passed $600 and its market value $1 trillion [[20]][[21]].",
          zh: "大客户希望在英伟达之外有第二个供应商 [[22]]。2026 年第二季度，AMD 营收创纪录达 115 亿美元，数据中心营收同比增长超过一倍 [[18]]。9 月 21 日，股价突破 600 美元，市值突破 1 万亿美元 [[20]][[21]]。",
        },
      ],
    },
    { id: "timeline", h: { en: "Timeline", zh: "时间线" }, figure: "timeline", paras: [] },
    {
      id: "countries", h: { en: "One milestone, told three ways", zh: "同一个里程碑，三种讲法" }, figure: "countries",
      paras: [
        {
          en: "We looked at how outlets in our sources reported the $1 trillion milestone between 21 and 23 September 2026: 22 articles from four countries. This shows only what our sources carried; outlets elsewhere may have covered it too.",
          zh: "我们查看了 2026 年 9 月 21 日至 23 日，收录来源中关于 AMD 市值破万亿的报道：4 个国家，共 22 篇。这里只反映我们收录的来源，其他媒体也可能有报道。",
        },
      ],
    },
    {
      id: "open", h: { en: "What is not settled", zh: "还没有答案的问题" },
      photo: { file: "2485 Augustine Drive headquarters in Santa Clara, California.jpg", credit: "Coolcaesar", license: "CC BY-SA 4.0",
        caption: { en: "AMD headquarters in Santa Clara, California.", zh: "AMD 位于美国加州圣克拉拉的总部。" }, alt: { en: "AMD headquarters building", zh: "AMD 总部大楼" } },
      paras: [
        { en: "Software. Nvidia's CUDA has been the default for AI developers for years; AMD's ROCm still has to prove it can match it at scale [[22]].", zh: "软件。英伟达的 CUDA 多年来是 AI 开发者的默认选择，AMD 的 ROCm 仍需证明能在大规模部署中追上 [[22]]。" },
        { en: "Delivery. The OpenAI, Meta and Anthropic agreements are \"up to\" capacity over several years, and the MI450 and Helios racks only begin shipping in volume in the second half of 2026 [[17]][[31]].", zh: "交付。OpenAI、Meta、Anthropic 的协议都是多年期的\"最多\"容量，MI450 和 Helios 机架从 2026 年下半年才开始大规模出货 [[17]][[31]]。" },
        { en: "Concentration and price. A few very large customers now matter a great deal, the OpenAI warrants add shares, and the market value reflects revenue expected rather than revenue already earned [[16]].", zh: "客户集中与估值。少数几家大客户的份量很重，给 OpenAI 的认股权证会增加股本，而当前市值反映的是预期收入，不是已经实现的收入 [[16]]。" },
      ],
    },
  ],
  timeline: [
    { date: { en: "Jul 2006", zh: "2006 年 7 月" }, text: { en: "Buys ATI for about $5.4 billion", zh: "以约 54 亿美元收购 ATI" }, src: [6] },
    { date: { en: "Mar 2009", zh: "2009 年 3 月" }, text: { en: "Factories spun off as GlobalFoundries", zh: "工厂拆分为 GlobalFoundries" }, src: [5] },
    { date: { en: "Oct 2014", zh: "2014 年 10 月" }, text: { en: "Lisa Su becomes CEO; 2014 net loss $403 million", zh: "苏姿丰出任 CEO；2014 年净亏损 4.03 亿美元" }, src: [2, 1] },
    { date: { en: "2016", zh: "2016 年" }, text: { en: "Shares fall below $2", zh: "股价跌破 2 美元" }, src: [4] },
    { date: { en: "Mar 2017", zh: "2017 年 3 月" }, text: { en: "First Zen chips: Ryzen; EPYC servers later that year", zh: "首批 Zen 芯片 Ryzen 上市，同年推出 EPYC 服务器芯片" }, src: [2] },
    { date: { en: "2018", zh: "2018 年" }, text: { en: "Leading chips move to TSMC", zh: "先进芯片转由台积电生产" }, src: [2] },
    { date: { en: "2019", zh: "2019 年" }, text: { en: "Zen 2 chiplet design, up to 64 cores", zh: "Zen 2 采用 chiplet 设计，最多 64 核" }, src: [10] },
    { date: { en: "Feb 2022", zh: "2022 年 2 月" }, text: { en: "Xilinx deal closes (~$49 billion); market value passes Intel", zh: "完成收购 Xilinx（约 490 亿美元）；市值首次超过 Intel" }, src: [11, 13] },
    { date: { en: "Dec 2023", zh: "2023 年 12 月" }, text: { en: "Instinct MI300X AI accelerator launched", zh: "发布 Instinct MI300X AI 加速器" }, src: [14] },
    { date: { en: "Oct 2025", zh: "2025 年 10 月" }, text: { en: "OpenAI: up to 6 GW; Oracle: 50,000 MI450", zh: "OpenAI 最多 6 吉瓦；Oracle 订购 5 万颗 MI450" }, src: [15, 17] },
    { date: { en: "Feb 2026", zh: "2026 年 2 月" }, text: { en: "Meta: up to 6 GW of custom MI450", zh: "Meta 最多 6 吉瓦定制 MI450" }, src: [17] },
    { date: { en: "Jul 2026", zh: "2026 年 7 月" }, text: { en: "Anthropic: up to 2 GW; Zen 6 \"Venice\" server chips", zh: "Anthropic 最多 2 吉瓦；Zen 6 \"Venice\" 服务器芯片上市" }, src: [17] },
    { date: { en: "Aug 2026", zh: "2026 年 8 月" }, text: { en: "Record quarter: $11.5 billion revenue", zh: "单季营收创纪录，115 亿美元" }, src: [18] },
    { date: { en: "21 Sep 2026", zh: "2026 年 9 月 21 日" }, text: { en: "Market value passes $1 trillion", zh: "市值突破 1 万亿美元" }, src: [20, 21] },
  ],
  countries: [
    {
      code: "US", count: 8, outlets: "CNBC, Yahoo Finance, Investor's Business Daily",
      focus: { en: "The stock: the five-day rally, a 10% chip price rise, and whether it is still worth buying. Some pieces credit Lisa Su's leadership.", zh: "股票本身：连续五天上涨、芯片提价 10%、现在还值不值得买。部分文章把功劳归于苏姿丰的领导。" },
      headlines: [
        { t: "AMD hits $1 trillion market cap as stock continues 5-day rally", outlet: "CNBC", url: "https://www.cnbc.com/2026/09/21/amd-stock-1-trillion-value.html" },
        { t: "AMD Just Crossed $1 Trillion. Is it Still Worth Buying Now?", outlet: "Yahoo Finance", url: "https://finance.yahoo.com/markets/stocks/articles/amd-just-crossed-1-trillion-143201763.html" },
        { t: "Why AMD's new $1 trillion valuation makes perfect sense", outlet: "Yahoo Finance", url: "https://finance.yahoo.com/markets/stocks/article/why-amds-new-1-trillion-valuation-makes-perfect-sense-093453726.html" },
      ],
    },
    {
      code: "SG", count: 4, outlets: "CNA, The Straits Times",
      focus: { en: "The industry: AMD as one of several chipmakers lifted by demand for AI computing.", zh: "整个行业：AMD 是被 AI 算力需求带动上涨的几家芯片公司之一。" },
      headlines: [
        { t: "AMD joins $1 trillion club as chipmakers rally on AI-driven demand", outlet: "The Straits Times", url: "https://www.straitstimes.com/business/amd-joins-1-trillion-club-as-chipmakers-rally-on-ai-driven-demand" },
        { t: "AMD becomes latest chipmaker to reach $1 trillion valuation on AI demand", outlet: "CNA", url: "https://www.channelnewsasia.com/business/amd-becomes-latest-chipmaker-reach-1-trillion-valuation-ai-demand-6400021" },
      ],
    },
    {
      code: "IN", count: 1, outlets: "The Economic Times",
      focus: { en: "One article, with the same industry-wide framing as Singapore.", zh: "一篇，和新加坡一样是整个行业的角度。" },
      headlines: [
        { t: "AMD becomes latest chipmaker to reach $1 trillion valuation on AI demand", outlet: "The Economic Times", url: "https://economictimes.indiatimes.com/tech/technology/amd-becomes-latest-chipmaker-to-reach-1-trillion-valuation-on-ai-demand/articleshow/134391889.cms" },
      ],
    },
    {
      code: "CN", count: 9, outlets: "IT之家, cnBeta, 36氪, 央视财经, 21世纪经济报道, 虎嗅",
      focus: { en: "First the milestone itself, often converted into yuan and placed in morning news roundups; then longer pieces on twelve years under Lisa Su, the data centre business and AMD's role as the \"second choice\" beside Nvidia.", zh: "先报道里程碑本身，常换算成人民币，并放进早间新闻合集；之后是长文，讲苏姿丰的十二年、数据中心业务，以及 AMD 作为英伟达之外\"第二选择\"的位置。" },
      headlines: [
        { t: "AMD 市值盘中一度突破 1 万亿美元", outlet: "IT之家", url: "https://www.ithome.com/1/005/453.htm" },
        { t: "连续五个交易日上涨 AMD市值首次突破1万亿美元", outlet: "cnBeta", url: "https://www.cnbeta.com.tw/articles/tech/1579072.htm" },
        { t: "1万亿的AMD 苏姿丰的12年", outlet: "虎嗅", url: "https://www.huxiu.com/article/4893413.html" },
      ],
    },
  ],
  sources: [
    { n: 1, name: "AMD", title: "AMD Reports 2014 Fourth Quarter and Annual Results", url: "https://ir.amd.com/news-events/press-releases/detail/589/amd-reports-2014-fourth-quarter-and-annual-results" },
    { n: 2, name: "Wikipedia", title: "AMD", url: "https://en.wikipedia.org/wiki/AMD" },
    { n: 3, name: "VnExpress International", title: "How MIT Ph.D. Lisa Su turned AMD from near collapse into an AI chip powerhouse", url: "https://e.vnexpress.net/news/tech/personalities/how-mit-ph-d-lisa-su-turned-amd-from-near-collapse-into-a-675b-ai-chip-powerhouse-5076201.html" },
    { n: 4, name: "Fortune", title: "Businessperson of the Year 2020: Lisa Su", url: "https://fortune.com/businessperson-of-the-year/2020/lisa-su" },
    { n: 5, name: "Engadget", title: "AMD announces GlobalFoundries spin-off (4 March 2009)", url: "https://www.engadget.com/2009-03-04-amd-announces-globalfoundries-spin-off-forgets-to-name-it-somet.html" },
    { n: 6, name: "Trove Finance", title: "Can AMD challenge Nvidia for supremacy?", url: "https://trovefinance.substack.com/p/-can-amd-challenge-nvidia-for-supremacy" },
    { n: 7, name: "CompaniesMarketCap", title: "AMD market capitalization (year-end)", url: "https://companiesmarketcap.com/amd/marketcap/" },
    { n: 8, name: "CompaniesMarketCap", title: "Intel market capitalization (year-end)", url: "https://companiesmarketcap.com/intel/marketcap/" },
    { n: 9, name: "CompaniesMarketCap", title: "AMD annual revenue", url: "https://companiesmarketcap.com/amd/revenue/" },
    { n: 10, name: "Wccftech", title: "AMD officially talks Zen 2 CPU architecture", url: "https://wccftech.com/amd-zen-2-7nm-cpu-architecture-epyc-rome-and-ryzen-official/" },
    { n: 11, name: "AMD", title: "AMD Completes Acquisition of Xilinx (14 Feb 2022)", url: "https://www.amd.com/en/newsroom/press-releases/2022-2-14-amd-completes-acquisition-of-xilinx.html" },
    { n: 12, name: "Electronic Design", title: "AMD closes $49 billion acquisition of Xilinx", url: "https://www.electronicdesign.com/technologies/embedded/article/21216849/electronic-design-amd-closes-49-billion-acquisition-of-xilinxlargest-chip-deal-ever" },
    { n: 13, name: "Tom's Hardware", title: "AMD's market cap surpasses Intel for the first time", url: "https://www.tomshardware.com/news/amds-market-cap-surpasses-intel" },
    { n: 14, name: "AMD", title: "AMD delivers data center AI solutions with Instinct MI300 Series (6 Dec 2023)", url: "https://www.amd.com/en/newsroom/press-releases/2023-12-6-amd-delivers-leadership-portfolio-of-data-center-a.html" },
    { n: 15, name: "OpenAI", title: "AMD and OpenAI announce strategic partnership to deploy 6 gigawatts of AMD GPUs", url: "https://openai.com/index/openai-amd-strategic-partnership/" },
    { n: 16, name: "Futurum", title: "AMD OpenAI partnership: scale win or execution risk at 6 GW?", url: "https://futurumgroup.com/insights/amd-openai-partnership-scale-win-or-execution-risk-at-6-gw/" },
    { n: 17, name: "metir", title: "AMD Advancing AI 2026: MI450, Helios and the Nvidia fight", url: "https://www.metirai.com/blog/amd-advancing-ai-2026-mi450-helios-instinct-nvidia-challenge" },
    { n: 18, name: "Yahoo Finance", title: "AMD Q2 2026 earnings call highlights", url: "https://finance.yahoo.com/markets/stocks/articles/advanced-micro-devices-inc-amd-050250626.html" },
    { n: 19, name: "AMD", title: "AMD Reports Fourth Quarter and Full Year 2025 Financial Results", url: "https://ir.amd.com/news-events/press-releases/detail/1276/amd-reports-fourth-quarter-and-full-year-2025-financial-results" },
    { n: 20, name: "CNBC", title: "AMD hits $1 trillion market cap as stock continues 5-day rally", url: "https://www.cnbc.com/2026/09/21/amd-stock-1-trillion-value.html" },
    { n: 21, name: "IT之家", title: "AMD 市值盘中一度突破 1 万亿美元", url: "https://www.ithome.com/1/005/453.htm" },
    { n: 22, name: "虎嗅", title: "1万亿的AMD 苏姿丰的12年", url: "https://www.huxiu.com/article/4893413.html" },
    { n: 31, name: "DCD", title: "AMD posts Q1 2026 data center revenue of $5.8bn", url: "https://www.datacenterdynamics.com/en/news/amd-posts-q1-2026-data-center-revenue-of-58bn-forecasts-120bn-server-cpu-income-by-2030/" },
  ],
  stats: [
    { label: { en: "Market value", zh: "市值" }, from: 2.07, to: 1003, fromLabel: { en: "end of 2014", zh: "2014 年底" }, toLabel: { en: "Sep 2026", zh: "2026 年 9 月" }, unit: "bn", src: [7] },
    { label: { en: "Annual revenue", zh: "年营收" }, from: 5.51, to: 34.6, fromLabel: { en: "2014", zh: "2014 年" }, toLabel: { en: "2025", zh: "2025 年" }, unit: "bn", src: [1, 19] },
    { label: { en: "Data centre share of revenue", zh: "数据中心占营收" }, from: 0, to: 48, fromLabel: { en: "", zh: "" }, toLabel: { en: "2025", zh: "2025 年" }, unit: "pct", src: [19] },
  ],
  // year-end market value, $ billion [7][8]; x = decimal year, so the end of 2014 is 2014.99; the last point is 21 Sept 2026
  cap: [
    { x: 2014.99, label: "2014", v: 2.07 }, { x: 2015.99, label: "2015", v: 2.27 }, { x: 2016.99, label: "2016", v: 10.51 }, { x: 2017.99, label: "2017", v: 9.91 },
    { x: 2018.99, label: "2018", v: 18.55 }, { x: 2019.99, label: "2019", v: 53.65 }, { x: 2020.99, label: "2020", v: 110.42 }, { x: 2021.99, label: "2021", v: 173.77 },
    { x: 2022.99, label: "2022", v: 104.43 }, { x: 2023.99, label: "2023", v: 238.14 }, { x: 2024.99, label: "2024", v: 203.15 }, { x: 2025.99, label: "2025", v: 350.01 },
    { x: 2026.72, label: "Sep 2026", v: 1003 },
  ],
  intel: [
    { x: 2014.99, label: "2014", v: 172.3 }, { x: 2015.99, label: "2015", v: 162.77 }, { x: 2016.99, label: "2016", v: 171.88 }, { x: 2017.99, label: "2017", v: 216.02 },
    { x: 2018.99, label: "2018", v: 211.93 }, { x: 2019.99, label: "2019", v: 256.75 }, { x: 2020.99, label: "2020", v: 204.16 }, { x: 2021.99, label: "2021", v: 209.6 },
    { x: 2022.99, label: "2022", v: 109.07 }, { x: 2023.99, label: "2023", v: 211.85 }, { x: 2024.99, label: "2024", v: 87.55 }, { x: 2025.99, label: "2025", v: 172.67 },
    { x: 2026.72, label: "Sep 2026", v: 654.73 },
  ],
  // $ billion [9]; 2025 data centre segment [19]
  revenue: [
    { year: 2014, v: 5.51 }, { year: 2015, v: 3.99 }, { year: 2016, v: 4.27 }, { year: 2017, v: 5.39 }, { year: 2018, v: 6.47 }, { year: 2019, v: 6.73 },
    { year: 2020, v: 9.76 }, { year: 2021, v: 16.43 }, { year: 2022, v: 23.6 }, { year: 2023, v: 22.68 }, { year: 2024, v: 25.78 }, { year: 2025, v: 34.63, dc: 16.6 },
  ],
  deals: [
    { name: "OpenAI", gw: 6, date: { en: "Oct 2025", zh: "2025 年 10 月" }, src: [15] },
    { name: "Meta", gw: 6, date: { en: "Feb 2026", zh: "2026 年 2 月" }, src: [17] },
    { name: "Anthropic", gw: 2, date: { en: "Jul 2026", zh: "2026 年 7 月" }, src: [17] },
  ],
  name: "AMD", legalName: "Advanced Micro Devices, Inc.", newsMatch: { src: "\\bAMD\\b|Advanced Micro Devices|超威", flags: "i" },
  alwaysCite: [7, 8, 9, 13, 17],
  method: {
    en: "Method: drafted with AI from the sources above and checked line by line by an editor. Market values are year-end figures and may differ slightly between data providers. This is not investment advice. Found a mistake? Email ",
    zh: "写法：本文由 AI 根据上列来源整理，编辑逐条核对。市值为年末数据，可能与其他数据商略有出入。本文不构成投资建议。发现错误请写信到 ",
  },
  capMarks: [
    { x: 2014.77, label: { en: "Oct 2014: Lisa Su becomes CEO", zh: "2014.10 苏姿丰出任 CEO" } },
    { x: 2017.17, label: { en: "Mar 2017: first Zen chips", zh: "2017.3 首批 Zen 芯片上市" } },
    { x: 2019.5, label: { en: "2019: Zen 2 chiplets, made by TSMC", zh: "2019 Zen 2 小芯片，台积电生产" } },
    { x: 2022.12, label: { en: "Feb 2022: Xilinx deal closes", zh: "2022.2 完成收购 Xilinx" } },
    { x: 2023.93, label: { en: "Dec 2023: MI300X launched", zh: "2023.12 发布 MI300X" } },
    { x: 2025.76, label: { en: "Oct 2025: OpenAI 6 GW deal", zh: "2025.10 OpenAI 6 吉瓦协议" } },
    { x: 2026.72, label: { en: "21 Sep 2026: $1 trillion", zh: "2026.9.21 市值破 1 万亿美元" } },
  ],
  ig: {
    numbers: {
      kicker: { en: "TWELVE YEARS IN THREE NUMBERS", zh: "十二年，三个数字" },
      rows: [
        { big: { en: "$2.1B → $1T", zh: "21 亿美元 → 1 万亿美元" }, label: { en: "Market value", zh: "市值" }, sub: { en: "End of 2014 → 21 September 2026", zh: "2014 年底 → 2026 年 9 月 21 日" } },
        { big: { en: "$5.5B → $35B", zh: "55 亿美元 → 346 亿美元" }, label: { en: "Annual revenue", zh: "年营收" }, sub: { en: "2014 → 2025", zh: "2014 年 → 2025 年" } },
        { big: { en: "48%", zh: "48%" }, label: { en: "of revenue from data centres", zh: "营收来自数据中心" }, sub: { en: "2025", zh: "2025 年" } },
      ],
      source: { en: "Sources: CompaniesMarketCap, AMD results", zh: "来源：CompaniesMarketCap、AMD 财报" },
    },
    decisions: [
      { h: { en: "A new design, not a patch", zh: "重新设计，而不是修补" }, tag: "Zen", t: { en: "Instead of fixing old chips, AMD bet on a new design. The first Ryzen chips went on sale in March 2017.", zh: "AMD 没有修补旧芯片，而是押注全新设计。2017 年 3 月，第一批 Ryzen 上市。" } },
      { h: { en: "Let TSMC build it, in pieces", zh: "交给台积电，拆成小块来造" }, tag: "Chiplets", t: { en: "From 2019, small compute dies made by TSMC sit next to one input/output die in a single package.", zh: "从 2019 年起，台积电生产的小计算芯片和一块输入输出芯片封装在一起。" } },
      { h: { en: "Go where the servers are", zh: "去服务器所在的地方" }, tag: "EPYC", t: { en: "Data centres brought in $16.6 billion in 2025, about half of all revenue.", zh: "2025 年，数据中心带来 166 亿美元收入，约占一半。" } },
    ],
    chart: {
      kind: "logcap", kicker: { en: "MARKET VALUE, 2014 TO 2026", zh: "市值，2014 至 2026" },
      sub: { en: "Each gridline is ten times the one below.", zh: "对数刻度：每条横线是下面一条的 10 倍。" },
      foot: { en: "Year-end values · CompaniesMarketCap", zh: "年末市值 · CompaniesMarketCap" },
      marks: [
        [2014.99, 2.07, { en: "2014: Lisa Su becomes CEO", zh: "2014 苏姿丰上任" }, 24, 12, false],
        [2016.99, 9.91, { en: "2017: first Zen chips", zh: "2017 首批 Zen 芯片" }, 24, 14, false],
        [2021.99, 173.77, { en: "2022: Xilinx, passes Intel", zh: "2022 收购 Xilinx，超过 Intel" }, -24, -58, true],
        [2026.72, 1003, { en: "Sep 2026: $1 trillion", zh: "2026.9 破 1 万亿美元" }, -26, -12, true],
      ],
    },
    countries: {
      kicker: { en: "ONE MILESTONE, THREE STORIES", zh: "同一个里程碑，三种讲法" },
      title: { en: "How outlets in four countries reported AMD's $1 trillion day", zh: "四个国家的媒体，怎么报道 AMD 破万亿" },
      rows: [
        { flags: ["us"], name: { en: "United States", zh: "美国" }, t: { en: "The stock: a five-day rally, a 10% chip price rise, and is it still worth buying?", zh: "股票本身：连涨五天、芯片提价 10%、还值不值得买。" } },
        { flags: ["sg", "in"], name: { en: "Singapore and India", zh: "新加坡、印度" }, t: { en: "The industry: one of several chipmakers lifted by demand for AI computing.", zh: "整个行业：被 AI 算力需求带动的几家芯片公司之一。" } },
        { flags: ["cn"], name: { en: "China", zh: "中国" }, t: { en: "First the milestone, often in yuan; then long reads on Lisa Su's twelve years.", zh: "先报里程碑，常换算成人民币；再写苏姿丰的十二年。" } },
      ],
      foot: { en: "22 articles in our sources, 21 to 23 September 2026", zh: "我们收录的 22 篇报道，2026 年 9 月 21 至 23 日" },
    },
  },
};

const ARM: Profile = {
  slug: "arm", no: 3, companyId: 335, companySlug: "arm-holdings",
  title: { en: "Arm: The Chipmaker That Makes No Chips", zh: "Arm：不造芯片，也能从全球手机赚钱" },
  dek: {
    en: "For more than thirty years Arm sold only designs and licences and collected a fee on nearly every smartphone; in 2026 it started selling a chip of its own.",
    zh: "三十多年只卖设计图和授权，几乎每部智能手机都要向它交费；2026 年，它第一次卖起了自己的芯片。",
  },
  social: { en: "The company nearly every phone pays", zh: "几乎每部手机都向它交钱" },
  igHook: { en: "It owns no factory, yet gets paid for almost every phone", zh: "它不生产芯片，却能按颗收钱" },
  seoTitle: { en: "How Arm Makes Money: Licences, Royalties and 99% of Smartphones", zh: "Arm 怎么赚钱：授权费、版税与 99% 的智能手机" },
  seoDesc: {
    en: "Arm Holdings' technology is in more than 99% of smartphones, yet it has never manufactured a chip. How its licence-and-royalty model works, the Nokia and iPhone years, Armv9 royalty rates, SoftBank, the failed Nvidia deal, the 2023 IPO, its first own chip, the AGI CPU, and the 2026 Qualcomm trial over royalties, with every number sourced.",
    zh: "超过 99% 的智能手机基于 Arm 的技术，它却从不自己生产芯片。授权费加版税的模式怎么运作，诺基亚与 iPhone 时代，Armv9 版税率，软银收购、英伟达收购失败、2023 年上市、第一颗自有芯片 AGI CPU，以及 2026 年与高通的版税官司，每个数字附来源。",
  },
  keywords: ["Arm", "Arm Holdings", "安谋", "Arm 架构", "Arm business model", "Arm 版税", "royalty", "Armv9", "Rene Haas", "SoftBank Arm", "软银 Arm", "Nvidia Arm deal", "Arm IPO", "Arm AGI CPU", "Neoverse", "Qualcomm Arm trial", "高通 Arm 诉讼", "高通 Arm 官司"],
  published: "2026-10-15", updated: "2026-10-15",
  cover: { file: "STM32F100C4T6B-HD.jpg", credit: "ZeptoBars", license: "CC BY 3.0",
    caption: { en: "The silicon die of an STM32F100 microcontroller. ST Microelectronics built it around an Arm Cortex-M3 processor core, licensed from Arm.", zh: "STM32F100 微控制器的硅芯片。意法半导体用从 Arm 授权的 Cortex-M3 处理器核心设计了这颗芯片。" },
    alt: { en: "Colourful microscope photo of a microcontroller die", zh: "微控制器芯片裸片的彩色显微照片" } },
  lede: [
    {
      en: "More than 99% of the world's smartphones are based on technology from a company that does not manufacture chips [[1]][[5]]. Arm, based in Cambridge, England, sells blueprints. Chip companies pay a fee to license its designs, then a royalty on every chip they ship. In the year to March 2026 that brought in $4.92 billion, $2.61 billion of it royalties [[2]]. More than 350 billion Arm-based chips have been shipped so far [[1]]. On 13 October 2026 Arm was worth about $273 billion [[17]], almost nine times the $31 billion SoftBank paid for it in 2016 [[12]].",
      zh: "全世界超过 99% 的智能手机，都基于一家不生产芯片的公司的技术 [[1]][[5]]。这家公司叫 Arm，总部在英国剑桥，卖的是图纸：芯片公司先付授权费拿到设计，之后每卖出一颗芯片，再付一笔版税。截至 2026 年 3 月的财年，Arm 由此收入 49.2 亿美元，其中版税 26.1 亿美元 [[2]]。基于 Arm 的芯片累计出货已超过 3500 亿颗 [[1]]。2026 年 10 月 13 日，Arm 市值约 2728 亿美元 [[17]]，接近 2016 年软银收购价 310 亿美元的九倍 [[12]]。",
    },
    {
      en: "This month that model was argued over in court. Qualcomm, one of Arm's largest customers, took Arm to a federal court in Delaware, claiming Arm had broken their licence agreements, and asked to stop paying Arm royalties, potentially worth billions of dollars, for up to five years [[30]]. On 13 October the jury found that Arm had breached Qualcomm's architecture licence and interfered with its business, sided with Arm on four other claims, and awarded Qualcomm nominal damages of $2 [[33]][[34]]. Arm said the verdict \"confirms that Arm operated in good faith\"; whether the breach lets Qualcomm stop paying royalties is now for the judge [[33]]. To see what is at stake, start with how a company that makes no chips gets paid for them.",
      zh: "这个月，这套模式被摆上了法庭。Arm 的大客户之一高通在美国特拉华州联邦法院起诉 Arm 违反授权协议，要求最长五年不向 Arm 支付版税，这笔钱可能高达数十亿美元 [[30]]。10 月 13 日，陪审团认定 Arm 违反了与高通的架构授权协议并干扰了高通的业务，另有四项诉求支持 Arm，判给高通象征性赔偿 2 美元 [[33]][[34]]。Arm 表示，裁决\"证明 Arm 是本着诚意行事的\"；这次违约能否让高通停付版税，现在要由法官决定 [[33]]。要看懂这场官司争的是什么，得先弄清楚：一家不生产芯片的公司，是怎么从芯片上收钱的。",
    },
  ],
  sections: [
    {
      id: "origin", h: { en: "A chip that saved power by accident", zh: "一颗意外省电的芯片" },
      photo: { file: "Acorn Archimedes A310 with mouse and keyboard.jpg", credit: "mikkohoo", license: "CC BY-SA 4.0",
        caption: { en: "An Acorn Archimedes A310, one of Acorn's home computers built on the ARM processor.", zh: "Acorn Archimedes A310，Acorn 基于 ARM 处理器推出的家用电脑之一。" },
        alt: { en: "Beige Acorn Archimedes computer with keyboard and mouse", zh: "米色的 Acorn Archimedes 电脑、键盘和鼠标" } },
      paras: [
        {
          en: "The first ARM chip came from Acorn Computers, a British home-computer maker. Designed by Sophie Wilson and Steve Furber, it was first switched on on 26 April 1985 [[6]]. It had about 25,000 transistors [[9]] and drew about 120 milliwatts [[6]]. According to Wilson, a fault on the test board meant no current reached the chip through its power lines, yet it kept running on leakage from the surrounding circuits. She later called the low power \"a complete accident\" [[7]].",
          zh: "第一颗 ARM 芯片出自英国家用电脑公司 Acorn。它由 Sophie Wilson 和 Steve Furber 设计，1985 年 4 月 26 日第一次通电 [[6]]。芯片约有 2.5 万个晶体管 [[9]]，功耗约 120 毫瓦 [[6]]。据 Wilson 回忆，测试板出了故障，电源线上其实没有电流流进芯片，它却靠周围电路漏过来的电继续运行。她后来说，低功耗\"完全是个意外\" [[7]]。",
        },
        {
          en: "Acorn put the chip into its Archimedes computers [[28]]. In November 1990 the design team became a separate company, Advanced RISC Machines, a joint venture of Acorn, Apple and the chipmaker VLSI Technology. Its 12 engineers started out in an old turkey barn in Swaffham Bulbeck, near Cambridge [[1]][[9]].",
          zh: "Acorn 把这颗芯片用在了自家的 Archimedes 电脑上 [[28]]。1990 年 11 月，设计团队独立成一家新公司 Advanced RISC Machines，由 Acorn、苹果和芯片公司 VLSI Technology 合资成立。12 名工程师的起点，是剑桥附近 Swaffham Bulbeck 村的一座旧火鸡谷仓 [[1]][[9]]。",
        },
      ],
    },
    {
      id: "licence", h: { en: "Decision one: sell the design, not the chip", zh: "决定一：只卖设计，不卖芯片" }, figure: "model",
      photo: { file: "Apple Newton MessagePad 100.jpg", credit: "Felix Winkelnkemper", license: "CC BY-SA 4.0", fit: "contain",
        caption: { en: "Apple's Newton MessagePad, launched in 1993 on an ARM processor. It did not sell well.", zh: "苹果 Newton MessagePad，1993 年上市，使用 ARM 处理器，销量不佳。" },
        alt: { en: "Apple Newton MessagePad handheld computer", zh: "苹果 Newton MessagePad 掌上电脑" } },
      paras: [
        {
          en: "Apple backed the new company because it wanted an ARM processor for the Newton, its handheld computer [[29]]. The Newton launched in 1993 and was not a commercial success [[1]]. A young company with one weak customer could not afford factories of its own. Robin Saxby, its first chief executive and a chip-industry veteran who had worked at Motorola, chose a model that was unusual at the time: license the processor design to many chip companies, and earn a royalty on each chip they sell [[1]][[8]].",
          zh: "苹果投资这家新公司，是因为它想为掌上电脑 Newton 配一颗 ARM 处理器 [[29]]。Newton 于 1993 年上市，商业上并不成功 [[1]]。一家只有一个弱势客户的小公司，建不起自己的工厂。首任 CEO Robin Saxby 曾在摩托罗拉工作，是芯片行业老手，他选择了当时少见的模式：把处理器设计授权给许多芯片公司，再从它们卖出的每一颗芯片里抽取版税 [[1]][[8]]。",
        },
        {
          en: "The licensees do the expensive part: they build complete chips around Arm's designs, pay factories to make them and sell them under their own names. Arm does not manufacture chips itself [[5]]. Each new licensee adds to the number of chips that will one day pay it a royalty.",
          zh: "昂贵的部分由客户承担：它们围绕 Arm 的设计做出完整芯片，付钱请工厂生产，再用自己的品牌出售。Arm 自己不生产芯片 [[5]]。每多一家授权客户，将来付版税的芯片就多一批。",
        },
      ],
    },
    {
      id: "mobile", h: { en: "Decision two: bet on low power, and on phones", zh: "决定二：押注省电，押注手机" },
      photo: { file: "Nokia 6110 blue-92107.jpg", credit: "Raimond Spekking", license: "CC BY-SA 4.0", fit: "contain",
        caption: { en: "A Nokia 6110. Launched in 1997, it ran on an ARM7 processor core.", zh: "诺基亚 6110。这款手机 1997 年上市，使用 ARM7 处理器核心。" },
        alt: { en: "Blue Nokia 6110 mobile phone", zh: "蓝色的诺基亚 6110 手机" } },
      paras: [
        {
          en: "Low power mattered little in a desktop computer and a great deal in anything with a battery. In 1993 Arm signed a licence with Texas Instruments, which advised Nokia to use Arm designs. The Nokia 6110, launched in 1997 on an ARM7 core, was a big success [[1]][[10]]. Apple's first iPod, in 2001, also used ARM7 [[10]].",
          zh: "在台式电脑里，省电不算什么；在任何靠电池工作的设备里，省电至关重要。1993 年，Arm 与德州仪器签下授权，德州仪器又建议诺基亚采用 Arm 的设计。1997 年上市的诺基亚 6110 使用 ARM7 核心，大获成功 [[1]][[10]]。2001 年苹果的第一代 iPod 同样用的是 ARM7 [[10]]。",
        },
        {
          en: "When smartphones arrived, both camps started on Arm: the first iPhone and the first Android phone, the HTC Dream, were both Arm-based [[10]]. In the year to March 2023 alone, Arm's partners reported shipping more than 30 billion Arm-based chips [[5]].",
          zh: "智能手机到来时，两大阵营都从 Arm 起步：第一代 iPhone 和第一部安卓手机 HTC Dream 都基于 Arm [[10]]。仅截至 2023 年 3 月的一个财年，Arm 的合作伙伴就报告出货超过 300 亿颗基于 Arm 的芯片 [[5]]。",
        },
      ],
    },
    {
      id: "royalty", h: { en: "Decision three: charge more for each chip", zh: "决定三：每颗芯片收得更多" }, figure: ["royalty", "split"],
      paras: [
        {
          en: "For most of its history the limit on Arm's income was the size of each payment: a royalty is a small share of a chip's price. Newer designs raise that share. On an earnings call in July 2025, chief executive Rene Haas said royalties on the older Armv8 designs were about 2.5% to 3.5% of a chip's price, on Armv9 about 5%, and on compute subsystems (CSS), where Arm supplies much more of the finished design, roughly double that [[11]].",
          zh: "在大部分历史里，限制 Arm 收入的是每笔钱的大小：版税只占芯片售价的一小部分。新一代设计提高了这个比例。2025 年 7 月的业绩电话会上，CEO Rene Haas 说，旧一代 Armv8 设计的版税约为芯片售价的 2.5% 到 3.5%，Armv9 约 5%，而由 Arm 提供更完整设计的计算子系统（CSS）大约再翻一倍 [[11]]。",
        },
        {
          en: "How big a royalty should be was also at the heart of the Qualcomm trial. Questioning Qualcomm's chief executive, Cristiano Amon, Arm's lawyer pointed to a 2013 licensing deal that capped royalties at $1.88 per chip for any chip with at least five processor cores, at a time when some data-centre chips have 288 cores. Qualcomm's lawyer showed the jury a chart that, Qualcomm said, showed Arm seeking an 1,800% increase in royalties between version 9 and version 10 of its architecture [[30]]. Qualcomm's licence runs until 2033 [[31]].",
          zh: "版税该收多少，也正是高通这场官司的焦点之一。Arm 的律师在询问高通 CEO 安蒙（Cristiano Amon）时提到一份 2013 年的授权协议：只要芯片有至少五个处理器核心，每颗版税最高 1.88 美元；而如今一些数据中心芯片有 288 个核心。高通的律师则向陪审团展示了一张图表，高通称它显示 Arm 在架构第 9 版到第 10 版之间要求把版税提高 1800% [[30]]。高通的这份授权协议有效期到 2033 年 [[31]]。",
        },
        {
          en: "Revenue followed. In the year to March 2026 it rose 23% to $4.92 billion, with $2.61 billion from royalties and $2.31 billion from licensing. It was Arm's third year in a row of growth above 20% since it went public [[2]].",
          zh: "收入随之增长。截至 2026 年 3 月的财年，Arm 营收增长 23%，达到 49.2 亿美元，其中版税 26.1 亿美元，授权 23.1 亿美元。这是它上市以来连续第三个财年增长超过 20% [[2]]。",
        },
      ],
    },
    {
      id: "owners", h: { en: "Sold, nearly sold again, then listed", zh: "被收购，差点再被转卖，然后上市" }, figure: "pricetags",
      photo: { file: "Cambridge ARM building panorama.jpg", credit: "Cmglee", license: "CC BY-SA 3.0",
        caption: { en: "Arm's headquarters at Peterhouse Technology Park, Cambridge.", zh: "Arm 位于英国剑桥 Peterhouse 科技园的总部大楼。" },
        alt: { en: "Panorama of the Arm headquarters building in Cambridge", zh: "剑桥 Arm 总部大楼全景" } },
      paras: [
        {
          en: "In July 2016 SoftBank agreed to buy Arm for £24.0 billion, about $31 billion, and took it off the stock market; the deal completed that September [[12]][[1]]. In September 2020 SoftBank agreed to sell Arm to Nvidia for up to $40 billion in cash and shares [[13]]. The deal met what the companies called \"significant regulatory challenges\" and was cancelled in February 2022 [[14]].",
          zh: "2016 年 7 月，软银同意以 240 亿英镑（约 310 亿美元）收购 Arm，并让它退市，交易于当年 9 月完成 [[12]][[1]]。2020 年 9 月，软银同意以最多 400 亿美元的现金加股票把 Arm 卖给英伟达 [[13]]。这笔交易遇到了双方所说的\"重大监管挑战\"，2022 年 2 月宣告取消 [[14]]。",
        },
        {
          en: "Arm went back to the stock market instead. It priced its Nasdaq listing at $51 a share on 13 September 2023, a value of more than $54 billion, and SoftBank kept about 90% [[15]][[16]][[27]]. At the end of 2025 Arm's market value was $117 billion. It was about $331 billion on 25 September 2026 and about $273 billion on 13 October, after a fall in chip shares [[17]].",
          zh: "Arm 转而重新上市。2023 年 9 月 13 日，它在纳斯达克以每股 51 美元定价，估值超过 540 亿美元，软银保留约 90% 的股份 [[15]][[16]][[27]]。2025 年底，Arm 市值为 1170 亿美元；2026 年 9 月 25 日约为 3314 亿美元，芯片股回落后，10 月 13 日约为 2728 亿美元 [[17]]。",
        },
      ],
    },
    {
      id: "ownchip", h: { en: "2026: a chip of its own", zh: "2026 年：第一颗自己的芯片" },
      photo: { file: "Nvidia DGX GB200.jpg", credit: "Pokiiri", license: "CC BY-SA 4.0", fit: "contain",
        caption: { en: "An Nvidia GB200 rack, with 36 Arm-based Grace processors alongside 72 GPUs, photographed in 2025.", zh: "英伟达 GB200 机柜，内有 36 颗基于 Arm 的 Grace 处理器和 72 颗 GPU，摄于 2025 年。" },
        alt: { en: "Tall black Nvidia server rack", zh: "黑色的英伟达服务器机柜" } },
      paras: [
        {
          en: "Arm's designs reached data centres through the cloud companies. Amazon's Graviton, Google's Axion, Microsoft's Cobalt and Nvidia's Grace are all built on Arm, and Arm expected close to half of the computing shipped to the largest cloud companies in 2025 to be Arm-based [[18]].",
          zh: "Arm 的设计通过云计算公司进入了数据中心。亚马逊的 Graviton、谷歌的 Axion、微软的 Cobalt 和英伟达的 Grace 都基于 Arm。Arm 预计，2025 年交付给最大几家云公司的算力中，接近一半基于 Arm [[18]]。",
        },
        {
          en: "On 24 March 2026 Arm went a step further and launched the Arm AGI CPU, a data-centre processor that it sells itself, with up to 136 cores, made by TSMC on a 3-nanometre process. Arm called it a \"historic company first\"; Meta is its lead partner and co-developer [[19]]. In the quarter to June 2026 revenue rose 22% to $1.29 billion, data-centre royalties more than doubled, and Arm said demand for the new chip was above $2 billion across this financial year and the next, to March 2028 [[21]].",
          zh: "2026 年 3 月 24 日，Arm 更进一步，发布了自己销售的数据中心处理器 Arm AGI CPU：最多 136 个核心，由台积电以 3 纳米工艺生产。Arm 称之为\"公司历史上的第一次\"，Meta 是首要合作伙伴和共同开发者 [[19]]。截至 2026 年 6 月的季度，Arm 营收增长 22%，达到 12.9 亿美元，数据中心版税增长超过一倍；Arm 表示，新芯片在本财年和下一财年（至 2028 年 3 月）的需求超过 20 亿美元 [[21]]。",
        },
        {
          en: "In a CNBC interview on 16 September, Haas said he was more confident that the new chip could reach $2 billion in revenue [[23]]. On 21 September Arm's shares rose as much as 16.8% during trading [[22]].",
          zh: "9 月 16 日接受 CNBC 采访时，Haas 表示，对新芯片实现 20 亿美元收入更有信心了 [[23]]。9 月 21 日，Arm 股价盘中一度上涨 16.8% [[22]]。",
        },
      ],
    },
    { id: "timeline", h: { en: "Timeline", zh: "时间线" }, figure: "timeline", paras: [] },
    {
      id: "countries", h: { en: "One trial, told four ways", zh: "同一场官司，四种讲法" }, figure: "countries",
      paras: [
        {
          en: "We looked at articles in our sources between 26 September and 11 October 2026 with Arm in the headline, leaving out the many that use \"arm\" in its everyday sense: 16 articles from four countries, most of them about the Qualcomm trial. The Singapore and India articles are Reuters wire reports; the Chinese outlets wrote their own. None of our US sources had Arm in a headline in this period. This shows only what our sources carried.",
          zh: "我们查看了 2026 年 9 月 26 日至 10 月 11 日，收录来源中标题提到 Arm 公司的报道（不计英文里作\"手臂\"等普通词义的 arm）：共 16 篇，来自四个国家，大多与高通的官司有关。新加坡和印度的文章是路透社通稿，中国媒体则是自己写的。这段时间里，我们收录的美国来源没有一篇在标题里提到 Arm。这里只反映我们收录的来源。",
        },
      ],
    },
    {
      id: "open", h: { en: "What is not settled", zh: "还没有答案的问题" },
      paras: [
        { en: "Partner or rival. Arm now sells its own data-centre processor in a market where some of the companies that build on its designs, such as Nvidia with Grace, sell Arm-based processors too [[18]][[19]].", zh: "伙伴还是对手。Arm 现在自己卖数据中心处理器，而在同一个市场里，一些基于它的设计做芯片的公司，比如做 Grace 的英伟达，也在卖基于 Arm 的处理器 [[18]][[19]]。" },
        { en: "Licences in court. In December 2024 a US jury found that Qualcomm had not breached the Arm licence of Nuvia, a start-up it bought, and that its chips were covered by its own Arm licence; a judge entered final judgment for Qualcomm in September 2025, and Arm filed an appeal on 1 October 2025 [[24]][[25]][[32]]. In the second case, brought by Qualcomm, a jury found on 13 October 2026 that Arm had breached Qualcomm's architecture licence, but awarded only $2 [[33]]. Two questions remain with the judge: whether the breach lets Qualcomm stop paying royalties for five years, and whether Arm is negotiating the next licence in good faith [[31]][[33]].", zh: "授权官司。2024 年 12 月，美国陪审团认定高通没有违反其收购的初创公司 Nuvia 与 Arm 的授权协议，其芯片也在高通自己的 Arm 授权范围内；2025 年 9 月法官作出有利于高通的最终判决，Arm 于 2025 年 10 月 1 日提起上诉 [[24]][[25]][[32]]。第二起案件由高通提起：2026 年 10 月 13 日，陪审团认定 Arm 违反了与高通的架构授权协议，但只判赔 2 美元 [[33]]。还有两个问题等法官裁决：这次违约能否让高通五年不付版税，以及 Arm 在下一代授权谈判中是否有诚意 [[31]][[33]]。" },
        { en: "Expectations. Arm's stated target is $25 billion of revenue a year by the year to March 2031, $15 billion of it from its own chips [[20]]. Revenue in the latest full year was $4.92 billion [[2]], so today's market value reflects revenue expected rather than revenue already earned.", zh: "预期。Arm 公开的目标是：到截至 2031 年 3 月的财年，年营收达到 250 亿美元，其中 150 亿来自自有芯片 [[20]]。最近一个完整财年的营收是 49.2 亿美元 [[2]]，所以今天的市值反映的是预期收入，而不是已经实现的收入。" },
      ],
    },
  ],
  timeline: [
    { date: { en: "26 Apr 1985", zh: "1985 年 4 月 26 日" }, text: { en: "First ARM chip switched on at Acorn", zh: "第一颗 ARM 芯片在 Acorn 通电" }, src: [6] },
    { date: { en: "Nov 1990", zh: "1990 年 11 月" }, text: { en: "Advanced RISC Machines founded by Acorn, Apple and VLSI; 12 engineers", zh: "Acorn、苹果、VLSI 合资成立 Advanced RISC Machines，12 名工程师" }, src: [1] },
    { date: { en: "1993", zh: "1993 年" }, text: { en: "Apple Newton launches; licence deal with Texas Instruments", zh: "苹果 Newton 上市；与德州仪器签下授权" }, src: [1] },
    { date: { en: "1997", zh: "1997 年" }, text: { en: "Nokia 6110 on an ARM7 core", zh: "诺基亚 6110 采用 ARM7 核心" }, src: [10] },
    { date: { en: "Apr 1998", zh: "1998 年 4 月" }, text: { en: "Listed in London and on Nasdaq", zh: "在伦敦和纳斯达克上市" }, src: [1] },
    { date: { en: "2001", zh: "2001 年" }, text: { en: "First iPod, on ARM7", zh: "第一代 iPod 采用 ARM7" }, src: [10] },
    { date: { en: "2007 to 2008", zh: "2007 至 2008 年" }, text: { en: "First iPhone (2007) and first Android phone (2008), both Arm-based", zh: "第一代 iPhone（2007）和第一部安卓手机（2008），都基于 Arm" }, src: [10] },
    { date: { en: "Sep 2016", zh: "2016 年 9 月" }, text: { en: "SoftBank completes purchase, about $31 billion", zh: "软银完成收购，约 310 亿美元" }, src: [12, 1] },
    { date: { en: "2018", zh: "2018 年" }, text: { en: "Neoverse server designs; first Amazon Graviton", zh: "推出 Neoverse 服务器设计；亚马逊第一代 Graviton" }, src: [1, 10] },
    { date: { en: "Feb 2022", zh: "2022 年 2 月" }, text: { en: "Sale to Nvidia (up to $40 billion) cancelled", zh: "卖给英伟达的交易（最多 400 亿美元）取消" }, src: [13, 14] },
    { date: { en: "Sep 2023", zh: "2023 年 9 月" }, text: { en: "Back on the market: Nasdaq listing at $51 a share", zh: "重新上市：纳斯达克每股 51 美元" }, src: [15] },
    { date: { en: "Mar 2026", zh: "2026 年 3 月" }, text: { en: "Arm AGI CPU, its first own chip; Meta lead partner", zh: "发布首款自有芯片 Arm AGI CPU，Meta 为首要合作伙伴" }, src: [19] },
    { date: { en: "May 2026", zh: "2026 年 5 月" }, text: { en: "Full-year revenue $4.92 billion, up 23%", zh: "全年营收 49.2 亿美元，增长 23%" }, src: [2] },
    { date: { en: "Sep 2026", zh: "2026 年 9 月" }, text: { en: "Shares up as much as 16.8% in a day", zh: "股价单日盘中最多涨 16.8%" }, src: [22] },
    { date: { en: "Oct 2026", zh: "2026 年 10 月" }, text: { en: "Jury finds Arm breached Qualcomm's licence, awards $2; royalty question goes to the judge", zh: "陪审团认定 Arm 违反高通授权协议，判赔 2 美元；版税问题交由法官裁决" }, src: [33, 34] },
  ],
  countries: [
    {
      code: "CN", count: 9, outlets: "IT之家, cnBeta, 虎嗅, 钛媒体",
      focus: { en: "Two kinds of story. Detailed reports on the trial spell out what Qualcomm wants: up to five years without royalties and a licence for Arm's next architecture, V10. The rest treat Arm as a technology: Windows and Linux on Arm, Steam's missing Arm support, and Arm against x86 and RISC-V in industrial computers.", zh: "两类报道。关于官司的报道写得很细，点明高通的诉求：最长五年不付版税，并获得 Arm 下一代架构 V10 的授权。其余把 Arm 当作一种技术来写：Arm 上的 Windows 和 Linux、Steam 还不支持 Arm，以及工业计算机里 Arm 与 x86、RISC-V 的竞争。" },
      headlines: [
        { t: "高通起诉Arm：要求5年不交授权费、强制授权V10指令集", outlet: "虎嗅", url: "https://www.huxiu.com/article/4895588.html?f=rss" },
        { t: "高通诉 Arm 案 5 天审议暂未裁决，陪审团下周二续议", outlet: "IT之家", url: "https://www.ithome.com/1/011/383.htm" },
        { t: "x86、Arm、RISC-V在工业边缘正面相遇", outlet: "钛媒体", url: "https://www.tmtpost.com/8163923.html" },
      ],
    },
    {
      code: "SG", count: 4, outlets: "CNA",
      focus: { en: "Reuters reports on each stage of the trial: the opening, the size of the possible damages, and the jury going home without a verdict.", zh: "路透社对庭审各个阶段的报道：开庭、可能的赔偿规模，以及陪审团暂未作出裁决。" },
      headlines: [
        { t: "Qualcomm and Arm head to trial again, potential for huge damages in focus", outlet: "CNA", url: "https://www.channelnewsasia.com/business/qualcomm-and-arm-head-trial-again-potential-huge-damages-in-focus-6432851" },
        { t: "Qualcomm and Arm set for jury verdict in contract breach feud", outlet: "CNA", url: "https://www.channelnewsasia.com/business/qualcomm-and-arm-set-jury-verdict-in-contract-breach-feud-6446211" },
      ],
    },
    {
      code: "IN", count: 2, outlets: "The Economic Times",
      focus: { en: "The same Reuters reports, read as the story of a business relationship that has worn down since SoftBank bought Arm in 2016.", zh: "同样是路透社的报道，读起来像一段合作关系的故事：自 2016 年软银收购 Arm 以来，两家公司的关系不断恶化。" },
      headlines: [
        { t: "Qualcomm and Arm jury to return next week after deliberations in contract dispute case", outlet: "The Economic Times", url: "https://economictimes.indiatimes.com/tech/technology/qualcomm-and-arm-jury-to-return-next-week-after-deliberations-in-contract-dispute-case/articleshow/134870919.cms" },
      ],
    },
    {
      code: "DE", count: 1, outlets: "heise online",
      focus: { en: "One report, headlined through Snapdragon, Qualcomm's chip brand: Qualcomm suing Arm for breach of contract.", zh: "一篇报道，标题从高通的芯片品牌骁龙切入：高通起诉 Arm 违约。" },
      headlines: [
        { t: "Snapdragon: Qualcomm verklagt ARM wegen Vertragsbruchs", outlet: "heise online", url: "https://www.heise.de/news/Snapdragon-Qualcomm-verklagt-ARM-wegen-Vertragsbruchs-11476898.html" },
      ],
    },
  ],
  sources: [
    { n: 1, name: "Arm", title: "Arm's official history", url: "https://newsroom.arm.com/blog/arm-official-history" },
    { n: 2, name: "Arm", title: "Arm reports results for the fourth quarter and fiscal year 2026", url: "https://newsroom.arm.com/news/arm-q4-fye26-results" },
    { n: 3, name: "Arm (SEC form 6-K, via Stock Titan)", title: "Fiscal year 2026 and 2025 results by revenue type", url: "https://www.stocktitan.net/sec-filings/ARM/6-k-arm-holdings-plc-uk-current-report-foreign-issuer-7e9ca9ac7dda.html" },
    { n: 4, name: "Arm", title: "Q4 fiscal year 2024 shareholder letter", url: "https://investors.arm.com/static-files/0c5f0128-b149-4196-9ef6-3c618ec2782b" },
    { n: 5, name: "SEC", title: "Arm Holdings plc, Form F-1 registration statement (August 2023)", url: "https://www.sec.gov/Archives/edgar/data/1973239/000119312523216983/d393891df1.htm" },
    { n: 6, name: "The Register", title: "Arm at 40: the first chip was switched on 26 April 1985", url: "https://www.theregister.com/2025/04/29/arm_40/" },
    { n: 7, name: "The Register", title: "Unsung heroes of tech: Arm creators Sophie Wilson and Steve Furber", url: "https://www.theregister.com/2012/05/03/unsung_heroes_of_tech_arm_creators_sophie_wilson_and_steve_furber/?page=3" },
    { n: 8, name: "Arm Community", title: "A brief history of Arm, part 1", url: "https://developer.arm.com/community/arm-community-blogs/b/architectures-and-processors-blog/posts/a-brief-history-of-arm-part-1" },
    { n: 9, name: "Cambridge Independent", title: "Birth pangs of modern processing at Arm Holdings celebrated", url: "https://www.cambridgeindependent.co.uk/business/birth-pangs-of-modern-processing-at-arm-holdings-celebrated-9415304/" },
    { n: 10, name: "Arm", title: "35 years of Arm technology innovation", url: "https://newsroom.arm.com/blog/arm-35-years-technology-innovation" },
    { n: 11, name: "EE Times", title: "Armv9 and CSS royalties drive growth in $1bn Arm Q1 earnings", url: "https://www.eetimes.com/armv9-and-css-royalties-drive-growth-in-1bn-arm-q1-earnings/" },
    { n: 12, name: "SoftBank Group", title: "SoftBank to acquire ARM (18 July 2016)", url: "https://group.softbank/en/news/press/20160718" },
    { n: 13, name: "SoftBank Group", title: "Agreement to sell Arm to NVIDIA (14 September 2020)", url: "https://group.softbank/en/news/press/20200914_0" },
    { n: 14, name: "SoftBank Group", title: "Termination of the sale of Arm to NVIDIA (8 February 2022)", url: "https://group.softbank/en/news/press/20220208" },
    { n: 15, name: "Arm", title: "Arm announces pricing of initial public offering", url: "https://newsroom.arm.com/news/arm-announces-pricing-of-initial-public-offering" },
    { n: 16, name: "CNBC", title: "Arm prices IPO at $51 per share", url: "https://www.cnbc.com/2023/09/13/arm-prices-ipo-at-51-per-share.html" },
    { n: 17, name: "CompaniesMarketCap", title: "Arm Holdings market capitalization", url: "https://companiesmarketcap.com/arm-holdings/marketcap/" },
    { n: 18, name: "Arm", title: "Half of the compute shipped to top hyperscalers in 2025 will be Arm-based", url: "https://newsroom.arm.com/blog/half-of-compute-shipped-to-top-hyperscalers-in-2025-will-be-arm-based" },
    { n: 19, name: "Arm", title: "Arm launches the Arm AGI CPU (24 March 2026)", url: "https://newsroom.arm.com/news/arm-agi-cpu-launch" },
    { n: 20, name: "Arm", title: "Q4 fiscal year 2026 earnings call transcript", url: "https://investors.arm.com/static-files/78526857-5997-46eb-9b65-0d3249d83711" },
    { n: 21, name: "Arm", title: "Arm reports results for the first quarter of fiscal year 2027", url: "https://newsroom.arm.com/news/arm-q1-fye27-results" },
    { n: 22, name: "Yahoo Finance", title: "Arm Holdings (ARM) soars 17% on ambitious $2B revenue goal", url: "https://finance.yahoo.com/markets/stocks/articles/arm-holdings-arm-soars-17-184855651.html" },
    { n: 23, name: "CNBC", title: "Arm CEO says he's more confident its new AI chip can meet a loftier $2B revenue goal", url: "https://www.cnbc.com/2026/09/16/jim-cramer-arm-ceo-ai-revenue-goal.html" },
    { n: 24, name: "EE Times", title: "Twists and turns as Qualcomm wins Arm legal case", url: "https://www.eetimes.com/twists-and-turns-as-qualcomm-wins-arm-legal-case-arm-shares-rise/" },
    { n: 25, name: "RCR Wireless", title: "Court enters final judgment for Qualcomm in Arm case", url: "https://rcrwireless.com/20251001/business/qualcomm-arm-2" },
    { n: 26, name: "Arm", title: "Results for the fourth quarter and full year 2015", url: "https://newsroom.arm.com/news/arm-holdings-plc-reports-results-for-the-fourth-quarter-and-full-year-2015" },
    { n: 27, name: "CNN", title: "Arm shares soar in Nasdaq debut", url: "https://www.cnn.com/2023/09/14/investing/arm-ipo-nasdaq/index.html" },
    { n: 28, name: "Centre for Computing History", title: "Acorn Archimedes", url: "https://chrisacorns.computinghistory.org.uk/Computers/Archimedes.html" },
    { n: 29, name: "AppleInsider", title: "How Arm has already saved Apple, twice", url: "https://appleinsider.com/articles/20/06/09/how-arm-has-already-saved-apple---twice" },
    { n: 30, name: "Reuters (via The Star)", title: "Qualcomm and Arm head to trial again, potential for huge damages in focus (5 October 2026)", url: "https://www.thestar.com.my/tech/tech-news/2026/10/05/qualcomm-and-arm-head-to-trial-again-potential-for-huge-damages-in-focus" },
    { n: 31, name: "Reuters (via The Star)", title: "Qualcomm and Arm set for jury verdict in contract breach feud (9 October 2026)", url: "https://www.thestar.com.my/tech/tech-news/2026/10/09/qualcomm-and-arm-set-for-jury-verdict-in-contract-breach-feud" },
    { n: 32, name: "SEC", title: "Qualcomm, Form 10-Q for the quarter ended 28 June 2026 (legal proceedings)", url: "https://www.sec.gov/Archives/edgar/data/0000804328/000080432826000086/qcom-20260628.htm" },
    { n: 33, name: "Tom's Hardware", title: "Qualcomm wins architecture breach verdict against Arm but gets just $2 (14 October 2026)", url: "https://www.tomshardware.com/pc-components/cpus/qualcomm-wins-architecture-breach-verdict-against-arm-but-gets-just-usd2-judge-could-still-suspend-royalty-fees-for-five-years" },
    { n: 34, name: "Qualcomm", title: "Qualcomm statement on trial verdict win (13 October 2026)", url: "https://www.prnewswire.com/news-releases/qualcomm-statement-on-trial-verdict-win-302907419.html" },
  ],
  stats: [
    { label: { en: "What Arm is worth", zh: "公司价值" }, from: 31, to: 272.75, fromLabel: { en: "SoftBank's price, 2016", zh: "2016 年软银收购价" }, toLabel: { en: "13 Oct 2026", zh: "2026 年 10 月 13 日" }, unit: "bn", src: [12, 17] },
    { label: { en: "Annual revenue", zh: "年营收" }, from: 1.49, to: 4.92, fromLabel: { en: "2015", zh: "2015 年" }, toLabel: { en: "year to Mar 2026", zh: "截至 2026 年 3 月" }, unit: "bn", src: [26, 2] },
    { label: { en: "Smartphones based on Arm", zh: "基于 Arm 的智能手机" }, from: 0, to: 99, fromLabel: { en: "", zh: "" }, toLabel: { en: "more than 99%, Arm's figure", zh: "超过 99%，Arm 公布" }, unit: "pct", src: [1, 5] },
  ],
  name: "Arm", legalName: "Arm Holdings plc", newsMatch: { src: "\\b(Arm|ARM)\\b|安谋", flags: "" },
  alwaysCite: [3, 4, 5, 13, 16, 17],
  method: {
    en: "Method: drafted with AI from the sources above and checked line by line by an editor. Revenue is by Arm's financial year, which ends on 31 March; 2015 is a calendar year. Market values may differ slightly between data providers. This is not investment advice. Found a mistake? Email ",
    zh: "写法：本文由 AI 根据上列来源整理，编辑逐条核对。营收按 Arm 的财年计算，财年截至每年 3 月 31 日；2015 年为自然年。市值在不同数据商之间可能略有出入。本文不构成投资建议。发现错误请写信到 ",
  },
  // $ billion: deal prices [12][13], value at the IPO price [16], market value [17]
  priceTags: {
    title: { en: "What Arm was worth ($ billion)", zh: "Arm 值多少钱（十亿美元）" },
    note: {
      en: "2016 and 2020 are agreed deal prices; the Nvidia deal was cancelled. September 2023 is the value at the IPO price (\"more than $54 billion\"). The rest are market values at year-end and on 25 September and 13 October 2026. Sources: SoftBank, CNBC, CompaniesMarketCap.",
      zh: "2016 年和 2020 年是谈定的交易价格，其中英伟达的交易已取消。2023 年 9 月是按发行价计算的估值（\"超过 540 亿美元\"）。其余是年末以及 2026 年 9 月 25 日和 10 月 13 日的市值。来源：软银、CNBC、CompaniesMarketCap。",
    },
    rows: [
      { label: { en: "SoftBank deal, Jul 2016", zh: "软银收购，2016.7" }, v: 31, kind: "deal" },
      { label: { en: "Nvidia deal, Sep 2020 (cancelled)", zh: "英伟达收购，2020.9（取消）" }, v: 40, kind: "deal" },
      { label: { en: "Value at IPO, Sep 2023", zh: "上市时估值，2023.9" }, v: 54, kind: "deal" },
      { label: { en: "End of 2023", zh: "2023 年底" }, v: 77.04, kind: "market" },
      { label: { en: "End of 2024", zh: "2024 年底" }, v: 135.78, kind: "market" },
      { label: { en: "End of 2025", zh: "2025 年底" }, v: 116.99, kind: "market" },
      { label: { en: "25 Sep 2026", zh: "2026.9.25" }, v: 331.42, kind: "market" },
      { label: { en: "13 Oct 2026", zh: "2026.10.13" }, v: 272.75, kind: "market" },
    ],
  },
  // $ billion by financial year to 31 March: totals FY2021 to FY2023 [5], split FY2023 and FY2024 [4], FY2025 and FY2026 [3][2]
  split: {
    title: { en: "Arm revenue by financial year ($ billion)", zh: "Arm 各财年营收（十亿美元）" },
    note: {
      en: "Financial years end on 31 March, so FY2026 is April 2025 to March 2026. The split is not shown for FY2021 and FY2022. Sources: Arm F-1, Arm results.",
      zh: "财年截至每年 3 月 31 日，FY2026 即 2025 年 4 月至 2026 年 3 月。FY2021 和 FY2022 未拆分。来源：Arm 招股书、Arm 业绩公告。",
    },
    a: { en: "Royalties", zh: "版税" }, b: { en: "Licensing and other", zh: "授权及其他" },
    rows: [
      { label: "FY2021", total: 2.03 }, { label: "FY2022", total: 2.7 },
      { label: "FY2023", total: 2.68, a: 1.675, b: 1.004 }, { label: "FY2024", total: 3.23, a: 1.802, b: 1.431 },
      { label: "FY2025", total: 4.01, a: 2.161, b: 1.846 }, { label: "FY2026", total: 4.92, a: 2.613, b: 2.307 },
    ],
  },
  royalty: {
    title: { en: "Royalty as a share of a chip's price", zh: "版税占芯片售价的比例" },
    note: {
      en: "Approximate figures given by chief executive Rene Haas on the July 2025 earnings call, as reported by EE Times. Actual rates differ by contract and are not published.",
      zh: "CEO Rene Haas 在 2025 年 7 月业绩电话会上给出的大致数字，据 EE Times 报道。实际费率因合同而异，并不公开。",
    },
    rows: [
      { label: { en: "Armv8", zh: "Armv8" }, lo: 2.5, hi: 3.5, sub: { en: "older designs", zh: "旧一代设计" } },
      { label: { en: "Armv9", zh: "Armv9" }, lo: 5, hi: 5, sub: { en: "newer designs", zh: "新一代设计" } },
      { label: { en: "CSS", zh: "CSS" }, lo: 10, hi: 10, approx: true, sub: { en: "compute subsystems", zh: "计算子系统" } },
    ],
  },
  ig: {
    numbers: {
      kicker: { en: "ONE COMPANY, THREE NUMBERS", zh: "一家公司，三个数字" },
      rows: [
        { big: { en: "$31B → $273B", zh: "310 亿 → 2728 亿美元" }, label: { en: "What Arm is worth", zh: "公司价值" }, sub: { en: "SoftBank's price in 2016 → 13 October 2026", zh: "2016 年软银收购价 → 2026 年 10 月 13 日市值" } },
        { big: { en: "350 billion+", zh: "3500 亿颗+" }, label: { en: "Arm-based chips shipped so far", zh: "累计出货的 Arm 芯片" }, sub: { en: "Arm's count", zh: "Arm 公布的数字" } },
        { big: { en: "99%+", zh: "99%+" }, label: { en: "of smartphones are based on Arm", zh: "的智能手机基于 Arm 技术" }, sub: { en: "Arm's figure", zh: "Arm 公布的数字" } },
      ],
      source: { en: "Sources: SoftBank, CompaniesMarketCap, Arm", zh: "来源：软银、CompaniesMarketCap、Arm" },
    },
    decisions: [
      { h: { en: "Sell the design, not the chip", zh: "只卖设计，不卖芯片" }, tag: "Licensing", t: { en: "Chip companies pay once to license a design, then a royalty on every chip they ship.", zh: "芯片公司先付授权费拿到设计，之后每卖一颗芯片再付版税。" } },
      { h: { en: "Bet on low power", zh: "押注省电" }, tag: "Mobile", t: { en: "The Nokia 6110 in 1997, the first iPod in 2001, then the first iPhone (2007) and Android phone (2008).", zh: "1997 年的诺基亚 6110、2001 年的第一代 iPod，再到 2007 年的第一代 iPhone 和 2008 年的第一部安卓手机。" } },
      { h: { en: "Charge more for each chip", zh: "每颗芯片收得更多" }, tag: "Armv9 · CSS", t: { en: "Newer designs earn about 5% of a chip's price, up from 2.5 to 3.5%, the CEO says.", zh: "CEO 说，新一代设计的版税约为芯片售价的 5%，旧一代是 2.5% 到 3.5%。" } },
    ],
    chart: {
      kind: "tags", kicker: { en: "WHAT ARM WAS WORTH", zh: "Arm 值多少钱" },
      sub: { en: "Deal prices first, then market value.", zh: "先是交易价格，后是市值。" },
      foot: { en: "SoftBank, CNBC, CompaniesMarketCap", zh: "软银、CNBC、CompaniesMarketCap" },
    },
    countries: {
      kicker: { en: "ONE TRIAL, FOUR COUNTRIES", zh: "同一场官司，四个国家" },
      title: { en: "How outlets wrote about Arm, 26 September to 11 October", zh: "9 月 26 日至 10 月 11 日，各国媒体怎么写 Arm" },
      rows: [
        { flags: ["cn"], name: { en: "China", zh: "中国" }, t: { en: "Qualcomm's demands in detail: five years without royalties and a licence for Arm's next design, V10.", zh: "细写高通的诉求：五年不付版税，并拿到 Arm 下一代架构 V10 的授权。" } },
        { flags: ["sg", "in"], name: { en: "Singapore and India", zh: "新加坡、印度" }, t: { en: "Reuters on each stage of the trial, and a relationship worn down since 2016.", zh: "路透社跟进庭审每个阶段，以及 2016 年以来不断恶化的关系。" } },
        { flags: ["de"], name: { en: "Germany", zh: "德国" }, t: { en: "One report, through Qualcomm's Snapdragon brand: a breach-of-contract suit.", zh: "一篇报道，从高通的骁龙品牌切入：违约诉讼。" } },
      ],
      foot: { en: "16 articles in our sources, 26 September to 11 October 2026", zh: "我们收录的 16 篇报道，2026 年 9 月 26 日至 10 月 11 日" },
    },
  },
};

const WORLD_LABS: Profile = {
  slug: "amd-world-labs", no: 2, companyId: 18, companySlug: "amd",
  title: { en: "AMD and World Labs: An $8.2 Billion Bet on Seeing the Future First", zh: "AMD 拟花 82 亿美元，买一双看见未来的眼睛" },
  dek: {
    en: "AMD has agreed to pay about $8.2 billion in stock for World Labs, the world-model company Fei-Fei Li co-founded, so that the people who build models can tell it early what the next chips need. Whether that view turns into chip sales is still open.",
    zh: "AMD 同意以约 82 亿美元股票收购李飞飞参与创办的 World Labs，想让做模型的人提前告诉它下一代芯片需要什么；这双眼睛能否变成芯片订单，还没有答案。",
  },
  social: { en: "Why AMD is paying $8.2 billion for a head start", zh: "AMD 为什么花 82 亿美元买一个时间差" },
  igHook: { en: "It makes the compute. Now it wants to pay $8.2 billion for the people who build the models", zh: "它造算力，\n却要花 82 亿美元\n买下李飞飞的团队" },
  seoTitle: { en: "AMD to Acquire Fei-Fei Li's World Labs for $8.2 Billion: What It Buys and Why", zh: "AMD 拟 82 亿美元收购李飞飞 World Labs：买什么，为什么买" },
  seoDesc: {
    en: "AMD agreed on 28 September 2026 to buy World Labs, Fei-Fei Li's spatial-intelligence start-up, in an all-stock deal worth about $8.2 billion. What World Labs makes (Marble, RTFM), Li's new role as AMD chief scientist, the price against its funding rounds, AMD's earlier acquisitions, the race for world models, and how media in six countries reported it. Every number sourced.",
    zh: "2026 年 9 月 28 日，AMD 同意以约 82 亿美元全股票收购李飞飞的空间智能公司 World Labs。World Labs 做什么（Marble、RTFM），李飞飞出任 AMD 首席科学家，收购价与融资估值对比，AMD 以往的收购，世界模型之争，以及六个国家的媒体怎么报道。每个数字附来源。",
  },
  keywords: ["AMD", "World Labs", "Fei-Fei Li", "李飞飞", "苏姿丰", "Lisa Su", "AMD acquisition", "AMD 收购", "world model", "世界模型", "spatial intelligence", "空间智能", "Marble", "physical AI"],
  published: "2026-09-30", updated: "2026-09-30",
  cover: { file: "coda-ai-illustration-amd-world-labs", credit: "", ownCredit: { en: "made by coda.news with ChatGPT", zh: "coda.news 使用 ChatGPT 生成" }, license: "", own: true, pos: "center 62%",
    caption: { en: "Cover: an AI-generated illustration of a 3D world rising out of a chip; not a picture of an AMD or World Labs product.", zh: "封面：AI 生成插图，一个 3D 世界从芯片中升起；并非 AMD 或 World Labs 产品图。" },
    alt: { en: "Illustration of a glowing chip with a landscape of mountains, trees and a lake rising above it", zh: "发光的芯片上方升起山峦、树木和湖泊的插图" } },
  lede: [
    {
      en: "A single Nvidia H100 is showing AMD the future it wants. When World Labs introduced its RTFM model in October 2025, it said the model runs on one H100 and generates video of a world in real time as you move through it. It is built for persistence, so that, in World Labs' words, \"the world doesn't disappear or change completely when you look away\" [[13]].",
      zh: "一块英伟达 H100，正在替 AMD 展示它想要的未来。World Labs 在 2025 年 10 月发布 RTFM 模型时说，它只用一块 H100，就能随着用户移动实时生成一个世界的画面。它为\"持久性\"而设计：即使用户转过身，刚才看到的世界也不会消失或彻底改变 [[13]]。",
    },
    {
      en: "On 28 September 2026 AMD agreed to buy the people who built it. It will pay about $8.2 billion in AMD shares for World Labs, the two-year-old company co-founded by the computer scientist Fei-Fei Li [[1]][[8]]. If completed, it will be AMD's second-largest acquisition, after Xilinx [[6]]. World Labs has not publicly disclosed any revenue [[35]].",
      zh: "2026 年 9 月 28 日，AMD 同意把做出它的人买进来：以约 82 亿美元的 AMD 股票，收购计算机科学家李飞飞参与创办、成立两年的 World Labs [[1]][[8]]。交易若完成，将是 AMD 史上第二大收购，仅次于 Xilinx [[6]]。World Labs 尚未公开披露收入 [[35]]。",
    },
    {
      en: "So AMD is not buying sales. It is buying time. Chips take years to design, and the people building new models are the first to hit their limits. With a model team inside, AMD hopes to see what the next chips need before the rest of the industry asks for it. The awkward start: one of the models World Labs has shown off runs on its rival's chip.",
      zh: "所以 AMD 买的不是销售额，而是时间差。芯片要花好几年设计，而做新模型的人，总是最先撞上芯片的极限。把一支模型团队放进公司内部，AMD 希望在整个行业提出需求之前，就看清下一代芯片该长什么样。尴尬的起点是：World Labs 展示过的一个模型，跑在竞争对手的芯片上。",
    },
  ],
  sections: [
    {
      id: "basics", h: { en: "Start here: three names in plain words", zh: "零基础先看：三个名词" },
      photo: { file: "Polycam gaussian splatting exemplo.png", credit: "Óscar Mirás", license: "CC BY-SA 4.0",
        caption: { en: "A real garden captured as a 3D scene you can move through, using Gaussian splatting, one of the formats World Labs' Marble exports.", zh: "一座真实的花园，用高斯泼溅（Gaussian splatting）技术捕捉成可以在里面移动的 3D 场景。这是 World Labs 的 Marble 可以导出的格式之一。" },
        alt: { en: "3D-captured garden with a round fountain", zh: "3D 捕捉的花园和圆形喷泉" } },
      paras: [
        {
          en: "World model. Ask an ordinary image AI for a kitchen and you get a convincing picture: a kettle on the table, a fridge by the wall, sun through the window. Now move the camera behind the fridge. A door may appear that was not there, the table may change length, the chair in the corner may vanish. The model can draw a kitchen without knowing what a kitchen is. (This is an illustration, not a test of any product.)",
          zh: "世界模型。打个比方：让普通的图像 AI 画一间厨房，它会给你一张像模像样的图，桌上有水壶，墙边有冰箱，阳光从窗户照进来。可如果把镜头绕到冰箱后面，问题就来了：可能突然多出一扇门，桌子变长了，角落里的椅子不见了。模型会画厨房，却未必\"知道\"厨房是什么。（这是示意，不是对某个产品的测试。）",
        },
        {
          en: "A world model tries to fix that. It keeps track of where things are, what you should see when you turn, and keeps the whole space consistent. The longer-term aim is to know what happens when a cup is pushed, or how a robot should get round a table [[8]][[37]]. The cases World Labs has shown in public are mainly in games, film, 3D design and early robot simulation [[12]][[11]][[37]]; reliable use for training robots or simulating factories and roads at scale is still some way off [[27]][[37]].",
          zh: "世界模型想解决的就是这个问题。它要记住东西放在哪里、转过身应该看到什么，让整个空间前后一致。更远的目标，是理解杯子被推一下会怎样、机器人该怎么绕过桌子 [[8]][[37]]。World Labs 目前公开展示的案例，主要集中在游戏、影视、3D 创作和早期机器人模拟 [[12]][[11]][[37]]；要可靠地大规模训练机器人、模拟工厂和道路，还有距离 [[27]][[37]]。",
        },
        {
          en: "World Labs. A small American AI company, founded in 2024, that builds world models. Its product, Marble, turns a sentence, a photo or a video into a 3D world you can move around in [[8]][[12]].",
          zh: "World Labs。一家 2024 年成立、专做世界模型的美国 AI 小公司。它的产品 Marble，能把一句话、一张照片或一段视频变成可以在里面走动的 3D 世界 [[8]][[12]]。",
        },
        {
          en: "Fei-Fei Li. A computer scientist at Stanford. In the late 2000s she led the building of ImageNet, a library of more than 14 million photos, each labelled by hand with what it shows [[34]]. It became a shared test for computers that recognise pictures. In 2012 a neural network called AlexNet won that test by a wide margin, and the technology industry took notice of deep learning, the approach behind today's AI [[34]].",
          zh: "李飞飞。斯坦福大学的计算机科学家。2000 年代后期，她主导建立了 ImageNet：一个有 1400 多万张照片的图库，每张都由人工标注了内容 [[34]]。它成了电脑\"认图\"能力的统一考试。2012 年，一个叫 AlexNet 的神经网络在这场考试中大幅领先，科技行业由此开始重视深度学习，也就是今天 AI 背后的方法 [[34]]。",
        },
      ],
    },
    {
      id: "deal", h: { en: "The deal", zh: "交易本身" },
      paras: [
        {
          en: "AMD announced the agreement after the US market closed on 28 September. The deal is all-stock and valued at about $8.2 billion; the number of AMD shares will be set by AMD's average share price over the ten trading days before closing [[38]]. AMD expects to complete it by the end of 2026, subject to regulatory approvals [[1]][[24]]. Fei-Fei Li will become AMD's executive vice president and chief scientist, reporting to chief executive Lisa Su [[1]].",
          zh: "AMD 在 9 月 28 日美股收盘后宣布了这项协议。交易全部以股票支付，作价约 82 亿美元；最终发行多少股，要按交割前 10 个交易日 AMD 的平均股价计算 [[38]]。交易预计 2026 年底前完成，还需通过监管审批 [[1]][[24]]。李飞飞将出任 AMD 执行副总裁兼首席科学家，直接向 CEO 苏姿丰汇报 [[1]]。",
        },
        {
          en: "Justin Johnson and Ben Mildenhall, two of World Labs' co-founders, will keep leading its team together with Li, as a research organisation inside AMD [[2]]. The fourth co-founder, Christoph Lassner, is not named in the announced arrangements [[2]][[8]]. Neither company has said what will happen to Marble [[35]].",
          zh: "World Labs 的两位联合创始人 Justin Johnson 和 Ben Mildenhall 将与李飞飞一起，继续带领这支团队，作为 AMD 内部的研究机构运作 [[2]]。第四位联合创始人 Christoph Lassner 没有出现在公布的安排中 [[2]][[8]]。产品 Marble 之后怎么安排，两家公司都没有说明 [[35]]。",
        },
      ],
    },
    {
      id: "whyworld", h: { en: "Why World Labs", zh: "为什么是 World Labs" },
      photo: { file: "Fei-Fei Li at AI for Good 2017.jpg", credit: "ITU Pictures", license: "CC BY 2.0", pos: "center 20%",
        caption: { en: "Fei-Fei Li speaking at the AI for Good Global Summit in Geneva, June 2017.", zh: "2017 年 6 月，李飞飞在日内瓦的 AI for Good 全球峰会上演讲。" },
        alt: { en: "Fei-Fei Li speaking at a lectern", zh: "李飞飞在讲台上演讲" } },
      paras: [
        {
          en: "World Labs came out of stealth on 13 September 2024 with $230 million from investors including Andreessen Horowitz, NEA and Nvidia's venture arm [[8]]. Marble opened to everyone on 12 November 2025; it builds 3D worlds from text, images, video or rough layouts, and exports them with collision meshes a physics engine can work with [[12]][[37]]. In February 2026 the company raised $1 billion from investors that included both AMD and Nvidia, as well as Autodesk [[9]].",
          zh: "World Labs 于 2024 年 9 月 13 日公开亮相，获得 2.3 亿美元融资，投资方包括 Andreessen Horowitz、NEA 和英伟达的风投部门 [[8]]。Marble 于 2025 年 11 月 12 日向所有人开放，可以根据文字、图片、视频或粗略布局生成 3D 世界，并附带物理引擎可以使用的碰撞网格 [[12]][[37]]。2026 年 2 月，公司融资 10 亿美元，投资方中既有 AMD，也有英伟达，还有 Autodesk [[9]]。",
        },
        {
          en: "World Labs itself sorts world models into three kinds: renderers, which produce pictures for people; simulators, which keep a geometrically and physically faithful state of a scene; and planners, which decide what a robot should do next. It notes that robot demonstrations have so far been \"confined to heavily constrained laboratory setups\" [[37]]. World Labs places Marble between renderer and simulator [[37]]; in our view it is still closer to a very fast set builder than to a trusted set of physical laws.",
          zh: "World Labs 自己把世界模型分成三类：渲染器，生成给人看的画面；模拟器，保存场景在几何和物理上准确的状态；规划器，决定机器人下一步该做什么。它也承认，机器人演示至今大多局限在\"高度受限的实验室环境\"里 [[37]]。World Labs 把 Marble 放在渲染器和模拟器之间 [[37]]；在我们看来，它更像一个速度很快的造景师，还不是一套可信的物理定律。",
        },
        {
          en: "Then there is Li. She began ImageNet at Princeton in 2007 and presented it in 2009 [[32]][[15]]; Stanford's Institute for Human-Centered AI, which she co-founded and co-directs, describes her as its inventor [[14]]. She was chief scientist of AI at Google Cloud in 2017 and 2018 [[15]]. Some outlets call her the \"godmother of AI\" [[30]]; she has said she would never call herself that [[32]].",
          zh: "然后是李飞飞本人。她 2007 年在普林斯顿启动 ImageNet，2009 年正式发表 [[32]][[15]]；她参与创办并担任联合主任的斯坦福以人为本人工智能研究院（HAI），称她为 ImageNet 的发明者 [[14]]。2017 至 2018 年，她曾任谷歌云 AI 首席科学家 [[15]]。一些媒体称她为\"AI 教母\" [[30]]，她本人说过，自己绝不会这样称呼自己 [[32]]。",
        },
        {
          en: "The deal pairs two paths into AI. Lisa Su, an engineer, became AMD's chief executive in October 2014 [[42]], in a year it reported a net loss of $403 million [[40]]; in September 2026 its market value briefly passed $1 trillion [[41]]. Hers is an approach from the chip up. Li's ImageNet changed how machines learn to see: an approach from the model down. The acquisition tries to make the two meet in the middle. But generating a beautiful 3D space and helping AMD sell more chips are not the same thing.",
          zh: "这笔交易让两条通往 AI 的路相遇。工程师出身的苏姿丰 2014 年 10 月出任 AMD CEO [[42]]，那一年公司净亏损 4.03 亿美元 [[40]]；2026 年 9 月，AMD 市值一度突破 1 万亿美元 [[41]]。这是一条从芯片往上走的路。李飞飞的 ImageNet 改变了机器学会\"看\"的方式，这是一条从模型往下走的路。收购想让两条路在中间会合。可是，能生成漂亮的三维空间，和能帮 AMD 卖出更多芯片，并不是同一件事。",
        },
      ],
    },
    {
      id: "timelag", h: { en: "The choice: buy a head start", zh: "抉择：买一个时间差" },
      photo: { file: "SXSW-2024-alih-OB7A0861-Lisa Su (cropped 2).jpg", credit: "Fuzheado", license: "CC BY 4.0", pos: "center 25%",
        caption: { en: "Lisa Su speaking at SXSW in Austin, March 2024.", zh: "2024 年 3 月，苏姿丰在美国奥斯汀 SXSW 大会上发言。" },
        alt: { en: "Lisa Su speaking on stage", zh: "苏姿丰在台上发言" } },
      paras: [
        {
          en: "Chip companies usually learn what their chips lack from customers: memory runs out, the links between GPUs are too slow, the software is missing a tool. By the time the complaint arrives, the next chip may already be largely fixed. AMD wants that feedback earlier. \"Building the compute platforms for the next generation of AI requires a deep understanding of how models are evolving,\" Su said [[1]].",
          zh: "芯片公司通常要等客户告诉它芯片哪里不够用：显存不够、GPU 之间通信太慢、软件缺了某个工具。等这些抱怨传回来，下一代芯片可能已经基本定型。AMD 想更早听到这些。苏姿丰说：\"为下一代 AI 打造计算平台，需要深入理解模型如何演进。\" [[1]]",
        },
        {
          en: "A team building new models hits a chip's limits first: memory size and bandwidth, the links between GPUs, latency, power use and missing software. Inside AMD, World Labs could act as an early, demanding in-house customer for its Instinct accelerators and ROCm software; AMD says the team will help it understand new AI workloads and shape its hardware, software and systems [[1]]. Li put it from the other side: her team needs to get \"closer to the hardware\", because without a focused hardware effort \"AI is hobbled in efficiency. And scale.\" [[3]]",
          zh: "做新模型的团队，会最先撞上芯片的极限：显存容量和带宽、GPU 之间的互联、延迟、功耗，以及缺失的软件。放进 AMD 之后，World Labs 可以成为 Instinct 加速器和 ROCm 软件的一个早期、挑剔的\"内部客户\"。AMD 也说，这支团队将帮助它理解新的 AI 工作负载，进而影响它的硬件、软件和系统 [[1]]。李飞飞则从另一边说：团队需要\"更靠近硬件\"，因为没有专注的硬件投入，\"AI 在效率和规模上都会受限\" [[3]]。",
        },
        {
          en: "The two companies already worked together: they formed a partnership on inference optimisation and training in 2025 [[4]]. AMD also says it is not trying to compete with the AI companies that buy its chips; Vamsi Boppana, its senior vice president for AI, said that is \"not the intent at all\" [[7]]. The first test has a twist: RTFM was shown running on an Nvidia H100 [[13]]. Whether World Labs' models run as well, or better, on AMD's own accelerators will be one of the earliest signs of whether the bet works.",
          zh: "两家公司此前已有合作：2025 年，它们在推理优化和训练上结成伙伴关系 [[4]]。AMD 也表示，它无意与购买其芯片的 AI 公司竞争，负责 AI 的高级副总裁 Vamsi Boppana 说，这\"完全不是本意\" [[7]]。第一道检验就有些微妙：RTFM 展示时跑在英伟达 H100 上 [[13]]。World Labs 的模型在 AMD 自家加速器上能否跑得一样好、甚至更好，会是这场押注成败最早的信号之一。",
        },
      ],
    },
    {
      id: "list", h: { en: "Part of a longer shopping list", zh: "一份更长的购物清单" }, figure: "pricetags",
      photo: { file: "2485 Augustine Drive headquarters in Santa Clara, California.jpg", credit: "Coolcaesar", license: "CC BY-SA 4.0",
        caption: { en: "AMD headquarters in Santa Clara, California.", zh: "AMD 位于美国加州圣克拉拉的总部。" }, alt: { en: "AMD headquarters building", zh: "AMD 总部大楼" } },
      paras: [
        {
          en: "World Labs follows a run of purchases that moved AMD from chips towards complete AI systems: Xilinx, completed in February 2022 at about $49 billion [[16]]; the networking-chip designer Pensando for about $1.9 billion in 2022 [[17]]; the AI lab Silo AI for about $665 million in 2024 [[18]]; and the server builder ZT Systems for $4.9 billion, completed in March 2025 [[36]][[19]]. Several smaller AI software teams joined at undisclosed prices, the latest being MK1 in November 2025 [[33]]. Silo AI, which built the open Poro and Viking language models, was AMD's first model lab [[18]]; World Labs costs more than ten times as much, and is the first built around world models rather than language models.",
          zh: "在 World Labs 之前，AMD 已经做了一连串收购，从芯片走向完整的 AI 系统：2022 年 2 月完成收购 Xilinx，约 490 亿美元 [[16]]；2022 年以约 19 亿美元收购网络芯片设计公司 Pensando [[17]]；2024 年以约 6.65 亿美元收购 AI 实验室 Silo AI [[18]]；2025 年 3 月以 49 亿美元完成收购服务器制造商 ZT Systems [[36]][[19]]。还有几支较小的 AI 软件团队以未公开的价格并入，最近一家是 2025 年 11 月的 MK1 [[33]]。Silo AI 曾做出开源语言模型 Poro 和 Viking，是 AMD 买下的第一家模型实验室 [[18]]；World Labs 的价格是它的十多倍，也是第一家以世界模型而非语言模型为主的收购对象。",
        },
      ],
    },
    {
      id: "price", h: { en: "Why $8.2 billion", zh: "为什么值 82 亿美元" }, figure: "pricetags2",
      paras: [
        {
          en: "Three numbers sit side by side. About $1 billion: World Labs' valuation when it emerged in 2024 [[5]][[11]]. About $5 billion: the valuation press reports gave it in February 2026, which the company did not confirm [[10]][[11]]. About $8.2 billion: AMD's price, some 64% above that reported figure. World Labs has not disclosed revenue, losses or customer numbers, so from outside the price can only be explained by the team, technology, intellectual property and strategic value [[35]]. How many new AMD shares are issued depends on AMD's share price before closing; one estimate put them at about 0.8% of the company [[38]][[24]].",
          zh: "三个数字并排放着。约 10 亿美元：2024 年亮相时 World Labs 的估值 [[5]][[11]]。约 50 亿美元：2026 年 2 月媒体报道的估值，公司没有证实 [[10]][[11]]。约 82 亿美元：AMD 的出价，比那个报道数字高约 64%。World Labs 没有公开收入、亏损和客户数量，外界目前只能更多从团队、技术、知识产权和战略价值来解释这个价格 [[35]]。新发多少 AMD 股份取决于交割前的股价，有估算认为约占 AMD 股本的 0.8% [[38]][[24]]。",
        },
        {
          en: "AMD's market value was about $992 billion at the close on 28 September [[20]]. Its shares were flat to slightly lower after hours and about 1.4% higher before the market opened the next day [[24]][[7]][[25]]. Analysts differed. Citi said the deal could give AMD \"deeper visibility\" into how AI models are evolving; RBC said Nvidia keeps a \"significant\" lead in spatial AI and physical simulation [[22]].",
          zh: "9 月 28 日收盘时，AMD 市值约 9920 亿美元 [[20]]。消息公布后，盘后股价持平或小幅下跌，次日盘前上涨约 1.4% [[24]][[7]][[25]]。分析师看法不一：花旗认为，这笔交易能让 AMD 更深入地了解 AI 模型的演进；加拿大皇家银行则认为，英伟达在空间 AI 和物理仿真上仍有\"明显\"领先 [[22]]。",
        },
      ],
    },
    {
      id: "race", h: { en: "Everyone wants a world model", zh: "人人都想要世界模型" },
      paras: [
        {
          en: "World models are also a focus for AMD's rivals. Google DeepMind showed Genie 3, a real-time interactive world model, in August 2025 [[26]]. Nvidia launched its Cosmos world foundation models in January 2025 to generate training data for robots and self-driving cars [[27]]. The broker Stifel said World Labs fills a gap for AMD, which had released only text and video open models [[23]].",
          zh: "世界模型同样是 AMD 竞争对手的重点。谷歌 DeepMind 在 2025 年 8 月展示了实时交互的世界模型 Genie 3 [[26]]。英伟达在 2025 年 1 月推出 Cosmos 世界基础模型，用来为机器人和自动驾驶汽车生成训练数据 [[27]]。券商 Stifel 认为，World Labs 填补了 AMD 的空白，因为 AMD 此前只发布过文本和视频类开放模型 [[23]]。",
        },
        {
          en: "Large technology companies have also paid heavily for AI teams. Meta invested $14.3 billion in Scale AI in 2025 and hired its chief executive [[29]]. In December 2025 Nvidia agreed a licensing deal with the chip start-up Groq, reported at $20 billion, with Groq's founder joining Nvidia [[28]].",
          zh: "大型科技公司也在为 AI 团队付出高价。2025 年，Meta 向 Scale AI 投资 143 亿美元，并聘请了其 CEO [[29]]。2025 年 12 月，英伟达与芯片初创公司 Groq 达成授权协议，据报道金额为 200 亿美元，Groq 创始人加入英伟达 [[28]]。",
        },
      ],
    },
    {
      id: "open", h: { en: "What to watch in two years", zh: "两年后看什么" },
      paras: [
        { en: "AMD is not buying a market that already exists. It is buying a chance to help define one. These are the signs that will show whether that worked.", zh: "AMD 买的不是一个已经成熟的市场，而是提前参与定义这个市场的资格。下面这些信号，会告诉我们这场押注是否成功。" },
        { en: "Does it run on AMD? RTFM was shown on an Nvidia H100 [[13]]. The measurable test is whether World Labs' models run faster or cheaper on AMD Instinct, and whether that draws outside developers to ROCm.", zh: "能否在 AMD 上跑？RTFM 展示时用的是英伟达 H100 [[13]]。可以衡量的检验是：World Labs 的模型在 AMD Instinct 上能否更快或更便宜，以及这能否把外部开发者吸引到 ROCm。" },
        { en: "Was a model lab the gap that mattered most? An independent benchmark by SemiAnalysis in December 2024 found AMD had not yet crossed Nvidia's CUDA \"moat\", pointing to a \"challenging out of the box experience\" [[39]]. AMD could instead have put comparable capital and management attention into buying or building software, compilers and developer support; buying World Labs puts a bigger stake on models working hand in hand with hardware.", zh: "模型实验室是最要紧的短板吗？独立研究机构 SemiAnalysis 在 2024 年 12 月的基准测试中认为，AMD 还没有跨过英伟达 CUDA 的\"护城河\"，原因之一是软件\"开箱即用\"的体验不佳 [[39]]。AMD 也可以把相当规模的资本和管理精力，用来收购或建设软件、编译器和开发者生态；收购 World Labs，意味着它把更大的筹码押在了模型与硬件的协同上。" },
        { en: "Lab or product? Neither company has said what happens to Marble [[35]]. World Labs could turn from a start-up serving many kinds of hardware into a lab that mainly shows off AMD's.", zh: "实验室还是产品？两家公司都没说 Marble 之后怎么安排 [[35]]。World Labs 可能从一家面向各种硬件的创业公司，变成主要为 AMD 硬件做展示的内部实验室。" },
        { en: "Will customers still share their plans? AMD says it will not compete with the AI companies that buy its chips [[7]], but it will now own a model team of its own.", zh: "客户还会分享路线图吗？AMD 表示不会与购买其芯片的 AI 公司竞争 [[7]]，但它自己也将拥有一支模型团队。" },
        { en: "Will the people stay, and will the deal close? With little public financial data, the valuation appears to rest largely on the team, technology, intellectual property and strategic potential [[35]]. The deal still needs regulatory approval, expected before the end of 2026 [[1]].", zh: "人能留住吗，交易能完成吗？由于缺少公开财务数据，这个估值看起来主要建立在团队、技术、知识产权和战略潜力上 [[35]]。交易仍需通过监管审批，预计 2026 年底前完成 [[1]]。" },
        { en: "Today World Labs shows the future it imagines on a single Nvidia H100. If, two years from now, those worlds run faster and cheaper on AMD Instinct and bring outside developers into ROCm, AMD will have turned its pair of eyes on the future into chip orders. If not, $8.2 billion may have bought only a front-row seat.", zh: "今天，World Labs 用一块英伟达 H100 展示它想象中的未来。两年后，如果这些世界能在 AMD Instinct 上跑得更快、更便宜，并把外部开发者带进 ROCm，AMD 才算把这双\"看见未来的眼睛\"变成了芯片订单。否则，82 亿美元买到的，可能只是观察未来的前排座位。" },
      ],
    },
    { id: "timeline", h: { en: "Timeline", zh: "时间线" }, figure: "timeline", paras: [] },
    {
      id: "countries", h: { en: "One deal, told six ways", zh: "同一笔交易，六种讲法" }, figure: "countries",
      paras: [
        {
          en: "We looked at the articles in our sources about the deal between 28 and 30 September 2026: 37 articles from six countries. Chinese outlets carried more than half of them. This shows only what our sources carried.",
          zh: "我们查看了 2026 年 9 月 28 日至 30 日，收录来源中关于这笔交易的报道：6 个国家，共 37 篇，其中一半以上来自中国媒体。这里只反映我们收录的来源。",
        },
      ],
    },
  ],
  timeline: [
    { date: { en: "2009", zh: "2009 年" }, text: { en: "Fei-Fei Li's team presents ImageNet", zh: "李飞飞团队发表 ImageNet" }, src: [15] },
    { date: { en: "2012", zh: "2012 年" }, text: { en: "AlexNet wins the ImageNet challenge; deep learning takes off", zh: "AlexNet 赢得 ImageNet 挑战赛，深度学习兴起" }, src: [34] },
    { date: { en: "13 Sep 2024", zh: "2024 年 9 月 13 日" }, text: { en: "World Labs emerges with $230 million", zh: "World Labs 公开亮相，融资 2.3 亿美元" }, src: [8] },
    { date: { en: "2025", zh: "2025 年" }, text: { en: "AMD and World Labs partner on inference and training", zh: "AMD 与 World Labs 在推理和训练上合作" }, src: [4] },
    { date: { en: "Oct 2025", zh: "2025 年 10 月" }, text: { en: "RTFM: real-time world generation on one GPU", zh: "RTFM：单块 GPU 实时生成世界" }, src: [13] },
    { date: { en: "12 Nov 2025", zh: "2025 年 11 月 12 日" }, text: { en: "Marble opens to everyone", zh: "Marble 向所有人开放" }, src: [12] },
    { date: { en: "Feb 2026", zh: "2026 年 2 月" }, text: { en: "Raises $1 billion; AMD and Nvidia among investors", zh: "融资 10 亿美元，AMD 和英伟达均参投" }, src: [9] },
    { date: { en: "28 Sep 2026", zh: "2026 年 9 月 28 日" }, text: { en: "AMD agrees to buy World Labs, about $8.2 billion in stock", zh: "AMD 同意以约 82 亿美元股票收购 World Labs" }, src: [1] },
    { date: { en: "By end of 2026", zh: "2026 年底前" }, text: { en: "Expected completion, after regulatory approvals", zh: "预计完成交易（需监管批准）" }, src: [1] },
  ],
  countries: [
    {
      code: "US", count: 6, outlets: "CNBC, TechCrunch, The Verge, MarketWatch, Ars Technica",
      focus: { en: "What AMD is really buying: the talent and model know-how more than a product, and whether it helps AMD against Nvidia.", zh: "AMD 真正买的是什么：比起产品，更看重人才和模型能力，以及这能否帮 AMD 对抗英伟达。" },
      headlines: [
        { t: "The real prize in AMD’s $8 billion World Labs acquisition isn’t what you’d think", outlet: "MarketWatch", url: "https://www.marketwatch.com/story/the-real-prize-in-amds-8-billion-world-labs-acquisition-isnt-what-youd-think-6f609d0f" },
        { t: "AMD acquires World Labs AI startup, upping the ante against Nvidia", outlet: "Ars Technica", url: "https://arstechnica.com/ai/2026/09/amd-acquires-world-labs-ai-pioneer-fei-fei-lis-world-models-startup/" },
        { t: "AMD acquiring Fei-Fei Li's World Labs AI firm in deal worth $8.2 billion", outlet: "CNBC", url: "https://www.cnbc.com/2026/09/28/amd-fei-fei-li-world-labs.html" },
      ],
    },
    {
      code: "CN", count: 22, outlets: "虎嗅, 钛媒体, 36氪, 爱范儿, 极客公园, cnBeta, IT之家, 量子位, 21世纪经济报道, TechNode",
      focus: { en: "By far the most coverage. The price was often converted into yuan (about 55 billion), and many pieces centred on the two people, Lisa Su and Fei-Fei Li, both well known in China; some headlines noted that both are women. Others asked what the deal means for Chinese start-ups in embodied AI.", zh: "报道量最多。价格常换算成人民币（约 550 亿元），很多文章以苏姿丰和李飞飞两位在中国知名度很高的人物为中心，有的标题强调两人都是女性。也有文章讨论这对中国具身智能创业公司意味着什么。" },
      headlines: [
        { t: "82亿美元买下70人的实验室：苏姿丰牵手李飞飞，AMD要用世界模型对抗英伟达", outlet: "虎嗅", url: "https://www.huxiu.com/article/4894488.html" },
        { t: "李飞飞上岸，具身创业者慌了", outlet: "虎嗅", url: "https://www.huxiu.com/article/4894672.html" },
        { t: "AMD 82 亿美元收购 World Labs，买的不只是世界模型", outlet: "极客公园", url: "http://www.geekpark.net/news/372000" },
      ],
    },
    {
      code: "DE", count: 3, outlets: "Handelsblatt, heise online",
      focus: { en: "AMD as the Nvidia challenger trying to catch up in AI chips.", zh: "AMD 作为英伟达的挑战者，想在 AI 芯片上追赶。" },
      headlines: [
        { t: "Künstliche Intelligenz: Nvidia-Rivale AMD kauft Start-up von KI-Vorreiterin", outlet: "Handelsblatt", url: "https://www.handelsblatt.com/technik/it-internet/kuenstliche-intelligenz-nvidia-rivale-amd-kauft-start-up-von-ki-vorreiterin/100258103.html" },
        { t: "AMD will World Labs für 8,2 Milliarden US-Dollar übernehmen", outlet: "heise online", url: "https://www.heise.de/news/AMD-will-World-Labs-fuer-8-2-Milliarden-US-Dollar-uebernehmen-11469699.html" },
      ],
    },
    {
      code: "SG", count: 4, outlets: "CNA, The Straits Times",
      focus: { en: "A bet on \"physical AI\": models for robots and simulation.", zh: "押注\"物理 AI\"：面向机器人和仿真的模型。" },
      headlines: [
        { t: "AMD to buy Fei-Fei Li's World Labs in $8.2 billion bet on 'physical AI'", outlet: "CNA", url: "https://www.channelnewsasia.com/business/amd-buy-fei-fei-lis-world-labs-in-82-billion-bet-physical-ai-6416721" },
        { t: "Nvidia rival AMD to buy industry pioneer’s AI start-up World Labs for US$8.2 billion", outlet: "The Straits Times", url: "https://www.straitstimes.com/business/nvidia-rival-amd-to-buy-industry-pioneers-ai-start-up-world-labs-for-us8-2-billion" },
      ],
    },
    {
      code: "JP", count: 1, outlets: "ITmedia NEWS",
      focus: { en: "AMD's own framing: hardware and models combined in an open AI ecosystem.", zh: "沿用 AMD 自己的说法：硬件和模型结合的开放 AI 生态。" },
      headlines: [
        { t: "AMD、フェイフェイ・リー博士のWorld Labsを約82億ドルで買収へ ハードとモデルを一体化したオープンAIエコシステム加速へ", outlet: "ITmedia NEWS", url: "https://www.itmedia.co.jp/news/article/2609/29/2000001826/" },
      ],
    },
    {
      code: "IN", count: 1, outlets: "The Economic Times",
      focus: { en: "A straight report of the deal and World Labs' spatial-intelligence models.", zh: "直接报道交易本身和 World Labs 的空间智能模型。" },
      headlines: [
        { t: "AMD to acquire Fei-Fei Li's World Labs in $8.2 billion deal", outlet: "The Economic Times", url: "https://economictimes.indiatimes.com/tech/artificial-intelligence/amd-to-acquire-fei-fei-lis-world-labs-in-8-2-billion-deal/articleshow/134555077.cms" },
      ],
    },
  ],
  sources: [
    { n: 1, name: "AMD", title: "AMD to acquire World Labs to advance the future of AI compute (28 Sept 2026)", url: "https://ir.amd.com/news-events/press-releases/detail/1299/amd-to-acquire-world-labs-to-advance-the-future-of-ai-compute" },
    { n: 2, name: "World Labs", title: "World Labs is joining AMD", url: "https://www.worldlabs.ai/blog/amd-announcement" },
    { n: 3, name: "Fei-Fei Li", title: "World Labs joining AMD", url: "https://drfeifei.substack.com/p/worldlabs-joining-amd" },
    { n: 4, name: "TechCrunch", title: "AMD will acquire Fei-Fei Li's World Labs for $8.2 billion", url: "https://techcrunch.com/2026/09/28/amd-will-acquire-fei-fei-lis-world-labs-for-8-2-billion/" },
    { n: 5, name: "Axios", title: "AMD to acquire World Labs for $8.2 billion in stock", url: "https://www.axios.com/pro/all-deals/2026/09/28/amd-world-labs-ai-8-billion" },
    { n: 6, name: "Yahoo Finance", title: "AMD acquires Fei-Fei Li's World Labs", url: "https://finance.yahoo.com/technology/ai/articles/amd-acquires-fei-fei-lis-121544620.html" },
    { n: 7, name: "Stocktwits (via TradingView)", title: "AMD senior exec says it's not the intent to compete with AI customers", url: "https://www.tradingview.com/news/stocktwits:e762b8c1b094b:0-amd-stock-dips-overnight-after-8-2b-world-labs-deal-senior-exec-says-it-s-not-the-intent-to-compete-with-ai-customers/" },
    { n: 8, name: "Maginative", title: "World Labs emerges from stealth with $230 million to build spatial intelligence AI", url: "https://www.maginative.com/article/world-labs-emerges-from-stealth-with-230-million-to-build-spatial-intelligence-ai/" },
    { n: 9, name: "World Labs", title: "World Labs raises $1 billion (18 Feb 2026)", url: "https://www.worldlabs.ai/blog/funding-2026" },
    { n: 10, name: "Crowdfund Insider", title: "AI firm World Labs raises $1 billion at $5 billion valuation", url: "https://www.crowdfundinsider.com/2026/02/262836-ai-firm-world-labs-raises-1-billion-at-5-billion-valuation/" },
    { n: 11, name: "TechCrunch", title: "World Labs lands $200M from Autodesk to bring world models into 3D workflows", url: "https://techcrunch.com/2026/02/18/world-labs-lands-200m-from-autodesk-to-bring-world-models-into-3d-workflows/" },
    { n: 12, name: "World Labs", title: "Marble, a world model", url: "https://www.worldlabs.ai/blog/marble-world-model" },
    { n: 13, name: "World Labs", title: "RTFM: a real-time frame model", url: "https://worldlabs.ai/blog/rtfm" },
    { n: 14, name: "Stanford HAI", title: "Fei-Fei Li", url: "https://hai.stanford.edu/people/fei-fei-li" },
    { n: 15, name: "Wikipedia", title: "Fei-Fei Li", url: "https://en.wikipedia.org/wiki/Fei-Fei_Li" },
    { n: 16, name: "Electronic Design", title: "AMD closes $49 billion acquisition of Xilinx", url: "https://www.electronicdesign.com/technologies/embedded-revolution/article/21216849/electronic-design-amd-closes-49-billion-acquisition-of-xilinxlargest-chip-deal-ever" },
    { n: 17, name: "AMD", title: "AMD to acquire Pensando (4 April 2022)", url: "https://ir.amd.com/news-events/press-releases/detail/1057/amd-expands-data-center-solutions-capabilities-with" },
    { n: 18, name: "OC3D", title: "AMD completes its $665 million acquisition of Silo AI", url: "https://overclock3d.net/news/misc/amd-completes-its-665-million-acquisition-of-silo-ai/" },
    { n: 19, name: "AMD", title: "AMD completes acquisition of ZT Systems", url: "https://ir.amd.com/news-events/press-releases/detail/1240/amd-completes-acquisition-of-zt-systems" },
    { n: 20, name: "CompaniesMarketCap", title: "AMD market capitalization", url: "https://companiesmarketcap.com/amd/marketcap/" },
    { n: 22, name: "Invezz", title: "AMD stock rises as analysts back $8.2B World Labs AI deal", url: "https://invezz.com/ie/news/2026/09/29/amd-stock-rises-as-analysts-back-dollar82b-world-labs-ai-deal/" },
    { n: 23, name: "Investing.com", title: "Stifel on AMD's World Labs deal strategy", url: "https://www.investing.com/news/analyst-ratings/stifel-reiterates-amd-stock-rating-on-world-labs-deal-strategy-93CH-4921958" },
    { n: 24, name: "FinanceFeeds", title: "AMD stock and the $8.2 billion World Labs deal", url: "https://financefeeds.com/amd-stock-world-labs-fei-fei-li-8-2-billion/" },
    { n: 25, name: "GuruFocus", title: "AMD announces $8.2 billion acquisition of World Labs, shares rise premarket", url: "https://www.gurufocus.com/news/9101470/amd-announces-82-billion-acquisition-of-world-labs-shares-rise-premarket" },
    { n: 26, name: "TechCrunch", title: "DeepMind reveals Genie 3, a world model", url: "https://techcrunch.com/2025/08/05/deepmind-reveals-genie-3-a-world-model-that-could-be-the-key-to-reaching-agi" },
    { n: 27, name: "NVIDIA", title: "NVIDIA launches Cosmos world foundation model platform (6 Jan 2025)", url: "https://investor.nvidia.com/news/press-release-details/2025/NVIDIA-Launches-Cosmos-World-Foundation-Model-Platform-to-Accelerate-Physical-AI-Development/default.aspx" },
    { n: 28, name: "Constellation Research", title: "Nvidia's Groq deal: acquisition, acquihire or licensing deal?", url: "https://www.constellationr.com/insights/news/nvidias-groq-deal-acquisition-acquihire-or-creative-licensing-deal" },
    { n: 29, name: "Nasdaq", title: "Meta invests $14.3 billion in Scale AI, taps CEO Alexandr Wang", url: "https://www.nasdaq.com/articles/meta-invests-143-bln-scale-ai-taps-ceo-alexandr-wang-lead-superintelligence-push" },
    { n: 30, name: "SCMP", title: "AMD acquires 'godmother of AI' Li Fei-fei's start-up as battle with Nvidia intensifies", url: "https://www.scmp.com/tech/big-tech/article/3369141/amd-acquires-godmother-ai-li-fei-feis-start-battle-nvidia-intensifies" },
    { n: 32, name: "Princeton Alumni", title: "Fei-Fei Li receives the Woodrow Wilson Award", url: "https://alumni.princeton.edu/stories/fei-fei-li-woodrow-wilson-award" },
    { n: 33, name: "AMD", title: "AMD acquires MK1 to advance AI inference performance", url: "https://www.amd.com/en/blogs/2025/amd-acquires-mk1-to-advance-ai-inference-performance.html" },
    { n: 34, name: "Wikipedia", title: "ImageNet", url: "https://en.wikipedia.org/wiki/ImageNet" },
    { n: 35, name: "Tech Times", title: "AMD buys World Labs: Fei-Fei Li will now shape the chips that run physical AI", url: "https://www.techtimes.com/articles/328200/20260929/amd-buys-world-labs-fei-fei-li-will-now-shape-chips-that-run-physical-ai.htm" },
    { n: 37, name: "World Labs", title: "A functional taxonomy of world models (3 June 2026)", url: "https://www.worldlabs.ai/blog/taxonomy-of-world-models" },
    { n: 38, name: "AMD (SEC form 8-K)", title: "Agreement to acquire World Labs (28 Sept 2026)", url: "https://ir.amd.com/financial-information/sec-filings/content/0000002488-26-000182/amd-20260926.htm" },
    { n: 40, name: "AMD", title: "AMD reports 2014 fourth quarter and annual results", url: "https://ir.amd.com/news-events/press-releases/detail/589/amd-reports-2014-fourth-quarter-and-annual-results" },
    { n: 41, name: "CNBC", title: "AMD hits $1 trillion market cap as stock continues 5-day rally", url: "https://www.cnbc.com/2026/09/21/amd-stock-1-trillion-value.html" },
    { n: 42, name: "AMD", title: "AMD appoints Dr. Lisa Su as president and chief executive officer (8 Oct 2014)", url: "https://ir.amd.com/news-events/press-releases/detail/568/amd-appoints-dr-lisa-su-as-president-and-chief-executive-officer" },
    { n: 39, name: "SemiAnalysis", title: "MI300X vs H100 vs H200 benchmark, part 1: training (22 Dec 2024)", url: "https://newsletter.semianalysis.com/p/mi300x-vs-h100-vs-h200-benchmark-part-1-training" },
    { n: 36, name: "AMD (SEC filing)", title: "AMD to acquire ZT Systems (19 August 2024)", url: "https://www.sec.gov/Archives/edgar/data/2488/000119312524202457/d808469dex991.htm" },
  ],
  stats: [
    { label: { en: "World Labs' value", zh: "World Labs 估值" }, from: 1, to: 8.2, fromLabel: { en: "2024", zh: "2024 年" }, toLabel: { en: "AMD deal", zh: "AMD 收购价" }, unit: "bn", src: [11, 1] },
    { label: { en: "Money World Labs raised", zh: "World Labs 累计融资" }, from: 0.23, to: 1.23, fromLabel: { en: "2024", zh: "2024 年" }, toLabel: { en: "Feb 2026", zh: "2026 年 2 月" }, unit: "bn", src: [8, 10] },
    { label: { en: "New AMD shares, share of total", zh: "新股占 AMD 股本" }, from: 0, to: 0.8, fromLabel: { en: "", zh: "" }, toLabel: { en: "estimate; final count set at closing", zh: "估算，最终以交割时为准" }, unit: "pct", src: [24, 38] },
  ],
  name: "World Labs", legalName: "World Labs", newsMatch: { src: "World Labs|Fei-Fei Li|李飞飞", flags: "i" },
  alwaysCite: [16, 17, 18, 19, 36],
  method: {
    en: "Method: drafted with AI from the sources above and checked line by line by an editor. The 2026 valuation of World Labs is a press report the company did not confirm. This is not investment advice. Found a mistake? Email ",
    zh: "写法：本文由 AI 根据上列来源整理，编辑逐条核对。World Labs 2026 年的估值来自媒体报道，公司未证实。本文不构成投资建议。发现错误请写信到 ",
  },
  // $ billion: announced or completed deal values [16][17][18][19][1]
  priceTags: {
    title: { en: "AMD's largest acquisitions ($ billion)", zh: "AMD 历次大额收购（十亿美元）" },
    note: {
      en: "Xilinx is the value at completion in 2022; ZT Systems includes a contingent payment of up to $400 million. Smaller deals (Nod.ai, Brium, Enosemi, MK1) had undisclosed prices. Sources: AMD, Electronic Design, OC3D.", 
      zh: "Xilinx 为 2022 年完成时的价值；ZT Systems 含最多 4 亿美元的或有付款。较小的收购（Nod.ai、Brium、Enosemi、MK1）价格未公开。来源：AMD、Electronic Design、OC3D。",
    },
    legend: [{ en: "Earlier deals", zh: "此前的收购" }, { en: "World Labs", zh: "World Labs" }],
    rows: [
      { label: { en: "Xilinx, 2022", zh: "Xilinx，2022" }, v: 49, kind: "deal" },
      { label: { en: "World Labs, 2026", zh: "World Labs，2026" }, v: 8.2, kind: "market" },
      { label: { en: "ZT Systems, 2025", zh: "ZT Systems，2025" }, v: 4.9, kind: "deal" },
      { label: { en: "Pensando, 2022", zh: "Pensando，2022" }, v: 1.9, kind: "deal" },
      { label: { en: "Silo AI, 2024", zh: "Silo AI，2024" }, v: 0.665, kind: "deal" },
    ],
  },
  // $ billion [11][10][1]
  priceTags2: {
    title: { en: "What World Labs was worth ($ billion)", zh: "World Labs 值多少钱（十亿美元）" },
    note: {
      en: "2024 and 2026 are valuations at funding rounds; the 2026 figure was reported by the press and not confirmed by World Labs. Sources: TechCrunch, Crowdfund Insider, AMD.",
      zh: "2024 年和 2026 年为融资时的估值，其中 2026 年的数字来自媒体报道，World Labs 未证实。来源：TechCrunch、Crowdfund Insider、AMD。",
    },
    legend: [{ en: "Funding-round valuation", zh: "融资估值" }, { en: "AMD's price", zh: "AMD 收购价" }],
    rows: [
      { label: { en: "Sep 2024, first round", zh: "2024.9，首轮" }, v: 1, kind: "deal" },
      { label: { en: "Feb 2026, reported", zh: "2026.2，媒体报道" }, v: 5, kind: "deal" },
      { label: { en: "Sep 2026, AMD deal", zh: "2026.9，AMD 收购" }, v: 8.2, kind: "market" },
    ],
  },
  ig: {
    poster: {
      title: { en: "AMD bets on\nworld models", zh: "AMD 押注\n世界模型" },
      sub: { en: "Buying World Labs for $8.2B", zh: "82 亿美元拟收购 World Labs" },
      line: { en: "Letting model makers\nshape the next chips", zh: "让做模型的人，\n反过来定义下一代芯片" },
    },
    explain: {
      kicker: { en: "START HERE", zh: "零基础先看" },
      rows: [
        { q: { en: "What is World Labs?", zh: "World Labs 是什么？" }, a: { en: "A two-year-old AI company that turns a sentence or a photo into a 3D world you can walk through.", zh: "成立两年的 AI 公司：一句话或一张照片，就能变成可以走进去的 3D 世界。" } },
        { q: { en: "What is a world model?", zh: "世界模型是什么？" }, a: { en: "AI that learns how real space looks and works. So far it builds places for games and films; training robots is still at the experiment stage.", zh: "让 AI 理解真实空间长什么样、怎么运作。目前主要用来搭建游戏和影视场景，训练机器人还在实验阶段。" } },
        { q: { en: "Who is Fei-Fei Li?", zh: "李飞飞是谁？" }, a: { en: "The Stanford scientist who led ImageNet: 14 million hand-labelled photos that became the test computers learned to see with.", zh: "斯坦福科学家，主导建立 ImageNet：1400 多万张人工标注的照片，成了电脑学会\"看图\"的考卷。" } },
      ],
    },
    numbers: {
      kicker: { en: "ONE DEAL, THREE NUMBERS", zh: "一笔交易，三个数字" },
      rows: [
        { big: { en: "$8.2B", zh: "82 亿美元" }, label: { en: "all in AMD shares", zh: "全部以 AMD 股票支付" }, sub: { en: "Announced 28 September 2026", zh: "2026 年 9 月 28 日宣布" } },
        { big: { en: "$1B → $8.2B", zh: "10 亿 → 82 亿美元" }, label: { en: "World Labs' value", zh: "World Labs 估值" }, sub: { en: "2024 funding round → AMD's price", zh: "2024 年融资 → AMD 收购价" } },
        { big: { en: "No. 2", zh: "第 2 大" }, label: { en: "AMD's biggest deal after Xilinx, if completed", zh: "若完成，仅次于 Xilinx 的 AMD 收购" }, sub: { en: "Fei-Fei Li to become AMD's chief scientist", zh: "李飞飞将出任 AMD 首席科学家" } },
      ],
      source: { en: "Sources: AMD, TechCrunch, Yahoo Finance", zh: "来源：AMD、TechCrunch、Yahoo Finance" },
    },
    decisionsKicker: { en: "WHY AMD PAID", zh: "AMD 为什么买" },
    decisions: [
      { h: { en: "Get closer to the models", zh: "离模型更近" }, tag: "Research", t: { en: "Lisa Su: building AI hardware needs a deep understanding of how models are evolving.", zh: "苏姿丰：为下一代 AI 造硬件，需要深入理解模型如何演进。" } },
      { h: { en: "Fill a gap", zh: "补上空白" }, tag: "World models", t: { en: "Stifel: AMD had released only text and video open models; Nvidia has Cosmos.", zh: "Stifel：AMD 此前只有文本和视频开放模型，英伟达已有 Cosmos。" } },
      { h: { en: "Hire a leader, not only a lab", zh: "买下团队和领路人" }, tag: "Fei-Fei Li", t: { en: "Li is to become AMD's executive vice president and chief scientist, reporting to Su.", zh: "李飞飞将出任 AMD 执行副总裁兼首席科学家，向苏姿丰汇报。" } },
    ],
    chart: {
      kind: "tags", kicker: { en: "AMD'S BIGGEST DEALS", zh: "AMD 的大额收购" },
      sub: { en: "Only Xilinx cost more.", zh: "只有 Xilinx 比它更贵。" },
      foot: { en: "AMD, Electronic Design, OC3D", zh: "AMD、Electronic Design、OC3D" },
    },
    countries: {
      kicker: { en: "ONE DEAL, SIX COUNTRIES", zh: "一笔交易，六个国家" },
      title: { en: "How outlets in six countries reported AMD buying World Labs", zh: "六个国家的媒体，怎么报道 AMD 收购 World Labs" },
      rows: [
        { flags: ["us"], name: { en: "United States", zh: "美国" }, t: { en: "What AMD really buys: talent and model know-how, and a stronger hand against Nvidia.", zh: "AMD 真正买的是人才和模型能力，以及对抗英伟达的筹码。" } },
        { flags: ["cn"], name: { en: "China", zh: "中国" }, t: { en: "The most coverage: the price in yuan, the two leaders, and what it means for embodied-AI start-ups.", zh: "报道最多：换算成人民币的价格、两位主角，以及对具身智能创业公司的影响。" } },
        { flags: ["de", "sg"], name: { en: "Germany and Singapore", zh: "德国、新加坡" }, t: { en: "The Nvidia rival catching up, and a bet on \"physical AI\".", zh: "英伟达的对手在追赶，以及对\"物理 AI\"的押注。" } },
      ],
      foot: { en: "37 articles in our sources, 28 to 30 September 2026", zh: "我们收录的 37 篇报道，2026 年 9 月 28 日至 30 日" },
    },
  },
};

const WILSON: Profile = {
  slug: "sophie-wilson", no: 4, companyId: 335, companySlug: "arm-holdings", about: "person", newsName: "Arm",
  title: { en: "Sophie Wilson: How Chips Learned to Save Power", zh: "Sophie Wilson：让芯片学会省电" },
  dek: {
    en: "In the 1980s she designed an instruction set for a British home computer. It became the foundation of the chips in today's phones.",
    zh: "1980 年代她为一台英国电脑设计的指令集，后来成了手机芯片的基础。",
  },
  social: { en: "She designed the first ARM chip's instruction set", zh: "她设计了第一颗 ARM 芯片的指令集" },
  igHook: { en: "Almost every phone today runs on chips that grew from her 1980s design", zh: "几乎每部手机里的芯片，\n都源自她四十年前的设计" },
  seoTitle: { en: "Sophie Wilson: Designer of the ARM Instruction Set and BBC BASIC", zh: "Sophie Wilson：ARM 指令集与 BBC BASIC 的设计者" },
  seoDesc: {
    en: "Who is Sophie Wilson? The Acorn engineer who wrote BBC BASIC, helped build the BBC Micro in a week and designed the ARM instruction set in 1983. Why the first ARM chip had just 25,000 transistors, how it ran on a tenth of a watt, and how it led to the chips in almost every smartphone, with every fact sourced.",
    zh: "Sophie Wilson 是谁？她为 Acorn 写了 BBC BASIC，一周内参与造出 BBC Micro 原型，1983 年设计了 ARM 指令集。第一颗 ARM 芯片为什么只有 2.5 万个晶体管、只用约 0.1 瓦，又如何发展成几乎每部智能手机里的芯片，每个事实附来源。",
  },
  keywords: ["Sophie Wilson", "ARM instruction set", "ARM 指令集", "BBC BASIC", "BBC Micro", "Acorn Computers", "ARM1", "Steve Furber", "RISC", "精简指令集", "Arm 创始", "FirePath", "Broadcom"],
  published: "2026-10-18", updated: "2026-10-18",
  cover: { file: "Acorn-ARM-Evaluation-System.jpg", credit: "Peter Howkins", license: "CC BY-SA 3.0",
    caption: { en: "The ARM1, the first ARM processor, on an Acorn ARM Evaluation System board.", zh: "第一颗 ARM 处理器 ARM1，装在 Acorn 的 ARM 评估系统电路板上。" },
    alt: { en: "Close-up of the ARM1 chip in its socket on a green circuit board", zh: "绿色电路板上插座里的 ARM1 芯片特写" } },
  lede: [
    {
      en: "On 26 April 1985 the first ARM processor came back from the factory to Acorn Computers in Cambridge, England, and worked first time [[1]][[4]]. Then the engineers noticed something odd: a fault on the test board meant no power was reaching the chip, yet it kept running on current leaking from the circuits around it [[3]][[4]]. It used about a tenth of a watt [[3]].",
      zh: "1985 年 4 月 26 日，第一颗 ARM 处理器从工厂送回英国剑桥的 Acorn 公司，第一次通电就能运行 [[1]][[4]]。随后工程师发现了一件怪事：测试板有故障，电源根本没有接到芯片上，它却靠周围电路漏过来的电流继续运行 [[3]][[4]]。它的功耗只有大约十分之一瓦 [[3]]。",
    },
    {
      en: "Sophie Wilson designed its instruction set. Today 99% of smartphones are based on Arm technology, by Arm's count, and more than 350 billion Arm-based chips have been shipped [[10]][[11]]. Was the low power planned? Wilson's own answer: \"making it power efficient was an accident. In hindsight, it was an obvious accident\" [[1]]. This is the story of the choice that made the accident possible.",
      zh: "这颗芯片的指令集由 Sophie Wilson 设计。今天，按 Arm 的统计，99% 的智能手机基于 Arm 技术，基于 Arm 的芯片累计出货超过 3500 亿颗 [[10]][[11]]。低功耗是计划好的吗？Wilson 自己的回答是：\"省电是个意外。事后看，是个显而易见的意外\" [[1]]。这篇文章讲的，是让这个意外成为可能的那个选择。",
    },
  ],
  sections: [
    {
      id: "start", h: { en: "Start here: what is an instruction set?", zh: "先读这里：什么是指令集？" },
      paras: [
        {
          en: "A processor only understands a short list of basic commands: add two numbers, copy a number from memory, jump to another step. That list is its instruction set. Every app is finally turned into these commands. Whoever designs the list decides how much work the chip must do for each command, and so how big and complicated the chip has to be.",
          zh: "处理器只听得懂一小串基本命令：把两个数相加、从内存里取一个数、跳到另一步。这串命令就是它的指令集。每一个应用最后都要变成这些命令。设计这串命令的人，决定了芯片执行每条命令要做多少事，也就决定了芯片要做得多大、多复杂。",
        },
        {
          en: "In the early 1980s most new processors had long lists of powerful, complicated commands. A different idea, later called RISC (reduced instruction set computer), was coming out of universities in California: fewer, simpler commands that each run quickly [[1]]. Acorn's choice, made by Wilson, Furber and the company's co-founder Hermann Hauser, was which of these two roads to take [[1]].",
          zh: "1980 年代初，大多数新处理器都有一长串功能强、但复杂的命令。加州的大学里正在出现另一种思路，后来叫 RISC（精简指令集计算机）：命令更少、更简单，每条都执行得很快 [[1]]。Acorn 面对的选择，就是走哪一条路，做决定的是 Wilson、Furber 和公司联合创始人 Hermann Hauser [[1]]。",
        },
      ],
    },
    {
      id: "bbc", h: { en: "A computer built in a week", zh: "一周造出一台电脑" },
      photo: { file: "Acorn BBC Micro.jpg", credit: "simon.inns", license: "CC BY 2.0",
        caption: { en: "A BBC Micro Model B from 1982. More than a million were sold.", zh: "1982 年的 BBC Micro Model B。这款电脑卖出了一百多万台。" },
        alt: { en: "Beige BBC Micro computer with red function keys", zh: "带红色功能键的米色 BBC Micro 电脑" } },
      paras: [
        {
          en: "Wilson started at Selwyn College, Cambridge, in 1975, studying mathematics and then computer science [[6]][[1]]. While still a student she designed hardware that led to Acorn's first product, the Acorn System 1 [[7]].",
          zh: "Wilson 1975 年进入剑桥大学塞尔文学院，先读数学，再读计算机科学 [[6]][[1]]。还在读书时，她设计的硬件就直接促成了 Acorn 的第一款产品 Acorn System 1 [[7]]。",
        },
        {
          en: "In early 1981 the BBC was looking for a computer for a national computer-literacy series. By Wilson's account, she, Steve Furber and colleagues started drawing the design on a Monday and finished wiring it on Thursday night. At two on Friday morning it still did not work and she went home to sleep; when she came back at eight it was running, and she got BBC BASIC going before the BBC arrived at ten [[1]][[2]]. Acorn won the contract. The BBC Micro shipped with BBC BASIC, the programming language Wilson wrote, and more than a million were sold [[8]].",
          zh: "1981 年初，BBC 在为一档全国性的电脑普及节目寻找一台电脑。据 Wilson 回忆，她、Steve Furber 和同事们周一开始画设计图，周四夜里完成接线。到周五凌晨两点，机器还是不能运行，她回家睡觉；早上八点回来时它已经跑起来了，她赶在十点 BBC 的人到来之前让 BBC BASIC 运行起来 [[1]][[2]]。Acorn 拿下了合同。BBC Micro 自带 Wilson 编写的编程语言 BBC BASIC，卖出了一百多万台 [[8]]。",
        },
        {
          en: "The success left Acorn with a problem: what processor should its next, more powerful computer use?",
          zh: "成功也给 Acorn 带来一个难题：下一台更强的电脑，该用什么处理器？",
        },
      ],
    },
    {
      id: "choice", h: { en: "The choice: design our own, and keep it simple", zh: "抉择：自己设计，而且要简单" }, figure: "pricetags",
      paras: [
        {
          en: "The team tried the new processors on the market and found they did not make good use of the memory, which was becoming fast enough to feed a quicker chip [[1]][[3]]. In 1983 Wilson and colleagues visited the Western Design Center in Phoenix, Arizona, which was designing new chips in the 6502 family, the processor inside the BBC Micro. They found, in Wilson's words, \"a couple of senior engineers, and a bunch of college kids\" designing processors, and came away \"utterly convinced that designing processors was simple\" [[3]].",
          zh: "团队试用了市面上的新处理器，发现它们没能用好内存，而当时的内存已经快到可以喂饱一颗更快的芯片 [[1]][[3]]。1983 年，Wilson 和同事去了美国亚利桑那州凤凰城的西部设计中心，那里在设计 6502 系列的新芯片，BBC Micro 用的正是 6502。用 Wilson 的话说，他们看到的是\"几个资深工程师，加上一群大学生\"在设计处理器，回来时\"完全相信设计处理器是件简单的事\" [[3]]。",
        },
        {
          en: "Back in Cambridge, by Wilson's account, the computer scientist Andy Hopper had put the early RISC research papers on Wilson's desk. \"I looked at them all, and thought, 'Hmm, we could do this'\", she recalled [[1]]. She designed the instruction set; Furber worked out how the chip would carry it out, and wrote the first model of it in BBC BASIC [[1]][[4]].",
          zh: "回到剑桥，据 Wilson 回忆，计算机科学家 Andy Hopper 把早期的 RISC 研究论文放到了 Wilson 的桌上。她回忆说：\"我把它们都看了一遍，心想：嗯，这个我们能做\" [[1]]。她设计指令集；Furber 负责芯片如何执行这些指令，并用 BBC BASIC 写出了它的第一个模型 [[1]][[4]]。",
        },
        {
          en: "The result was small. The first ARM had about 25,000 transistors [[1]][[3]]. Intel's 386, launched the same year, had 275,000 [[9]]. Wilson put it plainly: \"making the processor itself was a low number of people, and it was a simple processor\" [[1]].",
          zh: "结果是一颗很小的芯片。第一颗 ARM 只有大约 2.5 万个晶体管 [[1]][[3]]，而同一年推出的英特尔 386 有 27.5 万个 [[9]]。Wilson 说得很直白：\"做这颗处理器的人很少，它也是一颗简单的处理器\" [[1]]。",
        },
      ],
    },
    {
      id: "chip", h: { en: "Small enough to sip power", zh: "小到几乎不费电" },
      paras: [
        {
          en: "In general, fewer transistors means less power. Low power was not the goal: the chip only had to stay under 1 watt so it could go in a cheap plastic package [[3]]. A chip designed to be simple and cheap came in far below that, at about a tenth of a watt, and even ran on leakage when its power line was cut [[1]][[3]][[4]].",
          zh: "一般来说，晶体管越少，耗电就越少。低功耗并不是目标：芯片只需要把功耗控制在 1 瓦以下，好装进便宜的塑料封装 [[3]]。这颗为简单、便宜而设计的芯片，最后远远低于这个标准，只用大约十分之一瓦，电源线断开时甚至还能靠漏电运行 [[1]][[3]][[4]]。",
        },
        {
          en: "It mattered later. In 1990 the design team became a separate company, Arm, and battery-powered devices, from Nokia phones to the first iPhone, made its low power a selling point, as our previous issue on Arm tells [[14]][[15]].",
          zh: "这一点后来变得至关重要。1990 年，设计团队独立成一家公司，就是 Arm；从诺基亚手机到第一代 iPhone，这些靠电池工作的设备让低功耗成了它的卖点，我们上一期的 Arm 专题讲了这段故事 [[14]][[15]]。",
        },
      ],
    },
    {
      id: "after", h: { en: "After Acorn: another processor, and the honours", zh: "离开 Acorn 之后：又一颗处理器，和迟来的荣誉" },
      photo: { file: "Sophie Wilson.jpg", credit: "Chris Monk", license: "CC BY 2.0", fit: "contain",
        caption: { en: "Sophie Wilson in March 2013, beside a large plot of the first ARM processor.", zh: "2013 年 3 月，Sophie Wilson 站在第一颗 ARM 处理器的大幅版图旁。" },
        alt: { en: "Sophie Wilson pointing at a large printed chip layout", zh: "Sophie Wilson 指着一张大幅芯片版图" } },
      paras: [
        {
          en: "Wilson stayed in chip design. She was one of seven people who launched Element 14 as a buy-out from Acorn; Broadcom bought it in 2000. She designed its FirePath processor [[6]][[3]][[5]]. By her account in 2012, Broadcom had become \"the volume leader by a long way\" in the central-office equipment that runs DSL broadband, using FirePath [[1]].",
          zh: "Wilson 一直在做芯片设计。她是从 Acorn 管理层收购中创办 Element 14 的七人之一，公司 2000 年被博通收购；她设计了它的 FirePath 处理器 [[6]][[3]][[5]]。按她 2012 年的说法，博通凭借 FirePath，在运营商机房里支撑 DSL 宽带的设备上\"遥遥领先\" [[1]]。",
        },
        {
          en: "The recognition came decades after the chip. The Computer History Museum named her and Furber Fellows in 2012; she was elected a Fellow of the Royal Society in 2013, received an honorary doctorate from Cambridge in 2017, and was appointed CBE in 2019 \"for services to computing\" [[2]][[5]][[13]][[12]].",
          zh: "荣誉在芯片问世几十年后才到来。2012 年，美国计算机历史博物馆授予她和 Furber 院士称号；2013 年她当选英国皇家学会院士，2017 年获剑桥大学荣誉博士学位，2019 年因\"对计算机领域的贡献\"获授 CBE 勋衔 [[2]][[5]][[13]][[12]]。",
        },
      ],
    },
    { id: "timeline", h: { en: "Timeline", zh: "时间线" }, figure: "timeline", paras: [] },
    {
      id: "end", h: { en: "An obvious accident", zh: "一个显而易见的意外" },
      paras: [
        {
          en: "So was the low power an accident? In one sense, yes: it was never the goal [[1]]. In our view, the choice behind it was deliberate: a small team decided a processor should be simple enough for a small team to build, and power savings followed. At a 2025 event marking 40 years since the first ARM chip ran, Wilson said they had thought it \"a really obvious way to build a processor and everybody would be doing it… That turned out not to be the case\" [[4]].",
          zh: "那么，低功耗是意外吗？从某种意义上说是的：它从来不是目标 [[1]]。在我们看来，它背后的选择却是有意的：一个小团队决定，处理器要简单到一个小团队就能做出来，省电随之而来。2025 年，在纪念第一颗 ARM 芯片运行 40 周年的活动上，Wilson 说，他们当年以为\"这是做处理器再明显不过的办法，所有人都会这么做……结果并不是这样\" [[4]]。",
        },
      ],
    },
  ],
  timeline: [
    { date: { en: "1975", zh: "1975 年" }, text: { en: "Starts at Selwyn College, Cambridge", zh: "进入剑桥大学塞尔文学院" }, src: [6] },
    { date: { en: "Feb 1981", zh: "1981 年 2 月" }, text: { en: "With Steve Furber, builds the BBC Micro prototype in under a week", zh: "与 Steve Furber 不到一周造出 BBC Micro 原型" }, src: [1, 2] },
    { date: { en: "1983", zh: "1983 年" }, text: { en: "Visits the Western Design Center; starts designing the ARM instruction set", zh: "参观西部设计中心，开始设计 ARM 指令集" }, src: [3, 1] },
    { date: { en: "26 Apr 1985", zh: "1985 年 4 月 26 日" }, text: { en: "First ARM chip arrives and works first time", zh: "第一颗 ARM 芯片送回，首次通电即运行" }, src: [1, 4] },
    { date: { en: "2000", zh: "2000 年" }, text: { en: "Element 14, which she co-founded, bought by Broadcom", zh: "她参与创办的 Element 14 被博通收购" }, src: [6, 3] },
    { date: { en: "2012", zh: "2012 年" }, text: { en: "Computer History Museum Fellow, with Furber", zh: "与 Furber 一同获计算机历史博物馆院士称号" }, src: [2] },
    { date: { en: "2013", zh: "2013 年" }, text: { en: "Elected Fellow of the Royal Society", zh: "当选英国皇家学会院士" }, src: [5] },
    { date: { en: "2017", zh: "2017 年" }, text: { en: "Honorary doctorate, University of Cambridge", zh: "获剑桥大学荣誉博士学位" }, src: [13] },
    { date: { en: "2019", zh: "2019 年" }, text: { en: "Appointed CBE for services to computing", zh: "因对计算机领域的贡献获授 CBE" }, src: [12] },
  ],
  countries: [],
  sources: [
    { n: 1, name: "Computer History Museum", title: "Oral history of Sophie Wilson (2012, transcript)", url: "https://archive.computerhistory.org/resources/access/text/2012/06/102746190-05-01-acc.pdf" },
    { n: 2, name: "Computer History Museum", title: "Sophie Wilson, 2012 Fellow", url: "https://computerhistory.org/profile/sophie-wilson/" },
    { n: 3, name: "The Register", title: "ARM creators Sophie Wilson and Steve Furber, part two: the accidental chip (2012)", url: "https://www.theregister.com/2012/05/03/unsung_heroes_of_tech_arm_creators_sophie_wilson_and_steve_furber/" },
    { n: 4, name: "The Register", title: "808 lines of BBC BASIC and a dream: Arm architecture turns 40 (2025)", url: "https://www.theregister.com/2025/04/29/arm_40/" },
    { n: 5, name: "Royal Society", title: "Sophie Wilson FRS", url: "https://royalsociety.org/people/Sophie-Wilson-12544" },
    { n: 6, name: "Selwyn College, Cambridge", title: "Recognition for computer pioneer (2016)", url: "https://www.sel.cam.ac.uk/news/recognition-computer-pioneer" },
    { n: 7, name: "Centre for Computing History", title: "Sophie Wilson", url: "https://www.computinghistory.org.uk/det/6615/Sophie-Wilson/" },
    { n: 8, name: "Computer History Museum", title: "The BBC Micro (2012)", url: "https://computerhistory.org/blog/the-bbc-micro/" },
    { n: 9, name: "Intel", title: "History of Intel chips (timeline)", url: "https://intel.la/content/dam/www/public/us/en/documents/corporate-information/history-intel-chips-timeline-poster.pdf" },
    { n: 10, name: "Arm", title: "About Arm", url: "https://www.arm.com/company" },
    { n: 11, name: "Arm", title: "Smartphones", url: "https://arm.com/markets/consumer-technologies/smartphones" },
    { n: 12, name: "The London Gazette", title: "Birthday Honours 2019 (CBE)", url: "https://www.thegazette.co.uk/notice/3294155" },
    { n: 13, name: "Cambridge Network", title: "University of Cambridge honorary degrees 2017", url: "https://www.cambridgenetwork.co.uk/news/university-cambridge-honorary-degrees-2017" },
    { n: 14, name: "Arm", title: "Arm's official history", url: "https://newsroom.arm.com/blog/arm-official-history" },
    { n: 15, name: "Arm", title: "35 years of Arm technology innovation", url: "https://newsroom.arm.com/blog/arm-35-years-technology-innovation" },
  ],
  stats: [
    { label: { en: "Transistors in the first ARM", zh: "第一颗 ARM 的晶体管" }, from: 0, to: 25000, unit: "n", fromLabel: { en: "", zh: "" }, toLabel: { en: "1985; Intel's 386 that year: 275,000", zh: "1985 年；同年英特尔 386 为 27.5 万" },
      line: { en: "25,000 transistors, 1985", zh: "1985 年，2.5 万个晶体管" }, src: [1, 9] },
    { label: { en: "BBC Micros sold", zh: "BBC Micro 销量" }, from: 0, to: 1000000, unit: "n", suffix: { en: "+", zh: "+ 台" }, fromLabel: { en: "", zh: "" }, toLabel: { en: "more than a million", zh: "超过一百万台" }, src: [8] },
    { label: { en: "Smartphones based on Arm", zh: "基于 Arm 的智能手机" }, from: 0, to: 99, unit: "pct", fromLabel: { en: "", zh: "" }, toLabel: { en: "99%, Arm's figure", zh: "99%，Arm 公布" }, src: [11] },
  ],
  name: "Sophie Wilson", legalName: "Sophie Wilson", newsMatch: { src: "\\b(Arm|ARM)\\b|安谋", flags: "" },
  alwaysCite: [9],
  method: {
    en: "Method: drafted with AI from the sources above and checked line by line by an editor. This profile covers public work, decisions and public statements only. Quotes are from the interviews and talks cited. Found a mistake? Email ",
    zh: "写法：本文由 AI 根据上列来源整理，编辑逐条核对。本文只写公开的工作、决定和公开发言。引语出自所列访谈和演讲，由我们翻译。发现错误请写信到 ",
  },
  // transistor counts [1][3][9]
  priceTags: {
    title: { en: "Transistors in a processor, mid-1980s", zh: "1980 年代中期，一颗处理器有多少晶体管" },
    note: { en: "ARM1 about 25,000 (Wilson; The Register). Intel figures from Intel's own chip timeline.", zh: "ARM1 约 2.5 万个（Wilson；The Register）。英特尔数字来自英特尔官方芯片时间线。" },
    legend: [{ en: "Intel", zh: "英特尔" }, { en: "ARM1", zh: "ARM1" }], unit: "n",
    rows: [
      { label: { en: "Intel 286 (1982)", zh: "英特尔 286（1982）" }, v: 134000, kind: "deal" },
      { label: { en: "Intel 386 (1985)", zh: "英特尔 386（1985）" }, v: 275000, kind: "deal" },
      { label: { en: "ARM1 (1985)", zh: "ARM1（1985）" }, v: 25000, kind: "market" },
    ],
  },
  ig: {
    explain: {
      kicker: { en: "START HERE", zh: "先读这里" },
      rows: [
        { q: { en: "What is an instruction set?", zh: "什么是指令集？" }, a: { en: "The short list of basic commands a processor understands. Every app is finally turned into them.", zh: "处理器听得懂的一小串基本命令。每个应用最后都要变成这些命令。" } },
        { q: { en: "Why does simple matter?", zh: "为什么简单很重要？" }, a: { en: "Simpler commands need fewer transistors, and fewer transistors use less power.", zh: "命令越简单，需要的晶体管越少，耗电也越少。" } },
        { q: { en: "Where is it now?", zh: "它现在在哪里？" }, a: { en: "99% of smartphones are based on Arm technology, which grew from her design.", zh: "99% 的智能手机基于 Arm 技术，而 Arm 正是从她的设计发展而来。" } },
      ],
    },
    numbers: {
      kicker: { en: "ONE DESIGN, THREE NUMBERS", zh: "一个设计，三个数字" },
      rows: [
        { big: { en: "25,000", zh: "2.5 万" }, label: { en: "transistors in the first ARM, 1985", zh: "个晶体管，第一颗 ARM，1985 年" }, sub: { en: "Intel's 386 that year: 275,000", zh: "同年英特尔 386：27.5 万个" } },
        { big: { en: "0.1 W", zh: "0.1 瓦" }, label: { en: "about what it used", zh: "左右的功耗" }, sub: { en: "It even ran on leakage with its power cut", zh: "电源断开时，甚至靠漏电也能运行" } },
        { big: { en: "350 billion+", zh: "3500 亿颗+" }, label: { en: "Arm-based chips shipped so far", zh: "基于 Arm 的芯片累计出货" }, sub: { en: "Arm's count", zh: "Arm 公布的数字" } },
      ],
      source: { en: "Sources: Computer History Museum, The Register, Intel, Arm", zh: "来源：计算机历史博物馆、The Register、英特尔、Arm" },
    },
    decisionsKicker: { en: "THREE CHOICES", zh: "三个选择" },
    decisions: [
      { h: { en: "Build it in a week", zh: "一周造出原型" }, tag: "BBC Micro · 1981", t: { en: "With Steve Furber and colleagues she built the prototype that won Acorn the BBC contract, and wrote BBC BASIC.", zh: "她和 Steve Furber 等同事赶出了帮 Acorn 拿下 BBC 合同的原型机，还写了 BBC BASIC。" } },
      { h: { en: "Design our own processor", zh: "自己设计处理器" }, tag: "RISC · 1983", t: { en: "After seeing a tiny team design chips in Phoenix: \"Hmm, we could do this.\"", zh: "在凤凰城看到一个小团队在设计芯片后，她想：\"嗯，这个我们能做。\"" } },
      { h: { en: "Keep it simple", zh: "保持简单" }, tag: "ARM1 · 1985", t: { en: "25,000 transistors. Low power came with it, \"an obvious accident\", she says.", zh: "2.5 万个晶体管，低功耗随之而来。她说，这是\"一个显而易见的意外\"。" } },
    ],
    chart: {
      kind: "tags", kicker: { en: "SMALL BY DESIGN", zh: "小，是设计出来的" },
      sub: { en: "Transistors in a processor, mid-1980s.", zh: "1980 年代中期，一颗处理器有多少晶体管。" },
      foot: { en: "Intel; Computer History Museum; The Register", zh: "英特尔；计算机历史博物馆；The Register" },
    },
    countries: {
      kicker: { en: "THEN AND NOW", zh: "从那时到现在" },
      title: { en: "From one British computer to almost every phone", zh: "从一台英国电脑，到几乎每部手机" },
      rows: [
        { flags: [], name: { en: "1981 · BBC Micro", zh: "1981 · BBC Micro" }, t: { en: "Built in under a week; more than a million sold.", zh: "不到一周造出原型，卖出一百多万台。" } },
        { flags: [], name: { en: "1985 · ARM1", zh: "1985 · ARM1" }, t: { en: "Her instruction set, 25,000 transistors, a tenth of a watt.", zh: "她设计的指令集，2.5 万个晶体管，十分之一瓦。" } },
        { flags: [], name: { en: "Today · Arm", zh: "今天 · Arm" }, t: { en: "99% of smartphones are based on Arm, by Arm's count.", zh: "按 Arm 的统计，99% 的智能手机基于 Arm。" } },
      ],
      foot: { en: "Sources: Computer History Museum, The Register, Arm", zh: "来源：计算机历史博物馆、The Register、Arm" },
    },
  },
};

const TSMC: Profile = {
  slug: "tsmc", no: 5, companyId: 1880, companySlug: "tsmc",
  title: { en: "TSMC: The Factory Behind Everyone's Chips", zh: "台积电：芯片世界的幕后工厂" },
  dek: {
    en: "It only makes chips for other companies and never sells its own, so it never competes with a customer. How that model beat the chipmakers that built their own factories, and why rivals find it so hard to copy.",
    zh: "只替别人造、不和客户抢生意，这个模式怎么赢过了自建工厂的芯片公司，对手又为什么难以复制",
  },
  social: { en: "The factory behind everyone's chips", zh: "替所有人造芯片的工厂" },
  igHook: { en: "Apple, Nvidia and AMD\nall go through one company", zh: "苹果、英伟达、AMD\n都绕不开它" },
  seoTitle: { en: "How TSMC Works: The Foundry Model, 72% Market Share and Why Rivals Struggle to Copy It", zh: "台积电是做什么的：晶圆代工模式、七成市场份额与对手难以复制的原因" },
  seoDesc: {
    en: "TSMC makes chips for Apple, Nvidia, AMD and more than 500 other customers but sells none of its own. the pure-play foundry Morris Chang founded in 1987, the promise never to compete with customers, 7nm and 2nm, CoWoS packaging, Arizona, its 72.5% foundry share and record third quarter of 2026, with every number sourced.",
    zh: "台积电为苹果、英伟达、AMD 等 500 多家客户造芯片，自己却不卖一颗芯片。张忠谋 1987 年的专业代工构想、不与客户竞争的承诺、7 纳米与 2 纳米、CoWoS 先进封装、美国亚利桑那工厂、72.5% 的代工市场份额，以及 2026 年第三季度创纪录的业绩，每个数字附来源。",
  },
  keywords: ["TSMC", "台积电", "台積電", "Taiwan Semiconductor", "foundry", "晶圆代工", "pure-play foundry", "专业代工", "Morris Chang", "张忠谋", "C.C. Wei", "魏哲家", "TSMC market share", "台积电市场份额", "CoWoS", "2nm", "N2", "TSMC Arizona", "台积电 Q3 2026", "TSMC Q3 2026 earnings"],
  published: "2026-10-29", updated: "2026-10-29",
  cover: { file: "Building of Taiwan Semiconductor Manufacturing Fab 12B at dusk2.jpg", credit: "曾成訓 (Tseng Cheng-hsun)", license: "CC BY 2.0",
    caption: { en: "TSMC's Fab 12B in Hsinchu at dusk, July 2015.", zh: "黄昏时的台积电新竹 12B 厂，摄于 2015 年 7 月。" },
    alt: { en: "Glass office and factory building beside a road with light trails at dusk", zh: "黄昏中的玻璃幕墙厂房大楼，路上是车灯光轨" } },
  lede: [
    {
      en: "In the late 1990s Jensen Huang, the co-founder of Nvidia, kept phoning TSMC's US office. \"Nobody called me. Nobody called me back,\" he said in a podcast interview this month. After he wrote a long letter, a call came one evening: \"This is Morris Chang from TSMC\" [[19]][[20]]. Nvidia was then a small start-up. In 2025 TSMC's largest customer accounted for 19% of its revenue and the second largest for 17%; TSMC does not name them [[16]].",
      zh: "1990 年代末，英伟达联合创始人黄仁勋一次次给台积电的美国办公室打电话。\"没人给我打电话，也没人给我回电，\"他在本月的一次播客访谈里回忆。后来他写了一封长信，某天晚上电话响了：\"我是台积电的张忠谋\" [[19]][[20]]。那时英伟达还是一家小公司。2025 年，台积电最大的客户贡献了它 19% 的营收，第二大客户贡献 17%；台积电没有公布它们的名字 [[16]]。",
    },
    {
      en: "On 15 October 2026 TSMC reported its third quarter: revenue of $46.72 billion, up 41.2% on a year earlier, and net income up 68.7% [[3]]. In the second quarter it took 72.5% of all foundry revenue worldwide, by TrendForce's estimate; Samsung, in second place, took 5.9% [[6]]. On 27 October it was worth about $2.27 trillion [[5]]. Yet TSMC has never sold a chip under its own name [[1]][[10]]. Why is a company that only makes other people's designs so hard to catch?",
      zh: "2026 年 10 月 15 日，台积电公布第三季度业绩：营收 467.2 亿美元，同比增长 41.2%，净利润增长 68.7% [[3]]。据 TrendForce 估算，第二季度全球晶圆代工收入的 72.5% 归台积电；排第二的三星只占 5.9% [[6]]。10 月 27 日，台积电市值约 2.27 万亿美元 [[5]]。可它从来没有用自己的品牌卖过一颗芯片 [[1]][[10]]。一家只替别人生产的公司，为什么别人追不上？",
    },
  ],
  sections: [
    {
      id: "start", h: { en: "Start here: what a foundry does", zh: "先看懂：代工厂是做什么的" },
      paras: [
        {
          en: "Making a chip has two halves. Designing it means drawing billions of tiny switches, transistors, and the wiring between them. Manufacturing it means printing that drawing onto discs of silicon called wafers, layer by layer, in a factory known as a fab. For decades the big chipmakers, such as Intel and Texas Instruments, did both.",
          zh: "做一颗芯片分两半。设计，是画出几十亿个叫晶体管的微小开关和它们之间的连线；制造，是在叫\"晶圆\"的硅片上一层一层把这张图\"印\"出来，地点是叫晶圆厂的工厂。几十年里，英特尔、德州仪器这样的大芯片公司两样都做。",
        },
        {
          en: "A foundry does only the second half. Think of a printing works that prints books for many publishers but never publishes a book of its own. The publishers, here chip companies such as Nvidia, Apple's chip team or AMD, are called \"fabless\" because they own no fab. In 2025 TSMC made 12,682 different products for 534 customers, using 305 manufacturing processes [[1]].",
          zh: "代工厂只做后一半。可以把它想成一家印刷厂：替许多出版社印书，自己却从不出书。这些\"出版社\"，也就是英伟达、苹果的芯片团队、AMD 这样的芯片公司，没有自己的晶圆厂，所以叫\"无晶圆厂\"（fabless）公司。2025 年，台积电用 305 种制造工艺，为 534 家客户生产了 12682 种产品 [[1]]。",
        },
      ],
    },
    {
      id: "origin", h: { en: "An idea nobody wanted to fund", zh: "一个没人愿意投钱的主意" },
      photo: { file: "Morris Chang 2018-11-12.jpg", credit: "Mori / Office of the President", license: "CC BY 2.0",
        caption: { en: "Morris Chang, TSMC's founder, speaking in Taipei on 12 November 2018, five months after he retired.", zh: "台积电创始人张忠谋，2018 年 11 月 12 日在台北发言，那时他已退休五个月。" },
        alt: { en: "Morris Chang in a dark suit speaking into a microphone", zh: "身穿深色西装、手持话筒发言的张忠谋" } },
      paras: [
        {
          en: "Morris Chang spent 25 years at Texas Instruments, from 1958 to 1983, rising to run its worldwide semiconductor business. In the mid-1980s he was recruited to lead the Industrial Technology Research Institute (ITRI) in Taiwan [[7]]. His proposal was a factory that would make chips for anyone and design none of its own. According to Caixin, Intel, Texas Instruments and Motorola all turned down his 1985 invitation to invest [[9]]. \"Nobody even wanted to invest in us,\" Chang said in 2007 [[8]].",
          zh: "张忠谋在德州仪器工作了 25 年（1958 年至 1983 年），一路做到主管全球半导体业务。1980 年代中期，他受邀到台湾主持工业技术研究院（工研院）[[7]]。他提出的构想是：建一座只替别人生产、自己不设计芯片的工厂。据财新报道，英特尔、德州仪器和摩托罗拉都拒绝了他 1985 年的投资邀请 [[9]]。\"根本没人想投资我们，\"张忠谋 2007 年说 [[8]]。",
        },
        {
          en: "The money came from elsewhere. A development fund of Taiwan's government put in 48.3% of the starting capital and the Dutch electronics company Philips 27.6% [[9]]. Philips, Chang said, \"weren't sure that it would work\" but were willing to let him try [[8]]. TSMC was founded in 1987 [[1]]. It called itself the world's first pure foundry [[10]].",
          zh: "钱最后来自别处：台湾方面的一个发展基金出了 48.3% 的启动资金，荷兰电子公司飞利浦出了 27.6% [[9]]。张忠谋说，飞利浦\"不确定这能不能成\"，但愿意投点钱让他试试 [[8]]。1987 年，台积电成立 [[1]]，自称全球第一家专业集成电路代工厂 [[10]]。",
        },
      ],
    },
    {
      id: "partner", h: { en: "Decision one: never compete with a customer", zh: "决定一：永远不和客户竞争" }, figure: "pricetags2",
      paras: [
        {
          en: "Other chipmakers already took outside orders, but only to fill spare capacity in factories built for their own products. A customer handing them a design was handing it to a competitor. TSMC's charter ruled out brand-name chips of its own; as its 1998 annual report put it, TSMC \"is a partner, not a competitor\" of other chip companies [[10]]. \"We're in the foundry business. Those other companies are not in the foundry business,\" Chang said [[8]].",
          zh: "当时别的芯片公司也接外单，但只是为了填满自家工厂的空闲产能，而这些工厂本是为它们自己的产品建的。客户把设计交给它们，等于交给了竞争对手。台积电的章程排除了自有品牌芯片，1998 年年报写道：台积电是其他芯片公司的\"伙伴，而不是竞争者\" [[10]]。\"我们做的是代工生意，那些公司做的不是，\"张忠谋说 [[8]]。",
        },
        {
          en: "Trust brought orders. In 1988 Intel gave TSMC the manufacturing of a microcontroller, a turning point in Caixin's account [[9]]. From the early 1990s a wave of fabless start-ups needed exactly what TSMC sold: \"those fabless companies really accelerated our growth,\" Chang said [[8]]. Revenue went from about $70 million in 1990 to $1.1 billion in 1995 [[9]]. In 2025 it was $122.4 billion [[15]].",
          zh: "信任带来了订单。1988 年，英特尔把一款微控制器交给台积电生产，财新称之为转折点 [[9]]。1990 年代初起，一批无晶圆厂的初创公司冒了出来，它们需要的正是台积电卖的东西。\"这些无晶圆厂公司大大加快了我们的增长，\"张忠谋说 [[8]]。台积电营收从 1990 年的约 7000 万美元，增长到 1995 年的 11 亿美元 [[9]]，2025 年达到 1224 亿美元 [[15]]。",
        },
      ],
    },
    {
      id: "lead", h: { en: "Decision two: get to the newest process first", zh: "决定二：抢先做出最新一代工艺" },
      photo: { file: "TSMC Global R＆D Center.jpg", credit: "曾成訓 (Tseng Cheng-hsun)", license: "CC BY 2.0",
        caption: { en: "TSMC's Global R&D Center in Hsinchu, August 2023.", zh: "台积电位于新竹的全球研发中心，摄于 2023 年 8 月。" },
        alt: { en: "Long low white building behind a park at dusk", zh: "暮色中公园后方的白色长条形建筑" } },
      paras: [
        {
          en: "A foundry that is a generation behind can only compete on price. In June 2009, after the financial crisis had hit chipmakers, Chang came back as chief executive [[11]]. Five years later TSMC was making about 60% of the A8 processors in Apple's iPhone 6, according to an IHS teardown cited by 9to5Mac, with Samsung making the rest [[13]].",
          zh: "落后一代的代工厂，只能拼价格。2009 年 6 月，金融危机冲击过后，张忠谋重新出任 CEO [[11]]。五年后，据 9to5Mac 引用的 IHS 拆解分析，苹果 iPhone 6 的 A8 处理器约 60% 由台积电生产，其余由三星生产 [[13]]。",
        },
        {
          en: "TSMC began producing 7-nanometre chips in April 2018, and with that generation became the first company to bring EUV, a difficult new way of printing the finest patterns with extreme ultraviolet light, into commercial production [[14]]. Chang retired that June, handing over to Mark Liu as chairman and C.C. Wei as chief executive [[12]]. Its 2-nanometre process entered high-volume production in the fourth quarter of 2025 [[4]]. In the third quarter of 2026, 79% of TSMC's wafer revenue came from 7 nanometres and below [[2]].",
          zh: "2018 年 4 月，台积电开始生产 7 纳米芯片，并在这一代工艺上率先把 EUV（用极紫外光印出最精细图案的一种难度很高的新技术）带入商业生产 [[14]]。同年 6 月，张忠谋退休，由刘德音任董事长、魏哲家任 CEO [[12]]。台积电的 2 纳米工艺于 2025 年第四季度进入大规模量产 [[4]]。2026 年第三季度，台积电晶圆收入的 79% 来自 7 纳米及更先进的工艺 [[2]]。",
        },
      ],
    },
    {
      id: "package", h: { en: "Decision three: package the chips, and build near customers", zh: "决定三：连封装一起做，把工厂建到客户身边" },
      photo: { file: "231105-1 TSMC Fab 21 construction.jpg", credit: "Hunter Trick", license: "CC BY-SA 4.0",
        caption: { en: "TSMC's Fab 21 under construction in Phoenix, Arizona, November 2023.", zh: "建设中的台积电美国亚利桑那州凤凰城 21 厂，摄于 2023 年 11 月。" },
        alt: { en: "Aerial view of large factory buildings and cranes in the desert", zh: "沙漠中大型厂房和塔吊的航拍" } },
      paras: [
        {
          en: "AI processors are too big to be a single piece of silicon, so several chips are mounted side by side on one base and wired together. TSMC sells this step too, under the name CoWoS. On the October earnings call C.C. Wei said CoWoS \"is still the number one choice for our customer\" [[4]]. Reports this week say TSMC plans to raise advanced-packaging prices by up to 20% because demand exceeds capacity; TSMC has not confirmed this [[22]].",
          zh: "AI 处理器太大，做不进一整块硅片，只能把几颗芯片并排装在同一块底板上再连起来。台积电把这一步也一起卖，名字叫 CoWoS。在 10 月的业绩电话会上，魏哲家说 CoWoS \"仍是客户的首选\" [[4]]。本周有报道称，由于需求超过产能，台积电计划把先进封装价格最多上调 20%；台积电没有证实 [[22]]。",
        },
        {
          en: "It is also building where its customers are. TSMC's first fab in Arizona went into volume production in the fourth quarter of 2024; in March 2025 TSMC raised its planned US investment to $165 billion, for six fabs, two packaging plants and a research centre [[17]]. The second Arizona fab is due to start volume production in the third quarter of 2027, and a second fab in Japan is to make 3-nanometre chips from 2028 [[4]].",
          zh: "它也把工厂建到客户身边。台积电在亚利桑那的第一座晶圆厂于 2024 年第四季度投入量产；2025 年 3 月，台积电把在美国的计划投资提高到 1650 亿美元，用于六座晶圆厂、两座封装厂和一个研发中心 [[17]]。亚利桑那第二座晶圆厂预计 2027 年第三季度量产，日本第二座晶圆厂计划从 2028 年起生产 3 纳米芯片 [[4]]。",
        },
      ],
    },
    {
      id: "moat", h: { en: "Why rivals cannot simply copy it", zh: "为什么对手学不来" }, figure: "royalty",
      paras: [
        {
          en: "The model itself is no secret. Samsung and Intel both make chips for other companies. In our view three things keep TSMC ahead, and they reinforce each other. The first is trust: both Samsung and Intel also sell chips of their own, while TSMC's customers know it will never compete with them [[10]].",
          zh: "这套模式本身不是秘密，三星和英特尔都在替别人造芯片。我们认为，让台积电保持领先的有三样东西，而且彼此加强。第一是信任：三星和英特尔自己也卖芯片，而台积电的客户知道它永远不会和自己竞争 [[10]]。",
        },
        {
          en: "The second is learning from volume. Every chip a fab makes teaches it how to waste fewer wafers. In April TrendForce, citing a Korean newspaper, reported Samsung's 2-nanometre yield, the share of usable chips, in the mid-50% range and TSMC's at 60% to 70%; the figures are unconfirmed [[18]]. In 2025 TSMC's factories could turn out more than 17 million wafers of the standard 12-inch size [[1]]. Intel's chief technology officer said this month that Intel's process technology is now only a few percentage points behind TSMC's, but that catching up on capacity will take time [[21]].",
          zh: "第二是从产量里学习。晶圆厂每多生产一批芯片，就多学会一点怎么少浪费晶圆。今年 4 月，TrendForce 援引韩国报纸报道，三星 2 纳米的良率（可用芯片的比例）在 55% 上下，台积电约 60% 至 70%；这些数字未经证实 [[18]]。2025 年，台积电的工厂年产能超过 1700 万片 12 英寸标准晶圆 [[1]]。英特尔首席技术官本月表示，英特尔的制程技术与台积电只差几个百分点，但产能追赶仍需时间 [[21]]。",
        },
        {
          en: "The third is money, which the first two produce. From 2001 to 2009 TSMC spent $2 billion to $2.5 billion a year on new plant and equipment [[9]]. For 2026 its budget is $60 billion to $64 billion [[4]]. Samsung's foundry business had revenue of $3.26 billion in the second quarter [[6]].",
          zh: "第三是钱，而钱来自前两样。2001 年到 2009 年，台积电每年的资本开支在 20 亿到 25 亿美元之间 [[9]]；2026 年的预算是 600 亿到 640 亿美元 [[4]]。作为对比，三星代工业务第二季度的营收是 32.6 亿美元 [[6]]。",
        },
      ],
    },
    {
      id: "value", h: { en: "What the market pays for it", zh: "市场给它开的价" }, figure: "pricetags",
      paras: [
        {
          en: "TSMC listed in Taiwan in 1994 and in New York in 1997 [[9]]. At the end of 2000 it was worth about $40 billion. It passed $1 trillion by the end of 2024 and was about $2.27 trillion on 27 October 2026 [[5]].",
          zh: "台积电 1994 年在台湾上市，1997 年在纽约上市 [[9]]。2000 年底，它的市值约 400 亿美元，2024 年底超过 1 万亿美元，2026 年 10 月 27 日约为 2.27 万亿美元 [[5]]。",
        },
        {
          en: "The money comes mostly from AI and from North America. In the third quarter of 2026, high-performance computing, mainly data-centre and AI chips, made up 68% of revenue and smartphones 21%; customers based in North America accounted for 79% [[2]]. For the fourth quarter TSMC expects revenue of $52.3 billion to $54.3 billion [[3]], and for 2026 as a whole growth of around 44% in US dollars [[4]]. \"We did not see any sign of slowdown,\" Wei said [[4]].",
          zh: "钱主要来自 AI，来自北美。2026 年第三季度，高性能计算（主要是数据中心和 AI 芯片）占营收的 68%，智能手机占 21%；总部在北美的客户贡献了 79% [[2]]。台积电预计第四季度营收 523 亿至 543 亿美元 [[3]]，2026 全年按美元计增长约 44% [[4]]。\"我们没有看到任何放缓的迹象，\"魏哲家说 [[4]]。",
        },
      ],
    },
    { id: "timeline", h: { en: "Timeline", zh: "时间线" }, figure: "timeline", paras: [] },
    {
      id: "countries", h: { en: "One record quarter, told many ways", zh: "同一份创纪录的财报，多种讲法" }, figure: "countries",
      paras: [
        {
          en: "We looked at articles in our sources between 8 and 29 October 2026 with TSMC in the headline: 76 articles from outlets in seven countries. Most were about the third-quarter results. The Chinese outlets wrote by far the most and covered the widest range of angles. Reports from Singapore and India are largely Reuters wire copy. This shows only what our sources carried.",
          zh: "我们查看了 2026 年 10 月 8 日至 29 日，收录来源中标题提到台积电的报道：共 76 篇，来自七个国家的媒体，大多关于第三季度财报。中国媒体写得最多，角度也最广；新加坡和印度的报道多为路透社通稿。这里只反映我们收录的来源。",
        },
      ],
    },
    {
      id: "open", h: { en: "What is not settled", zh: "还没有答案的问题" },
      paras: [
        { en: "Concentration. TSMC's ten largest customers made up 78% of its revenue in 2025 [[16]], and North American customers 79% in the latest quarter [[2]]. What is strong demand today is also dependence on a few buyers.", zh: "集中度。2025 年，台积电前十大客户贡献了 78% 的营收 [[16]]，最近一个季度北美客户贡献了 79% [[2]]。今天的旺盛需求，也意味着依赖少数几家买家。" },
        { en: "Margins abroad. Factories outside Taiwan cost more to run. Chief financial officer Wendell Huang said the dilution of gross margin from overseas fabs is expected to widen to 3% to 4% in the next few years [[4]].", zh: "海外工厂的利润率。台湾以外的工厂运营成本更高。财务长黄仁昭表示，海外工厂对毛利率的稀释，预计未来几年会扩大到 3% 至 4% [[4]]。" },
        { en: "Rivals. Intel says its technology is close; Samsung's reported yields still trail TSMC's [[18]][[21]]. Whether either can win large outside customers will show how much of TSMC's lead is technology and how much is trust.", zh: "对手。英特尔说技术差距已经很小，据报道三星的良率仍落后于台积电 [[18]][[21]]。它们能不能赢得大客户，将说明台积电的领先有多少来自技术，多少来自信任。" },
        { en: "In the 1990s a young chip company could not get TSMC to return a call [[19]]. Today chip companies compete for its capacity. In our view that reversal is the clearest measure of what the promise of 1987, to make everyone's chips and sell none of its own, has become.", zh: "1990 年代，一家年轻的芯片公司打不通台积电的电话 [[19]]；今天，芯片公司们在争抢它的产能。在我们看来，这个反转最能说明，1987 年那个\"替所有人造芯片、自己一颗不卖\"的承诺，后来变成了什么。" },
      ],
    },
  ],
  timeline: [
    { date: { en: "1985", zh: "1985 年" }, text: { en: "Intel, TI and Motorola turn down Morris Chang's invitation to invest in a pure foundry", zh: "英特尔、德州仪器、摩托罗拉拒绝投资张忠谋的专业代工构想" }, src: [9] },
    { date: { en: "1987", zh: "1987 年" }, text: { en: "TSMC founded; Taiwan government fund 48.3%, Philips 27.6%", zh: "台积电成立；台湾方面的发展基金占 48.3%，飞利浦占 27.6%" }, src: [1, 9] },
    { date: { en: "1988", zh: "1988 年" }, text: { en: "Intel outsources a microcontroller to TSMC", zh: "英特尔把一款微控制器交给台积电生产" }, src: [9] },
    { date: { en: "1994 and 1997", zh: "1994 年、1997 年" }, text: { en: "Listed in Taiwan, then in New York", zh: "先后在台湾和纽约上市" }, src: [9] },
    { date: { en: "Jun 2009", zh: "2009 年 6 月" }, text: { en: "Chang returns as chief executive", zh: "张忠谋重新出任 CEO" }, src: [11] },
    { date: { en: "Sep 2014", zh: "2014 年 9 月" }, text: { en: "Makes about 60% of the iPhone 6's A8 chips", zh: "生产约 60% 的 iPhone 6 A8 芯片" }, src: [13] },
    { date: { en: "Apr 2018", zh: "2018 年 4 月" }, text: { en: "7-nanometre production begins", zh: "开始生产 7 纳米芯片" }, src: [14] },
    { date: { en: "Jun 2018", zh: "2018 年 6 月" }, text: { en: "Chang retires; Mark Liu chairman, C.C. Wei chief executive", zh: "张忠谋退休；刘德音任董事长，魏哲家任 CEO" }, src: [12] },
    { date: { en: "Q4 2024", zh: "2024 年第四季度" }, text: { en: "First Arizona fab in volume production", zh: "亚利桑那第一座晶圆厂量产" }, src: [17] },
    { date: { en: "Mar 2025", zh: "2025 年 3 月" }, text: { en: "Planned US investment raised to $165 billion", zh: "美国计划投资提高到 1650 亿美元" }, src: [17] },
    { date: { en: "Q4 2025", zh: "2025 年第四季度" }, text: { en: "2-nanometre high-volume production", zh: "2 纳米大规模量产" }, src: [4] },
    { date: { en: "15 Oct 2026", zh: "2026 年 10 月 15 日" }, text: { en: "Third-quarter revenue $46.72 billion, up 41.2%", zh: "第三季度营收 467.2 亿美元，增长 41.2%" }, src: [3] },
  ],
  countries: [
    {
      code: "CN", count: 51, outlets: "IT之家, 36氪, cnBeta, 虎嗅, 钛媒体, SCMP",
      focus: { en: "The most coverage and the most detail: monthly sales, profit to the last digit, 2-nanometre capacity, the Kumamoto fab's switch to 3 nanometres, reported packaging price rises and how Samsung and Intel compare. Several outlets retold Jensen Huang's story of Morris Chang's phone call.", zh: "报道最多，也最细：月度营收、精确到位的利润、2 纳米产能、熊本二厂改产 3 纳米、传闻中的封装涨价，以及三星、英特尔与台积电的比较。好几家媒体转述了黄仁勋讲的张忠谋那通电话。" },
      headlines: [
        { t: "黄仁勋谈早年结缘台积电：多次致电无人理会，张忠谋一通电话改变一切", outlet: "cnBeta", url: "https://www.cnbeta.com.tw/articles/tech/1582292.htm" },
        { t: "日赚17亿，台积电还担心钱不够花", outlet: "虎嗅", url: "https://www.huxiu.com/article/4898068.html?f=rss" },
        { t: "英特尔 CTO 称其与台积电制程技术差距小于 10%，但产能追赶仍需时间", outlet: "IT之家", url: "https://www.ithome.com/1/017/411.htm" },
      ],
    },
    {
      code: "DE", count: 8, outlets: "Handelsblatt, heise online, tagesschau",
      focus: { en: "A profit jump described as surprising again, with heise noting a cautious look ahead; also a TSMC order for GlobalFoundries to make silicon interposers.", zh: "利润再次出人意料地大幅跳升，heise 则指出台积电对前景态度谨慎；另有台积电向格芯下单生产硅中介层的报道。" },
      headlines: [
        { t: "TSMC schreibt weiter Rekordzahlen, blickt aber vorsichtig in die Zukunft", outlet: "heise online", url: "https://www.heise.de/news/TSMC-schreibt-weiter-Rekordzahlen-blickt-aber-vorsichtig-in-die-Zukunft-11490124.html" },
        { t: "Chipindustrie: TSMC erneut mit überraschend deutlichem Gewinnsprung", outlet: "Handelsblatt", url: "https://www.handelsblatt.com/unternehmen/chipindustrie-tsmc-erneut-mit-ueberraschend-deutlichem-gewinnsprung/100262091.html" },
      ],
    },
    {
      code: "US", count: 5, outlets: "CNBC, MarketWatch",
      focus: { en: "A sixth record quarter in a row, the chief executive seeing no slowdown, and AI customers fighting over TSMC's capacity.", zh: "连续第六个创纪录的季度、CEO 说看不到放缓，以及 AI 客户争抢台积电产能。" },
      headlines: [
        { t: "TSMC chip capacity is 'fierce' battleground for AI customers, amid record quarter", outlet: "CNBC", url: "https://www.cnbc.com/2026/10/15/nvidia-apple-broadcom-in-fierce-battle-to-make-chips-at-tsmc.html" },
        { t: "TSMC CEO sees no sign of a slowdown as chip foundry reports record profit", outlet: "MarketWatch", url: "https://www.marketwatch.com/story/tsmc-ceo-sees-no-sign-of-a-slowdown-as-chip-foundry-reports-record-profit-17a065d3" },
      ],
    },
    {
      code: "SG", count: 4, outlets: "CNA, The Straits Times",
      focus: { en: "Reuters reports on the record profit, the GlobalFoundries deal, and a Korean report that Samsung will use TSMC technology for Nvidia's next memory chips.", zh: "路透社关于创纪录利润、格芯合作的报道，以及一则韩国媒体消息：三星将用台积电的技术为英伟达生产下一代内存芯片。" },
      headlines: [
        { t: "Taiwan chip giant TSMC says net profit hit record in third quarter", outlet: "The Straits Times", url: "https://www.straitstimes.com/business/taiwan-chip-giant-tsmc-says-net-profit-hit-record-in-third-quarter" },
        { t: "GlobalFoundries to make key AI chip component for TSMC", outlet: "CNA", url: "https://www.channelnewsasia.com/business/globalfoundries-make-key-ai-chip-component-tsmc-6442886" },
      ],
    },
    {
      code: "JP", count: 3, outlets: "Nikkei Asia",
      focus: { en: "The results, a supplier betting on local production near TSMC and Intel, and TSMC weighing Texas for further US expansion.", zh: "财报、一家供应商押注在台积电和英特尔附近本地生产，以及台积电考虑在得州进一步扩张。" },
      headlines: [
        { t: "TSMC profit soars 69% in another record quarter fueled by AI boom", outlet: "Nikkei Asia", url: "https://asia.nikkei.com/business/tech/semiconductors/tsmc-profit-soars-69-in-another-record-quarter-fueled-by-ai-boom" },
      ],
    },
    {
      code: "IN", count: 3, outlets: "The Economic Times",
      focus: { en: "Reuters copy before and after the results: an expected sixth record quarter, then the 69% profit jump.", zh: "财报前后的路透社稿件：先是预计连续第六个季度创新高，然后是利润增长 69%。" },
      headlines: [
        { t: "TSMC Q3 profit jumps 69% to record, beating expectations", outlet: "The Economic Times", url: "https://economictimes.indiatimes.com/tech/technology/tsmc-q3-profit-jumps-69-to-record-beating-expectations/articleshow/134958500.cms" },
      ],
    },
    {
      code: "AE", count: 2, outlets: "The National",
      focus: { en: "Only the GlobalFoundries agreement, framed through GlobalFoundries' backers in Abu Dhabi.", zh: "只报道了格芯协议，并从格芯的阿布扎比股东切入。" },
      headlines: [
        { t: "UAE-backed GlobalFoundries and TSMC announce $2bn manufacturing agreement", outlet: "The National", url: "https://www.thenationalnews.com/future/technology/2026/10/08/globalfoundries-stock-tsmc-silicon-interposers/" },
      ],
    },
  ],
  sources: [
    { n: 1, name: "TSMC", title: "Company profile (2025 figures: customers, products, technologies, capacity)", url: "https://www.tsmc.com/japanese/aboutTSMC/index.htm" },
    { n: 2, name: "TSMC", title: "3Q26 management report (15 October 2026)", url: "https://investor.tsmc.com/english/encrypt/files/encrypt_file/reports/2026-10/f83780000ddc0c3b48e57a87eab6814c4ab35058/3Q26%20ManagementReport.pdf" },
    { n: 3, name: "SEC", title: "TSMC Form 6-K: 3Q26 earnings release and 4Q26 guidance", url: "https://www.sec.gov/Archives/edgar/data/0001046179/000104617926000726/a3q26e_withguidancexfinal.htm" },
    { n: 4, name: "The Motley Fool", title: "TSMC Q3 2026 earnings call transcript", url: "https://www.fool.com/earnings/call-transcripts/2026/10/15/tsmc-tsm-q3-2026-earnings-call-transcript/" },
    { n: 5, name: "CompaniesMarketCap", title: "TSMC market capitalization", url: "https://companiesmarketcap.com/tsmc/marketcap/" },
    { n: 6, name: "TrendForce", title: "Global foundry revenue approaches US$53.49 billion in 2Q26 (9 September 2026)", url: "https://www.trendforce.com/presscenter/news/20260909-13225.html" },
    { n: 7, name: "Computer History Museum", title: "Morris Chang, Fellow profile", url: "https://computerhistory.org/profile/morris-chang/" },
    { n: 8, name: "Computer History Museum", title: "An Evening with Morris Chang, transcript (17 October 2007)", url: "https://archive.computerhistory.org/resources/access/text/2012/05/102658254-05-01-acc.pdf" },
    { n: 9, name: "Caixin Global", title: "In profile: how Morris Chang built TSMC into a chipmaking colossus (27 February 2026)", url: "https://www.caixinglobal.com/2026-02-27/in-profile-how-morris-chang-built-tsmc-into-a-chipmaking-colossus-102417518.html" },
    { n: 10, name: "TSMC", title: "1998 annual report: a brief introduction to TSMC", url: "https://investor.tsmc.com/static/annualReports/1998/html/intro.htm" },
    { n: 11, name: "SEC", title: "TSMC Form 6-K, July 2009: Dr. Chang returns as chief executive", url: "https://www.sec.gov/Archives/edgar/data/0001046179/000095012309028010/h03545e6vk.htm" },
    { n: 12, name: "TSMC", title: "TSMC Chairman Dr. Morris Chang announces retirement (2 October 2017)", url: "https://pr.tsmc.com/english/news/1938" },
    { n: 13, name: "9to5Mac", title: "TSMC makes about 60% of iPhone 6 A8 chips, IHS teardown (23 September 2014)", url: "https://9to5mac.com/2014/09/23/iphone-6-a8-tsmc-samsung/" },
    { n: 14, name: "Tom's Hardware", title: "TSMC celebrates making over a billion 7nm chips (August 2020)", url: "https://www.tomshardware.com/news/tsmc-passes-one-billion-7nm-chips" },
    { n: 15, name: "Manufacturing Dive", title: "TSMC fourth-quarter and full-year 2025 results", url: "https://manufacturingdive.com/news/tsmc-q4-full-year-2025-earnings-ai-taiwan/809775" },
    { n: 16, name: "TSMC Form 20-F (via Stock Titan)", title: "Annual report for 2025: customer concentration", url: "https://www.stocktitan.net/sec-filings/TSM/20-f-taiwan-semiconductor-manufacturing-co-ltd-files-annual-report-fo-e7792df70159.html" },
    { n: 17, name: "TrendForce", title: "TSMC's $165B Arizona investment (12 May 2025)", url: "https://www.trendforce.com/news/2025/05/12/news-tsmcs-165b-arizona-investment-to-create-12000-jobs-once-all-facilities-are-operational/" },
    { n: 18, name: "TrendForce", title: "Samsung 2nm yields reportedly at ~55% (14 April 2026)", url: "https://www.trendforce.com/news/2026/04/14/news-samsung-2nm-yields-reportedly-at-55-below-mass-production-threshold-qualcomm-may-opt-for-tsmc/" },
    { n: 19, name: "Business Insider (via DNYUZ)", title: "Jensen Huang couldn't get TSMC to return his calls. Then its founder called (15 October 2026)", url: "https://dnyuz.com/2026/10/15/jensen-huang-couldnt-get-tsmc-to-return-his-calls-then-its-founder-called/" },
    { n: 20, name: "IT之家", title: "英伟达 CEO 黄仁勋自述：当年为了联系台积电，我打了好几次电话都没人回", url: "https://www.ithome.com/1/013/707.htm" },
    { n: 21, name: "IT之家", title: "英特尔 CTO 称其与台积电制程技术差距小于 10%，但产能追赶仍需时间 (24 October 2026)", url: "https://www.ithome.com/1/017/411.htm" },
    { n: 22, name: "IT之家", title: "曝台积电先进封装拟涨价最高 20% (27 October 2026)", url: "https://www.ithome.com/1/018/409.htm" },
  ],
  stats: [
    { label: { en: "What TSMC is worth", zh: "公司市值" }, from: 40.32, to: 2265, fromLabel: { en: "end of 2000", zh: "2000 年底" }, toLabel: { en: "27 Oct 2026", zh: "2026 年 10 月 27 日" }, unit: "bn", src: [5] },
    { label: { en: "Annual revenue", zh: "年营收" }, from: 0.07, to: 122.4, fromLabel: { en: "1990", zh: "1990 年" }, toLabel: { en: "2025", zh: "2025 年" }, unit: "bn", src: [9, 15] },
    { label: { en: "Share of foundry revenue", zh: "代工市场份额" }, from: 0, to: 72.5, fromLabel: { en: "", zh: "" }, toLabel: { en: "2Q26, TrendForce", zh: "2026 年第二季度，TrendForce" }, unit: "pct", src: [6] },
  ],
  name: "TSMC", legalName: "Taiwan Semiconductor Manufacturing Company Limited", newsMatch: { src: "\\bTSMC\\b|台积电|台積電", flags: "" },
  alwaysCite: [5, 6, 15],
  method: {
    en: "Method: drafted with AI from the sources above and checked line by line by an editor. Market shares are TrendForce's estimates. Yield figures are press reports that the companies have not confirmed. Market values may differ slightly between data providers. This is not investment advice. Found a mistake? Email ",
    zh: "写法：本文由 AI 根据上列来源整理，编辑逐条核对。市场份额是 TrendForce 的估算。良率数字来自媒体报道，公司未证实。市值在不同数据商之间可能略有出入。本文不构成投资建议。发现错误请写信到 ",
  },
  // $ billion: market value at year-end and on 27 October 2026 [5]
  priceTags: {
    title: { en: "What TSMC was worth ($ billion)", zh: "台积电值多少钱（十亿美元）" },
    note: {
      en: "Market value at the end of each year shown, and on 27 October 2026. Source: CompaniesMarketCap.",
      zh: "所列各年年底以及 2026 年 10 月 27 日的市值。来源：CompaniesMarketCap。",
    },
    rows: [
      { label: { en: "End of 2000", zh: "2000 年底" }, v: 40.32, kind: "market" },
      { label: { en: "End of 2005", zh: "2005 年底" }, v: 49.01, kind: "market" },
      { label: { en: "End of 2010", zh: "2010 年底" }, v: 63.55, kind: "market" },
      { label: { en: "End of 2015", zh: "2015 年底" }, v: 109.64, kind: "market" },
      { label: { en: "End of 2020", zh: "2020 年底" }, v: 488.12, kind: "market" },
      { label: { en: "End of 2024", zh: "2024 年底" }, v: 1045, kind: "market" },
      { label: { en: "End of 2025", zh: "2025 年底" }, v: 1570, kind: "market" },
      { label: { en: "27 Oct 2026", zh: "2026.10.27" }, v: 2265, kind: "market" },
    ],
  },
  // $ billion: revenue 1990 and 1995 [9], 2025 [15], 3Q26 [3]
  priceTags2: {
    title: { en: "TSMC revenue ($ billion)", zh: "台积电营收（十亿美元）" },
    note: {
      en: "Full-year revenue for 1990, 1995 and 2025; the orange bar is a single quarter, July to September 2026. Sources: Caixin, Manufacturing Dive, TSMC.",
      zh: "1990 年、1995 年和 2025 年为全年营收；橙色为单个季度（2026 年 7 月至 9 月）。来源：财新、Manufacturing Dive、台积电。",
    },
    legend: [{ en: "Full year", zh: "全年" }, { en: "One quarter", zh: "单季" }],
    rows: [
      { label: { en: "1990", zh: "1990 年" }, v: 0.07, kind: "deal" },
      { label: { en: "1995", zh: "1995 年" }, v: 1.1, kind: "deal" },
      { label: { en: "2025", zh: "2025 年" }, v: 122.4, kind: "deal" },
      { label: { en: "Q3 2026 alone", zh: "仅 2026 年第三季度" }, v: 46.72, kind: "market" },
    ],
  },
  royalty: {
    title: { en: "Share of foundry revenue, 2Q26", zh: "代工市场份额，2026 年第二季度" },
    note: {
      en: "Share of worldwide foundry revenue, as estimated by TrendForce. The ten largest foundries together took $53.49 billion in the quarter.",
      zh: "占全球晶圆代工收入的比例，TrendForce 估算。前十大代工厂该季度合计营收 534.9 亿美元。",
    },
    col: { en: "Share", zh: "份额" },
    rows: [
      { label: { en: "TSMC", zh: "台积电" }, lo: 72.5, hi: 72.5, sub: { en: "about $40.2 billion", zh: "约 402 亿美元" } },
      { label: { en: "Samsung", zh: "三星" }, lo: 5.9, hi: 5.9, sub: { en: "$3.26 billion", zh: "32.6 亿美元" } },
      { label: { en: "SMIC", zh: "中芯国际" }, lo: 5.4, hi: 5.4, sub: { en: "above $3 billion", zh: "超过 30 亿美元" } },
    ],
  },
  ig: {
    explain: {
      kicker: { en: "START HERE", zh: "先看懂" },
      rows: [
        { q: { en: "What is a foundry?", zh: "代工厂是什么？" }, a: { en: "A chip factory that makes other companies' designs, like a printing works that prints books for many publishers.", zh: "替别的公司生产芯片的工厂，就像一家替许多出版社印书的印刷厂。" } },
        { q: { en: "Who are the customers?", zh: "客户是谁？" }, a: { en: "534 customers in 2025, mostly chip companies without factories of their own.", zh: "2025 年共 534 家客户，大多是没有自己工厂的芯片公司。" } },
        { q: { en: "What makes TSMC different?", zh: "台积电有什么不同？" }, a: { en: "It sells no chips under its own name, so it never competes with a customer.", zh: "它不用自己的品牌卖芯片，所以永远不和客户竞争。" } },
      ],
    },
    numbers: {
      kicker: { en: "ONE COMPANY, THREE NUMBERS", zh: "一家公司，三个数字" },
      rows: [
        { big: { en: "$2.27T", zh: "2.27 万亿美元" }, label: { en: "What TSMC is worth", zh: "公司市值" }, sub: { en: "27 October 2026", zh: "2026 年 10 月 27 日" } },
        { big: { en: "72.5%", zh: "72.5%" }, label: { en: "of foundry revenue worldwide", zh: "全球晶圆代工收入中的份额" }, sub: { en: "April to June 2026; Samsung 5.9%", zh: "2026 年第二季度；三星 5.9%" } },
        { big: { en: "$46.7B", zh: "467 亿美元" }, label: { en: "Revenue in one quarter", zh: "单季营收" }, sub: { en: "July to September 2026, up 41%", zh: "2026 年 7 月至 9 月，增长 41%" } },
      ],
      source: { en: "Sources: CompaniesMarketCap, TrendForce, TSMC", zh: "来源：CompaniesMarketCap、TrendForce、台积电" },
    },
    decisions: [
      { h: { en: "Never compete with a customer", zh: "永远不和客户竞争" }, tag: "1987", t: { en: "No chips of its own: \"a partner, not a competitor\", as TSMC put it in 1998.", zh: "不做自有品牌芯片：用台积电 1998 年的话说，是\"伙伴，而不是竞争者\"。" } },
      { h: { en: "Get to the newest process first", zh: "抢先做出最新工艺" }, tag: "7nm · 2nm", t: { en: "7nm in 2018, 2nm in late 2025. 79% of wafer revenue now comes from 7nm and below.", zh: "2018 年 7 纳米，2025 年底 2 纳米。如今 79% 的晶圆收入来自 7 纳米及更先进工艺。" } },
      { h: { en: "Package the chips, build near customers", zh: "连封装一起做，建厂到客户身边" }, tag: "CoWoS · Arizona", t: { en: "CoWoS packaging for AI chips, and $165 billion planned in Arizona.", zh: "为 AI 芯片做 CoWoS 封装，并计划在亚利桑那投资 1650 亿美元。" } },
    ],
    chart: {
      kind: "tags", kicker: { en: "WHAT TSMC WAS WORTH", zh: "台积电值多少钱" },
      sub: { en: "Market value, 2000 to 2026.", zh: "市值，2000 年至 2026 年。" },
      foot: { en: "CompaniesMarketCap", zh: "CompaniesMarketCap" },
    },
    countries: {
      kicker: { en: "ONE QUARTER, MANY COUNTRIES", zh: "同一份财报，多个国家" },
      title: { en: "How outlets told it, 8 to 29 Oct", zh: "10 月 8 日至 29 日，各国媒体怎么写台积电" },
      rows: [
        { flags: ["cn"], name: { en: "China", zh: "中国" }, t: { en: "The most detail: profit to the digit, 2nm capacity, rivals, and Jensen Huang's story of Morris Chang's call.", zh: "最细：精确的利润、2 纳米产能、对手比较，还有黄仁勋讲的张忠谋那通电话。" } },
        { flags: ["de"], name: { en: "Germany", zh: "德国" }, t: { en: "A surprising profit jump, and a cautious look ahead.", zh: "出人意料的利润跳升，以及谨慎的前景。" } },
        { flags: ["us"], name: { en: "United States", zh: "美国" }, t: { en: "No sign of slowdown, and AI customers fighting for capacity.", zh: "看不到放缓，AI 客户争抢产能。" } },
        { flags: ["sg", "in", "jp"], name: { en: "Singapore, India, Japan", zh: "新加坡、印度、日本" }, t: { en: "Record profit, Samsung using TSMC technology, and expansion in Texas.", zh: "创纪录的利润、三星采用台积电技术，以及在得州扩张。" } },
      ],
      foot: { en: "76 articles in our sources, 8 to 29 October 2026", zh: "我们收录的 76 篇报道，2026 年 10 月 8 日至 29 日" },
    },
  },
};

const MOORE: Profile = {
  slug: "gordon-moore", no: 6, companyId: 17, companySlug: "intel", about: "person", newsName: "Intel",
  title: { en: "Gordon Moore: The Forecast That Became a Law", zh: "戈登·摩尔：一条被当成定律的预测" },
  dek: {
    en: "A four-page magazine article from 1965 set the rhythm of the whole chip industry for decades.",
    zh: "1965 年一篇四页的文章，给整个芯片业定下了几十年的节奏",
  },
  social: { en: "The forecast the chip industry chased for 60 years", zh: "芯片业追了六十年的一条预测" },
  igHook: { en: "Five dots, one line,\nand 60 years of chips", zh: "他用五个点画出的预测，\n被芯片业追了六十年" },
  seoTitle: { en: "Gordon Moore and Moore's Law: What He Predicted in 1965 and Why It Came True", zh: "戈登·摩尔与摩尔定律：1965 年的预测是什么，为什么会成真" },
  seoDesc: {
    en: "What is Moore's Law? In April 1965 Gordon Moore, then at Fairchild, predicted in Electronics magazine that chips would hold 65,000 components by 1975. He co-founded Intel in 1968, revised the forecast to a doubling every two years in 1975, and later said it was \"not a law in any real respect\". How a forecast about cost became the industry's schedule, from the Intel 4004's 2,300 transistors to 208 billion today, with every fact sourced.",
    zh: "摩尔定律是什么？1965 年 4 月，在仙童半导体工作的戈登·摩尔在《电子学》杂志上预测，到 1975 年一块芯片能放 6.5 万个元件。1975 年他改为每两年翻一番，他也是英特尔的联合创始人，后来却说这\"根本不算什么定律\"。一条关于成本的预测，怎样变成整个行业的时间表，从英特尔 4004 的 2300 个晶体管到今天的 2080 亿个，每个事实附来源。",
  },
  keywords: ["Gordon Moore", "戈登·摩尔", "Moore's Law", "摩尔定律", "Intel", "英特尔", "Fairchild", "仙童半导体", "Cramming more components onto integrated circuits", "Intel 4004", "Carver Mead", "transistor count", "晶体管数量", "摩尔定律 已死", "Moore's Law is dead"],
  published: "2026-11-01", updated: "2026-11-01",
  cover: { file: "12-inch silicon wafer.jpg", credit: "Peellden", license: "CC BY-SA 3.0",
    caption: { en: "A 12-inch silicon wafer. Each small rectangle is one chip; cramming more of them onto each wafer, and more components onto each chip, is what Moore's forecast was about.", zh: "一片 12 英寸硅晶圆，上面每个小方块就是一颗芯片。在晶圆上放更多芯片、在芯片上放更多元件，正是摩尔那条预测讲的事。" },
    alt: { en: "A round silicon wafer covered in a grid of chips, shimmering in rainbow colours", zh: "布满芯片方格、泛着彩虹光泽的圆形硅晶圆" } },
  lede: [
    {
      en: "In April 1965 the magazine Electronics ran an article by a chemist who headed research and development at Fairchild Semiconductor. Gordon Moore had plotted how many components chipmakers could fit on one chip at the lowest cost, drawn a line through just five data points, and extended it ten years: \"by 1975, the number of components per integrated circuit for minimum cost will be 65,000\" [[1]][[4]]. In 1975 a new memory chip held 65,536 [[8]].",
      zh: "1965 年 4 月，《电子学》（Electronics）杂志刊登了一篇文章，作者是化学家、仙童半导体的研发负责人戈登·摩尔。他把芯片厂商在成本最低时能在一块芯片上放多少个元件画成图，只用五个数据点连成一条线，再往后延长十年：\"到 1975 年，成本最低的集成电路上的元件数将达到 65000 个\" [[1]][[4]]。1975 年，一款新的存储芯片恰好装下了 65536 个 [[8]]。",
    },
    {
      en: "The line kept going. Intel's first microprocessor, in 1971, had 2,300 transistors [[11]]; Nvidia's Blackwell GPUs have 208 billion [[13]]. The forecast got a name, Moore's Law, and for decades the industry planned around it. Yet Moore himself said: \"It's not a law in any real respect. It was an observation and a projection\" [[5]]. So why did it come true?",
      zh: "这条线一直延伸了下去。1971 年，英特尔第一颗微处理器有 2300 个晶体管 [[11]]；今天英伟达的 Blackwell GPU 有 2080 亿个 [[13]]。这条预测有了名字，叫摩尔定律，几十年里整个行业都按它来做计划。可摩尔自己说：\"它根本不算什么定律，只是一个观察和一个推测\" [[5]]。那它为什么成真了？",
    },
  ],
  sections: [
    {
      id: "start", h: { en: "Start here: what does doubling mean?", zh: "先看懂：翻一番意味着什么" },
      paras: [
        {
          en: "A chip is a small slab of silicon carrying tiny electronic parts: transistors, which act as switches, and in 1965 also resistors and other components, wired together on the chip itself [[6]]. Moore's question was how many of those parts a chip could hold before each extra one started to cost more instead of less [[1]].",
          zh: "芯片是一小块硅片，上面载着微小的电子元件：充当开关的晶体管，以及在 1965 年还很常见的电阻等其他元件，它们在芯片上直接连在一起 [[6]]。摩尔关心的是：一块芯片最多能放多少个元件，再多放一个，每个元件的成本就不降反升 [[1]]。",
        },
        {
          en: "Doubling sounds modest. It is not. In our own arithmetic, doubling every two years for 50 years multiplies a number by more than 33 million. That is roughly the distance between 2,300 transistors and tens of billions.",
          zh: "翻一番听起来不多，其实很惊人。按我们自己的计算，每两年翻一番，50 年后就是原来的 3300 多万倍。这差不多就是从 2300 个晶体管到几百亿个的距离。",
        },
      ],
    },
    {
      id: "cheap", h: { en: "A forecast about price, not size", zh: "一条关于价钱、而不是大小的预测" },
      photo: { file: "Gordon Moore and Robert Noyce at Intel in 1970.png", credit: "Intel Free Press", license: "CC BY-SA 2.0", fit: "contain",
        caption: { en: "Gordon Moore (left) and Robert Noyce at Intel in 1970, two years after they founded the company.", zh: "1970 年，戈登·摩尔（左）和罗伯特·诺伊斯在英特尔，那时他们创办公司已经两年。" },
        alt: { en: "Black-and-white photo of two men in shirts and ties looking at papers", zh: "两位穿衬衫打领带的男士看着文件的黑白照片" } },
      paras: [
        {
          en: "The article, \"Cramming more components onto integrated circuits\", appeared on 19 April 1965 [[1]][[3]]. It opens: \"The future of integrated electronics is the future of electronics itself\" [[2]]. Its point was economic. \"Reduced cost is one of the big attractions of integrated electronics,\" Moore wrote, and he observed that the number of components at the lowest cost per component had \"increased at a rate of roughly a factor of two per year\" [[1]].",
          zh: "这篇文章题为《把更多元件塞进集成电路》（Cramming more components onto integrated circuits），刊于 1965 年 4 月 19 日 [[1]][[3]]。开头一句是：\"集成电子的未来，就是电子业本身的未来\" [[2]]。它讲的是经济账。摩尔写道：\"成本降低是集成电子的一大吸引力\"，他还观察到，在每个元件成本最低时，芯片上的元件数\"大约每年翻一番\" [[1]]。",
        },
        {
          en: "He also guessed what cheap chips would bring: \"such wonders as home computers\", \"automatic controls for automobiles, and personal portable communications equipment\" [[1]]. Looking back, he said: \"My original message was to get the idea across that integrated circuits were going to be cheap someday\" [[7]]. At the time, he said, \"I thought I was just showing a local trend\" [[5]].",
          zh: "他还猜测了便宜的芯片会带来什么：\"家用电脑这样的奇迹\"，\"汽车的自动控制，以及个人便携通信设备\" [[1]]。多年后他回顾说：\"我最初想说的，是集成电路总有一天会变得便宜\" [[7]]。他还说，写那篇文章时，\"我以为自己只是在描述一个局部的趋势\" [[5]]。",
        },
      ],
    },
    {
      id: "revised", h: { en: "1975: every two years, and a name he could not say", zh: "1975 年：改成两年，和一个他说不出口的名字" },
      paras: [
        {
          en: "Ten years later Moore, by then at Intel, revised the pace at the IEEE International Electron Devices Meeting: \"a doubling every two years, rather than every year\" [[3]][[4]]. The name came from someone else. The engineer Carver Mead is widely credited with calling it Moore's Law, though when the term was first used is unclear [[6]][[3]].",
          zh: "十年后，已在英特尔的摩尔在 IEEE 国际电子器件会议上修正了速度：\"每两年翻一番，而不是每年\" [[3]][[4]]。\"定律\"这个名字来自别人。人们普遍认为是工程师卡弗·米德（Carver Mead）把它叫作摩尔定律，不过这个说法最早出现在什么时候并不清楚 [[6]][[3]]。",
        },
        {
          en: "Moore was uneasy with it. For a long time, he said, he \"couldn't even utter the term\" [[5]]. Intel itself describes the principle as \"an operating principle and commitment rather than a force of nature\" [[8]].",
          zh: "摩尔对这个名字并不自在。他说，很长一段时间里他\"连这个词都说不出口\" [[5]]。英特尔自己也把它描述为\"一种运营原则和承诺，而不是自然规律\" [[8]]。",
        },
      ],
    },
    {
      id: "target", h: { en: "The turn: from a record to a target", zh: "反转：从记录变成目标" }, figure: "pricetags",
      paras: [
        {
          en: "Here is the counter-intuitive part. A law of nature holds whether or not anyone believes it. Moore's Law held largely because the industry believed it. \"Then it became a self-fulfilling prophecy,\" Moore said. \"The industry recognized it had to stay on that rate of progress or fall behind\" [[7]]. The historian Cyrus Mody makes the same point: the idea \"has long been a coordinating concept and common goal\" for chipmakers [[6]].",
          zh: "反常识的地方就在这里。自然规律不管有没有人信都成立；摩尔定律之所以成立，很大程度上是因为整个行业信了它。摩尔说：\"后来它变成了一个自我实现的预言。行业意识到，必须跟上这个速度，否则就会落后\" [[7]]。历史学家赛勒斯·莫迪（Cyrus Mody）也这样看：这个想法\"长期以来是芯片业的协调概念和共同目标\" [[6]]。",
        },
        {
          en: "Chipmakers, equipment makers and chip designers could all plan around the same schedule, each expecting the others to deliver on time. Moore came to accept the name as it \"became something that almost drove the semiconductor industry rather than just recording its progress\" [[5]]. By 2010 commercial microprocessors had passed a billion transistors [[4]].",
          zh: "芯片制造商、设备商和芯片设计公司都按同一张时间表做计划，每一方都预期其他方会按时交付。摩尔后来也接受了这个名字，因为它\"几乎变成了推动半导体行业的力量，而不只是记录它的进步\" [[5]]。到 2010 年，商用微处理器的晶体管数已经超过 10 亿个 [[4]]。",
        },
      ],
    },
    {
      id: "intel", h: { en: "He also built the companies that kept the pace", zh: "他也创办了跟上这个节奏的公司" },
      photo: { file: "Intel C4004.jpg", credit: "Thomas Nguyen", license: "CC BY-SA 4.0", fit: "contain",
        caption: { en: "An Intel C4004, Intel's first microprocessor (1971), with 2,300 transistors.", zh: "英特尔 C4004，英特尔第一颗微处理器（1971 年），有 2300 个晶体管。" },
        alt: { en: "A small white and gold chip with gold pins", zh: "带金色引脚的白色和金色小芯片" } },
      paras: [
        {
          en: "Moore was not only an observer. In 1957 he was one of eight colleagues who left Shockley Semiconductor to found Fairchild Semiconductor, and in July 1968 he and Robert Noyce founded Intel [[10]]. Intel's 4004, launched in November 1971 for a Japanese calculator maker, put a whole processor on one chip with 2,300 transistors [[11]].",
          zh: "摩尔不只是旁观者。1957 年，他是离开肖克利半导体、创办仙童半导体的八位同事之一；1968 年 7 月，他和罗伯特·诺伊斯创办了英特尔 [[10]]。英特尔 1971 年 11 月为一家日本计算器公司推出的 4004，把一整个处理器做在一块芯片上，用了 2300 个晶体管 [[11]]。",
        },
        {
          en: "He became Intel's president and chief executive in 1975 and chairman and CEO in 1979, stayed CEO until 1987, and became chairman emeritus in 1997 [[9]]. He received the US National Medal of Technology in 1990 and the Presidential Medal of Freedom in 2002 [[9]].",
          zh: "他 1975 年出任英特尔总裁兼 CEO，1979 年任董事长兼 CEO，CEO 一直做到 1987 年，1997 年成为荣誉董事长 [[9]]。他在 1990 年获美国国家技术奖章，2002 年获总统自由勋章 [[9]]。",
        },
      ],
    },
    {
      id: "now", h: { en: "Is it over?", zh: "它结束了吗？" },
      photo: { file: "Former Intel CEO Gordon Moore in his cubicle.jpg", credit: "Intel Free Press", license: "CC BY-SA 2.0", fit: "contain",
        caption: { en: "Gordon Moore at his desk in Intel's Robert Noyce Building, Santa Clara, July 2003.", zh: "2003 年 7 月，戈登·摩尔在英特尔圣克拉拉罗伯特·诺伊斯大楼的办公位上。" },
        alt: { en: "An older man in a blue shirt sitting in an office cubicle", zh: "穿蓝衬衫的老人坐在办公格子间里" } },
      paras: [
        {
          en: "In September 2022 Nvidia's chief executive, Jensen Huang, said: \"Moore's law is dead,\" adding that \"the idea that the chip is going to go down in cost over time, unfortunately, is a story of the past\" [[14]]. In March 2024 Nvidia's Blackwell joined two dies, each as large as chipmaking tools can print, into one GPU of 208 billion transistors [[13]]. The count still rises; it is the falling cost, the part Moore cared about most, that is in question.",
          zh: "2022 年 9 月，英伟达 CEO 黄仁勋说：\"摩尔定律已经死了\"，并说\"芯片会随着时间越来越便宜，这种想法很遗憾已经成为过去\" [[14]]。2024 年 3 月，英伟达的 Blackwell 把两块芯片拼成一颗 GPU，每块都大到制造设备能印出的极限，共有 2080 亿个晶体管 [[13]]。晶体管数量还在增长；成问题的，是成本下降这一部分，也正是摩尔最看重的那部分。",
        },
        {
          en: "The schedule has not stopped either. TSMC, the subject of our previous issue, began high-volume production of its 2-nanometre chips in late 2025 and plans volume production of its A14 process in 2028 [[15]].",
          zh: "时间表也没有停下。我们上一期写的台积电，2025 年底开始大规模量产 2 纳米芯片，并计划在 2028 年量产 A14 工艺 [[15]]。",
        },
      ],
    },
    { id: "timeline", h: { en: "Timeline", zh: "时间线" }, figure: "timeline", paras: [] },
    {
      id: "end", h: { en: "Observation, projection, promise", zh: "观察、推测、承诺" },
      paras: [
        {
          en: "So why did a line through five dots come true? In our view, because it stopped being only a prediction. Moore offered an observation and a projection; an industry turned it into a promise that each company made to the others, and kept for decades. \"I never expected it to be an accurate prediction,\" Moore said [[7]]. It was accurate because so many people worked to make it so.",
          zh: "那么，一条只连了五个点的线，为什么会成真？在我们看来，是因为它不再只是一个预测。摩尔给出的是一个观察和一个推测；整个行业把它变成了公司之间彼此的承诺，并守了几十年。摩尔说：\"我从没指望它是个准确的预测\" [[7]]。它之所以准，是因为有太多人在努力让它变准。",
        },
      ],
    },
  ],
  timeline: [
    { date: { en: "1957", zh: "1957 年" }, text: { en: "Co-founds Fairchild Semiconductor with Robert Noyce and six others", zh: "与罗伯特·诺伊斯等七人共同创办仙童半导体" }, src: [10] },
    { date: { en: "19 Apr 1965", zh: "1965 年 4 月 19 日" }, text: { en: "\"Cramming more components onto integrated circuits\" in Electronics", zh: "在《电子学》发表《把更多元件塞进集成电路》" }, src: [1, 3] },
    { date: { en: "Jul 1968", zh: "1968 年 7 月" }, text: { en: "Founds Intel with Robert Noyce", zh: "与罗伯特·诺伊斯创办英特尔" }, src: [10] },
    { date: { en: "Nov 1971", zh: "1971 年 11 月" }, text: { en: "Intel 4004, 2,300 transistors", zh: "英特尔 4004，2300 个晶体管" }, src: [11] },
    { date: { en: "1975", zh: "1975 年" }, text: { en: "Revises the pace to a doubling every two years; becomes Intel's president and CEO", zh: "把速度修正为每两年翻一番；出任英特尔总裁兼 CEO" }, src: [3, 9] },
    { date: { en: "1979 to 1987", zh: "1979 至 1987 年" }, text: { en: "Chairman and CEO of Intel", zh: "任英特尔董事长兼 CEO" }, src: [9] },
    { date: { en: "1990", zh: "1990 年" }, text: { en: "US National Medal of Technology", zh: "获美国国家技术奖章" }, src: [9] },
    { date: { en: "2002", zh: "2002 年" }, text: { en: "Presidential Medal of Freedom", zh: "获总统自由勋章" }, src: [9] },
    { date: { en: "2010", zh: "2010 年" }, text: { en: "Commercial microprocessors pass a billion transistors", zh: "商用微处理器晶体管数超过 10 亿个" }, src: [4] },
    { date: { en: "2024", zh: "2024 年" }, text: { en: "Nvidia Blackwell: 208 billion transistors in one GPU", zh: "英伟达 Blackwell：一颗 GPU 有 2080 亿个晶体管" }, src: [13] },
  ],
  countries: [],
  sources: [
    { n: 1, name: "Electronics (reprint)", title: "Gordon E. Moore, \"Cramming more components onto integrated circuits\", Electronics, 19 April 1965", url: "https://www.cs.umd.edu/~gasarch/BLOGPAPERS/gmoore.pdf" },
    { n: 2, name: "Electronics (World Radio History archive)", title: "Electronics, 19 April 1965, full issue (pages 114 to 117)", url: "https://www.worldradiohistory.com/Archive-Electronics/60s/65/Electronics-1965-04-19-Moore's-Law.pdf" },
    { n: 3, name: "Computer History Museum", title: "1965: \"Moore's Law\" predicts the future of integrated circuits", url: "https://www.computerhistory.org/siliconengine/moores-law-predicts-the-future-of-integrated-circuits/" },
    { n: 4, name: "IEEE (ETHW)", title: "Milestone: Moore's Law predicts integrated circuit complexity growth, 1965", url: "https://ieeemilestones.ethw.org/Milestones:Moore's_Law_-_Predicts_Integrated_Circuit_Complexity_Growth,_1965" },
    { n: 5, name: "IEEE Spectrum", title: "Gordon Moore: The man whose name means progress (interview, March 2015)", url: "https://spectrum.ieee.org/gordon-moore-the-man-whose-name-means-progress" },
    { n: 6, name: "IEEE Spectrum", title: "Five things you might not know about Moore's Law", url: "https://spectrum.ieee.org/five-things-you-might-not-know-about-moores-law" },
    { n: 7, name: "EE Times interview (2005), quoted by Om Malik", title: "Moore on Moore's Law (3 April 2023)", url: "https://om.co/2023/04/03/moore-on-moores-law/" },
    { n: 8, name: "Intel", title: "Moore's Law (Intel virtual vault)", url: "https://www.intel.com/content/www/us/en/history/virtual-vault/articles/moores-law.html" },
    { n: 9, name: "Gordon and Betty Moore Foundation", title: "Gordon Moore biography", url: "https://moore.org/docs/default-source/press-kit/gordon-moore-bio" },
    { n: 10, name: "Intel", title: "Press release on Gordon Moore's career (24 March 2023)", url: "https://www.intc.com/news-events/press-releases/detail/1611/gordon-moore-intel-co-founder-dies-at-94" },
    { n: 11, name: "Intel", title: "The story of the Intel 4004", url: "https://www.intel.com/content/www/us/en/history/museum-story-of-intel-4004.html" },
    { n: 12, name: "Science Museum Group", title: "Intel 386 microprocessor, 1985", url: "https://collection.sciencemuseumgroup.org.uk/objects/co523252/intel-386-microprocessor-1985-microprocessors" },
    { n: 13, name: "Nvidia", title: "NVIDIA Blackwell architecture", url: "https://nvidia.com/blackwell" },
    { n: 14, name: "The FPS Review", title: "NVIDIA CEO comments on GeForce RTX 40 pricing, says \"Moore's Law is dead\" (23 September 2022)", url: "https://www.thefpsreview.com/2022/09/23/nvidia-ceo-comments-on-high-pricing-of-geforce-rtx-40-series-graphics-cards-says-moores-law-is-dead" },
    { n: 15, name: "The Motley Fool", title: "TSMC Q3 2026 earnings call transcript (15 October 2026)", url: "https://www.fool.com/earnings/call-transcripts/2026/10/15/tsmc-tsm-q3-2026-earnings-call-transcript/" },
  ],
  stats: [
    { label: { en: "Components he forecast for 1975", zh: "他预测 1975 年的元件数" }, from: 0, to: 65000, unit: "n", fromLabel: { en: "", zh: "" }, toLabel: { en: "per chip; a 1975 memory chip held 65,536", zh: "每块芯片；1975 年一款存储芯片装了 65536 个" },
      line: { en: "65,000 components by 1975, forecast in 1965", zh: "1965 年预测：1975 年 6.5 万个元件" }, src: [1, 8] },
    { label: { en: "Transistors on a chip", zh: "一块芯片上的晶体管" }, from: 2300, to: 208000000000, unit: "n", fromLabel: { en: "Intel 4004, 1971", zh: "英特尔 4004，1971 年" }, toLabel: { en: "Nvidia Blackwell, 2024", zh: "英伟达 Blackwell，2024 年" }, src: [11, 13] },
    { label: { en: "Doubling period", zh: "翻一番的周期" }, from: 1, to: 2, unit: "n", suffix: { en: " years", zh: " 年" }, fromLabel: { en: "1965: every year", zh: "1965 年：每年" }, toLabel: { en: "1975: every two years", zh: "1975 年：每两年" }, src: [1, 3] },
  ],
  name: "Gordon Moore", legalName: "Gordon E. Moore", newsMatch: { src: "\\bIntel\\b|英特尔", flags: "" },
  alwaysCite: [12],
  method: {
    en: "Method: drafted with AI from the sources above and checked line by line by an editor. This profile covers public work, decisions and public statements only. Quotes are from the article, interviews and statements cited (translated by us in the Chinese edition). Transistor counts are as published by the companies. Found a mistake? Email ",
    zh: "写法：本文由 AI 根据上列来源整理，编辑逐条核对。本文只写公开的工作、决定和公开发言。引语出自所列文章、访谈和声明，由我们翻译。晶体管数量以公司公布为准。发现错误请写信到 ",
  },
  // components or transistors per chip [1][8][11][12][4][13]
  priceTags: {
    title: { en: "Components on one chip (log scale)", zh: "一块芯片上的元件数（对数刻度）" },
    note: {
      en: "Log scale: each step is ten times the one before, so a straight climb means steady doubling. Grey: Moore's 1965 forecast for 1975; orange: chips actually made. Sources: Moore (1965), Intel, Science Museum Group, IEEE, Nvidia.",
      zh: "对数刻度：每往右一格是前一格的十倍，所以稳步增长就意味着按时翻番。灰色是摩尔 1965 年对 1975 年的预测，橙色是实际造出来的芯片。来源：摩尔（1965）、英特尔、英国科学博物馆集团、IEEE、英伟达。",
    },
    legend: [{ en: "1965 forecast", zh: "1965 年的预测" }, { en: "Chips made", zh: "实际芯片" }], unit: "n", log: true,
    rows: [
      { label: { en: "Intel 4004 (1971)", zh: "英特尔 4004（1971）" }, v: 2300, kind: "market" },
      { label: { en: "Forecast for 1975", zh: "对 1975 年的预测" }, v: 65000, kind: "deal" },
      { label: { en: "Memory chip (1975)", zh: "存储芯片（1975）" }, v: 65536, kind: "market" },
      { label: { en: "Intel 386 (1985)", zh: "英特尔 386（1985）" }, v: 275000, kind: "market" },
      { label: { en: "Microprocessors (2010)", zh: "微处理器（2010）" }, v: 1000000000, kind: "market" },
      { label: { en: "Nvidia Blackwell (2024)", zh: "英伟达 Blackwell（2024）" }, v: 208000000000, kind: "market" },
    ],
  },
  ig: {
    explain: {
      kicker: { en: "START HERE", zh: "先看懂" },
      rows: [
        { q: { en: "What did Moore predict?", zh: "摩尔预测了什么？" }, a: { en: "In 1965: the components on a chip, at the lowest cost per part, would keep doubling, to 65,000 by 1975.", zh: "1965 年：在每个元件成本最低时，芯片上的元件数会不断翻番，到 1975 年达到 6.5 万个。" } },
        { q: { en: "Is it a law?", zh: "它是定律吗？" }, a: { en: "No. \"It was an observation and a projection,\" Moore said.", zh: "不是。摩尔说：\"只是一个观察和一个推测。\"" } },
        { q: { en: "Then why did it come true?", zh: "那它为什么成真了？" }, a: { en: "The industry made it a target: keep up, or fall behind.", zh: "整个行业把它当成了目标：跟上，否则就落后。" } },
      ],
    },
    numbers: {
      kicker: { en: "ONE FORECAST, THREE NUMBERS", zh: "一条预测，三个数字" },
      rows: [
        { big: { en: "5", zh: "5 个" }, label: { en: "data points behind the forecast", zh: "数据点，撑起了这条预测" }, sub: { en: "Electronics magazine, April 1965", zh: "《电子学》杂志，1965 年 4 月" } },
        { big: { en: "65,000", zh: "6.5 万" }, label: { en: "components he forecast for 1975", zh: "个元件，他对 1975 年的预测" }, sub: { en: "A 1975 memory chip held 65,536", zh: "1975 年一款存储芯片装了 65536 个" } },
        { big: { en: "208 billion", zh: "2080 亿" }, label: { en: "transistors in one Nvidia GPU", zh: "个晶体管，一颗英伟达 GPU" }, sub: { en: "Blackwell, 2024; the 1971 Intel 4004 had 2,300", zh: "Blackwell，2024 年；1971 年的英特尔 4004 只有 2300 个" } },
      ],
      source: { en: "Sources: Moore (1965), IEEE, Intel, Nvidia", zh: "来源：摩尔（1965）、IEEE、英特尔、英伟达" },
    },
    decisionsKicker: { en: "THREE TURNS", zh: "三次转折" },
    decisions: [
      { h: { en: "Draw the line", zh: "画出那条线" }, tag: "1965", t: { en: "Five data points, extended ten years: 65,000 components by 1975. His point: chips will get cheap.", zh: "五个数据点，往后延长十年：1975 年 6.5 万个元件。他想说的是：芯片会变便宜。" } },
      { h: { en: "Slow it down", zh: "放慢一点" }, tag: "1975", t: { en: "Revised to a doubling every two years. Later, someone else named it Moore's Law.", zh: "修正为每两年翻一番。后来，\"摩尔定律\"这个名字是别人起的。" } },
      { h: { en: "Turn it into a target", zh: "变成目标" }, tag: "Industry", t: { en: "\"A self-fulfilling prophecy\": the industry had to keep the pace or fall behind.", zh: "\"自我实现的预言\"：行业必须跟上这个速度，否则就会落后。" } },
    ],
    chart: {
      kind: "tags", kicker: { en: "THE LINE KEPT GOING", zh: "那条线一直在延伸" },
      sub: { en: "Components on one chip, log scale.", zh: "一块芯片上的元件数，对数刻度。" },
      foot: { en: "Moore (1965); Intel; IEEE; Nvidia", zh: "摩尔（1965）；英特尔；IEEE；英伟达" },
    },
    countries: {
      kicker: { en: "THEN AND NOW", zh: "从那时到现在" },
      title: { en: "From a magazine chart to the AI chip", zh: "从一张杂志图表，到 AI 芯片" },
      rows: [
        { flags: [], name: { en: "1965 · Electronics", zh: "1965 · 《电子学》" }, t: { en: "A forecast: 65,000 components on a chip by 1975.", zh: "一条预测：1975 年一块芯片上有 6.5 万个元件。" } },
        { flags: [], name: { en: "1971 · Intel 4004", zh: "1971 · 英特尔 4004" }, t: { en: "A whole processor on one chip: 2,300 transistors.", zh: "一整个处理器做在一块芯片上：2300 个晶体管。" } },
        { flags: [], name: { en: "Today · Nvidia Blackwell", zh: "今天 · 英伟达 Blackwell" }, t: { en: "208 billion transistors; cheaper chips are \"a story of the past\", says its CEO.", zh: "2080 亿个晶体管；它的 CEO 说，芯片变便宜\"已经成为过去\"。" } },
      ],
      foot: { en: "Sources: Moore (1965), Intel, Nvidia, The FPS Review", zh: "来源：摩尔（1965）、英特尔、英伟达、The FPS Review" },
    },
  },
};

export const PROFILES: Profile[] = [AMD, WORLD_LABS, ARM, WILSON, TSMC, MOORE];
/** written but not yet published (next issue); kept here so the text stays with the code that renders it */
export const DRAFTS: Profile[] = [];
export const getProfile = (slug: string) => PROFILES.find((p) => p.slug === slug) ?? null;
export const pick = (l: L, zh: boolean) => (zh ? l.zh : l.en);

/** $ billion → "$2.1B" / "$1T", or "21 亿美元" / "1 万亿美元". */
export const money = (v: number, zh: boolean) => {
  if (zh) {
    if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 2).replace(/\.00$/, "")} 万亿美元`;
    const yi = v * 10;
    return `${yi >= 100 ? Math.round(yi).toLocaleString("en") : yi.toFixed(yi < 10 ? 1 : 0)} 亿美元`;
  }
  if (v >= 1000) return `$${(v / 1000).toFixed(2).replace(/\.00$/, "")}T`;
  return `$${v < 10 ? v.toFixed(1) : Math.round(v).toLocaleString("en")}B`;
};

/** a count: "25,000" / "2.5 万" */
const trim = (x: number) => (Math.round(x * 10) / 10).toString();
export const count = (v: number, zh: boolean) => zh
  ? (v >= 1e8 ? `${trim(v / 1e8)} 亿` : v >= 10000 ? `${(v / 10000).toFixed(v % 10000 ? 1 : 0)} 万` : Math.round(v).toLocaleString("en"))
  : (v >= 1e9 ? `${trim(v / 1e9)} billion` : Math.round(v).toLocaleString("en"));
/** value on a pricetags bar: money by default, a count when unit is "n" */
export const tagVal = (v: number, zh: boolean, unit?: "n") => (unit === "n" ? count(v, zh) : money(v, zh));
/** the headline line of a profile's first stat, for index cards, promos and the Story */
export const statLine = (s: Profile["stats"][number], zh: boolean) => (s.line ? pick(s.line, zh) : `${money(s.from, zh)} → ${money(s.to, zh)}`);

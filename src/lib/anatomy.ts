// Coda Anatomy / Coda 剖面: long-form profiles that cut open one company, industry or turning point.
// Every figure carries a source number [[n]] that the page renders as a link to the source list.
// Rules: facts from the listed sources only; no investment advice; no personal wealth or family gossip.

export type L = { en: string; zh: string };
export type Figure = "cap" | "chiplet" | "revenue" | "vsintel" | "deals" | "timeline" | "countries" | "pricetags" | "pricetags2" | "split" | "royalty" | "model";
/** A freely licensed photo from Wikimedia Commons, hotlinked at a set width, always credited. */
export type Photo = { file: string; credit: string; license: string; caption: L; alt: L; fit?: "cover" | "contain"; pos?: string };
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
  /** Instagram cover line: a stronger hook than the page title, never the same words */
  igHook: L;
  lede: L[]; sections: Section[]; timeline: TimelineItem[]; countries: CountryCard[]; sources: Source[];
  stats: { label: L; from: number; to: number; fromLabel: L; toLabel: L; unit: "bn" | "pct"; src: number[] }[];
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
  royalty?: { title: L; note: L; rows: { label: L; lo: number; hi: number; sub: L; approx?: boolean }[] };
  ig: IgSlides;
};

/** grey bars ("deal") and orange bars ("market"); `legend` renames the two, e.g. earlier deals vs this one */
export type PriceTags = { title: L; note: L; legend?: [L, L]; rows: { label: L; v: number; kind: "deal" | "market" }[] };

/** Text for Instagram slides 2 to 5 and the Story; slide 1 is built from title, igHook and cover. */
export type IgSlides = {
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
    en: "Arm Holdings' technology is in more than 99% of smartphones, yet it has never manufactured a chip. How its licence-and-royalty model works, the Nokia and iPhone years, Armv9 royalty rates, SoftBank, the failed Nvidia deal, the 2023 IPO and its first own chip, the AGI CPU, with every number sourced.",
    zh: "超过 99% 的智能手机基于 Arm 的技术，它却从不自己生产芯片。授权费加版税的模式怎么运作，诺基亚与 iPhone 时代，Armv9 版税率，软银收购、英伟达收购失败、2023 年上市，以及第一颗自有芯片 AGI CPU，每个数字附来源。",
  },
  keywords: ["Arm", "Arm Holdings", "安谋", "Arm 架构", "Arm business model", "Arm 版税", "royalty", "Armv9", "Rene Haas", "SoftBank Arm", "软银 Arm", "Nvidia Arm deal", "Arm IPO", "Arm AGI CPU", "Neoverse"],
  published: "2026-10-08", updated: "2026-10-08",
  cover: { file: "STM32F100C4T6B-HD.jpg", credit: "ZeptoBars", license: "CC BY 3.0",
    caption: { en: "The silicon die of an STM32F100 microcontroller. ST Microelectronics built it around an Arm Cortex-M3 processor core, licensed from Arm.", zh: "STM32F100 微控制器的硅芯片。意法半导体用从 Arm 授权的 Cortex-M3 处理器核心设计了这颗芯片。" },
    alt: { en: "Colourful microscope photo of a microcontroller die", zh: "微控制器芯片裸片的彩色显微照片" } },
  lede: [
    {
      en: "More than 99% of the world's smartphones are based on technology from a company that does not manufacture chips [[1]][[5]]. Arm, based in Cambridge, England, sells blueprints. Chip companies pay a fee to license its designs, then a royalty on every chip they ship. In the year to March 2026 that brought in $4.92 billion, $2.61 billion of it royalties [[2]]. More than 350 billion Arm-based chips have been shipped so far [[1]]. On 25 September 2026 Arm was worth about $331 billion [[17]], more than ten times the $31 billion SoftBank paid for it in 2016 [[12]].",
      zh: "全世界超过 99% 的智能手机，都基于一家不生产芯片的公司的技术 [[1]][[5]]。这家公司叫 Arm，总部在英国剑桥，卖的是图纸：芯片公司先付授权费拿到设计，之后每卖出一颗芯片，再付一笔版税。截至 2026 年 3 月的财年，Arm 由此收入 49.2 亿美元，其中版税 26.1 亿美元 [[2]]。基于 Arm 的芯片累计出货已超过 3500 亿颗 [[1]]。2026 年 9 月 25 日，Arm 市值约 3314 亿美元 [[17]]，是 2016 年软银收购价 310 亿美元的十倍多 [[12]]。",
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
          en: "Arm went back to the stock market instead. It priced its Nasdaq listing at $51 a share on 13 September 2023, a value of more than $54 billion, and SoftBank kept about 90% [[15]][[16]][[27]]. At the end of 2025 Arm's market value was $117 billion; on 25 September 2026 it was about $331 billion [[17]].",
          zh: "Arm 转而重新上市。2023 年 9 月 13 日，它在纳斯达克以每股 51 美元定价，估值超过 540 亿美元，软银保留约 90% 的股份 [[15]][[16]][[27]]。2025 年底，Arm 市值为 1170 亿美元；2026 年 9 月 25 日约为 3314 亿美元 [[17]]。",
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
      id: "countries", h: { en: "One company, told two ways", zh: "同一家公司，两种讲法" }, figure: "countries",
      paras: [
        {
          en: "We looked at articles in our sources between 16 and 25 September 2026 with Arm in the headline: 23 articles, all from two countries. Outlets in Japan, Singapore, India, Germany and France covered SoftBank's record bond sale in the same week, but their headlines were about SoftBank, not Arm. This shows only what our sources carried.",
          zh: "我们查看了 2026 年 9 月 16 日至 25 日，收录来源中标题提到 Arm 的报道：共 23 篇，全部来自两个国家。同一周，日本、新加坡、印度、德国和法国的媒体报道了软银创纪录的债券发行，但标题说的是软银，不是 Arm。这里只反映我们收录的来源。",
        },
      ],
    },
    {
      id: "open", h: { en: "What is not settled", zh: "还没有答案的问题" },
      paras: [
        { en: "Partner or rival. Arm now sells its own data-centre processor in a market where some of the companies that build on its designs, such as Nvidia with Grace, sell Arm-based processors too [[18]][[19]].", zh: "伙伴还是对手。Arm 现在自己卖数据中心处理器，而在同一个市场里，一些基于它的设计做芯片的公司，比如做 Grace 的英伟达，也在卖基于 Arm 的处理器 [[18]][[19]]。" },
        { en: "Licences in court. In December 2024 a US jury found that Qualcomm had not breached the Arm licence of Nuvia, a start-up it bought, and that its chips were covered by its own Arm licence; a judge entered final judgment for Qualcomm in September 2025, and Arm said it would appeal [[24]][[25]].", zh: "授权官司。2024 年 12 月，美国陪审团认定高通没有违反其收购的初创公司 Nuvia 与 Arm 的授权协议，其芯片也在高通自己的 Arm 授权范围内；2025 年 9 月法官作出有利于高通的最终判决，Arm 表示将上诉 [[24]][[25]]。" },
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
    { date: { en: "Sep 2026", zh: "2026 年 9 月" }, text: { en: "Shares up as much as 16.8% in a day; value about $331 billion", zh: "股价单日盘中最多涨 16.8%；市值约 3314 亿美元" }, src: [22, 17] },
  ],
  countries: [
    {
      code: "US", count: 14, outlets: "Yahoo Finance, CNBC",
      focus: { en: "Mostly the stock: whether it is worth buying, comparisons with AMD, Intel and Nvidia, and the chief executive's confidence in the new data-centre chip. Most pieces come from one finance site.", zh: "主要是股票本身：值不值得买，与 AMD、英特尔、英伟达的比较，以及 CEO 对新数据中心芯片的信心。大部分文章来自同一家财经网站。" },
      headlines: [
        { t: "Arm CEO says he's more confident its new AI chip can meet a loftier $2B revenue goal", outlet: "CNBC", url: "https://www.cnbc.com/2026/09/16/jim-cramer-arm-ceo-ai-revenue-goal.html" },
        { t: "Arm Stock: Too Good to Sell, Too Expensive to Buy", outlet: "Yahoo Finance", url: "https://finance.yahoo.com/markets/stocks/articles/arm-stock-too-good-sell-182431532.html" },
        { t: "Meta’s Muse Highlights Arm’s Growing Role in AI Infrastructure", outlet: "Yahoo Finance", url: "https://finance.yahoo.com/technology/ai/articles/meta-muse-highlights-arm-growing-190000939.html" },
      ],
    },
    {
      code: "CN", count: 9, outlets: "21世纪经济报道, 36氪, 钛媒体, IT之家",
      focus: { en: "Arm appears in three ways: as one line in overnight US market roundups, through SoftBank's loan backed by Arm shares, and as a technology inside products and business models, from Arm-based storage devices to a Chinese car-chip maker, Horizon Robotics, betting on an \"Arm plus Android\" platform model.", zh: "Arm 以三种方式出现：美股隔夜行情综述里的一行；以 Arm 股票为抵押的软银贷款；以及产品和商业模式里的技术，从基于 Arm 的存储设备，到中国车载芯片公司地平线押注的\"Arm+Android\"平台模式。" },
      headlines: [
        { t: "从卖芯片到做平台，地平线押注“Arm+Android”模式", outlet: "钛媒体", url: "https://www.tmtpost.com/8148860.html" },
        { t: "软银将Arm保证金贷款增至250亿美元，加大人工智能押注", outlet: "36氪", url: "https://36kr.com/newsflashes/3988504767626241" },
        { t: "威联通推出 12\" 短机身 1U NAS 新品 TS-432XeU，基于 4 核 Arm Cortex-A57 处理器", outlet: "IT之家", url: "https://www.ithome.com/1/005/992.htm" },
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
  ],
  stats: [
    { label: { en: "What Arm is worth", zh: "公司价值" }, from: 31, to: 331.42, fromLabel: { en: "SoftBank's price, 2016", zh: "2016 年软银收购价" }, toLabel: { en: "Sep 2026", zh: "2026 年 9 月" }, unit: "bn", src: [12, 17] },
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
      en: "2016 and 2020 are agreed deal prices; the Nvidia deal was cancelled. September 2023 is the value at the IPO price (\"more than $54 billion\"). The rest are market values at year-end and on 25 September 2026. Sources: SoftBank, CNBC, CompaniesMarketCap.",
      zh: "2016 年和 2020 年是谈定的交易价格，其中英伟达的交易已取消。2023 年 9 月是按发行价计算的估值（\"超过 540 亿美元\"）。其余是年末和 2026 年 9 月 25 日的市值。来源：软银、CNBC、CompaniesMarketCap。",
    },
    rows: [
      { label: { en: "SoftBank deal, Jul 2016", zh: "软银收购，2016.7" }, v: 31, kind: "deal" },
      { label: { en: "Nvidia deal, Sep 2020 (cancelled)", zh: "英伟达收购，2020.9（取消）" }, v: 40, kind: "deal" },
      { label: { en: "Value at IPO, Sep 2023", zh: "上市时估值，2023.9" }, v: 54, kind: "deal" },
      { label: { en: "End of 2023", zh: "2023 年底" }, v: 77.04, kind: "market" },
      { label: { en: "End of 2024", zh: "2024 年底" }, v: 135.78, kind: "market" },
      { label: { en: "End of 2025", zh: "2025 年底" }, v: 116.99, kind: "market" },
      { label: { en: "25 Sep 2026", zh: "2026.9.25" }, v: 331.42, kind: "market" },
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
        { big: { en: "$31B → $331B", zh: "310 亿 → 3314 亿美元" }, label: { en: "What Arm is worth", zh: "公司价值" }, sub: { en: "SoftBank's price in 2016 → 25 September 2026", zh: "2016 年软银收购价 → 2026 年 9 月 25 日市值" } },
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
      kicker: { en: "ONE COMPANY, TWO STORIES", zh: "同一家公司，两种讲法" },
      title: { en: "How US and Chinese outlets wrote about Arm in September", zh: "9 月中旬，美国和中国媒体怎么写 Arm" },
      rows: [
        { flags: ["us"], name: { en: "United States", zh: "美国" }, t: { en: "Mostly the stock: is it worth buying, and can the new data-centre chip reach its $2 billion goal?", zh: "主要是股票：值不值得买，新数据中心芯片能否达到 20 亿美元目标。" } },
        { flags: ["cn"], name: { en: "China", zh: "中国" }, t: { en: "A line in market roundups, SoftBank's loan against Arm shares, and Arm inside products and business models.", zh: "行情综述里的一行、以 Arm 股票抵押的软银贷款，以及产品和商业模式里的 Arm。" } },
      ],
      foot: { en: "23 articles in our sources, 16 to 25 September 2026", zh: "我们收录的 23 篇报道，2026 年 9 月 16 日至 25 日" },
    },
  },
};

const WORLD_LABS: Profile = {
  slug: "amd-world-labs", no: 2, companyId: 18, companySlug: "amd",
  title: { en: "AMD to Buy World Labs: A Chipmaker's Bet on World Models", zh: "AMD 拟收购 World Labs：芯片公司押注世界模型" },
  dek: {
    en: "AMD has agreed to pay about $8.2 billion in stock for World Labs, the two-year-old company Fei-Fei Li co-founded. If it goes through, it will be AMD's second-largest deal, and a bet that a model team can shape the chips that come next.",
    zh: "AMD 同意以约 82 亿美元股票收购李飞飞参与创办、成立两年的 World Labs。若交易完成，这将是它史上第二大收购；它押注的是：让做模型的人，反过来定义下一代芯片。",
  },
  social: { en: "Why a chipmaker paid $8.2 billion for a model company", zh: "一家芯片公司，为什么花 82 亿美元买模型公司" },
  igHook: { en: "It makes the compute. Now it wants to pay $8.2 billion for the people who build the models", zh: "它造算力，却要花 82 亿美元买下李飞飞的团队" },
  seoTitle: { en: "AMD to Acquire Fei-Fei Li's World Labs for $8.2 Billion: What It Buys and Why", zh: "AMD 拟 82 亿美元收购李飞飞 World Labs：买什么，为什么买" },
  seoDesc: {
    en: "AMD agreed on 28 September 2026 to buy World Labs, Fei-Fei Li's spatial-intelligence start-up, in an all-stock deal worth about $8.2 billion. What World Labs makes (Marble, RTFM), Li's new role as AMD chief scientist, the price against its funding rounds, AMD's earlier acquisitions, the race for world models, and how media in six countries reported it. Every number sourced.",
    zh: "2026 年 9 月 28 日，AMD 同意以约 82 亿美元全股票收购李飞飞的空间智能公司 World Labs。World Labs 做什么（Marble、RTFM），李飞飞出任 AMD 首席科学家，收购价与融资估值对比，AMD 以往的收购，世界模型之争，以及六个国家的媒体怎么报道。每个数字附来源。",
  },
  keywords: ["AMD", "World Labs", "Fei-Fei Li", "李飞飞", "苏姿丰", "Lisa Su", "AMD acquisition", "AMD 收购", "world model", "世界模型", "spatial intelligence", "空间智能", "Marble", "physical AI"],
  published: "2026-10-01", updated: "2026-10-01",
  cover: { file: "Polycam gaussian splatting exemplo.png", credit: "Óscar Mirás", license: "CC BY-SA 4.0",
    caption: { en: "A garden captured as a 3D scene with Gaussian splatting, one of the formats World Labs' Marble can export.", zh: "用高斯泼溅（Gaussian splatting）技术捕捉成 3D 场景的花园。这是 World Labs 的 Marble 可以导出的格式之一。" },
    alt: { en: "3D-captured garden with a round fountain", zh: "3D 捕捉的花园和圆形喷泉" } },
  lede: [
    {
      en: "AMD sells the chips that artificial intelligence runs on. On 28 September 2026 it agreed to buy a company that makes AI models instead: World Labs, founded two years ago by the computer scientist Fei-Fei Li and three colleagues, for about $8.2 billion in AMD shares [[1]][[8]]. If completed, it will be AMD's second-largest acquisition, after Xilinx [[6]]. World Labs has not disclosed any revenue [[35]]. AMD is not buying sales. It is betting that a model team inside the company will show, earlier than customers can, what the next chips need. The risk is that this view of the future does not turn into software that developers use or chips that customers buy.",
      zh: "AMD 卖的是让人工智能运行的芯片。2026 年 9 月 28 日，它同意收购一家做 AI 模型的公司：由计算机科学家李飞飞和三位同事两年前创办的 World Labs，作价约 82 亿美元，全部以 AMD 股票支付 [[1]][[8]]。若交易完成，这将是 AMD 史上第二大收购，仅次于 Xilinx [[6]]。World Labs 没有公布过收入 [[35]]。AMD 买的不是销售额。它押注的是：公司内部有了做模型的团队，就能比客户更早看清下一代芯片需要什么。风险在于，这份对未来的判断，未必能变成开发者愿意用的软件和客户愿意买的芯片。",
    },
  ],
  sections: [
    {
      id: "basics", h: { en: "Start here: three names in plain words", zh: "零基础先看：三个名词" },
      paras: [
        {
          en: "World Labs. A small American AI company, founded in 2024. It builds AI that turns a sentence, a photo or a video into a 3D world you can move around in [[8]][[12]]. Think of the difference between a painting of a room and a room you can step into: most image AI makes the painting; World Labs tries to make the room.",
          zh: "World Labs。一家 2024 年成立的美国 AI 小公司。它做的 AI，能把一句话、一张照片或一段视频变成可以在里面走动的 3D 世界 [[8]][[12]]。打个比方：一幅房间的画和一个能走进去的房间是两回事。大多数图像 AI 画的是那幅画，World Labs 想造的是那个房间。",
        },
        {
          en: "World model. AI that learns how real space looks and behaves: where things are, how far apart, what you would see if you turned around. Chatbots mostly learn from text; world models learn from images and video of real places [[8]]. Today they are used for games and film sets. In future they could supply simulated worlds for training robots and self-driving cars before they go into real ones [[27]], but current products are still some way from accurate, tested physical simulation [[37]].",
          zh: "世界模型。一种学习真实空间长什么样、怎么运作的 AI：东西在哪里、相隔多远、转过身会看到什么。聊天机器人主要从文字里学习，世界模型则从真实场景的图片和视频里学习 [[8]]。现在它主要用于游戏和影视场景。将来，它可能为机器人和自动驾驶汽车提供模拟训练环境，让它们先在虚拟世界里学习，再进入真实世界 [[27]]；但现有产品离精确、可验证的物理模拟还有明显距离 [[37]]。",
        },
        {
          en: "Fei-Fei Li. A computer scientist at Stanford. In the late 2000s she led the building of ImageNet, a library of more than 14 million photos, each labelled by hand with what it shows [[34]]. It became a shared test for computers that recognise pictures. In 2012 a neural network called AlexNet won that test by a wide margin, and the technology industry took notice of deep learning, the approach behind today's AI [[34]].",
          zh: "李飞飞。斯坦福大学的计算机科学家。2000 年代后期，她主导建立了 ImageNet：一个有 1400 多万张照片的图库，每张都由人工标注了内容 [[34]]。它成了电脑\"认图\"能力的统一考试。2012 年，一个叫 AlexNet 的神经网络在这场考试中大幅领先，科技行业由此开始重视深度学习，也就是今天 AI 背后的方法 [[34]]。",
        },
        {
          en: "Why a chip company. AMD makes the processors AI runs on, and competes with Nvidia. Buying World Labs gives it a team that builds a new kind of AI model, so it can see early what hardware those models will need [[1]].",
          zh: "芯片公司为什么要买。AMD 造的是运行 AI 的处理器，和英伟达竞争。买下 World Labs，它就有了一支做新型 AI 模型的团队，能更早看清这类模型需要什么样的硬件 [[1]]。",
        },
      ],
    },
    {
      id: "deal", h: { en: "The deal", zh: "交易本身" },
      paras: [
        {
          en: "AMD announced the purchase after the US market closed on 28 September. The deal is all-stock and valued at about $8.2 billion; the number of AMD shares will be set by AMD's average share price over the ten trading days before closing [[38]]. AMD expects to complete it by the end of 2026, subject to regulatory approvals [[1]][[24]]. Fei-Fei Li will become AMD's executive vice president and chief scientist, reporting to chief executive Lisa Su [[1]].",
          zh: "AMD 在 9 月 28 日美股收盘后宣布这笔收购。交易全部以股票支付，作价约 82 亿美元；最终发行多少股，要按交割前 10 个交易日 AMD 的平均股价计算 [[38]]。交易预计 2026 年底前完成，还需通过监管审批 [[1]][[24]]。李飞飞将出任 AMD 执行副总裁兼首席科学家，直接向 CEO 苏姿丰汇报 [[1]]。",
        },
        {
          en: "Justin Johnson and Ben Mildenhall, two of World Labs' co-founders, will keep leading its team together with Li, as a research organisation inside AMD [[2]]. Neither company has said what will happen to Marble, World Labs' product [[35]].",
          zh: "World Labs 的两位联合创始人 Justin Johnson 和 Ben Mildenhall 将与李飞飞一起，继续带领这支团队，作为 AMD 内部的研究机构运作 [[2]]。产品 Marble 之后怎么安排，两家公司都没有说明 [[35]]。",
        },
      ],
    },
    {
      id: "world", h: { en: "What World Labs makes", zh: "World Labs 做什么" },
      paras: [
        {
          en: "World Labs came out of stealth on 13 September 2024 with $230 million from investors including Andreessen Horowitz, NEA and Nvidia's venture arm [[8]]. Its subject is what the company calls spatial intelligence: letting computers \"perceive and reason about the physical world in three dimensions, much like humans do\" [[8]].",
          zh: "World Labs 于 2024 年 9 月 13 日公开亮相，获得 2.3 亿美元融资，投资方包括 Andreessen Horowitz、NEA 和英伟达的风投部门 [[8]]。它研究的是公司所说的空间智能：让计算机像人一样，在三维空间里感知和理解物理世界 [[8]]。",
        },
        {
          en: "Its first public product, Marble, opened to everyone on 12 November 2025. It builds 3D worlds from text, images, video or rough 3D layouts, and exports them with collision meshes that a physics engine can work with [[12]][[37]]. A research model, RTFM, generates video in real time as a user moves through a scene, running on a single Nvidia H100 GPU [[13]]. In February 2026 World Labs raised $1 billion from investors that included both AMD and Nvidia, as well as Autodesk [[9]].",
          zh: "它的第一款公开产品 Marble 于 2025 年 11 月 12 日向所有人开放，可以根据文字、图片、视频或粗略的 3D 布局生成 3D 世界，并附带物理引擎可以使用的碰撞网格 [[12]][[37]]。研究模型 RTFM 能在用户穿行场景时实时生成画面，只需一块英伟达 H100 GPU [[13]]。2026 年 2 月，World Labs 融资 10 亿美元，投资方中既有 AMD，也有英伟达，还有 Autodesk [[9]]。",
        },
        {
          en: "World Labs itself sorts world models into three kinds: renderers, which produce pictures for people; simulators, which keep a geometrically and physically faithful state of a scene; and planners, which decide what a robot should do next. It notes that planning systems have so far been \"confined to heavily constrained laboratory setups\" [[37]]. A beautiful, consistent 3D scene is not yet an environment in which a real robot can learn weight, friction or cause and effect.",
          zh: "World Labs 自己把世界模型分成三类：渲染器，生成给人看的画面；模拟器，保存场景在几何和物理上准确的状态；规划器，决定机器人下一步该做什么。它也承认，规划系统至今大多局限在\"高度受限的实验室环境\"里 [[37]]。一个漂亮、连贯的 3D 场景，还不等于一个能让真实机器人学会重量、摩擦和因果关系的环境。",
        },
      ],
    },
    {
      id: "li", h: { en: "Fei-Fei Li", zh: "李飞飞" },
      photo: { file: "Fei-Fei Li at AI for Good 2017.jpg", credit: "ITU Pictures", license: "CC BY 2.0", pos: "center 20%",
        caption: { en: "Fei-Fei Li speaking at the AI for Good Global Summit in Geneva, June 2017.", zh: "2017 年 6 月，李飞飞在日内瓦的 AI for Good 全球峰会上演讲。" },
        alt: { en: "Fei-Fei Li speaking at a lectern", zh: "李飞飞在讲台上演讲" } },
      paras: [
        {
          en: "Li is best known for ImageNet, a large database of labelled images that she started at Princeton in 2007 and presented in 2009 [[32]][[15]]. Stanford's Institute for Human-Centered AI, which she co-founded and co-directs, describes her as the inventor of ImageNet and the ImageNet Challenge [[14]]. She is a professor of computer science at Stanford and was chief scientist of AI at Google Cloud in 2017 and 2018 [[14]][[15]].",
          zh: "李飞飞最为人熟知的成果是 ImageNet：一个大型标注图像数据库，2007 年在普林斯顿大学启动，2009 年正式发表 [[15]][[32]]。她参与创办并担任联合主任的斯坦福以人为本人工智能研究院（HAI）称她为 ImageNet 和 ImageNet 挑战赛的发明者 [[14]]。她是斯坦福大学计算机科学教授，2017 至 2018 年曾任谷歌云 AI 首席科学家 [[14]][[15]]。",
        },
        {
          en: "Some outlets call her the \"godmother of AI\" [[30]]. She has said she would never call herself that [[32]].",
          zh: "一些媒体称她为\"AI 教母\" [[30]]，她本人说过，自己绝不会这样称呼自己 [[32]]。",
        },
      ],
    },
    {
      id: "why", h: { en: "The choice: buy the people who build models", zh: "抉择：把做模型的人买进来" },
      photo: { file: "SXSW-2024-alih-OB7A0861-Lisa Su (cropped 2).jpg", credit: "Fuzheado", license: "CC BY 4.0", pos: "center 25%",
        caption: { en: "Lisa Su speaking at SXSW in Austin, March 2024.", zh: "2024 年 3 月，苏姿丰在美国奥斯汀 SXSW 大会上发言。" },
        alt: { en: "Lisa Su speaking on stage", zh: "苏姿丰在台上发言" } },
      paras: [
        {
          en: "AMD's reason is knowledge rather than revenue. \"Building the compute platforms for the next generation of AI requires a deep understanding of how models are evolving,\" Su said [[1]]. Li put it from the other side: her team needs to get \"closer to the hardware\", because without a focused hardware effort, she wrote, \"AI is hobbled in efficiency. And scale.\" [[3]]",
          zh: "AMD 看重的是知识，而不是收入。苏姿丰说：\"为下一代 AI 打造计算平台，需要深入理解模型如何演进。\" [[1]] 李飞飞则从另一边说：团队需要\"更靠近硬件\"，因为她写道，没有专注的硬件投入，\"AI 在效率和规模上都会受限\" [[3]]。",
        },
        {
          en: "The two companies already worked together: they formed a partnership on inference optimisation and training in 2025 [[4]]. AMD also says it is not trying to compete with the AI companies that buy its chips; Vamsi Boppana, its senior vice president for AI, said that is \"not the intent at all\" [[7]].",
          zh: "两家公司此前已有合作：2025 年，它们在推理优化和训练上结成伙伴关系 [[4]]。AMD 也表示，它无意与购买其芯片的 AI 公司竞争。AMD 负责 AI 的高级副总裁 Vamsi Boppana 说，这\"完全不是本意\" [[7]]。",
        },
        {
          en: "In practice, the argument is a feedback loop. A team building new models runs into a chip's limits first: memory size and bandwidth, the links between GPUs, delay, power use, and missing software tools. Chips take years to design, so hearing about those limits from customers can come late. A model team inside AMD could act as an early, demanding in-house customer for its Instinct accelerators and ROCm software; AMD says World Labs will help it understand new AI workloads and shape its hardware, software and systems [[1]].",
          zh: "说到底，这是一个反馈循环。做新模型的团队，会最先撞上芯片的极限：显存容量和带宽、GPU 之间的互联、延迟、功耗，以及缺少的软件工具。芯片要花好几年设计，等客户反馈这些问题，往往已经晚了。放在 AMD 内部的模型团队，可以成为它 Instinct 加速器和 ROCm 软件的一个早期、挑剔的\"内部客户\"。AMD 也说，World Labs 将帮助它理解新的 AI 工作负载，进而影响它的硬件、软件和系统 [[1]]。",
        },
        {
          en: "The first test has a twist. When World Labs introduced RTFM, it stressed that the model runs in real time on a single Nvidia H100 [[13]], a rival's chip. Whether World Labs' models run as well, or better, on AMD's own accelerators will be one of the earliest signs of whether the deal works.",
          zh: "第一道检验就有些微妙。World Labs 发布 RTFM 时强调，它只需一块英伟达 H100 就能实时运行 [[13]]，那是竞争对手的芯片。World Labs 的模型在 AMD 自家加速器上能否跑得一样好、甚至更好，会是这笔交易成败最早的信号之一。",
        },
      ],
    },
    {
      id: "list", h: { en: "Part of a longer shopping list", zh: "一份更长的购物清单" }, figure: "pricetags",
      photo: { file: "2485 Augustine Drive headquarters in Santa Clara, California.jpg", credit: "Coolcaesar", license: "CC BY-SA 4.0",
        caption: { en: "AMD headquarters in Santa Clara, California.", zh: "AMD 位于美国加州圣克拉拉的总部。" }, alt: { en: "AMD headquarters building", zh: "AMD 总部大楼" } },
      paras: [
        {
          en: "World Labs follows a run of purchases that moved AMD from chips towards complete AI systems: Xilinx, completed in February 2022 at about $49 billion [[16]]; the networking-chip designer Pensando for about $1.9 billion in 2022 [[17]]; the AI lab Silo AI for about $665 million in 2024 [[18]]; and the server builder ZT Systems for $4.9 billion, completed in March 2025 [[36]][[19]]. Several smaller AI software teams joined at undisclosed prices, the latest being MK1 in November 2025 [[33]].",
          zh: "在 World Labs 之前，AMD 已经做了一连串收购，从芯片走向完整的 AI 系统：2022 年 2 月完成收购 Xilinx，约 490 亿美元 [[16]]；2022 年以约 19 亿美元收购网络芯片设计公司 Pensando [[17]]；2024 年以约 6.65 亿美元收购 AI 实验室 Silo AI [[18]]；2025 年 3 月以 49 亿美元完成收购服务器制造商 ZT Systems [[36]][[19]]。还有几支较小的 AI 软件团队以未公开的价格并入，最近一家是 2025 年 11 月的 MK1 [[33]]。",
        },
      ],
    },
    {
      id: "price", h: { en: "The price", zh: "价格" }, figure: "pricetags2",
      paras: [
        {
          en: "World Labs was valued at about $1 billion when it emerged in 2024 [[5]][[11]]. When it raised $1 billion in February 2026, press reports put its valuation at about $5 billion, a figure the company did not confirm [[10]][[11]]. AMD's price is about 64% above that reported figure. But World Labs has not disclosed revenue, losses or customer numbers, so the usual financial yardsticks cannot test the price [[35]]. How many new AMD shares are issued depends on AMD's share price before closing; one estimate put them at about 0.8% of the company [[38]][[24]].",
          zh: "2024 年亮相时，World Labs 估值约 10 亿美元 [[5]][[11]]。2026 年 2 月融资 10 亿美元时，媒体报道其估值约 50 亿美元，公司没有证实 [[10]][[11]]。AMD 的出价比这个报道数字高约 64%。但 World Labs 没有公开收入、亏损和客户数量，常用的财务指标无法检验这个价格 [[35]]。新发多少 AMD 股份取决于交割前的股价，有估算认为约占 AMD 股本的 0.8% [[38]][[24]]。",
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
          en: "World models, AI systems that generate and simulate 3D environments, are also a focus for AMD's rivals. Google DeepMind showed Genie 3, a real-time interactive world model, in August 2025 [[26]]. Nvidia launched its Cosmos world foundation models in January 2025 to generate training data for robots and self-driving cars [[27]]. The broker Stifel said World Labs fills a gap for AMD, which had released only text and video open models [[23]].",
          zh: "世界模型，也就是能生成并模拟三维环境的 AI 系统，同样是 AMD 竞争对手的重点。谷歌 DeepMind 在 2025 年 8 月展示了实时交互的世界模型 Genie 3 [[26]]。英伟达在 2025 年 1 月推出 Cosmos 世界基础模型，用来为机器人和自动驾驶汽车生成训练数据 [[27]]。券商 Stifel 认为，World Labs 填补了 AMD 的空白，因为 AMD 此前只发布过文本和视频类开放模型 [[23]]。",
        },
        {
          en: "Large technology companies have also paid heavily for AI teams. Meta invested $14.3 billion in Scale AI in 2025 and hired its chief executive [[29]]. In December 2025 Nvidia agreed a licensing deal with the chip start-up Groq, reported at $20 billion, with Groq's founder joining Nvidia [[28]].",
          zh: "大型科技公司也在为 AI 团队付出高价。2025 年，Meta 向 Scale AI 投资 143 亿美元，并聘请了其 CEO [[29]]。2025 年 12 月，英伟达与芯片初创公司 Groq 达成授权协议，据报道金额为 200 亿美元，Groq 创始人加入英伟达 [[28]]。",
        },
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
    {
      id: "open", h: { en: "What is not settled", zh: "还没有答案的问题" },
      paras: [
        { en: "Will it run on AMD? RTFM was shown on an Nvidia H100 [[13]]. The measurable test is whether World Labs' models run faster or cheaper on AMD Instinct, and whether that draws outside developers to ROCm.", zh: "能否在 AMD 上跑？RTFM 展示时用的是英伟达 H100 [[13]]。可以衡量的检验是：World Labs 的模型在 AMD Instinct 上能否更快或更便宜，以及这能否把外部开发者吸引到 ROCm。" },
        { en: "Is a model lab the gap that matters most? For years Nvidia's CUDA has been the default for AI developers [[39]]. The same $8.2 billion could have gone into software, compilers and developer support.", zh: "模型实验室是最要紧的短板吗？多年来，英伟达的 CUDA 一直是 AI 开发者的默认选择 [[39]]。同样的 82 亿美元，也可以投到软件、编译器和开发者支持上。" },
        { en: "Lab or product? Neither company has said what happens to Marble [[35]]. World Labs could turn from a start-up serving many kinds of hardware into a lab that mainly shows off AMD's.", zh: "实验室还是产品？两家公司都没说 Marble 之后怎么安排 [[35]]。World Labs 可能从一家面向各种硬件的创业公司，变成主要为 AMD 硬件做展示的内部实验室。" },
        { en: "Will customers still share their plans? AMD says it will not compete with the AI companies that buy its chips [[7]], but it will now own a model team of its own.", zh: "客户还会分享路线图吗？AMD 表示不会与购买其芯片的 AI 公司竞争 [[7]]，但它自己也将拥有一支模型团队。" },
        { en: "Will the people stay, and will the deal close? The price rests on the team rather than on sales [[35]], and the deal still needs regulatory approval before the end of 2026 [[1]].", zh: "人能留住吗，交易能完成吗？价格的依据是团队而不是销售 [[35]]，交易也仍需在 2026 年底前通过监管审批 [[1]]。" },
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
    { n: 39, name: "虎嗅", title: "1万亿的AMD 苏姿丰的12年", url: "https://www.huxiu.com/article/4893413.html" },
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
    explain: {
      kicker: { en: "START HERE", zh: "零基础先看" },
      rows: [
        { q: { en: "What is World Labs?", zh: "World Labs 是什么？" }, a: { en: "A two-year-old AI company that turns a sentence or a photo into a 3D world you can walk through.", zh: "成立两年的 AI 公司：一句话或一张照片，就能变成可以走进去的 3D 世界。" } },
        { q: { en: "What is a world model?", zh: "世界模型是什么？" }, a: { en: "AI that learns how real space looks and works, so it can build and simulate places for games, films and training robots.", zh: "让 AI 理解真实空间长什么样、怎么运作，能搭建和模拟场景，用于游戏、影视和训练机器人。" } },
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

export const PROFILES: Profile[] = [AMD, WORLD_LABS];
/** written but not yet published (next issue); kept here so the text stays with the code that renders it */
export const DRAFTS: Profile[] = [ARM];
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

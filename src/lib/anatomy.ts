// Coda Anatomy / Coda 剖面: long-form profiles that cut open one company, industry or turning point.
// Every figure carries a source number [[n]] that the page renders as a link to the source list.
// Rules: facts from the listed sources only; no investment advice; no personal wealth or family gossip.

export type L = { en: string; zh: string };
export type Figure = "cap" | "chiplet" | "revenue" | "vsintel" | "deals" | "timeline" | "countries";
/** A freely licensed photo from Wikimedia Commons, hotlinked at a set width, always credited. */
export type Photo = { file: string; credit: string; license: string; caption: L; alt: L; fit?: "cover" | "contain" };
export const photoUrl = (file: string, width = 1600) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
export const photoPage = (file: string) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, "_"))}`;
export type Section = { id: string; h: L; paras: L[]; figure?: Figure; photo?: Photo };
export type Source = { n: number; name: string; title: string; url: string };
export type TimelineItem = { date: L; text: L; src: number[] };
export type CountryCard = { code: string; count: number; outlets: string; focus: L; headlines: { t: string; url: string; outlet: string }[] };
export type Point = { x: number; label: string; v: number };

export type Profile = {
  slug: string; no: number; companyId: number; companySlug: string;
  title: L; dek: L; social: L; published: string; updated: string; cover: Photo;
  /** what people search for: used in the <title> and meta description; the page itself shows `title` */
  seoTitle: L; seoDesc: L; keywords: string[];
  lede: L[]; sections: Section[]; timeline: TimelineItem[]; countries: CountryCard[]; sources: Source[];
  stats: { label: L; from: number; to: number; fromLabel: L; toLabel: L; unit: "bn" | "pct"; src: number[] }[];
  cap: Point[]; intel: Point[]; revenue: { year: number; v: number; dc?: number }[];
  deals: { name: string; gw: number; date: L; src: number[] }[];
};

const AMD: Profile = {
  slug: "amd", no: 1, companyId: 18, companySlug: "amd",
  title: { en: "AMD, Rebuilt", zh: "AMD：重做一家公司" },
  dek: {
    en: "From Zen and TSMC to AI: the three changes of course that took AMD from about $2 billion to $1 trillion in twelve years.",
    zh: "从 Zen、台积电到 AI，AMD 用十二年完成的三次关键换轨。",
  },
  social: { en: "Three decisions that rebuilt AMD", zh: "三个决定，如何重做 AMD" },
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
      photo: { file: "2485 Augustine Drive headquarters in Santa Clara, California.jpg", credit: "Coolcaesar", license: "CC BY-SA 4.0",
        caption: { en: "AMD headquarters in Santa Clara, California.", zh: "AMD 位于美国加州圣克拉拉的总部。" }, alt: { en: "AMD headquarters building", zh: "AMD 总部大楼" } },
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
};

export const PROFILES: Profile[] = [AMD];
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

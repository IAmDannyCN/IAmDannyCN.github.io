const fs = require("fs");
const path = require("path");

const postPath = path.resolve(__dirname, "../网络/RDMA.md");
let md = fs.readFileSync(postPath, "utf8");

const title = "从传统网络视角理解 RDMA：通信抽象、数据通路与 RoCEv2 拥塞控制";
const frontMatter = `---\ntitle: ${title}\ndate: 2026-05-14 00:00:00\ncategories:\n  - 网络\ntags:\n  - 网络\n  - RDMA\n  - RoCEv2\n---`;

md = md.replace(/^---[\s\S]*?---/, frontMatter);
md = md.replace(new RegExp(`\\n# ${title}\\n+`), "\n");

const imageMap = new Map([
  ["/images/rdma/rdma-setup-flow.svg", "rdma-setup-flow.svg"],
  ["/images/rdma/rdma-write-sequence.svg", "rdma-write-sequence.svg"],
  ["/images/rdma/rdma-ddr-to-ddr.svg", "rdma-ddr-to-ddr.svg"],
  ["/images/rdma/rocev2-packet-format.svg", "rocev2-packet-format.svg"],
  ["/images/rdma/rocev2-ecn-cnp.svg", "rocev2-ecn-cnp.svg"],
  ["/images/rdma/rdma-bandwidth-bottleneck.svg", "rdma-bandwidth-bottleneck.svg"],
]);

md = md.replace(
  /\n图片引用建议：\n\n```markdown\n!\[([^\]]*)\]\((\/images\/rdma\/[^)]+)\)\n```\n/g,
  (_, alt, src) => `\n![](${imageMap.get(src) || path.basename(src)})\n`,
);

md = md.replace(/\n---\n\n# 附录：Mermaid 图源文件与导出脚本[\s\S]*$/u, "\n");
md = md.replace(/[ \t]+$/gm, "");
md = md.replace(/\n{3,}/g, "\n\n");
md = md.trimEnd() + "\n";

fs.writeFileSync(postPath, md);
console.log(`Normalized ${postPath}`);

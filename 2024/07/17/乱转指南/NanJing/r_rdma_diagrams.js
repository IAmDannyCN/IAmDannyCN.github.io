const fs = require("fs");
const path = require("path");

const outDir = path.resolve(__dirname, "../网络/RDMA");
fs.mkdirSync(outDir, { recursive: true });

const style = `
  <defs>
    <style>
      .title { font: 700 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #1f2937; }
      .label { font: 600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #1f2937; }
      .small { font: 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #4b5563; }
      .tiny { font: 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #6b7280; }
      .box { fill: #f8fafc; stroke: #334155; stroke-width: 1.5; rx: 8; }
      .blue { fill: #e0f2fe; stroke: #0369a1; }
      .green { fill: #dcfce7; stroke: #15803d; }
      .amber { fill: #fef3c7; stroke: #b45309; }
      .rose { fill: #ffe4e6; stroke: #be123c; }
      .violet { fill: #ede9fe; stroke: #6d28d9; }
      .line { stroke: #334155; stroke-width: 2; fill: none; marker-end: url(#arrow); }
      .dash { stroke-dasharray: 6 5; }
    </style>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#334155"/>
    </marker>
  </defs>`;

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function svg(name, width, height, body) {
  fs.writeFileSync(
    path.join(outDir, name),
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${style}${body}</svg>\n`,
  );
}

function textLines(lines, x, y, cls = "small", gap = 18, anchor = "middle") {
  return lines
    .map((line, i) => `<text class="${cls}" x="${x}" y="${y + i * gap}" text-anchor="${anchor}">${esc(line)}</text>`)
    .join("");
}

function box(x, y, w, h, lines, cls = "box") {
  return `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}"/>${textLines(lines, x + w / 2, y + h / 2 - (lines.length - 1) * 9 + 5)}`;
}

function arrow(x1, y1, x2, y2, label = "", cls = "line") {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const t = label ? `<text class="tiny" x="${midX}" y="${midY - 7}" text-anchor="middle">${esc(label)}</text>` : "";
  return `<path class="${cls}" d="M ${x1} ${y1} L ${x2} ${y2}"/>${t}`;
}

svg(
  "rdma-setup-flow.svg",
  1180,
  420,
  `
  <text class="title" x="40" y="46">RDMA 建链与准备流程</text>
  ${box(40, 92, 150, 70, ["打开 RDMA", "Device"], "box blue")}
  ${box(235, 92, 150, 70, ["创建 PD"], "box")}
  ${box(430, 92, 150, 70, ["注册 MR", "lkey / rkey"], "box green")}
  ${box(625, 92, 150, 70, ["创建 CQ"], "box")}
  ${box(820, 92, 150, 70, ["创建 QP"], "box violet")}
  ${box(1015, 92, 125, 70, ["INIT"], "box")}
  ${arrow(190, 127, 235, 127)}${arrow(385, 127, 430, 127)}${arrow(580, 127, 625, 127)}${arrow(775, 127, 820, 127)}${arrow(970, 127, 1015, 127)}
  ${box(235, 250, 185, 82, ["交换连接信息", "QPN / PSN / GID", "rkey / addr"], "box amber")}
  ${box(500, 250, 150, 70, ["RTR", "Ready to Receive"], "box")}
  ${box(730, 250, 150, 70, ["RTS", "Ready to Send"], "box")}
  ${box(960, 250, 150, 70, ["post WQE", "开始通信"], "box green")}
  ${arrow(1078, 162, 420, 250, "控制面交换", "line dash")}
  ${arrow(420, 291, 500, 285)}${arrow(650, 285, 730, 285)}${arrow(880, 285, 960, 285)}
  `,
);

svg(
  "rdma-write-sequence.svg",
  1220,
  620,
  `
  <text class="title" x="40" y="46">RDMA Write 通信流程</text>
  ${["Sender App", "Sender CPU", "Sender RNIC", "Ethernet Fabric", "Receiver RNIC", "Receiver DDR", "Receiver App"].map((n, i) => {
    const x = 80 + i * 170;
    return `${box(x, 82, 130, 48, [n], i === 2 || i === 4 ? "box blue" : i === 3 ? "box amber" : "box")}<path class="dash" d="M ${x + 65} 130 L ${x + 65} 560" stroke="#94a3b8" stroke-width="1.5"/>`;
  }).join("")}
  ${arrow(145, 170, 315, 170, "准备 registered buffer")}
  ${arrow(315, 220, 485, 220, "post RDMA_WRITE WQE")}
  ${arrow(315, 270, 485, 270, "doorbell")}
  ${arrow(485, 320, 485, 355, "fetch WQE / context")}
  ${arrow(485, 390, 315, 390, "PCIe DMA Read")}
  ${arrow(485, 440, 655, 440, "RoCEv2 packet")}
  ${arrow(655, 480, 825, 480, "ECMP / QoS / ECN")}
  ${arrow(825, 520, 995, 520, "PCIe DMA Write")}
  ${arrow(825, 360, 485, 360, "ACK")}
  ${arrow(485, 170, 145, 170, "CQE", "line dash")}
  ${arrow(1165, 520, 995, 520, "poll / consume", "line dash")}
  `,
);

svg(
  "rdma-ddr-to-ddr.svg",
  1080,
  300,
  `
  <text class="title" x="40" y="46">RDMA DDR 到 DDR 数据通路</text>
  ${box(40, 118, 145, 70, ["Host A DDR", "源数据块"], "box green")}
  ${box(260, 118, 145, 70, ["Host A RNIC"], "box blue")}
  ${box(480, 118, 120, 70, ["Leaf"], "box amber")}
  ${box(665, 118, 120, 70, ["Spine"], "box amber")}
  ${box(850, 118, 145, 70, ["Host B RNIC"], "box blue")}
  ${box(850, 220, 145, 55, ["Host B DDR"], "box green")}
  ${arrow(185, 153, 260, 153, "PCIe DMA Read")}
  ${arrow(405, 153, 480, 153, "RoCEv2")}
  ${arrow(600, 153, 665, 153)}
  ${arrow(785, 153, 850, 153, "Ethernet")}
  ${arrow(922, 188, 922, 220, "PCIe DMA Write")}
  `,
);

svg(
  "rocev2-packet-format.svg",
  1160,
  300,
  `
  <text class="title" x="40" y="46">RoCEv2 报文结构</text>
  ${box(40, 115, 145, 76, ["Ethernet", "MAC / Type"], "box")}
  ${box(205, 115, 145, 76, ["IP", "DSCP / ECN"], "box blue")}
  ${box(370, 115, 125, 76, ["UDP", "dst 4791"], "box")}
  ${box(515, 115, 155, 76, ["BTH", "opcode / QPN", "PSN"], "box violet")}
  ${box(690, 115, 170, 76, ["RETH", "remote addr", "rkey / length"], "box amber")}
  ${box(880, 115, 115, 76, ["Payload"], "box green")}
  ${box(1015, 115, 90, 76, ["ICRC"], "box rose")}
  ${arrow(185, 153, 205, 153)}${arrow(350, 153, 370, 153)}${arrow(495, 153, 515, 153)}${arrow(670, 153, 690, 153)}${arrow(860, 153, 880, 153)}${arrow(995, 153, 1015, 153)}
  <text class="tiny" x="775" y="220" text-anchor="middle">RDMA Write 通常携带 RETH，用于描述远端地址、rkey 与长度</text>
  `,
);

svg(
  "rocev2-ecn-cnp.svg",
  960,
  360,
  `
  <text class="title" x="40" y="46">RoCEv2 ECN / CNP 拥塞反馈路径</text>
  ${box(55, 140, 190, 78, ["Sender RNIC", "Reaction Point"], "box blue")}
  ${box(385, 140, 190, 78, ["Switch Queue", "Congestion Point"], "box amber")}
  ${box(715, 140, 190, 78, ["Receiver RNIC", "Notification Point"], "box green")}
  ${box(55, 275, 190, 50, ["Rate Reduction / Pacing"], "box rose")}
  ${arrow(245, 179, 385, 179, "RoCEv2 data")}
  ${arrow(575, 179, 715, 179, "ECN CE mark")}
  <path class="line" d="M 810 218 C 810 300 150 300 150 218"/>
  <text class="tiny" x="480" y="286" text-anchor="middle">CNP 返回发送端，触发降速</text>
  ${arrow(150, 218, 150, 275)}
  `,
);

svg(
  "rdma-bandwidth-bottleneck.svg",
  1320,
  420,
  `
  <text class="title" x="40" y="46">RDMA 链路瓶颈分析</text>
  ${box(35, 120, 130, 76, ["Source DDR", "Memory BW", "NUMA"], "box green")}
  ${box(205, 120, 130, 76, ["PCIe RC", "DMA Read"], "box")}
  ${box(375, 120, 130, 76, ["Sender RNIC", "QP / MTT", "Packetizer"], "box blue")}
  ${box(545, 120, 130, 76, ["NIC Port", "Line Rate", "PPS"], "box")}
  ${box(715, 120, 130, 76, ["Leaf", "Buffer", "ECN / PFC"], "box amber")}
  ${box(885, 120, 130, 76, ["Spine Fabric", "ECMP", "Oversub"], "box amber")}
  ${box(1055, 120, 130, 76, ["Receiver RNIC", "RX / Reorder", "DMA"], "box blue")}
  ${box(1155, 280, 130, 76, ["Target DDR", "Memory BW", "Consume"], "box green")}
  ${arrow(165, 158, 205, 158)}${arrow(335, 158, 375, 158)}${arrow(505, 158, 545, 158)}${arrow(675, 158, 715, 158)}${arrow(845, 158, 885, 158)}${arrow(1015, 158, 1055, 158)}
  ${arrow(1120, 196, 1195, 280, "PCIe DMA Write")}
  <text class="tiny" x="660" y="245" text-anchor="middle">任意一段的带宽、队列、缓存或调度限制，都可能成为端到端吞吐与尾延迟瓶颈</text>
  `,
);

console.log(`Rendered RDMA diagrams to ${outDir}`);

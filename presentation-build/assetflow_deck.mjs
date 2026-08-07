import fs from "node:fs/promises";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const OUT = "F:/CDAC-Know-IT prac/Enterprise-Asset-Management-System/docs/AssetFlow-SaaS-Working-Flow.pptx";
const W = 1280;
const H = 720;
const C = {
  ink: "#16324F",
  ink2: "#284B63",
  teal: "#1E7A8A",
  sky: "#DDECF1",
  gold: "#C7A35C",
  coral: "#D87C64",
  green: "#3F8D6E",
  bg: "#F7F8FA",
  white: "#FFFFFF",
  muted: "#5C6C78",
  line: "#D7E0E7",
  paleGold: "#F5EEDC",
  paleTeal: "#E8F3F4",
  paleCoral: "#FBECE7",
};

function addText(slide, text, x, y, w, h, style = {}) {
  const box = slide.shapes.add({
    geometry: "textbox",
    position: { left: x, top: y, width: w, height: h },
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  box.text = text;
  box.text.style = {
    typeface: "Aptos",
    fontSize: 18,
    color: C.ink,
    ...style,
  };
  return box;
}

function addBox(slide, x, y, w, h, fill, line = C.line, radius = "rounded-xl") {
  return slide.shapes.add({
    geometry: "roundRect",
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { style: "solid", fill: line, width: 1.2 },
    borderRadius: radius,
  });
}

function addCircle(slide, x, y, d, fill, line = fill) {
  return slide.shapes.add({
    geometry: "ellipse",
    position: { left: x, top: y, width: d, height: d },
    fill,
    line: { style: "solid", fill: line, width: 1 },
  });
}

function addTitle(slide, kicker, title, subtitle = "") {
  addText(slide, kicker.toUpperCase(), 72, 38, 420, 24, { fontSize: 13, bold: true, color: C.gold, charSpacing: 1.4 });
  addText(slide, title, 72, 68, 1070, 54, { fontSize: 35, bold: true, color: C.ink });
  if (subtitle) addText(slide, subtitle, 72, 128, 1050, 34, { fontSize: 18, color: C.muted });
}

function addFooter(slide, n, label = "ASSETFLOW · PROJECT REVIEW") {
  slide.shapes.add({ geometry: "line", position: { left: 72, top: 682, width: 1136, height: 0 }, line: { style: "solid", fill: C.line, width: 1 } });
  addText(slide, label, 72, 690, 440, 18, { fontSize: 10, bold: true, color: C.muted, charSpacing: 1.1 });
  addText(slide, String(n).padStart(2, "0"), 1166, 688, 42, 20, { fontSize: 12, bold: true, color: C.gold, alignment: "right" });
}

function addNotes(slide, extra = "") {
  slide.speakerNotes.textFrame.setText(`[Sources]\n- AssetFlow repository: local project README, source code, configuration, and package manifests.\n- User-provided reference images: D:/Downloads/project ppt/*.jpeg (used as visual direction only).\n${extra}`);
  slide.speakerNotes.setVisible(true);
}

function bulletText(items) {
  return items.map((item) => `• ${item}`).join("\n");
}

function addRole(slide, x, y, w, h, title, subtitle, bullets, fill, accent) {
  addBox(slide, x, y, w, h, fill, C.line);
  addText(slide, title, x + 22, y + 20, w - 44, 30, { fontSize: 24, bold: true, color: accent });
  addText(slide, subtitle, x + 22, y + 55, w - 44, 36, { fontSize: 16, color: C.muted });
  addText(slide, bulletText(bullets), x + 22, y + 106, w - 44, h - 122, { fontSize: 17, color: C.ink, breakLine: true, valign: "top" });
}

function addStep(slide, x, y, w, h, n, title, body, fill = C.white) {
  addBox(slide, x, y, w, h, fill, C.line);
  addCircle(slide, x + 18, y + 18, 34, C.ink);
  addText(slide, String(n), x + 18, y + 22, 34, 24, { fontSize: 16, bold: true, color: C.white, alignment: "center" });
  addText(slide, title, x + 66, y + 17, w - 84, 28, { fontSize: 20, bold: true, color: C.ink });
  addText(slide, body, x + 22, y + 58, w - 44, h - 72, { fontSize: 16, color: C.muted });
}

function addNode(slide, x, y, w, h, label, fill, textColor = C.ink, border = C.line) {
  const node = addBox(slide, x, y, w, h, fill, border);
  addText(slide, label, x + 12, y + 13, w - 24, h - 26, { fontSize: 18, bold: true, color: textColor, alignment: "center", valign: "mid" });
  return node;
}

function connect(slide, a, b, fromSide = "right", toSide = "left", color = C.teal, kind = "straight") {
  return slide.shapes.connect(a, b, { kind, fromSide, toSide, line: { style: "solid", fill: color, width: 2 }, head: { type: "arrow", width: "sm", length: "sm" } });
}

function baseSlide(presentation, bg = C.bg) {
  const slide = presentation.slides.add();
  slide.background.fill = bg;
  return slide;
}

async function writeBlob(path, blob) {
  await fs.writeFile(path, new Uint8Array(await blob.arrayBuffer()));
}

async function main() {
  const deck = Presentation.create({ slideSize: { width: W, height: H } });

  // 1. Title
  {
    const s = baseSlide(deck, C.ink);
    addText(s, "KNOW-IT", 1010, 42, 170, 24, { fontSize: 16, bold: true, color: C.gold, alignment: "right", charSpacing: 2 });
    addText(s, "ASSETFLOW", 72, 88, 520, 32, { fontSize: 18, bold: true, color: C.gold, charSpacing: 2.2 });
    addText(s, "Enterprise asset\nmanagement, in motion.", 72, 148, 710, 150, { fontSize: 56, bold: true, color: C.white, breakLine: true });
    addText(s, "A SaaS working flow from company onboarding to asset lifecycle intelligence", 76, 330, 690, 48, { fontSize: 23, color: "#D8E7EC" });
    addBox(s, 78, 430, 610, 116, "#21445F", "#3B667B");
    addText(s, "Project review deck", 108, 458, 250, 24, { fontSize: 17, bold: true, color: C.gold });
    addText(s, "Working flow · architecture · roles · delivery approach", 108, 489, 500, 30, { fontSize: 18, color: C.white });
    addCircle(s, 888, 214, 176, C.teal, C.teal);
    addCircle(s, 942, 268, 68, C.ink, C.gold);
    addText(s, "AF", 954, 285, 44, 30, { fontSize: 23, bold: true, color: C.white, alignment: "center" });
    addText(s, "ONE PLATFORM\nMANY WORKSPACES", 836, 424, 280, 54, { fontSize: 17, bold: true, color: C.gold, alignment: "center", breakLine: true });
    addText(s, "08 / 2026", 72, 650, 160, 20, { fontSize: 12, color: "#AFC4CF", charSpacing: 1.2 });
    addNotes(s, "Opening: AssetFlow connects the people, assets, and decisions that keep an enterprise moving.");
  }

  // 2. Overview
  {
    const s = baseSlide(deck);
    addTitle(s, "01 · Project overview", "AssetFlow turns asset tracking into an accountable operating system", "The platform connects procurement, people, assets, maintenance, and insight in one tenant-aware workflow.");
    addBox(s, 72, 194, 470, 386, C.white, C.line);
    addText(s, "The business need", 104, 224, 370, 28, { fontSize: 24, bold: true, color: C.ink });
    addText(s, "Enterprise assets are easy to lose in spreadsheets, inboxes, and disconnected approvals.", 104, 266, 380, 70, { fontSize: 21, color: C.ink2 });
    addText(s, "AssetFlow creates a shared system of record with role-based access, auditability, and lifecycle history.", 104, 372, 370, 96, { fontSize: 18, color: C.muted });
    addText(s, "Target users", 104, 500, 160, 24, { fontSize: 14, bold: true, color: C.gold, charSpacing: 1.2 });
    addText(s, "Super Admin  ·  Company Admin  ·  Employee", 104, 526, 360, 28, { fontSize: 17, bold: true, color: C.teal });
    addText(s, "The platform promise", 620, 204, 420, 28, { fontSize: 24, bold: true, color: C.ink });
    const items = [
      ["01", "One workspace", "A single source of truth for the complete asset journey."],
      ["02", "Clear ownership", "Every action is scoped to a role, company, and audit trail."],
      ["03", "Actionable insight", "Reports and AI answers turn operational data into decisions."],
    ];
    items.forEach(([n, t, b], i) => {
      const y = 264 + i * 104;
      addCircle(s, 620, y + 6, 42, i === 1 ? C.gold : C.teal);
      addText(s, n, 620, y + 16, 42, 20, { fontSize: 13, bold: true, color: C.white, alignment: "center" });
      addText(s, t, 686, y, 360, 26, { fontSize: 22, bold: true, color: C.ink });
      addText(s, b, 686, y + 31, 420, 44, { fontSize: 17, color: C.muted });
    });
    addFooter(s, 2);
    addNotes(s);
  }

  // 3. Users
  {
    const s = baseSlide(deck);
    addTitle(s, "02 · Users and use cases", "Each role gets the control and context it needs", "Role-based dashboards keep the platform simple for employees and powerful for operations.");
    addRole(s, 72, 204, 344, 364, "Super Admin", "Platform control", ["Register and manage companies", "Activate / deactivate tenants", "Monitor platform metrics", "Review audit, AI, and notifications"], C.paleGold, C.gold);
    addRole(s, 468, 204, 344, 364, "Company Admin", "Workspace operations", ["Manage people and departments", "Procure, create, and allocate assets", "Review requests and maintenance", "Run reports and assist the team"], C.paleTeal, C.teal);
    addRole(s, 864, 204, 344, 364, "Employee", "Personal workspace", ["View assigned assets", "Request additional equipment", "Report maintenance issues", "Track notifications and history"], C.paleCoral, C.coral);
    addFooter(s, 3);
    addNotes(s);
  }

  // 4. Architecture
  {
    const s = baseSlide(deck);
    addTitle(s, "03 · Project architecture", "A React front end routes work through a service-oriented middle tier", "The repository contains Spring Boot services, .NET services, an Express backend, a gateway, and shared MySQL persistence.");
    const front = addNode(s, 84, 265, 210, 92, "React UI\nBootstrap · Axios", C.white, C.ink, C.teal);
    const gate = addNode(s, 364, 265, 190, 92, "API Gateway\nlocalhost:8080", C.paleGold, C.ink, C.gold);
    const disc = addNode(s, 364, 422, 190, 82, "Discovery\nlocalhost:8761", C.paleGold, C.ink, C.gold);
    const spring = addNode(s, 652, 194, 224, 90, "Spring Boot\nAuth · Company · Asset", C.paleTeal, C.ink, C.teal);
    const dotnet = addNode(s, 652, 322, 224, 90, ".NET services\nAsset · Company", C.paleTeal, C.ink, C.teal);
    const express = addNode(s, 652, 450, 224, 90, "Express backend\nREST + MySQL", C.paleTeal, C.ink, C.teal);
    const db = addNode(s, 1000, 318, 184, 98, "MySQL\nTenant data", C.ink, C.white, C.ink);
    const ai = addNode(s, 936, 486, 248, 72, "Gemini AI · Email · Reports", C.paleCoral, C.ink, C.coral);
    connect(s, front, gate, "right", "left");
    connect(s, gate, spring, "right", "left", C.teal, "elbow");
    connect(s, gate, dotnet, "right", "left", C.teal, "elbow");
    connect(s, gate, express, "right", "left", C.teal, "elbow");
    connect(s, gate, disc, "bottom", "top", C.gold, "straight");
    connect(s, spring, db, "right", "left", C.teal, "elbow");
    connect(s, dotnet, db, "right", "left", C.teal, "elbow");
    connect(s, express, db, "right", "left", C.teal, "elbow");
    connect(s, spring, ai, "right", "left", C.coral, "elbow");
    addText(s, "The architectural choice: keep the user experience unified while allowing independent services to evolve behind the gateway.", 84, 594, 1092, 38, { fontSize: 19, color: C.ink2, bold: true, alignment: "center" });
    addFooter(s, 4);
    addNotes(s);
  }

  // 5. End-to-end flow
  {
    const s = baseSlide(deck);
    addTitle(s, "04 · Working flow", "The operating cycle begins with a tenant and ends with insight", "AssetFlow carries each business event forward so the next action has the right context.");
    const steps = [
      ["Platform", "Create company", "Tenant, admin, role, welcome event"],
      ["Workspace", "Set up operations", "Departments, people, vendors, locations"],
      ["Procurement", "Create asset", "PO, category, serial, warranty"],
      ["Allocation", "Assign equipment", "Employee, date, status, audit"],
      ["Operations", "Request or maintain", "Approvals, repairs, notifications"],
      ["Insight", "Report and ask", "Dashboards, exports, AI assistant"],
    ];
    const xs = [72, 265, 458, 651, 844, 1037];
    const nodes = [];
    steps.forEach(([k, t, b], i) => {
      const box = addBox(s, xs[i], 264, 166, 188, i % 2 === 0 ? C.white : C.paleTeal, i % 2 === 0 ? C.line : C.teal);
      nodes.push(box);
      addText(s, k.toUpperCase(), xs[i] + 18, 286, 130, 20, { fontSize: 12, bold: true, color: i % 2 === 0 ? C.gold : C.teal, charSpacing: 1.1 });
      addText(s, t, xs[i] + 18, 324, 132, 52, { fontSize: 22, bold: true, color: C.ink });
      addText(s, b, xs[i] + 18, 398, 132, 40, { fontSize: 15, color: C.muted });
      if (i < nodes.length - 1) connect(s, nodes[i], nodes[i + 1], "right", "left", C.gold, "straight");
    });
    addText(s, "Every transition can generate a notification and an audit entry — making the workflow visible, not implicit.", 142, 520, 996, 42, { fontSize: 22, bold: true, color: C.ink2, alignment: "center" });
    addFooter(s, 5);
    addNotes(s);
  }

  // 6. Asset lifecycle
  {
    const s = baseSlide(deck);
    addTitle(s, "05 · Asset lifecycle", "The asset record stays useful long after purchase", "A single asset can move through availability, assignment, repair, transfer, and return without losing its history.");
    const y = 310;
    const stages = [
      ["Purchase", "PO + vendor", C.paleGold, C.gold],
      ["Available", "Location + warranty", C.paleTeal, C.teal],
      ["Allocated", "Employee + date", C.paleCoral, C.coral],
      ["Maintenance", "Issue + repair", C.paleGold, C.gold],
      ["Returned", "Ready again", C.paleTeal, C.green],
    ];
    const nodes = [];
    stages.forEach(([t, b, fill, accent], i) => {
      const x = 86 + i * 230;
      const node = addNode(s, x, y, 176, 98, t, fill, C.ink, accent);
      nodes.push(node);
      addText(s, b, x, y + 116, 176, 24, { fontSize: 15, color: C.muted, alignment: "center" });
      if (i < nodes.length - 1) connect(s, node, nodes[i + 1], "right", "left", accent, "straight");
    });
    addBox(s, 124, 176, 1030, 72, C.white, C.line);
    addText(s, "Example: Dell Latitude 7440", 158, 196, 330, 26, { fontSize: 22, bold: true, color: C.ink });
    addText(s, "Laptop · Dell · PO-001 · Pune Office · warranty tracked", 520, 198, 560, 24, { fontSize: 18, color: C.muted });
    addBox(s, 166, 512, 936, 70, C.ink, C.ink);
    addText(s, "Status, owner, location, history, and accountability travel together.", 204, 535, 860, 24, { fontSize: 20, bold: true, color: C.white, alignment: "center" });
    addFooter(s, 6);
    addNotes(s);
  }

  // 7. Multi-tenant security
  {
    const s = baseSlide(deck);
    addTitle(s, "06 · Multi-tenant security", "One platform, isolated workspaces", "The company scope is carried through authentication, service access, and business records so users only see their own organization.");
    const superNode = addNode(s, 502, 176, 276, 76, "SUPER ADMIN\nplatform control", C.ink, C.white, C.ink);
    const ca = addNode(s, 122, 366, 272, 82, "COMPANY A\nadmin + employees", C.paleTeal, C.ink, C.teal);
    const cb = addNode(s, 504, 366, 272, 82, "COMPANY B\nadmin + employees", C.paleGold, C.ink, C.gold);
    const cc = addNode(s, 886, 366, 272, 82, "COMPANY C\nadmin + employees", C.paleCoral, C.ink, C.coral);
    connect(s, superNode, ca, "bottom", "top", C.teal, "elbow");
    connect(s, superNode, cb, "bottom", "top", C.gold, "straight");
    connect(s, superNode, cc, "bottom", "top", C.coral, "elbow");
    addText(s, "Tenant boundary", 522, 280, 236, 22, { fontSize: 14, bold: true, color: C.gold, alignment: "center", charSpacing: 1.2 });
    addText(s, "JWT identity", 124, 504, 180, 24, { fontSize: 18, bold: true, color: C.ink });
    addText(s, "Who is the user?", 124, 532, 180, 24, { fontSize: 16, color: C.muted });
    addText(s, "Company scope", 412, 504, 180, 24, { fontSize: 18, bold: true, color: C.ink });
    addText(s, "Which workspace?", 412, 532, 180, 24, { fontSize: 16, color: C.muted });
    addText(s, "Audit trail", 700, 504, 180, 24, { fontSize: 18, bold: true, color: C.ink });
    addText(s, "What changed?", 700, 532, 180, 24, { fontSize: 16, color: C.muted });
    addText(s, "Role routing", 988, 504, 180, 24, { fontSize: 18, bold: true, color: C.ink });
    addText(s, "What can they do?", 988, 532, 180, 24, { fontSize: 16, color: C.muted });
    addFooter(s, 7);
    addNotes(s);
  }

  // 8. Contribution and method
  {
    const s = baseSlide(deck);
    addTitle(s, "07 · Contribution and methodology", "The project was built as a coordinated, full-stack delivery", "The repository shows a working combination of frontend experience, service design, database integration, security, and collaboration practices.");
    addText(s, "Contribution areas", 72, 208, 410, 28, { fontSize: 24, bold: true, color: C.ink });
    const contrib = [
      ["Experience", "React pages, role-based navigation, dashboards, reports"],
      ["Services", "Spring Boot microservices, .NET services, Express APIs"],
      ["Controls", "JWT authentication, tenant scope, audit and notification flows"],
      ["Intelligence", "Gemini assistant, search, exports, operational summaries"],
    ];
    contrib.forEach(([t, b], i) => {
      const y = 260 + i * 75;
      addCircle(s, 76, y + 3, 26, i === 1 ? C.gold : C.teal);
      addText(s, String(i + 1), 76, y + 9, 26, 16, { fontSize: 12, bold: true, color: C.white, alignment: "center" });
      addText(s, t, 120, y, 156, 24, { fontSize: 19, bold: true, color: C.ink });
      addText(s, b, 290, y, 330, 40, { fontSize: 16, color: C.muted });
    });
    addBox(s, 700, 204, 478, 330, C.ink, C.ink);
    addText(s, "Delivery loop", 736, 236, 390, 30, { fontSize: 24, bold: true, color: C.gold });
    const loop = ["Discover the business flow", "Divide into services and roles", "Build in small vertical slices", "Verify APIs, data, and UI", "Commit, review, and integrate"];
    loop.forEach((t, i) => {
      const y = 294 + i * 42;
      addCircle(s, 738, y + 2, 22, C.teal);
      addText(s, String(i + 1), 738, y + 7, 22, 14, { fontSize: 11, bold: true, color: C.white, alignment: "center" });
      addText(s, t, 778, y, 350, 24, { fontSize: 18, color: C.white });
    });
    addText(s, "A phased, Git-backed workflow keeps a complex platform understandable.", 738, 494, 390, 32, { fontSize: 16, color: "#CDE1E7", italic: true });
    addFooter(s, 8);
    addNotes(s);
  }

  // 9. Testing
  {
    const s = baseSlide(deck);
    addTitle(s, "08 · Testing approach", "Quality is checked at the boundaries where risk enters", "The testing approach follows the architecture: verify data, APIs, service startup, and the user journey separately, then together.");
    const layers = [
      ["01", "Data layer", "Schema scripts, constraints, tenant-scoped queries", C.paleGold, C.gold],
      ["02", "Service layer", "Spring Boot context tests and backend startup checks", C.paleTeal, C.teal],
      ["03", "API layer", "REST endpoint checks with valid and invalid role scopes", C.paleCoral, C.coral],
      ["04", "UI layer", "Manual and end-to-end checks for role flows and exports", C.paleTeal, C.green],
    ];
    layers.forEach(([n, t, b, fill, accent], i) => {
      const x = 72 + i * 286;
      addBox(s, x, 246, 250, 238, fill, accent);
      addText(s, n, x + 22, 270, 46, 24, { fontSize: 16, bold: true, color: accent });
      addText(s, t, x + 22, 314, 198, 52, { fontSize: 24, bold: true, color: C.ink });
      addText(s, b, x + 22, 390, 202, 60, { fontSize: 17, color: C.muted });
    });
    addText(s, "Test the happy path — then test the boundary: wrong role, wrong tenant, missing dependency, and unavailable integration.", 126, 554, 1028, 42, { fontSize: 22, bold: true, color: C.ink2, alignment: "center" });
    addFooter(s, 9);
    addNotes(s);
  }

  // 10. Future + lessons
  {
    const s = baseSlide(deck);
    addTitle(s, "09 · Future extensions and lessons", "The foundation is ready for deeper automation", "AssetFlow already closes the core lifecycle; the next step is to make the platform more predictive, observable, and self-service.");
    addText(s, "Future extensions", 72, 204, 420, 28, { fontSize: 24, bold: true, color: C.ink });
    const future = [
      ["Predictive maintenance", "Use repair history and usage signals to surface risk earlier."],
      ["Inventory intelligence", "Forecast demand and optimize procurement across tenants."],
      ["Operational integrations", "Connect email, identity, finance, and device management."],
    ];
    future.forEach(([t, b], i) => {
      const y = 258 + i * 86;
      addBox(s, 72, y, 514, 64, i === 1 ? C.paleGold : C.white, C.line);
      addText(s, t, 94, y + 12, 205, 22, { fontSize: 18, bold: true, color: C.ink });
      addText(s, b, 310, y + 10, 250, 42, { fontSize: 15, color: C.muted });
    });
    addBox(s, 672, 204, 506, 304, C.ink, C.ink);
    addText(s, "Lessons learned", 710, 236, 420, 30, { fontSize: 24, bold: true, color: C.gold });
    addText(s, bulletText(["Complexity becomes manageable when the business flow is explicit.", "Technology boundaries matter less when contracts are clear.", "Tenant isolation must be designed into every read and write.", "Auditability and failure handling are product features, not afterthoughts."]), 710, 288, 420, 166, { fontSize: 18, color: C.white });
    addFooter(s, 10);
    addNotes(s);
  }

  // 11. Closing
  {
    const s = baseSlide(deck, C.ink);
    addText(s, "ASSETFLOW", 72, 72, 420, 28, { fontSize: 18, bold: true, color: C.gold, charSpacing: 2.2 });
    addText(s, "From purchase\nto proof of control.", 72, 152, 690, 122, { fontSize: 54, bold: true, color: C.white });
    addText(s, "A secure, multi-tenant asset lifecycle platform that makes every item, action, and decision accountable.", 76, 320, 670, 78, { fontSize: 24, color: "#D8E7EC" });
    const close = ["People", "Assets", "History", "Insight"];
    close.forEach((t, i) => {
      const x = 800 + (i % 2) * 178;
      const y = 186 + Math.floor(i / 2) * 112;
      addBox(s, x, y, 150, 72, i === 2 ? C.gold : "#21445F", i === 2 ? C.gold : "#3B667B");
      addText(s, t, x, y + 24, 150, 24, { fontSize: 20, bold: true, color: C.white, alignment: "center" });
    });
    addText(s, "Thank you", 76, 612, 200, 24, { fontSize: 17, bold: true, color: C.gold });
    addText(s, "Questions · discussion · next step", 76, 642, 360, 22, { fontSize: 16, color: "#AFC4CF" });
    addNotes(s, "Close: the workflow is the product — AssetFlow makes it visible, secure, and repeatable.");
  }

  await fs.mkdir("F:/CDAC-Know-IT prac/Enterprise-Asset-Management-System/docs", { recursive: true });
  const pptx = await PresentationFile.exportPptx(deck);
  await pptx.save(OUT);

  const previewDir = "F:/CDAC-Know-IT prac/Enterprise-Asset-Management-System/presentation-build/rendered";
  await fs.mkdir(previewDir, { recursive: true });
  for (const [index, slide] of deck.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    await writeBlob(`${previewDir}/${stem}.png`, await deck.export({ slide, format: "png", scale: 1 }));
    await fs.writeFile(`${previewDir}/${stem}.layout.json`, await (await slide.export({ format: "layout" })).text());
  }
  await writeBlob(`${previewDir}/deck-montage.webp`, await deck.export({ format: "webp", montage: true, scale: 1 }));
  console.log(`Wrote ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

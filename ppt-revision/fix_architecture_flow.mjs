import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const input = "F:/CDAC-Know-IT prac/Enterprise-Asset-Management-System/docs/AssetFlow_Presentation_Refined.pptx";
const output = input;
const deck = await PresentationFile.importPptx(await FileBlob.load(input));
const slide = deck.slides.items[3];

function textShape(oldText) {
  const shape = slide.shapes.items.find((candidate) => String(candidate.text) === oldText);
  if (!shape) throw new Error(`Missing architecture label: ${oldText}`);
  return shape;
}

const discoveryLabel = slide.shapes.items.find((candidate) => ["Discovery\nService", "Auth +\nDiscovery"].includes(String(candidate.text)));
if (!discoveryLabel) throw new Error("Missing Discovery Service label");
if (String(discoveryLabel.text) === "Auth +\nDiscovery") discoveryLabel.text.replace("Auth +\nDiscovery", "Discovery\nService");
const businessLabel = slide.shapes.items.find((candidate) => ["Business\nServices", ".NET + Spring\nServices"].includes(String(candidate.text)));
if (!businessLabel) throw new Error("Missing Business Services label");
if (String(businessLabel.text) === ".NET + Spring\nServices") businessLabel.text.replace(".NET + Spring\nServices", "Business\nServices");

// Hide the five loose template lines and replace them with attached connectors.
for (const id of ["sh/ql8jytsj", "sh/doj29oba", "sh/sna103ap", "sh/3ihk3et8", "sh/ih8ju9sn"]) {
  deck.resolve(id).line.width = 0;
}

const frontEnd = deck.resolve("sh/kbm987y5");
const gateway = deck.resolve("sh/i94r6xgz");
const discovery = deck.resolve("sh/w72947yt");
const business = deck.resolve("sh/a5kr2xg3");
const database = deck.resolve("sh/g36tgryd");
const notifications = deck.resolve("sh/p0batw72");
const flow = { line: { style: "solid", fill: "#6D63FF", width: 2 }, tail: { type: "arrow", width: "sm", length: "sm" } };

slide.shapes.connect(frontEnd, gateway, { ...flow, kind: "straight", fromSide: "right", toSide: "left" });
slide.shapes.connect(gateway, discovery, { ...flow, kind: "elbow", fromSide: "right", toSide: "left" });
slide.shapes.connect(discovery, business, { ...flow, kind: "straight", fromSide: "bottom", toSide: "top" });
slide.shapes.connect(business, database, { ...flow, kind: "elbow", fromSide: "right", toSide: "left" });
slide.shapes.connect(business, notifications, { ...flow, kind: "straight", fromSide: "right", toSide: "left" });

const note = "[Sources]\n- AssetFlow_Presentation_Simple.pptx (source template and existing content).\n- architecture diagram.pptx (architecture and workflow reference).\n- Local AssetFlow project source code (implementation reference).";
slide.speakerNotes.textFrame.setText(note);

const pptx = await PresentationFile.exportPptx(deck);
await pptx.save(output);
console.log(output);

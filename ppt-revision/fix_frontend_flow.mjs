import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const input = "F:/CDAC-Know-IT prac/Enterprise-Asset-Management-System/docs/AssetFlow_Presentation_Refined.pptx";
const deck = await PresentationFile.importPptx(await FileBlob.load(input));
const slide = deck.slides.items[5];

// Keep the inherited cards, but replace the small non-directional rules with an explicit user-flow path.
for (const id of ["sh/oryp8fah", "sh/v2tcn650", "sh/j6dcr65c", "sh/cbe5g3ih"]) {
  deck.resolve(id).line.width = 0;
}

const form = deck.resolve("sh/98rqt4r6");
const validate = deck.resolve("sh/pc76hkr2");
const gateway = deck.resolve("sh/u1kbu1ov");
const service = deck.resolve("sh/i54bylor");
const flow = {
  kind: "straight",
  fromSide: "right",
  toSide: "left",
  line: { style: "solid", fill: "#6D63FF", width: 2 },
  tail: { type: "arrow", width: "sm", length: "sm" },
};
slide.shapes.connect(form, validate, flow);
slide.shapes.connect(validate, gateway, flow);
slide.shapes.connect(gateway, service, flow);

const note = "[Sources]\n- AssetFlow_Presentation_Simple.pptx (source template and existing content).\n- architecture diagram.pptx (frontend workflow reference).\n- Local AssetFlow project source code (implementation reference).";
slide.speakerNotes.textFrame.setText(note);

const pptx = await PresentationFile.exportPptx(deck);
await pptx.save(input);
console.log(input);

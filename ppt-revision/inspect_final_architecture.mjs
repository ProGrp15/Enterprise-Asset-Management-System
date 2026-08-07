import fs from "node:fs/promises";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const source = "F:/CDAC-Know-IT prac/Enterprise-Asset-Management-System/docs/AssetFlow_Presentation_Refined.pptx";
const deck = await PresentationFile.importPptx(await FileBlob.load(source));
const slide = deck.slides.items[3];
const layout = await slide.export({ format: "layout" });
await fs.writeFile("F:/CDAC-Know-IT prac/Enterprise-Asset-Management-System/ppt-revision/architecture-final.layout.json", await layout.text());
const inspect = await deck.inspect({ kind: "slide,textbox,shape", maxChars: 12000 });
await fs.writeFile("F:/CDAC-Know-IT prac/Enterprise-Asset-Management-System/ppt-revision/architecture-final.inspect.ndjson", inspect.ndjson);

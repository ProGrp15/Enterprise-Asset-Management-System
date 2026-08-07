import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const decks = [
  { name: "assetflow", file: "D:/Downloads/AssetFlow_Presentation_Simple.pptx" },
  { name: "architecture", file: "D:/Downloads/architecture diagram.pptx" },
];

async function writeBlob(file, blob) {
  await fs.writeFile(file, new Uint8Array(await blob.arrayBuffer()));
}

for (const item of decks) {
  const output = path.resolve(item.name + "-inspect");
  await fs.mkdir(output, { recursive: true });
  const presentation = await PresentationFile.importPptx(await FileBlob.load(item.file));
  const snapshot = await presentation.inspect({ kind: "slide,textbox,shape,image,table,chart,notes,layout", maxChars: 50000 });
  await fs.writeFile(path.join(output, "inspect.ndjson"), snapshot.ndjson, "utf8");
  for (const [index, slide] of presentation.slides.items.entries()) {
    await writeBlob(path.join(output, `slide-${index + 1}.png`), await presentation.export({ slide, format: "png", scale: 1 }));
    await fs.writeFile(path.join(output, `slide-${index + 1}.layout.json`), await (await slide.export({ format: "layout" })).text(), "utf8");
  }
  await writeBlob(path.join(output, "montage.webp"), await presentation.export({ format: "webp", montage: true, scale: 1 }));
  console.log(`${item.name}: ${presentation.slides.items.length} slides`);
}

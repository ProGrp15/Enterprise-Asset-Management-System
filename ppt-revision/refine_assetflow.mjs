import fs from "node:fs/promises";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const input = "F:/CDAC-Know-IT prac/Enterprise-Asset-Management-System/ppt-revision/AssetFlow_starter.pptx";
const inspectPath = "F:/CDAC-Know-IT prac/Enterprise-Asset-Management-System/ppt-revision/AssetFlow_starter.pptx.inspect.ndjson";
const output = "F:/CDAC-Know-IT prac/Enterprise-Asset-Management-System/docs/AssetFlow_Presentation_Refined.pptx";

const replacements = new Map([
  [2, [
    ["Asset tracking should be\nclear, secure, and easy.", "The problem and the solution"],
    ["Asset records\nare scattered", "Asset records are scattered."],
    ["Approvals are\nhard to trace", "Approvals are hard to follow."],
    ["Employees need a\nsimple request flow", "Employees need an easy request flow."],
    ["One secure workspace for assets, people, requests, maintenance, and history.", "One secure workspace for assets, people, requests, maintenance, and history."]
  ]],
  [3, [
    ["Each role sees only\nwhat it needs.", "Each role sees only what it needs."],
    ["Creates companies.\nMonitors the platform.\nControls tenant access.", "Creates companies.\nMonitors the platform.\nControls tenant access."],
    ["Manages one company.\nSets up people and assets.\nApproves requests and lifecycle actions.", "Manages one company.\nSets up people and assets.\nApproves requests and lifecycle actions."],
    ["Views assigned assets.\nRequests or returns equipment.\nReports maintenance issues.", "Views assigned assets.\nRequests or returns equipment.\nReports maintenance issues."]
  ]],
  [4, [
    ["A clear path from user action to data", "A clear path from user action to data"],
    ["React UI", "React\nFront End"],
    ["API Gateway", "API\nGateway"],
    ["Auth + Eureka", "Auth +\nDiscovery"],
    ["Company + Asset", ".NET + Spring\nBusiness Services"],
    ["MySQL", "MySQL\nDatabase"],
    ["Notifications", "Notifications\n+ AI"],
    ["JWT security · Tenant isolation · Audit trail", "JWT security · Tenant isolation · Audit trail"]
  ]],
  [5, [
    ["The asset lifecycle in one flow", "The asset lifecycle in one flow"],
    ["Company", "Company\nsetup"],
    ["People", "People\n& roles"],
    ["Purchase", "Purchase\norder"],
    ["Asset", "Create\nasset"],
    ["Allocation", "Allocate\nasset"],
    ["Maintenance", "Maintain /\ntransfer"],
    ["Return", "Return &\nreuse"],
    ["Each step updates status, creates a notification, and records an audit log.", "Each step updates status, creates a notification, and records an audit log."]
  ]],
  [6, [
    ["A request follows one clear path", "A request follows one clear path"],
    ["Form", "1. User action"],
    ["Employee submits a request", "A user submits a form."],
    ["Validation", "2. Validate"],
    ["React checks the input", "React checks the input."],
    ["API call", "3. API Gateway"],
    ["Request goes to the correct service", "The request is routed to the correct service."],
    ["Database", "4. Service + DB"],
    ["Service saves data and returns a result", "The service updates MySQL and returns a result."],
    ["The page refreshes and shows a clear success or error message.", "The page refreshes and shows a clear success or error message."]
  ]],
  [7, [
    ["My .NET contribution", "My .NET contribution"],
    ["Built Asset and Company services in .NET.", "Built Asset and Company services in .NET."],
    ["Added CRUD APIs for core business data.", "Added CRUD APIs for core business data."],
    ["Implemented allocation, transfer, return, repair, and request flows.", "Implemented allocation, transfer, return, repair, and request flows."],
    ["Added tenant checks, audit logs, and notifications.", "Added tenant checks, audit logs, and notifications."],
    ["Connected services to MySQL with Entity Framework.", "Connected services to MySQL with Entity Framework."]
  ]],
  [8, [
    ["We built the project in three simple phases", "We built the project in three simple phases"],
    ["PHASE 1\nArchitecture\nDatabase\nSecurity", "PHASE 1\nArchitecture\nDatabase\nSecurity"],
    ["PHASE 2\nCompanies\nEmployees\nSetup data", "PHASE 2\nCompanies\nEmployees\nSetup data"],
    ["PHASE 3\nAssets\nLifecycle\nReports and testing", "PHASE 3\nAssets\nLifecycle\nReports and testing"],
    ["Plan → Build → Test → Improve", "Plan → Build → Test → Improve"]
  ]],
  [9, [
    ["We tested the flow from database to browser", "We tested the flow from database to browser"],
    ["BUILD\nService startup\nFrontend build\nLint checks", "BUILD\nService startup\nFrontend build\nLint checks"],
    ["API\nLogin\nCRUD APIs\nTenant access", "API\nLogin\nCRUD APIs\nTenant access"],
    ["BROWSER\nAdmin flows\nEmployee flows\nDashboard", "BROWSER\nAdmin flows\nEmployee flows\nDashboard"],
    ["LIFECYCLE\nAllocate\nTransfer\nReturn", "LIFECYCLE\nAllocate\nTransfer\nReturn"],
    ["Core business flows were verified end to end.", "Core business flows were verified end to end."]
  ]],
  [10, [
    ["Next improvements for production use", "Next improvements for production use"],
    ["Docker and CI/CD deployment.", "Docker and CI/CD deployment."],
    ["Monitoring, backups, and alerts.", "Monitoring, backups, and alerts."],
    ["Performance testing with more users.", "Performance testing with more users."],
    ["Live Gemini responses with a secured API key.", "Live Gemini responses with a secured API key."],
    ["Scheduled reports and email reminders.", "Scheduled reports and email reminders."]
  ]],
  [11, [
    ["Key lessons from the project", "Key lessons from the project"],
    ["Clear API contracts keep services connected.", "Clear API contracts keep services connected."],
    ["Security belongs in every backend service.", "Security belongs in every backend service."],
    ["A feature is complete only when the full flow works.", "A feature is complete only when the full flow works."],
    ["Automated tests make changes safer.", "Automated tests make changes safer."],
    ["Teamwork and debugging are essential.", "Teamwork and debugging are essential."]
  ]],
  [12, [
    ["AssetFlow keeps every asset visible, secure, and accountable.", "AssetFlow keeps every asset visible, secure, and accountable."],
    ["Questions?", "Questions?"]
  ]]
]);

const corrected = new Map([
  [2, [["The problem and our solution", "The problem and the solution"], ["Asset records are spread across files and emails.", "Asset records are scattered."], ["Approvals are difficult to track.", "Approvals are hard to follow."], ["Employees cannot easily see or request assets.", "Employees need an easy request flow."], ["AssetFlow keeps company assets, people, requests, maintenance, and history in one secure workspace.", "One secure workspace for assets, people, requests, maintenance, and history."]]],
  [3, [["Each user gets the right level of access", "Each role sees only what it needs."], ["Creates companies.\nManages the platform.\nCannot manage company assets.", "Creates companies.\nMonitors the platform.\nControls tenant access."], ["Manages one company.\nCreates employees and assets.\nApproves lifecycle actions.", "Manages one company.\nSets up people and assets.\nApproves requests and lifecycle actions."], ["Sees own assets.\nRequests or returns assets.\nReports maintenance issues.", "Views assigned assets.\nRequests or returns equipment.\nReports maintenance issues."]]],
  [4, [["How the main parts work together", "A clear path from user action to data"], ["React UI", "React\nFront End"], ["API Gateway", "API\nGateway"], ["Auth + Eureka", "Auth +\nDiscovery"], ["Company + Asset", ".NET + Spring\nServices"], ["MySQL", "MySQL\nDatabase"], ["Notifications", "Notifications\n+ AI"], ["JWT security • Service discovery • Tenant isolation", "JWT security · Tenant isolation · Audit trail"]]],
  [5, [["The asset moves through clear steps", "The asset lifecycle in one flow"], ["Company", "Company\nsetup"], ["People", "People\n& roles"], ["Purchase", "Purchase\norder"], ["Asset", "Create\nasset"], ["Allocation", "Allocate\nasset"], ["Maintenance", "Maintain /\ntransfer"], ["Return", "Return &\nreuse"], ["Every important action updates the status, sends a notification, and creates an audit record.", "Each step updates status, creates a notification, and records an audit log."]]],
  [6, [["What happens when a user clicks Save", "A request follows one clear path"], ["1. Form", "1. User action"], ["User enters data.", "A user submits a form."], ["2. Validation", "2. Validate"], ["The form checks the data.", "React checks the input."], ["3. API call", "3. API Gateway"], ["Axios sends the request.", "The request is routed to the correct service."], ["4. Database", "4. Service + DB"], ["The service saves and returns data.", "The service updates MySQL and returns a result."], ["The table refreshes and the user sees the result.", "The page refreshes and shows a clear success or error message."]]],
  [7, [["What I worked on", "My .NET contribution"], ["Connected the React frontend to the Spring Boot services.", "Built Asset and Company services in .NET."], ["Built employee and asset CRUD screens.", "Added CRUD APIs for core business data."], ["Connected allocation, request, maintenance, transfer, and return flows.", "Implemented allocation, transfer, return, repair, and request flows."], ["Added validation, notifications, audit logs, and tenant checks.", "Added tenant checks, audit logs, and notifications."], ["Tested the complete workflow in the browser.", "Connected services to MySQL with Entity Framework."]]],
  [8, [["We built and checked one working part at a time", "We built the project in three simple phases"], ["Architecture\nDatabase\nLogin and security", "Architecture\nDatabase\nSecurity"], ["Companies\nEmployees\nBasic setup", "Companies\nEmployees\nSetup data"], ["Assets\nLifecycle\nReports and testing", "Assets\nLifecycle\nReports and testing"], ["Plan → Build → Run → Fix → Test again", "Plan → Build → Test → Improve"]]],
  [9, [["We tested the project at different levels", "We tested the flow from database to browser"], ["Build tests", "BUILD"], ["Maven\nFrontend build\nESLint", "Service startup\nFrontend build\nLint checks"], ["API tests", "API"], ["Login\nCRUD\nTenant isolation", "Login\nCRUD APIs\nTenant access"], ["Browser tests", "BROWSER"], ["Admin login\nEmployee login\nDashboard", "Admin flows\nEmployee flows\nDashboard"], ["Lifecycle", "LIFECYCLE"], ["Allocate\nTransfer\nReturn", "Allocate\nTransfer\nReturn"], ["Result: 9 out of 9 business tests passed.", "Core business flows were verified end to end."]]],
  [10, [["Useful improvements for a real deployment", "Next improvements for production use"], ["Deploy with Docker and CI/CD.", "Docker and CI/CD deployment."], ["Add monitoring, backups, and alerts.", "Monitoring, backups, and alerts."], ["Test with large data and many users.", "Performance testing with more users."], ["Enable live Gemini answers with an API key.", "Live Gemini responses with a secured API key."], ["Add more report formats and scheduled emails.", "Scheduled reports and email reminders."]]],
  [11, [["What this project taught us", "Key lessons from the project"], ["A large system needs clear API contracts.", "Clear API contracts keep services connected."], ["Security must be checked in the backend.", "Security belongs in every backend service."], ["A working page is not enough; the full workflow must work.", "A feature is complete only when the full flow works."], ["Automated tests save time when features change.", "Automated tests make changes safer."], ["Team collaboration and debugging are important skills.", "Teamwork and debugging are essential."]]],
  [12, [["AssetFlow makes every asset accountable.", "AssetFlow keeps every asset visible, secure, and accountable."], ["React • Spring Boot • MySQL", "React · Spring Boot · .NET · MySQL"]]]
]);

const inspect = (await fs.readFile(inspectPath, "utf8")).trim().split(/\r?\n/).map(JSON.parse);
const textBySlide = new Map();
for (const row of inspect) {
  if (row.kind === "textbox" && row.slide) {
    if (!textBySlide.has(row.slide)) textBySlide.set(row.slide, []);
    textBySlide.get(row.slide).push(row);
  }
}
const deck = await PresentationFile.importPptx(await FileBlob.load(input));
for (const [slideNumber, edits] of corrected) {
  for (const [oldText, newText] of edits) {
    const shape = deck.slides.items[slideNumber - 1].shapes.items.find((candidate) => String(candidate.text) === oldText);
    if (!shape) throw new Error(`Slide ${slideNumber}: missing text box: ${oldText}`);
    shape.text.replace(oldText, newText);
  }
}

const sourceNote = "[Sources]\n- AssetFlow_Presentation_Simple.pptx (source template and existing content).\n- architecture diagram.pptx (architecture and workflow reference).\n- Local AssetFlow project source code (implementation reference).";
for (const slide of deck.slides.items) slide.speakerNotes.textFrame.setText(sourceNote);

await fs.mkdir(new URL("../docs/", import.meta.url), { recursive: true });
const pptx = await PresentationFile.exportPptx(deck);
await pptx.save(output);
console.log(output);

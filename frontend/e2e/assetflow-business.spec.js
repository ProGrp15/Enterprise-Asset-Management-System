/* global process */
import { test, expect, request as requestFactory } from '@playwright/test';

test.describe.serial('AssetFlow business lifecycle', () => {
  let admin, employeeOne, employeeTwo, secondTenantAdmin;
  let departmentId, categoryId, vendorId, locationId, assetOneId, assetTwoId;
  let requestId, maintenanceId, transferId, returnId;
  const password = 'CompanyAdmin@123';
  const employeePassword = 'Employee@123';
  const unique = `${Date.now()}`;

  const api = (token) => requestFactory.newContext({
    baseURL: process.env.ASSETFLOW_API_URL || 'http://localhost:8080',
    extraHTTPHeaders: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const body = (response) => response.json().then((payload) => payload.data ?? payload);
  const create = async (client, path, data) => {
    const response = await client.post(path, { data });
    expect(response.ok(), `${path}: ${await response.text()}`).toBeTruthy();
    return body(response);
  };

  test('registers an isolated company and admin', async () => {
    const client = await api();
    const email = `admin.${unique}@assetflow.test`;
    const data = await create(client, '/api/auth/register-company', {
      companyName: `AssetFlow E2E ${unique}`, officialEmail: email, mobileNumber: '9999999901',
      industry: 'Technology', companySize: '1-50', address: 'E2E Street', city: 'Pune',
      state: 'Maharashtra', country: 'India', postalCode: '411001', adminName: 'E2E Company Admin', password,
    });
    expect(data.user.role).toBe('COMPANY_ADMIN');
    admin = { ...data, email, password };
    await client.dispose();
  });

  test('creates company setup records', async () => {
    const client = await api(admin.accessToken);
    departmentId = (await create(client, '/api/department', { name: 'IT', description: 'E2E department' })).department_id;
    categoryId = (await create(client, '/api/category', { categoryName: 'Laptop', description: 'E2E category' })).category_id;
    vendorId = (await create(client, '/api/vendor', { vendorName: 'E2E Vendor', contactPerson: 'QA', email: `vendor.${unique}@assetflow.test`, phone: '9999999902' })).vendor_id;
    locationId = (await create(client, '/api/location', { name: 'Pune Office', address: 'E2E Street', city: 'Pune', state: 'Maharashtra', country: 'India', postalCode: '411001' })).location_id;
    const purchase = await create(client, '/api/purchase-order', { vendorId, orderNumber: `PO-${unique}`, orderDate: '2026-08-05', totalAmount: 200000, status: 'APPROVED' });
    expect(purchase.purchase_order_id).toBeTruthy();
    await client.dispose();
  });

  test('creates employees and assets', async () => {
    const client = await api(admin.accessToken);
    employeeOne = await create(client, '/api/employee', { firstName: 'Asha', lastName: 'One', email: `asha.${unique}@assetflow.test`, password: employeePassword, phone: '9999999903', departmentId });
    employeeTwo = await create(client, '/api/employee', { firstName: 'Bharat', lastName: 'Two', email: `bharat.${unique}@assetflow.test`, password: employeePassword, phone: '9999999904', departmentId });
    const asset = { categoryId, vendorId, locationId, assetName: 'Dell Latitude E2E', assetTag: `E2E-${unique}-1`, serialNumber: `SER-${unique}-1`, purchaseDate: '2026-08-05', purchaseCost: 100000, status: 'AVAILABLE' };
    assetOneId = (await create(client, '/api/asset', asset)).asset_id;
    assetTwoId = (await create(client, '/api/asset', { ...asset, assetName: 'Dell Monitor E2E', assetTag: `E2E-${unique}-2`, serialNumber: `SER-${unique}-2` })).asset_id;
    expect(assetOneId).toBeTruthy();
    await client.dispose();
  });

  test('allocates an asset and employee sees only assigned assets', async () => {
    const adminClient = await api(admin.accessToken);
    const allocation = await adminClient.post('/api/asset-allocation', { data: { assetId: assetOneId, employeeId: employeeOne.user_id, allocatedBy: admin.user.id, allocatedDate: '2026-08-05', allocationStatus: 'ACTIVE' } });
    expect(allocation.ok(), await allocation.text()).toBeTruthy();
    const publicClient = await api();
    const login = await publicClient.post('/api/auth/login', { data: { email: employeeOne.email, password: employeePassword } });
    employeeOne = { ...employeeOne, ...(await body(login)) };
    const rows = await body(await (await api(employeeOne.accessToken)).get('/api/asset'));
    expect(rows.some((row) => row.asset_id === assetOneId)).toBeTruthy();
    expect(rows.some((row) => row.asset_id === assetTwoId)).toBeFalsy();
    await adminClient.dispose();
  });

  test('requests and approves an asset with automatic allocation', async () => {
    const employeeClient = await api(employeeOne.accessToken);
    requestId = (await body(await employeeClient.post('/api/asset-request', { data: { categoryId, requestType: 'NEW_ASSET', reason: 'Second screen required for work' } }))).request_id;
    const adminClient = await api(admin.accessToken);
    const approved = await adminClient.put(`/api/asset-request/${requestId}`, { data: { employeeId: employeeOne.user_id, categoryId, assetId: assetTwoId, requestType: 'NEW_ASSET', reason: 'Second screen required for work', status: 'APPROVED', approvedBy: admin.user.id } });
    expect(approved.ok(), await approved.text()).toBeTruthy();
    const rows = await body(await employeeClient.get('/api/asset'));
    expect(rows.some((row) => row.asset_id === assetTwoId)).toBeTruthy();
    await employeeClient.dispose(); await adminClient.dispose();
  });

  test('runs maintenance and transfer lifecycle', async () => {
    const employeeClient = await api(employeeOne.accessToken);
    maintenanceId = (await body(await employeeClient.post('/api/maintenance', { data: { assetId: assetOneId, issueDescription: 'Keyboard issue', priority: 'HIGH', status: 'OPEN' } }))).maintenance_id;
    const adminClient = await api(admin.accessToken);
    const completed = await adminClient.put(`/api/maintenance/${maintenanceId}`, { data: { assetId: assetOneId, employeeId: employeeOne.user_id, issueDescription: 'Keyboard issue', priority: 'HIGH', status: 'COMPLETED' } });
    expect(completed.ok(), await completed.text()).toBeTruthy();
    transferId = (await body(await adminClient.post('/api/asset-transfer', { data: { assetId: assetOneId, fromEmployeeId: employeeOne.user_id, toEmployeeId: employeeTwo.user_id, requestedBy: admin.user.id, reason: 'Team transfer', status: 'PENDING' } }))).transfer_id;
    const approved = await adminClient.put(`/api/asset-transfer/${transferId}`, { data: { assetId: assetOneId, fromEmployeeId: employeeOne.user_id, toEmployeeId: employeeTwo.user_id, reason: 'Team transfer', status: 'APPROVED', approvedBy: admin.user.id } });
    expect(approved.ok(), await approved.text()).toBeTruthy();
    const publicClient = await api();
    const login = await publicClient.post('/api/auth/login', { data: { email: employeeTwo.email, password: employeePassword } });
    employeeTwo = { ...employeeTwo, ...(await body(login)) };
    const rows = await body(await (await api(employeeTwo.accessToken)).get('/api/asset'));
    expect(rows.some((row) => row.asset_id === assetOneId)).toBeTruthy();
    await employeeClient.dispose(); await adminClient.dispose();
  });

  test('returns the transferred asset and records notifications/audit', async () => {
    const employeeClient = await api(employeeTwo.accessToken);
    returnId = (await body(await employeeClient.post('/api/asset-return', { data: { assetId: assetOneId, conditionStatus: 'GOOD', remarks: 'Returned for inspection', status: 'PENDING' } }))).return_id;
    const adminClient = await api(admin.accessToken);
    const approved = await adminClient.put(`/api/asset-return/${returnId}`, { data: { assetId: assetOneId, employeeId: employeeTwo.user_id, conditionStatus: 'GOOD', remarks: 'Returned for inspection', status: 'APPROVED', approvedBy: admin.user.id } });
    expect(approved.ok(), await approved.text()).toBeTruthy();
    expect((await body(await adminClient.get(`/api/asset/${assetOneId}`))).status).toBe('AVAILABLE');
    expect(await body(await employeeClient.get('/api/notification'))).toBeDefined();
    expect(await body(await adminClient.get('/api/audit'))).toBeDefined();
    await employeeClient.dispose(); await adminClient.dispose();
  });

  test('enforces tenant isolation and AI fallback', async () => {
    const publicClient = await api();
    const response = await publicClient.post('/api/auth/register-company', { data: {
      companyName: `AssetFlow E2E Tenant ${unique}`, officialEmail: `tenant.${unique}@assetflow.test`, mobileNumber: '9999999905', industry: 'Technology', companySize: '1-50', address: 'Other Street', city: 'Mumbai', state: 'Maharashtra', country: 'India', postalCode: '400001', adminName: 'Second Tenant Admin', password,
    }});
    expect(response.ok()).toBeTruthy();
    secondTenantAdmin = await body(response);
    const otherClient = await api(secondTenantAdmin.accessToken);
    expect(await body(await otherClient.get('/api/asset'))).toEqual([]);
    expect((await otherClient.get(`/api/asset/${assetOneId}`)).status()).toBe(404);
    const aiReply = await body(await otherClient.post('/api/ai/chat', { data: { message: 'Summarize this workspace' } }));
    expect(aiReply.reply).toBeTruthy();
    await otherClient.dispose();
  });

  test('loads the company admin dashboard without browser errors', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'you@company.com' }).fill(admin.email);
    await page.getByRole('textbox', { name: 'Enter your password' }).fill(password);
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await expect(page).toHaveURL(/company-admin\/dashboard/);
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });
});

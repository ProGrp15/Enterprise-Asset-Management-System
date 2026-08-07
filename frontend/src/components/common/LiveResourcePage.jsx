/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaCheck, FaDatabase, FaDownload, FaEdit, FaPlus, FaPrint, FaSearch, FaSyncAlt, FaTimes, FaTrash, FaUpload } from 'react-icons/fa';
import {
  assets,
  categories,
  vendors,
  purchaseOrders,
  maintenance,
  allocations,
  requests,
  repairHistory,
  transfers,
  returns,
  importAssets
} from '../../services/assetService';
import { departments, employees, admins, locations } from '../../services/companyService';
import { notifications, auditLogs } from '../../services/notificationService';
import { exportCsv, exportPdf, exportXlsx, parseCsv, printRows } from '../../utils/export';

const ENUMS = {
  assetStatus: ['AVAILABLE', 'ASSIGNED', 'UNDER_MAINTENANCE', 'DISPOSED', 'LOST'],
  poStatus: ['DRAFT', 'PENDING', 'APPROVED', 'RECEIVED', 'CANCELLED'],
  maintenanceStatus: ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  requestStatus: ['PENDING', 'APPROVED', 'REJECTED', 'FULFILLED'],
  transferStatus: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
  returnStatus: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'],
  repairStatus: ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  priority: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
  requestType: ['NEW_ASSET', 'REPLACEMENT', 'UPGRADE'],
  allocationStatus: ['ACTIVE', 'RETURNED', 'TRANSFERRED'],
  conditionStatus: ['GOOD', 'DAMAGED', 'REPAIR_REQUIRED', 'SCRAP'],
};

const resources = {
  employees: {
    title: 'Employees',
    resource: employees,
    fields: [
      ['firstName', 'First Name', 'text'],
      ['lastName', 'Last Name', 'text'],
      ['email', 'Work Email', 'email'],
      ['password', 'Temporary Password', 'password'],
      ['phone', 'Phone Number', 'tel'],
      ['departmentId', 'Department', 'departmentSelect'],
    ],
    required: ['firstName', 'lastName', 'email'],
    importable: true,
  },
  'company-admins': {
    title: 'Company Admins',
    resource: admins,
    fields: [
      ['firstName', 'First Name', 'text'],
      ['lastName', 'Last Name', 'text'],
      ['email', 'Work Email', 'email'],
      ['password', 'Temporary Password', 'password'],
      ['phone', 'Phone Number', 'tel'],
      ['departmentId', 'Department', 'departmentSelect'],
    ],
    required: ['firstName', 'lastName', 'email'],
  },
  departments: {
    title: 'Departments',
    resource: departments,
    fields: [
      ['departmentName', 'Department Name', 'text'],
      ['description', 'Description', 'textarea'],
    ],
    required: ['departmentName'],
  },
  locations: {
    title: 'Locations',
    resource: locations,
    fields: [
      ['locationName', 'Location Name', 'text'],
      ['address', 'Street Address', 'text'],
      ['city', 'City', 'text'],
      ['state', 'State / Province', 'text'],
      ['country', 'Country', 'text'],
      ['postalCode', 'Postal Code', 'text'],
    ],
    required: ['locationName'],
  },
  assets: {
    title: 'Assets',
    resource: assets,
    fields: [
      ['assetName', 'Asset Name', 'text'],
      ['assetTag', 'Asset Tag', 'text'],
      ['serialNumber', 'Serial Number', 'text'],
      ['categoryId', 'Category', 'categorySelect'],
      ['vendorId', 'Vendor', 'vendorSelect'],
      ['locationId', 'Location', 'locationSelect'],
      ['purchaseOrderId', 'Purchase Order', 'poSelect'],
      ['manufacturer', 'Manufacturer', 'text'],
      ['model', 'Model', 'text'],
      ['purchaseDate', 'Purchase Date', 'date'],
      ['purchaseCost', 'Purchase Cost ($)', 'number'],
      ['warrantyExpiry', 'Warranty Expiry', 'date'],
      ['status', 'Asset Status', 'enumSelect', ENUMS.assetStatus],
      ['remarks', 'Remarks', 'textarea'],
    ],
    required: ['assetName', 'assetTag', 'serialNumber', 'categoryId', 'vendorId'],
    importable: true,
  },
  'asset-categories': {
    title: 'Asset Categories',
    resource: categories,
    fields: [
      ['categoryName', 'Category Name', 'text'],
      ['description', 'Description', 'textarea'],
    ],
    required: ['categoryName'],
  },
  vendors: {
    title: 'Vendors',
    resource: vendors,
    fields: [
      ['vendorName', 'Vendor Name', 'text'],
      ['contactPerson', 'Contact Person', 'text'],
      ['email', 'Email Address', 'email'],
      ['phone', 'Phone Number', 'tel'],
      ['address', 'Address', 'textarea'],
    ],
    required: ['vendorName'],
  },
  'purchase-orders': {
    title: 'Purchase Orders',
    resource: purchaseOrders,
    fields: [
      ['orderNumber', 'Order Number', 'text'],
      ['vendorId', 'Vendor', 'vendorSelect'],
      ['orderDate', 'Order Date', 'date'],
      ['expectedDeliveryDate', 'Expected Delivery Date', 'date'],
      ['totalAmount', 'Total Amount ($)', 'number'],
      ['status', 'Order Status', 'enumSelect', ENUMS.poStatus],
      ['remarks', 'Remarks', 'textarea'],
    ],
    required: ['orderNumber', 'vendorId', 'orderDate'],
  },
  maintenance: {
    title: 'Maintenance',
    resource: maintenance,
    fields: [
      ['assetId', 'Asset', 'assetSelect'],
      ['employeeId', 'Assigned Employee', 'employeeSelect'],
      ['issueDescription', 'Issue Description', 'textarea'],
      ['priority', 'Priority', 'enumSelect', ENUMS.priority],
      ['status', 'Maintenance Status', 'enumSelect', ENUMS.maintenanceStatus],
    ],
    required: ['assetId', 'employeeId', 'issueDescription'],
  },
  'asset-requests': {
    title: 'Asset Requests',
    resource: requests,
    fields: [
      ['employeeId', 'Requesting Employee', 'employeeSelect'],
      ['categoryId', 'Category', 'categorySelect'],
      ['assetId', 'Specific Asset (Optional)', 'assetSelect'],
      ['requestType', 'Request Type', 'enumSelect', ENUMS.requestType],
      ['reason', 'Business Reason', 'textarea'],
      ['approvedBy', 'Approver (Admin)', 'employeeSelect'],
      ['status', 'Request Status', 'enumSelect', ENUMS.requestStatus],
    ],
    required: ['employeeId', 'categoryId', 'requestType', 'reason'],
  },
  'asset-allocation': {
    title: 'Asset Allocations',
    resource: allocations,
    fields: [
      ['assetId', 'Asset', 'assetSelect'],
      ['employeeId', 'Assigned Employee', 'employeeSelect'],
      ['allocatedBy', 'Allocated By', 'employeeSelect'],
      ['allocatedDate', 'Allocation Date', 'date'],
      ['expectedReturnDate', 'Expected Return Date', 'date'],
      ['allocationStatus', 'Allocation Status', 'enumSelect', ENUMS.allocationStatus],
      ['remarks', 'Remarks', 'textarea'],
    ],
    required: ['assetId', 'employeeId', 'allocatedBy', 'allocatedDate'],
  },
  'asset-transfers': {
    title: 'Asset Transfers',
    resource: transfers,
    fields: [
      ['assetId', 'Asset', 'assetSelect'],
      ['fromEmployeeId', 'From Employee', 'employeeSelect'],
      ['toEmployeeId', 'To Employee', 'employeeSelect'],
      ['fromLocationId', 'From Location', 'locationSelect'],
      ['toLocationId', 'To Location', 'locationSelect'],
      ['requestedBy', 'Requested By', 'employeeSelect'],
      ['approvedBy', 'Approved By', 'employeeSelect'],
      ['reason', 'Transfer Reason', 'textarea'],
      ['status', 'Transfer Status', 'enumSelect', ENUMS.transferStatus],
    ],
    required: ['assetId', 'fromEmployeeId', 'toEmployeeId', 'requestedBy', 'reason'],
  },
  'asset-returns': {
    title: 'Asset Returns',
    resource: returns,
    fields: [
      ['assetId', 'Asset', 'assetSelect'],
      ['employeeId', 'Returning Employee', 'employeeSelect'],
      ['requestedBy', 'Requested By', 'employeeSelect'],
      ['approvedBy', 'Approved By', 'employeeSelect'],
      ['conditionStatus', 'Asset Condition', 'enumSelect', ENUMS.conditionStatus],
      ['remarks', 'Condition Remarks', 'textarea'],
      ['status', 'Return Status', 'enumSelect', ENUMS.returnStatus],
    ],
    required: ['assetId', 'employeeId', 'requestedBy', 'conditionStatus'],
  },
  'repair-history': {
    title: 'Repair History',
    resource: repairHistory,
    fields: [
      ['assetId', 'Asset', 'assetSelect'],
      ['technicianId', 'Technician / Handler', 'employeeSelect'],
      ['issueDescription', 'Issue Description', 'textarea'],
      ['repairAction', 'Repair Action Taken', 'textarea'],
      ['cost', 'Repair Cost ($)', 'number'],
      ['startedAt', 'Started At', 'date'],
      ['completedAt', 'Completed At', 'date'],
      ['status', 'Repair Status', 'enumSelect', ENUMS.repairStatus],
    ],
    required: ['assetId', 'issueDescription', 'repairAction'],
  },
  notifications: {
    title: 'Notifications',
    resource: notifications,
    fields: [
      ['title', 'Notification Title', 'text'],
      ['message', 'Message Body', 'textarea'],
    ],
  },
  'audit-logs': {
    title: 'Audit Logs',
    resource: auditLogs,
    fields: [
      ['module', 'Module', 'text'],
      ['action', 'Action', 'text'],
      ['description', 'Description', 'textarea'],
    ],
  },
};

const unwrapRows = (value) => (Array.isArray(value) ? value : value?.items || value?.content || []);

const aliases = {
  departments: { departmentName: 'department_name', name: 'department_name' },
  locations: { locationName: 'location_name', name: 'location_name', postalCode: 'postal_code' },
  'asset-categories': { categoryName: 'category_name' },
  vendors: { vendorName: 'vendor_name', contactPerson: 'contact_person' },
  employees: { firstName: 'first_name', lastName: 'last_name', departmentId: 'department_id' },
  'company-admins': { firstName: 'first_name', lastName: 'last_name', departmentId: 'department_id' },
  assets: {
    assetName: 'asset_name',
    assetTag: 'asset_tag',
    serialNumber: 'serial_number',
    categoryId: 'category_id',
    vendorId: 'vendor_id',
    locationId: 'location_id',
    purchaseOrderId: 'purchase_order_id',
    purchaseDate: 'purchase_date',
    purchaseCost: 'purchase_cost',
    warrantyExpiry: 'warranty_expiry',
  },
  'purchase-orders': {
    orderNumber: 'order_number',
    vendorId: 'vendor_id',
    orderDate: 'order_date',
    expectedDeliveryDate: 'expected_delivery_date',
    totalAmount: 'total_amount',
  },
  maintenance: {
    assetId: 'asset_id',
    employeeId: 'employee_id',
    issueDescription: 'issue_description',
  },
  'asset-requests': {
    assetId: 'asset_id',
    employeeId: 'employee_id',
    categoryId: 'category_id',
    requestType: 'request_type',
    approvedBy: 'approved_by',
  },
  'asset-allocation': {
    assetId: 'asset_id',
    employeeId: 'employee_id',
    allocatedBy: 'allocated_by',
    allocatedDate: 'allocated_date',
    expectedReturnDate: 'expected_return_date',
    returnedDate: 'returned_date',
    allocationStatus: 'allocation_status',
  },
  'asset-transfers': {
    assetId: 'asset_id',
    fromEmployeeId: 'from_employee_id',
    toEmployeeId: 'to_employee_id',
    fromLocationId: 'from_location_id',
    toLocationId: 'to_location_id',
    requestedBy: 'requested_by',
    approvedBy: 'approved_by',
  },
  'asset-returns': {
    assetId: 'asset_id',
    employeeId: 'employee_id',
    requestedBy: 'requested_by',
    approvedBy: 'approved_by',
    conditionStatus: 'condition_status',
    returnedAt: 'returned_at',
  },
  'repair-history': {
    assetId: 'asset_id',
    technicianId: 'technician_id',
    issueDescription: 'issue_description',
    repairAction: 'repair_action',
    startedAt: 'started_at',
    completedAt: 'completed_at',
  },
};

const snake = (key) => key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
const rowId = (row) => row.id || Object.entries(row).find(([key]) => key.endsWith('_id') && key !== 'company_id')?.[1] || Object.values(row)[0];

const editValues = (name, row, fields) =>
  Object.fromEntries(
    fields.map(([key]) => [
      key,
      row[aliases[name]?.[key] || key] ?? row[snake(key)] ?? '',
    ])
  );

const display = (value) => String(value ?? '—').replaceAll('_', ' ');

export default function LiveResourcePage({ name }) {
  const [params] = useSearchParams();
  const config = resources[name];
  const fileRef = useRef(null);
  const currentUser = useSelector(s => s.auth.user);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(params.get('search') || '');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);

  // Relational Lookups
  const [deptOptions, setDeptOptions] = useState([]);
  const [catOptions, setCatOptions] = useState([]);
  const [vendorOptions, setVendorOptions] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);
  const [assetOptions, setAssetOptions] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [poOptions, setPoOptions] = useState([]);

  // Fetch Lookups for Select Dropdowns
  const loadLookups = async () => {
    try {
      const [deptRes, catRes, vendorRes, locRes, assetRes, empRes, adminRes, poRes] = await Promise.allSettled([
        departments.list({ size: 100 }),
        categories.list({ size: 100 }),
        vendors.list({ size: 100 }),
        locations.list({ size: 100 }),
        assets.list({ size: 100 }),
        employees.list({ size: 100 }),
        admins.list({ size: 100 }),
        purchaseOrders.list({ size: 100 }),
      ]);

      if (deptRes.status === 'fulfilled') setDeptOptions(unwrapRows(deptRes.value));
      if (catRes.status === 'fulfilled') setCatOptions(unwrapRows(catRes.value));
      if (vendorRes.status === 'fulfilled') setVendorOptions(unwrapRows(vendorRes.value));
      if (locRes.status === 'fulfilled') setLocationOptions(unwrapRows(locRes.value));
      if (assetRes.status === 'fulfilled') setAssetOptions(unwrapRows(assetRes.value));
      if (poRes.status === 'fulfilled') setPoOptions(unwrapRows(poRes.value));

      const emps = empRes.status === 'fulfilled' ? unwrapRows(empRes.value) : [];
      const adms = adminRes.status === 'fulfilled' ? unwrapRows(adminRes.value) : [];
      const userMap = new Map();
      [...adms, ...emps].forEach((u) => {
        const uid = u.user_id || u.id;
        if (uid && !userMap.has(uid)) userMap.set(uid, u);
      });
      setUserOptions(Array.from(userMap.values()));
    } catch {
      // Ignore lookup failure
    }
  };

  const load = () => {
    if (!config) return;
    setLoading(true);
    config.resource
      .list({ search: query || undefined, page, size: 25 })
      .then((value) => setData(unwrapRows(value)))
      .catch((e) => setError(e.response?.data?.message || 'Unable to load records.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    load();
  }, [name, page]);

  const filtered = useMemo(() => {
    if (!query) return data;
    const lower = query.toLowerCase();
    return data.filter((row) =>
      JSON.stringify(row).toLowerCase().includes(lower)
    );
  }, [data, query]);

  // Compute prioritized display columns (Hiding raw IDs when name is available)
  const displayColumns = useMemo(() => {
    if (!filtered.length) return [];
    const sample = filtered[0];
    const keys = Object.keys(sample);

    const hidden = new Set([
      'company_id',
      'password',
      'is_active',
      'token_hash',
      'token_id',
    ]);

    // Check paired foreign keys vs names
    if (keys.includes('category_name')) hidden.add('category_id');
    if (keys.includes('vendor_name')) hidden.add('vendor_id');
    if (keys.includes('location_name')) hidden.add('location_id');
    if (keys.includes('department_name')) hidden.add('department_id');
    if (keys.includes('employee_name')) hidden.add('employee_id');
    if (keys.includes('asset_name')) hidden.add('asset_id');
    if (keys.includes('allocated_by_name')) hidden.add('allocated_by');
    if (keys.includes('approved_by_name')) hidden.add('approved_by');
    if (keys.includes('technician_name')) hidden.add('technician_id');
    if (keys.includes('from_employee_name')) hidden.add('from_employee_id');
    if (keys.includes('to_employee_name')) hidden.add('to_employee_id');
    if (keys.includes('from_location_name')) hidden.add('from_location_id');
    if (keys.includes('to_location_name')) hidden.add('to_location_id');
    if (keys.includes('purchase_order_number')) hidden.add('purchase_order_id');

    // Priority ordering
    const priorityCols = [
      'asset_name',
      'asset_tag',
      'category_name',
      'department_name',
      'location_name',
      'vendor_name',
      'order_number',
      'employee_name',
      'full_name',
      'first_name',
      'last_name',
      'email',
      'request_type',
      'issue_description',
      'repair_action',
      'status',
      'priority',
      'allocation_status',
      'condition_status',
    ];

    const validCols = keys.filter((k) => !hidden.has(k));

    validCols.sort((a, b) => {
      const idxA = priorityCols.indexOf(a);
      const idxB = priorityCols.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });

    return validCols.slice(0, 7);
  }, [filtered]);

  const save = async (event) => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      editing?.id
        ? await config.resource.update(editing.id, body)
        : await config.resource.create(body);
      setEditing(null);
      load();
      loadLookups();
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to save record.');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      await config.resource.remove(id);
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to delete record.');
    }
  };

  const changeRequestStatus = async (row, newStatus) => {
    const id = rowId(row);
    if (!id) return;
    const label = newStatus === 'APPROVED' ? 'approve' : 'deny';
    if (!window.confirm(`Are you sure you want to ${label} this asset request?`)) return;
    try {
      await requests.update(id, {
        status: newStatus,
        approvedBy: currentUser?.id || currentUser?.userId || null,
      });
      load();
    } catch (e) {
      setError(e.response?.data?.message || `Unable to ${label} request.`);
    }
  };

  const importFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const rows = parseCsv(await file.text());
      const result = await (config.resource.importRows
        ? config.resource.importRows(rows)
        : importAssets(rows));
      setError(
        `Import complete: ${result.accepted || 0} accepted, ${(
          result.rejected || []
        ).length} rejected.`
      );
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Import failed.');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  if (!config) {
    return (
      <div className="surface p-5">
        <h2>Module unavailable</h2>
        <p className="muted">This module has not been configured.</p>
      </div>
    );
  }

  const edit = (row) =>
    setEditing({ ...editValues(name, row, config.fields), id: rowId(row) });

  const renderFieldInput = (key, label, type, enumList) => {
    const defaultValue = editing?.[key] ?? '';
    const isRequired =
      config.required?.includes(key) ||
      key === 'email' ||
      key.toLowerCase().includes('name');

    if (type === 'textarea') {
      return (
        <textarea
          name={key}
          defaultValue={defaultValue}
          className="form-control"
          rows={3}
          required={isRequired}
          placeholder={`Enter ${label.toLowerCase()}...`}
        />
      );
    }

    if (type === 'enumSelect' && enumList) {
      return (
        <select
          name={key}
          defaultValue={defaultValue || enumList[0]}
          className="form-select"
          required={isRequired}
        >
          {enumList.map((opt) => (
            <option key={opt} value={opt}>
              {opt.replaceAll('_', ' ')}
            </option>
          ))}
        </select>
      );
    }

    if (type === 'departmentSelect') {
      return (
        <select
          name={key}
          defaultValue={defaultValue}
          className="form-select"
          required={isRequired}
        >
          <option value="">-- Select Department --</option>
          {deptOptions.map((d) => (
            <option key={d.department_id || d.id} value={d.department_id || d.id}>
              {d.department_name || d.name}
            </option>
          ))}
        </select>
      );
    }

    if (type === 'categorySelect') {
      return (
        <select
          name={key}
          defaultValue={defaultValue}
          className="form-select"
          required={isRequired}
        >
          <option value="">-- Select Category --</option>
          {catOptions.map((c) => (
            <option key={c.category_id || c.id} value={c.category_id || c.id}>
              {c.category_name || c.name}
            </option>
          ))}
        </select>
      );
    }

    if (type === 'vendorSelect') {
      return (
        <select
          name={key}
          defaultValue={defaultValue}
          className="form-select"
          required={isRequired}
        >
          <option value="">-- Select Vendor --</option>
          {vendorOptions.map((v) => (
            <option key={v.vendor_id || v.id} value={v.vendor_id || v.id}>
              {v.vendor_name || v.name}
            </option>
          ))}
        </select>
      );
    }

    if (type === 'locationSelect') {
      return (
        <select
          name={key}
          defaultValue={defaultValue}
          className="form-select"
          required={isRequired}
        >
          <option value="">-- Select Location --</option>
          {locationOptions.map((l) => (
            <option key={l.location_id || l.id} value={l.location_id || l.id}>
              {l.location_name || l.name} {l.city ? `(${l.city})` : ''}
            </option>
          ))}
        </select>
      );
    }

    if (type === 'assetSelect') {
      return (
        <select
          name={key}
          defaultValue={defaultValue}
          className="form-select"
          required={isRequired}
        >
          <option value="">-- Select Asset --</option>
          {assetOptions.map((a) => (
            <option key={a.asset_id || a.id} value={a.asset_id || a.id}>
              {a.asset_name || a.name} [{a.asset_tag || a.serial_number || a.asset_id}] ({a.status || 'AVAILABLE'})
            </option>
          ))}
        </select>
      );
    }

    if (type === 'employeeSelect') {
      return (
        <select
          name={key}
          defaultValue={defaultValue}
          className="form-select"
          required={isRequired}
        >
          <option value="">-- Select Person --</option>
          {userOptions.map((u) => (
            <option key={u.user_id || u.id} value={u.user_id || u.id}>
              {u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email} ({u.role || 'USER'})
            </option>
          ))}
        </select>
      );
    }

    if (type === 'poSelect') {
      return (
        <select
          name={key}
          defaultValue={defaultValue}
          className="form-select"
          required={isRequired}
        >
          <option value="">-- Select Purchase Order (Optional) --</option>
          {poOptions.map((po) => (
            <option key={po.purchase_order_id || po.id} value={po.purchase_order_id || po.id}>
              {po.order_number || po.orderNumber} {po.total_amount ? `($${po.total_amount})` : ''}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={type || 'text'}
        name={key}
        defaultValue={defaultValue}
        className="form-control"
        required={isRequired}
        placeholder={`Enter ${label.toLowerCase()}...`}
        step={type === 'number' ? '0.01' : undefined}
      />
    );
  };

  return (
    <div className="page-heading">
      <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
        <div>
          <div className="eyebrow">Enterprise Assets</div>
          <h1>{config.title}</h1>
          <p>
            Database-backed operational records with live lookups, relationships, and audit tracking.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({})}>
          <FaPlus className="me-2" />
          New {config.title.slice(0, -1)}
        </button>
      </div>

      {error && (
        <div className="alert alert-info d-flex justify-content-between align-items-center mb-4">
          <span>{error}</span>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setError('')}>
            Dismiss
          </button>
        </div>
      )}

      <section className="surface overflow-hidden">
        <div className="table-toolbar">
          <div className="input-group table-search">
            <span className="input-group-text">
              <FaSearch />
            </span>
            <input
              className="form-control"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder={`Search ${config.title.toLowerCase()}...`}
            />
          </div>
          <span className="record-count">{filtered.length} records</span>
          {config.importable && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                hidden
                onChange={importFile}
              />
              <button
                className="btn btn-ghost"
                disabled={importing}
                onClick={() => fileRef.current?.click()}
              >
                <FaUpload className="me-2" />
                {importing ? 'Importing…' : 'Import CSV'}
              </button>
            </>
          )}
          <button className="btn btn-ghost" onClick={() => exportCsv(config.title, filtered)}>
            <FaDownload className="me-2" />
            CSV
          </button>
          <button className="btn btn-ghost" onClick={() => exportXlsx(config.title, filtered)}>
            Excel
          </button>
          <button className="btn btn-ghost" onClick={() => exportPdf(config.title, filtered)}>
            PDF
          </button>
          <button className="btn btn-ghost" onClick={() => printRows(config.title, filtered)}>
            <FaPrint className="me-2" />
            Print
          </button>
          <button className="btn btn-ghost" onClick={load}>
            <FaSyncAlt className="me-2" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-5 text-center">
            <div className="spinner-border text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state py-5 text-center">
            <span className="empty-icon fs-1 text-muted">
              <FaDatabase />
            </span>
            <h5 className="mt-3">No records found</h5>
            <p className="muted">Create a record or adjust your search query.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table workspace-table mb-0 align-middle">
              <thead>
                <tr>
                  {displayColumns.map((key) => (
                    <th key={key}>
                      {key
                        .replace(/_name$/, '')
                        .replace(/^is_/, '')
                        .replaceAll('_', ' ')}
                    </th>
                  ))}
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, index) => (
                  <tr key={row.id || rowId(row) || index}>
                    {displayColumns.map((key) => {
                      const val = row[key];
                      const isStatus =
                        key.toLowerCase().includes('status') ||
                        key.toLowerCase().includes('priority');
                      return (
                        <td key={key}>
                          {isStatus ? (
                            <span
                              className={`status-pill ${
                                String(val).toUpperCase().includes('ACTIVE') ||
                                String(val).toUpperCase().includes('APPROVED') ||
                                String(val).toUpperCase().includes('AVAILABLE') ||
                                String(val).toUpperCase().includes('COMPLETED')
                                  ? 'success'
                                  : String(val).toUpperCase().includes('REJECT') ||
                                    String(val).toUpperCase().includes('CANCEL') ||
                                    String(val).toUpperCase().includes('LOST') ||
                                    String(val).toUpperCase().includes('CRITICAL')
                                  ? 'danger'
                                  : 'warning'
                              }`}
                            >
                              <span />
                              {display(val)}
                            </span>
                          ) : (
                            display(val)
                          )}
                        </td>
                      );
                    })}
                    <td className="text-end">
                      {/* Approve / Deny quick actions for pending asset requests */}
                      {name === 'asset-requests' && String(row.status || '').toUpperCase() === 'PENDING' && (
                        <>
                          <button
                            className="btn btn-sm btn-success me-1"
                            title="Approve this request"
                            onClick={() => changeRequestStatus(row, 'APPROVED')}
                          >
                            <FaCheck className="me-1" />Approve
                          </button>
                          <button
                            className="btn btn-sm btn-danger me-2"
                            title="Deny this request"
                            onClick={() => changeRequestStatus(row, 'REJECTED')}
                          >
                            <FaTimes className="me-1" />Deny
                          </button>
                        </>
                      )}
                      <button
                        className="icon-button me-2"
                        aria-label="Edit"
                        title="Edit record"
                        onClick={() => edit(row)}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="icon-button text-danger"
                        aria-label="Delete"
                        title="Deactivate record"
                        onClick={() => remove(rowId(row))}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center p-3 border-top">
          <button
            className="btn btn-sm btn-ghost"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span className="muted small">Page {page + 1}</span>
          <button
            className="btn btn-sm btn-ghost"
            disabled={data.length < 25}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </section>

      {editing && (
        <div className="modal-backdrop-custom">
          <div className="surface modal-card" style={{ maxWidth: 750, width: '100%' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="h4 mb-0">
                {editing.id ? 'Edit' : 'Create'} {config.title.replace(/s$/, '')}
              </h2>
              <button
                type="button"
                className="btn-close"
                onClick={() => setEditing(null)}
              />
            </div>
            <form onSubmit={save}>
              <div className="row g-3">
                {config.fields.map(([key, label, type, enumList]) => (
                  <div
                    className={
                      type === 'textarea'
                        ? 'col-12'
                        : config.fields.length > 4
                        ? 'col-md-6'
                        : 'col-md-12'
                    }
                    key={key}
                  >
                    <label className="form-label fw-semibold">{label}</label>
                    {renderFieldInput(key, label, type, enumList)}
                  </div>
                ))}
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary">
                  {editing.id ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

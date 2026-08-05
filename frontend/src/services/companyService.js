import { COMPANY_API } from "./api";

const unwrap = (r) => r.data?.data ?? r.data;
const resource = (name) => ({
  list: async (params) => unwrap(await COMPANY_API.get(`/api/${name}`, { params })),
  get: async (id) => unwrap(await COMPANY_API.get(`/api/${name}/${id}`)),
  create: async (body) => unwrap(await COMPANY_API.post(`/api/${name}`, body)),
  update: async (id, body) => unwrap(await COMPANY_API.put(`/api/${name}/${id}`, body)),
  remove: async (id) => unwrap(await COMPANY_API.delete(`/api/${name}/${id}`)),
});
const employeeImport = async (rows) => unwrap(await COMPANY_API.post('/api/employee/import', rows));

export const departments = resource("department");
export const employees = {...resource("employee"), importRows: employeeImport};
export const admins = resource("admin");
export const locations = resource("location");
export const getDepartments = (params) => departments.list(params);
export const createDepartment = departments.create;
export const getEmployees = (params) => employees.list(params);
export const createEmployee = employees.create;

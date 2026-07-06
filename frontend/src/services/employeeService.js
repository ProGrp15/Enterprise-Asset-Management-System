import API from "./api";

export const getEmployees = async () => {
  const response = await API.get("/employees");
  return response.data;
};

export const createEmployee = async (employeeData) => {
  const response = await API.post("/employees", employeeData);
  return response.data;
};

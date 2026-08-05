import { ASSET_API } from "./api";
const unwrap = (r) => r.data?.data ?? r.data;
const resource = (name) => ({
  list: async (params) => unwrap(await ASSET_API.get(`/${name}`, { params })),
  get: async (id) => unwrap(await ASSET_API.get(`/${name}/${id}`)),
  create: async (body) => unwrap(await ASSET_API.post(`/${name}`, body)),
  update: async (id, body) => unwrap(await ASSET_API.put(`/${name}/${id}`, body)),
  remove: async (id) => unwrap(await ASSET_API.delete(`/${name}/${id}`)),
});
export const assets = resource("asset");
export const categories = resource("category");
export const vendors = resource("vendor");
export const purchaseOrders = resource("purchase-order");
export const maintenance = resource("maintenance");
export const allocations = resource("asset-allocation");
export const requests = resource("asset-request");
export const repairHistory = resource("repair-history");
export const transfers = resource("asset-transfer");
export const returns = resource("asset-return");
export const importAssets = async (rows) => unwrap(await ASSET_API.post('/asset/import', rows));
export const getAssets = (p) => assets.list(p);
export const createAsset = assets.create;
export const getAsset = assets.get;
export const updateAsset = assets.update;
export const deleteAsset = assets.remove;

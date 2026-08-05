using System.Text.Json;

namespace AssetService.Services
{
    public interface IAssetDataService
    {
        Task<object> ListAsync(string type, long companyId, long userId, string role, string? search, int page, int size);
        Task<object> OneAsync(string type, long companyId, long userId, string role, long id);
        Task<object> CreateAsync(string type, long companyId, long userId, JsonElement body);
        Task<object> UpdateAsync(string type, long companyId, long userId, long id, JsonElement body);
        Task DeleteAsync(string type, long companyId, long userId, long id);
        Task EnsureEmployeeAssetAsync(long companyId, long userId, long assetId);
        Task<object> ImportAssetsAsync(long companyId, long userId, List<JsonElement> rows);
    }
}

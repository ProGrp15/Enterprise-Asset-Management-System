using System.Text.Json;

namespace CompanyService.Services
{
    public interface ICompanyDataService
    {
        Task<object> ListAsync(string type, long companyId, long userId, string role, string? search, int page, int size);
        Task<object> OneAsync(string type, long companyId, long userId, string role, long id);
        Task<object> CreateAsync(string type, long companyId, long userId, JsonElement body);
        Task<object> ImportEmployeesAsync(long companyId, long userId, List<JsonElement> rows);
        Task<object> UpdateAsync(string type, long companyId, long userId, long id, JsonElement body);
        Task DeleteAsync(string type, long companyId, long userId, long id);
    }
}

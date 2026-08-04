using System.Text.Json;

namespace CompanyService.Services
{
    public interface ICompanyDataService
    {
        Task<object> ListAsync(string type, long companyId, string? search);
        Task<object> OneAsync(string type, long companyId, long id);
        Task<object> CreateAsync(string type, long companyId, JsonElement body);
        Task<object> UpdateAsync(string type, long companyId, long id, JsonElement body);
        Task DeleteAsync(string type, long companyId, long id);
    }
}

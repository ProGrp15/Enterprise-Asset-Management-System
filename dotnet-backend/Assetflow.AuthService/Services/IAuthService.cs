using System.Threading.Tasks;
using Assetflow.AuthService.DTOs;

namespace Assetflow.AuthService.Services
{
    public interface IAuthService
    {
        Task<AuthView> RegisterCompanyAsync(RegisterCompany request);
        Task<AuthView> LoginAsync(Login request);
        // Additional methods (Forgot, Reset, Refresh, Profile) can be implemented here later
    }
}

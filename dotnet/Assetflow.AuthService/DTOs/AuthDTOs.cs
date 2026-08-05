using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Assetflow.AuthService.DTOs
{
    public record RegisterCompany(
        [Required] string CompanyName,
        [Required, EmailAddress] string OfficialEmail,
        [Required] string MobileNumber,
        [Required] string Industry,
        [Required] string CompanySize,
        [Required] string Address,
        [Required] string City,
        [Required] string State,
        [Required] string Country,
        [Required] string PostalCode,
        [Required] string AdminName,
        [Required, MinLength(8)] string Password
    );

    public record Login([Required, EmailAddress] string Email, [Required] string Password);

    public record Forgot([Required, EmailAddress] string Email);

    public record Reset([Required] string Token, [Required, MinLength(8)] string Password);

    public record Refresh([Required] string RefreshToken);

    public record ChangePassword([Required] string CurrentPassword, [Required, MinLength(8)] string NewPassword);

    public record UserView(long Id, string Name, string Email, string Role, string Department);

    public record CompanyView(long Id, string Name, string Email);

    public record AuthView(
        string AccessToken,
        string RefreshToken,
        UserView User,
        CompanyView? Company,
        List<string> Permissions
    );

    public record ApiResponse<T>(bool Success, string Message, T Data)
    {
        public static ApiResponse<T> Ok(T data, string message = "Success") => new(true, message, data);
        public static ApiResponse<T> Error(string message) => new(false, message, default);
    }
}

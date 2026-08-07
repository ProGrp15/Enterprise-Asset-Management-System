namespace AssetService.DTOs
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
        public long Timestamp { get; set; }

        public static ApiResponse<T> Ok(T data)
        {
            return new ApiResponse<T>
            {
                Success = true,
                Message = "Success",
                Data = data,
                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            };
        }

        public static ApiResponse<T> Message(string message)
        {
            return new ApiResponse<T>
            {
                Success = true,
                Message = message,
                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            };
        }

        public static ApiResponse<T> Error(string message)
        {
            return new ApiResponse<T>
            {
                Success = false,
                Message = message,
                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            };
        }
    }
}

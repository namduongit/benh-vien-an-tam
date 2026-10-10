namespace api.Contract;

public class AppException : Exception
{
    public int StatusCode { get; set; } = 500;
    public object Errors { get; set; }
    public AppException(int StatusCode = 500, string message = "An unexpected error occurred", object Errors = null!) : base(message)
    {   
        this.StatusCode = StatusCode;
        this.Errors = Errors;
    }
}

public class DuplicateException: AppException
{
    public DuplicateException(object Errors): base(409, "Existing resource", Errors)
    {
        
    }
}
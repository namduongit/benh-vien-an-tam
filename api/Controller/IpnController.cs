using System.Text;
using Microsoft.AspNetCore.Mvc;

namespace api.Controller;

[ApiController]
[Route("/api/ipn")]
public class IpnController : ControllerBase
{
    [HttpPost("sepay-service")]
    public async Task<IActionResult> SepayService()
    {
        // 1. Lấy thông tin request
        Console.WriteLine("========== SEPAY IPN ==========");

        Console.WriteLine($"Method: {Request.Method}");
        Console.WriteLine($"Path: {Request.Path}");
        Console.WriteLine($"QueryString: {Request.QueryString}");
        Console.WriteLine($"Content-Type: {Request.ContentType}");

        // 2. Đọc toàn bộ headers
        Console.WriteLine("\n========== HEADERS ==========");

        foreach (var header in Request.Headers)
        {
            Console.WriteLine($"{header.Key}: {header.Value}");
        }

        // 3. Đọc raw body
        Console.WriteLine("\n========== BODY ==========");

        Request.EnableBuffering();

        using var reader = new StreamReader(
            Request.Body,
            Encoding.UTF8,
            detectEncodingFromByteOrderMarks: false,
            leaveOpen: true
        );

        var body = await reader.ReadToEndAsync();

        // Cho phép middleware hoặc code khác đọc lại
        Request.Body.Position = 0;

        Console.WriteLine(body);

        Console.WriteLine("========== END SEPAY IPN ==========");

        return Ok(new { success = true });
    }
}
using api.Contract;
using api.Lib;
using api.Lib.Type;
using Microsoft.AspNetCore.Mvc;

namespace api.Controller;

[ApiController]
[Route("api/payment")]
public class PaymentController : ControllerBase
{
    private readonly Sepay _sepay;
    // private readonly PrescriptionService
    // private readonly AppointmentService
    // private readonly PaymentService

    public PaymentController(Sepay sepay)
    {
        this._sepay = sepay;
    }

    [HttpPost("testing")]
    public async Task<SepayType.CreateEndpoint> TestTing()
    {
        Guid uuid = Guid.NewGuid();
        int value = 10000;
        string code = "HD01";

        var result = this._sepay.CreateEndpoint(uuid, code, "appointment", value);
        
        return result;
    }

    [HttpGet("check-endpoint")]
    public IActionResult CheckEndpoint([FromQuery] SepayType.CheckEndpoint param)
    {   
        // Kiem chu ky
        if (!this._sepay.CheckSignature(param))
        {
            var response = new SepayType.ResultEndpoint
            {
                IsValid = false,
                ErrorMessage = "Chữ ký không hợp lệ, vui lòng kiểm tra lại."
            };

            return ApiResponse<SepayType.ResultEndpoint>.BadRequest(response);
        }

        // Kiem tra con han
        if (DateTimeOffset.UtcNow.ToUnixTimeSeconds() > param.ExpiresAt)
        {
            var response = new SepayType.ResultEndpoint
            {
                IsValid = false,
                ErrorMessage = "Phiên giao dịch đã hết hạn, vui lòng tạo giao dịch mới."
            };

            return ApiResponse<SepayType.ResultEndpoint>.BadRequest(response);
        }

        // Kiem tra hoa don
        // Kiem tra da duoc thanh toan chua
        string PayUrl = this._sepay.CreatePayUrl(param.Amount, param.OrderInfo);

        var result = new SepayType.ResultEndpoint
        {
            IsValid = true,
            OrderUuid = param.OrderId,
            Type = param.Type,
            Amount = param.Amount,
            Content = param.OrderInfo,
            PayUrl = PayUrl,
            ExpiresAt = DateTimeOffset.FromUnixTimeSeconds(param.ExpiresAt).UtcDateTime
        };

        return ApiResponse<SepayType.ResultEndpoint>.RequestSuccess(
            result,
            "Thông tin thanh toán hợp lệ.");
    }

    [HttpGet("check-order")]
    public async Task CheckOrder()
    {
        
    }
}

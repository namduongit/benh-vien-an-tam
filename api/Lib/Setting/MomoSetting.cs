namespace api.Lib.Setting;

public class MomoSetting
{
    public string PartnerCode { get; set; } = string.Empty;
    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string RedirectUrl { get; set; } = string.Empty;
    public string IpnUrl { get; set; } = string.Empty;
    public string RequestType = "captureWallet";
    public string ExtraData = "";

    // Endpoint
    public string MOMO_CREATE = "https://test-payment.momo.vn/v2/gateway/api/create";
}
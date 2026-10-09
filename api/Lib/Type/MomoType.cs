namespace api.Lib.Type;

public static class MomoType
{
    public class QuickPayRequest {
        public string OrderInfo { get; set; } = string.Empty;
        public string PartnerCode { get; set; } = string.Empty;
        public string RedirectUrl { get; set; } = string.Empty;
        public string IpnUrl { get; set; } = string.Empty;
        public int Amount { get; set; }
        public string OrderId { get; set; } = string.Empty;
        public string RequestId { get; set; } = string.Empty;
        public string RequestType { get; set; } = string.Empty;
        public string ExtraData { get; set; } = string.Empty;
        public bool AutoCapture { get; set; }
        public string Lang { get; set; } = string.Empty;
        public string Signature { get; set; } = string.Empty;
    }
}
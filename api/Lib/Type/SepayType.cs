namespace api.Lib.Type;

public static class SepayType
{
    public class CreateEndpoint
    {
        public string Provider = "Seapay";
        public int Amount { get; set; }
        public string Content { get; set; } = string.Empty;
        public string Endpoint { get; set; } = string.Empty;
        public long ExpiresAt { get; set; }
    }

    // http://localhost:3000/gateway/payment?orderId=9186cc19-9df5-4946-b5cb-a5e626f50ae5&amount=10000&orderInfo=SEVQRHD01&type=appointment&expiresAt=1791621521&signature=f90220e8342884e8631cedbfe55b53edc251d1821407accd975267b3b39feb79
    public class CheckEndpoint
    {
        public Guid OrderId { get; set; }
        public int Amount { get; set; }
        public string OrderInfo { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public long ExpiresAt { get; set; }
        public string Signature { get; set; } = string.Empty;
    }

    public class ResultEndpoint
    {
        public bool IsValid { get; set; }
        public string? ErrorMessage { get; set; } = null;
        public Guid OrderUuid { get; set; } 
        public string Type { get; set; } = string.Empty;
        public int Amount { get; set; }
        public string Content { get; set; } = string.Empty;
        public string PayUrl { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
    }

    public class IPNResponse
    {
        public string gateway { get; set; } = string.Empty;
        public string transactionDate { get; set; } = string.Empty;
        public string accountNumber { get; set; } = string.Empty;
        public string? subAccount { get; set; } = null;
        public string? code { get; set; } = null;
        public string content { get; set; } = string.Empty;
        public string transferType { get; set; } = string.Empty;
        public string description { get; set; } = string.Empty;
        public long transferAmount { get; set; }
        public string referenceCode { get; set; } = string.Empty;
        public long accumulated { get; set; }
        public long id { get; set; }
    }
}
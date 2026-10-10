using System.Security.Cryptography;
using System.Text;
using api.Lib.Setting;
using api.Lib.Type;
using Microsoft.Extensions.Options;

namespace api.Lib;

public sealed class Sepay(IOptions<SepaySetting> options)
{
    private readonly SepaySetting _setting = options.Value;

    /* 
    * @ Create Order Service
    - uuid: OrderUuid
    - code: the code used in order and stored in redis
    - value: cost to be paid
    - type: prescription or appointment
    */
    public SepayType.CreateEndpoint CreateEndpoint(Guid orderId, string code, string type, int value)
    {
        string orderInfo = "SEVQR" + code;
        int amount = value;
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(15).ToUnixTimeSeconds();

        var rawSignature =
        "accessKey=" + this._setting.AccessKey +
        "&amount=" + amount +
        "&orderId=" + orderId.ToString() +
        "&orderInfo" + orderInfo +
        "&type=" + type +
        "&partnerCode=" + this._setting.PartnerCode +
        "&expiresAt=" + expiresAt +
        "&redirectUrl" + this._setting.RedirectUrl;

        var signature = getSignature(rawSignature, this._setting.SignKey);

        string endpoint = this._setting.PartnerUrl;
        endpoint +=
        "?orderId=" + orderId.ToString() +
        "&amount=" + value +
        "&orderInfo=" + orderInfo +
        "&type=" + type +
        "&expiresAt=" + expiresAt +
        "&signature=" + signature;

        return new SepayType.CreateEndpoint
        {
            Amount = value,
            Content = orderInfo,
            Endpoint = endpoint,
            ExpiresAt = expiresAt
        };
    }

    public bool CheckSignature(SepayType.CheckEndpoint param)
    {
        var rawSignature =
        "accessKey=" + this._setting.AccessKey +
        "&amount=" + param.Amount +
        "&orderId=" + param.OrderId.ToString() +
        "&orderInfo" + param.OrderInfo +
        "&type=" + param.Type +
        "&partnerCode=" + this._setting.PartnerCode +
        "&expiresAt=" + param.ExpiresAt +
        "&redirectUrl" + this._setting.RedirectUrl;

        var expectedSignature = getSignature(rawSignature, this._setting.SignKey);

        if (param.Signature.Length != expectedSignature.Length)
        {
            return false;
        }

        return CryptographicOperations.FixedTimeEquals(
            Encoding.ASCII.GetBytes(param.Signature.ToLowerInvariant()),
            Encoding.ASCII.GetBytes(expectedSignature));
    }

    public string CreatePayUrl(int amount, string sevqr)
    {
        string payUrl = this._setting.PAY_URL;
        Console.WriteLine("Base url: "+ payUrl);

        payUrl = payUrl.Replace(this._setting.AMOUNT_KEY, amount.ToString());
        payUrl = payUrl.Replace(this._setting.SEVQR_KEY, Uri.EscapeDataString(sevqr));
        
        Console.WriteLine("After formating: "+ payUrl);

        return payUrl;
    }

    private static string getSignature(string text, string key)
    {
        ASCIIEncoding encoding = new ASCIIEncoding();

        Byte[] textBytes = encoding.GetBytes(text);
        Byte[] keyBytes = encoding.GetBytes(key);

        Byte[] hashBytes;

        using (HMACSHA256 hash = new HMACSHA256(keyBytes)) hashBytes = hash.ComputeHash(textBytes);
        return BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
    }
}

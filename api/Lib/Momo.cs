using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using api.Lib.Setting;
using api.Lib.Type;
using Microsoft.Extensions.Options;

namespace api.Lib;

public sealed class Momo
{
    private readonly HttpClient client = new HttpClient();
    private readonly MomoSetting _setting;

    public Momo(IOptions<MomoSetting> options)
    {
        this._setting = options.Value;
    }

    /*
    # Create Order Service
    - uuid: OrderUuid
    - content: the code used in order for charging and stored in redies
    - value: cost to be paid
    - version: number of payment requests made because MoMo does not allow a single order code [to be reused].
    */
    public async Task CreateOrder(Guid uuid, string content, int value, int version)
    {
        string requestId = Guid.NewGuid().ToString();
        string orderId = uuid.ToString() + "_" + version;

        MomoType.QuickPayRequest request = new MomoType.QuickPayRequest();
        request.OrderInfo = content;
        request.PartnerCode = this._setting.PartnerCode;
        request.RedirectUrl = this._setting.RedirectUrl;
        request.IpnUrl = this._setting.IpnUrl;
        request.Amount = value;
        request.OrderId = orderId;
        request.RequestId = requestId;
        request.RequestType = this._setting.RequestType;
        request.ExtraData = this._setting.ExtraData;
        request.AutoCapture = true;
        request.Lang = "vi";

        var rawSignature =
        "accessKey=" + this._setting.AccessKey +
        "&amount=" + request.Amount +
        "&extraData=" + request.ExtraData +
        "&ipnUrl=" + request.IpnUrl +
        "&orderId=" + request.OrderId +
        "&orderInfo=" + request.OrderInfo +
        "&partnerCode=" + request.PartnerCode +
        "&redirectUrl=" + request.RedirectUrl +
        "&requestId=" + request.RequestId +
        "&requestType=" + request.RequestType;

        request.Signature = getSignature(rawSignature, this._setting.SecretKey);

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

        StringContent httpContent = new StringContent(
            JsonSerializer.Serialize(request, options),
            System.Text.Encoding.UTF8,
            "application/json"
        );

        var quickPayResponse = await client.PostAsync(this._setting.MOMO_CREATE, httpContent);
        var contents = quickPayResponse.Content.ReadAsStringAsync().Result;
        Console.WriteLine(contents + "");
    }

    public void ReOrder()
    {

    }

    public void Refund()
    {

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
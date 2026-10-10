namespace api.Lib.Setting;

public class SepaySetting
{
    public string PartnerCode { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string AccessKey { get; set; } = string.Empty;
    public string SignKey { get; set; } = string.Empty;
    public string PartnerUrl { get; set; } = string.Empty;
    public string RedirectUrl { get; set; } = string.Empty;

    public string AMOUNT_KEY = "${AMOUNT}";
    public string SEVQR_KEY = "${SEVQR}";
    /* 
    - ${AMOUNT} = total price. Example 100000 => 100.000 VND
    - ${SEVQR} = SEVQR + CODE. Example SEQRHD001
    */
    public string PAY_URL = "https://vietqr.app/img?bank=VietinBank&acc=109881092754&template=&amount=${AMOUNT}&des=${SEVQR}&showinfo=false&holder=NGUYEN NAM DUONG";
}
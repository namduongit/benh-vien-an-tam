using api.Lib;
using Microsoft.AspNetCore.Mvc;

namespace api.Controller;

[ApiController]
[Route("api/momo")]
public class MomoController : ControllerBase
{
    private readonly Momo _momo;

    public MomoController(Momo momo)
    {
        this._momo = momo;
    }

    [HttpPost("testing")]
    public async Task TestTing()
    {
        Guid uuid = Guid.NewGuid();
        int version = 0;
        int value = 500000;
        string content = "RAAS8213";

        await this._momo.CreateOrder(uuid, content, value, version);
    }
}
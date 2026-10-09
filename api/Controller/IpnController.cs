using Microsoft.AspNetCore.Mvc;

namespace api.Controller;

[ApiController]
[Route("ipn")]
public class IpnController : ControllerBase
{
    [HttpPost("called")]
    public void IpnCall()
    {
        Console.WriteLine("Called");
    }
}
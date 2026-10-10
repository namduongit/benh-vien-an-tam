using api.Contract.Account;
using api.Service;
using Microsoft.AspNetCore.Mvc;

namespace api.Controller;

[ApiController]
[Route("api/admin/accounts")]
public sealed class AdminAccountsController(AccountService accountService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
        Ok(new { Message = "Lay danh sach tai khoan thanh cong", Data = await accountService.GetAccountsAsync(cancellationToken) });

    [HttpGet("options")]
    public async Task<IActionResult> GetOptions(CancellationToken cancellationToken) =>
        Ok(new { Message = "Lay lua chon tai khoan thanh cong", Data = await accountService.GetOptionsAsync(cancellationToken) });

    [HttpGet("{uuid:guid}")]
    public async Task<IActionResult> GetById(Guid uuid, CancellationToken cancellationToken)
    {
        var account = await accountService.GetAccountByIdAsync(uuid, cancellationToken);
        return account is null
            ? NotFound(new { Message = "Khong tim thay tai khoan" })
            : Ok(new { Message = "Lay thong tin tai khoan thanh cong", Data = account });
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateAccountRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var account = await accountService.CreateAccountAsync(request, cancellationToken);
            return Created($"api/admin/accounts/{account.Uuid}", new { Message = "Tao tai khoan thanh cong", Data = account });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { Message = exception.Message });
        }
    }

    [HttpPut("{uuid:guid}")]
    public async Task<IActionResult> Update(Guid uuid, UpdateAccountRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var account = await accountService.UpdateAccountAsync(uuid, request, cancellationToken);
            return account is null
                ? NotFound(new { Message = "Khong tim thay tai khoan" })
                : Ok(new { Message = "Cap nhat tai khoan thanh cong", Data = account });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { Message = exception.Message });
        }
    }

    [HttpDelete("{uuid:guid}")]
    public async Task<IActionResult> Delete(Guid uuid, CancellationToken cancellationToken) =>
        await accountService.DeleteAccountAsync(uuid, cancellationToken)
            ? Ok(new { Message = "Xoa tai khoan thanh cong" })
            : NotFound(new { Message = "Khong tim thay tai khoan" });

    [HttpPatch("{uuid:guid}/restore")]
    public async Task<IActionResult> Restore(Guid uuid, CancellationToken cancellationToken) =>
        await accountService.RestoreAccountAsync(uuid, cancellationToken)
            ? Ok(new { Message = "Khoi phuc tai khoan thanh cong" })
            : NotFound(new { Message = "Khong tim thay tai khoan" });
}

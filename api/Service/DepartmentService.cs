using api.Contract.Department;
using api.Lib;
using api.Model;
using Microsoft.EntityFrameworkCore;

namespace api.Service;

public sealed class DepartmentService(DBContext dbContext)
{
    public async Task<IReadOnlyList<DepartmentResponse>> GetDepartmentsAsync(
        CancellationToken cancellationToken)
    {
        var departments = await dbContext.Departments
            .AsNoTracking()
            .OrderByDescending(item => item.UpdatedAt)
            .ToListAsync(cancellationToken);

        return departments.Select(DepartmentResponse.FromModel).ToList();
    }

    public async Task<DepartmentResponse?> GetDepartmentByIdAsync(
        Guid uuid,
        CancellationToken cancellationToken)
    {
        var department = await dbContext.Departments
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Uuid == uuid, cancellationToken);

        return department is null ? null : DepartmentResponse.FromModel(department);
    }

    public async Task<DepartmentResponse> CreateDepartmentAsync(
        CreateDepartmentRequest request,
        CancellationToken cancellationToken)
    {
        var slug = request.Slug.Trim();
        await EnsureSlugAvailableAsync(slug, null, cancellationToken);

        var now = DateTime.UtcNow;
        var department = new Department
        {
            Uuid = Guid.NewGuid(),
            Icon = request.Icon.Trim(),
            Slug = slug,
            Name = request.Name.Trim(),
            Description = request.Description.Trim(),
            Status = request.Status,
            CreatedAt = now,
            UpdatedAt = now,
        };

        dbContext.Departments.Add(department);
        await dbContext.SaveChangesAsync(cancellationToken);
        return DepartmentResponse.FromModel(department);
    }

    public async Task<DepartmentResponse?> UpdateDepartmentAsync(
        Guid uuid,
        UpdateDepartmentRequest request,
        CancellationToken cancellationToken)
    {
        var department = await dbContext.Departments
            .FirstOrDefaultAsync(
                item => item.Uuid == uuid && item.DeletedAt == null,
                cancellationToken);
        if (department is null) return null;

        var slug = request.Slug.Trim();
        await EnsureSlugAvailableAsync(slug, uuid, cancellationToken);

        department.Icon = request.Icon.Trim();
        department.Slug = slug;
        department.Name = request.Name.Trim();
        department.Description = request.Description.Trim();
        department.Status = request.Status;
        department.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
        return DepartmentResponse.FromModel(department);
    }

    public async Task<bool> DeleteDepartmentAsync(Guid uuid, CancellationToken cancellationToken)
    {
        var department = await dbContext.Departments.FirstOrDefaultAsync(
            item => item.Uuid == uuid && item.DeletedAt == null,
            cancellationToken);
        if (department is null) return false;

        department.DeletedAt = DateTime.UtcNow;
        department.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> RestoreDepartmentAsync(Guid uuid, CancellationToken cancellationToken)
    {
        var department = await dbContext.Departments.FirstOrDefaultAsync(
            item => item.Uuid == uuid && item.DeletedAt != null,
            cancellationToken);
        if (department is null) return false;

        await EnsureSlugAvailableAsync(department.Slug, uuid, cancellationToken);
        department.DeletedAt = null;
        department.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task EnsureSlugAvailableAsync(
        string slug,
        Guid? excludedUuid,
        CancellationToken cancellationToken)
    {
        var exists = await dbContext.Departments.AnyAsync(
            item => item.Slug == slug &&
                    item.DeletedAt == null &&
                    (!excludedUuid.HasValue || item.Uuid != excludedUuid.Value),
            cancellationToken);
        if (exists) throw new InvalidOperationException("Slug chuyen khoa da ton tai");
    }
}

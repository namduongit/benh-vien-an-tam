using Microsoft.EntityFrameworkCore;
using api.Config;
using api.Data.Seed;
using api.Model;

namespace api.Lib;

public class DBContext : DbContext
{
    public DBContext(DbContextOptions<DBContext> options) : base(options)
    {
    }

    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<AppointmentMedicalService> AppointmentMedicalServices => Set<AppointmentMedicalService>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<DoctorDepartment> DoctorDepartments => Set<DoctorDepartment>();
    public DbSet<DoctorProfile> DoctorProfiles => Set<DoctorProfile>();
    public DbSet<DoctorWorking> DoctorWorkings => Set<DoctorWorking>();
    public DbSet<ExportTicket> ExportTickets => Set<ExportTicket>();
    public DbSet<ExportTicketDetail> ExportTicketDetails => Set<ExportTicketDetail>();
    public DbSet<Hospital> Hospitals => Set<Hospital>();
    public DbSet<HospitalDepartment> HospitalDepartments => Set<HospitalDepartment>();
    public DbSet<HospitalMedicalService> HospitalMedicalServices => Set<HospitalMedicalService>();
    public DbSet<HospitalWorking> HospitalWorkings => Set<HospitalWorking>();
    public DbSet<ImportTicket> ImportTickets => Set<ImportTicket>();
    public DbSet<ImportTicketDetail> ImportTicketDetails => Set<ImportTicketDetail>();
    public DbSet<MedicalService> MedicalServices => Set<MedicalService>();
    public DbSet<Medicine> Medicines => Set<Medicine>();
    public DbSet<MedicineInventory> MedicineInventories => Set<MedicineInventory>();
    public DbSet<MomoLog> MomoLogs => Set<MomoLog>();
    public DbSet<PatientProfile> PatientProfiles => Set<PatientProfile>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<Prescription> Prescriptions => Set<Prescription>();
    public DbSet<PrescriptionDetail> PrescriptionDetails => Set<PrescriptionDetail>();
    public DbSet<Provider> Providers => Set<Provider>();
    public DbSet<ReviewDoctor> ReviewDoctors => Set<ReviewDoctor>();
    public DbSet<ReviewHospital> ReviewHospitals => Set<ReviewHospital>();
    public DbSet<ReviewMedicalService> ReviewMedicalServices => Set<ReviewMedicalService>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<ServiceWorking> ServiceWorkings => Set<ServiceWorking>();
    public DbSet<TimeWorking> TimeWorkings => Set<TimeWorking>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            entityType.SetTableName(entityType.ClrType.Name);
        }

        modelBuilder.Entity<Account>(entity =>
        {
            entity.HasIndex(account => account.Phone).IsUnique();
            entity.Property(account => account.Phone).HasMaxLength(20);
            entity.Property(account => account.Password).HasMaxLength(512);
        });

        modelBuilder.Entity<PatientProfile>(entity =>
        {
            entity.HasIndex(profile => profile.AccountUuid).IsUnique();
            entity.HasIndex(profile => profile.Email).IsUnique();
            entity.Property(profile => profile.Email).HasMaxLength(254);
        });

        modelBuilder.Entity<DoctorProfile>()
            .HasIndex(profile => profile.AccountUuid)
            .IsUnique();

        modelBuilder.Entity<Role>()
            .HasIndex(role => role.Name)
            .IsUnique();

        ConfigureOneToMany<Account, Role>(modelBuilder, nameof(Account.RoleUuid));
        ConfigureOneToMany<Account, Hospital>(modelBuilder, nameof(Account.HospitalUuid));
        ConfigureOneToOne<PatientProfile, Account>(modelBuilder, nameof(PatientProfile.AccountUuid));
        ConfigureOneToOne<DoctorProfile, Account>(modelBuilder, nameof(DoctorProfile.AccountUuid));
        ConfigureOneToMany<DoctorProfile, Hospital>(modelBuilder, nameof(DoctorProfile.HospitalUuid));
        ConfigureOneToMany<DoctorDepartment, DoctorProfile>(modelBuilder, nameof(DoctorDepartment.DoctorUuid));
        ConfigureOneToMany<DoctorDepartment, Department>(modelBuilder, nameof(DoctorDepartment.DepartmentUuid));
        ConfigureOneToMany<Room, Hospital>(modelBuilder, nameof(Room.HospitalUuid));
        ConfigureOneToMany<HospitalDepartment, Hospital>(modelBuilder, nameof(HospitalDepartment.HospitalUuid));
        ConfigureOneToMany<HospitalDepartment, Department>(modelBuilder, nameof(HospitalDepartment.DepartmentUuid));
        ConfigureOneToMany<HospitalMedicalService, Hospital>(modelBuilder, nameof(HospitalMedicalService.HospitalUuid));
        ConfigureOneToMany<HospitalMedicalService, MedicalService>(modelBuilder, nameof(HospitalMedicalService.MedicalServiceUuid));
        ConfigureOneToMany<ReviewHospital, PatientProfile>(modelBuilder, nameof(ReviewHospital.PatientUuid));
        ConfigureOneToMany<ReviewHospital, Hospital>(modelBuilder, nameof(ReviewHospital.HospitalUuid));
        ConfigureOneToMany<ReviewDoctor, PatientProfile>(modelBuilder, nameof(ReviewDoctor.PatientUuid));
        ConfigureOneToMany<ReviewDoctor, DoctorProfile>(modelBuilder, nameof(ReviewDoctor.DoctorUuid));
        ConfigureOneToMany<ReviewMedicalService, PatientProfile>(modelBuilder, nameof(ReviewMedicalService.PatientUuid));
        ConfigureOneToMany<ReviewMedicalService, MedicalService>(modelBuilder, nameof(ReviewMedicalService.MedicalServiceUuid));
        ConfigureOneToMany<MedicineInventory, Hospital>(modelBuilder, nameof(MedicineInventory.HospitalUuid));
        ConfigureOneToMany<MedicineInventory, Medicine>(modelBuilder, nameof(MedicineInventory.MedicineUuid));
        ConfigureOneToMany<ImportTicket, Hospital>(modelBuilder, nameof(ImportTicket.HospitalUuid));
        ConfigureOneToMany<ImportTicket, Account>(modelBuilder, nameof(ImportTicket.AccountUuid));
        ConfigureOneToMany<ImportTicket, Provider>(modelBuilder, nameof(ImportTicket.ProviderUuid));
        ConfigureOneToMany<ImportTicketDetail, ImportTicket>(modelBuilder, nameof(ImportTicketDetail.ImportTicketUuid));
        ConfigureOneToMany<ImportTicketDetail, Medicine>(modelBuilder, nameof(ImportTicketDetail.MedicineUuid));
        ConfigureOneToMany<ExportTicket, Hospital>(modelBuilder, nameof(ExportTicket.HospitalUuid));
        ConfigureOneToMany<ExportTicket, Account>(modelBuilder, nameof(ExportTicket.AccountUuid));
        ConfigureOneToMany<ExportTicketDetail, ExportTicket>(modelBuilder, nameof(ExportTicketDetail.ExportTicketUuid));
        ConfigureOneToMany<ExportTicketDetail, Medicine>(modelBuilder, nameof(ExportTicketDetail.MedicineUuid));
        ConfigureOneToMany<Prescription, PatientProfile>(modelBuilder, nameof(Prescription.PatientProfileUuid));
        ConfigureOneToMany<Prescription, DoctorProfile>(modelBuilder, nameof(Prescription.DoctorProfileUuid));
        ConfigureOneToMany<Prescription, Hospital>(modelBuilder, nameof(Prescription.HospitalUuid));
        ConfigureOneToMany<Prescription, Appointment>(modelBuilder, nameof(Prescription.AppointmentUuid));
        ConfigureOneToMany<PrescriptionDetail, Prescription>(modelBuilder, nameof(PrescriptionDetail.PrescriptionUuid));
        ConfigureOneToMany<PrescriptionDetail, Medicine>(modelBuilder, nameof(PrescriptionDetail.MedicineUuid));
        ConfigureOneToMany<Appointment, PatientProfile>(modelBuilder, nameof(Appointment.PatientUuid));
        ConfigureOneToMany<Appointment, Hospital>(modelBuilder, nameof(Appointment.HospitalUuid));
        ConfigureOneToMany<Appointment, DoctorProfile>(modelBuilder, nameof(Appointment.DoctorUuid));
        ConfigureOneToMany<Appointment, MedicalService>(modelBuilder, nameof(Appointment.MedicalServiceUuid));
        ConfigureOneToMany<Appointment, Room>(modelBuilder, nameof(Appointment.RoomUuid));
        ConfigureOneToMany<Appointment, TimeWorking>(modelBuilder, nameof(Appointment.TimeSlot));
        ConfigureOneToMany<AppointmentMedicalService, Appointment>(modelBuilder, nameof(AppointmentMedicalService.AppointmentUuid));
        ConfigureOneToMany<AppointmentMedicalService, MedicalService>(modelBuilder, nameof(AppointmentMedicalService.MedicalServiceUuid));
        ConfigureOneToMany<RolePermission, Role>(modelBuilder, nameof(RolePermission.RoleUuid));
        ConfigureOneToMany<RolePermission, Permission>(modelBuilder, nameof(RolePermission.PermissionUuid));
        ConfigureOneToMany<DoctorWorking, DoctorProfile>(modelBuilder, nameof(DoctorWorking.DoctorUuid));
        ConfigureOneToMany<DoctorWorking, TimeWorking>(modelBuilder, nameof(DoctorWorking.WorkingUuid));
        ConfigureOneToMany<HospitalWorking, Hospital>(modelBuilder, nameof(HospitalWorking.HospitalUuid));
        ConfigureOneToMany<HospitalWorking, TimeWorking>(modelBuilder, nameof(HospitalWorking.WorkingUuid));
        ConfigureOneToMany<ServiceWorking, MedicalService>(modelBuilder, nameof(ServiceWorking.ServiceUuid));
        ConfigureOneToMany<ServiceWorking, TimeWorking>(modelBuilder, nameof(ServiceWorking.WorkingUuid));

        modelBuilder.Entity<Role>().HasData(new Role
        {
            Uuid = AuthConstants.PatientRoleUuid,
            Name = AuthConstants.PatientRoleName,
            Description = "Tai khoan nguoi benh",
            Status = api.Model.Enum.BaseStatus.Active,
            CreatedAt = DateTime.UnixEpoch,
            UpdatedAt = DateTime.UnixEpoch
        });
        modelBuilder.Entity<Permission>().HasData(PermissionSeed.Permissions);

        modelBuilder.Entity<Hospital>().HasData(HospitalSeed.Hospitals);
    }

    private static void ConfigureOneToMany<TDependent, TPrincipal>(
        ModelBuilder modelBuilder,
        string foreignKey)
        where TDependent : class
        where TPrincipal : class
    {
        modelBuilder.Entity<TDependent>()
            .HasOne<TPrincipal>()
            .WithMany()
            .HasForeignKey(foreignKey)
            .OnDelete(DeleteBehavior.NoAction);
    }

    private static void ConfigureOneToOne<TDependent, TPrincipal>(
        ModelBuilder modelBuilder,
        string foreignKey)
        where TDependent : class
        where TPrincipal : class
    {
        modelBuilder.Entity<TDependent>()
            .HasOne<TPrincipal>()
            .WithOne()
            .HasForeignKey<TDependent>(foreignKey)
            .OnDelete(DeleteBehavior.NoAction);
    }
}

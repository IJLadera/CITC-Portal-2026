from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.
class User(AbstractUser): 
    faculty_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    # Django’s AbstractUser already has:
    # username, first_name, last_name, email, password, is_active, is_staff, etc.
    prefix = models.CharField(max_length=255, blank=True, null=True)
    suffix = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True) 
    signature = models.ImageField(
        upload_to="signatures/",
        blank=True,
        null=True
    )     
    email_verified_at = models.DateTimeField(blank=True, null=True)
    password_reset_requested_at = models.DateTimeField(blank=True, null=True)  \
    
    USERNAME_FIELD = "faculty_id"
    REQUIRED_FIELDS = ["email"]
    
    def __str__(self):
        return f"{self.faculty_id or self.username} ({self.email})"
    
    def has_role(self, role_name):
        return self.user_roles.filter(role__name=role_name).exists()
    
    def get_full_name(self) -> str:
        """
        Returns the user's full name including prefix and suffix if available.
        Example: 'Dr. Juan Dela Cruz Jr.'
        """
        parts = []
        if self.prefix:
            parts.append(self.prefix.strip())
        if self.first_name:
            parts.append(self.first_name.strip())
        if self.last_name:
            parts.append(self.last_name.strip())
        if self.suffix:
            parts.append(self.suffix.strip())
        
        # Join with spaces and remove any double spaces just in case
        return " ".join(parts).strip()


class Role(models.Model):
    ROLE_CHOICES = [
        ("ADMIN", "Admin"),
        ("AUDITOR", "Auditor"),
        ("CHAIRPERSON", "Chairperson"),
        ("DEAN", "Dean"), 
        ("BAYANIHAN_TEACHER", "Bayanihan Teacher"),
        ("BAYANIHAN_LEADER", "Bayanihan Leader"),
    ]

    name = models.CharField(max_length=50, choices=ROLE_CHOICES, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.get_name_display()
    
    
class UserRole(models.Model): 
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="user_roles"
    )
    role = models.ForeignKey(
        Role, on_delete=models.CASCADE, related_name="role_users"
    )
    entity_type = models.CharField(max_length=255, blank=True, null=True)
    entity_id = models.PositiveBigIntegerField(blank=True, null=True)
    start_validity = models.DateField(blank=True, null=True)    
    end_validity = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "role")  # prevents duplicate roles

    def __str__(self):
        return f"{self.user.first_name} → {self.role.name}"
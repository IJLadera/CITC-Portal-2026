import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


from .managers import CustomUserManager

class Role(models.Model):
    uuid = models.UUIDField(unique=True, primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    
    def __str__(self):
        super.__str__()
        return self.name

class User(AbstractUser):
    username = None
    email = models.EmailField(_("email address"), unique=True)
    uuid = models.UUIDField(unique=True, primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=255, blank=True)
    last_name = models.CharField(max_length=255, blank=True)
    middle_name = models.CharField(max_length=100, blank=True, null=True)
    suffix = models.CharField(max_length=10, blank=True)
    id_number = models.CharField(max_length=50)
    date_of_birth = models.DateField(null=True)
    avatar = models.ImageField(null=True, upload_to='avatar/', blank=True)

    is_student = models.BooleanField(default=False)
    is_employee = models.BooleanField(default=False)
    is_develop = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    roles = models.ManyToManyField(Role, through='UserRole')
    date_joined = models.DateTimeField(default=timezone.now)
    department = models.ForeignKey('lms.Department', on_delete=models.SET_NULL, null=True)


    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = [
        'first_name',
        'last_name',
        'id_number',
    ]

    objects = CustomUserManager()

    def __str__(self):
        return self.email


class UserRole(models.Model):
    user = models.ForeignKey(User, on_delete=models.PROTECT)
    role = models.ForeignKey(Role, on_delete=models.PROTECT)
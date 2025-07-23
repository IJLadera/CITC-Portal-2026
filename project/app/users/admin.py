from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Role, UserRole
from django.utils.translation import gettext_lazy as _
# Register your models here.

from .forms import CreateUserForm, UserChangeForm
from .models import User

@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    add_form = CreateUserForm
    form = UserChangeForm
    model = User

    ordering = ('email', 'id_number')
    list_display = [
        'email',
        'id_number',
        'first_name',
        'last_name',
        'is_staff'
    ]
    search_fields = ('email', 'id_number')

    fieldsets = (
        (None, {'fields' : ('email', 'password')}),
        (_('Personal info'), {'fields' : ('first_name', 'last_name', 'middle_name', 'suffix', 'id_number', 'date_of_birth', 'avatar')}),
        (_('Permissions'), {
            'fields' : ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        (_('Roles & Status'),{'fields' : ('is_student', 'is_employee', 'is_develop', 'is_bayanihan_leader', 'is_registrar')}),
        (_('Organization'), {'fields' : ('department', 'section', 'organization')}),
        (_('Important dates'), {'fields' : ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes' : ('wide',),
            'fields' : (
                'email',
                'first_name',
                'last_name',
                'id_number',
                'department',
                'is_student',
                'is_staff',
                'is_superuser',
                'password1',
                'password2',
            ),
        }),
    )


admin.site.register(Role)
admin.site.register(UserRole)

from django.contrib import admin
from .models import App

@admin.register(App)
class AppAdmin(admin.ModelAdmin):
    list_display = ['name', 'url', 'is_active', 'is_visible_to_users', 'display_order', 'created_at']
    list_filter = ['is_active', 'is_visible_to_users', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['display_order', 'name']
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'url')
        }),
        ('Design', {
            'fields': ('logo', 'logo_url')
        }),
        ('Settings', {
            'fields': ('is_active', 'is_visible_to_users', 'display_order')
        }),
        ('Metadata', {
            'fields': ('uuid', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ['uuid', 'created_at', 'updated_at']
 

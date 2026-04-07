from rest_framework import serializers
from .models import App


class AppSerializer(serializers.ModelSerializer):
    class Meta:
        model = App
        fields = [
            'uuid',
            'name',
            'description',
            'logo',
            'logo_url',
            'url',
            'is_active',
            'is_visible_to_users',
            'display_order',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['uuid', 'created_at', 'updated_at']


class AppDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = App
        fields = '__all__'
        read_only_fields = ['uuid', 'created_at', 'updated_at']

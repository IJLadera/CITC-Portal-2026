from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Consultation

User = get_user_model()

class ConsultationUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id_number', 'first_name', 'last_name']

class ConsultationSerializers(serializers.ModelSerializer):
    students = ConsultationUserSerializer(many=True) 
    class Meta:
        model = Consultation
        fields = '__all__'
    
    def create(self, validated_data):
        data = super().create(validated_data)
        
        # create consultation
        
        # insert students herej=

        return data

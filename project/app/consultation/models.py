from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


# Create your models here.
class Consultation(models.Model):
    instructor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    students = models.ManyToManyField(User)
    purpose = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'consultation'

from django.db import models
from academics.models import Course
from users.models import User

# Create your models here.
class BayanihanGroup(models.Model):  
    school_year = models.CharField(max_length=9)  # e.g., "2024-2025"
    course = models.ForeignKey(
        Course, on_delete=models.PROTECT, related_name="bayanihan_groups"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True) 

    def __str__(self):
        return f"{self.course.course_code} - {self.school_year} - {self.course.course_semester}"

        
class BayanihanGroupUser(models.Model): 
    ROLE_CHOICES = [
        ("LEADER", "Leader"),
        ("TEACHER", "Teacher"),
    ]

    user = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="bayanihan_memberships"
    )
    group = models.ForeignKey(
        BayanihanGroup, on_delete=models.CASCADE, related_name="bayanihan_members"
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES) 
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "group", "role")  

    def __str__(self):
        role_display = dict(self.ROLE_CHOICES).get(self.role, self.role)
        return f"{self.user.username} as {role_display} in {self.group}"
from django.db import models
# from app.users.models import User

# Create your models here.
class College(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10)

    def __str__(self):
        return self.name


class Department(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10)
    college = models.ForeignKey(College, on_delete=models.PROTECT, related_name="departments")

    def __str__(self):
        return self.name
    

class SchoolYear(models.Model):
    name = models.CharField(max_length=50)
    startYear = models.IntegerField(null=True)
    endYear = models.IntegerField(null=True)

    def __str__(self):
        return self.name


class YearLevel(models.Model):
    level = models.CharField(max_length=10)

    def __str__(self):
        super().__str__()
        return self.level

class Section(models.Model):
    tblYearLevel = models.ForeignKey(YearLevel, on_delete=models.CASCADE, null=True, blank=True)
    section = models.CharField(max_length=10)

    def __str__(self):
        return self.section


class Subject(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True)
    year_level = models.ForeignKey(YearLevel, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        super().__str__()
        return self.name


class Class(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, null=True)
    school_year = models.ForeignKey(SchoolYear, on_delete=models.CASCADE)
    year_level = models.ForeignKey(YearLevel, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    section = models.ForeignKey(Section, on_delete=models.CASCADE)
    teacher = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='teacher')
    students = models.ManyToManyField('users.User', related_name='student')
    is_active = models.BooleanField(default=True)


    def __str__(self) -> str:
        return '{}-{} ({})'.format(self.year_level, self.section, self.subject)

class Status(models.Model):
    name = models.CharField(max_length=15)

    def __str__(self) -> str:
        return self.name


class Attendance(models.Model):
    student = models.ForeignKey('users.User', on_delete=models.CASCADE)
    classroom = models.ForeignKey(Class, on_delete=models.CASCADE, null=True)
    status = models.ForeignKey(Status, on_delete=models.CASCADE, null=True)
    is_present = models.BooleanField(default=False)
    date = models.DateField()

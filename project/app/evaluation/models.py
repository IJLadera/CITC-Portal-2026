from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MaxValueValidator, MinValueValidator

# Create your models here.
User = get_user_model()

class QuestionnaireType(models.Model):
    name = models.CharField(max_length=100)

    class Meta:
        db_table = 'questionnaire_type'

class Questionnaire(models.Model):
    name = models.CharField(max_length=255)
    slug = models.CharField(max_length=255, unique=True)
    type = models.ForeignKey(QuestionnaireType, on_delete=models.CASCADE, related_name='type')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'questionnaire'

    def __str__(self) -> str:
        return '{}'.format(self.slug)

class QuestionType(models.Model):
    name = models.CharField(max_length=255)

    class Meta:
        db_table = 'question_type'

    def __str__(self) -> str:
        return '{}'.format(self.name)


class QuestionCategory(models.Model):
    name = models.CharField(max_length=255)
    category_code = models.CharField(max_length=50, null=True, blank=True, unique=True)

    class Meta:
        db_table = 'question_category'

    def __str__(self) -> str:
        return '{}'.format(self.name)


class Question(models.Model):
    question = models.TextField()
    questionnaire = models.ForeignKey(Questionnaire, on_delete=models.SET_NULL, null=True)
    category = models.ForeignKey(QuestionCategory, on_delete=models.SET_NULL)
    correct_answer = models.TextField(null=True)
    question_type = models.ForeignKey(QuestionType, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'question'

class Choices(models.Model):
    choice = models.TextField()
    question = models.ForeignKey(Question, on_delete=models.SET_NULL, null=True)

    class Meta:
        db_table = 'choices'
    
    def __str__(self) -> str:
        return '{}'.format(self.choice)

class ShortAnswer(models.Model):
    question = models.ForeignKey(Question, on_delete=models.SET_NULL, null=True, related_name='short_answer_question')
    text = models.TextField()

    class Meta:
        db_table = 'short_answer'

    def __str__(self) -> str:
        return '{}'.format(self.question)

class StudentAnswer(models.Model):
    student = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='student')
    classroom = models.ForeignKey('lms.Class', on_delete=models.RESTRICT)
    instructor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='instructor')
    question = models.ForeignKey(Question, on_delete=models.SET_NULL, null=True)
    anonymity = models.CharField(max_length=150, null=True, blank=True)
    answer_choice = models.ForeignKey(Choices, on_delete=models.SET_NULL, null=True, related_name='answer_choice')
    short_answer = models.ForeignKey(ShortAnswer, on_delete=models.SET_NULL, null=True, related_name='short_answer')
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True)
    comment = models.TextField(null=True, blank=True)


    class Meta:
        db_table = 'student_answer'




    

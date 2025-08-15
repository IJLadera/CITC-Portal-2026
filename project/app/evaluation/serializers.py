import hashlib
import hmac

from rest_framework import serializers
from django.contrib.auth import get_user_model
from app.lms.serializers import DepartmentSerializer
from .models import (
    QuestionnaireType,
    Questionnaire,
    QuestionType,
    QuestionCategory,
    Question,
    Choices,
    ShortAnswer,
    StudentAnswer
)
from app.lms.models import Class

User = get_user_model()

def has_id_number(id_number:str, salt: str='secret_nako') -> str:
    return hmac.new(salt.encode(), id_number.encode(), hashlib.sha256).hexdigest()

class QuestionnaireTypeSerializers(serializers.ModelSerializer):
    class Meta:
        model = QuestionnaireType
        fields = '__all__'

class QuestionnaireSerializer(serializers.ModelSerializer):
    class Meta:
        model = Questionnaire
        fields = ['slug']

class QuestionTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionType
        fields = ['name']

class QuestionSerializer(serializers.ModelSerializer):
    category = QuestionCategory(read_only=True)
    question_type = QuestionTypeSerializer(read_only=True)
    questionnaire = QuestionnaireSerializer(read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'question', 'questionnaire', 'category', 'question_type']


class ChoicesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choices
        fields = '__all__'


class ShortAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShortAnswer
        fields = '__all__'

class SectionEvaluationSerializer(serializers.ModelSerializer):
    department = 


class ClassEvaluationSerializer(serializers.ModelSerializer):
    section = SectionEvaluationSerializer(read_only=True)



class StudentAnswerSerializer(serializers.ModelSerializer):
    question = QuestionSerializer(read_only=True)

    class Meta:
        model = StudentAnswer
        fields = ['id', 'rating', 'question', 'comment', 'answer_choice', 'short_answer', 'classroom']



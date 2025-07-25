from django import forms
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from django.contrib.auth.password_validation import validate_password
from .models import User


class CreateUserForm(forms.ModelForm):
    password1 = forms.CharField(label="Password", widget=forms.PasswordInput)
    password2 = forms.CharField(label="Confirm Password", widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ['id_number', 'email', 'first_name', 'last_name', 'department']

    def clean_password(self):
        pw1 = self.cleaned_data.get('password1')
        pw2 = self.cleaned_data.get('password2')

        if pw1 and pw2:
            if pw1 != pw2:
                raise forms.ValidationError('Password did not match!')
            validate_password(pw1, self.instance)
        return pw2
    
    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data.get("password1"))
        if commit:
            user.save()
        return user


class UserChangeForm(forms.ModelForm):
    password = ReadOnlyPasswordHashField()

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'id_number', 'department']

    def clean_password(self):
        return self.initial.get('password')


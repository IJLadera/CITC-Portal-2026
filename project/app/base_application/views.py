from django.shortcuts import render
from django.views import generic

class BaseApplication(generic.TemplateView):
    template_name = 'index.html'
    

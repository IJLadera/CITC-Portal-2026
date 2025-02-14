from django.apps import AppConfig


class EventConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'app.unieventify'

    def ready(self):
        import app.unieventify.signals

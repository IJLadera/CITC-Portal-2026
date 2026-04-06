from django.apps import AppConfig


class SyllabiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'syllabi'

    def ready(self):
        import syllabi.audits  # make sure auditlog.register runs
        import syllabi.signals

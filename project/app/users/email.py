from djoser.email import PasswordResetEmail as BasePasswordResetEmail, default_token_generator, settings
from djoser import utils


class PasswordResetEmail(BasePasswordResetEmail):
    
    template_name = 'email/password_reset.html'

    def get_context_data(self):
        context = super().get_context_data()
        
        user = context.get("user")
        context['uid'] = utils.encode_uid(user.pk)
        context['token'] = default_token_generator.make_token(user)
        context["url"] = settings.PASSWORD_RESET_CONFIRM_URL.format(**context)

        return context

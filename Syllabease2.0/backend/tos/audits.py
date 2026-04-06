from auditlog.registry import auditlog
from .models import (
    TOS, TOSRow
)

# Register all models you want to audit
auditlog.register(TOS)
auditlog.register(TOSRow) 

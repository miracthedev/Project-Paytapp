# auth/__init__.py

# .auth (yani aynı klasördeki auth.py dosyası) içindeki fonksiyonları içe aktarıyoruz
from .auth import (
    create_access_token,
    get_current_user,
    get_password_hash,
    require_role,
    verify_password,
)

# Dışarıdan "from auth import *" yapıldığında nelerin erişilebilir 
# olacağını açıkça belirtmek (Best Practice)
__all__ = [
    "create_access_token",
    "get_current_user",
    "get_password_hash",
    "require_role",
    "verify_password",
]
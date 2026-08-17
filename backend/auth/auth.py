import os
from typing import TYPE_CHECKING, Annotated

from dotenv import load_dotenv
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from jwt.exceptions import InvalidTokenError
from datetime import datetime, timedelta, timezone
from sqlmodel import Session, select

from sql import get_session
# Projenizdeki Enum sınıfını (UserRoles) da import ediyoruz
from models.User import User, UserRoles

if TYPE_CHECKING:
    pass

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

password_hash = PasswordHash((Argon2Hasher(),))

load_dotenv()

# .env dosyası bulunamazsa çökmemesi için geçici bir string ekledik
SECRET_KEY = os.getenv("SECRET_KEY_FOR_TOKEN", "super-secret-dev-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


def get_password_hash(password: str) -> str:
    """Hashes a password before saving it to the database."""
    return password_hash.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Checks if the provided password matches the database hash."""
    return password_hash.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    """Generates a JWT token valid for a specific duration."""

    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)], 
    session: Annotated[Session, Depends(get_session)]
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str | None = payload.get("sub")
        if email is None:
            raise credentials_exception
            
    except InvalidTokenError:
        raise credentials_exception
        
    user = session.exec(select(User).where(User.email == email)).first()
    if user is None:
        raise credentials_exception
        
    return user

# Buradaki parametreyi UserRoles (StrEnum sınıfınız) olarak güncelledik
def require_role(required_role: UserRoles):
    """Creates a dependency that strictly enforces a specific user role."""
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action"
            )
        return current_user
    return role_checker
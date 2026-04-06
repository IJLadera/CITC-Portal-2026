# utils/spaces.py
import boto3
from botocore.client import Config
from django.conf import settings

def upload_to_spaces(file_obj, file_name: str):
    session = boto3.session.Session()
    # if type == "profile_picture":
    client = session.client(
        "s3",
        region_name=settings.STORAGES["default"]["OPTIONS"]["region_name"],
        endpoint_url=settings.STORAGES["default"]["OPTIONS"]["endpoint_url"],
        aws_access_key_id=settings.STORAGES["default"]["OPTIONS"]["access_key"],
        aws_secret_access_key=settings.STORAGES["default"]["OPTIONS"]["secret_key"], 
        config=Config(signature_version="s3v4")
    )

    client.upload_fileobj(
        Fileobj=file_obj,
        Bucket=settings.STORAGES["default"]["OPTIONS"]["bucket_name"],
        Key=file_name,
        ExtraArgs={"ACL": "public-read"}  # make file public
    )
    
    # Return the public URL of the uploaded file
    return f"https://{settings.STORAGES["default"]["OPTIONS"]["bucket_name"]}.{settings.STORAGES["default"]["OPTIONS"]["region_name"]}.digitaloceanspaces.com/{file_name}"
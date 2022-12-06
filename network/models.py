from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    following = models.ManyToManyField("User", blank=True, null=True, symmetrical=False, related_name='followers')

    def serialize(self):
        return {
            "id": self.id,
            "username": self.username,
            "followers": self.followers.all().count(),
            "followings": self.following.all().count(),
        }


class Post(models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name='posts')
    body = models.TextField(max_length=264)
    timestamp = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField("User", blank=True, null=True, related_name="post_likes")

    def __str__(self):
        return f'Post {self.id}: {self.user}'

    def serialize(self):
        return {
            "id": self.id,
            "user": self.user.username,
            "user_id": self.user.id,
            "body": self.body,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "users_liked_post": [user.serialize() for user in self.likes.all()],
            "num_likes": self.likes.all().count(),
        }
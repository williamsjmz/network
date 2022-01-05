from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    def serialize(self):
        return {
            "id": self.id,
            "username": self.username,
            "followers": self.followers.count(),
            "follow_to": self.following.count(),
        }


class Post(models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name='posts')
    body = models.TextField(max_length=264)
    timestamp = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField("User", related_name="posts_liked", blank=True, null=True)

    def __str__(self):
        return f'Post {self.id}: {self.user}'

    def serialize(self):
        return {
            "id": self.id,
            "user": self.user.username,
            "user_id": self.user.id,
            "body": self.body,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "likes": self.likes.count()
        }


class Follow(models.Model):
    follow_from = models.ForeignKey("User", on_delete=models.CASCADE, related_name="followers") # Seguidor
    follow_to = models.ForeignKey("User", on_delete=models.CASCADE, related_name="following") # Seguido
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.follow_from.user.username} follows {self.follow_to.user.username}'
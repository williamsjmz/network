
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    # API Routes
    path("create_post", views.create_post, name="create_post"),
    path("posts/<str:box>/<int:user_id>/<int:page_number>", views.box, name="box"),
    path("profile/<int:user_id>", views.profile, name="profile"),
    path("follow/<int:following_user_id>", views.follow, name="follow"),
    path("unfollow/<int:unfollowing_user_id>", views.unfollow, name="unfollow"),
    path("edit_post/<int:post_id>", views.edit_post, name="edit_post"),
    path("like_post/<int:post_id>", views.like_post, name="like_post"),
    path("unlike_post/<int:post_id>", views.unlike_post, name="unlike_post"),
]

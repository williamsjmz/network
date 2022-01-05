from django.shortcuts import render

# Create your views here.
import json

from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required

from .models import User, Post


def index(request):

    # Authenticated users view their index page
    if request.user.is_authenticated:
        return render(request, "network/index.html", {
            "user_id": request.user.id,
        })

    # Everyone else is prompted to sign in
    else:
        return HttpResponseRedirect(reverse("login"))


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

@csrf_exempt
@login_required
def create_post(request):

    # Creating a new post must be via POST
    if request.method != 'POST':
        return JsonResponse({"error": "POST request required."}, status=400)

    # Get data
    data = json.loads(request.body)
    body = data.get('body')

    # Create post
    post = Post.objects.create(user=request.user, body=body)
    post.save()

    return JsonResponse({"message": "Post created successfully."}, status=201)

@login_required
def box(request, box, user_id):

    # Filter posts returned based on box name
    if box == "all-posts":
        posts = Post.objects.all()
    elif box == "profile":
        user = User.objects.get(id=user_id)
        posts = Post.objects.filter(
            user=user
        )
    elif box == "following":
        pass
    else:
        return JsonResponse({"error": "Invalid box."}, status=400)

    # Return posts in reverse chronological order
    posts = posts.order_by("-timestamp").all()
    todo = [post.serialize() for post in posts]
    todo.append(True)
    return JsonResponse([post.serialize() for post in posts], safe=False)

@login_required
def profile(request, user_id):
    if user_id == request.user.id:
        current_user = True

    else:
        current_user = False
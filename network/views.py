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
from django.core.paginator import Paginator

from .models import User, Post


def index(request):

    #Get current page
    #current_page = request.session.get('current_page')
    #if current_page is None:
        #current_page = 1
    #request.session['current_page'] = 1

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
        return JsonResponse({"error": "POST request required."}, status=500)

    # Get data
    data = json.loads(request.body)
    body = data.get('body')

    # Create post
    post = Post.objects.create(user=request.user, body=body)
    post.save()

    return JsonResponse({"message": "Post created successfully."}, status=201)

@login_required
def box(request, box, user_id, page_number):

    # Filter posts returned based on box name
    if box == "all-posts":
        try:
            posts = Post.objects.all()
        except:
            return JsonResponse({"error": "An unexpected error ocurred."}, status=500)
    elif box == "profile":
        try:
            user = User.objects.get(id=user_id)
            posts = Post.objects.filter(
                user=user
            )
        except:
            return JsonResponse({"error": "An unexpected error ocurred."}, status=500)
    elif box == "following":
        try:
            # Get following users
            following_users = request.user.following.all()
        
            # Get posts by following users
            posts = Post.objects.filter(
                user__in=following_users
            )
        except:
            return JsonResponse({"error": "An unexpected error ocurred."}, status=500)
    else:
        return JsonResponse({"error": "Invalid box."}, status=500)

    # Return posts in reverse chronological order
    posts = posts.order_by("-timestamp").all()

    # Makes pagination
    p = Paginator(posts, 10)
    current_page_posts = p.get_page(page_number) 

    #todo = [post.serialize() for post in posts]
    #todo.append(True)

    # Making the response
    posts = []
    for post in current_page_posts:
        new_post = post.serialize()
        if request.user.serialize() in new_post['users_liked_post']:
            new_post['liked'] = True
        else:
            new_post['liked'] = False
        posts.append(new_post)

    # Adding aditional data to the response
    data = {}
    data['posts'] = posts
    data['has_previous'] = current_page_posts.has_previous()
    data['has_next'] = current_page_posts.has_next()
    data['current_page'] = current_page_posts.number
    data['number_of_pages'] = current_page_posts.paginator.num_pages

    if (data['has_previous']):
        data['previous_page_number'] = current_page_posts.previous_page_number()
    
    if (data['has_next']):
        data['next_page_number'] = current_page_posts.next_page_number()

    return JsonResponse(data, safe=False)

@login_required
def profile(request, user_id):
    
    # Get the number of followers and following
    user = User.objects.get(id=user_id)
    data = user.serialize()

    if user_id == request.user.id:
        data['current_user'] = True
    else:
        data['current_user'] = False
        data['following'] = (User.objects.get(id=request.user.id) in user.followers.all())
    
    return JsonResponse(data, status=201)

@login_required
def follow(request, following_user_id):

    # Get users
    follower_user = User.objects.get(id=request.user.id)
    following_user = User.objects.get(id=following_user_id)

    # Add follow
    try:
        follower_user.following.add(following_user)
    except:
        return JsonResponse({"error": "An unexpected error ocurred."}, status=500)

    return JsonResponse({"message": "Followed successfully."}, status=201)


@login_required
def unfollow(request, unfollowing_user_id):

    # Get users
    follower_user = User.objects.get(id=request.user.id)
    unfollowing_user = User.objects.get(id=unfollowing_user_id)

    # Add follow
    try:
        follower_user.following.remove(unfollowing_user)
    except:
        return JsonResponse({"error": "An unexpected error ocurred."}, status=500)

    return JsonResponse({"message": "Unfollowed successfully."}, status=201)


@login_required
@csrf_exempt
def edit_post(request, post_id):

    if (request.method == "POST"):
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return JsonResponse({"error": "Error 404: post not found."}, status=404)

        # Get new post's content
        data = json.loads(request.body)
        body =  data.get('body')

        # Save new post's content
        post.body = body
        post.save()

        return JsonResponse({"success": "Post updated successfully.", "body": post.body}, status=201)       

    else:
        return JsonResponse({"error": "Error 500: Internal server error."}, status=500)  


@login_required
@csrf_exempt
def like_post(request, post_id):

    if (request.method == "POST"):
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return JsonResponse({"error": "Error 404: post not found."}, status=404)

        # Add new like
        post.likes.add(request.user)
        post.save()

        return JsonResponse({"success": "Post liked successfully."}, status=200)

    else:
        return JsonResponse({"error": "Error 500: Internal server error."}, status=500)  

@login_required
@csrf_exempt
def unlike_post(request, post_id):

    if (request.method == "POST"):
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return JsonResponse({"error": "Error 404: post not found."}, status=404)

        # Remove like
        post.likes.remove(request.user)
        post.save()

        return JsonResponse({"success": "Post unliked successfully."}, status=200)

    else:
        return JsonResponse({"error": "Error 500: Internal server error."}, status=500)
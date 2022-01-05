document.addEventListener("DOMContentLoaded", function() {

  // By default Post button is disabled
  document.querySelector('#post-btn').disabled = true;

  // Enable button only if there is text in the input field
  document.querySelector('#post-body').onkeyup = () => {9
    if (document.querySelector('#post-body').value.length > 0) {
      document.querySelector('#post-btn').disabled = false;
    } else {
      document.querySelector('#post-btn').disabled = true;
    }
  }

  // Use buttons to toggle between views
  document.querySelector("#all-posts").addEventListener('click', () => load_box('posts'));
  document.querySelector("#profile").addEventListener('click', () => load_box('profile'));

  // When the form is submitted  
  document.querySelector('#post-form').onsubmit = create_post;

  // By default, load all posts
  load_box('posts');
})

function compose_post() {

  // Clear out post field
  document.querySelector('#post-body').value = '';
}

function load_box(box, user_id) {
  let current_user;
  let current_user_id = document.querySelector('#user-id').innerHTML;

  // Show and hide boxes
  if (box == 'profile') {
    document.querySelector('#posts-view').style.display = 'block';
    document.querySelector('#profile-view').style.display = 'block';
    if (user_id && user_id != current_user_id) {
      current_user = false;
      document.querySelector('#post-form-container').style.display = 'none';
    } else {
      current_user = true;
      document.querySelector('#post-form-container').style.display = 'block';
    }
  } else {
    document.querySelector('#post-form-container').style.display = 'block';
    document.querySelector('#posts-view').style.display = 'block';
    document.querySelector('#profile-view').style.display = 'none';
  }

  // Clear out post field
  document.querySelector('#post-body').value = '';

  // Show the box name
  document.querySelector('#posts-view').innerHTML = `<h3 id="view-header">${box.charAt(0).toUpperCase() + box.slice(1)}</h3>`;

  // Load the box
  if (box == 'posts') {
    loadAllPostsView();
  } else if (box == 'profile') {
    loadProfilePostsView(current_user, current_user_id, user_id);
  } else if (box == 'following') {
    pass
  } else {
    pass 
  }
}

// Create a post
function create_post() {

  // Get post's body
  const body = document.querySelector('#post-body').value;

  // Create post
  fetch('create_post', {
    method: 'POST',
    body: JSON.stringify({
      body: body
    })
  })
  .then(response => response.json())
  .then(result => {
    if (result.error) {
      alert('Error: ' + result.error)
    } else {
      load_box('posts')
    }
  });

  // Stop form from submitting
  return false;
}

function loadAllPostsView() {

  // Get all posts
  fetch(`posts/all-posts/0`)
  .then(response => response.json())
  .then(posts => {
    posts.forEach(post => listPost(post))
  })
}

function loadProfilePostsView(current_user, current_user_id, user_id) {
  
  // Load profile info
  
  
  // Load current user profile
  if (current_user) {
    fetch(`posts/profile/${current_user_id}`)
    .then(response => response.json())
    .then(posts => {
      posts.forEach(post => listPost(post))
    })
  }

  // Load third party profile
  else {
    fetch(`posts/profile/${user_id}`)
    .then(response => response.json())
    .then(posts => {
      posts.forEach(post => listPost(post))
    })
  }
}

// List a post
function listPost(post) {

  const element = document.createElement('div');
  element.classList.add('post-container');

  // Create inner elements
  const user = document.createElement('p');
  user.classList.add('post-user');
  user.innerHTML = `${post.user}`;
  user.addEventListener('click', function() {
    load_box('profile', post.user_id);
  });
  element.append(user);

  const edit = document.createElement('p');
  edit.classList.add('post-edit-btn');
  edit.innerHTML = 'Edit';
  edit.addEventListener('click', function() {
    pass
  })
  element.append(edit);

  const body = document.createElement('p');
  body.classList.add('post-body');
  body.innerHTML = `${post.body}`;
  element.append(body);

  const timestamp = document.createElement('p');
  timestamp.classList.add('post-timestamp');
  timestamp.innerHTML = `${post.timestamp}`;
  element.append(timestamp);

  const likes = document.createElement('p');
  const heart = document.createElement('span');
  heart.classList.add('post-likes');
  heart.innerHTML = '❤️';
  heart.addEventListener('click', function() {
    console.log('likes');
  });
  const num_likes = document.createElement('span');
  num_likes.innerHTML = ` ${post.likes}`;
  likes.append(heart);
  likes.append(num_likes);
  element.append(likes);

  document.querySelector('#posts-view').append(element);
}
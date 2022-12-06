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
  document.querySelector('#home').addEventListener("click", () => load_box('posts'))
  document.querySelector("#all-posts").addEventListener('click', () => load_box('posts'));
  document.querySelector("#profile").addEventListener('click', () => load_box('profile'));
  document.querySelector("#following").addEventListener('click', () => load_box('following'));

  // When the form is submitted  
  document.querySelector('#post-form').onsubmit = create_post;

  // By default, load all posts
  load_box('posts');
})

function compose_post() {

  // Clear out post field
  document.querySelector('#post-body').value = '';
}

function load_box(box, user_id, page_num) {

  // Hide alerts
  document.querySelector('#no-posts-warning').style.display = 'none';

  // Clear out divs
  document.querySelector('#post-body').value = '';
  document.querySelector('#posts-view').innerHTML = '';
  document.querySelector('#pagination-view').innerHTML = '';

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
  } else if(box == 'following') {
    document.querySelector('#posts-view').style.display = 'block';
    document.querySelector('#profile-view').style.display = 'none';
    document.querySelector('#post-form-container').style.display = 'none';
  } else {
    document.querySelector('#post-form-container').style.display = 'block';
    document.querySelector('#posts-view').style.display = 'block';
    document.querySelector('#profile-view').style.display = 'none';
  }

  // Show the box name
  document.querySelector('#box').innerHTML = `<h3 id="view-header" style="margin:10px;">${box.charAt(0).toUpperCase() + box.slice(1)}</h3>`;

  if (!page_num) {
    page_num = 1;
  }

  // Load the box
  if (box == 'posts') {
    loadAllPostsView(page_num, current_user_id);
  } else if (box == 'profile') {
    loadProfilePostsView(current_user, current_user_id, user_id, page_num);
  } else if (box == 'following') {
    loadFollowingPosts(page_num);
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
      const current_page = document.querySelector('#view-header').innerHTML;
      if (current_page == 'Posts') {
        load_box('posts');
      } else {
        load_box('profile');
      }
    }
  });

  // Stop form from submitting
  return false;
}

function loadAllPostsView(page_num, current_user_id) {

  let show_edit_button = false;

  // Get all posts
  fetch(`posts/all-posts/0/${page_num}`)
  .then(response => response.json())
  .then(data => {
    data['posts'].forEach(post => {
      if(post.user_id == current_user_id) {
        show_edit_button = true;
      } else {
        show_edit_button = false;
      }
      listPost(post, show_edit_button);
    });
    insertPagination(data, 'posts');
  })
}

function loadProfilePostsView(current_user, current_user_id, user_id, page_num) {
  
  
  // Load current user profile posts
  if (current_user) {

    // Get posts
    fetch(`posts/profile/${current_user_id}/${page_num}`)
    .then(response => response.json())
    .then(data => {
      data['posts'].forEach(post => listPost(post, true));
      insertPagination(data, 'profile', current_user_id);
    })

    // Get profile info
    fetch(`profile/${current_user_id}`)
    .then(response => response.json())
    .then(data => {
      showProfileInfo(data);
    })
  }

  // Load third party profile posts
  else {

    // Get posts
    fetch(`posts/profile/${user_id}/1`)
    .then(response => response.json())
    .then(data => {
      data['posts'].forEach(post => listPost(post, false));
      insertPagination(data, "profile", user_id);
    })

    

    // Get profile info
    fetch(`profile/${user_id}`)
    .then(response => response.json())
    .then(data => {
      showProfileInfo(data);
    })
  }
}

// List a post
function listPost(post, show_edit_button) {

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

  if (show_edit_button) {
    const edit = document.createElement('p');
    edit.classList.add('post-edit-btn');
    edit.innerHTML = 'Edit';
    edit.addEventListener('click', function(event) {
      
      // Hide post's content and edit button
      event.target.style.display = 'none';
      const post_content = event.target.nextSibling;
      post_content.style.display = 'none';

      // Show text area for edit
      const div_edit_area = document.createElement('div');
      div_edit_area.innerHTML = `<textarea class="form-control" id="post-body">${post_content.innerHTML}</textarea>`;
      event.target.parentNode.insertBefore(div_edit_area, event.target.nextSibling);
      const edit_area = div_edit_area.childNodes[0];

      // Show "Save" button for edit
      const save_btn = document.createElement('input');
      save_btn.setAttribute('id', 'post-btn');
      save_btn.classList.add('btn');
      save_btn.classList.add('btn-primary');
      save_btn.setAttribute('value', 'Save');
      save_btn.addEventListener('click', () => {

        const new_content = edit_area.value;

        // Save new content
        fetch(`edit_post/${post.id}`, {
          method: 'POST',
          body: JSON.stringify({
              body: `${new_content}`
          })
        })
        .then(response => response.json())
        .then(result => {

            if (result['success']) {
              post_content.innerHTML = result['body'];
            } else {
              alert(`Error: ${result['error']}`); 
            }
        });
        
        // Elimina el textarea y el botón "Save"
        event.target.parentNode.removeChild(div_edit_area);

        // Vuelve a mostrar el botón "Edit" y el contenido actualizado del post.
        event.target.style.display = 'block';
        post_content.style.display = 'block';
      })
      edit_area.parentNode.insertBefore(save_btn, edit_area.nextSibling);
    })
    element.append(edit);
  }



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
  if(post.liked) {
    heart.innerHTML = `${post.num_likes} ❤️`;
  } else {
    heart.innerHTML = `${post.num_likes} 🤍`;
  }
  heart.addEventListener('click', function(event) {

    if(post.liked) {
      // Remove like
      fetch(`unlike_post/${post.id}`, {
        method: 'POST'
      })
      .then(response => response.json())
      .then(result => {

          if (result['success']) {
            event.target.innerHTML = `${post.num_likes - 1} 🤍`;
          } else {
            alert(`Error: ${result['error']}`); 
          }

          post.num_likes--;
      });
    } else {
      // Add new like
      fetch(`like_post/${post.id}`, {
        method: 'POST'
      })
      .then(response => response.json())
      .then(result => {

          if (result['success']) {
            event.target.innerHTML = `${post.num_likes + 1} ❤️`;
          } else {
            alert(`Error: ${result['error']}`); 
          }

          post.num_likes++;
      });
    }

    post.liked = !post.liked;
  });

  likes.append(heart);
  element.append(likes);

  document.querySelector('#posts-view').append(element);
}


// Show profile information
function showProfileInfo(data) {

  // Get container element
  const container = document.querySelector('#profile-view');
  container.innerHTML = '';

  // Append profile info
  const username = document.createElement('p');
  username.innerHTML = `@${data.username}`;
  container.append(username);

  const followers = document.createElement('span');
  followers.innerHTML = `${data.followers} followers`;
  followers.style.margin = '10px';
  container.append(followers);

  const following = document.createElement('span');
  following.innerHTML = `${data.followings} following`;
  following.style.margin = '10px';
  container.append(following);

  if (!data.current_user) {
    if (!data.following) {
      const followBtn = document.createElement('button');
      followBtn.setAttribute('type', 'button');
      followBtn.classList.add('btn');
      followBtn.classList.add('btn-primary');
      followBtn.style.display = 'block';
      followBtn.innerHTML = 'Follow';
      followBtn.addEventListener('click', () => {
        fetch(`follow/${data.id}`)
        .then(response => response.json())
        .then(res => {
          if (res.message) {
            load_box('profile', data.id)
          } else {
            alert(`${res.error}`);
          }
        })
      })
      container.append(followBtn);
    } else {
      const unfollowBtn = document.createElement('button');
      unfollowBtn.setAttribute('type', 'button');
      unfollowBtn.classList.add('btn');
      unfollowBtn.classList.add('btn-danger');
      unfollowBtn.style.display = 'block';
      unfollowBtn.innerHTML = 'Unfollow';
      unfollowBtn.addEventListener('click', () => {
        fetch(`unfollow/${data.id}`)
        .then(response => response.json())
        .then(res => {
          if (res.message) {
            load_box('profile', data.id)
          } else {
            alert(`${res.error}`);
          }
        })
      })
      container.append(unfollowBtn);
    }
  }
}

// Get and list all following posts for current user.
function loadFollowingPosts(page_num) {

  // Get all following posts for current user
  fetch(`posts/following/0/${page_num}`)
  .then(response => response.json())
  .then(data => {
    if (data['posts'].length > 0) {

      // If there are post to show, list posts.
      data['posts'].forEach(post => listPost(post, false));

    } else {

      // If there are not posts to show, display a warning.
      const warning = document.querySelector('#no-posts-warning');
      warning.style.display = 'block';
    }

    insertPagination(data, 'following');
  })

}

// Insert pagination links
function insertPagination(data, box, user_id) {

  // Create external elements
  const container = document.querySelector('#pagination-view');

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Page navigation');
  nav.setAttribute('id', 'pagination-nav');

  const ul = document.createElement('ul');
  ul.classList.add('pagination');

  // If page has previous page
  if(data['has_previous'] == true) {

    const previous_li = document.createElement('li');
    previous_li.classList.add('page-item');
    const previous_a = document.createElement('a');
    previous_a.classList.add('page-link');
    previous_a.innerHTML = 'Previous';

    previous_li.addEventListener('click', () => {
      changePage(box, data['current_page'] - 1, user_id);
    })

    previous_li.appendChild(previous_a);

    previous_a.setAttribute('id', `${data['previous_page_number']}`);


    ul.append(previous_li);

    const first_li = document.createElement('li');
    first_li.classList.add('page-item');
    const first_a = document.createElement('a');
    first_a.classList.add('page-link');
    first_a.innerHTML = 'First';

    first_li.addEventListener('click', () => {
      changePage(box, 1, user_id);
    })

    first_li.appendChild(first_a);

    first_a.setAttribute('id', '1');

    ul.append(first_li);
    ul.append(previous_li);
  }

  // Number of pages
  const current_page_li = document.createElement('li');
  current_page_li.classList.add('page-item');
  const current_page_a = document.createElement('a');
  current_page_a.classList.add('page-link');
  current_page_a.innerHTML = `Page ${data['current_page']} of ${data['number_of_pages']}`;;
  current_page_li.appendChild(current_page_a);

  current_page_a.setAttribute('id', `${data['current_page']}`);
  current_page_a.setAttribute('style', 'background-color: dodgerblue; color: white');
  current_page_a.setAttribute('disable', '');


  ul.append(current_page_li);

  // If page has next page
  if(data['has_next'] == true) {
    const next_li = document.createElement('li');
    next_li.classList.add('page-item');
    const next_a = document.createElement('a');
    next_a.classList.add('page-link');
    next_a.innerHTML = 'Next';

    next_li.addEventListener('click', () => {
      changePage(box, data['current_page'] + 1, user_id);
    })

    next_li.appendChild(next_a);

    next_a.setAttribute('id', `${data['next_page_number']}`);

    const last_li = document.createElement('li');
    last_li.classList.add('page-item');
    const last_a = document.createElement('a');
    last_a.classList.add('page-link');
    last_a.innerHTML = 'Last';

    last_li.addEventListener('click', () => {
      changePage(box, data['number_of_pages'], user_id);
    })

    last_li.appendChild(last_a);

    last_a.setAttribute('id', `${data['number_of_pages']}`);

    ul.append(next_li);
    ul.append(last_li);
  }

  nav.append(ul);
  container.append(nav);
}

function changePage(box, num_page, user_id) {
  if (box == 'posts'){
    load_box(box, null, num_page);
  } else if (box == 'following') {
    load_box(box, null, num_page);
  } else if (box == 'profile') {
    load_box(box, user_id, num_page);
  }
}
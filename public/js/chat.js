const socket = io(); // This gets the io function from <script src="/socket.io/socket.io.js"></script> from the HTML file
const $messageForm = document.querySelector('form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = $messages.offsetHeight;

  // Height of messages container
  const containerHeight = $messages.scrollHeight;

  // How far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on('message', (message) => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm:ss a')
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('locationMessage', (message) => {
  console.log(message);
  const html = Mustache.render(locationMessageTemplate, {
    username: message.username,
    locationUrl: message.locationUrl,
    createdAt: moment(message.createdAt).format('h:mm:ss a')
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  });
  $sidebar.innerHTML = html;
});

$messageForm.addEventListener('submit', (e) => {
  e.preventDefault();

  $messageFormButton.setAttribute('disabled', 'disabled'); // Disable the button while the current message is in transit
  $messageFormInput.focus(); // Refocus the cursor on the input to easily let the user send another message

  const message = e.target.elements.message.value;

  $messageFormInput.value = ''; // Clear the current message

  // emit arguments: Name of event, variable to send back, call back function to call for acknowledgement that the server received the message
  socket.emit('sendMessage', message, (error) => {
    $messageFormButton.removeAttribute('disabled');
    if (error) {
      return console.log(error);
    } else {
      console.log('Message delivered!');
    }
  }); // Sends message back to the server
});

$sendLocationButton.addEventListener('click', (e) => {
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser');
  }

  e.target.setAttribute('disabled', 'disabled');

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      'sendLocation',
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      },
      (error) => {
        e.target.removeAttribute('disabled');
        if (error) {
          return console.log(error);
        } else {
          console.log('Location shared!');
        }
      }
    );
  });
});

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});

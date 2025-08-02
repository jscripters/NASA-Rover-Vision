const socket = io({
  auth: {
    serverOffset: 0
  },
  // enable retries
  ackTimeout: 10000,
  retries: 3,
});

const form = document.getElementById('form');
const input = document.getElementById('input');
// const messages = document.getElementById('messages');

let counter = 0;

form.addEventListener('submit', (e) => {
  e.preventDefault(); // Prevent page reload on form submit
  if (input.value) {
    const clientOffset = `${socket.id}-${counter++}`;
    const timeStamp = new Date().toISOString();
    socket.emit('chat message', input.value, clientOffset, timeStamp, acknowledgementCallback);
    input.value = '';
  }
});

socket.on('chat message', (msg, serverOffset) => {
  const chatItem = document.createElement('div');
  chatItem.classList.add('chat__item');

  const chatUser = document.createElement('div');
  chatUser.classList.add('chat__user');
  chatUser.textContent = `${socket.id}:`;
  chatItem.appendChild(chatUser);

  // chatItem.innerHTML = `<p>${msg}</p>`;
  // messages.appendChild(chatItem);

  const item = document.createElement('li');
  item.textContent = msg;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
  socket.auth.serverOffset = serverOffset;
});

function acknowledgementCallback(ack) {
  if (ack && ack.success) {
    console.log('Acknowledged: stop retrying');
  } else {
    console.error('Acknowledgment failed, will retry...');
  }
}

String.prototype.toRGB = function() {
  let hash = 0;
  if (id.length === 0)
    return hash;
  for (let i = 0; i < id.length; i++) {
    hash = this.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    let value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return hash;
}

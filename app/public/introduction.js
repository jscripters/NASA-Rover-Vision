const userIdRaw = sessionStorage.getItem('username');
if (!userIdRaw) {
  alert('You are not logged in.');
  window.location.href = 'login.html';
}

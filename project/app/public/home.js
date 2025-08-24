const socket = io({
  auth: {
    serverOffset: 0
  },
  // enable retries
  ackTimeout: 10000,
  retries: 3,
});

socket.on('sendResult',data=>{
  console.log("test result:",data);
})
let io;

module.exports = {
  init: (socketIo) => {
    io = socketIo;
    console.log('Socket.IO initialized');
    return io;
  },
  emit: (event, data) => {
    if (io) {
      console.log('Emitting socket event:', {
        event,
        data,
        connectedClients: io.engine.clientsCount
      });
      io.emit(event, data);
    } else {
      console.warn('Socket not initialized');
    }
  }
}; 
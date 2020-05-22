//Messages received ---------------------------------------------------------------------------------//

//When a user is disconnected from the server
clientSocket.on('disconnect', function(){
  console.log('user disconnected');

  //Remove user from tracked user list
  disconnectTrackedUser(clientSocket.id);
});

//A user has started sharing location
clientSocket.on("connectTrackedUser", function(nickname) {
  //Add user on the tracked user list
  connectTrackedUser(clientSocket.id, nickname)
});

//A user has stopped sharing location
clientSocket.on("disconnectTrackedUser", function() {
  //Remove user from the tracked user list and emmit a message to the clients
  disconnectTrackedUser(clientSocket.id);
});

//When the app requests a updated list of tracked users (on app start for example)
clientSocket.on("requestUpdatedTrackedUsersList", function() {
  emitTrackedUsersListUpdate();
});

//A user has started tracking a user who is sharing location
clientSocket.on("connectTrackedUserTracker", function(trackedUserSocketId) {
  connectTrackedUserTracker(trackedUserSocketId, clientSocket)
});

//A user has stopped tracking a user who is sharing location
clientSocket.on("disconnectTrackedUserTracker", function(trackedUserSocketId) {
  disconnectTrackedUserTracker(trackedUserSocketId, clientSocket.id)
});

//Gets the coordinates of the tracked user and send it to her/his tracking users
clientSocket.on("trackedUserCoordinates", function(latitude, longitude, altitude) {
  emitCoordinatesToTrackingUsers(clientSocket.id, latitude, longitude, altitude)
});

//Helpers---------------------------------------------------------------------------------//

//Function add a tracked user in tracked users list
function connectTrackedUser(clientSocketId, nickname) {
  var message = "User " + nickname + " has started tracking. ";
  console.log(message);

  var trackedUserInfo = {};

  //The user socket id and nickname is stored and added into tracked users list
  trackedUserInfo["id"] = clientSocketId;
  trackedUserInfo["nickname"] = nickname;

  trackedUsers[clientSocket.id] = trackedUserInfo;

  //Let the app knows that tracked users list was updated
  emitTrackedUsersListUpdate();
}

//Function remove a tracked user from tracked users list
function disconnectTrackedUser(clientSocketId) {
  //Let everyone currently monitoring user location that the location is no longer been shared
  emitTrackedUserHasStoppedSharingLocation(clientSocketId)

  if (trackedUsers[clientSocketId] != null) {
    var message = "User " + trackedUsers[clientSocketId]["nickname"]+ " has stopped tracking. ";
    console.log(message);

    let deviceToken = "6acd0d831374e90a0d847e7f0833ca2fd09dcc7e0f1195a47d184677eb28d2ce";
    sendPush(deviceToken, message, message);

    delete trackedUsers[clientSocketId]
    delete trackedUsersTrackers[clientSocketId]
  }

  //Let app know that we have a new tracked user list data
  emitTrackedUsersListUpdate();
}

//Function add a tracking user in trackedUsersTrackers list
function connectTrackedUserTracker(trackedUserSocketId, clientSocket) {
  if (trackedUsers[trackedUserSocketId] != null) {
    var message = "User " + clientSocket.id + " is traking " + trackedUsers[trackedUserSocketId]["nickname"]
    console.log(message);

    //Add the user socket into the tracking users list of a given tracked user (trackedUserSocketId)
    if (trackedUsersTrackers[trackedUserSocketId] == null) {
      trackedUsersTrackers[trackedUserSocketId] = []
    }

    trackedUsersTrackers[trackedUserSocketId].push(clientSocket);
  }
}

//Function remove a tracking user from trackedUsersTrackers list
function disconnectTrackedUserTracker(trackedUserSocketId, clientSocketId) {
  if (trackedUsers[trackedUserSocketId] != null) {
    var message = "User " + clientSocketId + " has stopped tracking " + trackedUsers[trackedUserSocketId]["nickname"]
    console.log(message);

    //remove the user socket of the tracking users list
    for (index in trackedUsersTrackers[trackedUserSocketId]) {
      if (trackedUsersTrackers[trackedUserSocketId][index].id == clientSocketId) {
        trackedUsersTrackers[trackedUserSocketId].splice(index, 1);
        break;
      }
    }
  }
}

//Messages to emit ---------------------------------------------------------------------------------//

//Function send the tracked user coordinates to all her/his tracking users
function emitCoordinatesToTrackingUsers(clientSocketId, latitude, longitude, altitude) {
  //Confirm if tracked user is still in the list
  if (trackedUsers[clientSocketId] != null) {
    var message = "Coordinates of " + trackedUsers[clientSocketId]["nickname"] + ": " + "Latitude " + latitude + " Longitude " + longitude;
    console.log(message);

    var item = {"nickname": trackedUsers[clientSocketId]["nickname"], "Lat": latitude, "Lon": longitude, "Alt": altitude, "Data": new Date()};
    writeItem(item, function(success, item) {
      if (!success) {
        console.log("errore", item);
      }
    })

    //Sends the coordinates for all users currently tracking the tracked user
    for (index in trackedUsersTrackers[clientSocketId]) {
      var socket = trackedUsersTrackers[clientSocketId][index]

      //Check if client socket is still connected before send coordinates
      //We can use the connected property to make some validations in order to always keep track of connected users
      if (socket.connected) {
        var message = "Sending to " + socket.id + socket.connected;
        console.log(message);

        var coordinates = {};
        coordinates["latitude"] = latitude;
        coordinates["longitude"] = longitude;

        socket.emit("trackedUserCoordinatesUpdate", coordinates);
      }
    }
  }
}

//Function that emmit for all users current tracking tracked user that she/he is no longger sharing location
function emitTrackedUserHasStoppedSharingLocation(clientSocket) {
  for (index in trackedUsersTrackers[clientSocket]) {
    var socket = trackedUsersTrackers[clientSocket][index]

    if (socket.connected) {
      socket.emit("trackedUserHasStoppedUpdate", trackedUsers[clientSocket]["nickname"]);
    }
  }
}

//Function to send the updated list of tracked users
function emitTrackedUsersListUpdate() {
  var trackedUsersList = Object.keys(trackedUsers).map(function(key){
    return trackedUsers[key];
  });

  io.emit("trackedUsersListUpdate", trackedUsersList);
}

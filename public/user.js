const socket = io();
let person;
let roomId;
const text = document.querySelector("#inpMssg");
const MessageArea = document.querySelector(".Message_section");
const Entry = document.querySelector(".Entry");

const textArea = document.querySelector("#inpMssg");

textArea.addEventListener("input", function () {
  this.style.height = "auto"; // Reset height
  this.style.height = this.scrollHeight + "px"; // Adjust height based on content
});

do {
  person = prompt("Enter your name: ");
} while (!person);

do {
  roomId = prompt(
    "Do you want to create a new room or join an existing one? \nEnter a room number:"
  );
} while (!roomId);

let isRoomNew = confirm("Do you want to create this room?");
if (isRoomNew) {
  socket.emit("createRoom", roomId, person); // Create new room
} else {
  socket.emit("joinRoom", roomId, person); // Join existing room
}

const sendMessage = (message) => {
  let msg = {
    user: person,
    message: message,
  };
  // Add message
  AddMessage(msg, "outgoing");
  text.value = "";
  bottomScroll();

  // Emit message event for this room
  socket.emit("message", msg);
};

const AddMessage = (msg, type) => {
  let MainDiv = document.createElement("div");
  let className = type;
  MainDiv.classList.add(className, "message");

  let Markup = `
    <h4>${msg.user}</h4>
    <p>${msg.message}</p>
    `;
  MainDiv.innerHTML = Markup;

  MessageArea.appendChild(MainDiv);
};

// Send message on pressing Enter
text.addEventListener("keyup", (e) => {
  if (e.key == "Enter") {
    sendMessage(e.target.value);
  }
});

// Receive messages from the room
socket.on("messageToRoom", (msg) => {
  AddMessage(msg, "incoming");
  bottomScroll();
});

// Function to add a new user to the active members list
const NewUser = (user) => {
  var text = `${user} joined the room`;
  var newElement = document.createElement("div");
  newElement.classList.add("join-message");
  var listText = document.createTextNode(text);
  newElement.appendChild(listText);
  Entry.appendChild(newElement);
};
// Update the list of users in the room
socket.on("roomUsers", (users) => {
  Entry.innerHTML = ""; // Clear the list before updating
  users.forEach((user) => {
    NewUser(user);
  });
});

// Scroll to the bottom of the message area
const bottomScroll = () => {
  MessageArea.scrollTop = MessageArea.scrollHeight;
};

// Handle error messages like room not found
socket.on("errorMessage", (error) => {
  alert(error);
});

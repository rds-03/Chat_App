const socket = io();
let person;
const text = document.querySelector("#inpMssg");
const MessageArea = document.querySelector(".Message_section");
const Entry = document.querySelector(".Entry");
do {
  person = prompt("Enter your name: ");
} while (!person);

text.addEventListener("keyup", (e) => {
  if (e.key == "Enter") {
    sendMessage(e.target.value);
  }
});

const sendMessage = (message) => {
  let msg = {
    user: person,
    message: message,
  };
  //Add message
  Addmessaage(msg, "outgoing");
  text.value = "";
  bottomScroll();

  //
  socket.emit("message", msg);
};

const Addmessaage = (msg, type) => {
  let MainDiv = document.createElement("div");
  let className = type;
  MainDiv.classList.add(className, "message");

  let Markkup = `
    <h4>${msg.user}</h4>
    <p>${msg.message}</p>
    `;
  MainDiv.innerHTML = Markkup;

  MessageArea.appendChild(MainDiv);
};

//Recieve Message
socket.on("messagetoAll", (msg) => {
  // console.log(`${msg.user} joined the chat`);
  Addmessaage(msg, "incomming");
  bottomScroll();
});

const NewUser = (msg) => {
  var text = `${msg.user} Joined`;
  var newElement = document.createElement("h3");
  var listText = document.createTextNode(text);
  newElement.appendChild(listText);
  Entry.appendChild(newElement);
};
const bottomScroll = () => {
  MessageArea.scrollTop = MessageArea.scrollHeight;
};

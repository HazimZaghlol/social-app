const baseURL = "http://localhost:3000";
const token = localStorage.getItem("token");

let globalProfile = {};
let currentChatUser = null;
const headers = {
  "Content-Type": "application/json; charset=UTF-8",
  authorization: `Bearer ${token}`,
};
const clientIo = io(baseURL, { auth: { authorization: token } });

clientIo.on("connect", () => {
  console.log("Socket connected successfully");
});

clientIo.on("connect_error", (error) => {
  console.error("Socket connection error:", error);
});

clientIo.on("server_error", (err) => {
  console.log("custom_error:", err.message);
});

clientIo.on("connected", ({ user }) => {
  globalProfile = user;
  console.log(globalProfile.firstname, globalProfile._id);
  getUserData();
});

clientIo.on("disconnected_user", (data) => {
  console.log({ data });
});

// Setup socket listeners ONCE
clientIo.on("chat-history", (chat) => {
  console.log("Received chat history:", chat);
  if (currentChatUser) {
    showData(currentChatUser, chat || []);
  }
});

clientIo.on("message-sent", (data) => {
  const { text, senderId } = data;
  console.log("Message details:", { text, senderId, currentUser: globalProfile._id });
  const div = document.createElement("div");

  div.className = "me text-end p-2";

  if (senderId.toString() == globalProfile._id) div.dir = "rtl";
  else div.dir = "ltr";

  const imagePath = "./avatar/Avatar-No-Background.png";
  div.innerHTML = `
        <img class="chatImage" src="${imagePath}" alt="" srcset="">
        <span class="mx-2">${text}</span>
    `;
  document.getElementById("messageList").appendChild(div);
  $(".noResult").hide();

  //   const audio = document.getElementById("notifyTone");
  //   audio.currentTime = 0;
  //   audio.play().catch((err) => console.log("Audio play blocked:", err));
});

let avatar = "./avatar/Avatar-No-Background.png";
let meImage = "./avatar/Avatar-No-Background.png";
let friendImage = "./avatar/Avatar-No-Background.png";


function sendMessage(sendTo, type) {
  if (type == "ovo") {
    const data = {
      text: $("#messageBody").val(),
      targetUserId: sendTo,
    };
    clientIo.emit("send-private-message", data);
    document.getElementById("messageBody").value = "";
  } else if (type == "ovm") {
    const data = {
      text: $("#messageBody").val(),
      targetGroupId: sendTo,
    };
    clientIo.emit("send-group-message", data);
    document.getElementById("messageBody").value = "";
  }
}

function renderMyMessage(text) {
  const div = document.createElement("div");
  div.className = "me text-end p-2";
  div.dir = "rtl";
  div.innerHTML = `
    <img class="chatImage" src="${meImage}" alt="" srcset="">
    <span class="mx-2">${text}</span>
    `;
  document.getElementById("messageList").appendChild(div);
}

function renderFriendMessage(text) {
  const div = document.createElement("div");
  div.className = "myFriend p-2";
  div.dir = "ltr";
  div.innerHTML = `
    <img class="chatImage" src="${friendImage}" alt="" srcset="">
    <span class="mx-2">${text}</span>
    `;
  document.getElementById("messageList").appendChild(div);
}

function SayHi() {
  const div = document.createElement("div");
  div.className = "noResult text-center  p-2";
  div.dir = "ltr";
  div.innerHTML = `
    <span class="mx-2">Say Hi to start the conversation.</span>
    `;
  document.getElementById("messageList").appendChild(div);
}

// Show Friends list  and groups list
function getUserData() {
  axios({
    method: "get",
    url: `${baseURL}/user/list-friend-request?status=accepted`,
    headers,
  })
    .then(function (response) {
      const { data } = response.data?.data;
      console.log(data);

      let imagePath = avatar;
      document.getElementById("profileImage").src = imagePath;
      document.getElementById("userName").innerHTML = `${globalProfile.firstname}`;

      showUsersData(data.friendships);
      showGroupList(data.groups);
    })
    .catch(function (error) {
      console.log(error);
    });
}

//=========================================== PRIVATE CHAT ====================================//
// Show friends list
function showUsersData(users = []) {
  let cartonna = ``;

  for (let i = 0; i < users.length; i++) {
    let friend;
    if (globalProfile._id == users[i].requestToId._id.toString()) {
      friend = users[i].requestFormId;
    } else {
      friend = users[i].requestToId;
    }

    let imagePath = avatar;
    cartonna += `
        <div onclick="displayChatUser('${friend?._id}')" class="chatUser my-2">
        <img class="chatImage" src="${imagePath}" alt="" srcset="">
        <span class="ps-2">${friend?.firstname}  ${friend?.lastname}</span>
        <span id="${"c_" + users[i]._id}" class="ps-2 closeSpan">
           🟢
        </span>
        </div>
        
        `;
  }
  document.getElementById("chatUsers").innerHTML = cartonna;
}

//  Show chat conversation when sending new message
function showData(sendTo, chat) {
  console.log("Setting up send button for:", sendTo);
  const sendButton = document.getElementById("sendMessage");
  // Remove old onclick and set new one
  sendButton.onclick = null;
  sendButton.onclick = () => sendMessage(sendTo, "ovo");

  document.getElementById("messageList").innerHTML = "";
  if (chat?.length) {
    $(".noResult").hide();
    for (const message of chat) {
      if (message.senderId.toString() == globalProfile._id.toString()) {
        renderMyMessage(message.text);
      } else {
        renderFriendMessage(message.text);
      }
    }
  } else {
    SayHi();
  }
  $(`#c_${sendTo}`).hide();
}

function displayChatUser(userId) {
  console.log("displayChatUser called with userId:", userId);
  clientIo.emit("get-chat-history", userId);
  clientIo.on("chat-history", (chat) => {
    if (chat.length) showData(userId, chat);
    else showData(userId, 0);
  });
}

//=========================================== GROUPS ====================================//
// Show groups list
function showGroupList(groups = []) {
  let cartonna = ``;
  for (let i = 0; i < groups.length; i++) {
    let imagePath = avatar;
    cartonna += `
        <div onclick="displayGroupChat('${groups[i]._id}')" class="chatUser my-2">
        <img class="chatImage" src="${imagePath}" alt="" srcset="">
        <span class="ps-2">${groups[i].name}</span>
           <span id="${"g_" + groups[i]._id}" class="ps-2 closeSpan">
        </span>
        </div>
        `;
  }
  document.getElementById("chatGroups").innerHTML = cartonna;
}

// Show  group chat conversation history
function showGroupData(sendTo, chat) {
  const sendButton = document.getElementById("sendMessage");
  sendButton.onclick = null;
  sendButton.onclick = () => sendMessage(sendTo, "ovm");

  document.getElementById("messageList").innerHTML = "";
  if (chat?.length) {
    $(".noResult").hide();
    for (const message of chat) {
      if (message.senderId.toString() == globalProfile._id.toString()) {
        renderMyMessage(message.text);
      } else {
        renderFriendMessage(message.text);
      }
    }
  } else {
    SayHi();
  }
  $(`#g_${sendTo}`).hide();
}

// get group chat conversation between 2 users and pass it to ShowData fun
function displayGroupChat(groupId) {
  clientIo.emit("get-group-chat", groupId);
  clientIo.on("group-chat-history", (chat) => {
    if (chat?.length) {
      showGroupData(groupId, chat);
    } else {
      showGroupData(groupId, 0);
    }
  });
}

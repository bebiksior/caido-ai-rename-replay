// Pieces made by gpt-4, put together by human

function getReplayName(prompt, message) {
  console.log("prompt:", prompt);
  console.log("message:", message);
  return new Promise((resolve, reject) => {
    // Step 1: Create the Assistant Session
    Caido.graphql
      .createAssistantSession({
        input: {
          systemMessage: prompt,
          modelId: "gpt-3.5-turbo",
        },
      })
      .then((sessionData) => {
        const sessionId = sessionData.createAssistantSession.session.id;

        // Step 2: Send the message to the Assistant
        Caido.graphql
          .sendAssistantMessage({
            sessionId: sessionId,
            message: message,
          })
          .then(() => {
            // Step 3: Wait for the response
            const interval = setInterval(() => {
              Caido.graphql
                .assistantSession({ id: sessionId })
                .then((data) => {
                  if (data.assistantSession.messages.length >= 3) {
                    const response = data.assistantSession.messages[2].content;
                    clearInterval(interval);

                    // Step 4: Delete the session
                    Caido.graphql
                      .deleteAssistantSession({ id: sessionId })
                      .then(() => {
                        resolve(response);
                      })
                      .catch((deleteError) => {
                        reject(deleteError);
                      });
                  }
                })
                .catch((sessionError) => {
                  clearInterval(interval);
                  reject(sessionError);
                });
            }, 1000);
          })
          .catch((sendError) => {
            reject(sendError);
          });
      })
      .catch((createError) => {
        reject(createError);
      });
  });
}

function getSelectedReplayID() {
  // Get all tab elements
  const tabList = document.querySelectorAll(".c-tab-list__tab");

  // Loop through each tab to find the active one
  for (let tab of tabList) {
    // Find the active tab inside the tab element
    const activeTab = tab.querySelector('.c-tab[data-is-active="true"]');

    // Check if the active tab is found
    if (activeTab) {
      // Get the session ID from the active tab
      const sessionID = activeTab.dataset.sessionId;
      return sessionID;
    }
  }
  // Return null if no active tab found
  return null;
}

function getReplayText() {
  var contentEditable = document.querySelector(".cm-content");
  if (contentEditable) {
    var textContent = contentEditable.textContent;
    return textContent;
  } else {
    return null;
  }
}

function addPopupItem(label, callback) {
  const popupMenu = document.querySelector(".p-contextmenu-root-list");
  const newItem = document.createElement("li");
  newItem.id = `pv_id_1_${popupMenu.children.length}`;
  newItem.className = "p-menuitem";
  newItem.setAttribute("role", "menuitem");
  newItem.setAttribute("aria-label", label);
  newItem.setAttribute("aria-level", "1");
  newItem.setAttribute("aria-setsize", popupMenu.children.length + 1);
  newItem.setAttribute("aria-posinset", popupMenu.children.length);
  newItem.setAttribute("data-pc-section", "menuitem");
  newItem.setAttribute("data-p-highlight", "false");
  newItem.setAttribute("data-p-focused", "false");
  newItem.innerHTML = `
      <div class="p-menuitem-content" data-pc-section="content">
        <div data-v-e9f4c4ae="" class="c-context-menu__item">
          <div data-v-e9f4c4ae="" class="c-context-menu__content">${label}</div>
          <div data-v-e9f4c4ae="" class="c-context-menu__trailing-visual"></div>
        </div>
      </div>
    `;
  newItem.addEventListener("click", function () {
    callback();
    closePopupMenu();
  });
  popupMenu.appendChild(newItem);
}

function closePopupMenu() {
  const popupMenu = document.querySelector(".p-contextmenu");
  popupMenu.style.display = "none";
}

const systemMessage =
  "Given the user's HTTP request, provide a short name for the request one-five words max. Be descriptive and specific.";

EvenBetterAPI.eventManager.on("onContextMenuOpen", (data) => {
  addPopupItem("Generate Replay Name", () => {
    const selectedReplayID = getSelectedReplayID();
    const replayText = getReplayText();
    getReplayName(systemMessage, replayText).then((response) => {
      const reasoning = response.reasoning;
      Caido.graphql.renameReplaySession({
        id: selectedReplayID,
        name: response,
      });
    });
  });
});

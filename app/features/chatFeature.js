import { authService } from "../services/authService";

export function initChatFeature() {
  if (typeof window === "undefined" || window.location.pathname !== "/chat") return;

  const params = new URLSearchParams(window.location.search);
  const eventId = params.get("eventId");
  const userId = params.get("userId");
  const queryUserName = params.get("userName") || params.get("name") || "";

  const chatBody = document.querySelector("#chatBody");
  const chatHeader = document.querySelector(".chat-header");
  const chatForm = document.querySelector("#chatForm");
  const messageInput = document.querySelector("#messageInput");

  // Remove dummy file/image attachment buttons since chat API is text-only
  if (chatForm) {
    const dummyIcons = chatForm.querySelectorAll('button[title*="Attach"], .bi-paperclip, .bi-image');
    dummyIcons.forEach((el) => {
      const btn = el.tagName === "BUTTON" ? el : el.closest("button");
      if (btn) btn.remove();
    });
  }

  if (!eventId || !userId) {
    if (chatBody) {
      chatBody.innerHTML = `
        <div class="text-center text-muted my-auto py-5">
          <div class="mx-auto mb-3 d-inline-flex align-items-center justify-content-center" style="width:52px;height:52px;border-radius:50%;background:#fef2f2;color:#ef4444;">
            <i class="bi bi-chat-x fs-3"></i>
          </div>
          <h6 class="fw-bold mb-1 text-dark" style="font-family:'Poppins', sans-serif;">Chat Details Missing</h6>
          <p class="small text-muted mb-3">Please select a customer reservation from your booking list to chat.</p>
          <a href="/reservation-list" class="btn btn-sm btn-primary rounded-pill px-3.5 py-1.5 fw-semibold text-decoration-none">
            <i class="fa-solid fa-arrow-left me-1"></i> View Reservations
          </a>
        </div>`;
    }
    if (messageInput) messageInput.disabled = true;
    return;
  }

  let currentChatId = null;
  let lastMessagesHash = "";

  const buildBubble = (msg, isOutgoing) => {
    const time = msg.timeAgo || new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const row = document.createElement("div");
    row.className = `message-row ${isOutgoing ? "outgoing" : "incoming"}`;
    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.textContent = msg.content || "";
    const timeLabel = document.createElement("span");
    timeLabel.className = "message-time";
    timeLabel.textContent = time;
    if (isOutgoing) {
      const check = document.createElement("i");
      check.className = "bi bi-check2-all text-white-50 ms-1";
      timeLabel.appendChild(check);
    }
    row.append(bubble, timeLabel);
    return row;
  };

  async function loadChat() {
    try {
      const res = await authService.getMerchantChat({ eventId, userId });
      if (!res || !res.status || !res.data) {
        throw new Error(res?.message || "Failed to load chat");
      }

      currentChatId = res.data?._id || res.data?.chatId || res.data?.chat?._id || currentChatId;
      const { participants, messages } = res.data;

      // Update Header with user profile and back button
      if (chatHeader) {
        if (!chatHeader.querySelector("#chatBackBtn")) {
          const backBtnHtml = `
            <a href="/reservation-list" id="chatBackBtn" class="btn btn-sm btn-light border rounded-pill px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5 text-secondary me-2" style="font-size: 13px; text-decoration: none;">
              <i class="fa-solid fa-arrow-left"></i>
              <span>Back</span>
            </a>
          `;
          chatHeader.insertAdjacentHTML("afterbegin", backBtnHtml);
        }

        const u = participants?.user || participants?.customer || res.data?.user || {};
        const customerName =
          u.fullName ||
          u.name ||
          (u.firstName ? `${u.firstName} ${u.lastName || ""}`.trim() : "") ||
          u.userName ||
          queryUserName ||
          "Customer";

        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(customerName)}&background=eef2ff&color=4f46e5&size=88`;
        const pic = (u.profilePic && typeof u.profilePic === "string" && u.profilePic.startsWith("http")) ? u.profilePic : defaultAvatar;

        const avatarImg = chatHeader.querySelector("#chatCustomerAvatar, .avatar-img");
        if (avatarImg) {
          avatarImg.src = pic;
          avatarImg.alt = customerName;
          avatarImg.onerror = () => { avatarImg.src = defaultAvatar; };
        }

        const nameEl = chatHeader.querySelector("#chatCustomerName, h6");
        if (nameEl) nameEl.textContent = customerName;

        const statusText = chatHeader.querySelector("#chatCustomerStatus, small");
        if (statusText) {
          statusText.innerHTML = `<i class="bi bi-circle-fill me-1" style="font-size: 7px;"></i>Online • Customer`;
          statusText.className = "text-success fw-semibold d-inline-flex align-items-center";
        }
      }

      // Populate messages only if changed to prevent scroll jumping
      if (chatBody && Array.isArray(messages)) {
        const messagesHash = JSON.stringify(messages);
        if (messagesHash !== lastMessagesHash) {
          lastMessagesHash = messagesHash;
          chatBody.innerHTML = "";
          if (messages.length === 0) {
            chatBody.innerHTML = `
              <div class="text-center text-muted my-auto py-5">
                <div class="mx-auto mb-3 d-inline-flex align-items-center justify-content-center" style="width:52px;height:52px;border-radius:50%;background:#eef2ff;color:#4f46e5;">
                  <i class="bi bi-chat-dots fs-3"></i>
                </div>
                <h6 class="fw-bold mb-1 text-dark" style="font-family:'Poppins', sans-serif;">No messages yet</h6>
                <p class="small text-muted mb-0">Start a conversation with the customer regarding their reservation.</p>
              </div>`;
          } else {
            messages.forEach((msg) => {
              const isOutgoing = msg.senderRole === "merchant" || msg.senderType === "merchant";
              chatBody.appendChild(buildBubble(msg, isOutgoing));
            });
            chatBody.scrollTop = chatBody.scrollHeight;
          }
        }
      }
    } catch (err) {
      console.error("Chat loading failed:", err);
      if (chatBody && !lastMessagesHash) {
        chatBody.innerHTML = `<div class="text-center text-danger py-4">${err.message || "Could not load messages."}</div>`;
      }
    }
  }

  // Handle Form Submission
  if (chatForm && !chatForm.dataset.listenerAttached) {
    chatForm.dataset.listenerAttached = "true";
    chatForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const content = messageInput?.value?.trim();
      if (!content) return;

      messageInput.value = "";
      const sendBtn = chatForm.querySelector('button[type="submit"]');
      if (sendBtn) sendBtn.disabled = true;

      // Optimistic append
      const tempMsg = { content, createdAt: new Date().toISOString(), senderRole: "merchant" };
      const bubble = buildBubble(tempMsg, true);
      chatBody.appendChild(bubble);
      chatBody.scrollTop = chatBody.scrollHeight;

      try {
        const res = await authService.sendMerchantMessage({
          chatId: currentChatId,
          eventId,
          userId,
          content
        });
        if (!res || !res.status) {
          throw new Error(res?.message || "Failed to send");
        }
      } catch (err) {
        console.error("Send message error:", err);
        bubble.style.opacity = "0.5";
        bubble.title = "Failed to deliver. Please try again.";
      } finally {
        if (sendBtn) sendBtn.disabled = false;
        messageInput.focus();
      }
    });
  }

  loadChat();
  const pollInterval = setInterval(loadChat, 4000);
  return () => clearInterval(pollInterval);
}


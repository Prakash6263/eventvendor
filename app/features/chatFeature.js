import { authService } from "../services/authService";

export function initChatFeature() {
  if (typeof window === "undefined" || window.location.pathname !== "/chat") return;

  const params = new URLSearchParams(window.location.search);
  const eventId = params.get("eventId");
  const userId = params.get("userId");

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
      chatBody.innerHTML = `<div class="text-center text-muted py-5">Chat details are missing. Please return to the reservation and try again.</div>`;
    }
    if (messageInput) messageInput.disabled = true;
    return;
  }

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

      const { participants, messages } = res.data;

      // Update Header with user profile
      if (chatHeader && participants?.user) {
        const u = participants.user;
        const pic =
          u.profilePic && u.profilePic.startsWith("http")
            ? u.profilePic
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || "User")}&background=5b6ef5&color=fff&size=64`;

        const avatarImg = chatHeader.querySelector(".user-avatar img");
        if (avatarImg) avatarImg.src = pic;

        const nameEl = chatHeader.querySelector(".user-info h6");
        if (nameEl) nameEl.textContent = u.fullName || "Customer";

        const statusText = chatHeader.querySelector(".user-info small");
        if (statusText) statusText.textContent = "Online";
      }

      // Populate messages
      if (chatBody && Array.isArray(messages)) {
        chatBody.innerHTML = "";
        if (messages.length === 0) {
          chatBody.innerHTML = `<div class="text-center text-muted my-auto py-5"><i class="bi bi-chat-heart text-primary mb-2" style="font-size:28px;"></i><br/>Start a conversation with the customer regarding their reservation.</div>`;
        } else {
          messages.forEach((msg) => {
            const isOutgoing = msg.senderRole === "merchant" || msg.senderType === "merchant";
            chatBody.appendChild(buildBubble(msg, isOutgoing));
          });
          chatBody.scrollTop = chatBody.scrollHeight;
        }
      }
    } catch (err) {
      console.error("Chat loading failed:", err);
      if (chatBody) {
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
      const tempMsg = { content, createdAt: new Date().toISOString() };
      const bubble = buildBubble(tempMsg, true);
      chatBody.appendChild(bubble);
      chatBody.scrollTop = chatBody.scrollHeight;

      try {
        const res = await authService.sendMerchantMessage({ eventId, userId, content });
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


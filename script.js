/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const workerURL = "https://quiet-lake-4793.annarcameron2006.workers.dev/";

// Keep the full conversation so the advisor can remember earlier details.
const messages = [
  {
    role: "system",
    content:
      "You are a helpful L'Oréal beauty advisor. Only answer questions about L'Oréal products, skincare, haircare, makeup, fragrance, beauty care routines, or recommendations for what the user might try. If a question is unrelated, politely say you can only help with L'Oréal beauty topics, then add one helpful L'Oréal-related tip. Remember details from earlier messages, such as the user's name, preferences, skin or hair concerns, and products they have mentioned. Use those details naturally in later replies. Do not invent product availability, medical diagnoses, or personal information. Keep answers concise, friendly, and practical.",
  },
];

// Create a readable chat bubble without inserting user text as HTML.
function addBubble(label, content, type, isThinking = false) {
  const message = document.createElement("article");
  message.className = `chat-message ${type}`;

  const messageLabel = document.createElement("span");
  messageLabel.className = "message-label";
  messageLabel.textContent = label;

  const bubble = document.createElement("p");
  bubble.className = `message-bubble${isThinking ? " is-thinking" : ""}`;
  bubble.textContent = content;

  message.append(messageLabel, bubble);
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return bubble;
}

// Show the welcome message when the advisor first opens.
addBubble(
  "L'Oréal advisor",
  "Hello. Tell me what you are looking for, and I will help you find your next beauty essential.",
  "assistant",
);

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Read the message the user typed into the form.
  const message = userInput.value.trim();

  if (!message) {
    return;
  }

  // Add this question to the existing conversation before sending it.
  messages.push({ role: "user", content: message });

  // Keep earlier exchanges visible while adding the newest one.
  addBubble("You", message, "user");
  const thinkingBubble = addBubble(
    "L'Oréal advisor",
    "Thinking...",
    "assistant",
    true,
  );
  userInput.value = "";

  try {
    // Send the message to the class-hosted Cloudflare Worker.
    const response = await fetch(workerURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error("The advisor could not be reached.");
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;
    messages.push({ role: "assistant", content: reply });
    thinkingBubble.textContent = reply;
    thinkingBubble.classList.remove("is-thinking");
  } catch (error) {
    // Remove failed questions so they are not sent again as fake context.
    messages.pop();
    thinkingBubble.textContent =
      "Sorry, the advisor is unavailable right now. Please try again.";
    thinkingBubble.classList.remove("is-thinking");
    console.error(error);
  }
});

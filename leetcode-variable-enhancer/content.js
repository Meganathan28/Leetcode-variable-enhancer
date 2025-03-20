let monacoEditorInstance = null;
function getMonaco() {
  if (window.monaco && window.monaco.editor) {
    const editors = window.monaco.editor.getEditors();
    if (editors && editors.length > 0) {
      monacoEditorInstance = editors[0]; // Cache the instance
    }
  }
}
// Inject the Enhance button into the LeetCode page
function addEnhanceButton() {
  // Check if button already exists to avoid duplicates
  if (document.getElementById("enhance-code-btn")) return;

  // Find the notes button container
  // LeetCode's UI structure might have changed - this is a more robust selector for the top navbar area
  const topNavbar = document.querySelector(".flex.items-center");
  if (!topNavbar) {
    console.warn("Top navbar not found!");
    return;
  }

  // Look for the notes icon which has a specific SVG path
  const allIcons = document.querySelectorAll(".flex.items-center svg");
  let notesIcon = null;

  // Identify the notes icon by its distinctive path
  for (const icon of allIcons) {
    // The notes icon typically has a path with a specific shape
    const paths = icon.querySelectorAll("path");
    for (const path of paths) {
      if (
        path
          .getAttribute("d")
          ?.includes("M14,10H2v2h12V10z M14,6H2v2h12V6z M2,16h8v-2H2V16z")
      ) {
        notesIcon = icon.closest(".flex.items-center > div");
        break;
      }
    }
    if (notesIcon) break;
  }

  // If we couldn't find the notes icon specifically, just append to the navbar
  const targetElement = notesIcon || topNavbar;

  // Create the button
  const button = document.createElement("button");
  button.id = "enhance-code-btn";
  button.innerText = "Enhance";
  button.style.padding = "8px 12px";
  button.style.background = "linear-gradient(90deg, #4CAF50, #2E7D32)";
  button.style.color = "white";
  button.style.border = "none";
  button.style.borderRadius = "5px";
  button.style.cursor = "pointer";
  button.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.2)";
  button.style.marginLeft = "10px";
  button.style.fontSize = "14px";

  // Create a wrapper div to ensure proper styling and positioning
  const buttonWrapper = document.createElement("div");
  buttonWrapper.className = "flex items-center ml-2 mr-4";
  buttonWrapper.appendChild(button);

  // Insert the button next to the notes icon or at the end of the navbar
  if (notesIcon) {
    // Insert after the notes icon
    notesIcon.parentNode.insertBefore(buttonWrapper, notesIcon.nextSibling);
  } else {
    // Append to the navbar as a fallback
    topNavbar.appendChild(buttonWrapper);
  }

  // Add click event handler to the button
  button.addEventListener("click", async () => {
    console.log("Enhance Code button clicked.");
    // Show loading indicator
    const originalText = button.innerText;
    button.innerText = "Enhancing...";
    button.disabled = true;

    try {
      const code = getCodeFromEditor();
      console.log("m code is", code);
      if (!code || !code.trim()) {
        alert("No code found in the editor!");
        return;
      }

      const enhancedCode = await enhanceWithGemini(code);
      updateCodeInEditor(enhancedCode);
    } catch (error) {
      console.error("Error enhancing code:", error);
      alert("Failed to enhance code: " + error.message);
    } finally {
      // Reset button
      button.innerText = originalText;
      button.disabled = false;
    }
  });
}

// Get code from the Monaco editor
function getCodeFromEditor() {
  // Try direct Monaco editor API first
  const editor = monacoEditorInstance;
  console.log("My editor in getCode", editor);
  try {
    const code = editor.getValue();
    return code;
  } catch (err) {
    console.log("myerr", err);
  }

  // Fallback: Extract code from the visible lines
  try {
    const lines = Array.from(document.querySelectorAll(".view-line"))
      .map((line) => {
        // Get text content without unnecessary HTML
        const text = line.innerText || line.textContent;
        return text;
      })
      .join("\n");

    return lines;
  } catch (err) {
    console.error("Error getting code:", err);
    return null;
  }
}

// Call Gemini API to enhance variables, with AI language detection
async function enhanceWithGemini(code) {
  const apiKey = "Gemini-api-key"; // Replace with your key
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const prompt = `First, identify the programming language of this code. Then, suggest more meaningful variable names based on their usage and context. Return only the enhanced code without additional explanations or markdown.\n\nCode:\n\n${code}`;

  try {
    console.log("Sending to Gemini API...");
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log("API Response:", result);

    if (
      !result.candidates ||
      !result.candidates[0] ||
      !result.candidates[0].content ||
      !result.candidates[0].content.parts ||
      !result.candidates[0].content.parts[0]
    ) {
      throw new Error("Unexpected API response structure");
    }

    const enhancedCode = result.candidates[0].content.parts[0].text || code;
    return enhancedCode.trim();
  } catch (error) {
    console.error("Error enhancing code:", error);
    throw new Error("Failed to enhance code: " + error.message);
  }
}

// Update the code in the editor
function updateCodeInEditor(newCode) {
  try {
    const editor = monacoEditorInstance;
    if (editor) {
      console.log("Editor found! Updating code...");
      editor.setValue(newCode);
      return;
    }

    // Fallback if Monaco editor is not detected
    console.warn("Editor not found, falling back to clipboard.");
    navigator.clipboard
      .writeText(newCode)
      .then(() => {
        alert("Enhanced code copied! Paste it manually in the editor.");
      })
      .catch((err) => {
        console.error("Clipboard write failed:", err);
        alert(
          "Failed to copy to clipboard. Check the console for the enhanced code."
        );
        console.log("Enhanced code:", newCode);
      });
  } catch (err) {
    console.error("Error updating code:", err);
    alert(
      "Couldn't update the editor. Check the console for the enhanced code."
    );
    console.log("Enhanced code:", newCode);
  }
}

// Run when the page loads
window.addEventListener("load", () => {
  getMonaco();
  addEnhanceButton();
});

// Check periodically in case the editor loads later
setInterval(addEnhanceButton, 1000);

// Add a message t
//
//
//
//
//

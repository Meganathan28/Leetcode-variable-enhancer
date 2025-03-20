document.getElementById("openLeetCode").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://leetcode.com/problems/" });
});
document.getElementById("openYoutube").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://youtube.com/" });
});
document.getElementById("openAZ").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://maang.in/" });
});

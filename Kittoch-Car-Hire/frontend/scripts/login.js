import { createServerWakeupService } from "./utilities.js";

const wakeupService = createServerWakeupService();
wakeupService.start();

$("#loginForm").submit(async (e) => {
  e.preventDefault();
  const EmployeeId = $("#email").val();
  const Password = $("#password").val();

  try {
    const response = await fetch(
      "https://kittoch-car-hire.onrender.com/api/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ EmployeeId, Password }),
      }
    );

    const result = await response.json();

    if (response.ok) {
      window.location.href = "/frontend/html/dashboard.html";
    } else {
      $("#loginMessage").text(result.error);
    }
  } catch (error) {
    console.error("Error:", error);
    $("#loginMessage").text("Server error. Try again later.");
  }
});

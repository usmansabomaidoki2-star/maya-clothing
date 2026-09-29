document.addEventListener("DOMContentLoaded", function () {

  alert("MAYA ADMIN JS LOADED");

  console.log("MAYA ADMIN JS LOADED");

  const loginForm = document.getElementById("loginForm");
  const loginMessage = document.getElementById("loginMessage");

  if (!loginForm) {
    alert("ERROR: loginForm BA A SAMU BA");
    console.log("loginForm not found");
    return;
  }

  alert("loginForm AN SAMU");

  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    alert("LOGIN FORM EVENT YANA AIKI");

    if (loginMessage) {
      loginMessage.textContent = "Login form yana aiki. JavaScript ya samu form.";
      loginMessage.style.color = "green";
    }

    console.log("Login form submitted successfully");
  });

});

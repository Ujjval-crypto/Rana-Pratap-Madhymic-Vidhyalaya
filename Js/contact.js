const admissionForm = document.querySelector('[data-api-form="/api/admission"]');

if (admissionForm) {
  const status = admissionForm.querySelector(".form-status");
  const phone = admissionForm.querySelector("#phone");
  const email = admissionForm.querySelector("#email");

  admissionForm.querySelectorAll("input, textarea, select").forEach(field => {
    field.addEventListener("input", () => {
      field.removeAttribute("aria-invalid");
      if (status) {
        status.textContent = "";
        status.className = "form-status";
      }
    });
  });

  if (phone) {
    phone.addEventListener("input", () => {
      phone.value = phone.value.replace(/[^\d+\-()\s]/g, "");
    });
  }

  admissionForm.addEventListener("submit", event => {
    const invalidField = admissionForm.querySelector(":invalid");
    if (invalidField) {
      event.preventDefault();
      invalidField.setAttribute("aria-invalid", "true");
      invalidField.focus();
      if (status) {
        status.textContent = "Please complete the required fields correctly.";
        status.className = "form-status error";
      }
      return;
    }

    if (phone && phone.value.replace(/\D/g, "").length < 7) {
      event.preventDefault();
      phone.setAttribute("aria-invalid", "true");
      phone.focus();
      if (status) {
        status.textContent = "Please enter a valid phone number.";
        status.className = "form-status error";
      }
      return;
    }

    if (email) email.removeAttribute("aria-invalid");
  });
}
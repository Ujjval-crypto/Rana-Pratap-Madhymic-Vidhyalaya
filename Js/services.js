const programCards = document.querySelectorAll(".program-card");

programCards.forEach(card => {
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-pressed", "false");

  const toggleCard = () => {
    const selected = card.classList.toggle("is-selected");
    card.setAttribute("aria-pressed", String(selected));
  };

  card.addEventListener("click", toggleCard);
  card.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleCard();
    }
  });
});
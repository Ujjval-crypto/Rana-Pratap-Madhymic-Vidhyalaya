const contentImage = document.querySelector(".content-grid > div:last-child img");

if (contentImage && window.matchMedia("(pointer: fine)").matches) {
  const imageContainer = contentImage.parentElement;
  imageContainer.addEventListener("pointermove", event => {
    const bounds = imageContainer.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    contentImage.style.transform = `translate(${x * 5}px, ${y * 5}px)`;
  });
  imageContainer.addEventListener("pointerleave", () => {
    contentImage.style.transform = "";
  });
}
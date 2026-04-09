const sliderRoot = document.querySelector("[data-slider]");
const bookingForm = document.querySelector("[data-booking-form]");
const modalRoot = document.querySelector("[data-modal-root]");
const modalCloseButtons = document.querySelectorAll("[data-modal-close], [data-modal-close-button]");

if (sliderRoot) {
  const viewport = sliderRoot.querySelector("[data-slider-viewport]");
  const track = sliderRoot.querySelector("[data-slider-track]");
  const slides = Array.from(track.children);
  const prevButton = sliderRoot.querySelector("[data-slider-prev]");
  const nextButton = sliderRoot.querySelector("[data-slider-next]");
  const dotsRoot = document.querySelector("[data-slider-dots]");
  let currentIndex = 0;
  let pointerStartX = 0;
  let pointerDeltaX = 0;

  slides.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Перейти к слайду ${index + 1}`);
    dot.addEventListener("click", () => {
      setSliderIndex(index);
    });
    dotsRoot.append(dot);
  });

  const dots = Array.from(dotsRoot.children);

  function getVisibleCount() {
    return window.innerWidth <= 767 ? 1 : 3;
  }

  function getMaxIndex() {
    return Math.max(0, slides.length - getVisibleCount());
  }

  function syncDots() {
    dots.forEach((dot, index) => {
      const isActive = index === currentIndex;
      dot.setAttribute("aria-current", String(isActive));
    });
  }

  function syncButtons() {
    prevButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === getMaxIndex();
  }

  function renderSlider(shouldAnimate = true) {
    sliderRoot.style.setProperty("--slides-per-view", getVisibleCount());
    track.style.transition = shouldAnimate ? "transform 240ms ease" : "none";
    const targetSlide = slides[currentIndex];
    track.style.transform = `translateX(-${targetSlide.offsetLeft}px)`;
    syncDots();
    syncButtons();
  }

  function setSliderIndex(nextIndex, shouldAnimate = true) {
    currentIndex = Math.min(Math.max(nextIndex, 0), getMaxIndex());
    renderSlider(shouldAnimate);
  }

  prevButton.addEventListener("click", () => {
    setSliderIndex(currentIndex - 1);
  });

  nextButton.addEventListener("click", () => {
    setSliderIndex(currentIndex + 1);
  });

  viewport.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setSliderIndex(currentIndex - 1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      setSliderIndex(currentIndex + 1);
    }
  });

  viewport.addEventListener("pointerdown", (event) => {
    pointerStartX = event.clientX;
    pointerDeltaX = 0;
  });

  viewport.addEventListener("pointermove", (event) => {
    pointerDeltaX = event.clientX - pointerStartX;
  });

  viewport.addEventListener("pointerup", () => {
    if (Math.abs(pointerDeltaX) < 42) {
      return;
    }

    if (pointerDeltaX < 0) {
      setSliderIndex(currentIndex + 1);
    } else {
      setSliderIndex(currentIndex - 1);
    }
  });

  viewport.addEventListener("pointerleave", () => {
    pointerDeltaX = 0;
  });

  window.addEventListener("resize", () => {
    const maxIndex = getMaxIndex();
    if (currentIndex > maxIndex) {
      currentIndex = maxIndex;
    }

    renderSlider(false);
  });

  window.addEventListener("load", () => {
    renderSlider(false);
  });
}

document.querySelectorAll("[data-accordion] .accordion__item").forEach((item) => {
  const trigger = item.querySelector(".accordion__trigger");
  const panel = item.querySelector(".accordion__panel");
  const icon = item.querySelector(".accordion__icon");

  trigger.addEventListener("click", () => {
    const isOpen = trigger.getAttribute("aria-expanded") === "true";
    trigger.setAttribute("aria-expanded", String(!isOpen));
    panel.hidden = isOpen;
    item.classList.toggle("is-open", !isOpen);
    icon.textContent = isOpen ? "+" : "−";
  });
});

let lastFocusedElement = null;

function getFocusableElements(root) {
  return Array.from(
    root.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])'
    )
  );
}

function handleModalKeydown(event) {
  if (event.key === "Escape") {
    closeModal();
    return;
  }

  if (event.key !== "Tab") {
    return;
  }

  const focusable = getFocusableElements(modalRoot);
  if (focusable.length === 0) {
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function openModal() {
  lastFocusedElement = document.activeElement;
  modalRoot.hidden = false;
  document.body.classList.add("modal-open");
  document.addEventListener("keydown", handleModalKeydown);
  const closeButton = modalRoot.querySelector("[data-modal-close-button]");
  closeButton.focus();
}

function closeModal() {
  modalRoot.hidden = true;
  document.body.classList.remove("modal-open");
  document.removeEventListener("keydown", handleModalKeydown);
  if (lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus();
  }
}

modalCloseButtons.forEach((button) => {
  button.addEventListener("click", closeModal);
});

if (bookingForm) {
  const statusMessage = bookingForm.querySelector("[data-form-status]");
  const validators = {
    firstName(value) {
      if (value.trim().length < 2) {
        return "Введите имя не короче 2 символов.";
      }
      return "";
    },
    lastName(value) {
      if (value.trim().length < 2) {
        return "Введите фамилию не короче 2 символов.";
      }
      return "";
    },
    email(value) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value.trim())) {
        return "Укажите корректный email.";
      }
      return "";
    },
    phone(value) {
      const digits = value.replace(/\D/g, "");
      if (digits.length < 10) {
        return "Укажите телефон минимум из 10 цифр.";
      }
      return "";
    }
  };

  function setFieldError(input, message) {
    const errorNode = bookingForm.querySelector(`[data-error-for="${input.id}"]`);
    input.setAttribute("aria-invalid", String(Boolean(message)));
    errorNode.textContent = message;
  }

  function validateInput(input) {
    const validator = validators[input.name];
    if (!validator) {
      return true;
    }

    const message = validator(input.value);
    setFieldError(input, message);
    return !message;
  }

  Array.from(bookingForm.elements).forEach((field) => {
    if (!(field instanceof HTMLInputElement)) {
      return;
    }

    field.addEventListener("input", () => {
      validateInput(field);
      statusMessage.textContent = "";
    });
  });

  bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const inputs = Array.from(
      bookingForm.querySelectorAll("input")
    );

    const isFormValid = inputs.every((input) => validateInput(input));
    if (!isFormValid) {
      statusMessage.textContent = "Проверьте заполнение полей формы.";
      const firstInvalidInput = inputs.find((input) => input.getAttribute("aria-invalid") === "true");
      if (firstInvalidInput) {
        firstInvalidInput.focus();
      }
      return;
    }

    statusMessage.textContent = "";
    bookingForm.reset();
    inputs.forEach((input) => setFieldError(input, ""));
    openModal();
  });
}

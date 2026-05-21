// ===== CONFIGURACIÃ“N GLOBAL =====

const API_BASE_URL = window.API_BASE_URL || "https://mi-proyecto-1-hbxf.onrender.com/api";
const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");
let postsAutoRefreshId = null;

/**
 * Realiza una peticiÃ³n fetch con el token de autenticaciÃ³n
 */
async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem("authToken");
  const headers = {
    ...options.headers,
  };
  const isFormData = options.body instanceof FormData;

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: options.credentials || "include",
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: response.statusText }));
      throw new Error(
        error.error || `Error ${response.status}: ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    // Si es un error de red o de parsing
    if (error instanceof TypeError) {
      throw new Error(
        "No se puede conectar al servidor. Asegúrate de que está corriendo en puerto 5000",
      );
    }
    throw error;
  }
}

// Hacer que el avatar del header navegue al perfil (propio)
document.addEventListener("DOMContentLoaded", () => {
  const headerAvatar = document.getElementById("headerAvatar");
  if (headerAvatar) {
    headerAvatar.style.cursor = "pointer";
    headerAvatar.addEventListener("click", () => {
      const user = getStoredUser();
      if (user && user._id) {
        window.location.href = `profile.html?id=${user._id}`;
      } else {
        window.location.href = "index.html";
      }
    });
  }
});

function isImagePath(value) {
  return (
    typeof value === "string" &&
    (value.startsWith("/uploads/") ||
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("data:image/"))
  );
}

function resolveAssetUrl(value) {
  if (typeof value !== "string") {
    return "";
  }

  if (value.startsWith("data:image/")) {
    return value;
  }

  if (value.startsWith("/uploads/")) {
    return `${API_ORIGIN}${value}`;
  }

  return value;
}

function renderAvatarMarkup(
  avatar,
  fallback = "👤",
  className = "avatar-image",
  isOnline = false,
) {
  const onlineClass = isOnline ? "online" : "offline";
  const avatarContent = isImagePath(avatar)
    ? `<img src="${resolveAssetUrl(avatar)}" alt="Avatar" class="${className}">`
    : fallback;

  return `
        <div class="profile-avatar-wrapper">
            ${avatarContent}
            <span class="online-indicator ${onlineClass}"></span>
        </div>
    `;
}

function setAvatarContent(
  element,
  avatar,
  fallback = "👤",
  className = "avatar-image",
) {
  if (!element) {
    return;
  }

  element.innerHTML = renderAvatarMarkup(avatar, fallback, className);
}

function updateStoredUser(user) {
  localStorage.setItem("userLogged", JSON.stringify(user));
}

async function resizeImageToDataUrl(file, maxSize = 320, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(
          maxSize / image.width,
          maxSize / image.height,
          1,
        );
        const width = Math.round(image.width * scale);
        const height = Math.round(image.height * scale);

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", quality));
      };

      image.onerror = () =>
        reject(new Error("No se pudo procesar la imagen seleccionada."));
      image.src = reader.result;
    };

    reader.onerror = () =>
      reject(new Error("No se pudo leer la imagen seleccionada."));
    reader.readAsDataURL(file);
  });
}

/**
 * Muestra una notificaciÃ³n en pantalla
 */
function showNotification(message, type = "success") {
  const container = document.getElementById("notificationContainer");
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
        <span class="notification-icon">${type === "success" ? "✓" : "✕"}</span>
        <span class="notification-text">${message}</span>
    `;
  container.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "fadeOut 0.3s ease-out forwards";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ===== LOGIN PAGE FUNCIONALIDAD =====

function toggleForm(event) {
  event.preventDefault();
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (loginForm.classList.contains("active-form")) {
    loginForm.classList.remove("active-form");
    registerForm.classList.add("active-form");
  } else {
    registerForm.classList.remove("active-form");
    loginForm.classList.add("active-form");
  }
}

/**
 * Valida el formato del email
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Maneja el login
 */
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const submitBtn = event.target.querySelector(".btn-submit");

  // Validaciones
  if (!validateEmail(email)) {
    showNotification("Por favor introduce un email válido", "error");
    return;
  }

  if (password.length < 6) {
    showNotification("La contraseña debe tener al menos 6 caracteres", "error");
    return;
  }

  // Mostrar animaciÃ³n de carga
  submitBtn.classList.add("loading");
  submitBtn.disabled = true;

  try {
    const response = await apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    // Guardar token y datos de usuario
    localStorage.setItem("authToken", response.token);
    localStorage.setItem("userLogged", JSON.stringify(response.user));

    showNotification("¡Iniciando sesión...", "success");

    setTimeout(() => {
      window.location.href = "main.html";
    }, 1500);
  } catch (error) {
    showNotification(error.message, "error");
    submitBtn.classList.remove("loading");
    submitBtn.disabled = false;
  }
}

/**
 * Maneja el registro
 */
async function handleRegister(event) {
  event.preventDefault();

  const firstName = document.getElementById("registerFirstName").value;
  const lastName = document.getElementById("registerLastName").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  const confirmPassword = document.getElementById(
    "registerConfirmPassword",
  ).value;
  const submitBtn = event.target.querySelector(".btn-submit");

  // Validaciones
  if (!firstName.trim() || !lastName.trim()) {
    showNotification("Por favor completa tu nombre", "error");
    return;
  }

  if (!validateEmail(email)) {
    showNotification("Por favor introduce un email válido", "error");
    return;
  }

  if (password !== confirmPassword) {
    showNotification("Las contraseÃ±as no coinciden", "error");
    return;
  }

  if (password.length < 6) {
    showNotification("La contraseña debe tener al menos 6 caracteres", "error");
    return;
  }

  // Mostrar animaciÃ³n de carga
  submitBtn.classList.add("loading");
  submitBtn.disabled = true;

  try {
    const response = await apiCall("/auth/registro", {
      method: "POST",
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
      }),
    });

    // Guardar token y datos de usuario
    localStorage.setItem("authToken", response.token);
    localStorage.setItem("userLogged", JSON.stringify(response.user));

    showNotification("¡Registro completado!", "success");

    setTimeout(() => {
      window.location.href = "main.html";
    }, 1500);
  } catch (error) {
    showNotification(error.message, "error");
    submitBtn.classList.remove("loading");
    submitBtn.disabled = false;
  }
}

/**
 * Inicializa los listeners en la pÃ¡gina de login
 */
function initLoginPage() {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }
}

// ===== MAIN PAGE FUNCIONALIDAD =====

/**
 * Carga los datos del usuario en la pÃ¡gina principal
 */
function loadUserData() {
  const token = localStorage.getItem("authToken");
  const userData = localStorage.getItem("userLogged");

  if (!token || !userData) {
    window.location.href = "index.html";
    return;
  }

  const user = JSON.parse(userData);
  const userName = document.getElementById("userName");
  const profileName = document.getElementById("profileName");
  const headerAvatar = document.getElementById("headerAvatar");
  const sidebarProfileAvatar = document.getElementById("sidebarProfileAvatar");
  const composerAvatar = document.getElementById("composerAvatar");

  applyUserNameElement(userName, user);
  applyUserNameElement(profileName, user);

  setAvatarContent(headerAvatar, user.avatar, "👤", "avatar-image");
  setAvatarContent(
    sidebarProfileAvatar,
    user.avatar,
    "👤",
    "profile-avatar-image",
  );
  setAvatarContent(composerAvatar, user.avatar, "👤", "avatar-image");
}

function getStoredUser() {
  const userData = localStorage.getItem("userLogged");
  return userData ? JSON.parse(userData) : null;
}

function isCurrentUserAdmin(userData = getStoredUser()) {
  return Boolean(userData?.isAdmin);
}

function formatUserName(user) {
  if (!user) {
    return "Usuario";
  }

  if (typeof user === "string") {
    return user.trim() || "Usuario";
  }

  return `${user.firstName || "Usuario"} ${user.lastName || ""}`.trim();
}

function isUserVerified(user) {
  return Boolean(user && user.isVerified);
}

function renderUserNameMarkup(user, options = {}) {
  const {
    link = "",
    className = "",
    nameClass = "",
    tag = "span",
    wrapClass = "user-name-wrap",
  } = options;

  const verified = isUserVerified(user);
  const name = formatUserName(user);
  const displayClass = [
    "user-display-name",
    verified ? "user-name--verified" : "",
    nameClass,
  ]
    .filter(Boolean)
    .join(" ");
  const badge = verified
    ? '<span class="verified-badge" title="Cuenta verificada" aria-hidden="true">✓</span>'
    : "";
  const inner = `<span class="${displayClass}">${escapeHtml(name)}</span>${badge}`;

  if (link) {
    const linkClass = [
      "post-author-link",
      "user-name-link",
      verified ? "user-name-link--verified" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return `<a href="${link}" class="${linkClass}">${inner}</a>`;
  }

  const wrapClasses = [wrapClass, className].filter(Boolean).join(" ");
  return `<${tag} class="${wrapClasses}">${inner}</${tag}>`;
}

function applyUserNameElement(element, user, options = {}) {
  if (!element) {
    return;
  }

  const verified = isUserVerified(user);
  const link = options.link || "";

  if (link) {
    element.innerHTML = renderUserNameMarkup(user, { ...options, link });
    return;
  }

  element.innerHTML = renderUserNameMarkup(user, options);
  if (!verified && options.plainTextFallback) {
    element.textContent = formatUserName(user);
  }
}

function resolvePostAuthorUser(post) {
  if (post.userId && typeof post.userId === "object") {
    return post.userId;
  }

  if (post.author && typeof post.author === "object") {
    return post.author;
  }

  return null;
}

function isAnyVideoPlaying() {
  return Array.from(document.querySelectorAll("video")).some((video) => {
    return !video.paused && !video.ended && video.currentTime > 0;
  });
}

function isStoryViewerOpen() {
  const modal = document.getElementById("storyViewerModal");
  return Boolean(modal && !modal.classList.contains("hidden"));
}

function isVidPlayerOpen() {
  const modal = document.getElementById("vidPlayerModal");
  return Boolean(modal && !modal.classList.contains("hidden"));
}

function shouldPauseFeedRefresh() {
  const activeEl = document.activeElement;
  const userIsTyping =
    activeEl &&
    (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA");

  return (
    document.hidden ||
    userIsTyping ||
    isAnyVideoPlaying() ||
    isStoryViewerOpen() ||
    isVidPlayerOpen()
  );
}

function applyTheme() {
  const savedTheme = localStorage.getItem("themeMode") || "light";
  document.body.classList.toggle("dark-mode", savedTheme === "dark");
}

function initSettingsPanel() {
  if (document.getElementById("settingsModal")) {
    return;
  }

  document.body.insertAdjacentHTML(
    "beforeend",
    `
        <div id="settingsModal" class="modal-overlay hidden">
            <div class="modal-panel settings-panel">
                <div class="modal-header">
                    <h3>Ajustes</h3>
                    <button id="closeSettingsBtn" type="button" class="modal-close-btn">×</button>
                </div>
                <label class="setting-row">
                    <span>
                        <strong>Modo oscuro</strong>
                        <small>Cambia la apariencia de Sirnergia.</small>
                    </span>
                    <input id="darkModeToggle" type="checkbox">
                </label>
            </div>
        </div>
    `,
  );

  const modal = document.getElementById("settingsModal");
  const toggle = document.getElementById("darkModeToggle");
  const closeBtn = document.getElementById("closeSettingsBtn");

  toggle.checked = localStorage.getItem("themeMode") === "dark";
  toggle.addEventListener("change", () => {
    localStorage.setItem("themeMode", toggle.checked ? "dark" : "light");
    applyTheme();
  });

  const close = () => modal.classList.add("hidden");
  closeBtn.addEventListener("click", close);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      close();
    }
  });

  document.querySelectorAll('[data-open-settings="true"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      toggle.checked = localStorage.getItem("themeMode") === "dark";
      modal.classList.remove("hidden");
    });
  });
}

async function cropImageToSquareDataUrl(file, size = 420, quality = 0.9) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d");
        const cropSize = Math.min(image.width, image.height);
        const sourceX = Math.round((image.width - cropSize) / 2);
        const sourceY = Math.round((image.height - cropSize) / 2);
        context.drawImage(
          image,
          sourceX,
          sourceY,
          cropSize,
          cropSize,
          0,
          0,
          size,
          size,
        );
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.onerror = () =>
        reject(new Error("No se pudo ajustar la imagen seleccionada."));
      image.src = reader.result;
    };

    reader.onerror = () =>
      reject(new Error("No se pudo leer la imagen seleccionada."));
    reader.readAsDataURL(file);
  });
}

async function adjustPostImageFile(
  file,
  fitMode = "cover",
  size = 1080,
  quality = 0.9,
) {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d");
        context.fillStyle = "#111827";
        context.fillRect(0, 0, size, size);

        if (fitMode === "contain") {
          const scale = Math.min(size / image.width, size / image.height);
          const width = image.width * scale;
          const height = image.height * scale;
          context.drawImage(
            image,
            (size - width) / 2,
            (size - height) / 2,
            width,
            height,
          );
        } else {
          const sourceSize = Math.min(image.width, image.height);
          const sourceX = (image.width - sourceSize) / 2;
          const sourceY = (image.height - sourceSize) / 2;
          context.drawImage(
            image,
            sourceX,
            sourceY,
            sourceSize,
            sourceSize,
            0,
            0,
            size,
            size,
          );
        }

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("No se pudo ajustar la foto."));
              return;
            }
            resolve(
              new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
                type: "image/jpeg",
              }),
            );
          },
          "image/jpeg",
          quality,
        );
      };
      image.onerror = () =>
        reject(new Error("No se pudo ajustar la foto seleccionada."));
      image.src = reader.result;
    };
    reader.onerror = () =>
      reject(new Error("No se pudo leer la foto seleccionada."));
    reader.readAsDataURL(file);
  });
}

function initMobileMenu() {
  const menuButton = document.getElementById("mobileMenuBtn");
  if (!menuButton) {
    return;
  }

  let mobileMenu = document.getElementById("mobileMenu");
  if (!mobileMenu) {
    mobileMenu = document.createElement("nav");
    mobileMenu.id = "mobileMenu";
    mobileMenu.className = "mobile-menu";
    mobileMenu.setAttribute("aria-label", "Menu movil");
    document.body.appendChild(mobileMenu);
  }

  const user = getStoredUser();
  const ownProfileHref =
    user && user._id ? `profile.html?id=${user._id}` : "profile.html";
  const isProfilePage = document.body.classList.contains("profile-page");
  const isChatPage = document.body.classList.contains("chat-page");
  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get("id");
  const isOwnProfile =
    !isProfilePage ||
    !requestedId ||
    String(requestedId) === String(user ? user._id : "");

  const profileLinks = `
        <a href="main.html">🏠 Volver al feed</a>
        <a href="chat.html">💬 Chats</a>
        <a href="main.html?view=people">Personas</a>
        <a href="main.html?feed=friends">Amigos 👥</a>
        <a href="main.html?view=vid">🎬 Vid</a>
        <a href="main.html?story=create" data-open-story="true">Historias</a>
        <a href="#" data-open-settings="true">⚙️ Configuración</a>
        <a href="#" data-open-games="true">🎮 Juegos</a>
        <a href="#" data-open-events="true">📅 Eventos</a>
        <a href="#" data-open-saved="true">🔖 Guardados</a>
        ${isOwnProfile ? '<a href="customize-profile.html">✏️ Personalizar perfil</a>' : ""}
        <a href="#profileFriendsCard">👥 Ver amigos</a>
        <a href="#profilePostsContainer">${isOwnProfile ? "📝 Mis publicaciones" : "📝 Publicaciones"}</a>
    `;

  const chatLinks = `
        <a href="main.html">🏠 Volver al feed</a>
        <a href="${ownProfileHref}">👥 Mi perfil</a>
        <a href="main.html?view=people">Personas</a>
        <a href="main.html?feed=friends">Amigos 👥</a>
        <a href="main.html?view=vid">🎬 Vid</a>
        <a href="#" data-open-settings="true">⚙️ Configuración</a>
        <a href="#" data-open-games="true">🎮 Juegos</a>
        <a href="#" data-open-events="true">📅 Eventos</a>
        <a href="#" data-open-saved="true">🔖 Guardados</a>
    `;

  const feedLinks = `
        <a href="${ownProfileHref}">👥 Mi perfil</a>
        <a href="chat.html">💬 Chats</a>
        <a href="main.html?view=people">Personas</a>
        <a href="main.html?feed=friends">Amigos 👥</a>
        <a href="main.html?view=vid">🎬 Vid</a>
        <a href="main.html?story=create" data-open-story="true">Historias</a>
        <a href="#" data-open-settings="true">⚙️ Configuración</a>
        <a href="#" data-open-games="true">🎮 Juegos</a>
        <a href="#" data-open-events="true">📅 Eventos</a>
        <a href="#" data-open-saved="true">🔖 Guardados</a>
    `;

  let activeLinks;
  if (isChatPage) {
    activeLinks = chatLinks;
  } else if (isProfilePage) {
    activeLinks = profileLinks;
  } else {
    activeLinks = feedLinks;
  }

  mobileMenu.innerHTML = `
        <div class="menu-section">
            <strong>Acciones rápidas</strong>
            <div class="quick-links">
                ${activeLinks}
            </div>
        </div>
        <button type="button" class="mobile-menu-logout">Cerrar sesión</button>
    `;

  const closeMenu = () => {
    mobileMenu.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  };

  menuButton.setAttribute("aria-controls", "mobileMenu");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = mobileMenu.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (link.dataset.openSettings === "true") {
        event.preventDefault();
        const settingsModal = document.getElementById("settingsModal");
        if (settingsModal) {
          settingsModal.classList.remove("hidden");
        }
      }

      if (link.dataset.openGames === "true") {
        event.preventDefault();
        if (typeof openGamesModal === "function") {
          openGamesModal();
        } else {
          window.location.href = "main.html?games=1";
        }
      }

      if (link.dataset.openEvents === "true") {
        event.preventDefault();
        const eventsModal = document.getElementById("eventsModal");
        if (eventsModal) {
          eventsModal.classList.remove("hidden");
          if (typeof loadEvents === "function") loadEvents();
        } else {
          window.location.href = "main.html";
        }
      }

      if (link.dataset.openSaved === "true") {
        event.preventDefault();
        const savedModal = document.getElementById("savedPostsModal");
        if (savedModal) {
          savedModal.classList.remove("hidden");
          const list = document.getElementById("savedPostsList");
          if (list) {
            list.innerHTML = "Cargando...";
            apiCall("/posts/saved", { method: "GET" })
              .then((posts) => {
                if (!Array.isArray(posts) || !posts.length) {
                  list.innerHTML =
                    "<p style='color:#777;text-align:center'>No has guardado ningún post.</p>";
                  return;
                }
                list.innerHTML = "";
                posts.forEach((post) => {
                  const el = createPostElement(
                    post,
                    getTimeAgo(post.createdAt),
                  );
                  list.appendChild(el);
                });
              })
              .catch(() => {
                list.innerHTML =
                  "<p style='color:#c00'>Error al cargar guardados.</p>";
              });
          }
        } else {
          window.location.href = "main.html";
        }
      }

      if (link.dataset.openStory === "true") {
        event.preventDefault();
        if (typeof openStoryComposer === "function") {
          openStoryComposer();
        } else {
          window.location.href = "main.html?story=create";
        }
      }

      closeMenu();
    });
  });

  const mobileLogout = mobileMenu.querySelector(".mobile-menu-logout");
  if (mobileLogout) {
    mobileLogout.addEventListener("click", () => {
      closeMenu();
      handleLogout();
    });
  }

  document.addEventListener("click", (event) => {
    if (!mobileMenu.contains(event.target) && event.target !== menuButton) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      closeMenu();
    }
  });
}

function debounce(fn, delay = 250) {
  let timeoutId;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => fn(...args), delay);
  };
}

function getSearchQueryFromUrl() {
  return new URLSearchParams(window.location.search).get("search") || "";
}

function getMainViewFromUrl() {
  return new URLSearchParams(window.location.search).get("view") || "";
}

function getFeedFilterFromUrl() {
  return new URLSearchParams(window.location.search).get("feed") || "";
}

function renderFeedHeading(titleText, descriptionText) {
  const postsContainer = document.getElementById("postsContainer");
  if (!postsContainer) {
    return null;
  }

  const title = document.createElement("div");
  title.className = "search-results-heading";
  title.innerHTML = `<strong>${escapeHtml(titleText)}</strong><span>${escapeHtml(descriptionText)}</span>`;
  postsContainer.appendChild(title);
  return title;
}

async function renderPeopleDirectory() {
  const postsContainer = document.getElementById("postsContainer");
  if (!postsContainer) {
    return;
  }

  // Ocultar el card de amigos sugeridos cuando se está en la sección de personas
  const suggestedContainer = document.getElementById(
    "suggestedFriendsContainer",
  );
  if (suggestedContainer) {
    suggestedContainer.closest(".sidebar-card").style.display = "none";
  }

  postsContainer.innerHTML = "";
  postsContainer.insertAdjacentHTML(
    "beforeend",
    `<div class="back-to-feed-bar"><a href="main.html" class="back-to-feed-btn">← Volver al feed</a></div>`,
  );
  renderFeedHeading("Personas", "Usuarios que todavia no tienes agregados.");

  try {
    const currentProfile = await refreshCurrentUserProfile();
    const users = await apiCall("/users", { method: "GET" });
    const currentUserId = String(currentProfile._id);
    const friendIds = new Set(getFriendIds(currentProfile));
    const people = users.filter(
      (user) =>
        String(user._id) !== currentUserId && !friendIds.has(String(user._id)),
    );

    if (!people.length) {
      postsContainer.insertAdjacentHTML(
        "beforeend",
        '<div class="empty-state">No hay personas nuevas para agregar por ahora.</div>',
      );
      return;
    }

    const list = document.createElement("div");
    list.className = "people-directory";
    list.innerHTML = people
      .map(
        (user) => `
            <article class="person-card">
                <a href="profile.html?id=${user._id}" class="person-card-avatar">${renderAvatarMarkup(user.avatar, "👤", "profile-avatar-image")}</a>
                <div class="person-card-info">
                    ${renderUserNameMarkup(user, { link: `profile.html?id=${user._id}`, className: "person-card-name" })}
                    <p>${escapeHtml(user.bio || "Nuevo en Sirnergia")}</p>
                </div>
                <button class="add-friend-btn" data-user-id="${user._id}">+ Amigo</button>
            </article>
        `,
      )
      .join("");

    postsContainer.appendChild(list);
    list.querySelectorAll(".add-friend-btn").forEach((button) => {
      button.addEventListener("click", () =>
        handleAddFriend(button.dataset.userId),
      );
    });
  } catch (error) {
    console.error("Error al cargar personas:", error);
    postsContainer.insertAdjacentHTML(
      "beforeend",
      '<div class="empty-state">No se pudieron cargar las personas.</div>',
    );
  }
}

async function renderVidSection() {
  const postsContainer = document.getElementById("postsContainer");
  if (!postsContainer) return;

  // Ocultar amigos sugeridos igual que en "Personas"
  const suggestedContainer = document.getElementById(
    "suggestedFriendsContainer",
  );
  if (suggestedContainer)
    suggestedContainer.closest(".sidebar-card").style.display = "none";

  postsContainer.innerHTML = "";
  postsContainer.insertAdjacentHTML(
    "beforeend",
    `<div class="back-to-feed-bar"><a href="main.html" class="back-to-feed-btn">← Volver al feed</a></div>`,
  );
  renderFeedHeading("🎬 Vid", "Todos los videos publicados en Sirnergia.");

  try {
    const response = await apiCall("/posts?page=1&limit=50", { method: "GET" });
    const allPosts = response.posts || [];

    // Filtrar solo posts que tengan al menos un video
    const videoPosts = allPosts.filter(
      (post) =>
        post.photos &&
        post.photos.some((p) => /\.(mp4|webm|mov|avi)$/i.test(p)),
    );

    if (!videoPosts.length) {
      postsContainer.insertAdjacentHTML(
        "beforeend",
        '<div class="empty-state">Aún no hay videos publicados. ¡Sé el primero!</div>',
      );
      return;
    }

    // Renderizar en grid de videos
    const grid = document.createElement("div");
    grid.className = "vid-grid";

    videoPosts.forEach((post) => {
      const userData = JSON.parse(localStorage.getItem("userLogged"));
      const authorUser = resolvePostAuthorUser(post);
      const authorName = formatUserName(authorUser || post.author);
      const postUserId =
        typeof post.userId === "object" ? post.userId._id : post.userId;
      const authorAvatar =
        authorUser?.avatar ||
        (typeof post.author === "object" ? post.author?.avatar : null) ||
        (post.userId && typeof post.userId === "object"
          ? post.userId.avatar
          : null);

      const videos = post.photos.filter((p) =>
        /\.(mp4|webm|mov|avi)$/i.test(p),
      );

      videos.forEach((videoPath) => {
        const card = document.createElement("div");
        card.className = "vid-card";
        card.innerHTML = `
                    <video src="${resolveAssetUrl(videoPath)}" class="vid-thumb" muted playsinline preload="metadata"></video>
                    <div class="vid-card-overlay">
                        <div class="vid-card-author">
                            <div class="vid-avatar">${renderAvatarMarkup(authorAvatar, "👤")}</div>
                            ${renderUserNameMarkup(authorUser || { firstName: authorName }, { link: `profile.html?id=${postUserId}`, className: "vid-author-name" })}
                        </div>
                        ${post.content ? `<p class="vid-caption">${escapeHtml(post.content.slice(0, 80))}${post.content.length > 80 ? "…" : ""}</p>` : ""}
                    </div>
                    <button class="vid-play-btn">▶</button>
                `;

        // Hover: reproducir preview
        const vidEl = card.querySelector("video");
        const playBtn = card.querySelector(".vid-play-btn");

        card.addEventListener("mouseenter", () => {
          vidEl.play().catch(() => {});
          playBtn.style.display = "none";
        });
        card.addEventListener("mouseleave", () => {
          vidEl.pause();
          vidEl.currentTime = 0;
          playBtn.style.display = "flex";
        });

        // Click: abrir en modal de reproducción completa
        playBtn.addEventListener("click", () =>
          openVidPlayer(
            videoPath,
            post,
            authorName,
            authorAvatar,
            postUserId,
            authorUser,
          ),
        );
        vidEl.addEventListener("click", () =>
          openVidPlayer(
            videoPath,
            post,
            authorName,
            authorAvatar,
            postUserId,
            authorUser,
          ),
        );

        grid.appendChild(card);
      });
    });

    postsContainer.appendChild(grid);
  } catch (error) {
    console.error("Error al cargar videos:", error);
    postsContainer.insertAdjacentHTML(
      "beforeend",
      '<div class="empty-state">No se pudieron cargar los videos.</div>',
    );
  }
}

function openVidPlayer(
  videoPath,
  post,
  authorName,
  authorAvatar,
  postUserId,
  authorUser = null,
) {
  let modal = document.getElementById("vidPlayerModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "vidPlayerModal";
    modal.className = "modal-overlay";
    modal.innerHTML = `
            <div class="vid-player-panel">
                <button class="vid-player-close">×</button>
                <video id="vidPlayerVideo" controls playsinline style="width:100%;max-height:70vh;background:#000;border-radius:8px;"></video>
                <div class="vid-player-info">
                    <div class="vid-player-author">
                        <div id="vidPlayerAvatar" class="profile-avatar-small"></div>
                        <a id="vidPlayerName" href="#" class="post-author-link" style="font-size:15px;font-weight:700;"></a>
                    </div>
                    <p id="vidPlayerCaption" style="color:var(--text-secondary);font-size:14px;margin-top:6px;"></p>
                </div>
            </div>
        `;
    document.body.appendChild(modal);
    modal.querySelector(".vid-player-close").addEventListener("click", () => {
      modal.querySelector("#vidPlayerVideo").pause();
      modal.querySelector("#vidPlayerVideo").src = "";
      modal.classList.add("hidden");
    });
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.querySelector("#vidPlayerVideo").pause();
        modal.querySelector("#vidPlayerVideo").src = "";
        modal.classList.add("hidden");
      }
    });
  }

  const vidEl = modal.querySelector("#vidPlayerVideo");
  vidEl.addEventListener(
    "canplay",
    () => {
      vidEl.play().catch(() => {});
    },
    { once: true },
  );
  vidEl.src = resolveAssetUrl(videoPath);
  vidEl.load();
  modal.querySelector("#vidPlayerAvatar").innerHTML = renderAvatarMarkup(
    authorAvatar,
    "👤",
  );
  const nameEl = modal.querySelector("#vidPlayerName");
  const vidAuthor = authorUser || { firstName: authorName };
  nameEl.href = `profile.html?id=${postUserId}`;
  nameEl.className = [
    "post-author-link",
    "user-name-link",
    isUserVerified(vidAuthor) ? "user-name-link--verified" : "",
  ]
    .filter(Boolean)
    .join(" ");
  nameEl.innerHTML = renderUserNameMarkup(vidAuthor);
  modal.querySelector("#vidPlayerCaption").textContent = post.content || "";
  modal.classList.remove("hidden");
}

function renderSearchResults(posts, query) {
  const postsContainer = document.getElementById("postsContainer");
  if (!postsContainer) {
    return;
  }

  postsContainer.innerHTML = "";

  if (!posts.length) {
    postsContainer.innerHTML = `<div class="empty-state">No se encontraron publicaciones para "${escapeHtml(query)}".</div>`;
    return;
  }

  const title = document.createElement("div");
  title.className = "search-results-heading";
  title.innerHTML = `<strong>Resultados de publicaciones</strong><span>${posts.length} resultado${posts.length === 1 ? "" : "s"} para "${escapeHtml(query)}"</span>`;
  postsContainer.appendChild(title);

  posts.forEach((post) => {
    const timeAgo = getTimeAgo(post.createdAt);
    postsContainer.appendChild(createPostElement(post, timeAgo));
  });

  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}

function renderSearchSuggestions(container, results, query) {
  const users = Array.isArray(results.users) ? results.users : [];
  const posts = Array.isArray(results.posts) ? results.posts : [];

  if (!users.length && !posts.length) {
    container.innerHTML = `<div class="search-empty">No hay resultados para "${escapeHtml(query)}".</div>`;
    container.classList.add("open");
    return;
  }

  const userItems = users
    .map(
      (user) => `
        <a href="profile.html?id=${user._id}" class="search-result-item">
            <div class="search-result-avatar">${renderAvatarMarkup(user.avatar, "👤", "avatar-image")}</div>
            <div>
                ${renderUserNameMarkup(user, { tag: "strong" })}
                <span>${escapeHtml(user.bio || "Ver perfil")}</span>
            </div>
        </a>
    `,
    )
    .join("");

  const postItems = posts
    .map((post) => {
      const author =
        post.userId && typeof post.userId === "object"
          ? `${post.userId.firstName || ""} ${post.userId.lastName || ""}`.trim()
          : post.author || "Usuario";

      return `
            <a href="main.html?search=${encodeURIComponent(query)}#post-${post._id}" class="search-result-item">
                <div class="search-result-icon">📝</div>
                <div>
                    <strong>${escapeHtml(author)}</strong>
                    <span>${escapeHtml(post.content.length > 90 ? `${post.content.slice(0, 90)}...` : post.content)}</span>
                </div>
            </a>
        `;
    })
    .join("");

  container.innerHTML = `
        ${users.length ? `<div class="search-section-title">Personas</div>${userItems}` : ""}
        ${posts.length ? `<div class="search-section-title">Publicaciones</div>${postItems}` : ""}
        <button type="button" class="search-view-all">Ver todos los resultados</button>
    `;
  container.classList.add("open");

  const viewAll = container.querySelector(".search-view-all");
  if (viewAll) {
    viewAll.addEventListener("click", () => {
      window.location.href = `main.html?search=${encodeURIComponent(query)}`;
    });
  }
}

async function searchSirnergia(query) {
  return apiCall(`/search?q=${encodeURIComponent(query)}`, { method: "GET" });
}

async function loadStories() {
  const tray = document.getElementById("storiesTray");
  if (!tray) {
    return;
  }

  try {
    const stories = await apiCall("/stories", { method: "GET" });
    tray.innerHTML = "";

    if (!stories.length) {
      tray.innerHTML = '<div class="story-empty">Aun no hay historias.</div>';
      return;
    }

    // Agrupar historias por usuario — un botón por persona
    // pero guardar lista plana global para navegar entre todas
    const grouped = [];
    const seenUsers = new Map();
    stories.forEach((story) => {
      const uid = String(
        (story.userId && story.userId._id) || story.userId || "unknown",
      );
      if (seenUsers.has(uid)) {
        seenUsers.get(uid).push(story);
      } else {
        const group = [story];
        seenUsers.set(uid, group);
        grouped.push(group);
      }
    });

    // Lista plana de todas las historias en orden para navegación global
    const allStoriesFlat = grouped.flat();

    grouped.forEach((group) => {
      const author = group[0].userId || {};
      const button = document.createElement("button");
      button.type = "button";
      button.className = "story-card";
      if (group.length > 1) button.classList.add("story-card-multiple");
      button.innerHTML = `
                <span class="story-avatar">${renderAvatarMarkup(author.avatar, "👤", "avatar-image")}</span>
                ${renderUserNameMarkup(author, { tag: "strong" })}
                ${group.length > 1 ? `<span class="story-count">${group.length}</span>` : ""}
            `;
      // Al hacer clic abre la primera historia del grupo pero con la lista global
      const globalIndex = allStoriesFlat.indexOf(group[0]);
      button.addEventListener("click", () =>
        openStoryViewer(group[0], allStoriesFlat, globalIndex),
      );
      tray.appendChild(button);
    });
  } catch (error) {
    console.error("Error al cargar historias:", error);
    tray.innerHTML =
      '<div class="story-empty">No se pudieron cargar historias.</div>';
  }
}

function openStoryComposer() {
  const modal = document.getElementById("storyComposerModal");
  if (modal) {
    modal.classList.remove("hidden");
    showStoryStep("step1");
  }
}

function closeStoryComposer() {
  const modal = document.getElementById("storyComposerModal");
  if (modal) modal.classList.add("hidden");
  stopStoryCamera();
  _storyEditorFile = null;
  _storyEditorOverlays = [];
  _storyCurrentFilter = "none";
  const mediaInput = document.getElementById("storyMediaInput");
  if (mediaInput) mediaInput.value = "";
}

function showStoryStep(step) {
  ["storyStep1", "storyStep2Camera", "storyStep3Editor"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });
  const target = document.getElementById(
    step === "step1"
      ? "storyStep1"
      : step === "camera"
        ? "storyStep2Camera"
        : "storyStep3Editor",
  );
  if (target) target.classList.remove("hidden");
}

// ---- Cámara ----
let _cameraStream = null;
let _cameraFacingMode = "user";

async function startStoryCamera() {
  stopStoryCamera();
  try {
    _cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: _cameraFacingMode },
      audio: false,
    });
    const feed = document.getElementById("storyCameraFeed");
    if (feed) {
      feed.srcObject = _cameraStream;
    }
  } catch (e) {
    showNotification("No se pudo acceder a la cámara", "error");
    showStoryStep("step1");
  }
}

function stopStoryCamera() {
  if (_cameraStream) {
    _cameraStream.getTracks().forEach((t) => t.stop());
    _cameraStream = null;
  }
  const feed = document.getElementById("storyCameraFeed");
  if (feed) feed.srcObject = null;
}

function captureStoryPhoto() {
  const feed = document.getElementById("storyCameraFeed");
  const canvas = document.getElementById("storyCaptureCanvas");
  if (!feed || !canvas) return;
  canvas.width = feed.videoWidth;
  canvas.height = feed.videoHeight;
  canvas.getContext("2d").drawImage(feed, 0, 0);
  canvas.toBlob(
    (blob) => {
      if (!blob) return;
      const file = new File([blob], "story-capture.jpg", {
        type: "image/jpeg",
      });
      stopStoryCamera();
      openStoryEditor(file);
    },
    "image/jpeg",
    0.92,
  );
}

// ---- Editor ----
let _storyEditorFile = null;
let _storyEditorOverlays = []; // { type:'text'|'sticker', content, x, y, color, size, el }
let _storyCurrentFilter = "none";
let _storyTextColor = "#ffffff";
let _storyTextSize = 20;

function openStoryEditor(file) {
  _storyEditorFile = file;
  _storyEditorOverlays = [];
  _storyCurrentFilter = "none";
  showStoryStep("editor");

  const mediaEl = document.getElementById("storyEditorMedia");
  if (!mediaEl) return;

  const url = URL.createObjectURL(file);
  if (file.type.startsWith("video/")) {
    mediaEl.innerHTML = `<video src="${url}" autoplay loop muted playsinline style="width:100%;height:100%;object-fit:cover;" id="storyEditorVideo"></video>`;
    // Mostrar controles de duración cuando el video cargue
    const vid = mediaEl.querySelector("video");
    vid.addEventListener("loadedmetadata", () => {
      showStoryVideoControls(vid);
    });
  } else {
    mediaEl.innerHTML = `<img src="${url}" alt="Historia" style="width:100%;height:100%;object-fit:cover;" id="storyEditorImg">`;
    showStoryImageControls();
  }
  applyStoryFilter(_storyCurrentFilter);

  // Limpiar overlays anteriores
  const canvas = document.getElementById("storyEditorCanvas");
  if (canvas)
    canvas.querySelectorAll(".story-overlay-item").forEach((e) => e.remove());

  // Activar panel de texto por defecto
  switchStoryTool("text");
}

function applyStoryFilter(filter) {
  _storyCurrentFilter = filter;
  const mediaEl = document.getElementById("storyEditorMedia");
  if (!mediaEl) return;
  const target = mediaEl.querySelector("img, video");
  if (target) target.style.filter = filter === "none" ? "" : filter;
}

function showStoryVideoControls(vid) {
  const existing = document.getElementById("storyMediaControls");
  if (existing) existing.remove();
  const duration = Math.floor(vid.duration) || 15;
  const panel = document.createElement("div");
  panel.id = "storyMediaControls";
  panel.className = "story-media-controls";
  panel.innerHTML = `
        <label class="story-ctrl-label">⏱ Duración: <span id="storyDurVal">${Math.min(duration, 15)}s</span></label>
        <input type="range" id="storyDurRange" min="1" max="${Math.min(duration, 60)}" value="${Math.min(duration, 15)}" step="1" class="story-ctrl-range">
    `;
  const toolbar = document.querySelector(".story-editor-toolbar");
  if (toolbar) toolbar.insertAdjacentElement("beforebegin", panel);
  panel.querySelector("#storyDurRange").addEventListener("input", (e) => {
    document.getElementById("storyDurVal").textContent = e.target.value + "s";
    vid.currentTime = 0;
  });
}

function showStoryImageControls() {
  const existing = document.getElementById("storyMediaControls");
  if (existing) existing.remove();
  const panel = document.createElement("div");
  panel.id = "storyMediaControls";
  panel.className = "story-media-controls";
  panel.innerHTML = `
        <label class="story-ctrl-label">🔍 Tamaño</label>
        <div class="story-fit-btns">
            <button class="story-fit-btn active" data-fit="cover">Llenar</button>
            <button class="story-fit-btn" data-fit="contain">Ajustar</button>
            <button class="story-fit-btn" data-fit="fill">Estirar</button>
        </div>
    `;
  const toolbar = document.querySelector(".story-editor-toolbar");
  if (toolbar) toolbar.insertAdjacentElement("beforebegin", panel);
  panel.querySelectorAll(".story-fit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      panel
        .querySelectorAll(".story-fit-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const img = document.getElementById("storyEditorImg");
      if (img) img.style.objectFit = btn.dataset.fit;
    });
  });
}

function switchStoryTool(tool) {
  [
    "storyTextPanel",
    "storyMentionPanel",
    "storyStickerPanel",
    "storyFilterPanel",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });
  document
    .querySelectorAll(".story-tool-btn")
    .forEach((b) => b.classList.remove("active"));

  if (tool === "text") {
    document.getElementById("storyTextPanel")?.classList.remove("hidden");
    document.getElementById("storyToolText")?.classList.add("active");
  } else if (tool === "mention") {
    document.getElementById("storyMentionPanel")?.classList.remove("hidden");
    document.getElementById("storyToolMention")?.classList.add("active");
    // Activar autocomplete en el input de mención
    const mentionInput = document.getElementById("storyMentionInput");
    if (mentionInput) {
      initMentionAutocomplete(mentionInput);
      mentionInput.focus();
    }
  } else if (tool === "sticker") {
    document.getElementById("storyStickerPanel")?.classList.remove("hidden");
    document.getElementById("storyToolSticker")?.classList.add("active");
  } else if (tool === "filter") {
    document.getElementById("storyFilterPanel")?.classList.remove("hidden");
    document.getElementById("storyToolFilter")?.classList.add("active");
  } else if (tool === "draw") {
    document.getElementById("storyToolDraw")?.classList.add("active");
  }
}

function addStoryTextOverlay() {
  const input = document.getElementById("storyTextInput");
  const text = input ? input.value.trim() : "";
  if (!text) return;

  const canvas = document.getElementById("storyEditorCanvas");
  if (!canvas) return;

  const el = document.createElement("div");
  el.className = "story-overlay-item story-overlay-text";
  el.textContent = text;
  el.style.cssText = `color:${_storyTextColor};font-size:${_storyTextSize}px;top:40%;left:50%;transform:translate(-50%,-50%);`;
  makeDraggable(el, canvas);
  canvas.appendChild(el);

  _storyEditorOverlays.push({
    type: "text",
    content: text,
    color: _storyTextColor,
    size: _storyTextSize,
    el,
  });
  if (input) input.value = "";
}

function addStoryStickerOverlay(emoji) {
  const canvas = document.getElementById("storyEditorCanvas");
  if (!canvas) return;

  const el = document.createElement("div");
  el.className = "story-overlay-item story-overlay-sticker";
  el.textContent = emoji;
  el.style.cssText = `font-size:48px;top:35%;left:45%;transform:translate(-50%,-50%);`;
  makeDraggable(el, canvas);
  canvas.appendChild(el);

  _storyEditorOverlays.push({ type: "sticker", content: emoji, el });
}

function makeDraggable(el, container) {
  let startX, startY, origLeft, origTop;
  let isDragging = false;

  // Botón de eliminar — aparece al arrastrar
  const trashBtn = document.createElement("button");
  trashBtn.className = "overlay-trash-btn";
  trashBtn.innerHTML = "🗑️";
  trashBtn.title = "Eliminar";
  trashBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    el.remove();
    trashBtn.remove();
    // Quitar del array de overlays
    const idx = _storyEditorOverlays.findIndex((o) => o.el === el);
    if (idx !== -1) _storyEditorOverlays.splice(idx, 1);
  });

  const showTrash = () => {
    if (!document.body.contains(trashBtn)) {
      container.appendChild(trashBtn);
    }
    trashBtn.style.display = "flex";
  };
  const hideTrash = () => {
    trashBtn.style.display = "none";
  };

  const onMove = (cx, cy) => {
    const rect = container.getBoundingClientRect();
    let left = origLeft + (cx - startX);
    let top = origTop + (cy - startY);
    left = Math.max(0, Math.min(rect.width - el.offsetWidth, left));
    top = Math.max(0, Math.min(rect.height - el.offsetHeight, top));
    el.style.left = left + "px";
    el.style.top = top + "px";
    el.style.transform = "none";
    isDragging = true;
    showTrash();
  };

  const onUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onUp);
    document.removeEventListener("touchmove", onTouchMove);
    document.removeEventListener("touchend", onUp);
    setTimeout(hideTrash, 1200);
  };

  const onMouseMove = (e) => onMove(e.clientX, e.clientY);
  const onTouchMove = (e) => {
    e.preventDefault();
    onMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  el.addEventListener("mousedown", (e) => {
    e.preventDefault();
    isDragging = false;
    const rect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    origLeft = elRect.left - rect.left;
    origTop = elRect.top - rect.top;
    el.style.left = origLeft + "px";
    el.style.top = origTop + "px";
    el.style.transform = "none";
    startX = e.clientX;
    startY = e.clientY;
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onUp);
  });

  el.addEventListener("touchstart", (e) => {
    e.preventDefault();
    isDragging = false;
    const rect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    origLeft = elRect.left - rect.left;
    origTop = elRect.top - rect.top;
    el.style.left = origLeft + "px";
    el.style.top = origTop + "px";
    el.style.transform = "none";
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onUp);
  });
}

function renderStoryMediaPreview(file) {
  // Compatibilidad: si se llama desde el input de galería, abrir editor
  if (file) openStoryEditor(file);
}

async function publishStory() {
  const publishBtn = document.getElementById("publishStoryBtn");
  if (!_storyEditorFile) {
    showNotification("Selecciona una foto o video para tu historia", "error");
    return;
  }

  try {
    if (publishBtn) publishBtn.disabled = true;

    // Recoger texto principal para el campo text del servidor
    const textOverlay = _storyEditorOverlays.find((o) => o.type === "text");
    const storyText = textOverlay ? textOverlay.content : "";

    let fileToUpload = _storyEditorFile;

    // Para imágenes: aplanar overlays y filtro en un canvas y subir el resultado
    if (_storyEditorFile.type.startsWith("image/")) {
      fileToUpload = await flattenStoryToBlob();
    }

    const formData = new FormData();
    formData.append("media", fileToUpload, fileToUpload.name || "story.jpg");
    formData.append("text", storyText);

    await apiCall("/stories", { method: "POST", body: formData });
    showNotification("Historia publicada", "success");
    closeStoryComposer();
    await loadStories();
  } catch (error) {
    showNotification(error.message, "error");
  } finally {
    if (publishBtn) publishBtn.disabled = false;
  }
}

// Aplana la imagen + overlays + filtro en un único Blob listo para subir
function flattenStoryToBlob() {
  return new Promise((resolve, reject) => {
    const mediaEl = document.getElementById("storyEditorMedia");
    const editorCanvas = document.getElementById("storyEditorCanvas");
    if (!mediaEl || !editorCanvas) {
      resolve(_storyEditorFile);
      return;
    }

    const img = mediaEl.querySelector("img");
    if (!img) {
      resolve(_storyEditorFile);
      return;
    }

    const canvasEl = document.createElement("canvas");
    // Usar dimensiones reales de la imagen
    canvasEl.width = img.naturalWidth || img.width || 1080;
    canvasEl.height = img.naturalHeight || img.height || 1920;
    const ctx = canvasEl.getContext("2d");

    // Dibujar imagen con filtro CSS (aproximado via filter en canvas)
    if (_storyCurrentFilter && _storyCurrentFilter !== "none") {
      ctx.filter = _storyCurrentFilter;
    }
    ctx.drawImage(img, 0, 0, canvasEl.width, canvasEl.height);
    ctx.filter = "none";

    // Dibujar overlays (texto y stickers)
    const editorRect = editorCanvas.getBoundingClientRect();
    const scaleX = canvasEl.width / editorRect.width;
    const scaleY = canvasEl.height / editorRect.height;

    _storyEditorOverlays.forEach((overlay) => {
      if (!overlay.el) return;
      const elRect = overlay.el.getBoundingClientRect();
      const x = (elRect.left - editorRect.left) * scaleX;
      const y = (elRect.top - editorRect.top) * scaleY;

      if (overlay.type === "text") {
        const fontSize = (overlay.size || 20) * scaleY;
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = overlay.color || "#fff";
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 6;
        ctx.fillText(overlay.content, x, y + fontSize);
        ctx.shadowBlur = 0;
      } else if (overlay.type === "sticker") {
        const fontSize = 48 * scaleY;
        ctx.font = `${fontSize}px serif`;
        ctx.fillText(overlay.content, x, y + fontSize);
      }
    });

    canvasEl.toBlob(
      (blob) => {
        if (!blob) {
          resolve(_storyEditorFile);
          return;
        }
        resolve(new File([blob], "story.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  });
}

let _storiesList = [];
let _storyIndex = 0;

function stopStoryMedia() {
  const content = document.getElementById("storyViewerContent");
  if (!content) return;
  const video = content.querySelector("video");
  if (video) {
    video.pause();
    video.src = "";
  }
}

function closeStoryViewer() {
  stopStoryMedia();
  const modal = document.getElementById("storyViewerModal");
  if (modal) modal.classList.add("hidden");
}

// Convierte @menciones en links clickeables para el viewer de historias
function renderStoryText(text) {
  return escapeHtml(text).replace(/@([\w\u00C0-\u024F .]+)/g, (match, name) => {
    return `<a href="main.html?search=${encodeURIComponent(name.trim())}" class="story-mention-link" data-name="${escapeHtml(name.trim())}">@${escapeHtml(name.trim())}</a>`;
  });
}

function openStoryViewer(story, allStories, index) {
  const modal = document.getElementById("storyViewerModal");
  const content = document.getElementById("storyViewerContent");
  if (!modal || !content) return;

  if (allStories) {
    _storiesList = allStories;
    _storyIndex = index ?? 0;
  }

  const author = story.userId || {};
  const isOwnStory =
    String(author._id || author) === String(getStoredUser()?._id);
  const canDeleteStory = isOwnStory || isCurrentUserAdmin();

  // Renderizar respuestas
  const repliesHTML = story.replies && story.replies.length > 0
    ? `<div class="story-replies">
        <h4>Respuestas (${story.replies.length})</h4>
        ${story.replies.map(reply => `
          <div class="story-reply">
            <span class="reply-avatar">${renderAvatarMarkup(reply.userId?.avatar, "👤", "avatar-image")}</span>
            <div class="reply-content">
              <span class="reply-author">${renderUserNameMarkup(reply.userId, { tag: "strong" })}</span>
              <p class="reply-text">${reply.text}</p>
            </div>
          </div>
        `).join('')}
      </div>`
    : '';

  // Para video: crear el elemento con JS para controlar carga y reproducción
  let mediaHTML;
  if (story.mediaType === "video") {
    mediaHTML = `<video id="storyViewerVideo" controls playsinline style="max-width:100%;border-radius:8px;"></video>`;
  } else {
    mediaHTML = `<img src="${resolveAssetUrl(story.media)}" alt="Historia">`;
  }

  content.innerHTML = `
        <div class="story-viewer-author">
            <span>${renderAvatarMarkup(author.avatar, "👤", "avatar-image")}</span>
            ${renderUserNameMarkup(author.firstName || author.lastName ? author : { firstName: "Historia" }, { tag: "strong" })}
        </div>
        <div class="story-viewer-media">${mediaHTML}</div>
        ${story.text ? `<p class="story-viewer-text">${renderStoryText(story.text)}</p>` : ""}
        ${repliesHTML}
        <div class="story-reply-form">
            <input type="text" id="storyReplyInput" placeholder="Responder a esta historia..." maxlength="500" />
            <button id="storyReplyBtn" data-story-id="${story._id}">Enviar</button>
        </div>
        ${
          canDeleteStory
            ? `
        <div class="story-viewer-actions">
            <button class="story-delete-btn" data-story-id="${story._id}">
                🗑️ ${isOwnStory ? "Eliminar mi historia" : "Eliminar historia (admin)"}
            </button>
        </div>`
            : ""
        }
    `;

  // Asignar src DESPUÉS de que el elemento esté en el DOM, luego reproducir
  const videoEl = content.querySelector("#storyViewerVideo");
  if (videoEl) {
    videoEl.addEventListener(
      "canplay",
      () => {
        videoEl.play().catch(() => {});
      },
      { once: true },
    );
    videoEl.src = resolveAssetUrl(story.media);
    videoEl.load();
  }

  // Botón eliminar
  const deleteStoryBtn = content.querySelector(".story-delete-btn");
  if (deleteStoryBtn) {
    deleteStoryBtn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar esta historia?")) return;
      try {
        await apiCall(`/stories/${story._id}`, { method: "DELETE" });
        showNotification("Historia eliminada", "success");
        closeStoryViewer();
        await loadStories();
      } catch (e) {
        showNotification(e.message, "error");
      }
    });
  }

  // Botón responder
  const replyBtn = content.querySelector("#storyReplyBtn");
  const replyInput = content.querySelector("#storyReplyInput");
  if (replyBtn && replyInput) {
    replyBtn.addEventListener("click", async () => {
      const text = replyInput.value.trim();
      if (!text) return;
      
      try {
        const result = await apiCall(`/stories/${story._id}/reply`, {
          method: "POST",
          body: JSON.stringify({ text })
        });
        
        showNotification("Respuesta enviada", "success");
        replyInput.value = "";
        
        // Recargar la historia para mostrar la nueva respuesta
        const updatedStories = await apiCall("/stories");
        const updatedStory = updatedStories.find(s => s._id === story._id);
        if (updatedStory) {
          const globalIndex = _storiesList.findIndex(s => s._id === story._id);
          _storiesList[globalIndex] = updatedStory;
          openStoryViewer(updatedStory, _storiesList, globalIndex);
        }
      } catch (e) {
        showNotification(e.message || "Error al enviar respuesta", "error");
      }
    });

    replyInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        replyBtn.click();
      }
    });
  }

  const prevBtn = document.getElementById("storyPrevBtn");
  const nextBtn = document.getElementById("storyNextBtn");
  if (prevBtn) prevBtn.style.display = _storyIndex > 0 ? "flex" : "none";
  if (nextBtn)
    nextBtn.style.display =
      _storyIndex < _storiesList.length - 1 ? "flex" : "none";

  modal.classList.remove("hidden");
}

function initStories() {
  if (!document.body.classList.contains("main-page")) {
    return;
  }

  const createBtn = document.getElementById("createStoryBtn");
  const createLink = document.getElementById("openStoryCreatorLink");
  const closeComposer = document.getElementById("closeStoryComposerBtn");
  const mediaInput = document.getElementById("storyMediaInput");
  const publishBtn = document.getElementById("publishStoryBtn");
  const closeViewer = document.getElementById("closeStoryViewerBtn");
  const viewerModal = document.getElementById("storyViewerModal");
  const prevBtn = document.getElementById("storyPrevBtn");
  const nextBtn = document.getElementById("storyNextBtn");

  // Abrir composer
  if (createBtn) createBtn.addEventListener("click", openStoryComposer);
  if (createLink)
    createLink.addEventListener("click", (e) => {
      e.preventDefault();
      openStoryComposer();
    });
  if (closeComposer)
    closeComposer.addEventListener("click", closeStoryComposer);

  // Paso 1: fuente
  document.getElementById("storyCameraBtn")?.addEventListener("click", () => {
    showStoryStep("camera");
    startStoryCamera();
  });
  document.getElementById("storyGalleryBtn")?.addEventListener("click", () => {
    mediaInput?.click();
  });
  if (mediaInput)
    mediaInput.addEventListener("change", () => {
      if (mediaInput.files[0]) openStoryEditor(mediaInput.files[0]);
    });

  // Paso 2: cámara
  document
    .getElementById("backToStep1FromCamera")
    ?.addEventListener("click", () => {
      stopStoryCamera();
      showStoryStep("step1");
    });
  document
    .getElementById("storyCaptureBtn")
    ?.addEventListener("click", captureStoryPhoto);
  document
    .getElementById("storySwitchCameraBtn")
    ?.addEventListener("click", () => {
      _cameraFacingMode = _cameraFacingMode === "user" ? "environment" : "user";
      startStoryCamera();
    });

  // Paso 3: editor — herramientas
  document
    .getElementById("backToStep1FromEditor")
    ?.addEventListener("click", () => {
      stopStoryCamera();
      showStoryStep("step1");
    });
  document
    .getElementById("storyToolText")
    ?.addEventListener("click", () => switchStoryTool("text"));
  document
    .getElementById("storyToolMention")
    ?.addEventListener("click", () => switchStoryTool("mention"));
  document
    .getElementById("storyToolSticker")
    ?.addEventListener("click", () => switchStoryTool("sticker"));
  document
    .getElementById("storyToolDraw")
    ?.addEventListener("click", () => switchStoryTool("draw"));
  document
    .getElementById("storyToolFilter")
    ?.addEventListener("click", () => switchStoryTool("filter"));

  // Colores de texto
  document.querySelectorAll(".story-color-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".story-color-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      _storyTextColor = btn.dataset.color;
    });
  });

  // Tamaños de texto
  document.querySelectorAll(".story-size-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".story-size-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      _storyTextSize = parseInt(btn.dataset.size);
    });
  });

  // Agregar mención en historia
  document
    .getElementById("storyAddMentionBtn")
    ?.addEventListener("click", () => {
      const input = document.getElementById("storyMentionInput");
      const text = input ? input.value.trim() : "";
      if (!text) return;
      const mention = text.startsWith("@") ? text : `@${text}`;
      // Agregar como overlay de texto con color azul
      const canvas = document.getElementById("storyEditorCanvas");
      if (!canvas) return;
      const el = document.createElement("div");
      el.className = "story-overlay-item story-overlay-text";
      el.textContent = mention;
      el.style.cssText = `color:#6ea8ff;font-size:24px;top:50%;left:50%;transform:translate(-50%,-50%);`;
      makeDraggable(el, canvas);
      canvas.appendChild(el);
      _storyEditorOverlays.push({
        type: "text",
        content: mention,
        color: "#6ea8ff",
        size: 24,
        el,
      });
      if (input) input.value = "";
    });

  // Agregar texto
  document
    .getElementById("storyAddTextBtn")
    ?.addEventListener("click", addStoryTextOverlay);
  document
    .getElementById("storyTextInput")
    ?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addStoryTextOverlay();
      }
    });

  // Stickers
  document.querySelectorAll(".story-sticker-pick").forEach((btn) => {
    btn.addEventListener("click", () =>
      addStoryStickerOverlay(btn.textContent),
    );
  });

  // Filtros
  document.querySelectorAll(".story-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".story-filter-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      applyStoryFilter(btn.dataset.filter);
    });
  });

  // Publicar
  if (publishBtn) publishBtn.addEventListener("click", publishStory);

  // Viewer
  if (closeViewer && viewerModal)
    closeViewer.addEventListener("click", () => closeStoryViewer());
  if (viewerModal) {
    viewerModal.addEventListener("click", (event) => {
      if (event.target === viewerModal) closeStoryViewer();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (_storyIndex > 0) {
        stopStoryMedia();
        _storyIndex--;
        openStoryViewer(_storiesList[_storyIndex]);
      }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (_storyIndex < _storiesList.length - 1) {
        stopStoryMedia();
        _storyIndex++;
        openStoryViewer(_storiesList[_storyIndex]);
      }
    });
  }

  // Juegos
  const openGamesLink = document.getElementById("openGamesLink");
  const closeGamesBtn = document.getElementById("closeGamesBtn");
  const gamesModal = document.getElementById("gamesModal");

  if (openGamesLink)
    openGamesLink.addEventListener("click", (e) => {
      e.preventDefault();
      openGamesModal();
    });
  if (closeGamesBtn) closeGamesBtn.addEventListener("click", closeGamesModal);
  if (gamesModal)
    gamesModal.addEventListener("click", (e) => {
      if (e.target === gamesModal) closeGamesModal();
    });

  document.querySelectorAll(".game-card-btn").forEach((btn) => {
    btn.addEventListener("click", () => launchGame(btn.dataset.game));
  });

  initLeaderboardPanel();

  loadStories();

  if (new URLSearchParams(window.location.search).get("story") === "create") {
    openStoryComposer();
  }
}

function initGlobalSearch() {
  const searchForm = document.querySelector(".header-search");
  const searchInput = searchForm ? searchForm.querySelector("input") : null;
  const searchButton = searchForm ? searchForm.querySelector("button") : null;

  if (!searchForm || !searchInput || !searchButton) {
    return;
  }

  searchForm.classList.add("search-ready");

  let suggestions = searchForm.querySelector(".search-suggestions");
  if (!suggestions) {
    suggestions = document.createElement("div");
    suggestions.className = "search-suggestions";
    searchForm.appendChild(suggestions);
  }

  const closeSuggestions = () => {
    suggestions.classList.remove("open");
  };

  const runSearchPage = () => {
    const query = searchInput.value.trim();
    if (query.length >= 2) {
      window.location.href = `main.html?search=${encodeURIComponent(query)}`;
    }
  };

  const updateSuggestions = debounce(async () => {
    const query = searchInput.value.trim();

    if (query.length < 2) {
      closeSuggestions();
      suggestions.innerHTML = "";
      return;
    }

    suggestions.innerHTML = '<div class="search-empty">Buscando...</div>';
    suggestions.classList.add("open");

    try {
      const results = await searchSirnergia(query);
      renderSearchSuggestions(suggestions, results, query);
    } catch (error) {
      console.error("Error en busqueda:", error);
      suggestions.innerHTML =
        '<div class="search-empty">No se pudo buscar en este momento.</div>';
    }
  });

  searchInput.addEventListener("input", updateSuggestions);
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      runSearchPage();
    }

    if (event.key === "Escape") {
      closeSuggestions();
    }
  });

  searchButton.addEventListener("click", (event) => {
    event.preventDefault();
    runSearchPage();
  });

  document.addEventListener("click", (event) => {
    if (!searchForm.contains(event.target)) {
      closeSuggestions();
    }
  });
}

function getFriendIds(profile) {
  return (profile.friends || []).map((friend) =>
    typeof friend === "object" && friend !== null
      ? String(friend._id)
      : String(friend),
  );
}

function renderSuggestedFriends(
  users,
  currentProfile,
  containerId = "suggestedFriendsContainer",
) {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }

  const currentUserId = String(currentProfile._id);
  const friendIds = new Set(getFriendIds(currentProfile));
  const suggestedUsers = users.filter(
    (user) =>
      String(user._id) !== currentUserId && !friendIds.has(String(user._id)),
  );

  if (suggestedUsers.length === 0) {
    container.innerHTML =
      '<div class="empty-state">No hay más perfiles sugeridos por ahora.</div>';
    return;
  }

  container.innerHTML = suggestedUsers
    .map(
      (user) => `
        <div class="suggest-user">
            <a href="profile.html?id=${user._id}" class="suggest-user-link">
                <div class="avatar-large">${renderAvatarMarkup(user.avatar, "👤")}</div>
            </a>
            <div class="suggest-user-info">
                <a href="profile.html?id=${user._id}" class="suggest-user-link">
                    <p class="suggest-user-name">${renderUserNameMarkup(user)}</p>
                </a>
                <p class="suggest-user-bio">${escapeHtml(user.bio || "Nuevo en Sirnergia")}</p>
            </div>
            <button class="add-friend-btn" data-user-id="${user._id}">+ Amigo</button>
        </div>
    `,
    )
    .join("");

  container.querySelectorAll(".add-friend-btn").forEach((button) => {
    button.addEventListener("click", () =>
      handleAddFriend(button.dataset.userId),
    );
  });
}

function renderProfileFriendsList(friends, isOwnProfile = true) {
  const container = document.getElementById("profileFriendsList");
  if (!container) {
    return;
  }

  if (!Array.isArray(friends) || friends.length === 0) {
    container.innerHTML = `<div class="empty-state">${isOwnProfile ? "Todavía no tienes amigos agregados." : "Todavía no tiene amigos agregados."}</div>`;
    return;
  }

  container.innerHTML = friends
    .map(
      (friend) => `
        <div class="friend-card">
            <a href="profile.html?id=${friend._id}" class="friend-link">
                <div class="avatar-large">${renderAvatarMarkup(friend.avatar, "👤")}</div>
            </a>
            <div class="friend-card-info">
                <a href="profile.html?id=${friend._id}" class="friend-link">
                    <p class="friend-card-name">${renderUserNameMarkup(friend)}</p>
                </a>
                <p class="friend-card-bio">${escapeHtml(friend.bio || "Este usuario todavía no agregó una biografía.")}</p>
            </div>
        </div>
    `,
    )
    .join("");
}

async function refreshCurrentUserProfile() {
  const user = getStoredUser();
  if (!user || !user._id) {
    return null;
  }

  const profile = await apiCall(`/users/${user._id}`, { method: "GET" });
  updateStoredUser({
    ...user,
    ...profile,
  });

  return profile;
}

async function loadSuggestedFriends(containerId = "suggestedFriendsContainer") {
  const currentUser = getStoredUser();
  const container = document.getElementById(containerId);

  if (!currentUser || !container) {
    return;
  }

  try {
    const [users, currentProfile] = await Promise.all([
      apiCall("/users", { method: "GET" }),
      refreshCurrentUserProfile(),
    ]);

    renderSuggestedFriends(users, currentProfile || currentUser, containerId);
    loadUserData();
  } catch (error) {
    console.error("Error al cargar sugerencias de amigos:", error);
    container.innerHTML =
      '<div class="empty-state">No se pudieron cargar los amigos sugeridos.</div>';
  }
}

async function handleAddFriend(friendId) {
  const currentUser = getStoredUser();
  if (!currentUser || !friendId) {
    window.location.href = "index.html";
    return;
  }

  try {
    await apiCall(`/users/${friendId}/agregar-amigo`, {
      method: "POST",
    });

    showNotification("Amigo agregado exitosamente", "success");
    await loadSuggestedFriends();

    if (document.body.classList.contains("main-page")) {
      await loadPosts();
    } else if (document.body.classList.contains("profile-page")) {
      await loadProfilePage();
    }
  } catch (error) {
    showNotification(error.message, "error");
  }
}

/**
 * Carga los posts desde la base de datos
 */
async function loadPosts(options = {}) {
  const soft = Boolean(options.soft);

  try {
    const currentView = getMainViewFromUrl();
    if (currentView === "people") {
      await renderPeopleDirectory();
      return;
    }

    if (currentView === "vid") {
      if (!soft) {
        await renderVidSection();
      }
      return;
    }

    // Restaurar el card de amigos sugeridos si estaba oculto
    const suggestedContainer = document.getElementById(
      "suggestedFriendsContainer",
    );
    if (suggestedContainer) {
      suggestedContainer.closest(".sidebar-card").style.display = "";
    }
    const searchQuery = getSearchQueryFromUrl();
    // Soporte para hashtag URL param
    const hashtagParam = new URLSearchParams(window.location.search).get(
      "hashtag",
    );
    if (hashtagParam) {
      if (soft) return;
      const postsContainer = document.getElementById("postsContainer");
      if (!postsContainer) return;
      postsContainer.innerHTML = `<div class="back-to-feed-bar"><a href="main.html" class="back-to-feed-btn">← Volver al feed</a></div>`;
      renderFeedHeading(
        `#${hashtagParam}`,
        `Posts etiquetados con #${hashtagParam}`,
      );
      try {
        const posts = await apiCall(
          `/posts/hashtag/${encodeURIComponent(hashtagParam)}`,
          { method: "GET" },
        );
        if (!posts.length) {
          postsContainer.insertAdjacentHTML(
            "beforeend",
            `<div class="empty-state">No hay posts con #${escapeHtml(hashtagParam)}</div>`,
          );
          return;
        }
        posts.forEach((post) => {
          const timeAgo = getTimeAgo(post.createdAt);
          postsContainer.appendChild(createPostElement(post, timeAgo));
        });
      } catch (e) {
        console.error(e);
      }
      return;
    }
    if (searchQuery) {
      if (soft) {
        return;
      }

      const results = await searchSirnergia(searchQuery);
      const searchInput = document.querySelector(".header-search input");
      if (searchInput) {
        searchInput.value = searchQuery;
      }
      renderSearchResults(results.posts || [], searchQuery);
      return;
    }

    if (!soft) {
      await refreshCurrentUserProfile();
    }

    const feedFilter = getFeedFilterFromUrl();
    const endpoint =
      feedFilter === "friends"
        ? "/posts/friends?limit=20"
        : "/posts?page=1&limit=10";
    const response = await apiCall(endpoint, {
      method: "GET",
    });

    const postsContainer = document.getElementById("postsContainer");
    if (!postsContainer) {
      return;
    }

    if (soft) {
      syncPostsFeed(response.posts || [], feedFilter);
      return;
    }

    postsContainer.innerHTML = "";

    if (feedFilter === "friends") {
      postsContainer.insertAdjacentHTML(
        "beforeend",
        `<div class="back-to-feed-bar"><a href="main.html" class="back-to-feed-btn">← Volver al feed</a></div>`,
      );
      renderFeedHeading(
        "Publicaciones de amigos",
        "Solo publicaciones de personas que tienes agregadas.",
      );
    }

    if (!response.posts.length) {
      postsContainer.insertAdjacentHTML(
        "beforeend",
        `<div class="empty-state">${feedFilter === "friends" ? "Tus amigos aun no han publicado nada." : "No hay publicaciones por ahora."}</div>`,
      );
      return;
    }

    response.posts.forEach((post) => {
      const timeAgo = getTimeAgo(post.createdAt);
      const postElement = createPostElement(post, timeAgo);
      postsContainer.appendChild(postElement);
    });
  } catch (error) {
    console.error("Error al cargar posts:", error);
    if (!soft) {
      showNotification("Error al cargar los posts", "error");
    }
  }
}

function syncPostsFeed(posts, feedFilter = "") {
  const postsContainer = document.getElementById("postsContainer");
  if (!postsContainer) {
    return;
  }

  if (!posts.length) {
    if (!postsContainer.querySelector("article.post")) {
      postsContainer.innerHTML = `<div class="empty-state">${feedFilter === "friends" ? "Tus amigos aun no han publicado nada." : "No hay publicaciones por ahora."}</div>`;
    }
    return;
  }

  const feedHeading = postsContainer.querySelector(".search-results-heading");
  const incomingIds = new Set(posts.map((post) => String(post._id)));

  posts.forEach((post) => {
    const postId = String(post._id);
    const timeAgo = getTimeAgo(post.createdAt);
    let article = document.getElementById(`post-${postId}`);

    if (!article) {
      article = createPostElement(post, timeAgo);
      if (feedHeading) {
        postsContainer.insertBefore(article, feedHeading.nextSibling);
      } else {
        postsContainer.insertBefore(article, postsContainer.firstChild);
      }
    } else {
      updatePostElement(article, post, timeAgo);
    }
  });

  postsContainer.querySelectorAll("article.post").forEach((article) => {
    const postId = article.id.replace("post-", "");
    if (!incomingIds.has(postId)) {
      article.remove();
    }
  });
}

function updatePostElement(article, post, timeAgo) {
  const userData = getStoredUser();
  const likes = Array.isArray(post.likes) ? post.likes : [];
  const comments = Array.isArray(post.comments) ? post.comments : [];
  const isLiked = likes.some((like) => {
    const likeId = typeof like === "object" && like !== null ? like._id : like;
    return String(likeId) === String(userData?._id);
  });

  const timeEl = article.querySelector(".post-time");
  if (timeEl) {
    timeEl.textContent = timeAgo;
  }

  const likeBtn = article.querySelector(".like-btn");
  if (likeBtn) {
    likeBtn.dataset.liked = isLiked;
    likeBtn.innerHTML = `👍 Me gusta (${likes.length})`;
  }

  const likeSummary = article.querySelector(".like-summary");
  if (likeSummary) {
    likeSummary.innerHTML = renderLikeSummary(likes, userData?._id);
  }

  const commentsHeader = article.querySelector(".comments-header h5");
  if (commentsHeader) {
    commentsHeader.textContent = `Comentarios (${comments.length})`;
  }

  const commentsSection = article.querySelector(".post-comments");
  if (commentsSection && !commentsSection.classList.contains("hidden")) {
    const commentList = article.querySelector(".comment-list");
    if (commentList) {
      commentList.innerHTML = renderComments(comments, userData?._id, post._id);
      attachCommentDeleteListeners(article, post._id);
    }
  }
}

/**
 * Crea un elemento HTML para un post
 */
function createPostElement(post, timeAgo) {
  const article = document.createElement("article");
  article.className = "post fade-in";
  article.id = `post-${post._id}`;

  const userData = JSON.parse(localStorage.getItem("userLogged"));
  const likes = Array.isArray(post.likes) ? post.likes : [];
  const comments = Array.isArray(post.comments) ? post.comments : [];
  const postUserId =
    typeof post.userId === "object" && post.userId !== null
      ? post.userId._id
      : post.userId;
  const isLiked = likes.some((like) => {
    const likeId = typeof like === "object" && like !== null ? like._id : like;
    return String(likeId) === String(userData._id);
  });
  const isAuthor = String(postUserId) === String(userData._id);
  const isAdmin = isCurrentUserAdmin(userData);
  const friendIds = new Set(getFriendIds(userData));
  const canAddFriend =
    postUserId && !isAuthor && !friendIds.has(String(postUserId));

  const authorUser = resolvePostAuthorUser(post);
  const authorName = formatUserName(authorUser || post.author);
  const authorAvatar =
    authorUser?.avatar ||
    (typeof post.author === "object" && post.author !== null
      ? post.author.avatar
      : null) ||
    (post.userId && typeof post.userId === "object"
      ? post.userId.avatar
      : null);

  const photosHTML =
    post.photos && post.photos.length > 0
      ? `
        <div class="post-photos">
            ${post.photos
              .map((photo) => {
                const isVideo = /\.(mp4|webm|mov|avi)$/i.test(photo);
                return isVideo
                  ? `<video src="${resolveAssetUrl(photo)}" controls playsinline class="post-photo post-video" style="max-height:400px;width:100%;object-fit:contain;background:#000;border-radius:8px;"></video>`
                  : `<img src="${resolveAssetUrl(photo)}" alt="Foto del post" class="post-photo">`;
              })
              .join("")}
        </div>
    `
      : "";

  // Hashtags en el contenido
  const contentWithHashtags = renderRichText(post.content).replace(
    /#([\w\u00C0-\u024F]+)/g,
    '<a href="main.html?hashtag=$1" class="hashtag-link">#$1</a>',
  );

  // Render poll si existe
  let pollHTML = "";
  if (post.poll && post.poll._id) {
    const p = post.poll;
    const totalVotes = p.options.reduce(
      (sum, o) => sum + (o.votes ? o.votes.length : 0),
      0,
    );
    const userVoteIdx = p.options.findIndex(
      (o) =>
        o.votes &&
        o.votes.some((v) => String(v._id || v) === String(userData._id)),
    );
    pollHTML = `<div class="poll-widget" data-poll-id="${p._id}">
            <p class="poll-question">${escapeHtml(p.question)}</p>
            ${p.options
              .map((opt, idx) => {
                const count = opt.votes ? opt.votes.length : 0;
                const pct =
                  totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                const voted = idx === userVoteIdx;
                return `<button class="poll-option-btn ${voted ? "voted" : ""}" data-option-index="${idx}">
                    <span class="poll-opt-text">${escapeHtml(opt.text)}</span>
                    <span class="poll-bar" style="width:${pct}%"></span>
                    <span class="poll-pct">${pct}%</span>
                </button>`;
              })
              .join("")}
            <p class="poll-total">${totalVotes} voto${totalVotes !== 1 ? "s" : ""}</p>
        </div>`;
  }

  // Guardar post
  const isSaved =
    post.savedBy &&
    post.savedBy.some((id) => String(id._id || id) === String(userData._id));

  const deleteButtonHTML =
    isAuthor || isAdmin
      ? `
        <button class="delete-post-btn" data-post-id="${post._id}" title="${isAdmin && !isAuthor ? "Eliminar publicación (admin)" : "Eliminar publicación"}">🗑️</button>
    `
      : "";
  const addFriendButtonHTML = canAddFriend
    ? `
        <button class="add-post-friend-btn" data-user-id="${postUserId}">+ Amigo</button>
    `
    : "";

  article.innerHTML = `
        <div class="post-header">
            <div class="post-avatar">${renderAvatarMarkup(authorAvatar, "👤")}</div>
            <div class="post-info">
                <h4>${renderUserNameMarkup(authorUser || { firstName: authorName }, { link: `profile.html?id=${postUserId}` })}</h4>
                <p class="post-time">${timeAgo}</p>
            </div>
            ${addFriendButtonHTML}
            ${deleteButtonHTML}
        </div>
        <p class="post-content">${contentWithHashtags}</p>
        ${photosHTML}
        ${pollHTML}
        <div class="post-actions">
            <div class="reaction-wrapper">
                <button class="action-btn like-btn" data-post-id="${post._id}" data-liked="${isLiked}">
                    ${isLiked ? "👍" : "👍"} Me gusta (${likes.length})
                </button>
                <div class="reaction-popup">
                    <button class="reaction-btn" data-reaction="👍" title="Me gusta">👍</button>
                    <button class="reaction-btn" data-reaction="❤️" title="Me encanta">❤️</button>
                    <button class="reaction-btn" data-reaction="😂" title="Jaja">😂</button>
                    <button class="reaction-btn" data-reaction="😮" title="Asombro">😮</button>
                    <button class="reaction-btn" data-reaction="😢" title="Tristeza">😢</button>
                    <button class="reaction-btn" data-reaction="😡" title="Enojo">😡</button>
                    <button class="reaction-btn reaction-btn-67" data-reaction="67" title="67">67</button>
                </div>
            </div>
            <button class="action-btn comment-btn" data-post-id="${post._id}">
                💬 Comentar
            </button>
            <button class="action-btn share-btn">↗️ Compartir</button>
            <button class="action-btn save-btn" data-post-id="${post._id}" data-saved="${isSaved}">
                ${isSaved ? "🔖 Guardado" : "🔖 Guardar"}
            </button>
            <button class="action-btn report-btn" data-post-id="${post._id}">🚩 Reportar</button>
        </div>
        <div class="like-summary">${renderLikeSummary(likes, userData._id)}</div>
        <div class="post-comments hidden">
            <div class="comments-header">
                <h5>Comentarios (${comments.length})</h5>
            </div>
            <div class="comment-list">
                ${renderComments(comments, userData._id, post._id)}
            </div>
            <div class="comment-form">
                <button class="btn-emoji-picker" type="button">😊</button>
                <input type="text" class="comment-input" placeholder="Escribe un comentario..." />
                <button class="btn-comment-submit" data-post-id="${post._id}">Enviar</button>
            </div>
        </div>
    `;

  addPostEventListeners(article, post._id);
  return article;
}

function renderLikeSummary(likes, currentUserId) {
  if (!likes || likes.length === 0) {
    return "";
  }

  const names = likes.map((like) => {
    if (typeof like === "object" && like !== null) {
      return renderUserNameMarkup(like, { tag: "span" });
    }

    return "Usuario";
  });
  if (likes.length === 1) {
    return `Le gusta a ${names[0]}`;
  }

  return `Les gusta a ${names.join(", ")}`;
}

function renderComments(comments, currentUserId, postId = "") {
  if (!comments || comments.length === 0) {
    return '<p class="no-comments">Sé el primero en comentar.</p>';
  }

  const canModerateComments = isCurrentUserAdmin();

  return comments
    .map((comment) => {
      const authorId =
        comment.author && typeof comment.author === "object"
          ? comment.author._id
          : comment.author;
      const isCommentAuthor = String(authorId) === String(currentUserId);
      const deleteBtn =
        isCommentAuthor || canModerateComments
          ? `
            <button class="delete-comment-btn" data-comment-id="${comment._id}" title="${canModerateComments && !isCommentAuthor ? "Eliminar comentario (admin)" : "Eliminar comentario"}" style="background: none; border: none; cursor: pointer; color: #f02849; margin-left: 8px;">🗑️</button>
        `
          : "";

      return `
            <div class="comment-item" data-comment-id="${comment._id}">
                <div class="comment-header">
                    ${renderUserNameMarkup(comment.author || { firstName: "Usuario" }, { tag: "span", className: "comment-author" })}
                    ${deleteBtn}
                </div>
                <p class="comment-text">${renderRichText(comment.content)}</p>
            </div>
        `;
    })
    .join("");
}

async function handleComment(postId, commentInput, commentList) {
  if (!commentInput) return;

  const content = commentInput.value.trim();
  if (!content) {
    showNotification("Escribe un comentario antes de enviar", "error");
    return;
  }

  try {
    const response = await apiCall(`/posts/${postId}/comentar`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });

    const post = response.post;
    const userData = JSON.parse(localStorage.getItem("userLogged"));
    commentInput.value = "";
    if (commentList) {
      commentList.innerHTML = renderComments(
        post.comments,
        userData._id,
        postId,
      );

      const postElement = document.getElementById(`post-${postId}`);
      attachCommentDeleteListeners(postElement, postId);
    }

    const commentHeader = commentList
      ? commentList
          .closest(".post-comments")
          .querySelector(".comments-header h5")
      : null;
    if (commentHeader) {
      commentHeader.textContent = `Comentarios (${post.comments.length})`;
    }

    showNotification("Comentario agregado", "success");
  } catch (error) {
    showNotification(error.message, "error");
  }
}

/**
 * Obtiene el tiempo transcurrido en formato legible
 */
function getTimeAgo(date) {
  const now = new Date();
  const postDate = new Date(date);
  const diffMs = now - postDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Hace unos segundos";
  if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? "s" : ""}`;
  if (diffHours < 24)
    return `Hace ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? "s" : ""}`;

  return postDate.toLocaleDateString("es-ES");
}

/**
 * Maneja la eliminaciÃ³n de un post
 */
async function handleDeletePost(postId) {
  if (!confirm("¿Estás seguro de que deseas eliminar esta publicación?")) {
    return;
  }

  try {
    await apiCall(`/posts/${postId}`, {
      method: "DELETE",
    });

    const postElement = document.getElementById(`post-${postId}`);
    if (postElement) {
      postElement.style.animation = "fadeOut 0.3s ease-out forwards";
      setTimeout(() => {
        postElement.remove();
        showNotification("Publicación eliminada", "success");
      }, 300);
    }
  } catch (error) {
    showNotification(error.message, "error");
  }
}

/**
 * Maneja la eliminaciÃ³n de un comentario
 */
async function handleDeleteComment(postId, commentId, commentElement) {
  if (!confirm("¿Estás seguro de que deseas eliminar este comentario?")) {
    return;
  }

  try {
    const response = await apiCall(
      `/posts/${postId}/comentarios/${commentId}`,
      {
        method: "DELETE",
      },
    );

    const postElement = document.getElementById(`post-${postId}`);
    if (postElement) {
      // Actualizar los comentarios
      const commentList = postElement.querySelector(".comment-list");
      if (commentList) {
        commentList.innerHTML = renderComments(
          response.post.comments,
          JSON.parse(localStorage.getItem("userLogged"))._id,
          postId,
        );
        attachCommentDeleteListeners(postElement, postId);
      }

      // Actualizar contador de comentarios
      const commentsHeader = postElement.querySelector(".comments-header h5");
      if (commentsHeader) {
        commentsHeader.textContent = `Comentarios (${response.post.comments.length})`;
      }

      showNotification("Comentario eliminado", "success");
    }
  } catch (error) {
    showNotification(error.message, "error");
  }
}

function attachCommentDeleteListeners(postElement, postId) {
  if (!postElement) {
    return;
  }

  postElement.querySelectorAll(".delete-comment-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const commentId = btn.getAttribute("data-comment-id");
      const commentElement = postElement.querySelector(
        `[data-comment-id="${commentId}"]`,
      );
      handleDeleteComment(postId, commentId, commentElement);
    });
  });
}

/**
 * Agrega event listeners a los botones de acciones del post
 */
function addPostEventListeners(post, postId) {
  const likeBtn = post.querySelector(".like-btn");
  const commentBtn = post.querySelector(".comment-btn");
  const shareBtn = post.querySelector(".share-btn");
  const deletePostBtn = post.querySelector(".delete-post-btn");
  const addPostFriendBtn = post.querySelector(".add-post-friend-btn");
  const commentSubmitBtn = post.querySelector(".btn-comment-submit");
  const commentInput = post.querySelector(".comment-input");
  const commentList = post.querySelector(".comment-list");
  const emojiPickerBtn = post.querySelector(".btn-emoji-picker");

  if (likeBtn) {
    const wrapper = likeBtn.closest(".reaction-wrapper");

    // Desktop: hover abre, click fuera cierra
    likeBtn.addEventListener("mouseenter", () =>
      wrapper?.classList.add("open"),
    );

    // Cerrar al hacer click fuera del wrapper
    document.addEventListener("click", function closeReaction(e) {
      if (wrapper && !wrapper.contains(e.target)) {
        wrapper.classList.remove("open");
      }
    });

    // Móvil: click largo abre el popup
    let touchTimer;
    likeBtn.addEventListener(
      "touchstart",
      () => {
        touchTimer = setTimeout(() => wrapper?.classList.add("open"), 400);
      },
      { passive: true },
    );
    likeBtn.addEventListener("touchend", () => clearTimeout(touchTimer));

    // Click normal = like con 👍 (solo si el popup no está abierto)
    likeBtn.addEventListener("click", (e) => {
      if (wrapper?.classList.contains("open")) return;
      handleLike(likeBtn, "👍");
    });

    // Botones de reacción — cerrar popup solo al elegir
    wrapper?.querySelectorAll(".reaction-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const reaction = btn.dataset.reaction;
        wrapper.classList.remove("open");
        if (reaction === "67") {
          trigger67Animation(post);
          handleLike(likeBtn, "67");
        } else {
          handleLike(likeBtn, reaction);
        }
      });
    });
  }

  if (commentBtn) {
    commentBtn.addEventListener("click", () => {
      const commentsSection = post.querySelector(".post-comments");
      commentsSection.classList.toggle("hidden");
      if (commentInput && !commentsSection.classList.contains("hidden")) {
        commentInput.focus();
      }
    });
  }

  if (commentSubmitBtn) {
    commentSubmitBtn.addEventListener("click", () => {
      const pId = commentSubmitBtn.getAttribute("data-post-id");
      handleComment(pId, commentInput, commentList);
    });
  }

  if (commentInput) {
    initMentionAutocomplete(commentInput);
    commentInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        const pId = commentSubmitBtn.getAttribute("data-post-id");
        handleComment(pId, commentInput, commentList);
      }
    });
  }

  if (emojiPickerBtn) {
    const emojis = ["😀", "😂", "😍", "🥰", "😎", "🤔", "😢", "😡", "👍", "👎", "❤️", "💔", "🔥", "⭐", "🎉", "🎊", "💯", "✨", "🙌", "👏", "🤝", "💪", "👀", "🙏", "😊", "😋", "🤗", "😴", "🤯", "😱", "🥳", "😇"];
    
    let picker = document.createElement("div");
    picker.className = "emoji-picker hidden";
    emojis.forEach(emoji => {
      const btn = document.createElement("button");
      btn.textContent = emoji;
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        commentInput.value += emoji;
        picker.classList.add("hidden");
        commentInput.focus();
      });
      picker.appendChild(btn);
    });
    
    emojiPickerBtn.parentNode.style.position = "relative";
    emojiPickerBtn.parentNode.appendChild(picker);
    
    emojiPickerBtn.addEventListener("click", (e) => {
      e.preventDefault();
      picker.classList.toggle("hidden");
    });
    
    document.addEventListener("click", (e) => {
      if (!emojiPickerBtn.contains(e.target) && !picker.contains(e.target)) {
        picker.classList.add("hidden");
      }
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener("click", () => {
      showNotification("Publicación compartida", "success");
    });
  }

  if (deletePostBtn) {
    deletePostBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleDeletePost(postId);
    });
  }

  if (addPostFriendBtn) {
    addPostFriendBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleAddFriend(addPostFriendBtn.dataset.userId);
    });
  }

  // Save post
  const saveBtn = post.querySelector(".save-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const pid = saveBtn.dataset.postId;
      try {
        const result = await apiCall(`/posts/${pid}/save`, { method: "POST" });
        saveBtn.dataset.saved = result.saved;
        saveBtn.textContent = result.saved
          ? "\uD83D\uDD16 Guardado"
          : "\uD83D\uDD16 Guardar";
        showNotification(result.message, "success");
      } catch (e) {
        showNotification(e.message, "error");
      }
    });
  }

  // Reportar post
  const reportBtn = post.querySelector(".report-btn");
  if (reportBtn) {
    reportBtn.addEventListener("click", () => {
      const modal = document.getElementById("reportModal");
      if (!modal) return;
      modal._targetType = "post";
      modal._targetId = reportBtn.dataset.postId;
      modal.classList.remove("hidden");
    });
  }

  // Votar en encuesta
  post.querySelectorAll(".poll-option-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const pollWidget = btn.closest(".poll-widget");
      const pollId = pollWidget.dataset.pollId;
      const optionIndex = parseInt(btn.dataset.optionIndex);
      try {
        const updatedPoll = await apiCall(`/polls/${pollId}/vote`, {
          method: "POST",
          body: JSON.stringify({ optionIndex }),
        });
        const totalVotes = updatedPoll.options.reduce(
          (s, o) => s + (o.votes ? o.votes.length : 0),
          0,
        );
        const userData2 = JSON.parse(localStorage.getItem("userLogged"));
        const userVoteIdx = updatedPoll.options.findIndex(
          (o) =>
            o.votes &&
            o.votes.some((v) => String(v._id || v) === String(userData2._id)),
        );
        pollWidget.querySelectorAll(".poll-option-btn").forEach((b, i) => {
          const count = updatedPoll.options[i].votes
            ? updatedPoll.options[i].votes.length
            : 0;
          const pct =
            totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          b.classList.toggle("voted", i === userVoteIdx);
          b.querySelector(".poll-bar").style.width = pct + "%";
          b.querySelector(".poll-pct").textContent = pct + "%";
        });
        pollWidget.querySelector(".poll-total").textContent =
          `${totalVotes} voto${totalVotes !== 1 ? "s" : ""}`;
      } catch (e) {
        showNotification("Error al votar", "error");
      }
    });
  });

  attachCommentDeleteListeners(post, postId);
}

/**
 * Maneja el like de un post
 */
async function handleLike(btn, reaction = "👍") {
  const postId = btn.getAttribute("data-post-id");

  try {
    const response = await apiCall(`/posts/${postId}/like`, { method: "POST" });

    const post = response.post;
    const userData = JSON.parse(localStorage.getItem("userLogged"));
    const isLiked = post.likes.some((like) => {
      const likeId =
        typeof like === "object" && like !== null ? like._id : like;
      return String(likeId) === String(userData._id);
    });

    btn.setAttribute("data-liked", isLiked);
    const icon = isLiked ? reaction : "👍";
    btn.innerHTML = `${icon} Me gusta (${post.likes.length})`;

    const postElement = document.getElementById(`post-${post._id}`);
    if (postElement) {
      const likeSummary = postElement.querySelector(".like-summary");
      if (likeSummary)
        likeSummary.innerHTML = renderLikeSummary(post.likes, userData._id);
    }

    if (isLiked) {
      btn.style.color = reaction === "67" ? "#f5a623" : "#f02849";
      btn.style.fontWeight = "bold";
    } else {
      btn.style.color = "var(--text-secondary)";
      btn.style.fontWeight = "normal";
    }
  } catch (error) {
    showNotification(error.message, "error");
  }
}

function trigger67Animation(postEl) {
  const rect = postEl.getBoundingClientRect();
  const count = 18;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "anim-67";
    el.textContent = "67";
    const startX = rect.left + Math.random() * rect.width;
    const startY = rect.top + window.scrollY + Math.random() * rect.height;
    el.style.cssText = `left:${startX}px;top:${startY}px;--dx:${(Math.random() - 0.5) * 200}px;animation-delay:${Math.random() * 0.5}s;`;
    document.body.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
  }
}

/**
 * Maneja la publicaciÃ³n de un post con fotos
 */
async function handlePublishPost() {
  const postInput = document.getElementById("postInput");
  const fileInput = document.getElementById("fileInput");
  const content = postInput.value.trim();

  if (!content && (!fileInput.files || fileInput.files.length === 0)) {
    showNotification("Por favor escribe algo o selecciona una foto", "error");
    return;
  }

  try {
    // Crear FormData para enviar archivos
    const formData = new FormData();
    formData.append("content", content || "Foto compartida");

    // Agregar fotos/videos al FormData
    if (fileInput.files) {
      const previewItems = Array.from(
        document.querySelectorAll(".photo-preview-item"),
      );
      for (let i = 0; i < fileInput.files.length; i++) {
        const file = fileInput.files[i];
        if (file.type.startsWith("video/")) {
          formData.append("photos", file);
        } else {
          const previewItem = previewItems.find(
            (item) => item.dataset.fileIndex === String(i),
          );
          const fitMode = previewItem ? previewItem.dataset.fit : "cover";
          const adjustedFile = await adjustPostImageFile(file, fitMode);
          formData.append("photos", adjustedFile);
        }
      }
    }

    const token = localStorage.getItem("authToken");
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Error al publicar" }));
      throw new Error(error.error || "Error al publicar");
    }

    const result = await response.json();

    // Encuesta
    const pollCreatorEl = document.getElementById("pollCreator");
    const pollBtnEl = document.getElementById("pollBtn");
    if (pollCreatorEl && !pollCreatorEl.classList.contains("hidden")) {
      const question = document.getElementById("pollQuestion").value.trim();
      const optionInputs = Array.from(
        document.querySelectorAll(".poll-option-input"),
      );
      const options = optionInputs.map((i) => i.value.trim()).filter(Boolean);
      const endsAt = document.getElementById("pollEndsAt").value;
      if (question && options.length >= 2) {
        try {
          const poll = await apiCall("/polls", {
            method: "POST",
            body: JSON.stringify({
              question,
              options,
              endsAt: endsAt || null,
              postId: result.post._id,
            }),
          });
          result.post.poll = poll;
          document.getElementById("pollQuestion").value = "";
          document.querySelectorAll(".poll-option-input").forEach((inp) => {
            inp.value = "";
          });
          pollCreatorEl.classList.add("hidden");
          if (pollBtnEl) pollBtnEl.classList.remove("active");
        } catch (e) {
          console.error("Error creando encuesta:", e);
        }
      }
    }

    postInput.value = "";
    fileInput.value = "";
    const photoPreview = document.getElementById("photoPreview");
    photoPreview.innerHTML = "";
    photoPreview.classList.add("hidden");

    showNotification("¡Publicación compartida!", "success");

    // Agregar el nuevo post al principio del feed
    const postsContainer = document.getElementById("postsContainer");
    const timeAgo = getTimeAgo(result.post.createdAt);
    const postElement = createPostElement(result.post, timeAgo);
    postsContainer.insertBefore(postElement, postsContainer.firstChild);
  } catch (error) {
    showNotification(error.message, "error");
  }
}

function startPostsAutoRefresh() {
  if (postsAutoRefreshId || !document.body.classList.contains("main-page")) {
    return;
  }

  postsAutoRefreshId = window.setInterval(() => {
    const isBrowsingStaticView =
      getSearchQueryFromUrl() || getMainViewFromUrl() === "people";
    if (
      !document.hidden &&
      !isBrowsingStaticView &&
      !shouldPauseFeedRefresh()
    ) {
      loadPosts({ soft: true });
    }
  }, 30000);
}

/**
 * Maneja el cierre de sesión
 */
async function handleLogout() {
  try {
    const token = localStorage.getItem("authToken");
    if (token) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
    localStorage.removeItem("authToken");
    localStorage.removeItem("userLogged");
    showNotification("Sesión cerrada", "success");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  }
}

/**
 * Envia heartbeat para mantener estado online
 */
let heartbeatInterval;
function startHeartbeat() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);

  heartbeatInterval = setInterval(async () => {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/auth/heartbeat`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error("Error en heartbeat:", error);
      }
    }
  }, 30000); // Cada 30 segundos
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

/**
 * Escapa caracteres HTML para evitar XSS
 */
function escapeHtml(text) {
  text = String(text || "");
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function renderRichText(text) {
  return escapeHtml(text).replace(
    /(^|\s)(@[A-Za-zÁÉÍÓÚáéíóúÑñ0-9_.]+(?:\s[A-Za-zÁÉÍÓÚáéíóúÑñ0-9_.]+)?)/g,
    (match, prefix, mention) => {
      return `${prefix}<span class="mention">${mention}</span>`;
    },
  );
}

function initMentionAutocomplete(input) {
  if (!input || input.dataset.mentionsReady === "true") {
    return;
  }

  input.dataset.mentionsReady = "true";
  const box = document.createElement("div");
  box.className = "mention-suggestions hidden";
  input.insertAdjacentElement("afterend", box);

  const close = () => {
    box.classList.add("hidden");
    box.innerHTML = "";
  };

  const update = debounce(async () => {
    const cursor = input.selectionStart || input.value.length;
    const beforeCursor = input.value.slice(0, cursor);
    const match = beforeCursor.match(/@([A-Za-zÁÉÍÓÚáéíóúÑñ0-9_. ]{1,30})$/);

    if (!match || match[1].trim().length < 1) {
      close();
      return;
    }

    try {
      const results = await searchSirnergia(match[1].trim());
      const users = (results.users || []).slice(0, 5);

      if (!users.length) {
        close();
        return;
      }

      box.innerHTML = users
        .map(
          (user) => `
                <button type="button" data-mention="${escapeHtml(`${user.firstName} ${user.lastName}`.trim())}">
                    ${renderAvatarMarkup(user.avatar, "👤", "avatar-image")}
                    <span>${renderUserNameMarkup(user)}</span>
                </button>
            `,
        )
        .join("");
      box.classList.remove("hidden");

      box.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", () => {
          const mention = `@${button.dataset.mention}`;
          const start = cursor - match[0].length;
          input.value = `${input.value.slice(0, start)}${mention} ${input.value.slice(cursor)}`;
          input.focus();
          close();
        });
      });
    } catch (error) {
      close();
    }
  }, 200);

  input.addEventListener("input", update);
  input.addEventListener("blur", () => window.setTimeout(close, 150));
}

/**
 * Maneja la selecciÃ³n de fotos
 */
function handlePhotoSelection() {
  const fileInput = document.getElementById("fileInput");
  const photoPreview = document.getElementById("photoPreview");

  if (fileInput.files.length === 0) {
    photoPreview.innerHTML = "";
    photoPreview.classList.add("hidden");
    return;
  }

  photoPreview.innerHTML = "";
  photoPreview.classList.remove("hidden");

  Array.from(fileInput.files).forEach((file, index) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const container = document.createElement("div");
      container.className = "photo-preview-item";
      container.dataset.fileIndex = String(index);
      container.dataset.fit = "cover";

      const img = document.createElement("img");
      img.src = e.target.result;
      img.className = "preview-fit-cover";

      const tools = document.createElement("div");
      tools.className = "photo-adjust-tools";
      tools.innerHTML = `
                <button type="button" data-fit="cover">Recortar</button>
                <button type="button" data-fit="contain">Completa</button>
            `;
      tools.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", () => {
          img.classList.toggle(
            "preview-fit-cover",
            button.dataset.fit === "cover",
          );
          img.classList.toggle(
            "preview-fit-contain",
            button.dataset.fit === "contain",
          );
          container.dataset.fit = button.dataset.fit;
          tools
            .querySelectorAll("button")
            .forEach((toolButton) => toolButton.classList.remove("active"));
          button.classList.add("active");
        });
      });
      const firstTool = tools.querySelector("button");
      if (firstTool) firstTool.classList.add("active");

      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-photo-btn";
      removeBtn.innerHTML = "✕";
      removeBtn.type = "button";
      removeBtn.addEventListener("click", (event) => {
        event.preventDefault();
        // Crear un nuevo DataTransfer para modificar los archivos
        const dataTransfer = new DataTransfer();
        const files = Array.from(fileInput.files);
        files.forEach((f, i) => {
          if (i !== index) {
            dataTransfer.items.add(f);
          }
        });
        fileInput.files = dataTransfer.files;
        handlePhotoSelection(); // Actualizar preview
      });

      container.appendChild(img);
      container.appendChild(tools);
      container.appendChild(removeBtn);
      photoPreview.appendChild(container);
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Inicializa los listeners en la pÃ¡gina principal
 */
function initMainPage() {
  const logoutBtn = document.getElementById("logoutBtn");
  const publishBtn = document.getElementById("publishBtn");
  const postInput = document.getElementById("postInput");
  const photoBtn = document.getElementById("photoBtn");
  const fileInput = document.getElementById("fileInput");

  loadUserData();
  initMobileMenu();
  initStories();
  loadPosts();
  startPostsAutoRefresh();
  loadSuggestedFriends();
  startHeartbeat();

  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  if (publishBtn) {
    publishBtn.addEventListener("click", handlePublishPost);
  }

  if (postInput) {
    initMentionAutocomplete(postInput);
    postInput.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        handlePublishPost();
      }
    });
  }

  if (photoBtn) {
    photoBtn.addEventListener("click", (e) => {
      e.preventDefault();
      fileInput.click();
    });
  }

  // Botón @ — inserta @ en el input y activa el autocomplete de menciones
  const mentionBtn = document.getElementById("mentionBtn");
  if (mentionBtn && postInput) {
    mentionBtn.addEventListener("click", () => {
      postInput.focus();
      const pos = postInput.selectionStart || postInput.value.length;
      const before = postInput.value.slice(0, pos);
      const after = postInput.value.slice(pos);
      const needsSpace = before.length > 0 && !before.endsWith(" ");
      postInput.value = before + (needsSpace ? " @" : "@") + after;
      const newPos = pos + (needsSpace ? 2 : 1);
      postInput.setSelectionRange(newPos, newPos);
      postInput.dispatchEvent(new Event("input"));
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", handlePhotoSelection);
  }

  // Poll creator
  const pollBtn = document.getElementById("pollBtn");
  const pollCreator = document.getElementById("pollCreator");
  const addPollOptionBtn = document.getElementById("addPollOptionBtn");

  if (pollBtn) {
    pollBtn.addEventListener("click", () => {
      pollCreator.classList.toggle("hidden");
      if (!pollCreator.classList.contains("hidden"))
        pollBtn.classList.add("active");
      else pollBtn.classList.remove("active");
    });
  }
  if (addPollOptionBtn) {
    addPollOptionBtn.addEventListener("click", () => {
      const rows = document.querySelectorAll(".poll-option-row");
      if (rows.length >= 5) {
        showNotification("Máximo 5 opciones", "error");
        return;
      }
      const row = document.createElement("div");
      row.className = "poll-option-row";
      row.innerHTML = `<input type="text" class="poll-option-input" placeholder="Opción ${rows.length + 1}" maxlength="80"><button class="poll-remove-option">✕</button>`;
      row
        .querySelector(".poll-remove-option")
        .addEventListener("click", () => row.remove());
      document.getElementById("pollOptions").appendChild(row);
    });
  }

  // Modal de reporte
  const reportModal = document.getElementById("reportModal");
  const closeReportBtn = document.getElementById("closeReportBtn");
  const submitReportBtn = document.getElementById("submitReportBtn");
  if (closeReportBtn)
    closeReportBtn.addEventListener("click", () =>
      reportModal.classList.add("hidden"),
    );
  if (reportModal)
    reportModal.addEventListener("click", (e) => {
      if (e.target === reportModal) reportModal.classList.add("hidden");
    });
  if (submitReportBtn) {
    submitReportBtn.addEventListener("click", async () => {
      const reason = document.getElementById("reportReason").value;
      const description = document
        .getElementById("reportDescription")
        .value.trim();
      if (!reason) {
        showNotification("Selecciona un motivo", "error");
        return;
      }
      try {
        await apiCall("/reports", {
          method: "POST",
          body: JSON.stringify({
            targetType: reportModal._targetType,
            targetId: reportModal._targetId,
            reason,
            description,
          }),
        });
        showNotification("Reporte enviado. Gracias.", "success");
        reportModal.classList.add("hidden");
        document.getElementById("reportReason").value = "";
        document.getElementById("reportDescription").value = "";
      } catch (e) {
        showNotification(e.message, "error");
      }
    });
  }

  if (new URLSearchParams(window.location.search).get("games") === "1") {
    openGamesModal();
  }

  initEvents();
  initSavedPosts();
}

async function loadProfilePage() {
  const user = getStoredUser();
  // Si se pasa `id` en la URL cargamos ese perfil, si no cargamos el propio
  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get("id");
  if (!user && !requestedId) {
    window.location.href = "index.html";
    return;
  }
  const userId = requestedId || user._id;
  const isOwnProfile = String(userId) === String(user ? user._id : "");

  try {
    const [profile, posts] = await Promise.all([
      apiCall(`/users/${userId}`, { method: "GET" }),
      apiCall(`/posts/usuario/${userId}`, { method: "GET" }),
    ]);

    const avatarEl = document.getElementById("userProfileAvatar");
    const nameEl = document.getElementById("userProfileName");
    const emailEl = document.getElementById("userProfileEmail");
    const bioEl = document.getElementById("userProfileBio");
    const joinedEl = document.getElementById("userProfileJoined");
    const postsCountEl = document.getElementById("userProfilePostsCount");
    const friendsCountEl = document.getElementById("userProfileFriendsCount");
    const postsContainer = document.getElementById("profilePostsContainer");
    const firstNameInput = document.getElementById("editFirstName");
    const lastNameInput = document.getElementById("editLastName");
    const bioInput = document.getElementById("editBio");
    const sidebarTitleEl = document.getElementById("profileSidebarTitle");
    const friendsCardTitleEl = document.querySelector("#profileFriendsCard h2");
    const friendsCardDescriptionEl = document.querySelector(
      "#profileFriendsCard p",
    );
    const postsTitleEl = document.getElementById("profilePostsTitle");
    const postsDescriptionEl = document.getElementById(
      "profilePostsDescription",
    );
    const postsQuickLink = document.querySelector(
      'a[href="#profilePostsContainer"]',
    );
    const profileDisplayName =
      `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
      "este perfil";

    if (avatarEl)
      avatarEl.innerHTML = renderAvatarMarkup(
        profile.avatar,
        "👤",
        "profile-avatar-image",
      );
    applyUserNameElement(nameEl, profile);
    if (emailEl) emailEl.textContent = profile.email;
    if (bioEl) bioEl.textContent = profile.bio || "Sin biografía aún.";
    if (joinedEl)
      joinedEl.textContent = new Date(profile.createdAt).toLocaleDateString(
        "es-ES",
      );
    if (postsCountEl) postsCountEl.textContent = posts.length;
    if (friendsCountEl)
      friendsCountEl.textContent = (profile.friends || []).length;
    if (firstNameInput) firstNameInput.value = profile.firstName || "";
    if (lastNameInput) lastNameInput.value = profile.lastName || "";
    if (bioInput) bioInput.value = profile.bio || "";
    if (sidebarTitleEl)
      sidebarTitleEl.textContent = isOwnProfile ? "Mi perfil" : "Perfil";
    if (friendsCardTitleEl)
      friendsCardTitleEl.textContent = isOwnProfile
        ? "Amigos"
        : `Amigos de ${profileDisplayName}`;
    if (friendsCardDescriptionEl)
      friendsCardDescriptionEl.textContent = isOwnProfile
        ? "Aquí aparecen las personas que ya tienes agregadas."
        : `Aquí aparecen las personas que ${profileDisplayName} tiene agregadas.`;
    if (postsTitleEl)
      postsTitleEl.textContent = isOwnProfile
        ? "Mis publicaciones"
        : `Publicaciones de ${profileDisplayName}`;
    if (postsDescriptionEl)
      postsDescriptionEl.textContent = isOwnProfile
        ? "Estas son todas las publicaciones que has creado."
        : `Estas son las publicaciones que ${profileDisplayName} ha compartido.`;
    if (postsQuickLink)
      postsQuickLink.textContent = isOwnProfile
        ? "📝 Mis publicaciones"
        : "📝 Publicaciones";
    renderProfileFriendsList(profile.friends || [], isOwnProfile);

    // ---- Hero card ----
    const heroAvatar = document.getElementById("profileHeroAvatar");
    const heroName = document.getElementById("profileHeroName");
    const heroBio = document.getElementById("profileHeroBio");
    const heroPosts = document.getElementById("profileHeroPosts");
    const heroFriends = document.getElementById("profileHeroFriends");
    const heroJoined = document.getElementById("profileHeroJoined");
    const heroActions = document.getElementById("profileHeroActions");
    const friendsBtn = document.getElementById("profileFriendsBtn");
    const friendsModalTitle = document.getElementById(
      "profileFriendsModalTitle",
    );

    if (heroAvatar)
      heroAvatar.innerHTML = renderAvatarMarkup(
        profile.avatar,
        "👤",
        "profile-avatar-image",
      );
    applyUserNameElement(heroName, profile);
    if (heroBio) heroBio.textContent = profile.bio || "";
    if (heroPosts) heroPosts.textContent = posts.length;
    if (heroFriends) heroFriends.textContent = (profile.friends || []).length;
    if (heroJoined)
      heroJoined.textContent = `Miembro desde ${new Date(profile.createdAt).toLocaleDateString("es-ES")}`;
    if (friendsModalTitle)
      friendsModalTitle.textContent = isOwnProfile
        ? "Mis amigos"
        : `Amigos de ${profileDisplayName}`;

    // Botón de agregar amigo si es perfil ajeno y no son amigos
    if (heroActions) {
      heroActions.innerHTML = "";
      if (!isOwnProfile) {
        const currentFriendIds = new Set(getFriendIds(user));
        const alreadyFriend = currentFriendIds.has(String(userId));
        if (!alreadyFriend) {
          const addBtn = document.createElement("button");
          addBtn.className = "btn-submit";
          addBtn.style.cssText = "padding:8px 20px;font-size:14px;width:auto;";
          addBtn.textContent = "+ Agregar amigo";
          addBtn.addEventListener("click", () => handleAddFriend(userId));
          heroActions.appendChild(addBtn);
        } else {
          heroActions.innerHTML =
            '<span class="profile-friend-badge">✓ Amigos</span>';
        }
      } else {
        heroActions.innerHTML =
          '<a href="customize-profile.html" class="btn-secondary" style="display:inline-block;padding:8px 20px;font-size:14px;">Editar perfil</a>';
      }
    }

    // Abrir modal de amigos
    if (friendsBtn) {
      friendsBtn.onclick = () => {
        renderProfileFriendsList(profile.friends || [], isOwnProfile);
        const modal = document.getElementById("profileFriendsModal");
        if (modal) modal.classList.remove("hidden");
      };
    }

    // Cerrar modal de amigos
    const closeBtn = document.getElementById("closeProfileFriendsBtn");
    const friendsModal = document.getElementById("profileFriendsModal");
    if (closeBtn && friendsModal) {
      closeBtn.onclick = () => friendsModal.classList.add("hidden");
      friendsModal.addEventListener("click", (e) => {
        if (e.target === friendsModal) friendsModal.classList.add("hidden");
      });
    }

    // Si estamos viendo nuestro propio perfil, actualizamos el stored user
    if (isOwnProfile) {
      updateStoredUser({
        ...user,
        ...profile,
      });
    }

    // Mostrar/ocultar botón de personalizar perfil según si es tu perfil
    const customizeBtn = document.getElementById("customizeProfileBtn");
    if (customizeBtn) {
      if (!isOwnProfile) {
        customizeBtn.style.display = "none";
      } else {
        customizeBtn.style.display = "";
      }
    }

    loadUserData();

    if (postsContainer) {
      postsContainer.innerHTML = "";
      if (posts.length === 0) {
        postsContainer.innerHTML = `<p class="no-comments">${isOwnProfile ? "Aún no has publicado nada." : "Esta persona aún no ha publicado nada."}</p>`;
      } else {
        posts.forEach((post) => {
          const timeAgo = getTimeAgo(post.createdAt);
          const postElement = createPostElement(post, timeAgo);
          postsContainer.appendChild(postElement);
        });
      }
    }
  } catch (error) {
    console.error("Error al cargar perfil:", error);
    showNotification("No se pudo cargar el perfil", "error");
  }
}

async function handleProfileAvatarChange(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) {
    return;
  }

  const userData = localStorage.getItem("userLogged");
  if (!userData) {
    window.location.href = "index.html";
    return;
  }

  openAvatarAdjuster(file, JSON.parse(userData), event.target);
}

function openAvatarAdjuster(file, user, fileInput) {
  let modal = document.getElementById("avatarAdjustModal");
  if (!modal) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `
            <div id="avatarAdjustModal" class="modal-overlay hidden">
                <div class="modal-panel">
                    <div class="modal-header">
                        <h3>Ajustar foto</h3>
                        <button id="closeAvatarAdjustBtn" type="button" class="modal-close-btn">×</button>
                    </div>
                    <div class="avatar-adjust-preview"><img id="avatarAdjustPreview" alt="Vista previa"></div>
                    <p class="avatar-adjust-help">La foto se recortara al centro para que se vea bien en el circulo del perfil.</p>
                    <button id="confirmAvatarAdjustBtn" type="button" class="btn-submit">Usar esta foto</button>
                </div>
            </div>
        `,
    );
    modal = document.getElementById("avatarAdjustModal");
  }

  const preview = document.getElementById("avatarAdjustPreview");
  const closeBtn = document.getElementById("closeAvatarAdjustBtn");
  const confirmBtn = document.getElementById("confirmAvatarAdjustBtn");
  const url = URL.createObjectURL(file);
  preview.src = url;
  modal.classList.remove("hidden");

  const cleanup = () => {
    modal.classList.add("hidden");
    URL.revokeObjectURL(url);
    if (fileInput) {
      fileInput.value = "";
    }
  };

  closeBtn.onclick = cleanup;
  confirmBtn.onclick = async () => {
    try {
      confirmBtn.disabled = true;
      const optimizedAvatar = await cropImageToSquareDataUrl(file);
      const avatarEl = document.getElementById("userProfileAvatar");
      setAvatarContent(avatarEl, optimizedAvatar, "👤", "profile-avatar-image");

      const response = await apiCall(`/users/${user._id}`, {
        method: "PUT",
        body: JSON.stringify({ avatar: optimizedAvatar }),
      });

      updateStoredUser(response.user);
      showNotification("Foto de perfil actualizada", "success");
      cleanup();
      await loadProfilePage();
      loadUserData();
    } catch (error) {
      showNotification(error.message, "error");
    } finally {
      confirmBtn.disabled = false;
    }
  };
}

async function handleProfileSave(event) {
  event.preventDefault();

  const userData = localStorage.getItem("userLogged");
  if (!userData) {
    window.location.href = "index.html";
    return;
  }

  const user = JSON.parse(userData);
  const firstNameInput = document.getElementById("editFirstName");
  const lastNameInput = document.getElementById("editLastName");
  const bioInput = document.getElementById("editBio");
  const saveProfileBtn = document.getElementById("saveProfileBtn");
  const firstName = firstNameInput ? firstNameInput.value.trim() : "";
  const lastName = lastNameInput ? lastNameInput.value.trim() : "";
  const bio = bioInput ? bioInput.value.trim() : "";

  if (!firstName || !lastName) {
    showNotification("Completa tu nombre y apellido.", "error");
    return;
  }

  if (saveProfileBtn) {
    saveProfileBtn.classList.add("loading");
    saveProfileBtn.disabled = true;
  }

  try {
    const response = await apiCall(`/users/${user._id}`, {
      method: "PUT",
      body: JSON.stringify({ firstName, lastName, bio }),
    });

    updateStoredUser(response.user);
    showNotification("Perfil actualizado", "success");
    await loadProfilePage();
  } catch (error) {
    showNotification(error.message, "error");
  } finally {
    if (saveProfileBtn) {
      saveProfileBtn.classList.remove("loading");
      saveProfileBtn.disabled = false;
    }
  }
}

function initProfilePage() {
  const logoutBtn = document.getElementById("logoutBtn");
  const changeAvatarBtn = document.getElementById("changeAvatarBtn");
  const avatarInput = document.getElementById("avatarInput");
  const profileForm = document.getElementById("profileForm");

  initMobileMenu();
  loadProfilePage();
  startHeartbeat();

  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  if (changeAvatarBtn && avatarInput) {
    changeAvatarBtn.addEventListener("click", () => {
      avatarInput.click();
    });

    avatarInput.addEventListener("change", handleProfileAvatarChange);
  }

  if (profileForm) {
    profileForm.addEventListener("submit", handleProfileSave);
  }
}

// ===== INICIALIZACIÃ“N GENERAL =====

document.addEventListener("DOMContentLoaded", () => {
  // Comprobar quÃ© pÃ¡gina estamos cargando
  const isMainPage = document.body.classList.contains("main-page");
  const isProfilePage = document.body.classList.contains("profile-page");
  const isChatPage = document.body.classList.contains("chat-page");
  const isGamesPage = document.body.classList.contains("games-page");

  applyTheme();
  initGlobalSearch();
  initSettingsPanel();

  if (isMainPage) {
    initMainPage();
  } else if (isProfilePage && !isChatPage) {
    initProfilePage();
  } else if (isChatPage) {
    initMobileMenu();
  } else if (isGamesPage) {
    initGamesPage();
  } else {
    initLoginPage();
  }
});

function initGamesPage() {
  loadUserData();
  initGames();
  loadGameLeaderboards();
}

function initGames() {
  // Configurar event listeners para los botones de juegos
  document.querySelectorAll(".game-card-btn").forEach((btn) => {
    btn.addEventListener("click", () => launchGame(btn.dataset.game));
  });

  // Configurar botón de volver desde clasificaciones
  const backBtn = document.getElementById("backFromLeaderboardBtn");
  if (backBtn) {
    backBtn.addEventListener("click", goBackToGamesMenu);
  }

  // Configurar tabs de clasificaciones
  initLeaderboardPanel();
}

// Agregar animaciÃ³n de fade out a las notificaciones
const style = document.createElement("style");
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(400px);
        }
    }
`;
document.head.appendChild(style);

// ===== JUEGOS =====

let _snakeInterval = null;
let _memoryTimerInterval = null;
let _tetrisInterval = null;

function stopTetris() {
  if (_tetrisInterval) {
    clearInterval(_tetrisInterval);
    _tetrisInterval = null;
  }
}

function goBackToGamesMenu() {
  stopSnake();
  stopMemoryTimer();
  stopTetris();
  exitGameFullscreen();
  const menu = document.getElementById("gamesMenu");
  const container = document.getElementById("gameContainer");
  const lbPanel = document.getElementById("leaderboardPanel");
  if (container) {
    container.classList.add("hidden");
    container.innerHTML = "";
  }
  if (lbPanel) lbPanel.classList.add("hidden");
  if (menu) menu.classList.remove("hidden");
}

function formatGameTime(timeMs) {
  const ms = Math.max(0, Number(timeMs) || 0);
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);

  if (minutes > 0) {
    return `${minutes}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
  }

  return `${seconds}.${String(centiseconds).padStart(2, "0")}s`;
}

function renderLeaderboardHtml(entries, game) {
  const medals = ["🥇", "🥈", "🥉"];

  // Siempre mostrar 10 posiciones, rellenando con "-" si no hay datos
  const entriesWithGaps = [];
  for (let i = 0; i < 10; i++) {
    if (entries && entries[i]) {
      const entry = entries[i];
      let value;
      if (game === "memory") {
        value = formatGameTime(entry.timeMs);
      } else if (game === "total") {
        value = `${entry.totalScore} pts`;
      } else {
        value = `${entry.score} pts`;
      }
      const rank =
        medals[i] || `<span class="lb-rank-num">${i + 1}</span>`;
      const isTop = i < 3 ? `lb-top lb-top-${i + 1}` : "";
      entriesWithGaps.push(`
            <li class="${isTop}">
                <span class="lb-rank">${rank}</span>
                <span class="lb-user">${renderUserNameMarkup(entry.user, { tag: "span" })}</span>
                <span class="lb-value">${value}</span>
            </li>
        `);
    } else {
      const rank =
        medals[i] || `<span class="lb-rank-num">${i + 1}</span>`;
      const isTop = i < 3 ? `lb-top lb-top-${i + 1}` : "";
      entriesWithGaps.push(`
            <li class="${isTop} lb-empty">
                <span class="lb-rank">${rank}</span>
                <span class="lb-user">-</span>
                <span class="lb-value">-</span>
            </li>
        `);
    }
  }

  return `<ol class="leaderboard-list">${entriesWithGaps.join("")}</ol>`;
}

async function loadGameLeaderboards() {
  const userData = JSON.parse(localStorage.getItem("userLogged") || "null");
  const userId = userData ? userData._id : null;

  const games = ["snake", "memory", "tetris", "2048", "ppt", "total"];
  const elIds = {
    snake: "leaderboardSnake",
    memory: "leaderboardMemory",
    tetris: "leaderboardTetris",
    2048: "leaderboard2048",
    ppt: "leaderboardPPT",
    total: "leaderboardTotal",
  };

  // Verificar que al menos uno existe
  const anyExists = games.some((g) => document.getElementById(elIds[g]));
  if (!anyExists) return;

  for (const game of games) {
    const el = document.getElementById(elIds[game]);
    if (!el) continue;
    el.textContent = "Cargando...";
    try {
      let data;
      if (game === "total") {
        const url = userId
          ? `/games/total/leaderboard?userId=${userId}`
          : `/games/total/leaderboard`;
        data = await apiCall(url);
      } else {
        const url = userId
          ? `/games/leaderboard/${game}?userId=${userId}`
          : `/games/leaderboard/${game}`;
        data = await apiCall(url);
      }
      let html = renderLeaderboardHtml(data.leaderboard || [], game);

      // Si el usuario no está en top 10 pero tiene posición
      if (data.userRank && data.userEntry) {
        const u = data.userEntry;
        let value;
        if (game === "memory") {
          value = formatGameTime(u.timeMs);
        } else if (game === "total") {
          value = `${u.totalScore} pts`;
        } else {
          value = `${u.score} pts`;
        }
        html += `<div class="lb-my-rank">
          <span class="lb-rank-separator">···</span>
          <div class="lb-my-row">
            <span class="lb-rank"><span class="lb-rank-num">${data.userRank}</span></span>
            <span class="lb-user lb-my-label">Tú (${renderUserNameMarkup(u.user, { tag: "span" })})</span>
            <span class="lb-value">${value}</span>
          </div>
        </div>`;
      }

      el.innerHTML = html;
    } catch (e) {
      el.innerHTML = '<p class="leaderboard-empty">No se pudo cargar.</p>';
    }
  }
}

async function submitGameScore(game, payload) {
  const token = localStorage.getItem("authToken");
  if (!token) {
    return null;
  }

  try {
    const result = await apiCall("/games/scores", {
      method: "POST",
      body: JSON.stringify({ game, ...payload }),
    });

    if (result.improved) {
      const toast = document.createElement("p");
      toast.className = "leaderboard-toast";
      const gameNames = {
        snake: "Snake",
        memory: "Memorama",
        tetris: "Tetris",
        2048: "2048",
        ppt: "Piedra Papel Tijeras",
      };
      toast.textContent = `¡Nuevo récord en ${gameNames[game] || game}!`;
      const container = document.getElementById("gameContainer");
      container?.appendChild(toast);
      window.setTimeout(() => toast.remove(), 2800);
    }

    await loadGameLeaderboards();
    return result;
  } catch (error) {
    console.error("Error al guardar puntuación:", error);
    return null;
  }
}

function openGamesModal() {
  const modal = document.getElementById("gamesModal");
  const menu = document.getElementById("gamesMenu");
  const container = document.getElementById("gameContainer");
  const lbPanel = document.getElementById("leaderboardPanel");
  if (!modal) return;
  // Volver siempre al menú principal al abrir
  if (menu) menu.classList.remove("hidden");
  if (container) {
    container.classList.add("hidden");
    container.innerHTML = "";
  }
  if (lbPanel) lbPanel.classList.add("hidden");
  stopSnake();
  stopMemoryTimer();
  stopTetris();
  modal.classList.remove("hidden");
}

function closeGamesModal() {
  const modal = document.getElementById("gamesModal");
  if (modal) modal.classList.add("hidden");
  stopSnake();
  stopMemoryTimer();
  stopTetris();
}

function stopMemoryTimer() {
  if (_memoryTimerInterval) {
    clearInterval(_memoryTimerInterval);
    _memoryTimerInterval = null;
  }
}

function enterGameFullscreen() {
  const modal = document.getElementById("gamesModal");
  const panel = modal ? modal.querySelector(".modal-panel") : null;
  if (modal) modal.classList.add("game-playing");
  if (panel) panel.classList.add("game-fullscreen");
}

function exitGameFullscreen() {
  const modal = document.getElementById("gamesModal");
  const panel = modal ? modal.querySelector(".modal-panel") : null;
  if (modal) modal.classList.remove("game-playing");
  if (panel) panel.classList.remove("game-fullscreen");
}

function launchGame(game) {
  const menu = document.getElementById("gamesMenu");
  const container = document.getElementById("gameContainer");
  const lbPanel = document.getElementById("leaderboardPanel");

  console.log("launchGame llamado con:", game);

  if (game === "leaderboard") {
    // Mostrar panel de clasificaciones
    if (menu) menu.classList.add("hidden");
    if (container) {
      container.classList.add("hidden");
      container.innerHTML = "";
    }
    if (lbPanel) {
      lbPanel.classList.remove("hidden");
      // Activar tab Snake por defecto
      lbPanel
        .querySelectorAll(".lb-tab")
        .forEach((t) => t.classList.remove("active"));
      lbPanel
        .querySelector(".lb-tab[data-tab='snake']")
        .classList.add("active");
      [
        "lbTabSnake",
        "lbTabMemory",
        "lbTabTetris",
        "lbTab2048",
        "lbTabPPT",
      ].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle("hidden", id !== "lbTabSnake");
      });
      loadGameLeaderboards();
    }
    return;
  }

  if (!container) {
    console.error("gameContainer no encontrado");
    return;
  }
  
  console.log("Ocultando menú y panel de clasificaciones");
  if (menu) {
    menu.classList.add("hidden");
    console.log("Menú oculto");
  }
  if (lbPanel) {
    lbPanel.classList.add("hidden");
    console.log("Panel de clasificaciones oculto");
  }
  
  container.classList.remove("hidden");
  container.innerHTML = "";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.alignItems = "center";
  container.style.justifyContent = "flex-start";
  container.style.padding = "20px";
  
  console.log("Lanzando juego:", game);
  
  if (game === "snake") startSnake(container);
  else if (game === "memory") startMemory(container);
  else if (game === "tetris") startTetris(container);
  else if (game === "2048") start2048(container);
  else if (game === "ppt") startPPT(container);
  else console.error("Juego no reconocido:", game);
}

function initLeaderboardPanel() {
  // Botón volver desde clasificaciones
  const backBtn = document.getElementById("backFromLeaderboardBtn");
  if (backBtn) {
    backBtn.addEventListener("click", goBackToGamesMenu);
  }

  // Tabs de clasificaciones (5 tabs)
  const tabBtns = document.querySelectorAll(".lb-tab");
  const tabContentIds = {
    snake: "lbTabSnake",
    memory: "lbTabMemory",
    tetris: "lbTabTetris",
    2048: "lbTab2048",
    ppt: "lbTabPPT",
  };
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((t) => t.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.dataset.tab;
      Object.entries(tabContentIds).forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle("hidden", key !== tab);
      });
    });
  });
}

// ---- SNAKE ----
function stopSnake() {
  if (_snakeInterval) {
    clearInterval(_snakeInterval);
    _snakeInterval = null;
  }
}

function startSnake(container) {
  stopSnake();
  const COLS = 20,
    ROWS = 20;
  // Aumentar SIZE base para que se vea más grande
  const SIZE = 45;
  let snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  let dir = { x: 1, y: 0 },
    nextDir = { x: 1, y: 0 };
  let score = 0,
    alive = true;

  function rndFood() {
    let p;
    do {
      p = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS),
      };
    } while (snake.some((s) => s.x === p.x && s.y === p.y));
    return p;
  }
  let food = rndFood();

  container.innerHTML = `<div class="game-wrap bg-snake">
    <div class="game-header">
      <button class="game-back-btn">← Menú</button>
      <span class="game-title">🐍 Snake</span>
      <span id="snakeScore" class="game-score">0 pts</span>
      <button class="game-end-btn" id="snakeEndBtn">⏹ Finalizar</button>
    </div>
    <canvas id="snakeCanvas" width="${COLS * SIZE}" height="${ROWS * SIZE}" style="display:block;border-radius:10px;box-shadow:0 4px 24px rgba(0,0,0,0.5);"></canvas>
    <p class="game-hint">←→↑↓ o D-Pad para mover</p>
    <div class="game-dpad">
      <button data-dir="UP">▲</button>
      <div><button data-dir="LEFT">◄</button><button data-dir="RIGHT">►</button></div>
      <button data-dir="DOWN">▼</button>
    </div>
  </div>`;

  container
    .querySelector(".game-back-btn")
    .addEventListener("click", goBackToGamesMenu);
  container.querySelector("#snakeEndBtn").addEventListener("click", () => {
    stopSnake();
    submitGameScore("snake", { score });
    goBackToGamesMenu();
  });

  const canvas = document.getElementById("snakeCanvas");
  const ctx = canvas.getContext("2d");

  function draw() {
    // Fondo con grid sutil
    ctx.fillStyle = "#0a1628";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * SIZE, 0);
      ctx.lineTo(i * SIZE, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i <= ROWS; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * SIZE);
      ctx.lineTo(canvas.width, i * SIZE);
      ctx.stroke();
    }
    // Comida con efecto glow
    const grd = ctx.createRadialGradient(
      food.x * SIZE + SIZE / 2,
      food.y * SIZE + SIZE / 2,
      1,
      food.x * SIZE + SIZE / 2,
      food.y * SIZE + SIZE / 2,
      SIZE / 2,
    );
    grd.addColorStop(0, "#ff6b6b");
    grd.addColorStop(1, "#f02849");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(
      food.x * SIZE + SIZE / 2,
      food.y * SIZE + SIZE / 2,
      SIZE / 2 - 2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.shadowColor = "#f02849";
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
    // Serpiente
    snake.forEach((seg, i) => {
      const isHead = i === 0;
      ctx.fillStyle = isHead
        ? "#4ade80"
        : `hsl(${140 + i * 2},70%,${45 - i * 0.5}%)`;
      ctx.shadowColor = isHead ? "rgba(74,222,128,0.6)" : "none";
      ctx.shadowBlur = isHead ? 8 : 0;
      const r = isHead ? 5 : 3;
      ctx.beginPath();
      ctx.roundRect(seg.x * SIZE + 1, seg.y * SIZE + 1, SIZE - 2, SIZE - 2, r);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    if (!alive) {
      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.font = "bold 26px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("💀 Game Over", canvas.width / 2, canvas.height / 2 - 18);
      ctx.font = "18px sans-serif";
      ctx.fillStyle = "#4ade80";
      ctx.fillText(
        `Puntaje: ${score}`,
        canvas.width / 2,
        canvas.height / 2 + 14,
      );
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "13px sans-serif";
      ctx.fillText(
        "Toca para reiniciar",
        canvas.width / 2,
        canvas.height / 2 + 40,
      );
    }
  }

  function tick() {
    if (!alive) return;
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (
      head.x < 0 ||
      head.x >= COLS ||
      head.y < 0 ||
      head.y >= ROWS ||
      snake.some((s) => s.x === head.x && s.y === head.y)
    ) {
      alive = false;
      submitGameScore("snake", { score });
      draw();
      return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score++;
      document.getElementById("snakeScore").textContent = score + " pts";
      food = rndFood();
    } else {
      snake.pop();
    }
    draw();
  }

  const DIRS = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
  };
  const DPAD = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 },
  };
  function setDir(d) {
    if (d.x !== 0 && dir.x !== 0) return;
    if (d.y !== 0 && dir.y !== 0) return;
    nextDir = d;
  }

  function snakeKey(e) {
    if (!document.getElementById("snakeCanvas")) {
      document.removeEventListener("keydown", snakeKey);
      return;
    }
    if (DIRS[e.key]) {
      e.preventDefault();
      e.stopPropagation();
      setDir(DIRS[e.key]);
    }
  }
  document.addEventListener("keydown", snakeKey);

  container.querySelectorAll(".game-dpad button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const d = DPAD[btn.dataset.dir];
      if (d) setDir(d);
    });
  });

  canvas.addEventListener("click", () => {
    if (!alive) {
      snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 },
      ];
      dir = { x: 1, y: 0 };
      nextDir = { x: 1, y: 0 };
      food = rndFood();
      score = 0;
      alive = true;
      document.getElementById("snakeScore").textContent = "0 pts";
      stopSnake();
      _snakeInterval = setInterval(tick, 130);
    }
  });

  draw();
  _snakeInterval = setInterval(tick, 130);
}

// ---- MEMORAMA ----
function startMemory(container) {
  stopMemoryTimer();
  const emojis = [
    "\uD83C\uDF55",
    "\uD83C\uDFB8",
    "\uD83C\uDF08",
    "\uD83D\uDC36",
    "\uD83D\uDE80",
    "\uD83C\uDFAF",
    "\uD83C\uDF40",
    "\uD83E\uDD8B",
  ];
  let cards = [...emojis, ...emojis]
    .sort(() => Math.random() - 0.5)
    .map((e, i) => ({ id: i, emoji: e, flipped: false, matched: false }));
  let first = null,
    second = null,
    lock = false,
    startTime = null,
    elapsedMs = 0,
    scoreSubmitted = false;

  function updateTimer() {
    const t = document.getElementById("memTimer");
    if (t) t.textContent = formatGameTime(elapsedMs);
  }
  function ensureTimer() {
    if (startTime) return;
    startTime = Date.now();
    _memoryTimerInterval = setInterval(() => {
      elapsedMs = Date.now() - startTime;
      updateTimer();
    }, 50);
  }
  function stopTimer() {
    if (_memoryTimerInterval) {
      clearInterval(_memoryTimerInterval);
      _memoryTimerInterval = null;
    }
    if (startTime) elapsedMs = Date.now() - startTime;
  }
  function handleWin() {
    if (!cards.every((c) => c.matched)) return;
    stopTimer();
    if (!scoreSubmitted) {
      scoreSubmitted = true;
      submitGameScore("memory", { timeMs: elapsedMs });
    }
  }

  function render() {
    const won = cards.every((c) => c.matched);
    container.innerHTML = `<div class="game-wrap bg-memory">
      <div class="game-header">
        <button class="game-back-btn">← Menú</button>
        <span class="game-title">🃏 Memorama</span>
        <span class="game-score">⏱ <b id="memTimer">${formatGameTime(elapsedMs)}</b></span>
        <button class="game-end-btn" id="memEndBtn">⏹ Finalizar</button>
      </div>
      <div class="memory-grid">
        ${cards.map((c) => `<button class="memory-card${c.flipped || c.matched ? " flipped" : ""}${c.matched ? " matched" : ""}" data-id="${c.id}"><span class="card-front">${c.emoji}</span><span class="card-back">❓</span></button>`).join("")}
      </div>
      ${won ? `<p class="game-win">🎉 ¡Completado en ${formatGameTime(elapsedMs)}!</p>` : ""}
    </div>`;

    container.querySelector(".game-back-btn").addEventListener("click", () => {
      stopTimer();
      goBackToGamesMenu();
    });
    container.querySelector("#memEndBtn").addEventListener("click", () => {
      stopTimer();
      submitGameScore("memory", { timeMs: elapsedMs || 1 });
      goBackToGamesMenu();
    });

    container.querySelectorAll(".memory-card:not(.matched)").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (lock) return;
        const id = parseInt(btn.dataset.id, 10);
        const card = cards[id];
        if (card.flipped || card.matched) return;
        ensureTimer();
        card.flipped = true;
        if (!first) {
          first = card;
          render();
          return;
        }
        second = card;
        render();
        if (first.emoji === second.emoji) {
          first.matched = true;
          second.matched = true;
          first = null;
          second = null;
          render();
          handleWin();
        } else {
          lock = true;
          setTimeout(() => {
            first.flipped = false;
            second.flipped = false;
            first = null;
            second = null;
            lock = false;
            render();
          }, 900);
        }
      });
    });
  }
  render();
}

// ---- TETRIS ----
function startTetris(container) {
  stopTetris();
  const COLS = 10,
    ROWS = 20;
  // Aumentar SIZE base para que se vea más grande
  const SIZE = 45;
  let score = 0,
    alive = true;

  const PIECES = [
    { shape: [[1, 1, 1, 1]], color: "#00f0f0" },
    {
      shape: [
        [1, 1],
        [1, 1],
      ],
      color: "#f0f000",
    },
    {
      shape: [
        [0, 1, 0],
        [1, 1, 1],
      ],
      color: "#a000f0",
    },
    {
      shape: [
        [0, 1, 1],
        [1, 1, 0],
      ],
      color: "#00f000",
    },
    {
      shape: [
        [1, 1, 0],
        [0, 1, 1],
      ],
      color: "#f00000",
    },
    {
      shape: [
        [1, 0],
        [1, 0],
        [1, 1],
      ],
      color: "#0000f0",
    },
    {
      shape: [
        [0, 1],
        [0, 1],
        [1, 1],
      ],
      color: "#f0a000",
    },
  ];

  const board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  function randomPiece() {
    const p = PIECES[Math.floor(Math.random() * PIECES.length)];
    return {
      shape: p.shape.map((r) => [...r]),
      color: p.color,
      x: Math.floor(COLS / 2) - Math.floor(p.shape[0].length / 2),
      y: 0,
    };
  }

  let current = randomPiece();

  container.innerHTML = `<div class="game-wrap bg-tetris">
    <div class="game-header">
      <button class="game-back-btn">← Menú</button>
      <span class="game-title">🧱 Tetris</span>
      <span id="tetrisScore" class="game-score">0 pts</span>
      <button class="game-end-btn" id="tetrisEndBtn">⏹ Finalizar</button>
    </div>
    <canvas id="tetrisCanvas" width="${COLS * SIZE}" height="${ROWS * SIZE}" style="display:block;border-radius:10px;box-shadow:0 4px 24px rgba(0,0,0,0.6);"></canvas>
    <p class="game-hint">←→ mover · ↑ rotar · ↓ bajar</p>
    <div class="game-dpad">
      <button data-dir="UP">↻</button>
      <div><button data-dir="LEFT">◄</button><button data-dir="RIGHT">►</button></div>
      <button data-dir="DOWN">▼</button>
    </div>
  </div>`;

  container
    .querySelector(".game-back-btn")
    .addEventListener("click", goBackToGamesMenu);
  container.querySelector("#tetrisEndBtn").addEventListener("click", () => {
    stopTetris();
    submitGameScore("tetris", { score });
    goBackToGamesMenu();
  });

  const canvas = document.getElementById("tetrisCanvas");
  const ctx = canvas.getContext("2d");

  function rotate(shape) {
    return shape[0].map((_, i) => shape.map((row) => row[i]).reverse());
  }

  function valid(shape, x, y) {
    return shape.every((row, dy) =>
      row.every((cell, dx) => {
        if (!cell) return true;
        const nx = x + dx,
          ny = y + dy;
        return nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !board[ny][nx];
      }),
    );
  }

  function place() {
    current.shape.forEach((row, dy) =>
      row.forEach((cell, dx) => {
        if (cell) board[current.y + dy][current.x + dx] = current.color;
      }),
    );
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every((c) => c)) {
        board.splice(r, 1);
        board.unshift(Array(COLS).fill(null));
        cleared++;
        r++;
      }
    }
    const points = [0, 100, 300, 500, 800][cleared] || 0;
    score += points;
    const se = document.getElementById("tetrisScore");
    if (se) se.textContent = score + " pts";
    current = randomPiece();
    if (!valid(current.shape, current.x, current.y)) {
      alive = false;
      stopTetris();
      submitGameScore("tetris", { score });
      draw();
    }
  }

  function drawBlock(x, y, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x * SIZE + 2, y * SIZE + 2, SIZE - 4, SIZE - 4, 4);
    ctx.fill();
    // brillo
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.roundRect(x * SIZE + 3, y * SIZE + 3, SIZE - 6, 6, 2);
    ctx.fill();
    // sombra inferior
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(x * SIZE + 2, y * SIZE + SIZE - 6, SIZE - 4, 4);
  }

  function draw() {
    // Fondo oscuro con grid
    ctx.fillStyle = "#0a0014";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * SIZE, 0);
      ctx.lineTo(i * SIZE, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i <= ROWS; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * SIZE);
      ctx.lineTo(canvas.width, i * SIZE);
      ctx.stroke();
    }
    board.forEach((row, y) =>
      row.forEach((color, x) => {
        if (color) drawBlock(x, y, color);
      }),
    );
    if (alive)
      current.shape.forEach((row, dy) =>
        row.forEach((cell, dx) => {
          if (cell) drawBlock(current.x + dx, current.y + dy, current.color);
        }),
      );
    if (!alive) {
      ctx.fillStyle = "rgba(0,0,0,0.75)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.font = "bold 26px sans-serif";
      ctx.fillText("💀 Game Over", canvas.width / 2, canvas.height / 2 - 18);
      ctx.font = "18px sans-serif";
      ctx.fillStyle = "#a78bfa";
      ctx.fillText(`${score} pts`, canvas.width / 2, canvas.height / 2 + 12);
      ctx.font = "13px sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText(
        "Toca para reiniciar",
        canvas.width / 2,
        canvas.height / 2 + 40,
      );
    }
  }

  function tick() {
    if (!alive) return;
    if (valid(current.shape, current.x, current.y + 1)) {
      current.y++;
    } else {
      place();
    }
    draw();
  }

  canvas.addEventListener("click", () => {
    if (!alive) {
      board.forEach((r) => r.fill(null));
      score = 0;
      alive = true;
      current = randomPiece();
      const scoreEl = document.getElementById("tetrisScore");
      if (scoreEl) scoreEl.textContent = 0;
      stopTetris();
      _tetrisInterval = setInterval(tick, 500);
      draw();
    }
  });

  function tetrisKey(e) {
    if (!document.getElementById("tetrisCanvas")) {
      document.removeEventListener("keydown", tetrisKey);
      return;
    }
    if (!alive) return;
    const arrows = ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp"];
    if (!arrows.includes(e.key)) return;
    e.preventDefault();
    e.stopPropagation();
    if (
      e.key === "ArrowLeft" &&
      valid(current.shape, current.x - 1, current.y)
    ) {
      current.x--;
      draw();
    } else if (
      e.key === "ArrowRight" &&
      valid(current.shape, current.x + 1, current.y)
    ) {
      current.x++;
      draw();
    } else if (e.key === "ArrowDown") {
      if (valid(current.shape, current.x, current.y + 1)) {
        current.y++;
        draw();
      }
    } else if (e.key === "ArrowUp") {
      const rot = rotate(current.shape);
      if (valid(rot, current.x, current.y)) {
        current.shape = rot;
        draw();
      }
    }
  }
  document.addEventListener("keydown", tetrisKey);

  container.querySelectorAll(".game-dpad button").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!alive) return;
      const d = btn.dataset.dir;
      if (d === "LEFT" && valid(current.shape, current.x - 1, current.y)) {
        current.x--;
        draw();
      } else if (
        d === "RIGHT" &&
        valid(current.shape, current.x + 1, current.y)
      ) {
        current.x++;
        draw();
      } else if (
        d === "DOWN" &&
        valid(current.shape, current.x, current.y + 1)
      ) {
        current.y++;
        draw();
      } else if (d === "UP") {
        const rot = rotate(current.shape);
        if (valid(rot, current.x, current.y)) {
          current.shape = rot;
          draw();
        }
      }
    });
  });

  draw();
  _tetrisInterval = setInterval(tick, 500);
}

// ---- 2048 ----
function start2048(container) {
  const SIZE = 4;
  let board2048 = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  let score2048 = 0,
    alive2048 = true;

  function addRandom() {
    const empty = [];
    board2048.forEach((r, y) =>
      r.forEach((c, x) => {
        if (!c) empty.push({ x, y });
      }),
    );
    if (!empty.length) return;
    const { x, y } = empty[Math.floor(Math.random() * empty.length)];
    board2048[y][x] = Math.random() < 0.9 ? 2 : 4;
  }

  addRandom();
  addRandom();

  const COLORS = {
    0: "#cdc1b4",
    2: "#eee4da",
    4: "#ede0c8",
    8: "#f2b179",
    16: "#f59563",
    32: "#f67c5f",
    64: "#f65e3b",
    128: "#edcf72",
    256: "#edcc61",
    512: "#edc850",
    1024: "#edc53f",
    2048: "#edc22e",
  };

  container.innerHTML = `<div class="game-wrap bg-2048">
    <div class="game-header">
      <button class="game-back-btn">← Menú</button>
      <span class="game-title">🔢 2048</span>
      <button class="game-end-btn" id="end2048Btn" style="background:rgba(119,110,101,0.8)">⏹ Finalizar</button>
    </div>
    <div class="board2048-wrap">
      <div class="board2048-scores">
        <div class="board2048-score-box"><div class="lb">Puntaje</div><div class="val" id="score2048">0</div></div>
      </div>
      <div id="board2048" class="board2048"></div>
    </div>
    <p class="game-hint">Desliza o usa ←→↑↓ para mover · llega a 2048!</p>
  </div>`;

  container
    .querySelector(".game-back-btn")
    .addEventListener("click", goBackToGamesMenu);
  container.querySelector("#end2048Btn").addEventListener("click", () => {
    submitGameScore("2048", { score: score2048 });
    goBackToGamesMenu();
  });

  function render2048() {
    const el = document.getElementById("board2048");
    if (!el) return;
    el.innerHTML = board2048
      .map((row) =>
        row
          .map((v) => {
            const fs =
              v >= 1024 ? "18px" : v >= 128 ? "22px" : v >= 8 ? "26px" : "30px";
            const tc = v > 4 ? "#f9f6f2" : "#776e65";
            return `<div class="tile2048" data-val="${v}" style="background:${COLORS[v] || "#3c3a32"};color:${tc};font-size:${fs}">${v || ""}</div>`;
          })
          .join(""),
      )
      .join("");
  }

  function slide(row) {
    let r = row.filter((x) => x);
    for (let i = 0; i < r.length - 1; i++) {
      if (r[i] === r[i + 1]) {
        r[i] *= 2;
        score2048 += r[i];
        r.splice(i + 1, 1);
      }
    }
    while (r.length < SIZE) r.push(0);
    return r;
  }

  function move(dir) {
    let moved = false;
    if (dir === "left") {
      board2048 = board2048.map((r) => {
        const s = slide(r);
        if (JSON.stringify(s) !== JSON.stringify(r)) moved = true;
        return s;
      });
    } else if (dir === "right") {
      board2048 = board2048.map((r) => {
        const rev = slide([...r].reverse()).reverse();
        if (JSON.stringify(rev) !== JSON.stringify(r)) moved = true;
        return rev;
      });
    } else if (dir === "up") {
      for (let c = 0; c < SIZE; c++) {
        const col = board2048.map((r) => r[c]);
        const s = slide(col);
        s.forEach((v, r) => {
          if (board2048[r][c] !== v) moved = true;
          board2048[r][c] = v;
        });
      }
    } else if (dir === "down") {
      for (let c = 0; c < SIZE; c++) {
        const col = board2048.map((r) => r[c]).reverse();
        const s = slide(col).reverse();
        s.forEach((v, r) => {
          if (board2048[r][c] !== v) moved = true;
          board2048[r][c] = v;
        });
      }
    }
    if (moved) {
      addRandom();
      const el = document.getElementById("score2048");
      if (el) el.textContent = score2048;
    }
    if (board2048.flat().includes(2048)) {
      alive2048 = false;
      submitGameScore("2048", { score: score2048 });
    }
    const hasEmpty = board2048.flat().includes(0);
    const hasMerge = board2048.some((r, y) =>
      r.some(
        (v, x) =>
          (x < SIZE - 1 && v === board2048[y][x + 1]) ||
          (y < SIZE - 1 && v === board2048[y + 1][x]),
      ),
    );
    if (!hasEmpty && !hasMerge) {
      alive2048 = false;
      submitGameScore("2048", { score: score2048 });
    }
    render2048();
  }

  function key2048(e) {
    if (!document.getElementById("board2048")) {
      document.removeEventListener("keydown", key2048);
      return;
    }
    if (!alive2048) return;
    const map = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
    };
    if (map[e.key]) {
      e.preventDefault();
      e.stopPropagation();
      move(map[e.key]);
    }
  }
  document.addEventListener("keydown", key2048);

  let tx = 0,
    ty = 0;
  container.addEventListener(
    "touchstart",
    (e) => {
      tx = e.touches[0].clientX;
      ty = e.touches[0].clientY;
    },
    { passive: true },
  );
  container.addEventListener(
    "touchend",
    (e) => {
      if (!alive2048) return;
      const dx = e.changedTouches[0].clientX - tx;
      const dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > Math.abs(dy)) {
        move(dx > 0 ? "right" : "left");
      } else {
        move(dy > 0 ? "down" : "up");
      }
    },
    { passive: true },
  );

  render2048();
}

// ---- PIEDRA PAPEL TIJERAS ----
function startPPT(container) {
  let score = 0,
    wins = 0,
    losses = 0,
    round = 0,
    maxRounds = 10;

  function render() {
    const done = round >= maxRounds;
    container.innerHTML = `<div class="game-wrap bg-ppt">
      <div class="game-header">
        <button class="game-back-btn">← Menú</button>
        <span class="game-title">✊ PPT</span>
        <span class="game-score">${round}/${maxRounds}</span>
        <button class="game-end-btn" id="pptEndBtn">⏹ Finalizar</button>
      </div>
      <div class="ppt-arena">
        <div class="ppt-scoreboard">
          <div class="ppt-score-item"><div class="ppt-sl">🏆 Pts</div><div class="ppt-sv">${score}</div></div>
          <div class="ppt-score-item"><div class="ppt-sl">✅ Victorias</div><div class="ppt-sv">${wins}</div></div>
          <div class="ppt-score-item"><div class="ppt-sl">❌ Derrotas</div><div class="ppt-sv">${losses}</div></div>
        </div>
        ${
          done
            ? `<p class="ppt-instruction">🎊 ¡Juego terminado!<br><span style="font-size:28px;font-weight:800">${score} pts</span></p>
             <button class="ppt-btn ppt-restart" style="margin:0 auto">🔄 Jugar de nuevo</button>`
            : `<p class="ppt-instruction">Elige tu movimiento:</p>
             <div class="ppt-choices">
               <button class="ppt-btn" data-choice="rock">✊<span>Piedra</span></button>
               <button class="ppt-btn" data-choice="paper">✋<span>Papel</span></button>
               <button class="ppt-btn" data-choice="scissors">✌️<span>Tijeras</span></button>
             </div>`
        }
      </div>
      <div id="pptResult" class="ppt-result"></div>
    </div>`;

    container
      .querySelector(".game-back-btn")
      .addEventListener("click", goBackToGamesMenu);
    container.querySelector("#pptEndBtn").addEventListener("click", () => {
      submitGameScore("ppt", { score });
      goBackToGamesMenu();
    });

    if (done) {
      submitGameScore("ppt", { score });
      container.querySelector(".ppt-restart")?.addEventListener("click", () => {
        score = 0;
        wins = 0;
        losses = 0;
        round = 0;
        render();
      });
      return;
    }

    container.querySelectorAll(".ppt-btn[data-choice]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const choices = ["rock", "paper", "scissors"];
        const emojis = { rock: "✊", paper: "✋", scissors: "✌️" };
        const names = { rock: "Piedra", paper: "Papel", scissors: "Tijeras" };
        const cpu = choices[Math.floor(Math.random() * 3)];
        const player = btn.dataset.choice;
        let result = "",
          pts = 0,
          icon = "";
        if (player === cpu) {
          result = "¡Empate!";
          icon = "🤝";
        } else if (
          (player === "rock" && cpu === "scissors") ||
          (player === "paper" && cpu === "rock") ||
          (player === "scissors" && cpu === "paper")
        ) {
          pts = 10;
          score += pts;
          wins++;
          result = `¡Ganaste! +${pts} pts`;
          icon = "🎉";
        } else {
          losses++;
          result = "Perdiste...";
          icon = "😢";
        }
        round++;
        const res = document.getElementById("pptResult");
        if (res)
          res.innerHTML = `<div style="background:rgba(255,255,255,0.12);border-radius:12px;padding:12px 16px;margin-top:10px">${icon} Tú: ${emojis[player]} ${names[player]} vs CPU: ${emojis[cpu]} ${names[cpu]}<br><strong style="color:white">${result}</strong></div>`;
        setTimeout(() => render(), 1100);
      });
    });
  }
  render();
}

// ===== EVENTOS =====

function initEvents() {
  const openLink = document.getElementById("openEventsLink");
  const modal = document.getElementById("eventsModal");
  const closeBtn = document.getElementById("closeEventsBtn");
  const createBtn = document.getElementById("createEventBtn");
  const form = document.getElementById("createEventForm");
  const submitBtn = document.getElementById("submitEventBtn");
  const cancelBtn = document.getElementById("cancelEventBtn");
  if (!openLink || !modal) return;

  openLink.addEventListener("click", (e) => {
    e.preventDefault();
    modal.classList.remove("hidden");
    loadEvents();
  });
  closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });
  createBtn.addEventListener("click", () => form.classList.toggle("hidden"));
  cancelBtn.addEventListener("click", () => form.classList.add("hidden"));
  submitBtn.addEventListener("click", async () => {
    const title = document.getElementById("eventTitle").value.trim();
    const description = document
      .getElementById("eventDescription")
      .value.trim();
    const date = document.getElementById("eventDate").value;
    const location = document.getElementById("eventLocation").value.trim();
    if (!title || !date) {
      showNotification("T\u00edtulo y fecha son requeridos", "error");
      return;
    }
    try {
      await apiCall("/events", {
        method: "POST",
        body: JSON.stringify({ title, description, date, location }),
      });
      showNotification("\u00a1Evento creado!", "success");
      form.classList.add("hidden");
      document.getElementById("eventTitle").value = "";
      document.getElementById("eventDescription").value = "";
      document.getElementById("eventDate").value = "";
      document.getElementById("eventLocation").value = "";
      loadEvents();
    } catch (e) {
      showNotification(e.message, "error");
    }
  });
}

async function loadEvents() {
  const list = document.getElementById("eventsList");
  if (!list) return;
  try {
    const events = await apiCall("/events", { method: "GET" });
    if (!events.length) {
      list.innerHTML =
        '<p style="color:#777;text-align:center">No hay eventos pr\u00f3ximos.</p>';
      return;
    }
    list.innerHTML = events
      .map((ev) => {
        const d = new Date(ev.date);
        const going = ev.rsvp
          ? ev.rsvp.filter((r) => r.status === "going").length
          : 0;
        return `<div class="event-card" data-event-id="${ev._id}">
            <div class="event-date-badge">${d.toLocaleDateString("es", { day: "2-digit", month: "short" })}</div>
            <div class="event-info">
                <strong>${escapeHtml(ev.title)}</strong>
                <p style="font-size:13px;color:#555">${d.toLocaleString("es", { hour: "2-digit", minute: "2-digit" })}${ev.location ? " \u00b7 " + escapeHtml(ev.location) : ""}</p>
                <p style="font-size:12px;color:#888">${going} asistir\u00e1n</p>
            </div>
            <div class="event-rsvp-btns">
                <button class="rsvp-btn" data-status="going" data-event-id="${ev._id}">✅ Asistir\u00e9</button>
                <button class="rsvp-btn" data-status="maybe" data-event-id="${ev._id}">🤔 Tal vez</button>
            </div>
        </div>`;
      })
      .join("");
    list.querySelectorAll(".rsvp-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await apiCall(`/events/${btn.dataset.eventId}/rsvp`, {
            method: "POST",
            body: JSON.stringify({ status: btn.dataset.status }),
          });
          showNotification("RSVP guardado", "success");
          loadEvents();
        } catch (e) {
          showNotification(e.message, "error");
        }
      });
    });
  } catch (e) {
    list.innerHTML = '<p style="color:#777">Error al cargar eventos.</p>';
  }
}

// ===== POSTS GUARDADOS =====

function initSavedPosts() {
  const openLink = document.getElementById("openSavedPostsLink");
  const modal = document.getElementById("savedPostsModal");
  const closeBtn = document.getElementById("closeSavedPostsBtn");
  if (!openLink || !modal) return;
  openLink.addEventListener("click", async (e) => {
    e.preventDefault();
    modal.classList.remove("hidden");
    const list = document.getElementById("savedPostsList");
    list.innerHTML = "Cargando...";
    try {
      const posts = await apiCall("/posts/saved", { method: "GET" });
      if (!posts.length) {
        list.innerHTML =
          '<p style="color:#777;text-align:center">No has guardado ning\u00fan post.</p>';
        return;
      }
      list.innerHTML = "";
      posts.forEach((post) => {
        const el = createPostElement(post, getTimeAgo(post.createdAt));
        list.appendChild(el);
      });
    } catch (e) {
      list.innerHTML = '<p style="color:#c00">Error al cargar guardados.</p>';
    }
  });
  closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });
}

import { contextBridge, ipcRenderer } from "electron";

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("ipcRenderer", withPrototype(ipcRenderer));

// `exposeInMainWorld` can't detect attributes and methods of `prototype`, manually patching it.
function withPrototype(obj: Record<string, any>) {
  const protos = Object.getPrototypeOf(obj);

  for (const [key, value] of Object.entries(protos)) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) continue;

    if (typeof value === "function") {
      // Some native APIs, like `NodeJS.EventEmitter['on']`, don't work in the Renderer process. Wrapping them into a function.
      obj[key] = function (...args: any) {
        return value.call(obj, ...args);
      };
    } else {
      obj[key] = value;
    }
  }
  return obj;
}

// --------- Preload scripts loading ---------
function domReady(
  condition: DocumentReadyState[] = ["complete", "interactive"],
) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true);
    } else {
      document.addEventListener("readystatechange", () => {
        if (condition.includes(document.readyState)) {
          resolve(true);
        }
      });
    }
  });
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find((e) => e === child)) {
      parent.appendChild(child);
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find((e) => e === child)) {
      parent.removeChild(child);
    }
  },
};

type Theme = "light" | "dark" | "system";

function useTheme() {
  const theme = (localStorage.getItem("vite-ui-theme") as Theme) || "system";
  const root = window.document.documentElement;

  root.classList.remove("light", "dark");

  if (theme === "system") {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";

    root.classList.add(systemTheme);
    return;
  }

  root.classList.add(theme);
}

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
  const className = "loaders-css__square-spin";
  const styleContent = `
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
:root {
  --background: 0 0% 100%;
  --primary: 221.2 83.2% 53.3%;
}
.dark {
  --background: 240 10% 3.9%;
  --primary: 217.2 91.2% 59.8%;
}
.${className} {
  animation-fill-mode: both;
  width: 80px;
  height: 80px;
  color: hsl(var(--primary));
  animation: spin 1s linear infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(var(--background));
  z-index: 9;
}
    `;
  const oStyle = document.createElement("style");
  const oDiv = document.createElement("div");

  oStyle.id = "app-loading-style";
  oStyle.innerHTML = styleContent;
  oDiv.className = "app-loading-wrap";
  oDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle);
      safeDOM.append(document.body, oDiv);
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle);
      safeDOM.remove(document.body, oDiv);
    },
  };
}

// ----------------------------------------------------------------------

// eslint-disable-next-line react-hooks/rules-of-hooks
const { appendLoading, removeLoading } = useLoading();
domReady().then(() => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useTheme();
  appendLoading();
});

window.onmessage = (ev) => {
  ev.data.payload === "removeLoading" && removeLoading();
};

setTimeout(removeLoading, 4999);

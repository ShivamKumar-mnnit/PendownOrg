// Interactive (line-by-line) code execution, backed by a WebSocket on the
// same server the batch /api/compile proxies to. Unlike runCode() in
// compiler.js, this keeps a process alive across multiple stdin writes so a
// program can pause at a read, take input typed live, and keep printing
// output — same shape as running it in a real terminal / VS Code.
//
// The browser connects to same-origin /ws/execute, which the Netlify
// redirect (netlify.toml) and the Vite dev proxy (vite.config.js) both
// forward to the real backend — same reasoning as the compile proxy: keeps
// the backend host out of the client bundle. The apiKey is the same token
// /api/compile uses (COMPILE_AUTH_TOKEN in compileHandler.js); browsers
// can't set a custom Authorization header on a WebSocket handshake, so the
// backend takes it as a query param on this endpoint instead.

const WS_AUTH_TOKEN = "anVzdGZrb2Zm";

function getWsUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/execute?apiKey=${WS_AUTH_TOKEN}`;
}

/**
 * @param {{
 *   language: string,
 *   code: string,
 *   onStdout: (data: string) => void,
 *   onStderr: (data: string) => void,
 *   onExit: (msg: { status?: string, exitCode?: number, executionTimeMs?: number }) => void,
 *   onError: (message: string) => void,
 * }} handlers
 */
export function createExecutionSession({ language, code, onStdout, onStderr, onExit, onError }) {
  const socket = new WebSocket(getWsUrl());
  let settled = false;

  function settle(msg) {
    if (settled) return;
    settled = true;
    onExit?.(msg);
  }

  socket.onopen = () => {
    socket.send(JSON.stringify({ type: "start", language, code }));
  };

  socket.onmessage = (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }

    switch (msg.type) {
      case "stdout":
        onStdout?.(msg.data ?? "");
        break;
      case "stderr":
        onStderr?.(msg.data ?? "");
        break;
      case "exit":
        settle({ status: msg.status, exitCode: msg.exitCode, executionTimeMs: msg.executionTimeMs });
        break;
      case "error":
        onError?.(msg.message || "Execution service reported an error.");
        settle({ status: "ERROR" });
        break;
      default:
        break;
    }
  };

  socket.onerror = () => {
    onError?.("Could not reach the execution service.");
  };

  socket.onclose = () => {
    settle({ status: "CLOSED" });
  };

  return {
    sendInput(line) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "stdin", data: `${line}\n` }));
      }
    },
    stop() {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "stop" }));
      }
      socket.close();
    },
  };
}

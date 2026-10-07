// Interactive (line-by-line) code execution, backed by a WebSocket on the
// same server the batch /api/compile proxies to. Unlike runCode() in
// compiler.js, this keeps a process alive across multiple stdin writes so a
// program can pause at a read, take input typed live, and keep printing
// output — same shape as running it in a real terminal / VS Code.
//
// Unlike the batch compile call, this connects straight to the backend
// instead of going through a same-origin proxy: Netlify's redirect/proxy
// feature doesn't forward the WebSocket upgrade handshake correctly to an
// external origin (confirmed — it returns 400 "Can Upgrade only to
// WebSocket" even though the backend itself accepts the exact same
// handshake directly). Cross-origin WebSocket connections aren't blocked by
// CORS the way fetch() is, so connecting directly is safe here. The apiKey
// is the same token /api/compile uses (COMPILE_AUTH_TOKEN in
// compileHandler.js); browsers can't set a custom Authorization header on a
// WebSocket handshake, so the backend takes it as a query param instead.

const WS_HOST = "api.anobyt.in";
const WS_AUTH_TOKEN = "anVzdGZrb2Zm";

function getWsUrl() {
  return `wss://${WS_HOST}/ws/execute?apiKey=${WS_AUTH_TOKEN}`;
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

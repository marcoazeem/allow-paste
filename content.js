// Runs at document_start so our capture-phase listeners on window fire before
// any listener the page registers. stopImmediatePropagation() hides the event
// from the site's handlers, so they can't call preventDefault(); we never call
// it either, so the browser performs its normal paste.

const isPasteShortcut = (e) =>
  (e.ctrlKey || e.metaKey) && !e.altKey && e.key && e.key.toLowerCase() === "v";

const isShiftInsert = (e) => e.shiftKey && e.key === "Insert";

function allow(e) {
  e.stopImmediatePropagation();
}

// Drag/drop events.
for (const type of ["drop", "dragover", "dragenter"]) {
  window.addEventListener(type, allow, true);
}

function insertText(el, text) {
  // execCommand fires real input events, so frameworks (React etc.) notice.
  if (document.execCommand && document.execCommand("insertText", false, text)) {
    return;
  }
  if (typeof el.setRangeText === "function") {
    try {
      el.setRangeText(text, el.selectionStart, el.selectionEnd, "end");
    } catch (_) {
      el.value = (el.value || "") + text;
    }
  } else {
    el.value = (el.value || "") + text;
  }
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

// Paste: hide from the site, then insert the clipboard text ourselves.
window.addEventListener(
  "paste",
  (e) => {
    allow(e);
    const el = e.target;
    const editable =
      el &&
      (el.isContentEditable ||
        el.tagName === "TEXTAREA" ||
        el.tagName === "INPUT");
    const text = e.clipboardData && e.clipboardData.getData("text/plain");
    if (editable && text) {
      e.preventDefault();
      insertText(el, text);
    }
  },
  true
);

// Sites that block via keydown/keypress/keyup on Ctrl/Cmd+V.
for (const type of ["keydown", "keypress", "keyup"]) {
  window.addEventListener(
    type,
    (e) => {
      if (isPasteShortcut(e) || isShiftInsert(e)) allow(e);
    },
    true
  );
}

// Sites that block via beforeinput (inputType "insertFromPaste"/"insertFromDrop").
window.addEventListener(
  "beforeinput",
  (e) => {
    if (e.inputType === "insertFromPaste" || e.inputType === "insertFromDrop") {
      allow(e);
    }
  },
  true
);

// Remove inline handlers like <input onpaste="return false"> as a backup.
function clean(root) {
  const els = root.querySelectorAll
    ? root.querySelectorAll("[onpaste],[ondrop],[onbeforepaste]")
    : [];
  for (const el of els) {
    el.removeAttribute("onpaste");
    el.removeAttribute("ondrop");
    el.removeAttribute("onbeforepaste");
  }
}

new MutationObserver((muts) => {
  for (const m of muts) {
    for (const n of m.addedNodes) if (n.nodeType === 1) clean(n);
  }
}).observe(document, { childList: true, subtree: true });

document.addEventListener("DOMContentLoaded", () => clean(document));

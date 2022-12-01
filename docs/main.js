(function () {
  const API_ENDPOINT = "https://mame.dev.ruby-lang.org/typeprof-playground/";

  const $btnAnalyze = document.getElementById("btn-analyze");
  const $btnReportBug = document.getElementById("btn-report-bug");
  const $minibuffer = document.getElementById("minibuffer");

  const $codeRb = CodeMirror.fromTextArea(document.getElementById("code-rb"), {
    lineNumbers: true,
    mode: "text/x-ruby"
  });
  const $codeRbs = CodeMirror.fromTextArea(document.getElementById("code-rbs"), {
    lineNumbers: true,
    mode: "text/x-ruby"
  });
  const $typeprofOutput = CodeMirror.fromTextArea(document.getElementById("typeprof-output"), {
    mode: "text/x-ruby",
    readOnly: true
  });

  function onLoad() {
    const fragment = window.location.hash;
    if (fragment.length <= 1) {
      return;
    }
    const encodedState = fragment.substring(1);
    const {rb, rbs} = decodeState(encodedState);
    $codeRb.getDoc().setValue(rb);
    $codeRbs.getDoc().setValue(rbs);
    onAnalyzeClick();
  }

  function onCodeInput() {
    const rb = $codeRb.getDoc().getValue();
    const rbs = $codeRbs.getDoc().getValue();
    window.location.hash = encodeState(rb, rbs);
  }

  function encodeState(rb, rbs) {
    const params = new URLSearchParams();
    params.append("rb", rb);
    params.append("rbs", rbs);
    return params.toString();
  }

  function decodeState(encoded) {
    const params = new URLSearchParams(encoded);
    const rb = params.get("rb") || "";
    const rbs = params.get("rbs") || "";
    return { rb, rbs };
  }

  function onAnalyzeClick() {
    const rb = $codeRb.getDoc().getValue();
    const rbs = $codeRbs.getDoc().getValue();
    const option = {};
    $minibuffer.value = `analyzing...`;
    requestAnalyze(rb, rbs, option)
      .then((result) => {
        if (result["status"] == "ok") {
          $typeprofOutput.getDoc().setValue(result["output"]);
          $minibuffer.value = "";
        }
        else {
          $minibuffer.value = `failed to analyze: ${result["message"]}`;
        }
      })
      .catch((e) => {
        $minibuffer.value = `failed to analyze: ${e}`;
      });
  }

  function onReportBugClick() {
    const rb = $codeRb.getDoc().getValue();
    const rbs = $codeRbs.getDoc().getValue();
    const out = $typeprofOutput.getDoc().getValue();
    const title = "(your title)"
    const text = ["## Issue", "\n(your comment)\n",
                  "## ruby", "```ruby", rb, "```",
                  "## rbs",  "```ruby", rbs, "```",
                  "## output", "```",   out, "```"].join("\n")

    const params = new URLSearchParams();
    params.append("title", title);
    params.append("body", text);
    window.open("https://github.com/mame/typeprof-playground/issues/new?" + params.toString());
  }

  async function requestAnalyze(rb, rbs, option) {
    const res = await fetch(API_ENDPOINT + "/analyze", {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rb, rbs, option })
    });
    if (!res.ok) {
      throw new Error(res.statusText);
    }
    const body = await res.json();
    return body;
  }

  $btnAnalyze.addEventListener("click", onAnalyzeClick, false);
  $btnReportBug.addEventListener("click", onReportBugClick, false);
  $codeRb.on("change", onCodeInput);
  $codeRbs.on("change", onCodeInput);
  onLoad();
})();

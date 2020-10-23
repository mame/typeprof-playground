(function () {
  const API_ENDPOINT = "";

  const $btnAnalyze = document.getElementById("btn-analyze");
  const $btnReportBug = document.getElementById("btn-report-bug");
  const $codeRb = document.getElementById("code-rb");
  const $codeRbs = document.getElementById("code-rbs");
  const $typeprofOutput = document.getElementById("typeprof-output");
  const $minibuffer = document.getElementById("minibuffer");

  function onLoad() {
    const fragment = window.location.hash;
    if (fragment.length <= 1) {
      return;
    }
    const encodedState = fragment.substring(1);
    const {rb, rbs} = decodeState(encodedState);
    $codeRb.value = rb;
    $codeRbs.value = rbs;
  }

  function onCodeInput() {
    const rb = $codeRb.value;
    const rbs = $codeRbs.value;
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
    const rb = $codeRb.value;
    const rbs = $codeRbs.value;
    const option = {};
    $minibuffer.value = `analyzing...`;
    requestAnalyze(rb, rbs, option)
      .then((result) => {
        $typeprofOutput.value = result["out"];
        $minibuffer.value = "";
      })
      .catch((e) => {
        $minibuffer.value = `failed to analyze: ${e}`;
      });
  }

  function onReportBugClick() {
    const rb = $codeRb.value;
    const rbs = $codeRbs.value;
    const out = $typeprofOutput.value;
    const option = {};
    const comment = window.prompt("Problem details (optional):");
    if (comment === null) {
      return;
    }
    requestReportBug(rb, rbs, option, out, comment)
      .then((result) => {
        $minibuffer.value = "reported the bug successfully";
      })
      .catch((e) => {
        $minibuffer.value = `failed to report the bug: ${e}`;
      });
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

  async function requestReportBug(rb, rbs, option, out, comment) {
    const res = await fetch(API_ENDPOINT + "/report", {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rb, rbs, option, out, comment })
    });
    if (!res.ok) {
      throw new Error(res.statusText);
    }
    const body = await res.json();
    return body;
  }

  $btnAnalyze.addEventListener("click", onAnalyzeClick, false);
  $btnReportBug.addEventListener("click", onReportBugClick, false);
  $codeRb.addEventListener("input", onCodeInput, false);
  $codeRbs.addEventListener("input", onCodeInput, false);
  onLoad();
})();

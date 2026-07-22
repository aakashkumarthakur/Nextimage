(function () {
  "use strict";

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Navbar toggle ---------- */
  var navToggle = document.getElementById("navToggle");
  var navMenu = document.getElementById("navMenu");
  navToggle.addEventListener("click", function () {
    navToggle.classList.toggle("active");
    navMenu.classList.toggle("open");
  });
  Array.prototype.forEach.call(navMenu.querySelectorAll("a"), function (a) {
    a.addEventListener("click", function () {
      navToggle.classList.remove("active");
      navMenu.classList.remove("open");
    });
  });

  /* ---------- FAQ accordion ---------- */
  Array.prototype.forEach.call(document.querySelectorAll(".faq-item"), function (item) {
    item.querySelector(".faq-q").addEventListener("click", function () {
      var isOpen = item.classList.contains("open");
      Array.prototype.forEach.call(document.querySelectorAll(".faq-item"), function (i) {
        i.classList.remove("open");
      });
      if (!isOpen) {
        item.classList.add("open");
      }
    });
  });

  /* ---------- Toast ---------- */
  var toastEl = document.getElementById("toast");
  var toastTimer;
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("show");
    }, 2600);
  }

  /* ---------- Image Converter ---------- */
  var dropZone = document.getElementById("dropZone");
  var fileInput = document.getElementById("fileInput");
  var imageList = document.getElementById("imageList");
  var toolbar = document.getElementById("toolbar");
  var fileCountEl = document.getElementById("fileCount");
  var clearAllBtn = document.getElementById("clearAllBtn");

  var store = {};
  var counter = 0;

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  dropZone.addEventListener("click", function () {
    fileInput.click();
  });
  dropZone.addEventListener("dragover", function (e) {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });
  dropZone.addEventListener("dragleave", function () {
    dropZone.classList.remove("dragover");
  });
  dropZone.addEventListener("drop", function (e) {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    handleFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener("change", function (e) {
    handleFiles(e.target.files);
    fileInput.value = "";
  });

  function handleFiles(fileList) {
    var files = Array.prototype.filter.call(fileList, function (f) {
      return f.type.indexOf("image/") === 0;
    });
    if (!files.length) {
      showToast("Please select valid image files.");
      return;
    }
    files.forEach(addImage);
  }

  function addImage(file) {
    var id = "img_" + ++counter;
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        store[id] = {
          file: file,
          img: img,
          origW: img.naturalWidth,
          origH: img.naturalHeight,
          dataUrl: e.target.result,
          resultUrl: null,
        };
        renderCard(id);
        updateToolbar();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function updateToolbar() {
    var count = Object.keys(store).length;
    fileCountEl.textContent = count;
    toolbar.classList.toggle("visually-hidden", count === 0);
  }

  function extFromFormat(fmt) {
    return fmt === "jpeg" ? "jpg" : fmt;
  }

  function renderCard(id) {
    var data = store[id];
    var card = document.createElement("div");
    card.className = "image-card";
    card.id = id;

    var baseName = data.file.name.replace(/\.[^.]+$/, "");

    card.innerHTML =
      "<div class='thumb'><img src='" + data.dataUrl + "' alt='" + data.file.name + "'/></div>" +
      "<div class='meta'>" +
      "<h4>" + data.file.name + "</h4>" +
      "<p>" + data.origW + "&#215;" + data.origH + " &#8226; " + formatBytes(data.file.size) + "</p>" +
      "<div class='card-controls'>" +
      "<select class='fmt-select'>" +
      "<option value='png'>PNG</option>" +
      "<option value='jpeg'>JPG</option>" +
      "<option value='webp'>WebP</option>" +
      "</select>" +
      "<div class='dim-group'>" +
      "<input class='w-input' placeholder='Width' type='number' min='1'/>" +
      "<span>&#215;</span>" +
      "<input class='h-input' placeholder='Height' type='number' min='1'/>" +
      "</div>" +
      "<label class='chk'><input checked class='ratio-chk' type='checkbox'/> Keep ratio</label>" +
      "<input class='quality-range' max='100' min='10' step='5' style='width:90px' type='range' value='90'/>" +
      "</div>" +
      "<p class='result-info' style='display:none'></p>" +
      "</div>" +
      "<div class='card-actions'>" +
      "<button class='icon-btn remove-btn' title='Remove'><i class='ri-close-line'></i></button>" +
      "<button class='btn btn-primary btn-sm convert-btn'><i class='ri-loop-right-line'></i> Convert</button>" +
      "<a class='btn btn-download btn-sm download-link' disabled><i class='ri-download-2-line'></i> Download</a>" +
      "</div>";

    imageList.appendChild(card);

    var wInput = card.querySelector(".w-input");
    var hInput = card.querySelector(".h-input");
    var ratioChk = card.querySelector(".ratio-chk");

    wInput.addEventListener("input", function () {
      if (ratioChk.checked && wInput.value) {
        hInput.value = Math.round(data.origH * (wInput.value / data.origW));
      }
    });
    hInput.addEventListener("input", function () {
      if (ratioChk.checked && hInput.value) {
        wInput.value = Math.round(data.origW * (hInput.value / data.origH));
      }
    });

    card.querySelector(".remove-btn").addEventListener("click", function () {
      if (data.resultUrl) URL.revokeObjectURL(data.resultUrl);
      delete store[id];
      card.parentNode.removeChild(card);
      updateToolbar();
    });

    card.querySelector(".convert-btn").addEventListener("click", function () {
      var fmt = card.querySelector(".fmt-select").value;
      var quality = parseInt(card.querySelector(".quality-range").value, 10) / 100;
      var targetW = parseInt(wInput.value, 10) || data.origW;
      var targetH = parseInt(hInput.value, 10) || data.origH;

      var canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      var ctx = canvas.getContext("2d");
      if (fmt === "jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, targetW, targetH);
      }
      ctx.drawImage(data.img, 0, 0, targetW, targetH);

      var mime = "image/" + fmt;
      canvas.toBlob(
        function (blob) {
          if (!blob) {
            showToast("Conversion failed. Try a different format.");
            return;
          }
          if (data.resultUrl) URL.revokeObjectURL(data.resultUrl);
          data.resultUrl = URL.createObjectURL(blob);

          var link = card.querySelector(".download-link");
          link.href = data.resultUrl;
          link.setAttribute("download", baseName + "." + extFromFormat(fmt));
          link.removeAttribute("disabled");

          var info = card.querySelector(".result-info");
          info.style.display = "block";
          info.textContent =
            "Converted to " + fmt.toUpperCase() + " \u2014 " + targetW + "\u00d7" + targetH + " \u2014 " + formatBytes(blob.size);

          showToast("Image converted successfully.");
        },
        mime,
        quality
      );
    });
  }

  clearAllBtn.addEventListener("click", function () {
    Object.keys(store).forEach(function (id) {
      if (store[id].resultUrl) URL.revokeObjectURL(store[id].resultUrl);
    });
    store = {};
    imageList.innerHTML = "";
    updateToolbar();
  });
})();

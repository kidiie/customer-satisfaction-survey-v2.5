/* =========================================================
   MRRHL SURVEY — js/admin.js
   Handles: Firebase Authentication (login/logout), loading
   responses from Firestore, computing statistics, rendering
   the chart and table. Exposes window.MRRHL_RESPONSES for
   export.js to use.
   ========================================================= */

(function () {
  "use strict";

  const loginShell = document.getElementById("loginShell");
  const adminShell = document.getElementById("adminShell");
  const loginForm = document.getElementById("loginForm");
  const loginBtn = document.getElementById("loginBtn");
  const loginBtnLabel = document.getElementById("loginBtnLabel");
  const loginError = document.getElementById("loginError");
  const logoutBtn = document.getElementById("logoutBtn");

  let ratingsChart = null;

  /* ---------------- Auth ---------------- */

  function setLoginLoading(isLoading) {
    loginBtn.disabled = isLoading;
    loginBtn.classList.toggle("is-loading", isLoading);
    loginBtnLabel.textContent = isLoading ? "Logging in..." : "Log In";
  }

  function showLoginError(message) {
    loginError.textContent = message;
    loginError.classList.add("visible");
  }

  function hideLoginError() {
    loginError.classList.remove("visible");
  }

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    hideLoginError();
    setLoginLoading(true);

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    auth.signInWithEmailAndPassword(email, password)
      .catch(function (error) {
        setLoginLoading(false);
        showLoginError(friendlyAuthError(error));
      });
  });

  logoutBtn.addEventListener("click", function () {
    auth.signOut();
  });

  function friendlyAuthError(error) {
    switch (error.code) {
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Incorrect email or password. Please try again.";
      case "auth/too-many-requests":
        return "Too many attempts. Please wait a moment and try again.";
      default:
        return "Could not log in. Please check your connection and try again.";
    }
  }

  auth.onAuthStateChanged(function (user) {
    setLoginLoading(false);
    if (user) {
      loginShell.style.display = "none";
      adminShell.style.display = "block";
      loadResponses();
    } else {
      adminShell.style.display = "none";
      loginShell.style.display = "flex";
    }
  });

  /* ---------------- Data loading ---------------- */

  function loadResponses() {
    document.getElementById("tableLoadingState").style.display = "block";
    document.getElementById("tableEmptyState").style.display = "none";
    document.getElementById("tableScroll").style.display = "none";

    db.collection(RESPONSES_COLLECTION)
      .orderBy("submittedAt", "desc")
      .get()
      .then(function (snapshot) {
        const responses = [];
        snapshot.forEach(function (doc) {
          responses.push(Object.assign({ id: doc.id }, doc.data()));
        });

        window.MRRHL_RESPONSES = responses; // used by export.js

        try { renderStats(responses); } catch (e) { console.error("renderStats failed:", e); }
        try { renderChart(responses); } catch (e) { console.error("renderChart failed:", e); }
        try { renderTable(responses); } catch (e) { console.error("renderTable failed:", e); }
      })
      .catch(function (error) {
        console.error("Error loading responses:", error);
        document.getElementById("tableLoadingState").style.display = "none";
        document.getElementById("tableEmptyState").style.display = "block";
        document.querySelector("#tableEmptyState h3").textContent = "Could not load responses";
        document.querySelector("#tableEmptyState p").textContent =
          "Please check your connection and Firestore permissions, then reload the page.";
      });
  }

  /* ---------------- Stats ---------------- */

  function renderStats(responses) {
    const total = responses.length;
    const statTotal = document.getElementById("statTotal");
    const statAverage = document.getElementById("statAverage");
    const statAverageSub = document.getElementById("statAverageSub");
    const statThisWeek = document.getElementById("statThisWeek");
    const statSatisfaction = document.getElementById("statSatisfaction");

    statTotal.textContent = total;
    statTotal.classList.add("animate");

    if (total === 0) {
      statAverage.textContent = "—";
      statAverageSub.textContent = "";
      statThisWeek.textContent = "0";
      statSatisfaction.textContent = "—";
      return;
    }

    const overallValues = responses
      .map(function (r) { return r.averageRating; })
      .filter(function (v) { return typeof v === "number" && !isNaN(v); });

    const avg = overallValues.reduce(function (a, b) { return a + b; }, 0) / overallValues.length;
    statAverage.textContent = avg.toFixed(2) + " / 5";
    statAverage.classList.add("animate");
    statAverageSub.textContent = avg >= 4 ? "Excellent overall" : avg >= 3 ? "Good overall" : "Needs attention";

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekCount = responses.filter(function (r) {
      const ts = r.submittedAt && r.submittedAt.toDate ? r.submittedAt.toDate().getTime() : 0;
      return ts >= oneWeekAgo;
    }).length;
    statThisWeek.textContent = weekCount;
    statThisWeek.classList.add("animate");

    const satisfied = overallValues.filter(function (v) { return v >= 4; }).length;
    const rate = Math.round((satisfied / overallValues.length) * 100);
    statSatisfaction.textContent = rate + "%";
    statSatisfaction.classList.add("animate");
  }

  /* ---------------- Chart ---------------- */

  function renderChart(responses) {
    if (typeof Chart === "undefined") {
      console.warn("Chart.js did not load (likely blocked by network/ad-blocker) — skipping the ratings chart. Stats and table will still work.");
      const chartWrap = document.querySelector(".chart-wrap");
      if (chartWrap) chartWrap.innerHTML = '<p style="text-align:center;color:#4A6360;padding:24px;">Chart could not load. This does not affect your saved data — please check your internet connection or ad-blocker and reload.</p>';
      return;
    }

    const categories = [
      { key: "staffAvailability", label: "Availability" },
      { key: "staffGreeting", label: "Greeting" },
      { key: "staffFriendliness", label: "Friendliness" },
      { key: "staffAnsweredQuestions", label: "Answered Qs" },
      { key: "staffKnowledge", label: "Knowledge" },
      { key: "overall", label: "Overall" }
    ];

    const averages = categories.map(function (cat) {
      const values = responses
        .map(function (r) { return r.ratings && r.ratings[cat.key]; })
        .filter(function (v) { return typeof v === "number"; });
      if (values.length === 0) return 0;
      return Math.round((values.reduce(function (a, b) { return a + b; }, 0) / values.length) * 100) / 100;
    });

    const ctx = document.getElementById("ratingsChart").getContext("2d");

    if (ratingsChart) ratingsChart.destroy();

    ratingsChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: categories.map(function (c) { return c.label; }),
        datasets: [{
          label: "Average Rating (out of 5)",
          data: averages,
          backgroundColor: "#1B6B70",
          borderRadius: 8,
          maxBarThickness: 46
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 700, easing: "easeOutQuart" },
        scales: {
          y: {
            beginAtZero: true,
            max: 5,
            grid: { color: "#EAF3F1" },
            ticks: { color: "#4A6360" }
          },
          x: {
            grid: { display: false },
            ticks: { color: "#4A6360" }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#0F3D3E",
            padding: 10,
            cornerRadius: 8
          }
        }
      }
    });
  }

  /* ---------------- Table ---------------- */

  function ratingBadge(value) {
    if (typeof value !== "number") return "—";
    let cls = "";
    if (value <= 2) cls = "low";
    else if (value >= 4) cls = "high";
    return '<span class="badge-rating ' + cls + '">' + value + "★</span>";
  }

  function formatDate(timestamp) {
    if (!timestamp || !timestamp.toDate) return "—";
    const d = timestamp.toDate();
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) +
      " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  function escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderTable(responses) {
    document.getElementById("tableLoadingState").style.display = "none";

    if (responses.length === 0) {
      document.getElementById("tableEmptyState").style.display = "block";
      document.getElementById("tableScroll").style.display = "none";
      return;
    }

    document.getElementById("tableEmptyState").style.display = "none";
    const tableScroll = document.getElementById("tableScroll");
    tableScroll.style.display = "block";

    const tbody = document.getElementById("responsesTableBody");
    tbody.innerHTML = responses.map(function (r) {
      const ratings = r.ratings || {};
      const contactParts = [r.interviewerName, r.contactPhone, r.contactEmail].filter(Boolean);
      const contact = contactParts.length ? escapeHtml(contactParts.join(" · ")) : "—";
      const liked = r.bestLiked ? escapeHtml(r.bestLiked) : "—";
      const improve = r.improvementSuggestion ? escapeHtml(r.improvementSuggestion) : "—";

      let turnaroundCell = "—";
      if (r.turnaroundSatisfied) {
        const isNo = r.turnaroundSatisfied.indexOf("No") === 0;
        const cls = isNo ? "low" : "high";
        turnaroundCell = '<span class="badge-rating ' + cls + '">' + escapeHtml(r.turnaroundSatisfied) + "</span>";
        if (isNo && r.turnaroundSpecify) {
          turnaroundCell += "<br><span style='font-size:11px;color:#4A6360;'>" + escapeHtml(r.turnaroundSpecify) + "</span>";
        }
      }

      return "<tr>" +
        "<td>" + formatDate(r.submittedAt) + "</td>" +
        "<td>" + ratingBadge(ratings.staffAvailability) + "</td>" +
        "<td>" + ratingBadge(ratings.staffGreeting) + "</td>" +
        "<td>" + ratingBadge(ratings.staffFriendliness) + "</td>" +
        "<td>" + ratingBadge(ratings.staffAnsweredQuestions) + "</td>" +
        "<td>" + ratingBadge(ratings.staffKnowledge) + "</td>" +
        "<td>" + ratingBadge(ratings.overall) + "</td>" +
        "<td><strong>" + (r.averageRating != null ? r.averageRating.toFixed(2) : "—") + "</strong></td>" +
        "<td>" + turnaroundCell + "</td>" +
        "<td style='max-width:180px;'>" + liked + "</td>" +
        "<td style='max-width:180px;'>" + improve + "</td>" +
        "<td>" + contact + "</td>" +
        "</tr>";
    }).join("");
  }
})();

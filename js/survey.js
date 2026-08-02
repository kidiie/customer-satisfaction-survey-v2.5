/* =========================================================
   MRRHL SURVEY — js/survey.js
   Matches the official "Customer Satisfaction Survey Form"
   (Document No. MRRHL/F/020, Version 4).
   Handles: rating selection UX, form validation, submitting the
   response to Firestore, and the loading / success experience.
   Depends on firebase-config.js being loaded first (defines
   `db` and `RESPONSES_COLLECTION`).
   ========================================================= */

(function () {
  "use strict";

  const form = document.getElementById("surveyForm");
  const formWrap = document.getElementById("formWrap");
  const successScreen = document.getElementById("successScreen");
  const submitBtn = document.getElementById("submitBtn");
  const submitBtnLabel = document.getElementById("submitBtnLabel");
  const turnaroundSpecifyWrap = document.getElementById("turnaroundSpecifyWrap");
  const progressShell = document.getElementById("progressShell");
  const progressFill = document.getElementById("progressFill");
  const progressLabel = document.getElementById("progressLabel");
  const progressCount = document.getElementById("progressCount");
  const heartToast = document.getElementById("heartToast");

  // The six rated questions + turnaround yes/no are required.
  const REQUIRED_GROUPS = [
    "q1_availability",
    "q2_greeting",
    "q3_friendliness",
    "q4_answered_questions",
    "q5_knowledge",
    "q6_overall",
    "turnaround_satisfied"
  ];

  /* ---------------- Progress bar ---------------- */
  // Warm, encouraging notes shown as the form fills up — English & Kiswahili.
  // Milestone messages are shown once each, in order, so they never repeat
  // or feel spammy while someone is answering.
  const MILESTONE_MESSAGES = [
    { at: 1, text: "Thank you for starting! Every answer helps a patient after you. / Asante kwa kuanza! Kila jibu husaidia mgonjwa mwingine." },
    { at: 3, text: "You're doing great — almost halfway. / Unaendelea vizuri — karibu nusu." },
    { at: 5, text: "Almost there, asante sana for your honesty. / Karibu kumaliza, asante sana kwa uaminifu wako." },
    { at: 7, text: "All done! Your voice truly matters to us. / Umemaliza! Sauti yako ina maana kubwa kwetu." }
  ];
  let shownMilestones = new Set();
  let toastTimer = null;

  function showHeartToast(message) {
    if (!heartToast) return;
    clearTimeout(toastTimer);
    heartToast.textContent = message;
    heartToast.classList.add("visible");
    toastTimer = setTimeout(function () {
      heartToast.classList.remove("visible");
    }, 3200);
  }

  function updateProgress() {
    if (!progressFill) return;
    const answeredCount = REQUIRED_GROUPS.filter(function (name) {
      return !!getRadioValue(name);
    }).length;
    const total = REQUIRED_GROUPS.length;
    const percent = Math.round((answeredCount / total) * 100);

    progressFill.style.width = percent + "%";
    progressLabel.textContent = percent + "% complete";
    progressCount.textContent = answeredCount + " of " + total + " answered";
    progressShell.classList.toggle("is-complete", answeredCount === total);

    const milestone = MILESTONE_MESSAGES.find(function (m) {
      return m.at === answeredCount && !shownMilestones.has(m.at);
    });
    if (milestone) {
      shownMilestones.add(milestone.at);
      showHeartToast(milestone.text);
    }
  }

  /* ---------------- Button ripple effect ---------------- */
  submitBtn.addEventListener("click", function (e) {
    const rect = submitBtn.getBoundingClientRect();
    submitBtn.style.setProperty("--rx", (e.clientX - rect.left) + "px");
    submitBtn.style.setProperty("--ry", (e.clientY - rect.top) + "px");
    submitBtn.classList.remove("rippling");
    void submitBtn.offsetWidth; // restart animation
    submitBtn.classList.add("rippling");
  });

  /* ---------------- Show/hide "if No, specify" field ---------------- */
  document.querySelectorAll('input[name="turnaround_satisfied"]').forEach(function (input) {
    input.addEventListener("change", function () {
      const isNo = input.value.indexOf("No") === 0 && input.checked;
      turnaroundSpecifyWrap.style.display = isNo ? "block" : "none";
    });
  });

  /* ---------------- Helpers ---------------- */
  function showError(groupName) {
    const el = document.querySelector('[data-error-for="' + groupName + '"]');
    if (el) el.classList.add("visible");
  }

  function clearError(groupName) {
    const el = document.querySelector('[data-error-for="' + groupName + '"]');
    if (el) el.classList.remove("visible");
  }

  function scrollToFirstError() {
    const firstVisible = document.querySelector(".error-msg.visible");
    if (firstVisible) {
      const card = firstVisible.closest(".card") || firstVisible;
      card.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  REQUIRED_GROUPS.forEach(function (groupName) {
    document.querySelectorAll('input[name="' + groupName + '"]').forEach(function (input) {
      input.addEventListener("change", function () {
        clearError(groupName);
        updateProgress();
      });
    });
  });

  // Set the initial 0% state on page load.
  updateProgress();

  // A little extra warmth on the "Overall" question — celebrate a 5,
  // and respond with care (not defensiveness) to a 1.
  document.querySelectorAll('input[name="q6_overall"]').forEach(function (input) {
    input.addEventListener("change", function () {
      if (input.value === "5") {
        showHeartToast("That means so much to us — asante sana! 💚");
      } else if (input.value === "1") {
        showHeartToast("We're sorry we fell short. Please tell us more below so we can do better. / Samahani, tafadhali tuambie zaidi.");
      }
    });
  });

  const emailInput = document.getElementById("contactEmail");
  emailInput.addEventListener("input", function () {
    emailInput.classList.remove("field-error");
    clearError("contactEmail");
  });

  function isValidEmail(value) {
    if (!value) return true; // optional field
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function getRadioValue(name) {
    const checked = document.querySelector('input[name="' + name + '"]:checked');
    return checked ? checked.value : null;
  }

  /* ---------------- Validation ---------------- */
  function validateForm() {
    let isValid = true;

    REQUIRED_GROUPS.forEach(function (groupName) {
      const value = getRadioValue(groupName);
      if (!value) {
        showError(groupName);
        isValid = false;
      } else {
        clearError(groupName);
      }
    });

    const emailValue = emailInput.value.trim();
    if (!isValidEmail(emailValue)) {
      emailInput.classList.add("field-error");
      showError("contactEmail");
      isValid = false;
    } else {
      emailInput.classList.remove("field-error");
      clearError("contactEmail");
    }

    return isValid;
  }

  /* ---------------- Submission ---------------- */
  function setButtonLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.classList.toggle("is-loading", isLoading);
    submitBtnLabel.textContent = isLoading ? "Saving your feedback..." : "Submit Feedback";
  }

  function buildPayload() {
    const ratings = {
      staffAvailability: Number(getRadioValue("q1_availability")),
      staffGreeting: Number(getRadioValue("q2_greeting")),
      staffFriendliness: Number(getRadioValue("q3_friendliness")),
      staffAnsweredQuestions: Number(getRadioValue("q4_answered_questions")),
      staffKnowledge: Number(getRadioValue("q5_knowledge")),
      overall: Number(getRadioValue("q6_overall"))
    };

    const values = Object.values(ratings);
    const averageRating = values.reduce(function (a, b) { return a + b; }, 0) / values.length;

    return {
      ratings: ratings,
      averageRating: Math.round(averageRating * 100) / 100,
      bestLiked: document.getElementById("bestLiked").value.trim(),
      improvementSuggestion: document.getElementById("improvementSuggestion").value.trim(),
      turnaroundSatisfied: getRadioValue("turnaround_satisfied"),
      turnaroundSpecify: document.getElementById("turnaroundSpecify").value.trim(),
      interviewerName: document.getElementById("interviewerName").value.trim(),
      contactPhone: document.getElementById("contactPhone").value.trim(),
      contactEmail: emailInput.value.trim(),
      submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
      source: "web-survey"
    };
  }

  function showSuccessScreen() {
    formWrap.classList.add("hidden");
    successScreen.classList.add("visible");
    if (progressShell) progressShell.style.display = "none";
    successScreen.scrollIntoView({ behavior: "smooth", block: "start" });
    launchConfetti();
  }

  // Gentle, healthcare-appropriate "celebration": a few soft dots
  // drifting up rather than a loud confetti burst.
  function launchConfetti() {
    const colors = ["#8FBFA8", "#1B6B70", "#EAF3F1"];
    const count = 14;
    for (let i = 0; i < count; i++) {
      const dot = document.createElement("div");
      dot.className = "floating-dot";
      const size = 6 + Math.random() * 8;
      dot.style.width = size + "px";
      dot.style.height = size + "px";
      dot.style.background = colors[i % colors.length];
      dot.style.left = (45 + Math.random() * 10) + "vw";
      dot.style.top = "40vh";
      document.body.appendChild(dot);

      const dx = (Math.random() - 0.5) * 220;
      const dy = -160 - Math.random() * 140;
      const duration = 900 + Math.random() * 700;

      dot.animate(
        [
          { transform: "translate(0, 0)", opacity: 0.9 },
          { transform: "translate(" + dx + "px, " + dy + "px)", opacity: 0 }
        ],
        { duration: duration, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }
      );

      setTimeout(function () { dot.remove(); }, duration + 50);
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!validateForm()) {
      scrollToFirstError();
      return;
    }

    setButtonLoading(true);

    const payload = buildPayload();

    db.collection(RESPONSES_COLLECTION)
      .add(payload)
      .then(function () {
        setButtonLoading(false);
        showSuccessScreen();
      })
      .catch(function (error) {
        console.error("Error saving survey response:", error);
        setButtonLoading(false);
        alert(
          "Sorry, we could not save your feedback. Please check your internet connection and try again.\n\n" +
          "Samahani, hatukuweza kuhifadhi maoni yako. Tafadhali angalia mtandao wako kisha ujaribu tena."
        );
      });
  });
})();

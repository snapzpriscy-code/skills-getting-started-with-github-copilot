document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      Array.from(activitySelect.options).slice(1).forEach((option) => option.remove());

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="activity-availability"><strong>Availability:</strong> <span>${spotsLeft} spots left</span></p>
          <div class="participants-section">
            <h5 class="participants-heading">Participants (${details.participants.length})</h5>
            <ul class="participants-list"></ul>
          </div>
        `;

        const participantList = activityCard.querySelector(".participants-list");
        const participantsHeading = activityCard.querySelector(".participants-heading");
        if (details.participants.length === 0) {
          const emptyItem = document.createElement("li");
          emptyItem.className = "participants-empty";
          emptyItem.textContent = "No participants yet";
          participantList.appendChild(emptyItem);
        } else {
          details.participants.forEach((email) => {
            const participantItem = document.createElement("li");
            participantItem.className = "participant-item";

            const participantEmail = document.createElement("span");
            participantEmail.className = "participant-email";
            participantEmail.textContent = email;

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "participant-remove";
            removeButton.setAttribute("aria-label", `Unregister ${email} from ${name}`);
            removeButton.title = "Unregister participant";
            removeButton.innerHTML = `
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="m19 6-1 14H6L5 6" />
                <path d="M10 11v5M14 11v5" />
              </svg>
            `;

            removeButton.addEventListener("click", async () => {
              removeButton.disabled = true;

              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`,
                  { method: "DELETE" }
                );
                const result = await response.json();

                if (!response.ok) {
                  throw new Error(result.detail || "Failed to unregister participant.");
                }

                details.participants = details.participants.filter((participant) => participant !== email);
                participantItem.remove();
                participantsHeading.textContent = `Participants (${details.participants.length})`;
                activityCard.querySelector(".activity-availability span").textContent =
                  `${details.max_participants - details.participants.length} spots left`;

                if (details.participants.length === 0) {
                  const emptyItem = document.createElement("li");
                  emptyItem.className = "participants-empty";
                  emptyItem.textContent = "No participants yet";
                  participantList.appendChild(emptyItem);
                }
              } catch (error) {
                removeButton.disabled = false;
                messageDiv.textContent = error.message || "Failed to unregister participant.";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
              }
            });

            participantItem.append(participantEmail, removeButton);
            participantList.appendChild(participantItem);
          });
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

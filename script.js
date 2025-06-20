const MISTRAL_API_KEY = "JyCYjsVmyd2uIO5x40SsaAgpFl5nb7mI";

async function correctTextWithMistral(text) {
  const payload = {
    model: "open-mixtral-8x7b",
    messages: [
      {
        role: "user",
        content: `Correct the grammar and spelling of the following text and return only the corrected text enclosed in double quotes, with no explanations, notes, or additional text:\n\n${text}`
      }
    ],
    temperature: 0.0,
    max_tokens: 256
  };

  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MISTRAL_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Mistral API Error (${res.status}):`, errorText);
    throw new Error(`Mistral API Error (${res.status})`);
  }

  const data = await res.json();
  const responseText = data.choices?.[0]?.message?.content?.trim() || text;
  const match = responseText.match(/"([^"]*)"/);
  return match ? match[1] : responseText.split(/[\(\[]?\s*(Note|Explanation|Corrected):/i)[0].trim();
}

async function correctTextWithLanguageTool(text) {
  const payload = {
    text: text,
    language: "en-US" // Adjust language as needed (e.g., en-GB)
  };

  const res = await fetch("https://api.languagetool.org/v2/check", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams(payload).toString()
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`LanguageTool API Error (${res.status}):`, errorText);
    throw new Error(`LanguageTool API Error (${res.status})`);
  }

  const data = await res.json();
  let correctedText = text;
  if (data.matches && data.matches.length > 0) {
    // Apply corrections in reverse order to avoid offset issues
    const matches = data.matches.sort((a, b) => b.offset - a.offset);
    matches.forEach(match => {
      const replacement = match.replacements[0]?.value || match.context.text;
      const start = match.offset;
      const length = match.length;
      correctedText = correctedText.substring(0, start) + replacement + correctedText.substring(start + length);
    });
  }
  return correctedText.trim();
}

async function handleSave() {
  const fields = document.querySelectorAll('textarea, input[type="text"]:not(#name):not(#email):not(#mobile):not(#linkdien):not(#github)');
  for (const field of fields) {
    const original = field.value.trim();
    if (original) {
      try {
        const corrected = field.tagName === 'TEXTAREA'
          ? await correctTextWithMistral(original)
          : await correctTextWithLanguageTool(original);
        field.value = corrected;
      } catch (e) {
        console.error('Correction failed for field:', field.className, e.message);
        if (e.message.includes('429')) {
          console.warn('LanguageTool rate limit reached. Consider upgrading to premium API or reducing requests.');
        }
      }
    }
  }
  updateResume();
}
function updateResume() {
  // Update personal details
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const mobile = document.getElementById("mobile").value;
  const linkedIn = document.getElementById("linkdien").value;
  const github = document.getElementById("github").value;

  document.getElementById("preview-name").innerText = name || "Your Name";
  document.getElementById("preview-name").style.textAlign = "center";

  document.getElementById("preview-email").innerHTML =
    "<strong>Email:</strong> <span style='font-size:12px;'>" + (email || "your@email.com") + "</span>";

  document.getElementById("preview-mobile").innerHTML =
    "<strong>Contact:</strong> <span style='font-size:12px;'>" + (mobile || "1234567890") + "</span>";

  document.getElementById("preview-linkdien").innerHTML =
    linkedIn
      ? '<a href="' + linkedIn + '" style="font-size:12px;">' + linkedIn + "</a>"
      : "";

  document.getElementById("preview-github").innerHTML =
    github
      ? '<a href="' + github + '" style="font-size:12px;">' + github + "</a>"
      : "";

  // Update education entries
  const eduList = document.getElementById("preview-education");
  eduList.innerHTML = "";
  document.querySelectorAll(".edu-entry").forEach((entry) => {
    const degree = entry.querySelector(".edu-degree").value;
    const stream = entry.querySelector(".edu-stream").value;
    const score = entry.querySelector(".edu-score").value;
    const year = entry.querySelector(".edu-year").value;
    if (degree || score || year) {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="edu-item">
          <div class="row-top">
            <span class="degree" style="font-weight:550;">${degree}</span>
            <span class="year" style="margin-right:8px">${year}</span>
          </div>
          <div class="row-bottom">
            <span class="stream">${stream}</span>
            <strong class="score" style="margin-right:8px">${score}</strong>
          </div>
        </div>
      `;
      eduList.appendChild(li);
    }
  });

  // Update skills categories
  const skillsList = document.getElementById("preview-skills");
  const skillsHeading = skillsList.previousElementSibling;
  skillsList.innerHTML = "";

  let hasSkills = false;

  document.querySelectorAll(".skill-category").forEach((cat) => {
    const catName = cat.querySelector(".skill-category-name").value;
    const skillInputs = cat.querySelectorAll(".skill-input");
    const skills = [];

    skillInputs.forEach((input) => {
      if (input.value.trim()) skills.push(input.value.trim());
    });

    if (skills.length > 0) {
      hasSkills = true;
      const li = document.createElement("li");
      li.innerHTML = catName
        ? `<span style="font-weight:550;">${catName}:</span> <span style="font-size:12px;">${skills.join(", ")}</span>`
        : `<span style="font-size:12px;">${skills.join(", ")}</span>`;
      skillsList.appendChild(li);
    }
  });

  if (hasSkills) {
    skillsHeading.style.display = "block";
    skillsList.style.display = "block";
  } else {
    skillsHeading.style.display = "none";
    skillsList.style.display = "none";
  }

  // Update experience list
  const expList = document.getElementById("preview-exp");
  expList.innerHTML = "";
  document.querySelectorAll(".exp-entry").forEach((entry) => {
    const title = entry.querySelector(".exp-title").value;
    const desc = entry.querySelector(".exp-desc").value;
    if (title || desc) {
      const li = document.createElement("li");
      li.innerHTML = (title ? `<span style='font-weight:600;'>${title}:</span> ` : "") +
        (desc ? `<div style="font-size:12px; margin-top: 2px;">${desc}</div>` : "");
      expList.appendChild(li);
    }
  });

  // Update project list
  const projectList = document.getElementById("preview-projects");
  const projectHeading = projectList.previousElementSibling;
  projectList.innerHTML = "";

  let hasProjects = false;

  document.querySelectorAll(".project-entry").forEach((entry) => {
    const title = entry.querySelector(".project-title").value;
    const desc = entry.querySelector(".project-desc").value;
    const link = entry.querySelector(".project-link").value;

    if (title || desc || link) {
      hasProjects = true;
      const li = document.createElement("li");
      li.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
          ${title ? `<span style="font-weight:600;">${title}:</span>` : ""}
          ${link ? `<a href="${link}" target="_blank" style="text-decoration: none; margin-right: 10px;">🔗Link</a>` : ""}
        </div>
        ${desc ? `<div style="font-size:12px; margin-top:2px;">${desc}</div>` : ""}
      `;
      projectList.appendChild(li);
    }
  });

  if (hasProjects) {
    projectHeading.style.display = "block";
    projectList.style.display = "block";
  } else {
    projectHeading.style.display = "none";
    projectList.style.display = "none";
  }

  // Update achievements list
  const achList = document.getElementById("preview-achievements");
  const achHeading = achList.previousElementSibling;
  achList.innerHTML = "";

  let hasAchievements = false;

  document.querySelectorAll(".achievment-input").forEach((input) => {
    if (input.value.trim()) {
      hasAchievements = true;
      const li = document.createElement("li");
      li.textContent = input.value.trim();
      achList.appendChild(li);
    }
  });

  if (hasAchievements) {
    achHeading.style.display = "block";
    achList.style.display = "block";
  } else {
    achHeading.style.display = "none";
    achList.style.display = "none";
  }
}

function addEducation() {
  const container = document.getElementById("education-container");
  const entry = document.createElement("div");
  entry.className = "edu-entry";
  entry.innerHTML =
    '<input type="text" class="edu-degree" placeholder="Degree (e.g. B.Tech in CSE)" oninput="updateResume()" />' +
    '<input type="text" class="edu-stream" placeholder="Board" oninput="updateResume()" />' +
    '<input type="text" class="edu-score" placeholder="Percentage / CGPA" oninput="updateResume()" />' +
    '<input type="number" class="edu-year" placeholder="Year" oninput="updateResume()" />';
  container.appendChild(entry);
  updateResume();
}

function addSkillCategory() {
  const container = document.getElementById("skills-container");
  const categoryDiv = document.createElement("div");
  categoryDiv.className = "skill-category";
  categoryDiv.innerHTML =
    '<input type="text" class="skill-category-name" placeholder="Category Name (e.g. Programming Languages)" oninput="updateResume()" />' +
    '<div class="skill-inputs">' +
    '<input type="text" class="skill-input" placeholder="Skill (e.g. Java)" oninput="updateResume()" />' +
    "</div>" +
    '<button type="button" onclick="addSkill(this)">+ Add Skill</button>';
  container.appendChild(categoryDiv);
  updateResume();
}

function addSkill(button) {
  const categoryDiv = button.parentElement;
  const skillInputsDiv = categoryDiv.querySelector(".skill-inputs");
  const input = document.createElement("input");
  input.type = "text";
  input.className = "skill-input";
  input.placeholder = "Skill";
  input.oninput = updateResume;
  skillInputsDiv.appendChild(input);
}

function addExperience() {
  const container = document.getElementById("Experience-container");
  const entry = document.createElement("div");
  entry.className = "exp-entry";
  entry.innerHTML =
    '<input type="text" class="exp-title" placeholder="Company Name" oninput="updateResume()"/>' +
    '<textarea class="exp-desc" placeholder="Description" oninput="updateResume()"></textarea>';
  container.appendChild(entry);
  updateResume();
}

function addProjects() {
  const container = document.getElementById("project-container");
  const entry = document.createElement("div");
  entry.className = "project-entry";
  entry.innerHTML =
    '<input type="text" class="project-title" placeholder="Project Title" oninput="updateResume()" />' +
    '<textarea class="project-desc" placeholder="Description" oninput="updateResume()"></textarea>' +
    '<input type="url" class="project-link" placeholder="Project Link (optional)" oninput="updateResume()" />';
  container.appendChild(entry);
  updateResume();
}

function addAchievment() {
  const container = document.getElementById("achievment-container");
  const input = document.createElement("input");
  input.type = "text";
  input.className = "achievment-input";
  input.placeholder = "Achievement";
  input.oninput = updateResume;
  container.appendChild(input);
  updateResume();
}

function handleDownload() {
  const resumeElem = document.querySelector(".resume-card");
  const opt = {
    margin: 0.5,
    filename: "resume.pdf",
    html2canvas: {
      scale: 2,
      scrollX: 0,
      scrollY: 0,
    },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
  };
  html2pdf().set(opt).from(resumeElem).save();
}
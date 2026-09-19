// Client-side certificate generator — draws a "Certificate of Completion"
// onto a canvas and hands back a PNG. No backend, no verification/IDs:
// this is AlgoMate's own completion certificate (like a participation
// certificate), not a claim of third-party accreditation. Admin generates
// it once a session has actually happened and shares it with the student
// manually (e.g. via WhatsApp), same pattern as everything else on the site.

function wrapCenteredText(ctx, text, x, y) {
  ctx.fillText(text, x, y);
}

export function generateCertificate({ name, domain, mentor, dateLabel }) {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 1131;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer border, brand gradient
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, "#4f46e5");
  grad.addColorStop(1, "#059669");
  ctx.strokeStyle = grad;
  ctx.lineWidth = 14;
  ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

  ctx.strokeStyle = "#e4e4e7";
  ctx.lineWidth = 2;
  ctx.strokeRect(56, 56, canvas.width - 112, canvas.height - 112);

  ctx.textAlign = "center";

  // Brand mark
  ctx.fillStyle = "#18181b";
  ctx.font = "bold 40px Georgia, serif";
  wrapCenteredText(ctx, "AlgoMate", canvas.width / 2, 165);

  ctx.fillStyle = "#71717a";
  ctx.font = "20px Arial, sans-serif";
  wrapCenteredText(ctx, "Mock Interviews & Mentorship", canvas.width / 2, 198);

  // Title
  ctx.fillStyle = "#18181b";
  ctx.font = "bold 56px Georgia, serif";
  wrapCenteredText(ctx, "Certificate of Completion", canvas.width / 2, 330);

  ctx.strokeStyle = grad;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 130, 360);
  ctx.lineTo(canvas.width / 2 + 130, 360);
  ctx.stroke();

  // "This certifies that"
  ctx.fillStyle = "#52525b";
  ctx.font = "26px Arial, sans-serif";
  wrapCenteredText(ctx, "This certifies that", canvas.width / 2, 440);

  // Name
  ctx.fillStyle = "#4338ca";
  ctx.font = "italic bold 64px Georgia, serif";
  wrapCenteredText(ctx, name || "Student Name", canvas.width / 2, 530);

  const nameWidth = ctx.measureText(name || "Student Name").width;
  ctx.strokeStyle = "#d4d4d8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - nameWidth / 2 - 24, 555);
  ctx.lineTo(canvas.width / 2 + nameWidth / 2 + 24, 555);
  ctx.stroke();

  // Body
  ctx.fillStyle = "#3f3f46";
  ctx.font = "26px Arial, sans-serif";
  wrapCenteredText(ctx, "has successfully completed a Mock Interview & Mentorship session", canvas.width / 2, 625);
  if (domain) {
    wrapCenteredText(ctx, `in the domain of ${domain}`, canvas.width / 2, 665);
  }
  if (mentor) {
    ctx.font = "22px Arial, sans-serif";
    ctx.fillStyle = "#71717a";
    wrapCenteredText(ctx, `Guided by mentor ${mentor}`, canvas.width / 2, 715);
  }

  // Footer
  const footerY = canvas.height - 150;
  ctx.textAlign = "left";
  ctx.fillStyle = "#3f3f46";
  ctx.font = "22px Arial, sans-serif";
  ctx.fillText(
    dateLabel || new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    150,
    footerY
  );
  ctx.fillStyle = "#a1a1aa";
  ctx.font = "16px Arial, sans-serif";
  ctx.fillText("Date", 150, footerY + 30);

  ctx.textAlign = "right";
  ctx.fillStyle = "#18181b";
  ctx.font = "italic 30px Georgia, serif";
  ctx.fillText("AlgoMate Team", canvas.width - 150, footerY);
  ctx.fillStyle = "#a1a1aa";
  ctx.font = "16px Arial, sans-serif";
  ctx.fillText("Issued by", canvas.width - 150, footerY + 30);

  return canvas.toDataURL("image/png");
}

export function downloadCertificate(dataUrl, filename) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

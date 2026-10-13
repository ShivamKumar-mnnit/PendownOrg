// Helpers shared by the course page and the lesson reader.

/** YouTube / Vimeo / Google Drive links become an embeddable player URL. */
export function embedUrl(url) {
  if (!url) return "";
  let m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}`;
  m = url.match(/vimeo\.com\/(\d+)/);
  if (m) return `https://player.vimeo.com/video/${m[1]}`;
  m = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  return "";
}

// Finished lessons are remembered per course in this browser.
const key = (courseId) => `anobyt_course_done:${courseId}`;
export function doneLessons(courseId) {
  try {
    return new Set(JSON.parse(localStorage.getItem(key(courseId)) || "[]"));
  } catch {
    return new Set();
  }
}
export function setLessonDone(courseId, lessonId, done) {
  const s = doneLessons(courseId);
  if (done) s.add(lessonId);
  else s.delete(lessonId);
  try {
    localStorage.setItem(key(courseId), JSON.stringify([...s]));
  } catch {
    /* storage blocked */
  }
  return s;
}

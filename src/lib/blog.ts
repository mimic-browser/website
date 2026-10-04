export function formatDate(date: Date, lang = "ru") {
  return new Intl.DateTimeFormat(lang, {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(date);
}

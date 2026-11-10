const dayMonthYear = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

/** Data por extenso e curta, no horário de Brasília: "10 de nov. de 2026". */
export function formatDate(iso: string) {
  return dayMonthYear.format(new Date(iso));
}

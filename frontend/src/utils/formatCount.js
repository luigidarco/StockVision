const numberFormatter = new Intl.NumberFormat("pt-BR");

export function formatCount(value, singular, plural) {
  return `${numberFormatter.format(value)} ${value === 1 ? singular : plural}`;
}

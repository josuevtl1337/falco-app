export const formatRatio = (ratio: number, decimals = 1) => {
  if (!Number.isFinite(ratio) || ratio <= 0) return "—";
  return `1:${ratio.toLocaleString("es-AR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: false, // sin separador de miles
  })}`;
};
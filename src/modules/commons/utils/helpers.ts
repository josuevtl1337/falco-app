const formatARS = (n: number) =>
  n.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });


  export { formatARS };
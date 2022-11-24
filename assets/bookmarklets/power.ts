{
  let n = parseInt(prompt("2^n", "8") ?? "8", 10);
  prompt(`2^${n} = `, Math.pow(2, n).toString(10));
}

{
  let n = parseInt(prompt("n", "0") ?? "0", 10);
  if (n > 0) {
    let result = n.toString(2);
    let { log2, ceil, pow } = Math;
    let digits = pow(2, ceil(log2(result.length)));
    prompt(`binary(${n}) = `, "0b" + result.padStart(digits, "0"));
  }
}
